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

async function main() {
const prompts = readFileSync(path.join(ROOT, "tool", "bench", "prompts.jsonl"), "utf8")
  .split("\n").filter(Boolean)
  .map((l) => JSON.parse(l))
  .filter((p) => (smokeOnly ? p.smoke : true))
  .slice(0, limit ? +limit : Infinity);

const t0 = Date.now();
let pass = 0;
const failures = [];
for (let i = 0; i < prompts.length; i++) {
  const p = prompts[i];
  process.stderr.write(`[bench ${i + 1}/${prompts.length}] ${p.prompt.slice(0, 60)}\n`);
  try {
    const g = await generate(p.prompt);
    if (g.pass) pass++;
    else failures.push(`${g.topic}: ${g.report.errors.slice(0, 2).join("; ")}`);
    process.stderr.write(`  -> ${g.pass ? "PASS" : "FAIL"} in ${Math.round(g.seconds)}s\n`);
  } catch (e) {
    failures.push(`${p.prompt.slice(0, 40)}: ${e.message}`);
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
process.exit(pass === total ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
