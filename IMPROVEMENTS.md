# IMPROVEMENTS (loop backlog — take top open item each iteration)

- [ ] tool/check.mjs + tool/bench/prompts.jsonl: add `tool/bench.mjs` that
  runs all 10 bench prompts via generate.mjs and reports pass rate;
  acceptance: `node tool/bench.mjs` prints N/10 and appends to
  logs/iterations.jsonl.
- [ ] tool/check.mjs: append `{ts, score, failures, seconds}` to
  logs/iterations.jsonl on every check run;
  acceptance: file gains one line per `./check.sh` run.
- [ ] tool/generate.mjs: cut wall time — instruct terser HTML in the system
  prompt (~120-160 lines target) and lower max_tokens;
  acceptance: a smoke prompt generates + passes in ≤ 150s.
- [ ] tool/validate.mjs: seam check currently uses label-density only; add a
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
