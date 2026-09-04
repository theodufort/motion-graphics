# PROGRESS

## State
- M1 DONE: playwright + chromium headless; headless load verified.
- M2 DONE: tool/validate.mjs — 6 checks (pageerror, __time seek, fillText
  collision rects w/ textAlign/baseline/alpha handling, seam density,
  README, 6 screenshots per graphic in tool/shots/). All 9 existing
  graphics pass 35/35. check.sh now reports SCORE: 315/425.

## Decisions
- Collision false-positive fixes: skip substring pairs (phrase + word
  highlight), skip pairs where either draw alpha < 0.6 (crossfades are
  intentional), dedupe identical (str,x,y,w) rects (glow passes), and
  clear the fillText buffer AFTER seeking (pre-seek natural-time frames
  polluted the first parked frame — this was masking, not a graphic bug).
- Vision pass = deterministic probes + saved PNGs (model lacks vision input).
- LOOP parsed from HTML source; generator template should also expose
  window.__loop for new graphics.

## Next steps
1. M3: tool/generate.mjs — prompt template (skill spec + canvas architecture
   + pgsodium as gold example), ollama call (MG_GEN_MODEL default
   qwen3.6:35b-a3b-q4_K_M), HTML fence extraction, topic slug, README gen.
   Smoke: one prompt → folder that loads clean.
2. M4: fix loop (feed validate.mjs JSON errors back, ≤3 passes).
3. M5: tool/bench/prompts.jsonl (10 prompts, 2 smoke:true) → check.sh 425.
