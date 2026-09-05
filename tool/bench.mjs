#!/usr/bin/env node
// bench.mjs — run the full prompt bench, report pass rate, log the iteration.
// CLI: node tool/bench.mjs [limit] [--smoke-only]
// Appends one line to logs/iterations.jsonl and prints "BENCH: <N>/<total>".
import { readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { generate } from "./generate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const limit = process.argv.slice(2).find((a) => /^\d+$/.test(a));
const smokeOnly = process.argv.includes("--smoke-only");
const regen = process.argv.includes("--regen");
const { validateFolder } = await import("./validate.mjs");
const slugMap = (() => {
  const p = path.join(ROOT, "logs", "slug-map.jsonl");
  if (!existsSync(p)) return new Map();
  const m = new Map();
  for (const l of readFileSync(p, "utf8").split("\n").filter(Boolean)) {
    try { const o = JSON.parse(l); m.set(o.prompt, o.topic); } catch {}
  }
  return m;
})();

async function main() {
const prompts = readFileSync(path.join(ROOT, "tool", "bench", "prompts.jsonl"), "utf8")
  .split("\n").filter(Boolean)
  .map((l) => JSON.parse(l))
  .filter((p) => (smokeOnly ? p.smoke : true))
  .slice(0, limit ? +limit : Infinity);

const t0 = Date.now();
let pass = 0;
const failures = [];
const rows = [];
for (let i = 0; i < prompts.length; i++) {
  const p = prompts[i];
  process.stderr.write(`[bench ${i + 1}/${prompts.length}] ${p.prompt.slice(0, 60)}\n`);
  try {
    const known = slugMap.get(p.prompt);
    const knownFolder = known && existsSync(path.join(ROOT, known)) ? path.join(ROOT, known) : null;
    let g;
    if (knownFolder && !regen) {
      const t = Date.now();
      const report = await validateFolder(knownFolder);
      g = { topic: known, pass: report.clean && report.seek && report.collisions && report.seam && report.readme, report, seconds: (Date.now() - t) / 1000, reused: true };
    } else {
      g = await generate(p.prompt, { force: regen, allowExisting: true });
    }
    if (g.pass) pass++;
    else failures.push(`${g.topic}: ${g.report.errors.slice(0, 2).join("; ")}`);
    rows.push({ topic: g.topic, seconds: Math.round(g.seconds), fix: g.reused ? 0 : (g.fixPasses || 0), pass: g.pass });
    process.stderr.write(`  -> ${g.pass ? "PASS" : "FAIL"} in ${Math.round(g.seconds)}s\n`);
  } catch (e) {
    failures.push(`${p.prompt.slice(0, 40)}: ${e.message}`);
    rows.push({ topic: p.prompt.slice(0, 28), seconds: null, fix: null, pass: false });
    process.stderr.write(`  -> ERROR ${e.message}\n`);
  }
}
const total = prompts.length;
const seconds = Math.round((Date.now() - t0) / 1000);
mkdirSync(path.join(ROOT, "logs"), { recursive: true });
appendFileSync(path.join(ROOT, "logs", "iterations.jsonl"),
  JSON.stringify({ ts: new Date().toISOString(), kind: "bench", score: pass, max: total,
    failures, seconds, fix: "bench run" }) + "\n");
console.log(`BENCH: ${pass}/${total} in ${seconds}s`);
for (const f of failures) console.log(`  ✗ ${f}`);
// per-prompt timing table
console.log("\n" + "topic".padEnd(30) + " " + "sec".padStart(5) + " " + "fix".padStart(3) + " " + "pass");
for (const r of rows)
  console.log(r.topic.slice(0, 30).padEnd(30) + " " + String(r.seconds ?? "-").padStart(5) + " " + String(r.fix ?? "-").padStart(3) + " " + (r.pass ? "ok" : "FAIL"));
process.exit(pass === total ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
