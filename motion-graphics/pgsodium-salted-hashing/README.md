# pgsodium — Salted Password Hashing

How a password becomes a stored hash with argon2id: salt + pepper +
password enter a memory-hard work function, the hash is stored, and login
re-derives and compares. Plaintext never touches the database.

## Story beats

| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0.4–2.4 | Password in | A `new user` packet carries the `password` droplet from the user box toward the argon2id box |
| 2.6–9.2 | argon2id work | The box interior shows the real mechanism: 3 input chips (password=amber, salt=accent, pepper=violet), then a 6×3 memory-hard grid fills cell by cell. First half = Argon2i (data-independent, sequential dependency arrows, "resists side-channel"); second half = Argon2d (data-dependent, jump arrows, "deters GPU / ASIC"). Memory-hard meter fills ("memory-hard · RAM"). Input droplets fall from chips into the grid |
| 9.2–9.8 | Store | The `auth.users` DB panel slides in from the right; the email row (`ada@pipe.dev`) is written |
| 9.4–10.7 | Hash reveal | The `password_hash` cell fills char-by-char with deterministic hex (12 chars), then a completion pulse |
| 12.5–14.3 | Login | A candidate password travels user → pgsodium for re-derivation |
| 14.5–16.5 | Check | Re-derived hash compared against the stored one; the match check ✓ appears in the gap between hex-end and panel edge |
| 16.3–17.05 | Wrap | All written content (hash hex, email row, check) fades out via `outAlpha` so the loop restarts clean — no jump at the seam |

Loop length: 18s.

## Key elements

- User box (left): `new user` / login candidate source
- argon2id box (center): title `argon2id`, input chips, 18-cell memory grid, hybrid phase label, memory-hard meter
- Pepper key: violet `AUTH_PGSODIUM_KEY` panel with a key line landing on the box's left edge
- `auth.users` DB panel (right): `email` + `password_hash` rows; appears dynamically at 9.2s (slide + fade)
- Reject path: red curve with `plaintext? no` × — plaintext is never stored
- HUD title: "argon2id — salt + pepper + password", subtitle "hybrid i/d · memory-hard · unique salt"

## Notes

- Park at `window.__time(7500)` (memory grid mid-fill), `11000` (stored hash), `15500` (login check).
- Salt is constant per loop (fixed seed) so it doesn't re-roll at the seam; the shuffling salt during digest advances with `t`.
- The hash is 12 hex chars at 0.0115·W — a longer string overruns the `password_hash` cell and collides with the row label and match check. Keep it short.
