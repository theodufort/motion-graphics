# Truncated Retry Test

A graphic that truncates its first LLM response and completes on retry.

## Notes
- mock test: the first response is cut off mid-script (no closing tags), the
  generator must detect the truncation and request a complete file, and the
  retry response contains the full HTML with the seek hook and animation.
- the second response completes the file and validation passes all checks.
