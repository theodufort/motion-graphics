# Raft Leader Election
Visual walkthrough of a three-node Raft cluster: heartbeat keeps the leader alive, timeout triggers candidacy, voting elects a new leader, and commit restores stable operation.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–6      | Heartbeat | Node A (leader) pulses green, packets flow A→B and A→C |
| 6–12     | Timeout | A turns red and stops; B & C timer arcs fill toward expiry |
| 12–18    | Vote | B becomes candidate (amber), sends vote requests; C replies "yes" |
| 18–24    | Commit | B turns green (leader), heartbeats resume B→C, C follows |
| 24–30    | Stable | Identical to Heartbeat beat — seamless loop wrap |
Loop length: 30s.
## Key elements
- Node A / B / C: circles, accent (leader) / muted (follower) / fail (dead)
- Timer arc: accent fill, shows election timeout countdown
- Packets: small glowing dots on quadratic Bézier paths with fading trails
- Status label: 2-word crossfade under each node (Leader / Follower / Candidate / Dead)
- Title: 3-word beat label, top-center, crossfades per beat
## Notes
- Timer arcs are deterministic functions of t (no persistent state), so the loop is seam-free.
- Packet spawn windows are derived from elapsed beat time, guaranteeing identical packets every cycle.
- The last 6 s mirror the first 6 s exactly, so the wrap is invisible.
