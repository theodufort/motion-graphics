# ASSUMPTIONS

- 2026-09-04 (M1): loop model has no image-input support. The automated
  "vision pass" in tool/validate.mjs is therefore implemented as
  deterministic in-page probes (getImageData mean brightness, fillText
  rect collisions, pageerror). PNGs are still saved to tool/shots/ for
  human or vision-capable model review.
- 2026-09-04 (M1): `window.LOOP` is not a global in existing graphics
  (const-scoped). Validator derives LOOP by parsing `const LOOP = <n>`
  from the HTML source; generator template must additionally expose
  `window.__loop = LOOP` for new graphics.
- 2026-09-04 (M3): operator restricts LLM access to llama.cpp on
  127.0.0.1:8123 (ollama unusable). Generator uses OpenAI-compatible
  /v1/chat/completions with Qwen3.8-27b-coding (reasoning model:
  reasoning_content eats most of max_tokens; content holds the answer).
  First generation passed all 5 checks in 195s, 0 fix passes.
- 2026-09-04 (M3): hypa_shell kills commands after 30s; long-running
  check.sh runs must be nohup'd to a log file and polled.

## Overwrite guard + MG_ALLOW_EXISTING (2026-09-04)

- `generate.sh` refuses to overwrite an existing topic folder (exit 2,
  fast-path via logs/slug-map.jsonl before any LLM call). This protects
  curated graphics and gives stable re-run behaviour.
- `tool/bench.mjs` and `tool/check.mjs` are the *only* callers that set
  `MG_ALLOW_EXISTING=1` (or `allowExisting: true`): bench/check output is
  tool-generated, and LLM slugs can legitimately land on an existing
  generated folder on re-runs — those runs refresh in place instead of
  failing.
- Consequence: the slug map (prompt→topic) is the source of truth for
  "which folder does this prompt own"; it grows one line per successful
  generation. Re-runs of a known prompt with `--force`/`--regen` are
  expected to be somewhat slower (full LLM call) because the fast
  guard is intentionally bypassed.
