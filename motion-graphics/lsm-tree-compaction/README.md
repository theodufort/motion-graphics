# LSM-Tree Compaction Cycles
Sorted runs accumulate per level, trigger compaction by score, and merge downward while space amplification oscillates.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–8 | Fill L0 | Runs appear in L0, score meter rises to threshold |
| 8–16 | Compact L0→L1 | Packets flow down, L0 runs shrink, L1 grows, space amp drops |
| 16–24 | Compact L1→L2 | Second merge wave, score rebuilds, amp recovers slightly |
| 24–32 | Compact L2→L3 | Final merge, amp returns to start, seamless loop |
Loop length: 32s.
## Key elements
- Level bands (L0–L3): accent border when active, muted otherwise
- Sorted runs: small accent-filled rectangles, pulsing
- Packets: accent dots with fading trails on quadratic Bézier paths
- Score meter: vertical bar, accent→fail at threshold
- Space amplification: large counter + horizontal bar, right side
## Notes
- Score and space-amp are pure functions of beat position so the loop is deterministic and seam-free.
- Packet spawn windows are offset per index to stagger the merge visually.
