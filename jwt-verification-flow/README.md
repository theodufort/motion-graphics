# JWT Verification Flow
A looping motion graphic that walks through the three stages of JWT verification — decode, signature check, and claims validation — showing that a token is only trusted after all three pass.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–11.4   | Decode | Token splits into Header + Payload panels; packets travel from token to panels |
| 9–18.6   | Signature | HMAC meter fills; checkmark pops; packets flow to signature box |
| 16.5–24.6| Claims | Three claim rows (exp, sub, role) appear with sequential checkmarks |
| 22.5–29.4| Verified | "✓ Verified" badge pulses with expanding ring; crossfades back into Decode |
Loop length: 30s.
## Key elements
- Token bar: three segments (Header / Payload / Signature), accent + text + muted
- Decode panels: left (Header) and right (Payload), accent border
- Signature meter: accent fill bar with checkmark, accent
- Claim rows: monospace key-value pairs with checkmarks, accent
- Verified badge: accent text + ring pulse
- Packets: accent dots with fading trails along Bézier paths
## Notes
- The first beat (Decode) wraps around the loop seam (visible from 93%→38%), crossfading with the last beat (Verified) so no frame is ever near-empty.
- All positions derive from W/H; DPI-aware via setTransform.
- Deterministic: every element is a pure function of t = now % LOOP.
