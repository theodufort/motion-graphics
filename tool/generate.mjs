#!/usr/bin/env node
// generate.mjs — one prompt in, validated motion graphic out.
// CLI: node tool/generate.mjs "<prompt>"
// Env: MG_LLM_BASE (default http://127.0.0.1:8123), MG_LLM_MODEL (default
//      Qwen3.8-27b-coding), MG_FIX_PASSES (default 3), MG_TIMEOUT_MS (default 900000)
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateFolder } from "./validate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.MG_LLM_BASE || "http://127.0.0.1:8123";
const MODEL = process.env.MG_LLM_MODEL || "Qwen3.8-27b-coding";
const FIX_PASSES = +(process.env.MG_FIX_PASSES || 3);
const TIMEOUT = +(process.env.MG_TIMEOUT_MS || 900000);

const SYSTEM = `You write motion graphics for the motion-graphics repo. Output EXACTLY one
single-page HTML file plus a short README. Follow these rules without exception:

HARD RULES
1. One full HTML document, <!DOCTYPE html> ... </html>. All CSS in one <style>, all JS in
   one <script>. No external files.
2. First two <link> tags in <head>:
   <link rel="stylesheet" href="../css/brand.css" />
   <link rel="stylesheet" href="../css/motion.css" />
3. Brand tokens: use var(--bg) #090909, var(--bg-2) #111111, var(--surface) #1c1c1c,
   var(--text) #ededed, var(--muted) #8f8f8f, var(--accent) #3ecf8e, var(--fail) #ef4444,
   var(--border) rgba(255,255,255,.06), var(--radius-lg). NEVER hardcode these hex values
   in your <style>; reference var(--...). For canvas JS, resolve tokens once into RGB
   arrays: PAL = { accent:[62,207,142], fail:[239,68,68], text:[237,237,237],
   muted:[143,143,143], bg:[9,9,9] } and draw with rgba(c, a).
4. Rendering: ONE full-viewport 16:9 <canvas id="stage">, everything drawn in a
   requestAnimationFrame loop. No CSS keyframe animation as the primary technique.
5. One continuous looping timeline. const LOOP = <20000..45000>; everything is a pure
   function of t = now % LOOP. No slideshow, no play/pause/next/prev, no controls,
   no keyboard handling.
6. Expose both hooks EXACTLY:
   let __seek = null;
   window.__time = (v) => { __seek = v; };   // park the loop at an exact ms
   window.__loop = LOOP;
   In the frame loop: if (__seek != null) now = __seek;  (keep rAF running)
7. DPI-aware resize: canvas.width = W * dpr; ctx.setTransform(dpr,0,0,dpr,0,0) — setTransform,
   never ctx.scale (it compounds). All positions derived from W/H (e.g. W*0.5), never
   hardcoded pixels.
8. Text: title 3-6 words, node labels 2-4 words, NO sentences/paragraphs on canvas except
   one short rule line. Prefer animated counters and meters.
9. EVERY element moves: nodes pulse (sin(now/400)), packets travel between nodes along
   quadratic Bézier paths with fading trails, meters fill, counters tick, elements
   fade in/out across beats. Nothing static.
10. Beat structure: derive beats from t (e.g. const beat = t / LOOP; show element while
    beat in [a,b) with easeInOut fade in/out at the edges). The last beat fades out into
    the first beat fading in — seamless loop, no dark empty frames at the wrap.
11. Crossfades: when a label swaps, fade the old one OUT (alpha to 0) before/at the same
    time the new one fades in — never draw two different strings at the same x,y at full
    opacity.
12. Easing helpers: lerp, clamp01, easeInOut (t<0.5?2t²:-1+(4-2t)t). Packets: p.t += dt/DUR,
    pos = quad(a, c, b, easeInOut(p.t)); spawn via elapsed-time windows so the loop is
    deterministic and seam-free (no persistent state at the wrap).
13. Glow: radial gradients, shadowBlur sparingly. Grid background: faint 1px lines at
    rgba(255,255,255,0.03).
14. Zero JS errors. No undeclared variables, no duplicate const, no await at top level.

REQUIRED STRUCTURE (adapt content, keep shape):
  setup (canvas, ctx, LOOP, PAL, rgba helper) → buildLayout() (positions from W/H) →
  easing → entity arrays + spawn/update → __seek/__time/__loop hooks → frame(now)
  { t = now % LOOP; clearRect; drawBackground(t); drawConnections(t); drawNodes(t);
    drawEntities(t); drawHud(t); requestAnimationFrame(frame) } → resize(); rAF(frame).

OUTPUT FORMAT — exactly three parts, no extra text before or after:
TOPIC: <2-4-word kebab-case-slug>
===README===
# <Title, 3-6 words>
<one sentence: what it explains + takeaway>
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5      | …    | …                |
Loop length: <N>s.
## Key elements
- <element>: <label, color role>
## Notes
- <non-obvious detail>
===HTML===
<!DOCTYPE html> ... complete file ...`;

