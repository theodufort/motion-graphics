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
  11111110).
- [x] generate.mjs --prompt-file <path> (newlines preserved); acceptance
  met: two-line gossip-protocol file -> gossip-anti-entropy-sync/, pass,
  slug equivalence with inline form verified. (generate.sh just execs
  generate.mjs, so both pick up the flag.)
- [x] PROGRESS.md refreshed: 1155/1155, 33 graphics, 8-bit --watch,
  manifest.json, tps logging, bench 20/20 + timing table, prompt-file
  flag, rules 1-18 — all facts present.- [x] validate.mjs: report.timings (frames/seam/collisions/frozen/resize
  ms); acceptance met: 5 numeric keys (1nf: frames 1158, seam 651,
  collisions 3, frozen 1244, resize 309); 1155/1155 after patch.
- [x] check.mjs --quick (MG_QUICK=1: 2 park frames, 5 frozen samples,
  resize skipped, "[quick]" marker); NOTE: on a loaded host (load 6,
  43GB/62GB used) quick measured no faster than full (37.8s vs 38.3s,
  33 graphics) — wall time is launch/screenshot-I/O bound, not check
  phase bound; per-graphic timings in the report (frozen ~1.2s dominates
  check phases). Also: browser-pool worker refactor was REVERTED (34s
  vs 20s baseline) but the validateWithBrowser/validateFolder split in
  validate.mjs is kept as the API for future pool work.
  Re-test on idle host (iter 38): quick 38.2s vs full 39.2s (0.97) —
  wall time is per-graphic fixed-cost bound (launch/goto/6 PNGs); quick
  is a per-folder (watch/--only) accelerator, not a bulk-run one.
  ASSUMPTIONS.md corrected (22->33 graphics explained the 20->38s drift,
  not host load).- [x] tool/validate.mjs: seam label continuity (seamContinuity bit;
  seam-a labels without digits must reappear in some post-seam frame;
  digit labels skipped as live counters); acceptance met:
  fixtures/lost-label-seam flagged, all 33 graphics clean, 1155/1155.
- [x] tool/close.sh helper: a small script that closes an
  IMPROVEMENTS.md item by unique substring and VERIFIES the "[x]" line
  exists afterwards (exit 1 otherwise), always preserving the trailing
  newline; acceptance: closing a deliberately fused item succeeds and
  grep -c "^- \[x\]" increases by 1.
- [x] validate.mjs: cut PNG output in --quick (skip t-seam PNGs, keep 2
  frames + manifest); acceptance: tool/shots/<topic> has 2 PNGs after a
  quick run and manifest lists exactly 2.
- [x] bench: --compare <before.log> <after.log> diffing per-prompt
  timing tables; acceptance: prints rows where seconds changed by >10%.
- [x] validate.mjs: seam pixel cross-check should also probe at seam-b+600ms
  (asymmetry: a dark frame just after the wrap is currently caught only if
  it lands in the 4-point window); acceptance: a fixture with a dark band
  at 300-900ms after wrap is flagged.
- [x] check.mjs: --json should include per-graphic score map (topic -> pts)
  for downstream tooling; acceptance: JSON has "graphicsScores" object.
- [x] generate.mjs: cap the fix loop's HTML at 260 lines before re-send
  (rule 15 target); acceptance: a 400-line generated file is trimmed in
  the fix prompt, not re-sent whole.
- [x] validate.mjs: collision check should also flag labels whose rects
  cover >85% of another label's rect (containment, not just 15%+ IoU);
  acceptance: a fixture with one label fully under another is flagged.
- [x] bench.mjs: --compare should also compare pass/FAIL status changes
  (a row that went ok->FAIL is always printed, even with small delta).
- [x] check.mjs: --only <topic> --watch combo (watch a single folder's
  index.html with per-file debounce); acceptance: editing the one file
  re-validates only that folder.
- [x] docs: README tooling table should list close.sh (verified item
  closer) and MG_DEBUG=1 (fillText rect dump); acceptance: both appear
  with one-line usage in README.md.
- [x] bench.mjs: --topics a,b,c to run a subset of the 20 prompts;
  acceptance: --topics kafka-exactly-once-path,sqlite-wal-checkpoint
  runs exactly those two and prints BENCH: 2/2.
- [x] validate.mjs: README H1 must contain the folder name's topic words
  (catches copied-pasted READMEs from another graphic); acceptance: a
  fixture with the wrong H1 is flagged with "readme".
- [x] validate.mjs: frozen probe should also detect near-frozen (delta < 2%
  but > 0.5%) and report it as a soft warning in errors without failing;
  acceptance: a fixture moving one pixel per frame warns but keeps score.
- [x] check.sh: --since <git-rev> to validate only folders changed since
  a commit; acceptance: after touching one folder, --since HEAD~1
  validates exactly that folder.
- [x] bench.mjs: record per-prompt tps in bench-runs.jsonl (currently
  only in generations.jsonl); acceptance: bench-runs rows carry tps.
