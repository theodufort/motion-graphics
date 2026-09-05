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
const benchLog = path.join(ROOT, "logs", "bench-runs.jsonl");
appendFileSync(benchLog, JSON.stringify({ ts: new Date().toISOString(), pass, total, seconds, rows }) + "\n");
console.log(`BENCH: ${pass}/${total} in ${seconds}s`);
for (const f of failures) console.log(`  ✗ ${f}`);
// per-prompt timing table
console.log("\n" + "topic".padEnd(30) + " " + "sec".padStart(5) + " " + "fix".padStart(3) + " " + "pass");
for (const r of rows)
  console.log(r.topic.slice(0, 30).padEnd(30) + " " + String(r.seconds ?? "-").padStart(5) + " " + String(r.fix ?? "-").padStart(3) + " " + (r.pass ? "ok" : "FAIL"));
process.exit(pass === total ? 0 : 1);
}

// --- --compare <before> <after>: diff two bench timing tables ---------------
function parseTable(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  const out = new Map();
  for (const l of lines) {
    const m = l.match(/^\S.{4,29}\s+([0-9]+|-)\s+([0-9]+|-)\s+(ok|FAIL)\s*$/);
    if (!m) continue;
    const topic = l.slice(0, 30).trimEnd();
    out.set(topic, { sec: m[1] === "-" ? null : +m[1], pass: m[3] === "ok" });
  }
  return out;
}
function compare(beforePath, afterPath) {
  const a = parseTable(beforePath), b = parseTable(afterPath);
  const topics = [...new Set([...a.keys(), ...b.keys()])];
  let changed = 0;
  console.log("topic".padEnd(30) + " before".padStart(8) + " after".padStart(8) + "  delta");
  for (const t of topics) {
    const x = a.get(t), y = b.get(t);
    if (!x || !y || x.sec == null || y.sec == null) {
      console.log(t.slice(0, 30).padEnd(30) + String(x?.sec ?? "-").padStart(8) + String(y?.sec ?? "-").padStart(8) + "  " + (x ? "only-in-before" : "only-in-after"));
      changed++;
      continue;
    }
    const d = Math.round(((y.sec - x.sec) / x.sec) * 100);
    if (Math.abs(d) > 10) {
      console.log(t.slice(0, 30).padEnd(30) + String(x.sec).padStart(8) + String(y.sec).padStart(8) + `  ${d > 0 ? "+" : ""}${d}% ${d > 0 ? "(slower)" : "(faster)"}`);
      changed++;
    }
  }
  console.log(`\n${changed} row(s) changed >10% (of ${topics.length})`);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ci = process.argv.indexOf("--compare");
  if (ci !== -1) {
    const before = process.argv[ci + 1], after = process.argv[ci + 2];
    if (!before || !after) { console.error("usage: node tool/bench.mjs --compare <before.log> <after.log>"); process.exit(2); }
    compare(before, after);
  }
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
