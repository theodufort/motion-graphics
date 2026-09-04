# B-Tree Index Lookup
Explains how a B-tree index reduces database lookups from O(n) linear scans to O(log n) hops.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Linear Scan | 12 nodes in a row; red packet visits each sequentially, counter ticks 0→12 |
| 5–10 | B-Tree Index | Nodes morph into a 3-level tree; edges and level labels fade in |
| 10–15 | Indexed Lookup | Green packet hops root→mid→leaf along highlighted edges, counter 1→3 |
| 15–20 | 12 vs 3 Hops | Side-by-side counters and meters; "4× faster" label |
Loop length: 20s.
## Key elements
- Flat array nodes: muted grey, represent unindexed rows
- B-tree nodes: accent green, represent indexed keys
- Scan packet: fail red, shows linear cost
- Lookup packet: accent green, shows logarithmic cost
- Meters & counters: compare 12 vs 3 hops
## Notes
- Beat 4 fades out into beat 1 fading in for a seamless loop with no dark gap.
- All positions derive from W/H so the layout is resolution-independent.
