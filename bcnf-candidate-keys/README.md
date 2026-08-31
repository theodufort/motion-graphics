# BCNF — Each Determinant Is a Key

Boyce–Codd normal form: every determinant must be a candidate key. When
`room_name → building` but the name isn't unique, the dependency
contradicts itself — a UNIQUE constraint makes the determinant a real key.

## Story beats

| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–9 | Problem | `rooms` table (id PK, room_name, building) where `lobby` appears in two rows (101 and 102). The duplicate names pulse red and a red bracket on the right reads `"lobby" → A wing — but "lobby" is 2 rows`. Badge: `✗ name not unique → not a key`. Rule: "every determinant must be a candidate key" |
| 9–11 | Transition | Crossfade to the solution; accent dots fan down the right edge |
| 9–23.4 | Solution | Same table with `room_name` now marked UNIQUE (green header), row 102 renamed to `foyer`. From ~12.4s a ghost row `310 · lobby · B wing` slides in; at ~13.9s it's rejected — red tint, red ✗, and the note `violates room_name → building (1 name, 2 values)`. Badge: `✓ names unique · FD holds`. Stats: determinants 3, candidate keys 2→3. Rule: "room_name is unique → determinant becomes a key" |
| 23.4–24 | Wrap | Solution fades out as the problem beat fades back in — seamless loop |

Loop length: 24s.

## Key elements

- Problem table: `room_name` cells for the two `lobby` rows pulse red (`--fail`); contradiction bracket annotation to the right of the table
- Solution table: `room_name` header gains a green (`--green-5`) UNIQUE marker; the `foyer` cell pulses softly
- Ghost row: `310 · lobby · B wing` enters at ~12.4s, rejected with a red ✗ flash at ~13.9s
- Stats (bottom): "determinants" = 3, "candidate keys" flips 2→3 when the rejection lands

## Notes

- Park at `window.__time(4500)` for the contradiction, `window.__time(14500)` for the ghost-row rejection.
- Same shared 24s problem/solution windows as the `1nf`–`5nf` series.
