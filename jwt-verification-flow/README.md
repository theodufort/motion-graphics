# JWT Verification Flow
Animated walkthrough of how a JWT is decoded, its signature verified against a secret key, and its claims extracted — showing the three-stage pipeline in one seamless loop.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Decode | Token splits into header / payload / signature segments |
| 5–12 | Parse JSON | Packets flow from token to header & payload nodes |
| 12–20 | Verify Signature | Packet travels sig→key→sig, checkmark appears |
| 20–27 | Extract Claims | Payload feeds claims node; sub, exp, role tick in |
| 27–30 | Valid ✓ | Final confirmation, fades into next loop |
Loop length: 30s.
## Key elements
- JWT Token: accent, center-top origin node
- Header / Payload / Signature: text-colored, mid-row decode targets
- Secret Key: muted, bottom-right verification partner
- Claims: accent, bottom-center extraction target
- Packets: accent dots with fading trails along quadratic Bézier paths
## Notes
- Token segments split apart with a staggered offset during beat 1 to visualise the three dot-separated parts.
- The checkmark at the signature node only renders after the round-trip packet (sig→key→sig) completes, reinforcing the HMAC round-trip.
- All positions are proportional (W×, H×) so the layout adapts to any viewport.
