# Backpressure in Streaming Pipelines
Visualizes how a full buffer throttles the producer and how the system recovers once the consumer catches up.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Flowing | Packets stream at full speed, buffer ~30 %, gauge green |
| 5–10 | Slowing | Consumer pulses slower, buffer fills, pressure rises |
| 10–15 | Backpressure | Buffer full (red), producer throttled, packets crawl |
| 15–20 | Draining | Consumer speeds up, buffer empties, pressure drops |
| 20–25 | Stable | Balanced flow, all meters green, steady throughput |
| 25–30 | Cycle | Crossfade back into Flowing for seamless loop |
Loop length: 30s.
## Key elements
- Producer node: accent circle, pulses; turns fail-coloured when throttled
- Buffer tank: rounded rect, fill level + colour shift accent → fail
- Consumer node: accent circle, pulse rate tracks throughput
- Packets: small accent dots with fading trails along Bézier lanes
- Pressure gauge: arc meter, accent → fail as pressure rises
- Throughput counter: ticking integer, msg/s
- Status label: crossfading text (Flowing / Slowing / Backpressure / Draining / Stable)
## Notes
- Packet speed is a smooth keyframed function of t so positions never jump; the loop is fully deterministic.
- Buffer fill and gauge use the same keyframe curve so they stay in sync.
- The last 5 s crossfades the "Stable" label out and "Flowing" in, matching the 0 s state for a seamless wrap.
