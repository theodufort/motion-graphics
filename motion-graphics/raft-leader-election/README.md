# Raft Leader Election
Visualizes the four-phase Raft consensus cycle: heartbeat keeps the leader alive, timeout triggers candidacy, vote gathers majority, commit restores quorum.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–7.5    | Heartbeat | Node A pulses green, packets flow A→B and A→C |
| 7.5–15   | Timeout | Node A turns red, B's timer bar fills to 100 % |
| 15–22.5  | Vote | B sends vote-request to C, C returns grant; majority reached |
| 22.5–30  | Commit | B becomes leader, heartbeats resume B→A and B→C |

Loop length: 30 s.
## Key elements
- Node A: initial leader → failed (accent → fail)
- Node B: follower → candidate → new leader (muted → accent)
- Node C: follower / voter (muted)
- Timer bar: fail-coloured fill on B during timeout beat
- Packets: accent-coloured dots with fading trails along Bézier arcs
## Notes
- Packets are spawned by elapsed-time windows (`t % period`) so the loop is deterministic and seam-free.
- The last beat (commit) crossfades into the first (heartbeat) via the `beat()` fade-in/out helper — no dark frame at the wrap.
