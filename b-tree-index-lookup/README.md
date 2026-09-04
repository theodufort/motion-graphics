# B-Tree Index Lookup
Explains how a B-tree index reduces a linear table scan to a logarithmic key traversal, cutting lookups from O(n) to O(log n).
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Linear Scan | 16 row-cells sweep left-to-right, counter ticks to 10 000 |
| 5–10 | B-Tree Index | 3-level tree fades in, nodes pulse, edges draw |
| 10–15 | Key Lookup | Packet travels root→mid→leaf, comparison pulses at each node |
| 15–20 | Result | Leaf glows, "1 row" vs "10 000 rows" meters fill |
| 20–25 | Loop | Crossfade back into the linear scan |
Loop length: 25s.
## Key elements
- Row cells: muted grey, scanned by accent bar
- B-tree nodes: accent circles, pulse with sin
- Traversal packet: accent dot with fading trail
- Comparison meters: accent vs fail fill bars
- Counters: text-colour, tick up per beat
## Notes
- The traversal path (root→mid[1]→leaf[3]) is deterministic; no random state.
- Beat crossfades use easeInOut over 8% of each beat window to avoid hard cuts.
- The linear-scan counter uses a non-linear ease so it feels like "scanning" (fast start, slow end).
