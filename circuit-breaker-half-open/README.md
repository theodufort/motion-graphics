# Circuit Breaker Half-Open Probing
Visualizes a circuit breaker cycling through closed, open, half-open trial requests, and recovery when the success threshold is met.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Closed | Green packets flow freely source → breaker → service |
| 5–9 | Open | Red packets hit the breaker and bounce back |
| 9–15 | Half-Open | Amber trial packets probe; success meter fills 0→3 |
| 15–20 | Recovery | Green flow resumes, full throughput restored |
Loop length: 20s.
## Key elements
- Breaker node: center circle, color shifts green/red/amber per state
- Trial packets: amber dots on Bézier paths during half-open
- Success meter: horizontal bar filling 0/3 → 3/3
- Bounce-back: red packets reverse direction when breaker is open
## Notes
- Packets are deterministic (offset-based, no persistent state) so the loop wraps seamlessly
- The success meter only appears during the half-open beat with eased fade in/out
