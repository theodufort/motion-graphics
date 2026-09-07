# Rolling Hash Ring
Explains consistent hashing with virtual nodes — keys route clockwise to the nearest vnode, and removing a node only reassigns its slice.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–10.5   | Steady state | All 4 nodes active, 6 keys routing via Bézier packets |
| 10.5–16.5| Node B dims | B fades to 20 %, its keys re-route to neighbours |
| 16.5–30  | Recovery | B fades back, distribution restores, packets resume |
Loop length: 30s.
## Key elements
- Ring: muted circle, vnodes as coloured dots (accent / amber / blue / violet)
- Keys: small labels orbiting outside the ring, packets travel inward
- HUD meters: per-node key count bars at bottom
## Notes
- Node B dimming is the only state change; all labels persist across the seam at full alpha
- Packets use deterministic phase `(t/900 + i*0.28) % 1` so the loop is seam-free
