# JWT Verification Flow
Explains the three-step JWT verification pipeline — decode, signature check, claims validation — showing that a token is only trusted after all three gates pass.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Token Split | JWT bar assembles in center, three segments separate with labels |
| 5–12 | Decode | Packets travel to left (Header) and right (Payload) panels; JSON fields appear |
| 12–20 | Signature Check | Key icon, HMAC meter fills, two hashes align, checkmark stamps |
| 20–27 | Claims Validate | exp / sub / role rows appear sequentially, each gets a green check |
| 27–30 | Verified | "Verified" badge pulses, all elements crossfade back to beat 1 |
Loop length: 30s.
## Key elements
- Token segments: accent (header), text (payload), muted (signature)
- Decode panels: surface boxes with accent border glow
- HMAC meter: accent fill bar
- Claim rows: text labels with accent checkmarks
- Packets: accent dots with fading trails along Bézier paths
## Notes
- Packets are spawned via elapsed-time windows so the loop is deterministic and seam-free.
- The last beat crossfades into the first beat simultaneously — no dark gap at the wrap.
- All positions derive from W/H fractions; DPI handled via setTransform.
