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

## Generating a graphic from a prompt

The repo doubles as a prompt-to-graphic tool (spec: `GOAL.md`):

```sh
./tool/generate.sh "make a motion graphic about how X works"
```

That one call: prompts the local LLM (llama.cpp on `127.0.0.1:8123`,
`MG_LLM_MODEL`, default `Qwen3.8-27b-coding`), writes `<topic>/index.html`
+ `README.md`, then validates headlessly (`tool/validate.mjs`: pageerrors,
`__time` seek, fillText collision rects, loop-seam density, README, plus
screenshots to `tool/shots/<topic>/` for vision review) and feeds any
failures back to the LLM for up to 3 fix passes. Exit 0 + JSON summary =
a graphic that passed every check (~3 min typical).

`./check.sh` scores the whole repo (`SCORE: <n>`, exit 0 = all graphics
pass + both smoke prompts from `tool/bench/prompts.jsonl` generate
cleanly). Unattended runs log each iteration to `logs/iterations.jsonl`.
Default runs **reuse** previously generated smoke folders (tracked in
`logs/slug-map.jsonl`) so a full check takes seconds; `./check.sh --regen`
forces fresh generation, `./check.sh --skip-gen` skips it entirely.
`generate.sh` refuses to overwrite an existing topic folder unless
`--force` is passed. `./check.sh --only <topic>` validates a single
folder in ~5s (fix-loop speed; unknown topic exits 2).
`node tool/check.mjs --watch` re-validates a folder ~1s after its
`index.html` changes and prints the 8 check bits with the previous run's
bits (`was …`) for instant diffing while editing.

### Negative fixtures

`tool/fixtures/` — minimal HTML that must FAIL specific checks (run
`node tool/validate.mjs tool/fixtures/<name>`; a pass means the check
regressed):

| fixture | check targeted |
|---|---|
| `dark-seam/` | seam (dark frame at loop wrap) |
| `text-overlap/` | collisions (overlapping fillText rects) |
| `blank-canvas/` | content (densest frame < 500 px) |
| `static-canvas/` | frozen (near-zero px churn across the loop) |
| `near-frozen/` | soft `near-frozen` warning only (0.5–2% churn) |
| `invisible-label/` | visibility (all-frames label at alpha 0) |
| `lost-label-seam/` | seamContinuity (label vanishes at wrap, never reappears) |
| `dark-band-post/` | seam (dark band 300-900ms *after* the wrap) |
| `contained-label/` | collisions (small label fully inside a much bigger one) |

## Environment knobs

| Variable | Default | Effect |
| --- | --- | --- |
| `MG_LLM_BASE` | `http://127.0.0.1:8123` | llama.cpp OpenAI-compatible endpoint |
| `MG_LLM_MODEL` | `Qwen3.8-27b-coding` | model name for chat completions |
| `MG_FIX_PASSES` | `3` | max LLM fix passes after a failed validation |
| `MG_TIMEOUT_MS` | `900000` | per-LLM-call timeout (15 min) |
| `MG_CONCURRENCY` | `4` | parallel validators in `check.mjs` |
| `MG_ALLOW_EXISTING` | unset | `1` lets `generate`/`bench`/`check` refresh existing generated folders (set automatically by bench/check; manual `generate.sh` stays protected) |

| `MG_QUICK` | unset | `1` = fast validation (2 frames, 5 frozen samples, no resize, 2 shots) — for `--only`/`--watch` loops |
| `MG_DEBUG` | unset | `1` makes `validate.mjs` dump every parked frame's `fillText` rects to stderr (collision/containment debugging) |

### Helper scripts

- `./close.sh <unique-substring> [note...]` — close exactly one open
  `IMPROVEMENTS.md` item, verifying the `[x]` line afterwards (fused-line
  safe). Use it whenever you close an item.
- `./check.sh [--skip-gen | --regen | --only <topic> | --watch | --quick | --json]`
- `./tool/generate.sh "<prompt>" [--prompt-file <path>] [--force]`
- `node tool/bench.mjs [limit] [--topics a,b,c] [--compare before.log after.log]`

### The vision pass

Deterministic probes (JS errors, `fillText` collision rects, seam pixel
density) are the tie-breaker — but the first line of defense is *looking*.
After any generation or edit, a human or vision-capable model should open
the 6 shots `validate.mjs` saves in `tool/shots/<topic>/`:

| File | Park time | What to look for |
| --- | --- | --- |
| `t<15%·LOOP>.png` | LOOP × 0.15 | early beat — entrances, first labels |
| `t<40%·LOOP>.png` | LOOP × 0.40 | densest beat — most elements at once |
| `t<65%·LOOP>.png` | LOOP × 0.65 | mid/late beat — state changes |
| `t<90%·LOOP>.png` | LOOP × 0.90 | final beat — exits |
| `seam-a.png` / `seam-b.png` | LOOP−300 / 300 | wrap must crossfade, no dark frame |

A `manifest.json` sits alongside the shots: one entry per file with its
park time, content-px at that instant, and a `seam` flag — feed it to a
vision tool instead of guessing filenames.

(Exact filenames use the millisecond values, e.g. `t2700.png` for an
18s loop.) Judge each shot for: text touching/overflowing boxes, labels
over labels, elements covering content, anything frozen or clipped, and
seam darkness. If a shot looks wrong but probes passed, report it — the
probe thresholds in `tool/validate.mjs` then get tightened.

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
| `seam-pop-in/` | seam label pop-in (no fade at the wrap) |
