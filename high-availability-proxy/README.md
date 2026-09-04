# High-Availability Proxy

A live load-balancing diagram: client requests flow through an HA proxy to
three backend nodes, and whenever one node fails the proxy detects it and
reroutes its traffic — total uptime stays 100%. One node goes down and
recovers at a time, rotating A → B → C each cycle.

## Story beats

| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–7 | All healthy | Three clients stream packets into the `HA Proxy`; it load-balances them to the healthiest of nodes A/B/C. Health-check pings ping-pong; load bars drift; `served` ticks up |
| 7–7.5 | Node dying | The on-duty node's border tints red and a down-cross (`✕`) fades in; a red blip lands when a ping fails |
| 7.5–14 | Node down · failover | Traffic targeted at the dead node is rerouted mid-flight to a live node (red-tinted packet + `rerouted` counter ticks); failover caption reads `node X down — traffic rerouted`; node load bar fills red |
| 14–16 | Recovering | A bright ring pulses and the node returns to `back online` / `ok`; its load bar refills green |
| 16–24 | Steady state | All three nodes healthy again as the next cycle winds down |

Loop length: 24s outer cycle. Which **node** fails rotates by cycle: node A
down during the first cycle, B during the next, C after that (so a full
A→B→C rotation is 72s), but the failure/recovery *timing within each 24s*
cycle is constant, so the loop seam is clean.

## Key elements

- Clients (left): three muted dots that pulse, label `C L I E N T S`
- HA Proxy (center): accent-ringed box, `active · load-balance`, arrival flash rings
- Nodes A/B/C (right): boxes with status line (`ok` / `down` / `back online`),
  a load bar (green → fail red), a red down-cross when failing, and recovery rings
- Packets: accent dots with trails that travel client → proxy → node; turn
  fail-red when rerouted mid-flight
- Health pings: small dots proxy → node (bright when ok, red on a failed node)
- HUD: title `High-Availability Proxy`, subtitle, bottom stats `served` /
  `rerouted` / `uptime 100%`

## Notes

- Park at `window.__time(3000)` for all-healthy, `window.__time(10500)` for
  the failover (`node down — traffic rerouted`), `window.__time(15000)` for
  the recovery ring.
- Unlike the `1nf`–`5nf` series this is a *live* simulation: entity state
  (packets, loads, counters) integrates over real frames, so the seek hook
  parks the *clock* (deterministic node states, captions, pings) but does not
  replay in-flight entities — fine for layout/status validation.
- Legacy graphic, kept as the reference for the shared-CSS `<link>` usage.
