# PROGRESS

## State — GOAL MET + 34 iterations of improvements (endless mode)
- Full pipeline: `tool/generate.sh "<prompt>" [--force | --prompt-file <path>]`
  → llama.cpp :8123 (Qwen3.8-27b-coding, ~19-39 tok/s) → `<topic>/index.html`
  + README → validate → ≤3 LLM fix passes → `logs/generations.jsonl`
  metadata line (incl. **tps**).
- **check.sh: 1155/1155, exit 0, zero problems** (33 graphics × 35 dynamic
  max + smoke reuse). `--skip-gen` ≈ 20s (concurrency 4), `--only <topic>`
  ≈ 5s, `--json` single-line machine output, `--regen` forces fresh smoke,
  **`--watch`** re-validates a folder ~1s after its `index.html` changes
  and prints the 8 check bits with `(was …)` diff.
- **Bench: 20/20 in 76s** (reuse path via `logs/slug-map.jsonl`); fresh
  gens 190-220s each, all first-pass pass. Bench prints a per-prompt
  timing table (topic / sec / fix / pass).
- validate.mjs checks: clean, seek, collisions (deduped ×N), seam
  (label-density + 4-point pixel window), readme, content (min area),
  frozen (loop-wide max delta), **visibility** (all-frames alpha<0.15),
  resize (1366×768 mid-run), 6 PNGs + **manifest.json** per shot
  (file / t / contentPx / seam).
- Fixtures (negative tests): dark-seam, text-overlap, blank-canvas,
  static-canvas, invisible-label — all correctly failing their target
  check (README "Negative fixtures" table).
- Prompt rules 1-18 in generate.mjs (data-driven terseness, label fit via
  measureText, per-beat visible motion, no alpha-0 labels).

## Decisions
- LLM = llama.cpp 127.0.0.1:8123 only (operator rule); `llm()` retries
  once (5s backoff) on timeout/network errors only.
- Vision pass = deterministic probes + tool/shots PNGs + manifest +
  documented 6-shot human review table (README "The vision pass").
- Overwrite guard: slug-map fast path (exit 2 pre-LLM); only bench/check
  set MG_ALLOW_EXISTING=1.
- hypa_shell kills >30s commands → long runs: nohup to /tmp, poll.

## Next steps (top of IMPROVEMENTS.md)
1. (backlog refill as items close)
