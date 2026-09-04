# Service Mesh Circuit Breaker
Visualizes how a service mesh routes requests, retries on failure, and trips a circuit breaker to fail fast before recovering.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Route Request | Packet travels Gateway → Service A, success flash |
| 5–10 | Retry on Failure | Packet to Service B fails (red), retry succeeds (green) |
| 10–15 | Circuit Opens | Three failures to Service C, breaker flips to OPEN |
| 15–20 | Fail Fast | Packets bounce off Service C instantly, no retry |
| 20–25 | Half-Open Probe | Single probe packet, breaker in HALF-OPEN (amber) |
| 25–30 | Circuit Closes | Probe succeeds, breaker returns to CLOSED, normal routing |
Loop length: 30s.
## Key elements
- Gateway node: muted pulse, origin of all packets
- Service A/B/C nodes: accent (healthy) / fail (error) / amber (half-open) glow
- Circuit breaker badge: state label + colored ring near Service C path
- Packets: quadratic Bézier travel with fading trail dots
- Retry counter: ticks up during beat 2, resets each loop
- Failure meter: fills during beats 3–4, drains during 5–6
## Notes
- All packet spawns are deterministic time windows — no persistent state at the loop seam
- Circuit breaker color transitions: green → red → amber → green across beats 3–6
- Beat subtitles crossfade (500 ms) to avoid overlapping text at the same position
