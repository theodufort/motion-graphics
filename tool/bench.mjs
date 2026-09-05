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
let prompts = readFileSync(path.join(ROOT, "tool", "bench", "prompts.jsonl"), "utf8")
  .split("\n").filter(Boolean)
  .map((l) => JSON.parse(l))
  .filter((p) => (smokeOnly ? p.smoke : true));
const topicsIdx = process.argv.indexOf("--topics");
if (topicsIdx >= 0 && process.argv[topicsIdx + 1]) {
  const wanted = process.argv[topicsIdx + 1].split(",").map((t) => t.trim());
  prompts.forEach((p) => (p._topicGuess = p.prompt.slice(0, 40)));
  // match by slug-map topic or prompt keywords
  const map = new Map();
  try {
    for (const l of readFileSync(path.join(ROOT, "logs", "slug-map.jsonl"), "utf8").split("\n"))
      if (l.trim()) { const e = JSON.parse(l); map.set(e.prompt, e.topic); }
  } catch {}
  const match = (p) => {
    const topic = map.get(p.prompt) || "";
    return wanted.some((w) => topic.includes(w) || p.prompt.includes(w));
  };
  if (!wanted.length) process.exit(2);
  prompts = prompts.filter(match);
  if (!prompts.length) {
    // "matched nothing" should not be silent — name what IS available
    const avail = [...new Set([...map.values()].filter(Boolean))].slice(0, 12);
    console.error(`warning: no bench prompt matches ${wanted.map((w) => `"${w}"`).join(", ")}\navailable topics: ${avail.join(", ")}`);
    process.exit(2);
  }
}
if (limit) prompts = prompts.slice(0, +limit);

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
      // carry the original generation's tps from the log (reuse itself has no LLM)
      let origTps = null;
      try {
        const lines = readFileSync(path.join(ROOT, "logs", "generations.jsonl"), "utf8").trim().split("\n").filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          let e;
          try { e = JSON.parse(lines[i]); } catch { continue; }
          if (e.topic === known && e.tps) { origTps = e.tps; break; }
        }
      } catch { /* no log */ }
      g = { topic: known, pass: report.clean && report.seek && report.collisions && report.seam && report.readme, report, seconds: (Date.now() - t) / 1000, reused: true, tps: origTps, labels: typeof report.labels === "number" ? report.labels : null };
    } else {
      g = await generate(p.prompt, { force: regen, allowExisting: true });
    }
    if (g.pass) pass++;
    else failures.push(`${g.topic}: ${g.report.errors.slice(0, 2).join("; ")}`);
    rows.push({ topic: g.topic, seconds: Math.round(g.seconds), fix: g.reused ? 0 : (g.fixPasses || 0), pass: g.pass, tps: g.tps ?? null, warn: g.report?.warnings?.length ?? 0 });
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
appendFileSync(benchLog, JSON.stringify({ ts: new Date().toISOString(), pass, total, seconds, warnings: rows.reduce((a, x) => a + (x.warn ?? 0), 0), rows }) + "\n");
console.log(`BENCH: ${pass}/${total} in ${seconds}s`);
for (const f of failures) console.log(`  ✗ ${f}`);
// per-prompt timing table
console.log("\n" + "topic".padEnd(30) + " " + "sec".padStart(5) + " " + "fix".padStart(3) + " " + "pass".padStart(4) + " " + "tps".padStart(5) + " " + "warn".padStart(4) + " " + "lbl".padStart(4));
for (const r of rows)
  console.log(r.topic.slice(0, 30).padEnd(30) + " " + String(r.seconds ?? "-").padStart(5) + " " + String(r.fix ?? "-").padStart(3) + " " + (r.pass ? "ok" : "FAIL") + " " + String(r.tps ?? "-").padStart(5) + " " + String(r.warn ?? 0).padStart(4) + " " + String(r.labels ?? "-").padStart(4));
process.exit(pass === total ? 0 : 1);
}

