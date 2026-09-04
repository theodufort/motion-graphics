# TLS Handshake Encrypted Channel
Visualizes the four-phase TLS handshake (hello, certificate, key exchange, finished) culminating in a glowing encrypted channel with bidirectional data flow.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–4      | Idle | Title, nodes, step dots visible; no traffic |
| 4–7.5    | Hello | Client Hello packet travels left→right |
| 9–14     | Cert | Server Hello + Certificate packets travel right→left |
| 14–19    | Keys | Key Exchange packets travel both directions |
| 19–24    | Lock | Finished packets; padlock fades in at midpoint |
| 24–30    | Secure | Encrypted channel glow; bidirectional data packets |
Loop length: 30s.
## Key elements
- Client / Server nodes: accent green, pulsing
- Packets: accent (handshake), muted (certificate), with Bézier trails
- Padlock: accent, appears at "Lock" beat
- Encrypted channel: accent glow line, appears at "Secure" beat
- Step dots: muted → accent as each phase completes
## Notes
- Title, node labels, step dots, and progress bar remain at full opacity across the entire loop to prevent label-density collapse at the seam.
- Only transient elements (packets, lock, glow) fade in/out per beat.
- All positions derived from W/H; DPI-aware via setTransform.
