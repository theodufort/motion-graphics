# Kafka Exactly-Once Path
Visualises how a producer partitioner routes keys to partitions, a consumer group tracks offsets, and the transactional commit path guarantees exactly-once semantics.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–9  | Partition | Producer → Partitioner → 3 partitions, key-based routing packets |
| 7–17 | Consume | Partitions → Consumer Group, offset counter ticks upward |
| 15–24 | Commit | Consumer ↔ Offset Store, transactional commit with ✓ badge |
Loop length: 24s.
## Key elements
- Producer / Partitioner / P-0…P-2: accent, routing path
- Consumer Grp: accent, group coordinator
- Offset Store: muted, persistent offset log
- Packets: accent dots on quadratic Bézier paths with glow
- Offset counter: accent, ticks during consume beat
- Commit badge: accent ✓, appears during commit beat
## Notes
- Beats overlap by ~2 s so the loop never shows a dark frame at the wrap.
- Packet spawns are deterministic (elapsed-time windows), no persistent state.
- Node radius pulses via sin(t/400) for continuous micro-motion.
