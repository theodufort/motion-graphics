# CDN Cache Hit vs Miss
Explains how a CDN edge node serves cached content instantly, fetches from origin on a miss, and uses stale-while-revalidate to hide revalidation latency.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–8 | Cache Hit | Request → CDN, instant green response, 12 ms counter |
| 8–16 | Cache Miss | Request → CDN → Origin fetch → slow red response, 240 ms |
| 16–24 | Stale-While-Revalidate | Stale served fast, background revalidate to origin |
| 24–30 | Metrics | Hit-rate meter fills to 94 %, latency bars compare |
Loop length: 30s.
## Key elements
- Client node: muted, left
- CDN Edge node: accent green, center
- Origin node: fail red, right
- Packets: colored dots with fading trails along Bézier arcs
- Hit-rate meter: accent fill bar
- Latency counters: accent / fail text
## Notes
- SWR beat shows two simultaneous paths: fast stale response + slow background revalidate
- Beat 4 crossfades seamlessly into beat 1 (no dark frame at wrap)
- All packet spawns are deterministic windows of t, no persistent state
