# Garbage Collection Mark Sweep
Visualizes the two-phase GC algorithm: a mark pass traces reachable objects from roots, then a sweep pass reclaims unreachable memory.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–3      | Idle | Object graph visible, roots pulsing, heap meter at 100% |
| 3–9      | Mark | Packets travel root→node→node, reachable objects glow green |
| 9–15     | Mark done | All reachable nodes green, counter shows 5 marked |
| 15–18    | Sweep | Unreachable nodes shrink and fade to red, heap meter drops |
| 18–28    | Reclaim | Freed counter ticks, heap stabilises at 55% |
| 28–30    | Reset | Unreachable nodes fade back in, scene returns to idle |
Loop length: 30s.
## Key elements
- Roots: two green circles at top, always pulsing
- Reachable objects: turn accent-green during mark phase
- Unreachable objects: shrink/fade to fail-red during sweep, reappear at reset
- Packets: green dots with fading trails along Bézier edges
- Heap meter: bar at bottom, drops from 100% to 55%
## Notes
- Packets are deterministic (spawn by elapsed-time window), no persistent state at wrap
- Unreachable nodes fully restore before t=LOOP so the seam is seamless
