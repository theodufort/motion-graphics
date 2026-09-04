#!/usr/bin/env bash
# Generate a motion graphic from a one-line prompt. Prints JSON result + folder path.
cd "$(dirname "$0")/.."
exec node tool/generate.mjs "$@"
