#!/usr/bin/env node
// generate.mjs — one prompt in, validated motion graphic out.
// CLI: node tool/generate.mjs "<prompt>"
// Env: MG_LLM_BASE (default http://127.0.0.1:8123), MG_LLM_MODEL (default
//      Qwen3.8-27b-coding), MG_FIX_PASSES (default 3), MG_TIMEOUT_MS (default 900000)
import { writeFileSync, existsSync, mkdirSync, readFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateFolder } from "./validate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.MG_LLM_BASE || "http://127.0.0.1:8123";
const MODEL = process.env.MG_LLM_MODEL || "Qwen3.8-27b-coding";
const FIX_PASSES = +(process.env.MG_FIX_PASSES || 3);
const RETRY_TEMPERATURE = +(process.env.MG_LLM_TEMPERATURE || 0.8); // stuck-fix escape: one fresh-temperature retry
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
15. Be terse: ~120-180 lines of HTML total. No comments except one per section, no
    unused helpers, no commented-out alternatives, no repetitive per-entity code when a
    small loop over a data array does the job. Data-driven: nodes/packets/beats are
    arrays of plain objects drawn in loops, not hand-written draw calls per element.
16. Label fit: before every fillText near a box/shape, size the font so
    ctx.measureText(label).width < 0.9 * the shape's width (measure at draw
    time; if too wide, drop the font size by 2px steps or shorten the
    label). Never let a label visually overflow its box.
17. Motion: between any two consecutive beats at least one element must
    visibly change (position, size, alpha, or text). No beat may be a
    pixel-identical redraw of the previous one.
18. Never draw text at alpha 0 — no invisible placeholder labels; a
    label that exists in the code must become visible in its beat.

REQUIRED STRUCTURE (adapt content, keep shape):
  setup (canvas, ctx, LOOP, PAL, rgba helper) → buildLayout() (positions from W/H) →
  easing → entity arrays + spawn/update → __seek/__time/__loop hooks → frame(now)
  { t = now % LOOP; clearRect; drawBackground(t); drawConnections(t); drawNodes(t);
    drawEntities(t); drawHud(t); requestAnimationFrame(frame) } → resize(); rAF(frame).

OUTPUT FORMAT — exactly three parts, no extra text before or after:
TOPIC: <2-4-word kebab-case-slug>
===README===
# <Title, 3-6 words — must contain at least one word of the topic slug>
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

async function llmOnce(messages) {
  const start = Date.now();
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}/v1/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, temperature: process.env.MG_FIX_TEMP ? RETRY_TEMPERATURE : 0.2, max_tokens: 16000 }),
      signal: ctl.signal,
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const d = await res.json();
    const ms = Date.now() - start;
    return { content: d.choices?.[0]?.message?.content ?? "", usage: d.usage || null, ms };
  } finally { clearTimeout(to); }
}

// one retry with backoff for timeout/network flakiness; HTTP 4xx/5xx is
// a real failure (bad request), not transient
export async function llm(messages) {
  try {
    return await llmOnce(messages);
  } catch (e) {
    const transient = e?.name === "AbortError" || /fetch failed|ECONNREFUSED|ECONNRESET|socket/i.test(String(e?.message || e));
    if (!transient) throw e;
    console.error(`llm: transient error (${e.name || e.message}); retrying in 5s`);
    await new Promise((r) => setTimeout(r, 5000));
    return llmOnce(messages);
  }
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "graphic";
}

