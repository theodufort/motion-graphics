# TCP Congestion Control Cycle
Visualizes the full slow-start → congestion-avoidance → AIMD cycle as a live cwnd-vs-RTT graph with packet flow between sender, network, and receiver.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–7.5    | Slow Start | cwnd doubles each RTT (1→16), green curve rises exponentially |
| 7.5–15   | Congestion Avoidance | cwnd grows linearly (16→24), steady green line |
| 15–16.5  | Loss Detected | Red flash at peak, cwnd halves to 12 |
| 16.5–24  | Additive Increase | cwnd climbs linearly (12→18) |
| 24–25.5  | Loss Detected | Second red flash, cwnd halves to 9 |
| 25.5–30  | Multiplicative Decrease | cwnd drops 9→1, resets for next cycle |
Loop length: 30s.
## Key elements
- cwnd graph: accent green (normal) / fail red (loss), full-viewport left panel
- Sender / Network / Receiver nodes: surface fill, accent stroke, pulsing radius
- Packets: accent dots on quadratic Bézier paths with fading trails
- HUD counter + meter bar: ticks with cwnd value, color-shifts on loss
- Phase label: bottom-center, swaps with crossfade via fitLabel
## Notes
- cwndAt(0) = cwndAt(1) = 1 ensures a seamless loop with no dark seam frame
- No edgeFade; all elements remain visible throughout the cycle
- PAL.surface added to resolve the undefined-token crash
