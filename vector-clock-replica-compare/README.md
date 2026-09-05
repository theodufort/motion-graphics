# Vector Clock Replica Compare
Compares two replica vector clocks side-by-side, showing how a message transfer advances one replica's clock and establishes a happens-before relation.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5      | Init | Both replicas at [0,0], idle pulse |
| 5–10     | A ticks | Replica A counter advances 1→2→3 |
| 10–15    | B ticks | Replica B counter advances 1→2→3 |
| 15–19    | Transfer | Packet travels A→B along Bézier arc |
| 19–26    | Causal | B advances to 4, "A ⊂ B" label + meter fill |
| 26–30    | Hold | Stable state, subtle pulse, wraps to init |
Loop length: 30s.
## Key elements
- Replica nodes: accent-colored circles with vector clock values
- Packet: accent dot with fading trail on quadratic Bézier
- Causal meter: accent fill bar showing subset relation
- Title + rule line: muted text, always present
## Notes
- Persistent elements (nodes, title, connection, rule) never fade out — only transient overlays (packet, causal label) use beat windows, preventing a dark seam at the loop wrap.
- Clock values are a pure function of beat, so seeking is deterministic.