// --- --compare <before> <after>: diff two bench timing tables ---------------
function parseTable(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  const out = new Map();
  for (const l of lines) {
    const m = l.match(/^\S.{4,29}\s+([0-9]+|-)\s+([0-9]+|-)\s+(ok|FAIL)\s+([0-9.]+|-)?\s*(\d+)?\s*(\d+|-)?\s*$/);
    if (!m) continue;
    const topic = l.slice(0, 30).trimEnd();
    out.set(topic, { sec: m[1] === "-" ? null : +m[1], fix: m[2] === "-" ? null : +m[2], pass: m[3] === "ok", tps: m[4] === undefined || m[4] === "-" ? null : +m[4], warn: m[5] === undefined ? null : +m[5], labels: m[6] === undefined || m[6] === "-" ? null : +m[6] });
  }
  return out;
}
function readJsonMaybe(file) {
  try { const d = JSON.parse(readFileSync(file, "utf8")); if (d && d.summary) return d; } catch {}
  return null;
}
function compare(beforePath, afterPath) {
  const a = parseTable(beforePath), b = parseTable(afterPath);
  // check --json payloads (not bench tables) also compare: wallMs delta
  const ja = readJsonMaybe(beforePath), jb = readJsonMaybe(afterPath);
  if (ja && jb) {
    const dw = Math.round(((jb.summary.wallMs - ja.summary.wallMs) / ja.summary.wallMs) * 100);
    console.log(`wall ${ja.summary.wallMs}ms -> ${jb.summary.wallMs}ms (${dw > 0 ? "+" : ""}${dw}%)  medianFrames ${ja.summary.medianFramesMs ?? "?"} -> ${jb.summary.medianFramesMs ?? "?"}`);
    process.exit(0);
  }
  const topics = [...new Set([...a.keys(), ...b.keys()])];
  let changed = 0;
  const hasTps = [...a.values()].some((x) => x.tps != null) || [...b.values()].some((x) => x.tps != null);
  console.log("topic".padEnd(30) + " before".padStart(8) + " after".padStart(8) + (hasTps ? " tpsB".padStart(5) + " tpsA".padStart(5) : "") + "  delta");
  for (const t of topics) {
    const x = a.get(t), y = b.get(t);
    if (!x || !y || x.sec == null || y.sec == null) {
      console.log(t.slice(0, 30).padEnd(30) + String(x?.sec ?? "-").padStart(8) + String(y?.sec ?? "-").padStart(8) + "  " + (x ? "only-in-before" : "only-in-after"));
      changed++;
      continue;
    }
    const d = x.sec == null || y.sec == null ? null : Math.round(((y.sec - x.sec) / x.sec) * 100);
    const status = x.pass === y.pass ? "" : `  STATUS ${x.pass ? "ok" : "FAIL"}->${y.pass ? "ok" : "FAIL"}`;
    const warn = x.warn != null && y.warn != null && x.warn !== y.warn ? `  warns ${x.warn}->${y.warn}` : "";
    // text-density delta: "got shorter" regressions that timing alone misses
    const lbl = x.labels != null && y.labels != null && x.labels !== y.labels ? `  labels ${x.labels}->${y.labels}${y.labels < x.labels ? " (shorter)" : " (denser)"}` : "";
    if (Math.abs(d ?? 999) > 10 || status || warn || lbl) {
      console.log(t.slice(0, 30).padEnd(30) + String(x.sec ?? "-").padStart(8) + String(y.sec ?? "-").padStart(8) + (hasTps ? String(x.tps ?? "-").padStart(5) + String(y.tps ?? "-").padStart(5) : "") + `  ${d == null ? "" : `${d > 0 ? "+" : ""}${d}% ${d > 0 ? "(slower)" : "(faster)"}`}${status}${warn}${lbl}`);
      changed++;
    }
  }
  // first-pass trend: fix-pass distribution per run (0 = clean on the first try)
  const dist = (m) => {
    const d = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const v of m.values()) d[v.fix ?? 0] = (d[v.fix ?? 0] || 0) + 1;
    return d;
  };
  const db = dist(a), da = dist(b);
  console.log("first-pass (fix=0): " + db[0] + " -> " + da[0] + (db[0] < da[0] ? " (improved)" : db[0] > da[0] ? " (regressed)" : ""));
  console.log("fix-pass mix      : " + ["0", "1", "2", "3"].map((k) => `${k}x:${db[k] || 0}`).join(" ") + "  ->  " + ["0", "1", "2", "3"].map((k) => `${k}x:${da[k] || 0}`).join(" "));
  console.log(`\n${changed} row(s) changed >10%, flipped status, or drifted in warns/labels (of ${topics.length})`);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ci = process.argv.indexOf("--compare");
  if (ci !== -1) {
    const before = process.argv[ci + 1], after = process.argv[ci + 2];
    if (!before || !after) { console.error("usage: node tool/bench.mjs --compare <before.log> <after.log>"); process.exit(2); }
    compare(before, after);
  }
  if (process.argv.includes("--trend")) {
    // first-pass (fix=0) rate + failed attempts over the last 5 bench runs
    const lines = readFileSync(path.join(ROOT, "logs", "bench-runs.jsonl"), "utf8").trim().split("\n").filter(Boolean);
    const runs = lines.slice(-5).map((l) => JSON.parse(l));
    // failed generation attempts (topic:null lines) from generations.jsonl
    let failed = [];
    try {
      failed = readFileSync(path.join(ROOT, "logs", "generations.jsonl"), "utf8").trim().split("\n").filter(Boolean)
        .map((l) => JSON.parse(l)).filter((g) => g.topic === null && g.error);
    } catch { /* no log yet */ }
    for (const r of runs) {
      const f0 = r.rows.filter((x) => (x.fix ?? 0) === 0).length;
      const since = r.ts;
      // failures after the previous run (or the run window for the first)
      const idx = lines.filter((l) => JSON.parse(l).ts <= since).length - 1;
      const prev = idx > 0 ? JSON.parse(lines[idx - 1]).ts : "1970";
      const f = failed.filter((g) => g.ts > prev && g.ts <= since).length;
      const tps = r.rows.map((x) => x.tps).filter((v) => v != null).sort((a, b) => a - b);
      const med = tps.length ? (tps.length % 2 ? tps[(tps.length - 1) / 2] : (tps[tps.length / 2 - 1] + tps[tps.length / 2]) / 2) : null;
      console.log(r.ts.slice(0, 16).replace("T", " ") + "  " + r.pass + "/" + r.total + " pass  fix=0: " + f0 + "/" + r.rows.length + "  warn: " + (r.warnings ?? "-") + "  failed: " + f + "  tps: " + (med == null ? "-" : Math.round(med)));
    }
    process.exit(0);
  }
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
