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

## Duplicate bench output consolidation (2026-09-04)

- `event-loop-timers-io-microtasks/` and `service-mesh-circuit-breaker/`
  were deleted: earlier bench runs (before the slug map existed) let the
  LLM pick different slugs for the same prompts; logs/slug-map.jsonl
  owns `js-event-loop` and `service-mesh-routing` as canonical.
- `connection-pool-reuse/` (first tool generation, no map prompt
  recorded) is kept as-is.

## Port 18123 is a socat proxy (2026-09-04)

127.0.0.1:18123 is held by a socat process forwarding to llama.cpp;
tests that need a mock LLM must use another port (28123+ used).
HTTP 500 is treated as non-transient by the llm() retry (only
AbortError/fetch-failed retry once).

## Shot layout is 4 frames + 2 seam (2026-09-05)

validate.mjs parks FRAMES = [0.15, 0.40, 0.65, 0.90] plus seam-a
(LOOP-300) and seam-b (300) => 6 PNGs and a 6-entry manifest.json per
graphic. (An earlier backlog item assumed 6 frames + 1 seam = 7.)

## Wall time is per-graphic fixed-cost bound (2026-09-05)

check.sh --skip-gen went 16-20s (22 graphics) -> 34-39s (33 graphics):
mostly the graphic count, not host load. Per graphic ~3.5-5s; check
phases ~2s (report.timings), the rest is chromium launch, goto and 6
PNG screenshots. --quick saves ~1.9s per graphic (useful for --only /
--watch; bulk-run ratio 0.97). Future levers: fewer PNGs, browser
reuse, higher concurrency on an idle host.
