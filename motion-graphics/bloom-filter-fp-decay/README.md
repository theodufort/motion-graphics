# Bloom Filter FP Decay
Visualizes how a bloom filter's false-positive probability decays as the bit-array size grows relative to inserted elements.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Title + bit array | Title fades in; 16-cell bit array pulses into view |
| 5–10 | Insertion | Three hash nodes fire; packets travel along Bézier arcs to set bits |
| 10–15 | True positive | All queried bits lit green; "true positive ✓" label |
| 15–20 | False positive | Red packets hit coincidentally-set bits; "false positive ✗" label |
| 20–28 | Probability decay | Meter fills as m counter ticks 16→256; P(FP) drops 70%→2% |
| 28–30 | Crossfade | Meter fades out; title fades back in for seamless loop |

Loop length: 30s.
## Key elements
- Bit array: 16 cells, accent (set) / fail (FP) / muted (empty)
- Hash nodes h1–h3: accent circles, pulsing
- Packets: accent (insert) / fail (FP), quadratic Bézier with fading trail
- FP meter: accent fill bar, fail percentage counter
## Notes
- Packets are deterministic (elapsed-time windows), no persistent state at the wrap.
- The meter's fill width is inversely proportional to the displayed P(FP), so the bar grows as probability decays.
