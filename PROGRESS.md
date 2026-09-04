# PROGRESS

## State — GOAL MET + 26 iterations of improvements (endless mode)
- Full pipeline: `tool/generate.sh "<prompt>"` → llama.cpp :8123
  (Qwen3.8-27b-coding) → `<topic>/index.html` + README → validate →
  ≤3 LLM fix passes → `logs/generations.jsonl` metadata line.
- **check.sh: 980/980, exit 0, zero problems** (28 graphics × 35 + 2
  smoke × 55). `--skip-gen` ≈ 20s, `--only <topic>` ≈ 5s, `--json`
  single-line machine output, `--regen` forces fresh smoke generation.
- **Bench: 17/17 in 51s** (reuse path via `logs/slug-map.jsonl`; full
  regen ~28 min).
- validate.mjs checks: clean, seek, collisions (deduped ×N), seam
  (label-density + 4-point pixel window), readme, **content** (min
  area), **frozen** (loop-wide max content-px delta), **resize**
  (1366×768 mid-run), shotsPath + 6 PNGs.
- Fixtures (negative tests): dark-seam, text-overlap, blank-canvas,
  static-canvas — all correctly failing their target check.
- Prompt rules 1-17 in generate.mjs (terser data-driven HTML, label
  fit via measureText, per-beat visible motion).

## Decisions
- LLM = llama.cpp 127.0.0.1:8123 only (operator rule).
- Vision pass = deterministic probes + tool/shots PNGs + documented
  6-shot human review table (README "The vision pass").
- Overwrite guard: slug-map fast path (exit 2 pre-LLM); only bench/
  check set MG_ALLOW_EXISTING=1.
- hypa_shell kills >30s commands → long runs: nohup to /tmp, poll.

## Next steps (top of IMPROVEMENTS.md)
1. tool/validate.mjs — label-visibility (zero-alpha) probe + fixture.
2. (backlog refresh as items close)
