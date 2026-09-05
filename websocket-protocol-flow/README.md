# WebSocket Protocol Flow
Visual walkthrough of the three core WebSocket mechanics: HTTP upgrade handshake, client-side frame masking, and ping-pong keepalive.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5      | Handshake Upgrade | GET /ws packet travels client→server, 101 Switch returns, "ws:// connected" fades in |
| 5–12     | Frame Masking | Frame byte layout (FIN/OPC/MASK/LEN/PAYLOAD) pulses, XOR key animates, masked vs raw packets cross |
| 12–20    | Ping-Pong Keepalive | Three ping/pong pairs travel back and forth, ALIVE health meter oscillates |
Loop length: 20s.
## Key elements
- Client / Server nodes: accent (client), text (server), pulsing radius
- Packets: accent for client-origin, muted for server-origin, quadratic Bézier paths
- Frame layout bar: accent for MASK/PAYLOAD segments, muted for structural bytes
- ALIVE meter: accent fill, oscillating
## Notes
- Mask bit is visually highlighted in the frame bar to show why only client→server frames carry it
- The XOR glyph pulses on the PAYLOAD segment to suggest byte-level transformation
- All three beats crossfade at their boundaries so the 20 s loop wraps seamlessly
