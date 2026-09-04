# MVCC Snapshot Reads
Explains how multi-version concurrency control uses version chains, snapshot visibility checks, and vacuum cleanup to serve consistent reads without locking.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–2.5    | Chain build | Version chain V1→V4 assembles with arrows, nodes pulse |
| 2.5–6    | Snapshot | Dashed snapshot line drops, ✓/✗ visibility marks appear per node |
| 6–10     | Read | Snapshot holds, reader reads V3+V4 (visible), V1+V2 hidden |
| 10–14    | Vacuum | Red sweep line traverses, dead rows (V1,V2) dissolve into particles |
| 14–16    | Cleanup | Counter ticks "2 dead rows removed", vacuum fades out |
| 16–24    | Hold/loop | Chain remains, title persists, seamless wrap back to beat 1 |
Loop length: 24s.
## Key elements
- Version nodes: accent green, pulsing circles with txn labels
- Snapshot line: accent green dashed, marks visibility boundary
- Vacuum sweep: fail red vertical line with particle dissolve
- Visibility marks: ✓ (accent) / ✗ (fail) per node
## Notes
- Chain nodes are always visible (never fade to zero) to prevent dark frames at the loop seam
- Vacuum beat fades out before the wrap so the chain + title carry the transition
- All positions derived from W/H fractions for responsive 16:9 canvas
