# BGP Best Path Selection
Explains how a BGP router picks the winning route by applying Local Pref, AS Path Length, and MED in order — the highest LP, shortest AS path, and lowest MED each eliminate candidates until one path remains.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Intro | Title fades in; three path lanes (A, B, C) with attribute meters appear |
| 5–12 | Local Pref | "Local Pref" label; Paths A & B dimmed with ✕ (LP 100 < 200) |
| 12–19 | AS Path Len | "AS Path Len" label; hop circles pulse; B already eliminated |
| 19–26 | MED | "MED" label; meter bars highlight lowest MED (30) |
| 26–30 | Winner | "✓ Best Path" badge on Path C; crossfade back to intro |
Loop length: 30s.
## Key elements
- Path lanes: three horizontal rows with LP / AS / MED meters (accent = winner, muted = candidates)
- Router node: central circle with radial glow (accent)
- Packets: small dots travelling along quadratic Bézier from each lane to the router
- Elimination ✕: fail-colour cross on losing paths
- Criterion label: top-centre text that swaps per beat with crossfade
## Notes
- Elimination is deterministic: A & B fade out during the LP beat and stay dimmed for the rest of the loop.
- Packets use elapsed-time windows (no persistent state) so the 30 s wrap is seam-free.
- All positions derive from W/H; DPI handled via setTransform.
