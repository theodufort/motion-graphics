# TCP Congestion Control Visualized
A looping animation tracing the classic sawtooth of window growth through slow start, congestion avoidance, and AIMD loss recovery.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–7.5 | Slow Start | cwnd doubles each RTT, exponential curve rises, green trace |
| 7.5–15 | Congestion Avoidance | Linear +1/RTT growth, steady packet flow |
| 15–16.5 | Loss Detected | Red flash, cwnd halves (24→12), packets scatter |
| 16.5–24 | Additive Increase | Linear recovery, cwnd climbs 12→18 |
| 24–25.5 | Loss Detected | Second red flash, cwnd halves (18→9) |
| 25.5–30 | Multi Decrease → Slow Start | Exponential recovery 9→16, crossfades into loop start |
Loop length: 30s.
## Key elements
- Sawtooth graph: accent green trace, fail red on loss segments
- Three network nodes: Sender / Network / Receiver, muted pulse
- Packet dots: accent color, travel quadratic Bézier paths
- cwnd counter: large monospace number, ticks with window size
- Phase label: bottom HUD, crossfades between beats
## Notes
- The full curve is always drawn faintly; a bright trace follows the playhead
- Loss segments use the fail color and a radial red glow at the drop point
- Edge fade (first/last 8%) ensures seamless loop wrap with no dark frame