async function llm(messages) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}/v1/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.2, max_tokens: 16000 }),
      signal: ctl.signal,
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const d = await res.json();
    return d.choices?.[0]?.message?.content ?? "";
  } finally { clearTimeout(to); }
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "graphic";
}

function parse(out, fallbackSlug) {
  const topicM = out.match(/^TOPIC:\s*(.+)$/m);
  const htmlM = out.indexOf("===HTML===");
  const readmeM = out.indexOf("===README===");
  let html = htmlM >= 0 ? out.slice(htmlM + 10) : out;
  html = html.replace(/^```(html)?\n?/i, "").replace(/\n?```\s*$/, "").trim();
  if (!/^<!DOCTYPE html>/i.test(html)) {
    const m = html.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
    if (m) html = m[0];
  }
  let readme = readmeM >= 0 && htmlM > readmeM
    ? out.slice(readmeM + 12, htmlM).trim()
    : `# ${topicM ? topicM[1].trim() : fallbackSlug}\n\nMotion graphic.\n\n## Notes\n- generated`;
  return { topic: topicM ? slugify(topicM[1]) : fallbackSlug, html, readme };
}

export async function generate(prompt) {
  const t0 = Date.now();
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Make a motion graphic: ${prompt}` },
  ];
  let out = await llm(messages);
  let { topic, html, readme } = parse(out, slugify(prompt));

  if (!/<!DOCTYPE html>/i.test(html) || !html.includes("requestAnimationFrame")) {
    // one retry with the failure called out
    messages.push({ role: "assistant", content: out.slice(0, 2000) },
      { role: "user", content: "That output was malformed. Reply again with the exact TOPIC/===README===/===HTML=== format and a complete, valid HTML file." });
    out = await llm(messages);
    ({ topic, html, readme } = parse(out, slugify(prompt)));
  }

  const folder = path.join(ROOT, topic);
  mkdirSync(folder, { recursive: true });
  writeFileSync(path.join(folder, "index.html"), html + "\n");
  writeFileSync(path.join(folder, "README.md"), readme + "\n");
  let report = await validateFolder(folder);
  let pass = report.clean && report.seek && report.collisions && report.seam && report.readme;

  // self-improvement fix loop
  for (let i = 0; !pass && i < FIX_PASSES; i++) {
    const errs = report.errors.slice(0, 8).join("; ");
    messages.push({ role: "assistant", content: html.slice(0, 20000) },
      { role: "user", content:
        `The generated graphic failed validation with: ${errs || "unknown"}.
Fix the HTML so it passes: zero JS errors, window.__time and window.__loop defined,
no overlapping full-opacity text, no dark frame at the loop seam, all elements animate.
Reply with the COMPLETE corrected file between ===HTML=== markers (keep TOPIC and ===README=== too).` });
    const fix = await llm(messages);
    const p2 = parse(fix, topic);
    html = p2.html;
    writeFileSync(path.join(folder, "index.html"), html + "\n");
    if (p2.readme !== readme) { readme = p2.readme; writeFileSync(path.join(folder, "README.md"), readme + "\n"); }
    report = await validateFolder(folder);
    pass = report.clean && report.seek && report.collisions && report.seam && report.readme;
  }
  return { folder, topic, pass, report, seconds: (Date.now() - t0) / 1000 };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const prompt = process.argv.slice(2).join(" ");
  if (!prompt) { console.error("usage: node tool/generate.mjs \"<prompt>\""); process.exit(2); }
  const g = await generate(prompt);
  console.log(JSON.stringify({ topic: g.topic, pass: g.pass, seconds: Math.round(g.seconds), errors: g.report.errors, checks: { clean: g.report.clean, seek: g.report.seek, collisions: g.report.collisions, seam: g.report.seam, readme: g.report.readme } }, null, 1));
  console.log(g.folder);
  process.exit(g.pass ? 0 : 1);
}
