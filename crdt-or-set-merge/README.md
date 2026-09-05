# CRDT OR-Set Merge
Two replicas diverge, exchange updates, and converge via OR-set union with last-writer-wins conflict resolution — no coordinator needed.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Init | Two replica nodes fade in with initial set elements |
| 5–10 | Diverge | Each replica adds unique elements; "Divergent Sets" label |
| 10–15 | Merge | Packets travel along Bézier arc; "OR-Set Union" label |
| 15–20 | LWW | Conflict pulse at center; timestamps t=3 vs t=5, winner B |
| 20–25 | Converge | Merged set ring with all 6 elements; counter ticks to 6 |
| 25–30 | Reset | Everything fades out, looping seamlessly back to Init |
Loop length: 30s.
## Key elements
- Replica A / B: accent-colored pulsing circles with orbiting element dots
- Merge packets: accent dots with fading trails along quadratic Bézier
- LWW conflict: fail-colored pulsing ring with timestamp labels
- Converged set: accent ring containing all union elements
- Beat HUD: muted label bottom-left showing current phase
## Notes
- OR-set semantics: union of both replicas' add-wins entries; no element is lost
- LWW resolves the single conflicting key by picking the higher timestamp (t=5 > t=3)
- Packets use deterministic elapsed-time windows so the loop is seam-free at the wrap
