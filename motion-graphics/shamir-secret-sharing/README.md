# Shamir Secret Sharing
Splits a secret into n shares where any k suffice for reconstruction — no single share reveals the secret alone.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Title | "Shamir Secret Sharing" fades in; center Secret Key node pulses |
| 5–12 | Split | Packets travel outward to 5 share nodes; nodes appear |
| 12–18 | Distributed | All 5 shares pulse; counter reads "k = 5 of n = 5" |
| 18–25 | Reconstruct | 3 shares highlight; packets converge back to center; counter "k = 3 of n = 5" |
| 25–30 | Rebuilt | Secret Key node re-ignites; rule line appears; fades into beat 1 |
Loop length: 30s.
## Key elements
- Secret Key node: accent, center, pulses
- Share nodes ×5: muted → accent when selected, pentagon layout
- Packets: accent, quadratic Bézier with fading trail
- Counter: accent, bottom-center
## Notes
- Only 3 of 5 shares are needed; the other 2 dim to 35% alpha during reconstruction
- Packets use staggered delays per node for a cascading visual
- Loop is seamless: beat 5 fades out while beat 1 fades in at the wrap point
