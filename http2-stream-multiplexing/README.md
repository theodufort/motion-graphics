# HTTP/2 Core Mechanics
Explains how HTTP/2 multiplexes streams over one connection, compresses headers with HPACK, and applies window-based flow control.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–10     | Multiplexing | Three colored streams travel simultaneously between Client and Server nodes |
| 10–20    | Header Compression | A header block shrinks 70% as it crosses the connection (HPACK) |
| 20–30    | Flow Control | A window meter fills/empties; packets bob and dim when the window is full |
Loop length: 30s.
## Key elements
- Client / Server nodes: accent green / blue, pulsing
- Stream packets: accent, blue, purple — travel with fading trails
- Header block: accent outline, size counter ticks down
- Window meter: accent fill, "Window" label
## Notes
- Dashed connection line animates direction to imply bidirectional traffic
- Beat crossfades are 1 s wide so the 30 s → 0 s wrap is seamless
- Packet spawn timing is derived from `t % cycle` — no persistent state, fully deterministic