- [x] check.mjs: print warnings[] from any graphic in the human (non-json)
  verdict too, so near-frozen notices are visible without --json;
  acceptance: near-frozen fixture via --only shows the warning line.
- [x] bench.mjs: reuse-path rows should carry validate timings (median of
  the last N runs from bench-runs.jsonl) for --compare; acceptance:
  --compare shows a timings column when both logs have it.
- [x] AGENTS.md: document the new tools (close.sh, MG_DEBUG, --since,
  --watch --only, near-frozen band) in the tooling section; acceptance:
  AGENTS.md mentions all five.
- [x] fix the two near-frozen graphics (load-balancer-health-checks 1%,
  lsm-tree-compaction 2%): add a per-beat state change (counter tick,
  pulse, position drift) so each clears >2%; acceptance: full check
  prints zero ⚠ lines and 1265/1265.
- [x] validate.mjs: seamContinuity should also check the reverse
  direction (labels absent at seam-a but present at seam-b+600ms with
  alpha >0.6 are fine — but labels REAPPEARING at seam-b with a pop-in
  of >50% alpha in <100ms are flagged); acceptance: fixture with a
  hard-pop reappearing label is flagged.
- [x] check.mjs: --json should embed the warnings (graphicsWarnings)
  inside the main JSON object, not as a second JSON line; acceptance:
  single-line parse yields graphicsWarnings key.
- [x] generate.mjs: surface the new checks in the fix loop (the re-send
  instruction should mention px-churn motion, seam fades, label fits, and
  H1/topic match so the model's first fix pass addresses the actual
  failure); acceptance: a fix-pass failure message names the failing
  check class.
- [x] bench: add a "first-pass rate" trend line to bench-runs.jsonl
  consumers — print per-run fix-pass distribution (0/1/2/3) in the
  --compare footer (the 0/1/2/3 per-run distribution); acceptance: two runs with different fix-pass mixes
  show the distribution rows.
- [x] README: add the seam-pop-in row to the negative fixtures table
  section that lists fixtures near "dark-band-post" (it currently lives
  at the file bottom — move the row into the main table); acceptance:
  exactly one fixtures table contains seam-pop-in.
- [x] validate.mjs: the seam-pop-in and seamContinuity checks should also
  run in MG_QUICK mode today (they do) — but the pop-in check needs a
  matching quick-mode fixture regression run documented; acceptance:
  README notes which checks quick mode skips and which it does not.
- [x] generate.mjs: after a successful generate, diff the new folder
  against the 5 newest generated folders and log a "novelty" score
  (fraction of label texts unseen in prior generations) to
  logs/generations.jsonl; acceptance: two different prompts produce
  different novelty values.
- [x] check.mjs: --watch should also re-run when the README.md of a
  watched folder changes (H1 check depends on it); acceptance: editing
  a watched README triggers a diff line without touching index.html.
- [x] check.sh: add a --fast flag that runs the full suite in quick
  mode (MG_QUICK=1) and labels the score line "(quick)"; acceptance:
  ./check.sh --skip-gen --fast prints a quick score line and matches a
  plain quick run.
- [x] bench: track first-pass rate over time in a one-line trend in
  PROGRESS.md (read the last N bench-runs.jsonl entries and print
  fix=0 ratio); acceptance: running the bench appends nothing but a
  helper `node tool/bench.mjs --trend` prints the last 5 runs' fix=0
  counts.
- [x] validate.mjs: add an optional pixel-margin check — flag any
  content pixel within 8px of the canvas edge at any parked frame
  (clipped labels); acceptance: a fixture with a label flush at the
  right edge is flagged, real graphics pass.
- [x] check.mjs --watch: also re-validate when README.md changes (currently
  index.html only); acceptance: editing a README fires a re-check and the
  H1 topic-word check result updates.
- [x] tool/generate.mjs: cap fix-pass retries on repeated IDENTICAL errors
  (if the same error string appears on 2 consecutive fix passes, stop and
  report); acceptance: a mock-LLM loop that returns the same broken HTML
  exits after 2 passes instead of 3.
- [x] bench: add a per-prompt tps (tokens/sec) column to the timing table
  from the logged generation timings; acceptance: bench --smoke-only
  prints a tps column alongside seconds.
- [ ] check.sh --json: include a `warnings` array with the per-graphic
  ⚠ lines (currently graphicsWarnings exists but the top-level warnings
  list is absent); acceptance: --json output parses and the edge-clip
  ⚠ on dns-recursive-resolution appears in it.
- [ ] validate.mjs: log per-check timings for the clip probe and the
  README check into report.timings (only frames/seam/collisions/frozen/
  resize are timed today); acceptance: timings has clipMs and readmeMs
  keys in a normal run.
- [ ] docs: GOAL.md "measurable criteria" should mention the warning-tier
  checks (edge-clip, near-frozen) so the criteria match the current
  validator; acceptance: GOAL.md lists both warning classes.
