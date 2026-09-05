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
  all 26 real graphics pass (910/910).- [x] README.md: Environment knobs table (MG_LLM_BASE, MG_LLM_MODEL,
  MG_FIX_PASSES, MG_TIMEOUT_MS, MG_CONCURRENCY, MG_ALLOW_EXISTING) with
  defaults; acceptance met.
- [x] tool/generate.mjs: prompt rule 17 (per-beat visible motion);
  acceptance met: dns-recursive-resolution + bgp-best-path-selection
  pass 5/5, 40%/65% shots differ 22.3% / 6.2% content px (> 5%).- [x] tool/validate.mjs: frozen-animation probe (25 loop-wide samples;
  "frozen" flag only if MAX content-px delta < 0.5% — first 9×200ms
  window version false-positived on beat-hold regions, replaced);
  acceptance met: fixtures/static-canvas flagged, all 28 graphics
  unflagged (980/980).- [x] check.sh/check.mjs: --only <topic> (single-folder validation,
  smokeMax=0, exit 2 on unknown topic); acceptance met: 1nf in 5s,
  unknown topic exits 2.- [x] PROGRESS.md: refreshed (980/980, bench 17/17 in 51s, 8 validate
  checks, 4 fixtures, slug-map workflow, flag reference).
- [x] tool/validate.mjs: label-visibility probe ("visibility" bit;
  flags labels in EVERY parked frame with max alpha < 0.15; also fixed
  alpha-0 parse bug: `parseFloat || 1` -> `?? 1`); acceptance met:
  fixtures/invisible-label flagged, all 28 graphics unflagged (980/980).- [x] tool/generate.mjs: llm() retry (1x, 5s backoff) for AbortError/
  network errors only; acceptance met: hung mock → timeout → retry
  succeeds ("RETRY-OK"), HTTP 500 → no retry, HTTP 400 → no retry
  (verified against mock servers + real proxy 400).- [x] tool/bench/prompts.jsonl: 20 prompts; acceptance met: BENCH: 20/20
  (3 fresh gens: HTTP/2 multiplexing 191s, Kafka partitioner 190s,
  SQLite WAL 216s — all first-pass pass, 0 fix passes).- [x] README.md: "Negative fixtures" section lists all five fixtures
  (dark-seam, text-overlap, blank-canvas, static-canvas, invisible-label)
  with the check each targets and the one-liner to run.- [x] tool/bench.mjs: per-prompt timing table (topic, sec, fix, pass)
  printed after the BENCH line; acceptance met: 20-row table + BENCH line
  (20/20 in 76s reuse).- [x] tool/generate.mjs: generations.jsonl entries carry "tps" (usage.
  completion_tokens / llm ms); acceptance met: fresh WebSocket generate
  logged tps=39 (202s, first-pass pass -> websocket-protocol-flow/).- [x] validate.mjs: manifest.json written to tool/shots/<topic>/ with
  per-shot {file, t, contentPx, seam}; acceptance met: 6 entries for the
  actual 4-frame + 2-seam layout (the item's "7 = 6-shot + seam" assumed
  a 6-frame layout; corrected in ASSUMPTIONS.md).- [x] check.mjs --watch (recursive fs.watch, 1s debounce, per-topic
  8-bit line clean/seek/collisions/seam/readme/content/visibility/!frozen
  with "(was ...)"); acceptance met: edited 1nf index.html -> line in
  ~6s (1s debounce + full validate); bit diff verified by swapping in the
  static-canvas fixture (11111110, frozen error) then restoring (was
  11111110).- [ ] tool/generate.sh: --prompt-file flag (read prompt from a file,
  newlines preserved); acceptance: a two-line prompt file generates the
  same topic as the inline form.
- [x] PROGRESS.md refreshed: 1155/1155, 33 graphics, 8-bit --watch,
  manifest.json, tps logging, bench 20/20 + timing table, prompt-file
  flag, rules 1-18 — all facts present.- [ ] tool/validate.mjs: expose per-check timings in the JSON report
  (seek/collisions/seam/visibility ms); acceptance: report has a
  "timings" object with 4+ numeric keys.
- [ ] check.sh: --quick mode (validate with MG_QUICK=1: 3 park frames
  instead of 4, no resize step); acceptance: --quick on 33 graphics
  finishes < 12s and reports a quick-mode marker.
- [ ] tool/validate.mjs: seam label continuity — entity labels present at
  seam-a should reappear by seam-b+600ms (no label teleport/vanish);
  acceptance: a fixture that kills a label at the wrap is flagged.
