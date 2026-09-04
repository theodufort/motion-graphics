# Connection Pool Reuse
Explains how a pool borrows, times out, and recycles database connections — takeaway: connections are never created per-request, they cycle through idle → active → return.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Pool Idle | 4 green idle slots, title fades in, utilization meter at 0% |
| 5–10 | Borrow | Request pulses, packet travels to pool, slot 0 turns active, "Borrow" label |
| 10–15 | In Use | Active slot pulses, timeout meter drains, packet round-trips to DB |
| 15–20 | Return + Timeout | Slot 0 returns to idle, slot 3 flashes red (timeout) then recycles |
| 20–25 | Pool Ready | All slots idle again, "Pool Ready" label, crossfade into beat 1 |
Loop length: 25s.
## Key elements
- Pool slots: 4 rounded rects, accent (idle) / text (active) / fail (timeout)
- Request node: left, muted border, pulses on borrow
- Database node: right, muted border, pulses on query
- Timeout meter: thin bar under active slot, drains accent→fail
- Counters: "Idle N" / "Active N" / "Timeout N" top-right
- Packets: small glowing dots on quadratic Bézier paths with fading trails
## Notes
- Timeout on slot 3 is a visual "recycle" — it flashes fail then snaps back to accent, no persistent state
- The utilization meter is a pure function of beat, so seeking to any ms is deterministic
- Crossfade window is 0.8s at the loop seam to avoid a dark frame
