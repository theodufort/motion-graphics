# ASSUMPTIONS

- 2026-09-04 (M1): loop model has no image-input support. The automated
  "vision pass" in tool/validate.mjs is therefore implemented as
  deterministic in-page probes (getImageData mean brightness, fillText
  rect collisions, pageerror). PNGs are still saved to tool/shots/ for
  human or vision-capable model review.
- 2026-09-04 (M1): `window.LOOP` is not a global in existing graphics
  (const-scoped). Validator derives LOOP by parsing `const LOOP = <n>`
  from the HTML source; generator template must additionally expose
  `window.__loop = LOOP` for new graphics.
