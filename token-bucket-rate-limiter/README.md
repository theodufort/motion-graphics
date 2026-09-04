# Token Bucket Rate Limiter
Explains how a token-bucket rate limiter refills, serves steady traffic, absorbs a burst, and rejects overflow — takeaway: burst capacity is bounded by the bucket size, and refill rate sets the sustained ceiling.
## Story beats
| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–5      | Refill | Tokens pour into the bucket (5→10), green packets flow from Refill node |
| 5–10     | Consume | Steady request stream drains tokens (10→4), white packets from Requests node |
| 10–15    | Burst | Rapid-fire requests (5 packets), tokens hit 0, red rejection packets appear |
| 15–20    | Refill | Bucket refills back to 5, green packets resume, loop closes seamlessly |
Loop length: 20s.
## Key elements
- Bucket: central container, accent green fill proportional to token count
- Refill node: top, accent green, source of tokens
- Requests node: left, text white, source of incoming requests
- Allowed node: right, accent green, destination of accepted requests
- Rejection packets: fail red, appear during burst when bucket is empty
- Token counter: animated number + meter bar below bucket
## Notes
- Token count is a continuous periodic function (5→10→4→0→5) so the seam at t=0/t=LOOP always shows 5 tokens — no dark frame
- Label crossfades use 5% fade windows; at the seam "Refill" is at full opacity
- All packet positions are pure functions of t (deterministic, no persistent state)
