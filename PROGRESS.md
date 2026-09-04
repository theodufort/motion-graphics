# PROGRESS

## State
- M1 DONE: playwright + chromium headless installed; tool/m1-smoke.mjs
  proves headless load of pgsodium-salted-hashing (0 errors, __time seek,
  screenshot saved to tool/shots/).
- check.sh runs: currently SCORE: 0 until M2 validator exists.

## Decisions
- Vision pass = deterministic probes + saved PNGs (model lacks vision).
- LOOP parsed from HTML source; new graphics expose window.__loop.

## Next steps
1. M2: implement tool/validate.mjs (6 checks, JSON report, screenshots at
   6 park times); run on all 9 graphics; tune to 35/35 each.
2. M3: tool/generate.mjs (prompt template + ollama call).
