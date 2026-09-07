# SQLite WAL Mode
Visualizes how a writer appends frames to the WAL, readers pin a snapshot, and a checkpoint flushes frames back to the main database.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Intro | Title fades in; Main DB, WAL, and WAL-Index boxes appear |
| 5–10 | Append | Writer pulses, packets travel to WAL; frames 1–3 fill |
| 10–15 | Snapshot | Readers appear, lock onto snapshot (frame 3); WAL-Index shows snap:3 |
| 15–20 | Extend | Writer appends frames 4–5; readers still pinned at snapshot |
| 20–25 | Checkpoint | Frames flow WAL→Main DB; WAL-Index resets; WAL clears |
| 25–30 | Reset | WAL empties, readers fade, scene crossfades back to intro |
Loop length: 30s.
## Key elements
- Main DB: 4 page slots, accent fill during checkpoint
- WAL File: 5 frame slots, accent highlight for snapshot range
- WAL-Index: max/snap counters, accent for active snapshot
- Writer: accent node, pulses, sends packets to WAL
- Readers: muted nodes, dashed lines to WAL, fade in/out
## Notes
- Snapshot frames stay highlighted (accent) while readers are active, even as new frames append above them
- Checkpoint uses a separate Bézier path (WAL→DB) with a larger packet to distinguish from append
- WAL-Index "max" counter ticks up during append and counts down during checkpoint
