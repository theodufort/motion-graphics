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
        if (rm) a *= parseFloat(rm[1].split(",")[3]) ?? 1; // || would map alpha 0 → 1
        window.__ft.push({ s: String(s).slice(0, 40), x: left, y: top, w: m.width, asc, desc, a });
      } catch {}
      return orig.call(this, s, x, y);
    };
  });

  const r = { clean: 0, seek: 0, collisions: 0, seam: 0, readme: 0, content: 0, frozen: 0, visibility: 0, seamContinuity: 1, errors: [...pageErrors, ...errors], shots: [], shotsPath: shotDir, LOOP };
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
      if (c && c.width) {
        const ctx = c.getContext("2d");
        const w = c.width, h = c.height;
        const d = ctx.getImageData(0, 0, w, h).data;
        for (let i = 0; i < d.length; i += 16) { // sample every 4th pixel
          const R = d[i], G = d[i + 1], B = d[i + 2];
          if (Math.abs(R - 9) + Math.abs(G - 9) + Math.abs(B - 9) > 40) { content++; mid += R + G + B; }
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
      return { content, lum: content ? mid / content : 0, ft };
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
    await page.screenshot({ path: shot });
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
  const tSeam = Date.now();
  // seam window: max content across the wrap neighbourhood (crossfades dip
  // briefly at the exact seam but a real dark frame stays empty over the window)
  const seamProbes = [LOOP - 900, LOOP - 300, 300, 900, 300 + Math.min(600, Math.floor(LOOP * 0.05))]; // +1: post-wrap dark-band probe
  const seamPts = [];
  for (const sp of seamProbes) seamPts.push(await park(sp));
  const seamA = seamPts[1], seamB = seamPts[2];
  if (!QUICK) {
    const shotA = path.join(shotDir, "seam-a.png"), shotB = path.join(shotDir, "seam-b.png");
    await page.screenshot({ path: shotA });
    await page.screenshot({ path: shotB });
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
  const seamPx = Math.max(...seamPts.map((p) => p?.content || 0));
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
  r.seamContinuity = goneAtSeam.length === 0 ? 1 : 0;
  if (r.seamContinuity === 0)
    errors.push(`seam: labels never reappear after wrap: ${goneAtSeam.slice(0, 3).map((s) => `"${s}"`).join(", ")}`);

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
    return words.some((w) => { const x = w.toLowerCase(); return hl.includes(x) || hl.includes(x.replace(/s$/, "")); }) ? 1 : 0;
  })();
  if (!r.readme) errors.push("README.md missing, trivial, or H1 doesn't match the topic words");

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

  const tFrz = Date.now();
  // frozen-animation probe: sample evenly across the loop; a real graphic
  // shows a big content-px delta at least once (beat transitions), so freeze
  // only when the MAX delta is near zero (beat-hold regions are fine)
  if (hasSeek) {
    const n = QUICK ? 5 : 25;
    const samples = [];
    for (let k = 0; k < n; k++) samples.push((await park((LOOP * (k + 0.5)) / n))?.content || 0);
    const deltas = samples.slice(1).map((c, i) => Math.abs(c - samples[i]));
    const base = Math.max(...samples, 1);
    if (Math.max(...deltas) / base < 0.005) {
      r.frozen = 1;
      errors.push(`frozen: max content-px delta ${Math.max(...deltas)} over ${n} loop-wide samples (static canvas?)`);
    }
  }

  timings.frozen = Date.now() - tFrz;
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
  r.errors = [...pageErrors, ...errors];
  r.timings = timings;
  await page.close();
  // shot manifest for vision-review tooling: one entry per saved PNG
  if (shotDir) {
    const manifest = r.shots.map((s) => {
      const base = path.basename(s);
      const isSeam = base.startsWith("seam-");
      const t = isSeam ? (base === "seam-a.png" ? LOOP - 300 : 300) : parseInt(base.slice(1, -4), 10);
      const content = isSeam
        ? (base === "seam-a.png" ? seamPts[1]?.content ?? null : seamPts[2]?.content ?? null)
        : contentsByTime[t] ?? null;
      return { file: base, t, contentPx: content, seam: isSeam };
    });
    writeFileSync(path.join(shotDir, "manifest.json"), JSON.stringify({ topic: name, LOOP, shots: manifest }, null, 1) + "\n");
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
  console.log(JSON.stringify({ folder: path.basename(arg), ...r }, null, 2));
  process.exit(r.clean && r.seek && r.collisions && r.seam && r.readme && r.content && !r.frozen && r.visibility ? 0 : 1);
}
