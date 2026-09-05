#!/usr/bin/env bash
# Goal check for the motion-graphics generation tool (see GOAL.md).
# exit 0 = all completion criteria met; prints "SCORE: <n>" (higher = better).
# --fast: full suite in quick mode (faster; score line labeled "(quick)").
# --since <rev>: validate only folders changed since a git revision (passthrough).
# --only <folder>, --skip-gen, --watch, --json: also passed through to tool/check.mjs.
cd "$(dirname "$0")"
FAST=0
for a in "$@"; do [ "$a" = "--fast" ] && FAST=1; done
if [ "$FAST" = "1" ]; then
  ARGS=()
  for a in "$@"; do [ "$a" != "--fast" ] && ARGS+=("$a"); done
  exec env MG_QUICK=1 node tool/check.mjs "${ARGS[@]}" --fast
fi
exec node tool/check.mjs "$@"
