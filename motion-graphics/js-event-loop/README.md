# The Event Loop: Timers, IO, Microtasks
Visualizes how JavaScript's event loop prioritizes microtasks over macrotasks, showing timers, IO callbacks, and Promise resolution flowing through queues to the call stack.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–6 | Architecture | All nodes pulse, faint connections, labels fade in |
| 6–13 | Timer fires | Packet: Web APIs → Task Queue → Event Loop → Call Stack |
| 13–20 | IO callback | Packet: Web APIs → Task Queue → Event Loop → Call Stack |
| 20–27 | Microtask priority | Packet: Web APIs → Microtask Queue → drains BEFORE Task Queue |
| 27–30 | Crossfade | Fades back into architecture beat, seamless loop |
Loop length: 30s.
## Key elements
- Call Stack: left node, accent color, pulses
- Event Loop: center node, accent, rotating ring
- Task Queue: upper-right, muted, macrotask packets
- Microtask Queue: lower-right, accent, priority packets
- Web APIs: top-center, muted, source of timers/IO
## Notes
- Microtask queue always drains fully before the next macrotask is pulled — shown by the microtask packet arriving at the stack before the task-queue packet in beat 3.
- Packets use quadratic Bézier paths with fading trails for organic motion.
