# Gossip Anti-Entropy Sync
Visualizes how five nodes reach full state convergence through three rounds of pairwise gossip, with packets, merging meters, and a convergence counter.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–4      | Intro | Title fades in; five nodes appear with 20 % state arcs |
| 4–10     | Round 1 | Pairs (0↔1, 2↔3) exchange packets; meters grow to 45 % |
| 10–16    | Round 2 | Pairs (1↔2, 3↔4) exchange; meters grow to 70 % |
| 16–22    | Round 3 | Pairs (0↔4, 1↔3) exchange; all meters reach 100 % |
| 22–27    | Converged | All nodes glow accent; counter ticks 3→5/5 synced |
| 27–30    | Wrap | Title fades back in; states reset to 20 % for seamless loop |
Loop length: 30s.
## Key elements
- Nodes: pentagon layout, state arc (muted → accent at 100 %)
- Packets: accent dots with fading trails along quadratic Bézier paths
- Meters: per-node arc fill showing state completeness
- Counter: "N/5 synced" ticks during convergence beat
- Rule line: one-line summary at bottom
## Notes
- State is a pure function of `t/LOOP`; no persistent mutable state, so the loop is deterministic and seam-free.
- Node labels auto-shrink via `measureText` to stay within the node circle.
- The title crossfades out at 88 % and back in at 0 %, guaranteeing no dark frame at the wrap.
