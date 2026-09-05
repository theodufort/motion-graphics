#!/usr/bin/env node
// validate.mjs — headless visual validation of one motion graphic folder.
// CLI: node validate.mjs <folder> [--json]
// Exports validateFolder(folderPath) -> { clean, seek, collisions, seam, readme, errors, shots }
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUICK = process.env.MG_QUICK === "1";
const NO_SHOTS = process.env.MG_NO_SHOTS === "1"; // CI mode: no PNG writes
const STRICT = process.env.MG_STRICT === "1"; // CI gate: promote ⚠ warnings to errors
const FRAMES = QUICK ? [0.4, 0.9] : [0.15, 0.4, 0.65, 0.9]; // parked fractions of LOOP

function parseLoop(html) {
  const m = html.match(/(?:const|let|var)\s+LOOP\s*=\s*(\d{4,7})|__loop\s*=\s*(\d{4,7})/);
  if (m) return parseInt(m[1] || m[2], 10);
  const m2 = html.match(/\b(\d{4,7})\s*;\s*\/\/\s*one full story/);
  return m2 ? parseInt(m2[1], 10) : 30000;
}

export async function validateWithBrowser(browser, folderPath) {
  const errors = [];
  const r0 = null;
  const htmlPath = path.join(folderPath, "index.html");
  const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
  const name = path.basename(folderPath);
  const shotDir = path.join(ROOT, "tool", "shots", name);
  mkdirSync(shotDir, { recursive: true });
  const LOOP = parseLoop(html);

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e.message || e)));
  page.on("console", (m) => m.type() === "error" && pageErrors.push(m.text()));

  // instrument fillText to record label rects (collision + fit probes)
  await page.addInitScript(() => {
    window.__ft = [];
    const orig = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (s, x, y) {
      try {
        const m = this.measureText(s);
        const asc = m.actualBoundingBoxAscent || 10;
        const desc = m.actualBoundingBoxDescent || 3;
        const align = this.textAlign || "left";
        const base = this.textBaseline || "alphabetic";
        const left = x - (align === "center" ? m.width / 2 : align === "right" ? m.width : 0);
        let top = y - asc;
        if (base === "top") top = y;
        else if (base === "middle") top = y - (asc + desc) / 2;
        else if (base === "bottom" || base === "ideographic") top = y - asc - desc;
        let a = this.globalAlpha;
        const fstr = String(this.fillStyle);
        const rm = fstr.match(/rgba\(([^)]+)\)/);
        if (rm) a *= parseFloat(rm[1].split(",")[3]) ?? 1;
        else { const hx = fstr.match(/^#([0-9a-f]{3,8})$/i); if (hx) a *= parseInt(hx[1].slice(-2), 16) / 255; } // #rrggbbAA // || would map alpha 0 → 1
        window.__ft.push({ s: String(s).slice(0, 40), x: left, y: top, w: m.width, asc, desc, a });
      } catch {}
      return orig.call(this, s, x, y);
    };
  });

  const r = { clean: 0, seek: 0, collisions: 0, seam: 0, readme: 0, content: 0, frozen: 0, visibility: 0, seamContinuity: 1, errors: [...pageErrors, ...errors], warnings: [], shots: [], shotsPath: shotDir, LOOP };
  await page.goto("file://" + htmlPath, { waitUntil: "load", timeout: 15000 });
  await page.waitForTimeout(300);

  const hasSeek = await page.evaluate(() => typeof window.__time === "function").catch(() => false);
  if (!hasSeek) errors.push("window.__time not a function");
  if (pageErrors.length) errors.push(`pageerror/console: ${pageErrors.slice(0, 3).join(" | ")}`);
  r.clean = pageErrors.length === 0 ? 1 : 0;
  r.seek = hasSeek ? 1 : 0;

  // park helper: set __time, wait two rAFs, return content pixel count + fillText rects
  async function park(ms) {
    if (!hasSeek) return null;
    await page.evaluate((t) => {
      window.__time(t);
      window.__ft = []; // drop pre-seek fills
    }, ms);
    await page
      .evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))))
      .catch(() => {});
    return await page.evaluate(() => {
      const c = document.querySelector("canvas");
      let content = 0, mid = 0;
      let buf = [];
      if (c && c.width) {
        const ctx = c.getContext("2d");
        const w = c.width, h = c.height;
        const d = ctx.getImageData(0, 0, w, h).data;
        for (let i = 0; i < d.length; i += 16) { // sample every 4th pixel
          const R = d[i], G = d[i + 1], B = d[i + 2];
          if (Math.abs(R - 9) + Math.abs(G - 9) + Math.abs(B - 9) > 40) { content++; mid += R + G + B; }
          buf.push(R, G, B);
        }
      }
      const seen = new Set();
      const ft = (window.__ft || []).filter((f) => {
        const k = f.s + "|" + Math.round(f.x) + "|" + Math.round(f.y) + "|" + Math.round(f.w);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      window.__ft = [];
      let churn = 0;
      const P = window.__prevBuf;
      if (P && P.length === buf.length) for (let i = 0; i < buf.length; i += 3)
        if (P[i] !== buf[i] || P[i + 1] !== buf[i + 1] || P[i + 2] !== buf[i + 2]) churn++;
      window.__prevBuf = buf; // stays in-page, never transferred
      return { content, lum: content ? mid / content : 0, ft, churn };
    });
  }

  const timings = {};
  const tFrames = Date.now();
  const labelMaxA = new Map(); // label -> { a: max alpha, n: frames seen }
  const rectsByTime = {};
  const contentsByTime = {};
  for (const f of FRAMES) {
    const t = Math.round(LOOP * f);
    const p = await park(t);
    const shot = path.join(shotDir, `t${t}.png`);
    if (!NO_SHOTS) await page.screenshot({ path: shot });
    r.shots.push(shot);
    if (p) {
      rectsByTime[t] = p.ft; contentsByTime[t] = p.content;
      for (const f of p.ft) if (f && f.s) {
        const o = labelMaxA.get(f.s) || { a: 0, n: 0 };
        labelMaxA.set(f.s, { a: Math.max(o.a, f.a), n: o.n + 1 });
      }
    }
  }
  timings.frames = Date.now() - tFrames;
  // quick mode parks only 2 frames — top up so the all-frames rule has 4 samples
  if (Object.keys(rectsByTime).length < 4 && hasSeek) {
    for (const f of [0.15, 0.65]) { // exactly the frames full mode parks
      const t = Math.round(LOOP * f);
      if (rectsByTime[t]) continue;
      const p = await park(t);
      if (p) {
        rectsByTime[t] = p.ft; contentsByTime[t] = p.content;
        for (const f2 of p.ft) if (f2 && f2.s) {
          const o2 = labelMaxA.get(f2.s) || { a: 0, n: 0 };
          labelMaxA.set(f2.s, { a: Math.max(o2.a, f2.a), n: o2.n + 1 });
        }
      }
    }
  }

  // densest-frame capture: park at the frame with max content px and save a
  // full-canvas screenshot so a vision pass starts from the best single image
  if (hasSeek && shotDir && Object.keys(contentsByTime).length) {
    const denseT = Object.entries(contentsByTime).sort((a, b) => b[1] - a[1])[0][0];
    await page.evaluate((t) => window.__time(t), denseT);
    await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))).catch(() => {});
    if (!NO_SHOTS) await page.screenshot({ path: path.join(shotDir, "densest.png") });
    r.shots.push(path.join(shotDir, "densest.png"));
  }

  // loop-wide px churn (sampled before the seam check, which may reference it)
  let maxChurn = 0;
  if (hasSeek) {
    const nc = QUICK ? 5 : 25;
    await page.evaluate(() => (window.__prevBuf = null));
    const csamples = [];
    for (let k = 0; k < nc; k++) csamples.push(await park((LOOP * (k + 0.5)) / nc));
    maxChurn = Math.max(...csamples.map((s) => s?.churn || 0), 0);
  }
  const tSeam = Date.now();
  // seam window: max content across the wrap neighbourhood (crossfades dip
  // briefly at the exact seam but a real dark frame stays empty over the window)
  const seamProbes = [LOOP - 900, LOOP - 300, 300, 900, 300 + Math.min(600, Math.floor(LOOP * 0.05))]; // +1: post-wrap dark-band probe
  const seamPts = [];
  for (const sp of seamProbes) seamPts.push(await park(sp));
  const seamA = seamPts[1], seamB = seamPts[2];
  if (!QUICK) {
    const shotA = path.join(shotDir, "seam-a.png"), shotB = path.join(shotDir, "seam-b.png");
    if (!NO_SHOTS) {
      await page.screenshot({ path: shotA });
      await page.screenshot({ path: shotB });
    }
    r.shots.push(shotA, shotB);
  } else for (const st of ["seam-a.png", "seam-b.png"]) {
    const p = path.join(shotDir, st); // drop stale seam PNGs from prior full runs
    if (existsSync(p)) unlinkSync(p);
  }

  timings.seam = Date.now() - tSeam;
  const tCol = Date.now();
  // collision check at every parked frame
  const overlap = (a, b) => {
    // ft rects store y = TOP edge (patch converts baseline->top)
    const ax = { l: a.x, r: a.x + a.w }, ay = { t: a.y, b: a.y + a.asc + a.desc };
    const bx = { l: b.x, r: b.x + b.w }, by = { t: b.y, b: b.y + b.asc + b.desc };
    const ox = Math.min(ax.r, bx.r) - Math.max(ax.l, bx.l);
    const oy = Math.min(ay.b, by.b) - Math.max(ay.t, by.t);
    return { ox, oy };
  };
  if (process.env.MG_DEBUG)
    for (const [t, rects] of Object.entries(rectsByTime))
      console.error(`[debug t=${t}]`, JSON.stringify(rects.map((r) => ({ s: r.s, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), asc: Math.round(r.asc), desc: Math.round(r.desc), a: +r.a.toFixed(2) }))));
  const cullMap = new Map(); // pair key -> Set of t's
  for (const [t, rects] of Object.entries(rectsByTime)) {
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        const { ox, oy } = overlap(a, b);
        const mh = Math.min(a.asc + a.desc, b.asc + b.desc);
        // skip crossfades: a fading-out / fading-in pair is intentional
        if (Math.min(a.a, b.a) < 0.6) continue;
        const interA = Math.max(0, ox) * Math.max(0, oy);
        const aArea = (a.asc + a.desc) * a.w, bArea = (b.asc + b.desc) * b.w;
        const contained = interA >= 0.85 * Math.min(aArea, bArea) &&
          Math.max(a.asc + a.desc, b.asc + b.desc) > 1.6 * Math.min(a.asc + a.desc, b.asc + b.desc);
        if (ox > 5 && a.s !== b.s && !a.s.includes(b.s) && !b.s.includes(a.s) &&
          (oy > 0.6 * mh || (contained && a.a >= 0.6 && b.a >= 0.6))) {
          const key = [a.s, b.s].sort().join("\u0000");
          if (!cullMap.has(key)) cullMap.set(key, new Set());
          cullMap.get(key).add(t);
        }
      }
  }
  const culls = [...cullMap.entries()].map(([key, ts]) => {
    const [x, y] = key.split("\u0000");
    return ts.size > 1 ? `"${x}" x "${y}" ×${ts.size}` : `t=${[...ts][0]}: "${x}" x "${y}"`;
  });
  r.collisions = culls.length === 0 && hasSeek ? 1 : 0;
  timings.collisions = Date.now() - tCol;
  if (culls.length) errors.push(`collisions: ${culls.slice(0, 5).join("; ")}`);

  // seam: content density at both sides must not collapse vs densest frame
  const midContent = Math.max(...FRAMES.map((f) => rectsByTime[Math.round(LOOP * f)]?.length || 0));
  const seamContent = Math.max(seamA?.ft?.length || 0, seamB?.ft?.length || 0);
  const emptySeam = seamA?.content < 100 && seamB?.content < 100;
  const collapsed = midContent > 4 && seamContent < 0.3 * midContent && !emptySeam;
  // pixel cross-check: seam frames must not be dark/empty vs the densest frame
  const midPx = Object.keys(contentsByTime).length ? Math.max(...Object.values(contentsByTime)) : 0;
  // min-area sanity: a real graphic fills its densest frame; blank-but-quiet is a bug
  r.content = midPx >= 500 ? 1 : 0;
  if (!r.content) errors.push(`content: densest frame only ${midPx} px (blank canvas?)`);
  // canvas-edge clip: content pixels within 8px of any edge at any parked frame
  // (clipped labels/graphics bleed off-canvas and read as cut-off text)
  // a clipped label produces a LOCAL cluster (hundreds of contiguous edge px);
  // full-bleed grids/backgrounds are sparse and evenly spread — ignore those
  const clipProbe = () => page.evaluate(() => {
    const c = document.querySelector("canvas");
    const d = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
    const W = c.clientWidth, H = c.clientHeight, M = 8, S = 4, BW = 64; // CSS px (backing store may be d-scaled)
    const row = (x, y) => d[(y * W + x) * 4 + 3] > 64; // ignore hairline grids (~.045 alpha)
    let cluster = 0, run = 0, x, y; // cluster is in px
    // top/bottom edges: horizontal runs (sampled, ×S to true px)
    for (x = 0; x < W; x += S) { if (row(x, 0) || row(x, M)) { run++; if (run * S > cluster) cluster = run * S; } else run = 0; }
    for (x = 0; x < W; x += S) { if (row(x, H - 1) || row(x, H - 1 - M)) { run++; if (run * S > cluster) cluster = run * S; } else run = 0; }
    // left/right edges: vertical runs
    for (y = 0; y < H; y += S) { if (row(0, y) || row(M, y)) { run++; if (run * S > cluster) cluster = run * S; } else run = 0; }
    for (y = 0; y < H; y += S) { if (row(W - 1, y) || row(W - 1 - M, y)) { run++; if (run * S > cluster) cluster = run * S; } else run = 0; }
    // left/right edges: horizontal runs inside a WIDE band (a clipped text row
    // is only ~14px TALL -> the vertical scan never sees >32px; its visible
    // part extends up to BW px INTO the band). Step 1 so runs are true px.
    let bandRun = 0, bandCount = 0; // wide-band: a clipped LABEL spans >=2 y-samples;
    // a 1px hairline divider/hairline grid row spans exactly 1 -> ignore it
    for (y = 0; y < H; y += S) {
      let rowBest = 0, r = 0;
      for (x = BW - 1; x >= 0; x--) { if (row(x, y)) { if (++r > rowBest) rowBest = r; } else r = 0; }
      r = 0;
      for (x = W - 1; x >= W - 1 - BW; x--) { if (row(x, y)) { if (++r > rowBest) rowBest = r; } else r = 0; }
      if (rowBest >= 20) { bandRun = Math.max(bandRun, rowBest); bandCount++; }
    }
    return { cluster, bandRun, bandCount };
  });
  // three states so a fading clipped label can't hide at the probe moment
  const [cw, ch] = await page.evaluate(() => { const c = document.querySelector("canvas"); return [c.clientWidth, c.clientHeight]; });
  const tClip = Date.now();
  let clip = 0, bandRun = 0, bandCount = 0;
  const probeAll = (pr) => { clip = Math.max(clip, pr.cluster); bandRun = Math.max(bandRun, pr.bandRun); bandCount = Math.max(bandCount, pr.bandCount); };
  if (hasSeek) {
    probeAll(await clipProbe());
    for (const f of process.env.MG_QUICK === "1" ? [0.3, 0.6] : [0.005, 0.3, 0.6, 0.995]) {
      // 0.005/0.995 straddle the wrap: a label that drifts off-canvas only
      // near the seam is exactly what the mid-loop probes miss
      await page.evaluate((t) => window.__time(t), Math.round(LOOP * f));
      probeAll(await clipProbe());
    }
  }
  if (process.env.MG_DEBUG) console.error(`[debug clip] cluster=${clip} band=${bandRun}px x${bandCount}rows`);
  r.edgeClip = 1;
  // 32px ≈ one text row; full-bleed backgrounds/bars span >25% of the edge
  const longest = Math.max(cw, ch);
  timings.clipMs = Date.now() - tClip;
  if (clip >= 32 && clip < 0.25 * longest) {
    // warning, not error: legit designs also hug the edge (progress bars,
    // corner tags, edge nodes) — a clipped LABEL is the case a human should check
    r.edgeClip = 0; r.warnings.push(`edge-clip: ${clip}px+ contiguous content along canvas edge — verify no label is clipped`);
  } // 32px ≈ one text row
  // wide-band rule: >=2 text-row samples of 20px+ hugging a vertical edge =
  // a clipped label (hairline dividers span exactly 1 sample -> never fire)
  // full-bleed backgrounds fill EVERY edge sample (bandCount ~ H/S) — a clipped
  // label occupies only a few rows; cap at 25% of edge samples
  const rowSamples = Math.round(ch / 4);
  if (r.edgeClip && bandRun >= 20 && bandCount >= 2 && bandCount < 0.25 * rowSamples && bandRun < 0.25 * longest) {
    r.edgeClip = 0; r.warnings.push(`edge-clip: ${bandRun}px label-width content on canvas edge (${bandCount} rows) — verify no label is clipped`);
  }
  const seamPx = Math.max(...seamPts.map((p) => p?.content || 0));
  // a moving element (spinner, marquee, ping) crossing the wrap can keep a seam
  // frame's content high while it is visually dark — a churn-gated variant of
  // this test was tried and regressed dark-band-post (its moving bar churns at
  // the wrap too), so the plain content rule stands.
  const darkSeam = midPx > 1000 && Math.min(seamPx, seamPts[4]?.content ?? seamPx) < 0.3 * midPx;
  r.seam = hasSeek && !emptySeam && !collapsed && !darkSeam ? 1 : 0;
  if (darkSeam) { const darkPx = Math.min(seamPx, seamPts[4]?.content ?? seamPx); errors.push(`seam: dark frame at loop wrap (darkest seam probe ${darkPx}px vs mid ${midPx}px)`); }
  else if (emptySeam) errors.push("seam: near-empty frames at loop wrap");
  else if (collapsed) errors.push("seam: label density collapses at loop wrap");

  // seam label continuity: labels shown at seam-a must reappear by the
  // first frame after seam-b (a label that vanishes at the wrap is a bug)
  const seamAlabels = new Set((seamA?.ft || []).map((f) => f.s));
  const afterSeam = [...Object.values(rectsByTime)].flat().map((f) => f.s);
  // labels with digits are usually live counters (value changes each
  // frame) — only stable text labels are checked
  const goneAtSeam = [...seamAlabels].filter((s) => s.trim() && !/[0-9]/.test(s) && !afterSeam.includes(s));
  // seam pop-in: a label invisible at seam-a but fully visible at seam-b
  // pops in during the <300ms wrap window (no fade-in possible that fast)
  const aAt = (p, s) => (p?.ft || []).find((f) => f.s === s)?.a ?? 0;
  const bAt = (p, s) => (p?.ft || []).find((f) => f.s === s)?.a ?? 0;
  const pops = [...new Set((seamB?.ft || []).map((f) => f.s))].filter((s) => s.trim() && !/[0-9]/.test(s) && aAt(seamA, s) < 0.2 && bAt(seamB, s) > 0.6);
  if (pops.length) errors.push(`seam: labels pop in at the wrap (no fade): ${pops.slice(0, 3).map((x) => `"${x}"`).join(", ")}`);
  r.seamContinuity = goneAtSeam.length === 0 ? 1 : 0;
  if (r.seamContinuity === 0)
    errors.push(`seam: labels never reappear after wrap: ${goneAtSeam.slice(0, 3).map((s) => `"${s}"`).join(", ")}`);

  const tReadme = Date.now();
  r.readme = (() => {
    const p = path.join(folderPath, "README.md");
    if (!existsSync(p) || readFileSync(p, "utf8").length <= 200) return 0;
    const md = readFileSync(p, "utf8");
    const h1 = md.split("\n").find((l) => l.startsWith("# ")) || "";
    // topic-match: at least one distinctive folder word must appear in the H1
    const STOP = new Set(["the", "a", "an", "and", "or", "of", "for", "to", "in", "on", "how", "with"]);
    const words = name.split(/[-_]/).filter((w) => w.length >= 4 && !STOP.has(w.toLowerCase()));
    if (!words.length) return 1;
    const hl = h1.toLowerCase();
    // title word (first 3-6+ char word of the H1) must also appear in the folder name
    const tmatch = h1.replace(/^#\s+/, "").split(/[^a-z0-9]+/i).find((w) => w.length >= 3 && !STOP.has(w.toLowerCase())) || "";
    if (tmatch && !name.toLowerCase().includes(tmatch.toLowerCase())) return 0; // title word must appear in the folder name
    return words.some((w) => { const x = w.toLowerCase(); return hl.includes(x) || hl.includes(x.replace(/s$/, "")); }) ? 1 : 0;
  })();
  if (!r.readme) errors.push("README.md missing, trivial, or H1 doesn't match the topic words");
  timings.readmeMs = Date.now() - tReadme;

  // label visibility: a label present in EVERY parked frame yet never
  // reaching alpha 0.15 is a bug (ghost/placeholder text). Beat labels
  // fade in/out and may sample at alpha 0 on frames at their boundaries
  // (n=1), so "all frames" is the discriminator; dim subtitles (a~0.3)
  // are legitimate.
  r.visibility = 0;
  const parked = Object.keys(rectsByTime).length;
  const invisible = [...labelMaxA.entries()].filter(([s, o]) => o.a < 0.15 && o.n >= parked && parked > 0 && s.trim());
  if (hasSeek && invisible.length === 0) r.visibility = 1;
  if (r.visibility === 0 && invisible.length)
    errors.push(`visibility: always-invisible labels: ${invisible.slice(0, 3).map(([s, o]) => `"${s}" (max a=${o.a.toFixed(2)}, ${o.n} frames)`).join(", ")}`);

  const tFrozen = Date.now();
  // frozen probe: uses the loop-wide churn sampled above — churn (not a
  // content COUNT) also catches pure translations.
  if (hasSeek) {
    const base = Math.max(...Object.values(contentsByTime), 1);
    const maxD = maxChurn / base;
    if (maxD < 0.005) {
      r.frozen = 1;
      errors.push(`frozen: max px churn ${maxChurn} over loop-wide samples (static canvas?)`);
    } else if (maxD < 0.02) {
      r.warnings.push(`near-frozen: max px churn ${maxChurn} (${Math.round(maxD * 100)}%) over loop-wide samples (subtle motion?)`); // soft: warn, do not fail
    }
    timings.frozen = Date.now() - tFrozen;
  }

  
  r.quick = QUICK ? 1 : 0;
  r.resize = 0;
  const tRes = Date.now();
  if (QUICK) { r.resize = 1; } // quick mode: skip the resize step
  else try {
    const before = pageErrors.length;
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    if (hasSeek) await page.evaluate((v) => window.__time(v), Math.floor(LOOP * 0.5));
    await page.waitForTimeout(300);
    const n = pageErrors.length - before;
    if (n > 0) errors.push(`resize: ${n} error(s) after viewport change to 1366x768`);
    else r.resize = 1;
  } catch (e) {
    errors.push(`resize: ${e.message}`);
  }

  timings.resize = Date.now() - tRes;
  r.labels = [...labelMaxA.keys()].filter((x) => x.trim()).length; // distinct non-empty fillText strings captured
  r.size = cw && ch ? `${cw}x${ch}` : null; // rendered CSS resolution (backing store may be d-scaled)
  r.errors = [...pageErrors, ...errors];
  if (STRICT && r.warnings.length) r.errors.push(...r.warnings.map((w) => `strict: ${w}`));
  r.timings = timings;
  await page.close();
  // shot manifest for vision-review tooling: one entry per saved PNG
  if (shotDir) {
    const manifest = r.shots.map((s) => {
      const base = path.basename(s);
      const isSeam = base.startsWith("seam-");
      const isDensest = base === "densest.png";
      const t = isDensest ? Object.entries(contentsByTime).sort((a, b) => b[1] - a[1])[0][0] : isSeam ? (base === "seam-a.png" ? LOOP - 300 : 300) : parseInt(base.slice(1, -4), 10);
      const content = isSeam
        ? (base === "seam-a.png" ? seamPts[1]?.content ?? null : seamPts[2]?.content ?? null)
        : contentsByTime[t] ?? null;
      return { file: base, t, contentPx: isDensest ? contentsByTime[t] : content, seam: isSeam, densest: isDensest };
    });
    writeFileSync(path.join(shotDir, "manifest.json"), JSON.stringify({ topic: name, LOOP, labels: r.labels, size: r.size, shots: manifest }, null, 1) + "\n");
  }
  return r;
}

export async function validateFolder(folderPath) {
  const browser = await chromium.launch();
  try {
    return await validateWithBrowser(browser, folderPath);
  } finally {
    await browser.close();
  }
}

export { parseLoop };

// CLI (only when run directly, not imported)
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const [arg] = isMain ? process.argv.slice(2).filter((a) => a !== "--json") : [];
if (isMain) {
  if (!arg) {
    console.log("usage: node validate.mjs <graphic-folder> [--json]");
    process.exit(2);
  }
  const r = await validateFolder(path.resolve(arg));
  console.log(JSON.stringify({ folder: path.basename(arg), ...r, warnings: r.warnings }, null, 2));
  process.exit(r.clean && r.seek && r.collisions && r.seam && r.readme && r.content && !r.frozen && r.visibility ? 0 : 1);
}
