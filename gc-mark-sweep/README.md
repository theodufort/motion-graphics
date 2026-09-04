# GC Mark and Sweep
Visualizes the two-phase garbage collection algorithm: mark reachable objects from roots, then sweep unreachable ones from the heap.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–3      | Ready | Heap graph visible, title fades in, all nodes idle |
| 3–12     | Mark  | Packets travel root→objects along Bézier paths; nodes turn green as marked |
| 12–15    | Marked | All 5 reachable nodes pulse green; 2 unreachable pulse red |
| 15–25    | Sweep | Garbage nodes shrink with red rings and fade out |
| 25–30    | Compact | Remaining nodes settle, "Heap Compacted" label, crossfades back to Ready |
Loop length: 30s.
## Key elements
- Root nodes: accent green, labeled "Root A" / "Root B"
- Marked objects: accent green fill + glow
- Garbage objects: fail red, shrink during sweep
- Packets: accent green dots with fading trails on Bézier edges
- Progress bar: bottom, fills during mark, drains during sweep
- Counter: ticks "n / 7 marked" then "Collected: n / 2"
## Notes
- No global fade-to-black; all elements persist across the loop seam for a seamless wrap.
- Packets are deterministic (spawn from elapsed-time windows), no persistent state.
- Crossfades ensure no two labels overlap at full opacity.
