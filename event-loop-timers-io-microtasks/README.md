# The Event Loop
Visualizes how JavaScript's event loop dispatches timers, IO callbacks, and microtasks through queues into the call stack.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–4      | Intro | Title fades in, all six nodes pulse into view, grid background |
| 4–11     | Timers | Packets flow Timers → Task Queue → Call Stack; counter ticks |
| 11–18    | IO Callbacks | Packets flow IO → Task Queue → Call Stack; queue meter fills |
| 18–26    | Microtasks | Call Stack queues microtasks; Event Loop drains ALL in rapid succession |
| 26–30    | Full Cycle | All three flows visible simultaneously; crossfades back to intro |
Loop length: 30s.
## Key elements
- Event Loop: central node, accent green, largest pulse
- Timers / IO Callbacks: source nodes, muted text
- Task Queue / Microtask Queue: queue nodes with fill meters
- Call Stack: bottom node, accent when executing
- Packets: traveling dots with fading Bézier trails
## Notes
- Microtask drain shows 4 packets in rapid succession to emphasize "drain all before next macrotask"
- All packet spawns are deterministic time windows — no persistent state at the loop seam
- Queue depth meters fill and drain in sync with packet arrivals
