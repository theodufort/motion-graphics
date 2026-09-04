# Load Balancer Health Checks
Visualises how a load balancer probes backends, ejects a failing node, and re-admits it once healthy.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5 | All Healthy | Three green nodes, probes flowing, meters full |
| 5–10 | Degraded | Node B health drops, probes turn amber→red |
| 10–15 | Ejected | Node B red, no probes, traffic rerouted to A & C |
| 15–20 | Recovering | Node B meter refills, colour shifts back to green |
| 20–25 | Re-admission | Probe reaches Node B, node re-joins pool |
| 25–30 | All Healthy | All three green, seamless loop back to start |

Loop length: 30s.
## Key elements
- LB node: accent green, pulsing circle, "LB" label
- Backend nodes: accent/fail colour, "Node A/B/C" labels
- Probe packets: travelling dots with fading trails along Bézier paths
- Health meters: fill bars under each node, labelled healthy/ejected/recovering
- Connection counter: ticking number top-left
- Status badge: top-right, colour-coded (green/amber/red)
## Notes
- Node B (index 1) is the ejected node; its state is a pure function of beat position.
- Probes are spawned via elapsed-time windows so the loop is deterministic and seam-free.
- Connection count oscillates slightly (sin) to feel alive even when stable.
