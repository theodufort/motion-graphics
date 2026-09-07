# 1NF — One Value Per Cell

First normal form: every cell must hold one atomic value. A comma-stuffed
row is split into three filterable rows.

## Story beats

| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–9 | Problem | One employee row with comma lists (`sales, marketing` · `search, chatbot` · `postgres, go`). The 3 multi-value cells pulse red, a red scan beam sweeps the row. Badge: `✗ 3 multi-value cells`. Rule: "one atomic value per cell" |
| 9–11 | Transition | Problem fades out while the solution fades in (~0.9s crossfade); accent dots fan down the right edge |
| 9–23.4 | Solution | Three atomic rows (one value per cell), `employee_id` cells pulse green. Badge: `✓ atomic value per cell`. Counters: rows 1→3, values/cell 3→1 with a draining bar. Rule: "every cell filterable · indexable · joinable" |
| 23.4–24 | Wrap | Solution fades out as the problem beat fades back in — seamless loop |

Loop length: 24s.

## Key elements

- `employees` table (problem): columns `employee_id` (PK), `name`, `departments`, `projects`, `skills` — red (`--fail`) pulsing offending cells
- `employees` table (solution): same columns, 3 atomic rows — accent (`--accent`) pulsing PK cells
- Badges: red `✗` problem badge / accent `✓` solution badge (top right)
- Counters + bar (bottom left): rows and values-per-cell animate during the solution beat
- Red scan beam: sweeps the problem row every 2.8s

## Notes

- Park at `window.__time(4500)` for the problem beat, `window.__time(15000)` for the solution beat.
- Shared timing with the rest of the `1nf`–`5nf`/`bcnf` series: problem window `fw(t, 23000, 11200)`, solution window `fw(t, 9000, 14400)`, so the loop seam crossfades with no dark frame.
