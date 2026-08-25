---
name: motion-graphics
description: Create a new branded motion graphic in the motion-graphics workspace (c:\Clones\motion-graphics). Use this skill whenever the user asks to make, build, create, animate or design a motion graphic, explainer animation, animated diagram, concept animation (e.g. "make a motion graphic about X", "animate how Y works", "create an explainer for Z"), even if they don't use the exact phrase "motion graphic". The output is always a single new folder containing only index.html, styled with the shared css/brand.css + css/motion.css, and it must be one continuously animating page — never a slideshow.
---

# Motion Graphics

Create one self-contained, branded, continuously animating motion graphic.

## Hard rules (non-negotiable)

1. **One folder, one file.** Create exactly `<workspace>/<topic-kebab-case>/index.html`. Nothing else — no README, no extra CSS/JS files, no subfolders. Put any local CSS in a `<style>` block and any JS in a `<script>` block inside that one `index.html`.
2. **Reuse the shared CSS.** Always link the shared sheets, and build from their classes before writing anything yourself:

   ```html
   <link rel="stylesheet" href="../css/brand.css">
   <link rel="stylesheet" href="../css/motion.css">
   ```

   `css/brand.css` owns every brand color/gradient/font as CSS variables — never hardcode brand hex values or redefine design tokens; reference `var(--...)` instead. `css/motion.css` provides the components (see "Available building blocks"). A small local `<style>` block is allowed for graphic-specific additions, but it should be minimal and should NOT re-declare anything the shared files already provide.
3. **One single page, never a slideshow.** The graphic must be one continuously playing canvas. No play/pause buttons, no next/previous, no scene switching, no powerpoint-style stepping, no keyboard scene navigation. The story plays through one timeline by itself and (ideally) loops.
4. **Prioritize animation over static elements.** Every meaningful element should move or change over time: things enter, travel, pulse, count, transition state, and exit. If an element can animate, it must. A "diagram" that is just boxes sitting still is a failure.
5. **Minimize text.** Motion carries the message, not walls of words. Use a short title (3–6 words), a one-line subtitle at most, and 2–4 word labels on nodes. Never include paragraphs. Prefer numbers (`.counter`) over sentences.

## What a correct graphic looks like

- `#stage` is the 16:9 canvas; the whole experience happens inside it (no HUD/controls).
- All story beats live in the same DOM. A JS timeline (or a pure-CSS keyframe timeline) plays them back over one total duration: state 1 → state 2 → … → end (→ loop). Elements enter with `.fade-up` or custom keyframes, transform while alive (traveling `.req` dots, filling `.meter`s, pulsing `.node.is-ok/.is-fail`, counting `.counter`), then fade out before the next beat.
- If it can be done with CSS keyframes and `animation-delay`, it should be — no JS needed. JS is fine for sequencing that's awkward in CSS (counters, staggered reveals), but keep it small and inline.

## Available building blocks (css/motion.css)

| Class | Use for |
| --- | --- |
| `#stage` | the 16:9 canvas (auto radial brand background) |
| `h1`, `h2`, `p`, `.big` | type; `.big` is the green-gradient headline |
| `.label`, `.pill` | uppercase chip labels |
| `.diagram`, `.row`, `.node` | flex diagram rows of boxes |
| `.node.tint-green | tint-neural | tint-mute | tint-fail` | node fills |
| `.node.is-ok | is-fail | is-down` | pulsing / error / dimmed states |
| `.node .dot`, `.badge`, `.badge-ok`, `.badge-fail` | node details |
| `.req`, `.req.fail` | traveling request dots (animate `left` with the `flow` keyframe) |
| `.spark` with `<i>` children | bobbing decorative dots |
| `.meter > .track > .fill` (+ `.fill.danger`, `.cap`) | utilization bar — animate `width` |
| `.counter`, `.counter .small` | big animated number |
| `.caption`, `.caption b` | short one-liner with highlighted word |
| `.fade-up` (+ nth-child stagger) | entrance for a scene's direct children |

Brand tokens (css/brand.css): `--bg`, `--bg-2`, `--surface`, `--secondary`, `--text`, `--muted`, `--muted-soft`, `--accent` (#3ecf8e), `--accent-deep`, `--green-2…5`, `--accent-on`, `--fail`, `--border`, `--border-strong`, `--radius*`, `--glow`, `--glow-lg`, `--shadow`, `--grad-accent`, `--grad-text`, `--grad-canvas`, `--font-sans`, `--font-mono`. Helper classes: `.text-gradient`, `.text-gradient-green`, `.glow-green`, `.glow-green-lg`.

If a needed component doesn't exist in the shared files, add it in the local `<style>` block using brand tokens — but consider whether it is generic enough to belong in `css/motion.css` (only the user may update the shared files; don't edit them inside the same task unless asked).

## Workflow

1. **Derive the story first.** List 4–8 beats of the concept (state changes, not screens). Assign a duration to each so the total loop is ~20–45s.
2. Scaffold `index.html`: head with the two `<link>` tags, `<style>` for this graphic's extra keyframes, `<div id="stage">` with all beats in the DOM, `<script>` timeline.
3. Build beats reusing the shared classes; write custom keyframes only where the components don't fit. Drive everything off one timeline so the page tells the whole story by itself and loops cleanly.
4. **Verify in the browser:** open the file, watch one full run (playhead from 0 to loop). Check:
   - file tree contains ONLY `<topic>/index.html`
   - no brand hex values or token redefinitions in the local style block
   - no controls, no scene switching, no text walls
   - it is clearly animating throughout (nothing sits static for a beat)
5. If anything static/ugly shows up, rework before finishing.

## Anti-patterns (previous iterations of this repo did these — don't copy them)

The existing `ha-proxy-motion-graphic/` predates these rules: it is a scene-cycling slideshow with a play/pause HUD. Use it only as a reference for how to link the shared CSS, never as a pattern to imitate.
