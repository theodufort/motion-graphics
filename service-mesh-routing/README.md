# Service Mesh Routing
Visualizes how a service mesh handles a failing dependency with automatic retries and a circuit breaker that opens, reroutes traffic, and recovers.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–4 | Intro | Title fades in, four nodes and bezier paths draw on |
| 4–10 | Healthy Flow | Packets travel Gateway→A→B→C, all nodes pulse green, request counter ticks |
| 10–15 | Retries | Service B turns red, packets bounce back twice, retry counter increments |
| 15–22 | Circuit Open | Break appears in A→B path, traffic reroutes A→C, B dims |
| 22–27 | Half-Open | Single test packet reaches B, B recovers to green, circuit closes |
| 27–30 | Recovered | Normal flow resumes, all green, crossfades seamlessly into beat 1 |
Loop length: 30s.
## Key elements
- Gateway / Service A / B / C: node circles, accent (healthy) or fail (error)
- Circuit Breaker: arc switch between A and B, accent when closed, fail when open
- Packets: glowing dots with fading trails along quadratic Bézier paths
- HUD: title, status label, retry counter, request counter
## Notes
- All packet positions are pure functions of `t = now % LOOP` — no persistent state, seamless wrap
- Circuit breaker visual is a small arc that splits open with a gap and lightning tick
- Fallback path (A→C) only renders during the circuit-open beat with a distinct dashed style
