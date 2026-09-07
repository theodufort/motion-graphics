# etcd Lease Keepalive TTL
Explains how an etcd client renews a lease via periodic keepalive pings to prevent TTL expiry and key eviction.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–4      | Stable lease | TTL ring full, "Lease Active" label, nodes pulsing |
| 4–12     | TTL draining | Ring depletes 10s→4s, "TTL Draining" label, ring turns red |
| 12–14    | Renewal ping | Keepalive packet travels client→server, ring refills |
| 14–28    | Active keepalive | Ring full, repeated pings every 2.5s, "Lease Active" |
| 28–30    | Loop close | Last ping fades, state matches t=0 for seamless wrap |
Loop length: 30s.
## Key elements
- Client Node: accent circle, left
- etcd Server: accent circle, right, hosts TTL ring
- TTL Ring: accent→fail arc around server, shows remaining seconds
- Keepalive Ping: accent packet on Bézier path with trail
- Status Label: muted/fail text below server
## Notes
- Persistent elements (nodes, ring, title) never fade to zero — only transient packets and status crossfades use time windows, guaranteeing no dark seam frame.
- Packets spawn via elapsed-time windows so the loop is fully deterministic.
