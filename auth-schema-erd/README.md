# Creator Pipe — Auth Schema ERD

An entity-relationship diagram of a hand-rolled auth schema (users,
sessions, password_resets) beside the public app schema, animated through
the five moments of an auth lifecycle. Token hashes only — plaintext tokens
never touch the database.

## Story beats

| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–6 | 1 · schema | The ERD assembles: auth panels (amber) fade in at t=0, public schema panels (blue) fade in mid-beat. Tables show columns with type notes; cardinality labels appear on the edges (`identity`, `owns`, `requests`, `contains`, `authors`) |
| 6–12 | 2 · sign up | A packet travels app → `auth.users` (8.0–9.9s): a new user row appears with email + pgsodium `password_hash`. Then users → sessions (9.2–10.5s): a `token_hash` session row is written |
| 12–18 | 3 · session | Re-auth packet app → users (13.2–15.1s), then sessions → app (14.6–16.7s) returns the `session id` packet to the client |
| 18–24 | 4 · login · logout | Re-auth (19.4–21.3s), then a revoke-all ripple users → sessions (21.0–22.7s): sessions rows tint red and `revoked=true` is written |
| 24–30 | 5 · password reset | App → `password_resets` issues a token (25.4–27.1s); consuming the reset (26.2–28.3s) sets `used_at` and revokes matching sessions |

Loop length: 30s.

## Key elements

- Auth tables (amber): `users`, `sessions`, `password_resets` — hand-rolled, pgsodium-hashed
- Public tables (blue, TypeORM): `profiles`, `conversations`, `messages`, `bounties`, `payouts`
- Packets: bright accent dots traveling the ERD edges with labels (`session`, `session id`)
- Beat chip (under the subtitle): shows the current beat name, tinted per beat
- Legend (bottom): amber = auth schema · accent = app + SECURITY DEFINER fns · blue = public schema
- HUD title: "Creator Pipe — auth schema", subtitle "hand-rolled auth · token hashes only · SECURITY DEFINER access"

## Notes

- Park at `window.__time(3000)` (schema), `9000` (signup), `15500` (session), `21500` (revoke), `27000` (reset).
- Beat overlays write live values into table type cells — those cells are intentionally left clear of static text.
- All state is a pure function of `t = now % 30000`; the loop seam is safe by construction (auth panel is on from t=0).
