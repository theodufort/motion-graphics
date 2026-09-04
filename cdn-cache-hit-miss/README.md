# CDN Cache Strategy
Explains how a CDN edge serves cache hits, fetches from origin on misses, and uses stale-while-revalidate to keep latency low while refreshing content in the background.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–7.5    | Cache Hit | Request packet travels Client→CDN, green HIT response returns instantly; hit-ratio meter climbs |
| 7.5–15   | Cache Miss | Request bounces Client→CDN→Origin (red tint), origin fetch returns, CDN caches the response |
| 15–22.5  | Stale-While-Revalidate | Stale response served immediately (amber), background revalidation packet flies CDN→Origin, cache refreshes |
| 22.5–30  | Summary | All three paths glow simultaneously with labels; meters settle; fades into beat 1 |
Loop length: 30s.
## Key elements
- Client node: left, muted text color
- CDN Edge node: center, accent green (hit) / fail red (miss) / amber (stale)
- Origin node: right, muted text color
- Request packets: small dots with fading trails along Bézier arcs
- Hit-ratio meter: bottom-left, accent fill
- Origin-load meter: bottom-right, fail fill
- Status label: above CDN node, swaps with crossfade
## Notes
- Packets are deterministic functions of t (no persistent state), so the loop is seam-free.
- The SWR beat shows two simultaneous packets: a fast stale response and a slower background revalidation.
- Beat 4's fade-out overlaps beat 1's fade-in at the 30 s / 0 s wrap for a seamless cycle.
