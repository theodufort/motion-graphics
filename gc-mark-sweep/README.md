# Garbage Collection Mark Sweep
Visualizes the two-phase GC algorithm: a mark phase traverses reachable objects from roots, then a sweep phase reclaims unreachable memory.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–3      | Setup | Grid fades in, roots and heap nodes appear |
| 3–14     | MARK | Packets travel root→object along Bézier arcs; reachable nodes glow green |
| 14–16    | Transition | "MARK" fades out, "SWEEP" fades in |
| 16–26    | SWEEP | Unreachable nodes flash red, shrink, and vanish; heap meter drops |
| 26–30    | Clean | Stable reclaimed state, counters settle, fades back to start |
Loop length: 30s.
## Key elements
- Roots (Root A / Root B): accent green, always live
- Reachable objects (obj 1–5): muted → accent on mark
- Unreachable objects (obj 6–7): muted → fail red → removed
- Heap meter: accent fill shrinking to 55%
- Packets: accent dots with fading trails along quadratic Béziers
## Notes
- Mark order is deterministic BFS (R→N1,N2,N3→N4,N5); sweep targets only unmarked nodes.
- The loop is seamless: last 2 s fade elements out while the first 2 s fade them back in.
