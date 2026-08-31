# 2NF — Depend on the Whole Key

Second normal form: with a composite key, every non-key column must depend
on the *whole* key. A project name repeated per employee becomes one row in
its own `projects` table.

## Story beats

| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–9 | Problem | One wide table keyed by (`emp_id`, `proj_id`). `proj_name` = `search` repeats in two rows (both on project 101). At ~4.6s a red flash rings the `proj_name` header and a badge shows `RENAME 101 → ATLAS · UPDATE ×2 rows`. Rule: "proj_name repeats per employee" |
| 9–11 | Transition | Crossfade to the solution; accent dots fan down the right edge |
| 9–23.4 | Solution | Split into `employees` (id, name, department) + `projects` (id, name), joined by a dashed elbow connector with traveling dots ("join on id"). At ~15.8s the rename replays inside the single name cell: `search` crossfades to `atlas`. Badge: `RENAME 101 → ATLAS · UPDATE ×1 row`. Counter: rows touched 2→1. Rule: "every non-key column depends on the whole key" |
| 23.4–24 | Wrap | Solution fades out as the problem beat fades back in — seamless loop |

Loop length: 24s.

## Key elements

- Problem table: composite PK `emp_id` + `proj_id` (accent dots), offending `proj_name` cells flash red (`--fail`)
- Solution tables: `employees` + `projects`, both with accent PK headers; rename animation lives in the single `projects.name` cell
- Join connector: dashed accent elbow with 3 orbiting dots between the id columns
- Badges: red `×2 rows` (problem) vs accent `×1 row` (solution) — the core comparison
- Counter (bottom left): "rows touched" animates 2→1

## Notes

- Park at `window.__time(5000)` for the rename-flash problem beat, `window.__time(16500)` for the rename replay in the solution.
- Same shared 24s problem/solution windows as the rest of the normal-form series.
