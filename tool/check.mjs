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

import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let score = 0;
let existingMax = 0;
let smokeMax = 110;
const skipGen = process.argv.includes("--skip-gen");
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

// --- score all existing graphics --------------------------------------------
const graphics = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(root, d.name, "index.html")))
  .map((d) => d.name);

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
    if (pts < 35) problems.push(`${name}: ${pts}/35 (${(r.errors || []).join("; ") || "check bits failed"})`);
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

for (const p of (skipGen ? [] : smoke)) {
  const res = spawnSync("node", [path.join(root, "tool", "generate.mjs"), p.prompt], {
    cwd: root, encoding: "utf8", timeout: 10 * 60 * 1000,
  });
  const folder = (res.stdout || "").trim().split("\n").pop();
  const f = folder && path.isAbsolute(folder) ? folder : path.join(root, folder || "");
  if (!folder || !existsSync(path.join(f, "index.html"))) {
    problems.push(`smoke "${p.prompt.slice(0, 40)}…": generation failed (${res.status})`);
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
console.log(`graphics: ${graphics.length}${skipGen ? "  [skip-gen]" : ""}  score: ${score}/${existingMax + smokeMax}`);
for (const p of problems) console.log(`  ✗ ${p}`);
console.log(`SCORE: ${score}`);
process.exit(existingPerfect && smokePerfect ? 0 : 1);
