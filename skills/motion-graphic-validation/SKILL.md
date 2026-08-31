---
name: motion-graphic-validation
description: Validate that a motion graphic in the motion-graphics workspace (c:\Clones\motion-graphics) is visually correct — no badly placed or overflowing text, no overlapping elements, no broken or frozen animation, no dark frames at the loop seam. USE THIS SKILL whenever you have just created or edited any graphic's index.html, whenever the user asks to check/verify/validate/fix a graphic, or whenever a graphic "looks off". The loop is vision-first: park the graphic at deterministic times with window.__time, screenshot, and inspect the screenshots with your vision; back up anything suspicious with measureText/pixel probes. A graphic is only done when it passes this loop.
---

# Motion Graphic Validation

Run this loop on **every graphic you create or edit**, before reporting it
done. It catches the three recurring failure classes:

1. **Badly placed text** — labels overflowing boxes or colliding (canvas
   `fillText` never wraps, so overflow is silent).
2. **Overlapping elements** — nodes/panels/meters/glows covering each other's
   content.
3. **Broken animation** — frozen elements, script errors, or a dark frame /
   jump at the loop seam.

You have **vision** — use it as the primary detector. Measurements are the
tie-breaker for the things vision gets wrong on downscaled screenshots.

## Prerequisites

- The graphic exposes `window.__time(ms)` to park the loop at an exact time.
  If it doesn't, add the seek hook first (pattern in
  `skills/motion-graphics/SKILL.md` → "Canvas architecture").
- Open the page in the built-in browser. If you just edited the file, reload
  with a cache-buster — the integrated browser serves stale scripts:
  `page.goto(url + '?nocache=' + Date.now())`.

## The loop

### 1. Loads clean

Confirm **zero** `pageerror`/console errors. One script error kills the whole
graphic (e.g. a stray `const` redeclaration in a draw function leaves
`window.__time` undefined and the canvas black). If `window.__time` is
`undefined`, stop here and fix the script error first.

### 2. Park and look (vision pass)

Park the graphic at 4–6 representative times and screenshot each. Good
default times for a `LOOP`-ms graphic:

| Park time              | What it shows                                |
| ---------------------- | -------------------------------------------- |
| `LOOP * 0.15`          | early beat — entrances, first labels         |
| `LOOP * 0.40`          | densest beat — most elements visible at once |
| `LOOP * 0.65`          | mid/late beat — state changes, counters      |
| `LOOP * 0.90`          | final beat — exits, wrap-up content          |
| `LOOP - 300` and `300` | the loop seam from both sides                |

Drive the seek via `run_playwright_code` (raw `window` refs fail in the
sandbox):

```js
return page.evaluate(() => {
  window.__time(7500);
  return "ok";
});
```

Then screenshot and **look at each image** for:

- Text touching, crossing, or running outside its box/panel edge.
- Text rendered over other text or over a busy background with no contrast.
- Elements covering each other's content; glows so large they wash out
  neighbors.
- Anything frozen mid-entrance, clipped at the canvas edge, or drawn in the
  wrong place.
- At the seam pair (`LOOP-300` vs `300`): a dark/empty frame or a jarring
  jump in content.

### 3. Confirm suspicions with measurement (tie-breaker)

Vision on **downscaled screenshots** produces false overlaps ("ghosted" or
doubled text) and can miss small real ones. When the vision pass flags
something — or when a beat is text-dense and you want certainty — verify
in-page instead of guessing:

- **Text collision test.** Instrument `ctx.fillText` to record each string's
  bounding box (`measureText` width + `actualBoundingBoxAscent/Descent`),
  run one parked frame, then pairwise rect-intersection test. Flag overlaps
  where `overlapX > 5px && overlapY > 0.6 * min(heights)`.
- **Fit test.** Each label must satisfy
  `measureText(label).width <= boxW - padding`; if not, shrink the font in a
  loop or shorten the label.
- **Pixel probes.** For glow/overlap questions, read raw
  `ctx.getImageData` scanlines in the suspect region — unaffected by
  screenshot scaling.

Trust `measureText` rects and pixel probes over shrunk crops.

### 4. Animation audit

- **Nothing frozen:** every meaningful element must enter, move, pulse, fill,
  count, or fade somewhere in the loop. Park at 3–4 times and confirm each
  element visibly changes state between them.
- **Loop seam sweep:** sample `t` from `LOOP - 2000` through `0` to `+2000`
  (screenshot a handful) and confirm no dark frame or jump at the wrap. The
  last beat's fade-out and the first beat's fade-in must crossfade
  continuously.
- **Motion is real:** confirm entity motion from runtime data (packet count /
  tail positions / counter values across two parked frames), not from one
  screenshot.

### 5. README sync check

The graphic's folder must contain a `README.md` (standard template in
`skills/motion-graphics/SKILL.md` → "Per-graphic README") that matches what
the graphic actually shows:

- Missing `README.md` → create one describing the current visual.
- Present but stale (beats, labels, timing, or elements changed by your
  edit) → update it in the same change.

The README is the description of the visual; if the screenshots you just
inspected contradict it, the README is wrong — fix the README, not just the
HTML.

### 6. Fix and re-run

Any failure → fix the layout/timing in the single `index.html` (and keep the
`README.md` in sync), reload with the cache-buster, and re-run steps 1–4.
Only report done when the full loop passes. Do not declare success from a
single screenshot.

## Known false alarms (don't "fix" these)

- **Frozen canvas / stuck counters in an unfocused tab** — idle integrated-
  browser tabs stall `requestAnimationFrame`. Bring the tab to the foreground
  or force a repaint (a screenshot does this) before judging. `pageerror`s
  surface regardless of focus.
- **`__time` + wait appears to do nothing** — rAF is stalled; call `frame(t)`
  synchronously inside `page.evaluate` instead, and verify with
  `ctx.getImageData` probes.
- **Stale look after an edit** — cached script; reload with
  `?nocache=<ts>`.
- **Element screenshots hang** on continuously-animating canvases ("waiting
  for element to be stable") — use clipped `page.screenshot({ clip })` or
  pixel probes instead.
- **"Doubled/ghosted" text in full-page screenshots** — usually a downscale
  artifact, not a real overlap. Confirm with the measurement step before
  changing layout.
- Keep `page.evaluate` payloads small (< ~1.5KB); large inline snippets come
  back as `SyntaxError: Invalid or unexpected token`.
