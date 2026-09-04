# Service Mesh Request Routing
Visualizes how a gateway routes requests through a service mesh, showing retry logic on transient failures and a circuit breaker that opens, half-opens, and closes to protect downstream services.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Happy path | Packet flows Client → Gateway → Service A, green success pulse |
| 5–10 | Retry succeeds | Packet to Service B fails (red), retry succeeds (green), retry counter ticks |
| 10–15 | Breaker opens | Two failures to Service C, circuit breaker flashes red and opens |
| 15–20 | Short-circuit | Incoming request is rejected at gateway, red X, no downstream call |
| 20–25 | Half-open test | Breaker turns amber, single probe to Service C succeeds |
| 25–30 | Recovery | Breaker closes (green), normal routing resumes, fades into beat 1 |
Loop length: 30s.
## Key elements
- Client / Gateway / Service A / B / C: node circles, accent (healthy) or fail (error) glow
- Packets: small glowing dots traveling along quadratic Bézier paths with fading trails
- Circuit breaker badge: color-coded pill (green / red / amber) near Service C
- Retry counter: animated number near Service B
- Success-rate meter: horizontal bar at bottom, accent fill
## Notes
- All packet spawns are deterministic windows of t; no persistent state survives the loop wrap.
- The circuit breaker state is a pure function of t with eased color transitions at boundaries.
- Crossfade: the breaker label fades out before the new state fades in (never two strings at full opacity).