function parse(out, fallbackSlug) {
  const topicM = out.match(/^TOPIC:\s*(.+)$/m);
  if (!topicM) console.error(`warning: no TOPIC line in LLM response — using prompt slug "${fallbackSlug}" (topic may drift from the design)`);
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

const slugMapPath = path.join(ROOT, "logs", "slug-map.jsonl");
function readSlugMap() {
  if (!existsSync(slugMapPath)) return new Map();
  const m = new Map();
  for (const l of readFileSync(slugMapPath, "utf8").split("\n").filter(Boolean)) {
    try { const o = JSON.parse(l); m.set(o.prompt, o.topic); } catch {}
  }
  return m;
}
function rememberSlug(prompt, topic) {
  try {
    // dedupe: one canonical entry per prompt (last topic wins)
    const lines = existsSync(slugMapPath) ? readFileSync(slugMapPath, "utf8").split("\n") : [];
    const kept = lines.filter((l) => l.trim() && !l.includes(`"prompt":"${prompt}"`));
    kept.push(JSON.stringify({ prompt, topic }));
    writeFileSync(slugMapPath, kept.join("\n") + "\n");
  } catch {}
}
// novelty: fraction of this graphic's fillText labels never seen in prior
// generations (per logs/generations.jsonl topics) — low = repetitive output
function noveltyOf(html, topic) {
  // labels: fillText literals AND const/var assignments of 2+ word strings
  // (generators often wrap fillText in a fitLabel(txt,...) helper)
  const grab = (h) => {
    const out = new Set();
    for (const m of h.matchAll(/(?:fillText|fitLabel)\(\s*["'\`]([^"'\`]{2,40})["'\`]/g)) out.add(m[1].toLowerCase());
    for (const m of h.matchAll(/(?:const|let|var)\s+\w+\s*=\s*["']([^"']{2,40})["']/g)) {
      const t = m[1].trim();
      if (t.split(/\s+/).length >= 2 && !/[=;{}()\d]/.test(t) && !/^[\s#]/.test(t)) out.add(t.toLowerCase());
    }
    return out;
  };
  const labels = grab(html);
  if (labels.size === 0) return null;
  const prior = new Set();
  try {
    const lines = readFileSync(path.join(ROOT, "logs", "generations.jsonl"), "utf8").trim().split("\n").filter(Boolean);
    for (const l of lines.slice(-30)) {
      let e;
      try { e = JSON.parse(l); } catch { continue; }
      if (!e.topic || e.topic === topic) continue;
      const f = path.join(ROOT, e.topic, "index.html");
      if (existsSync(f)) for (const s of grab(readFileSync(f, "utf8"))) prior.add(s);
    }
  } catch { /* no log yet */ }
  if (prior.size === 0) return 1;
  return Math.round((1 - [...labels].filter((l) => prior.has(l)).length / labels.size) * 100) / 100;
}

export async function generate(prompt, { force = false, allowExisting = process.env.MG_ALLOW_EXISTING === "1" } = {}) {
  const t0 = Date.now();
  // overwrite guard: same prompt previously generated an existing folder
  const known = readSlugMap().get(prompt);
  if (known && existsSync(path.join(ROOT, known)) && !force && !allowExisting)
    throw new Error(`refusing to overwrite existing folder "${known}" — pass --force to regenerate`);
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Make a motion graphic: ${prompt}` },
  ];
  const first = await llm(messages);
  let out = first.content;
  let { topic, html, readme } = parse(out, slugify(prompt));

  const truncated = /<!DOCTYPE html>/i.test(html) && !/<\/script>/.test(html) && !/<\/html>/.test(html);
  if (!/<!DOCTYPE html>/i.test(html) || !html.includes("requestAnimationFrame") || truncated) {
    // one retry with the failure called out (truncation = file cut off mid-<script>)
    messages.push({ role: "assistant", content: out.slice(0, 2000) },
      { role: "user", content: (truncated ? "That file was TRUNCATED mid-<script> — it must end with </script></body></html>. " : "") + "Reply again with the exact TOPIC/===README===/===HTML=== format and a complete, valid HTML file." });
    out = (await llm(messages)).content;
    ({ topic, html, readme } = parse(out, slugify(prompt)));
  }

  const folder = path.join(ROOT, topic);
  if (existsSync(path.join(folder, "index.html")) && !force && !allowExisting)
    throw new Error(`folder ${path.basename(folder)} already exists — pass --force to overwrite`);
  mkdirSync(folder, { recursive: true });
  rememberSlug(prompt, topic);
  writeFileSync(path.join(folder, "index.html"), html + "\n");
  writeFileSync(path.join(folder, "README.md"), readme + "\n");
  let report = await validateFolder(folder);
  let pass = report.clean && report.seek && report.collisions && report.seam && report.readme;
  let fixPasses = 0;

  // self-improvement fix loop
  let lastErrs = null; // early stop: same error set twice in a row = model stuck
  let stuckRetryUsed = false;
  for (let i = 0; !pass && i < FIX_PASSES; i++) {
    fixPasses = i + 1;
    const errs = report.errors.slice(0, 8).join("; ");
    if (fixPasses > 1 && errs === lastErrs) {
      console.error(`fix loop: identical errors on ${fixPasses} passes - model stuck at temp 0.2`);
      // escape once: a fresh temperature often un-sticks a deterministic loop
      if (!stuckRetryUsed) {
        stuckRetryUsed = true;
        process.env.MG_FIX_TEMP = "1";
        console.error(`fix loop: retrying stuck pass with temperature ${RETRY_TEMPERATURE}`);
      } else break;
    }
    lastErrs = errs;
    // name the failing CHECK CLASS so the first fix pass targets it
    const HINTS = {
      clean: "fix every JS error above (pageerror/console) — one error kills the whole graphic",
      seek: "expose window.__time(ms) seek and window.__loop so the validator can park frames",
      collisions: "no two full-opacity labels may overlap — offset positions or lower one label's alpha below 0.5",
      seam: "labels visible near t=LOOP must reappear after the wrap with a fade (no vanish, no pop-in, no dark frame in the seam window)",
      readme: "README.md needs a real H1 heading that contains a topic word",
      content: "the densest frame must fill at least 500 px of canvas content",
      frozen: "every beat needs visible pixel churn — add a pulse, counter tick, or moving element (a pure translation counts too)",
      visibility: "a label present in EVERY frame must reach alpha at least 0.15 at some point"
    };
    const hints = [...new Set([...report.errors, ...report.warnings].map((e) => e.split(":")[0]))]
      .filter((k) => HINTS[k]).map((k) => `- ${k}: ${HINTS[k]}`);
    const FIX_MAX_LINES = 260; // rule 15 target: don't resend a bloated file whole
    const htmlLines = html.split("\n");
    const trimmed = htmlLines.length > FIX_MAX_LINES ? htmlLines.slice(0, FIX_MAX_LINES - 1).join("\n") + `\n<!-- truncated for fix context: keep the file structure, complete every part -->` : html;
    messages.push({ role: "assistant", content: trimmed },
      { role: "user", content:
        `The generated graphic failed validation with: ${errs || "unknown"}.
Fix the HTML so it passes every check. Target these failing check classes:
${hints.length ? hints.join("\n") : "- (no named class; re-read the error text above)"}
Timings (ms per check; a big number means that check is sampling heavily — don't make it worse): ${JSON.stringify(report.timings || {})}.
Densest beat: ${report.densest ? `t=${report.densest.t}ms (contentPx=${report.densest.contentPx}) — keep that frame visually rich; a fix that empties it is a regression` : "unknown (no densest captured)"}.
General: zero JS errors, window.__time + window.__loop defined, no overlapping full-opacity
text, no dark frame at the loop seam, all elements animate.
Reply with the COMPLETE corrected file (every line, even parts not shown above) between ===HTML=== markers (keep TOPIC and ===README=== too).` });
    const fix = (await llm(messages)).content;
    const p2 = parse(fix, topic);
    html = p2.html;
    rememberSlug(prompt, topic);
  writeFileSync(path.join(folder, "index.html"), html + "\n");
    if (p2.readme !== readme) { readme = p2.readme; writeFileSync(path.join(folder, "README.md"), readme + "\n"); }
    report = await validateFolder(folder);
    pass = report.clean && report.seek && report.collisions && report.seam && report.readme;
  }
  const tps = first.usage?.completion_tokens && first.ms ? Math.round(first.usage.completion_tokens / (first.ms / 1000)) : null;
  return { folder, topic, pass, report, seconds: (Date.now() - t0) / 1000, fixPasses, tps, novelty: noveltyOf(html, topic), retemp: stuckRetryUsed };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const pfIdx = args.indexOf("--prompt-file");
  let prompt;
  if (pfIdx !== -1) {
    // multi-line prompts from a file (newlines preserved)
    const pf = args[pfIdx + 1];
    if (!pf) { console.error("usage: --prompt-file <path>"); process.exit(2); }
    prompt = readFileSync(pf, "utf8").trim();
  } else {
    prompt = args.filter((a) => a !== "--force").join(" ");
  }
  if (!prompt) { console.error("usage: node tool/generate.mjs \"<prompt>\" [--force | --prompt-file <path>]"); process.exit(2); }
  let g;
  try {
    g = await generate(prompt, { force });
  } catch (e) {
    console.error(`error: ${e.message}`);
    // count failed attempts in the trend too (no folder written on hard failure)
    try {
      appendFileSync(path.join(ROOT, "logs", "generations.jsonl"),
        JSON.stringify({ ts: new Date().toISOString(), prompt, topic: null, model: MODEL, seconds: null, lines: null, fixPasses: null, pass: 0, tps: null, novelty: null, error: e.message.slice(0, 200) }) + "\n");
    } catch {}
    process.exit(2);
  }
  console.log(JSON.stringify({ topic: g.topic, pass: g.pass, seconds: Math.round(g.seconds), errors: g.report.errors, novelty: g.novelty, checks: { clean: g.report.clean, seek: g.report.seek, collisions: g.report.collisions, seam: g.report.seam, readme: g.report.readme } }, null, 1));
  try {
    const html = readFileSync(path.join(g.folder, "index.html"), "utf8");
    appendFileSync(
      path.join(ROOT, "logs", "generations.jsonl"),
      JSON.stringify({ ts: new Date().toISOString(), prompt, topic: g.topic, model: MODEL, seconds: Math.round(g.seconds), lines: html.split("\n").length, fixPasses: g.fixPasses, pass: g.pass, tps: g.tps ?? null, novelty: g.novelty, retemp: g.retemp ?? false }) + "\n"
    );
  } catch {}
  console.log(g.folder);
  process.exit(g.pass ? 0 : 1);
}
