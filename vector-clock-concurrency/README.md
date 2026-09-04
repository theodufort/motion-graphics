# Vector Clock Concurrency Detection
Three distributed nodes exchange vector clocks; when two concurrent updates produce incomparable vectors, the conflict is detected and highlighted.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Nodes idle | Three nodes pulse, clocks show [0,0,0] |
| 5–7 | A updates | Node A increments, packets fly to B and C |
| 7–12 | Propagation | B and C merge A's update, clocks tick up |
| 12–17 | Concurrent writes | B and C increment simultaneously, clocks diverge |
| 17–22 | Sync exchange | Packets travel B↔C, vectors compared component-by-component |
| 22–30 | Conflict | INCOMPARABLE flash, red pulse, fade back to idle |
Loop length: 30s.
## Key elements
- Node A / B / C: accent-green circles with vector clock arrays
- Packets: accent dots with fading trails along Bézier paths
- Comparison panel: central area showing component-wise vector comparison
- Conflict indicator: fail-red pulse ring + "INCOMPARABLE" label
- Causal meter: fills when one vector dominates; stays empty on conflict
## Notes
- Incomparability is shown by highlighting the two components where each vector exceeds the other (B[1]>C[1] and C[2]>B[2]) in red.
- The loop is deterministic: all clock values and packet positions are pure functions of t = now % LOOP.
