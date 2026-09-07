# TLS Handshake Encrypted Channel
Visualizes the four-step TLS 1.3 handshake from Client Hello to encrypted data flow, showing how a secure channel is established between two endpoints.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–3 | Intro | Title fades in, client & server nodes materialize with pulse |
| 3–8 | Client Hello | Packet travels left→right along Bézier arc, step counter ticks to 1 |
| 8–13 | Server Hello + Cert | Packet travels right→left, certificate badge appears on server |
| 13–18 | Key Exchange | Two sequential packets (Key Share L→R, Finished R→L), step 3 |
| 18–23 | Channel Lock | Client Finished L→R, padlock icon scales in, channel line turns accent |
| 23–28 | Encrypted Flow | Bidirectional data packets stream, meters fill, "Secured" label |
| 28–30 | Fade Out | All elements fade to black, seamless wrap into next loop |
Loop length: 30s.
## Key elements
- Client node: left circle, accent pulse, label "Client"
- Server node: right circle, accent pulse, label "Server"
- Handshake packets: small glowing dots with fading trails along quadratic Bézier
- Padlock icon: scales in at channel-lock beat, accent color
- Progress meter: horizontal bar fills 0→100% across handshake steps
- Step counter: large number ticks 1→4 during handshake
- Data packets: bidirectional streams in encrypted-flow beat
## Notes
- All packet positions are pure functions of t (no persistent state), guaranteeing a seamless loop
- The channel line transitions from muted to accent color at the lock beat with a crossfade
- Grid background uses rgba(255,255,255,0.03) for subtle depth
- DPI-aware via setTransform(dpr,0,0,dpr,0,0) on every resize
