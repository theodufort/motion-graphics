#!/usr/bin/env bash
# Goal check for the motion-graphics generation tool (see GOAL.md).
# exit 0 = all completion criteria met; prints "SCORE: <n>" (higher = better, max 425).
cd "$(dirname "$0")"
exec node tool/check.mjs "$@"
