# 4NF — Stop the Row Explosion

Fourth normal form: independent multi-valued facts (skills and certs) must
not share a table, or their cross product explodes the row count.

## Story beats

| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–9 | Problem | One flat table (id, name, skill, cert) with all 3×3 = 9 skill×cert combinations; `alice`'s name repeats 9× with a dashed red line down the name column, cells pulsing red. Badge: `✗ 3 skills × 3 certs = 9 rows`. Rule: "skills and certs are independent — the grid multiplies" |
| 9–11 | Transition | Crossfade to the solution; accent dots fan down the right edge |
| 9–23.4 | Solution | Three tables: `employees` (id, name) plus two junction tables `emp_skills` (emp_id, skill) and `emp_certs` (emp_id, cert), each with composite PKs, connected by dashed elbow connectors with traveling dots. Badge: `✓ (emp, skill) + (emp, cert) — composite PKs`. Counters: rows 9→11, name copies 9→1. Rule: "each multivalued dependency gets its own table" |
| 23.4–24 | Wrap | Solution fades out as the problem beat fades back in — seamless loop |

Loop length: 24s.

## Key elements

- Problem table: 9 rows of the skill×cert cross product, red (`--fail`) pulsing tints, dashed red "name × 9" callout line
- Solution tables: `employees` + `emp_skills` (5 rows) + `emp_certs` (6 rows); composite-PK headers marked with accent dots
- Connectors: dashed accent elbows from employees down into each junction table's id column, with 2 traveling dots
- Counters (bottom): "rows" 9→11 (more rows, but…) and "name copies" 9→1 (…no duplication)

## Notes

- Park at `window.__time(4500)` for the problem beat, `window.__time(15000)` for the junction-table solution.
- Same shared 24s problem/solution windows as the rest of the normal-form series.
