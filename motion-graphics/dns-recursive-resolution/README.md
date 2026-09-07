# DNS Recursive Query Chain
Visualizes how a recursive resolver walks the DNS hierarchy, caches the answer, serves cache hits, and re-queries after TTL expiry.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | Query Chain | Packets travel Client → Resolver → TLD → Authoritative |
| 5–10 | Response & Cache | Packets return; cache box fades in below Resolver |
| 10–15 | Cache Stored | TTL counter at 300 s, meter full, nodes idle-pulse |
| 15–20 | Cache Hit | Fast green packets Client ↔ Resolver only (no upstream) |
| 20–25 | TTL Expiry | TTL ticks 300→0, meter drains, border shifts to red |
| 25–30 | Re-query | Full chain repeats, cache gone — seamless loop |
Loop length: 30 s.
## Key elements
- Nodes (Client, Resolver, TLD, Authoritative): accent-stroked circles, pulsing
- Packets: accent dots with fading trails along quadratic Bézier arcs
- Cache box: surface panel with TTL counter + drain meter (accent → fail)
- Beat labels: muted text, crossfaded
## Notes
- Cache box and TTL meter are the only elements that change colour (accent → fail) to signal expiry.
- Re-query beat (25–30 s) mirrors the opening beat so the wrap is visually seamless.
