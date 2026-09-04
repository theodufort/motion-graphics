# JWT Verification Flow
Animated pipeline showing how a JWT is decoded, its signature verified against a secret key, and claims extracted — the three-step trust chain.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5      | Decode | Token splits into three segments, packets fly to Header/Payload/Sig nodes |
| 5–12     | Parse JSON | Segments settle, nodes pulse, beat label updates |
| 12–19    | Verify Signature | Packets travel Sig↔Key, checkmark draws in |
| 19–27    | Extract Claims | Payload→Claims packet, claim lines type in |
| 27–30    | Valid ✓ | All elements fade, checkmark holds, loops back to Decode |
Loop length: 30s.
## Key elements
- Token node: accent, top-center, splits into three base64 segments
- Header / Payload / Sig nodes: text color, middle row
- Secret Key node: muted, bottom-right
- Claims node: accent, bottom-left, with three monospace claim lines
- Packets: accent dots with fading trails along quadratic Bézier paths
## Notes
- Token segments animate apart (split offset) to visually "decode" the token
- Checkmark uses a progress clamp so it draws in rather than popping
- All positions derived from W/H fractions; no hardcoded pixels
