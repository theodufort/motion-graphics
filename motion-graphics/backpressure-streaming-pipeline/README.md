# Backpressure in a Streaming Pipeline
A looping visualization of a producer → buffer → consumer pipeline where the consumer stalls, the buffer fills past 70%, and backpressure signals throttle the producer until the system drains and recovers.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Steady Flow | Packets flow at full rate, buffer ~20%, green accents |
| 5–10 | Consumer Slows | Buffer climbs to 70%, consumer node pulses faster |
| 10–15 | Backpressure Active | Buffer 95%, red backpressure packets flow right→left, producer throttled |
| 15–20 | Draining | Buffer drops, backpressure fades, throughput recovers |
| 20–25 | Burst Recovery | Quick spike to 50% then settles |
| 25–30 | Balanced | Steady state, crossfades seamlessly into beat 1 |
Loop length: 30s.
## Key elements
- Producer / Consumer nodes: accent green, pulse with sin
- Buffer meter: vertical bar, green→red above 70%
- Forward packets: accent, quadratic Bézier arcs
- Backpressure packets: fail red, lower arc, only during stall
- HUD: status label, throughput counter, one rule line
## Notes
- Backpressure path (red arc) only renders when buffer > 70%, fading in/out with the beat
- Packet count is deterministic (phase-offset), no persistent state at the loop wrap
- Throughput counter is derived from buffer level: 1200 msg/s at 20% → 400 msg/s at 95%
