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
- [ ] tool/validate.mjs: dedupe collision findings across parked frames
  (same pair at 3+ times = 1 finding with count);
  acceptance: JSON `errors` lists a pair once with "×N".
- [ ] README.md / AGENTS.md: add a short "vision pass" note — how a
  human/vision model reviews tool/shots/<topic>/ after generation;
  acceptance: section exists and names the 6 shot files.
- [ ] tool/generate.mjs: guard against re-generating into an existing
  folder (refuse or require --force) so bench runs never clobber the
  curated 9; acceptance: second run with same slug exits 2 without
  overwriting (unless --force).

- [x] tool/check.mjs + check.sh: --skip-gen flag;
  acceptance met: 16s for 22 graphics, same SCORE format.
- [x] tool/check.mjs: concurrency-4 validation pool (MG_CONCURRENCY);
  acceptance met: 22 graphics in 16s (< 90s target).
