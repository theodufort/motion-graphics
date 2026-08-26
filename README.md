# Motion Graphics

Small, self-contained HTML motion graphics. Every graphic draws its look from
the **shared, branded CSS** in `css/`, so the palette always matches
theodufort.com.

    motion-graphics/
    ├── css/                     shared CSS (see below)
    ├── skills/motion-graphics/  the skill that defines how to build graphics
    ├── AGENTS.md                rules for agents working in this repo
    └── <topic-kebab-case>/
        └── index.html           one graphic = one folder with exactly this

## Building a new graphic

Follow the `motion-graphics` skill (`skills/motion-graphics/SKILL.md`) and
`AGENTS.md`. The short version: one folder with a single `index.html`, link
`css/brand.css` + `css/motion.css`, one continuously animating page (no
slideshow, no controls), minimal text, everything in motion.

## Shared CSS (`css/`)

| File | Purpose |
| --- | --- |
| `css/brand.css` | Design tokens only — colors, radii, glows, gradients, fonts. Single source of truth, lifted from the website (`personal-website-v2/src/app/globals.css`). Import **first**. |
| `css/motion.css` | Reusable motion-graphic components — `#stage`, scenes, typography, `.diagram`/`.node`, `.req` flow dots, meters, `.fade-up` entrance, responsive + reduced-motion rules. Import **second**. |

New graphic? Just link both files — you inherit the full brand theme:

```html
<link rel="stylesheet" href="../css/brand.css">
<link rel="stylesheet" href="../css/motion.css">
```

Then style any part you need differently in a small local `<style>` block
(your rules come later in the cascade, so they win).
`ha-proxy-motion-graphic/` shows a compliant graphic in action: one
continuously looping 32s timeline on a single canvas — no slideshow, no
HUD.

## Brand palette (from the website)

- Backgrounds: `--bg` `#090909`, `--bg-2` `#111111`, `--surface` `#1c1c1c`
- Text: `--text` `#ededed`, `--muted` `#8f8f8f`
- Accent (primary green): `--accent` `#3ecf8e`; full green scale
  `--green-2`…`--green-5`
- Signature gradient: `--grad-accent` → `linear-gradient(135deg, #3ecf8e, #2b9f6e)`
- Danger: `--fail` `#ef4444`
- Borders: `--border` `rgba(255,255,255,.06)`, `--border-strong` `.12`

Never hardcode brand hex values inside a graphic — reference the CSS
variables from `brand.css` instead.

## Component reference (css/motion.css)

- `#stage` — the 16:9 canvas (radial gradient from `--grad-canvas`).
- `h1` / `h2` / `p` / `.big` — type; `.big` is the green-gradient headline.
- `.label`, `.pill` — uppercase chip labels (`.pill-fail` / `.pill-ok` local).
- `.diagram` + `.node` — flex rows of boxes; tint a node with
  `.tint-green|tint-neural|tint-mute|tint-fail` (or a local tint) and give it a
  state with `.is-ok` (pulses green), `.is-fail` (pulses red), `.is-down`.
- `.req` — a traveling request dot (add `fail` for red).
- `.meter` — utilization bar; `.fill` is animated by width.
- `.spark` — bobbing decorative `<i>` dots.
- `.fade-up` — staggered entrance for a scene's direct children.
- `.counter`, `.caption` — big animated number / highlighted one-liner.

## Anatomy of a compliant graphic

- One folder, one `index.html` (all CSS in `<style>`, all JS in `<script>`).
- The whole story plays through **one continuous timeline** that loops — no
  slideshow, no play/pause/prev/next HUD, no scene switching.
- Everything animates: elements enter, travel (`.req` dots), fill (`.meter`),
  pulse (`.node.is-ok/.is-fail`), count (`.counter`), then exit.
- Text stays minimal: short title, 2–4 word labels, numbers over sentences.

## Adding a new graphic

1. `mkdir my-graphic`, create `my-graphic/index.html`.
2. Link `../css/brand.css` then `../css/motion.css`.
3. Derive 4–8 story beats, assign a duration to each (~20–45s total loop).
4. Build all beats in the same DOM driven by one timeline (CSS keyframes
   preferred; small inline JS only for sequencing/counters).
5. Verify in the browser: watch one full loop, confirm only
   `my-graphic/index.html` was created, no brand hex values locally, no
   controls, nothing frozen.
