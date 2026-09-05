# GOAL — prompt-to-graphic generation tool with vision-validated self-improvement

## Objective

Turn this repo into a fast, local, **prompt → validated motion graphic** tool:
`./tool/generate.sh "make a motion graphic about X"` must produce a compliant
`<topic>/index.html` (+ README) that passes headless visual validation,
without manual intervention. Validation is **vision + deterministic probes**:
screenshots of parked frames saved to disk (vision-inspectable) plus
`measureText` collision, dark-seam, pageerror and seek-hook checks. Failures
are fed back to the LLM for automatic fix passes — a self-improving loop.

## Current state (baseline)

- 9 existing graphic folders, all canvas-based, all expose `window.__time`.
- No automation, no tests, no `package.json`, no check script.
- `skills/motion-graphics/SKILL.md` = generation spec (canvas architecture,
  brand tokens, anti-patterns); `skills/motion-graphic-validation/SKILL.md` =
  validation loop (vision-first, measurement tie-breaker).
- Environment: Node 22, npm+internet (playwright installable), local
  **llama.cpp server on `http://127.0.0.1:8123`** (OpenAI-compatible
  `/v1/chat/completions`), model **`Qwen3.8-27b-coding`** (~19 tok/s,
  reasoning model — responses put analysis in `reasoning_content`, final
  text in `content`; budget `max_tokens` ≥ 16000). Ollama is NOT usable
  for this (operator restriction + 35b doesn't fit RAM). No external API
  keys; generation is fully local.

## Scope

- `tool/` directory: generator, validator, check harness, bench prompts.
- Generator: `tool/generate.mjs <prompt>` (+ thin `generate.sh`). Builds a
  prompt from the SKILL spec + template + one gold example
  (`pgsodium-salted-hashing/index.html`), calls the local LLM
  (`MG_LLM_MODEL` env, default `Qwen3.8-27b-coding` on `MG_LLM_BASE`
  `http://127.0.0.1:8123`), writes
  `<topic>/index.html`, then loops: validate → feed failures back to LLM
  (max `MG_FIX_PASSES`, default 3) → re-validate. Writes the folder's
  `README.md` per the standard template.
- Validator: `tool/validate.mjs <folder>` — headless chromium (playwright)
  loads the page, then checks and **emits JSON report + PNG screenshots**:
  1. zero pageerror/console errors;
  2. `window.__time` defined and seekable;
  3. screenshots at `LOOP*0.15/0.40/0.65/0.90` and `LOOP-300`/`300` saved to
     `tool/shots/<folder>/` (the **vision pass** — the operating agent must
     actually look at these PNGs for overlaps/overflow/frozen elements);
  4. in-page `fillText` rect-intersection collision test at the parked frames;
  5. loop-seam dark-frame check via `getImageData` mean-brightness at the
     seam pair;
  6. `README.md` exists and is non-trivial.
- `check.sh` (root) → `tool/check.mjs`: scores the whole repo (see below),
  prints `SCORE: <n>`, exits 0 only when all criteria are met.
- Bench: `tool/bench/prompts.jsonl` — 10 distinct prompts (≥2 marked
  `smoke:true`); the smoke pair runs inside `check.sh`, the full bench is the
  deeper per-iteration improvement pass.
- Logs: `logs/iterations.jsonl` — one line per iteration:
  `{ts, score, failures: [...], fixes_applied: [...]}`.
- Docs: root `README.md` + `AGENTS.md` updated to document the tool and the
  unattended workflow.

## Non-goals

- No web UI, no server, no external LLM APIs.
- No changes to `css/brand.css`, `css/motion.css` tokens.
- No redesign of the 9 existing graphics (only bug fixes if validation
  exposes real defects in them).
- No DOM/CSS-keyframe graphics — canvas architecture only (per skill).
- No slideshow/controls of any kind in generated output.

## Completion criteria (measurable — `./check.sh`)

`check.sh` prints `SCORE: <n>` (max = 35 × #graphics + 110; 460 with the
10 current graphics) and **exits 0 when**:

1. Every existing graphic folder passes: clean load (10) + `__time` (5) +
   no text collisions at 5 parked frames (10) + clean seam (5) + README (5)
   → 35 each (315 for the original 9).
2. Both smoke prompts generate a new folder that passes the same 5 checks
   (2 × 55 = 110). Partial credit: folder exists + clean load = 10 ea.
3. Exit 0 requires criterion 1 fully met AND both smoke graphics fully pass.

Higher SCORE = better (partial credit per check). The loop continues past
exit 0: extend full-bench pass rate (10/10) and reduce mean generation wall
time, recording every iteration in `logs/iterations.jsonl`.

Warning tier (⚠, not scored): two checks emit warnings instead of failures
because they are ambiguous against legitimate designs — `edge-clip`
(content hugging the canvas edge in ≥2 parked states; a clipped label is the
case a reviewer should confirm) and `near-frozen` (px churn 0.5–2%: real but
subtle motion). Warnings appear in the human verdict, in `--json`
(`warnings` / `graphicsWarnings`), and in the fix-loop hint list; a clean
⚠-free pass is the loop's quality bar even though the score ignores them.

## Milestones (small, sequential)

- **M1 — Harness.** `tool/package.json`; `npm i playwright`; install
  chromium headless shell; verify one existing graphic loads headlessly and
  one screenshot saves to `tool/shots/`. Commit.
- **M2 — Validator.** Implement all 6 validator checks → JSON report. Run on
  all 9 graphics; tune thresholds so known-good graphics score 35/35 each.
  Commit.
- **M3 — Generator.** Prompt template (skill spec + template + gold example,
  trimmed to fit context), ollama call, HTML extraction (strip code fences),
  topic slug derivation, README generation. One-shot generate of a test
  prompt must yield a folder that loads clean. Commit.
- **M4 — Fix loop.** Feed validator JSON failures (top errors only) back to
  the LLM for up to 3 fix passes; stop early on full pass. Both smoke
  prompts must pass with ≤3 fix passes. Commit.
- **M5 — Check + bench.** `check.sh`/`check.mjs` with scoring above; write
  10 bench prompts; run full bench; iterate on the generator prompt template
  using the failure classes found. Commit.
- **M6 — Improve to plateau.** Full-bench runs until pass rate plateaus
  (2 consecutive runs with no gain) — each gain: fix the generator template /
  validator false-positives and log the iteration. Update docs. Commit.

## Quality standards

- **Tests:** `./check.sh` is the test suite (must be runnable unattended,
  no interaction, deterministic exit code); bench = 10 fixed prompts.
- **Git:** one commit per milestone, descriptive message, working tree clean
  at the end of every iteration. `tool/node_modules/` is gitignored;
  `tool/shots/` and `logs/` are gitignored (artifacts, not source).
- **Docs:** root README "Generating a graphic" section + AGENTS.md workflow
  note kept accurate at M6 and after any tool change.
- **Vision pass is mandatory for the operating agent:** for every graphic
  created or edited, look at the saved `tool/shots/<folder>/*.png` (4–6
  frames incl. seam pair) before calling it done — deterministic probes are
  the tie-breaker, not a substitute.
- **No regressions:** `logs/iterations.jsonl` must show SCORE non-decreasing
  across iterations; a drop requires a follow-up fix in the same iteration.

## Assumptions (verify at M1, document deviations in logs)

- Playwright's bundled chromium downloads fine (internet is available).
- llama.cpp server on `127.0.0.1:8123` stays up with
  `Qwen3.8-27b-coding` loaded (it is preloaded); `Qwen3.8-27b-coding`
  writes usable canvas JS. It is a reasoning model: most of the
  `max_tokens` budget is consumed by `reasoning_content` before `content`
- "Vision validation" = agent/operating-model inspection of saved PNGs +
  deterministic in-page probes. No local vision-model API is required.
- Generated graphics follow the existing canvas architecture exactly
  (`LOOP`, `buildLayout`, `__time` seek hook, brand tokens from `PAL`).
- Generation wall time target: smoke prompt ≤ ~5 min end-to-end (incl.
  fix passes) on this machine; measure and log, tune model if far off.
- If an existing graphic fails validation at M2, that's a real bug: fix the
  graphic (and its README), do not loosen the validator.
