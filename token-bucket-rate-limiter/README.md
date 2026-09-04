# Token Bucket Rate Limiter
Explains how a token bucket refills, absorbs bursts, and throttles overflow — takeaway: capacity + refill rate define the burst ceiling.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–6      | Refill | Bucket fills to 100%, drip animation, counter at 0 |
| 6–14     | Steady | 4 packets trickle in, bucket dips slightly, counter ticks |
| 14–22    | Burst | 6 rapid packets, bucket drains fast, meter spikes |
| 22–28    | Throttle | 4 packets rejected (429), bucket empty, red meter |
| 28–30    | Refill | Bucket begins refilling, crossfades into beat 0 seamlessly |
Loop length: 30s.
## Key elements
- Bucket: accent fill, shows token level 0–100%
- Source nodes: muted, pulse with sin
- Packets: accent (accepted) / fail (rejected), travel Bézier paths
- Throughput meter: accent or fail fill
- Accepted counter: accent, ticks up
## Notes
- "Refill" label spans the loop seam (28s→6s) with no dark frame
- Packets are spawned from elapsed-time windows so the loop is deterministic
- Trail dots use the corrected `tp` variable (not self-referencing)
