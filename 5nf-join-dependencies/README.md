# 5NF — Kill the Join Dependency

Fifth normal form: when a fact is really three pairwise relationships
flattened into one table, the same pairs repeat and the table can only be
rebuilt by joining them back. Split into three junction tables, one fact
each.

## Story beats

| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–9 | Problem | Flat `supplier × product × region` table, 2×2×2 = 8 rows. A red bracket on the left marks `"acme+widget" ×2 regions` — the same pair repeats for every region. Badge: `✗ 2×2×2 flat = 8 rows`. Rule: "same pair repeats for every region — join dependency" |
| 9–11 | Transition | Crossfade to the solution; accent dots fan down the right edge |
| 9–23.4 | Solution | Three junction tables side by side: `product_regions` (3 rows), `supplier_products` (3 rows, center, glowing), `supplier_regions` (3 rows), each with composite PKs and dashed join connectors between neighbors. Note: "suppliers (2) and products (2) hold the flat id → name lookups". Badge: `✓ 3 junction tables · one fact each`. Counters: rows 8→11, repeated pairs 4→0. Rule: "each (a,b) pair lives exactly once — no join dependency" |
| 23.4–24 | Wrap | Solution fades out as the problem beat fades back in — seamless loop |

Loop length: 24s.

## Key elements

- Problem table: 8 flat rows (acme/globex × widget/gadget × eu/us), red (`--fail`) pulsing bracket annotation outside the table's left edge
- Solution tables: `product_regions`, `supplier_products`, `supplier_regions` — composite-PK headers with accent dots; the center junction gets a soft accent glow
- Join connectors: dashed accent lines between adjacent tables
- Counters (bottom): "rows" 8→11 and "repeated pairs" 4→0 — more rows, zero redundancy

## Notes

- Park at `window.__time(4500)` for the problem beat, `window.__time(15000)` for the three-junction solution.
- Same shared 24s problem/solution windows as the rest of the normal-form series. Annotation brackets are drawn outside the table bounds by design — keep them there when editing.
