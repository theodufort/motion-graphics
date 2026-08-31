# Motion Graphics

Small, self-contained HTML motion graphics. Every graphic draws its look from
the **shared, branded CSS** in `css/`, so the palette always matches
theodufort.com.

    motion-graphics/
    ├── css/                              shared CSS (see below)
    ├── skills/motion-graphics/           the skill that defines how to build graphics
    │   └── references/drawing-techniques.md  layout-tested canvas recipes
    ├── skills/motion-graphic-validation/ the skill for visually validating a graphic
    ├── AGENTS.md                         rules for agents working in this repo
    └── <topic-kebab-case>/
        ├── index.html                    the graphic itself
        └── README.md                     standard description of the visual (kept in sync)

## Building or changing a graphic

Follow the `motion-graphics` skill (`skills/motion-graphics/SKILL.md`) and
`AGENTS.md`. The short version:

- **Edit before you generate.** Most requests are tweaks to an existing
  graphic — check the existing folders first and edit that `index.html` in
  place. Only create a new folder when the concept is genuinely new.
- One folder with exactly two files: `index.html` (link `css/brand.css` +
  `css/motion.css`, one continuously animating page — no slideshow, no
  controls, minimal text, everything in motion) and a standard `README.md`
  describing the visual, kept in sync with every HTML change.
- **Every create or edit must pass the validation skill**
  (`skills/motion-graphic-validation/SKILL.md`): loads clean, deterministic
  seek (`window.__time`), then a **vision pass** (park at several times,
  screenshot, look for badly placed text / overlaps / broken animation),
  confirmed with `measureText`/pixel probes where needed, plus an animation
  audit (nothing frozen, clean loop seam) and a README sync check.

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
`pgsodium-salted-hashing/` shows a compliant graphic in action: one
continuously looping timeline on a single canvas — no slideshow, no
controls. (`high-availability-proxy/` is a legacy slideshow — copy only its
`<link>` usage, not its interaction pattern.)

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

- One folder with exactly two files: `index.html` (all CSS in `<style>`, all
  JS in `<script>`) and `README.md` — a standard description of what the
  visual is (title, story beats with timings, key elements, notes), kept in
  sync with every HTML change. Template in
  `skills/motion-graphics/SKILL.md` → "Per-graphic README".
- The whole story plays through **one continuous timeline** that loops — no
  slideshow, no play/pause/prev/next HUD, no scene switching.
- Everything animates: elements enter, travel (`.req` dots), fill (`.meter`),
  pulse (`.node.is-ok/.is-fail`), count (`.counter`), then exit.
- Text stays minimal: short title, 2–4 word labels, numbers over sentences.

## Adding a new graphic

0. **First check whether an existing graphic already covers the topic — if
   so, edit it instead of adding a folder.**
1. `mkdir my-graphic`, then write `my-graphic/README.md` first (standard
   template — the spec of what the visual should be).
2. Create `my-graphic/index.html`; link `../css/brand.css` then
   `../css/motion.css`.
3. Derive 4–8 story beats, assign a duration to each (~20–45s total loop).
4. Build all beats on one continuous timeline; expose `window.__time(ms)` to
   park the loop at any moment.
5. Run the **validation skill** (`skills/motion-graphic-validation/SKILL.md`)
   — vision pass over parked screenshots, `measureText`/pixel-probe
   confirmation, animation/loop-seam audit, README sync check — and confirm
   only `my-graphic/index.html` + `my-graphic/README.md` were created, no
   brand hex values locally, no controls, nothing frozen.

When **modifying** an existing graphic, update its `README.md` in the same
change so the description always matches the visual (create it first if the
folder doesn't have one yet).
