# 3NF — No Transitive Dependencies

Third normal form: non-key columns must depend on the key and nothing else.
A `dept → building` chain is broken by moving departments into a lookup
table with a foreign key.

## Story beats

| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–9 | Problem | One `employees` table (id, name, dept, building) where `sales` / `HQ · floor 2` repeat in all 3 rows, pulsing red. A red pill chain shows `id → dept → building`. Badge: `✗ dept repeats 3×`. Caption: "dept is not a key — change a building? update every row" |
| 9–11 | Transition | Crossfade to the solution; accent dots fan down the right edge |
| 9–23.4 | Solution | `employees` (id, name, `dept_id ↦`) + `departments` lookup (id, name, building), linked by a dashed FK line with traveling dots. Badge: `✓ dept lives in one place`. From ~16.2s, carol moves sales→marketing: her `dept_id` crossfades 1→2 and the marketing lookup row glows; badge becomes `carol → marketing · update ×1 id`. Counter: rows for a move 3→1. Rule: "non-key columns depend on the key — nothing else" |
| 23.4–24 | Wrap | Solution fades out as the problem beat fades back in — seamless loop |

Loop length: 24s.

## Key elements

- Problem table: `dept` + `building` cells pulse red (`--fail`) in all rows; `id → dept → building` dependency chain drawn as red pills
- Solution tables: `employees` with FK column `dept_id ↦`, `departments` lookup — accent PK headers
- FK connector: dashed accent line with 3 traveling dots between the tables
- Move animation: carol's `dept_id` text-swap 1→2 + glow ring on the `marketing` lookup row (dept flips stagger at 16.2s, 16.85s, 17.5s)
- Counter (bottom left): "rows for a move" animates 3→1

## Notes

- Park at `window.__time(4500)` for the problem beat, `window.__time(17000)` to catch carol's department move.
- Same shared 24s problem/solution windows as the rest of the normal-form series.
