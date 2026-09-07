# Vector Clocks Detect Concurrency
Three distributed nodes exchange vector clocks; when two clocks are incomparable the store flags a conflict before merging.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Init | Nodes A/B/C fade in, clocks at [0,0,0] |
| 5–10 | A writes | A→[1,0,0], packets travel to B & C |
| 10–15 | B writes | B→[1,1,0], packets travel to A & C |
| 15–20 | C writes | C→[1,1,1], packets travel to A & B |
| 20–25 | Conflict | A=[2,1,0] vs B=[1,2,0] — incomparable, red alert |
| 25–30 | Merge | Clocks unify to [2,2,0], resolution banner, fade to start |
Loop length: 30s.
## Key elements
- Node circles: accent green, pulsing radius
- Vector clock arrays: accent green monospace under each node
- Packets: accent green dots with soft glow trails on Bézier arcs
- Conflict banner: fail red, "CONFLICT DETECTED" + comparison
- Merge banner: accent green, "MERGED → [2,2,0]"
- Update meter: accent fill bar bottom-center
## Notes
- Conflict is detected when neither clock dominates the other (incomparable vectors)
- Packets use quadratic Bézier with a control point offset above the midpoint for visual separation
- Loop is deterministic: all positions are pure functions of `t = now % LOOP`
