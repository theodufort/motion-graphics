# IMPROVEMENTS (loop backlog — take top open item each iteration)

- [x] tool/check.mjs + tool/bench/prompts.jsonl: add `tool/bench.mjs` (10/10 pass, 2832s) that
  runs all 10 bench prompts via generate.mjs and reports pass rate;
  acceptance: `node tool/bench.mjs` prints N/10 and appends to
  logs/iterations.jsonl.
- [x] tool/check.mjs: append `{ts, score, failures, seconds}` to
  logs/iterations.jsonl on every check run;
  acceptance: file gains one line per `./check.sh` run.
- [x] tool/generate.mjs: terser data-driven HTML (rule 15);
  acceptance met: token-bucket-rate-limiter generated 117-line file (vs
  380-400 before), passed 5/5. Wall time is LLM-bound (~19 tok/s output,
  250-400s); reasoning_effort API param has no effect. Line count is the
  only controllable lever — treat ~150 lines as the quality target.
- [x] tool/validate.mjs: seam check currently uses label-density only; add a
  pixel-brightness cross-check (mean content-pixel luminance at seam vs
  mid-loop) and a synthetic dark-seam fixture under tool/fixtures/;
  acceptance: fixture graphic fails the seam check, real graphics pass.
- [x] tool/validate.mjs: collision findings deduped per pair;
  acceptance met: fixtures/text-overlap reports '"alpha label" x "beta label" ×4',
  all 22 graphics still 770/770.
- [x] README.md / AGENTS.md: "The vision pass" section with the 6-shot
  table (t15/t40/t65/t90, seam-a, seam-b) + review checklist.

- [x] tool/check.mjs + check.sh: --skip-gen flag;
  acceptance met: 16s for 22 graphics, same SCORE format.
- [x] tool/check.mjs: concurrency-4 validation pool (MG_CONCURRENCY);
  acceptance met: 22 graphics in 16s (< 90s target).
- [x] tool/check.mjs: smoke folders reused from logs/slug-map.jsonl on
  default runs; --regen forces regeneration;
  acceptance met: full default ./check.sh = 880/880 in 20s (was ~9 min).
- [x] tool/generate.mjs: logs/generations.jsonl metadata;
  acceptance met: {ts, prompt, topic, model, seconds:248, lines:129,
  fixPasses, pass:1} appended per run.
- [x] tool/bench.mjs: folder-reuse on re-runs (slug map) + --regen;
  acceptance met: full reuse re-run = BENCH: 10/10 in 21s (vs 1704s full
  regen; < 5 min target).
- [x] tool/validate.mjs: JSON report now includes shotsPath (+ shots
  array); acceptance met: dir exists, 6 files listed.
- [x] tool/bench/prompts.jsonl: expanded to 15 prompts (5 new domains
  generated clean); acceptance met: BENCH: 15/15 in 38s (reuse path).- [x] check.mjs: --json flag (single JSON line: ts, score, max,
  graphics, problems[]); acceptance met: parsed ok, 805/805 on 23
  graphics.".
- [x] tool/validate.mjs: viewport-resize robustness check (1366x768
  mid-validation + re-seek, report JSON "resize": 0|1, enforced by
  check.mjs); acceptance met: all 23 graphics resize:1, 805/805.
- [x] repo hygiene: duplicates consolidated (event-loop-timers-io-
  microtasks, service-mesh-circuit-breaker removed; slug-map slugs
  canonical); acceptance met: 21 graphics, 735/735.
- [x] tool/generate.mjs: prompt rule 16 (label fit via measureText);
  acceptance met: mvcc-snapshot-reads, load-balancer-health-checks,
  tcp-congestion-control all pass 5/5, 0 collision findings, 0 fix passes.
- [x] tool/validate.mjs: min-area sanity ("content" bit, densest frame
  >= 500 px); acceptance met: fixtures/blank-canvas fails content:0,
  all 26 real graphics pass (910/910).- [ ] README.md: document MG_CONCURRENCY, MG_LLM_MODEL, MG_FIX_PASSES,
  MG_TIMEOUT_MS env vars in the tooling section;
  acceptance: all four vars named with defaults in README.
