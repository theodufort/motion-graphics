# Bloom Filter Hashes
Explains how k hash functions set bits in a fixed array, and how false-positive probability grows as more items are inserted.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–2      | Setup | Title, hash nodes, bit array visible; item 1 fades in |
| 2–5      | Insert 1 | Packet travels item→hash→bit; bit flips to 1; n=1, FP≈0% |
| 5–8      | Insert 2 | Item 2 fades in; packet animates; more bits set; n=2 |
| 8–11     | Insert 3 | Item 3 fades in; packet animates; n=3, FP rising |
| 11–14    | Insert 4 | Item 4 fades in; packet animates; n=4, FP meter fills |
| 14–30    | Steady | All items visible; bits pulse; FP meter holds; counters tick |
Loop length: 30s.
## Key elements
- Hash nodes H1–H3: accent, pulsing circles at top
- Bit array (16 cells): accent when set, muted when clear
- Item nodes (1–4): accent, stacked vertically on left
- FP meter: accent→fail as probability rises
- Packets: accent dots with fading trails along Bézier paths
## Notes
- Items fade in sequentially and remain visible through the loop wrap (no fade-out), preventing a dark seam frame.
- Each item occupies a distinct vertical slot so labels never collide.
