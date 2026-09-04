#!/usr/bin/env node
// validate.mjs — headless visual validation of one motion graphic folder.
// CLI: node validate.mjs <folder> [--json]
// Exports validateFolder(folderPath) -> { clean, seek, collisions, seam, readme, errors, shots }
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRAMES = [0.15, 0.4, 0.65, 0.9]; // parked fractions of LOOP

function parseLoop(html) {
  const m = html.match(/(?:const|let|var)\s+LOOP\s*=\s*(\d{4,7})|__loop\s*=\s*(\d{4,7})/);
  if (m) return parseInt(m[1] || m[2], 10);
  const m2 = html.match(/\b(\d{4,7})\s*;\s*\/\/\s*one full story/);
  return m2 ? parseInt(m2[1], 10) : 30000;
}

async function validateFolder(folderPath) {
  const errors = [];
  const r0 = null;
  const htmlPath = path.join(folderPath, "index.html");
  const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
  const name = path.basename(folderPath);
  const shotDir = path.join(ROOT, "tool", "shots", name);
  mkdirSync(shotDir, { recursive: true });
  const LOOP = parseLoop(html);

  const browser = await chromium.launch();
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
        if (rm) a *= parseFloat(rm[1].split(",")[3]) || 1;
        window.__ft.push({ s: String(s).slice(0, 40), x: left, y: top, w: m.width, asc, desc, a });
      } catch {}
      return orig.call(this, s, x, y);
    };
  });

  const r = { clean: 0, seek: 0, collisions: 0, seam: 0, readme: 0, errors: [...pageErrors, ...errors], shots: [], shotsPath: shotDir, LOOP };
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

  const rectsByTime = {};
  const contentsByTime = {};
  for (const f of FRAMES) {
    const t = Math.round(LOOP * f);
    const p = await park(t);
    const shot = path.join(shotDir, `t${t}.png`);
    await page.screenshot({ path: shot });
    r.shots.push(shot);
    if (p) { rectsByTime[t] = p.ft; contentsByTime[t] = p.content; }
  }
  // seam window: max content across the wrap neighbourhood (crossfades dip
  // briefly at the exact seam but a real dark frame stays empty over the window)
  const seamProbes = [LOOP - 900, LOOP - 300, 300, 900];
  const seamPts = [];
  for (const sp of seamProbes) seamPts.push(await park(sp));
  const seamA = seamPts[1], seamB = seamPts[2];
  const shotA = path.join(shotDir, "seam-a.png"), shotB = path.join(shotDir, "seam-b.png");
  await page.screenshot({ path: shotA });
  await page.screenshot({ path: shotB });
  r.shots.push(shotA, shotB);

  // collision check at every parked frame
  const overlap = (a, b) => {
    const ax = { l: a.x, r: a.x + a.w }, ay = { t: a.y - a.asc, b: a.y + a.desc };
    const bx = { l: b.x, r: b.x + b.w }, by = { t: b.y - b.asc, b: b.y + b.desc };
    const ox = Math.min(ax.r, bx.r) - Math.max(ax.l, bx.l);
    const oy = Math.min(ay.b, by.b) - Math.max(ay.t, by.t);
    return { ox, oy };
  };
  const cullMap = new Map(); // pair key -> Set of t's
  for (const [t, rects] of Object.entries(rectsByTime)) {
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        const { ox, oy } = overlap(a, b);
        const mh = Math.min(a.asc + a.desc, b.asc + b.desc);
        // skip crossfades: a fading-out / fading-in pair is intentional
        if (Math.min(a.a, b.a) < 0.6) continue;
        if (ox > 5 && oy > 0.6 * mh && a.s !== b.s && !a.s.includes(b.s) && !b.s.includes(a.s)) {
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
  if (culls.length) errors.push(`collisions: ${culls.slice(0, 5).join("; ")}`);

  // seam: content density at both sides must not collapse vs densest frame
  const midContent = Math.max(...FRAMES.map((f) => rectsByTime[Math.round(LOOP * f)]?.length || 0));
  const seamContent = Math.max(seamA?.ft?.length || 0, seamB?.ft?.length || 0);
  const emptySeam = seamA?.content < 100 && seamB?.content < 100;
  const collapsed = midContent > 4 && seamContent < 0.3 * midContent && !emptySeam;
  // pixel cross-check: seam frames must not be dark/empty vs the densest frame
  const midPx = Math.max(...Object.values(contentsByTime));
  const seamPx = Math.max(...seamPts.map((p) => p?.content || 0));
  const darkSeam = midPx > 1000 && seamPx < 0.3 * midPx;
  r.seam = hasSeek && !emptySeam && !collapsed && !darkSeam ? 1 : 0;
  if (darkSeam) errors.push(`seam: dark frame at loop wrap (content px ${seamPx} vs mid ${midPx})`);
  else if (emptySeam) errors.push("seam: near-empty frames at loop wrap");
  else if (collapsed) errors.push("seam: label density collapses at loop wrap");

  r.readme = (() => {
    const p = path.join(folderPath, "README.md");
    return existsSync(p) && readFileSync(p, "utf8").length > 200 ? 1 : 0;
  })();
  if (!r.readme) errors.push("README.md missing or trivial");

  // resize robustness: change viewport mid-validation, then seek again
  r.resize = 0;
  try {
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

  r.errors = [...pageErrors, ...errors];
  await browser.close();
  return r;
}

export { validateFolder, parseLoop };

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
  process.exit(r.clean && r.seek && r.collisions && r.seam && r.readme ? 0 : 1);
}
