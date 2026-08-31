# AGENTS.md — motion-graphics workspace

Conventions for any agent (or human) working in this repo.

## What this repo is

A collection of small, self-contained motion graphics. Each graphic is a
single `index.html` in its own folder, styled by the **shared, branded CSS**
in `css/` so everything matches theodufort.com.

```
motion-graphics/
├── AGENTS.md
├── css/
│   ├── brand.css    ← design tokens: colors, gradients, radii, glows, fonts
│   └── motion.css   ← reusable components: #stage, .scene, .node, .req, …
└── <topic-name>/
    ├── index.html   ← the graphic itself
    └── README.md    ← standard description of what the visual is (kept in sync)
```

## Before creating anything: prefer editing over generating

New folders are expensive. **Default to modifying an existing graphic, not
generating a new one.**

1. **Search first.** Before proposing a new `<topic>/index.html`, list the
   existing graphic folders and check whether the request is already covered
   (or is a variant of something that exists — e.g. the `1nf`–`5nf` series,
   `auth-schema-erd`, `pgsodium-salted-hashing`).
2. **Edit if it exists.** If the topic matches an existing graphic, edit that
   graphic's `index.html` in place. Do not fork it into a second folder.
3. **Create only when genuinely new.** A new folder is justified only when the
   concept is distinct from every existing graphic. When in doubt, ask the
   user whether to extend an existing graphic or create a new one.
4. **One request ≠ one folder.** A batch of related tweaks is a series of
   edits to one file, not several new graphics.

## Rules for creating a new motion graphic

Follow these exactly (full guidance lives in the `motion-graphics` skill in
this repo at `skills/motion-graphics/SKILL.md` — read it for the component
reference and workflow):

1. **Reuse the shared CSS.** Link both files from the graphic; build from
   their existing classes before writing any custom CSS:
   ```html
   <link rel="stylesheet" href="../css/brand.css">
   <link rel="stylesheet" href="../css/motion.css">
   ```
   Never hardcode brand hex colors — use the CSS variables from `brand.css`.
   A small local `<style>` block is fine for graphic-specific keyframes, but
   it must not re-declare anything the shared files already provide, and it
   must not edit the shared files.
2. **One folder, two files.** A new graphic produces exactly
   `<topic-kebab-case>/index.html` and `<topic-kebab-case>/README.md` — no
   extra CSS/JS files, no subfolders, nothing else.
3. **Per-graphic README, kept in sync.** Every graphic folder has a standard
   `README.md` describing what the visual **is** (or **should be** — write it
   first when creating, as the spec you build against). Whenever you change
   the HTML — beats, labels, layout, timing, entities — update the README in
   the same change. If an existing graphic lacks one, create it describing
   the current visual. Template lives in `skills/motion-graphics/SKILL.md` →
   "Per-graphic README".
4. **One single page — never a slideshow.** No play/pause/next/prev HUD, no
   scene switching, no powerpoint-style stepping. Everything plays on one
   continuous timeline by itself (loops if possible). If it can be done with
   CSS keyframes + `animation-delay`, do that instead of JS.
5. **Animation over static elements.** Every element should enter, move,
   pulse, count, or transition. Nothing should sit frozen for a beat.
6. **Minimal text.** Short title (3–6 words), 2–4 word node labels, no
   paragraphs. Prefer `.counter` numbers over sentences.

## Self-validation loop (mandatory — never skip)

Every graphic you create **or edit** must pass the validation loop before you
report it as done. The full procedure lives in its own skill:
**`skills/motion-graphic-validation/SKILL.md`** — read and run it. Summary:

1. **Loads clean.** Open the page in the built-in browser; confirm zero
   `pageerror`/console errors. A single script error kills the whole graphic.
2. **Deterministic seek.** The graphic must expose `window.__time(ms)` so any
   moment of the loop can be parked and inspected. If you edited a graphic
   that lacks it, add it.
3. **Vision pass (primary).** Park at 4–6 representative times (including
   both sides of the loop seam), screenshot each, and inspect the images with
   your vision for badly placed/overflowing text, overlapping elements,
   frozen or broken animation, and dark seam frames.
4. **Measurement pass (tie-breaker).** Vision on downscaled screenshots can
   both hallucinate and miss overlaps — confirm anything suspicious (and any
   text-dense beat) with `measureText` rect-intersection tests and
   `ctx.getImageData` pixel probes. Canvas text never wraps, so overflow is
   silent until measured.
5. **Animation audit.** Confirm every element enters/moves/pulses (nothing
   frozen), and sweep the loop seam (`t ≈ LOOP` → `0`) for dark frames or
   jumps.
6. **README sync.** The graphic's `README.md` must exist and match what the
   screenshots show — create it if missing, update it if your edit changed
   the visual.
7. **Fix and re-run.** Any failure → fix the layout/timing and re-run the
   loop. Do not declare success from a single screenshot.

## Reference

`high-availability-proxy/` is a legacy example of linking the shared CSS.
It is a scene-cycling slideshow with a HUD — **do not imitate its
interaction pattern**; only copy its `<link>` usage and class styling.
