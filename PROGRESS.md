# PROGRESS

## State — GOAL MET (check.sh SCORE 460/460, endless mode: improvements)
- M1-M5 DONE. Tool chain: tool/generate.sh "<prompt>" → LLM (llama.cpp
  :8123 Qwen3.8-27b-coding) → index.html+README → validate.mjs (5 checks +
  6 vision shots) → ≤3 LLM fix passes. First gen passed 5/5 in 195s, 0 fixes.
- check.sh: 10 graphics ×35 + 2 smoke ×55 = 460 max; currently 460/460.
- M6 docs DONE (README.md + AGENTS.md tooling sections).
- IMPROVEMENTS.md backlog created (7 items) — endless loop continues.

## Decisions
- LLM = llama.cpp 127.0.0.1:8123 only (operator rule). Qwen3.8-27b-coding
  preloaded; reasoning model → max_tokens 16000.
- Vision pass = deterministic probes + tool/shots PNGs (model lacks vision).
- hypa_shell kills >30s commands → long runs: nohup to /tmp, poll next turn.

## Next steps (top of IMPROVEMENTS.md)
1. tool/bench.mjs — full 10-prompt bench → N/10 + logs/iterations.jsonl.
2. check.mjs — log every run to logs/iterations.jsonl.
3. generate.mjs — terser-HTML prompt → ≤150s smoke.
