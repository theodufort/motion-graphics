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
    └── index.html   ← one graphic = exactly this
```

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
2. **One folder, one file.** A new graphic produces exactly
   `<topic-kebab-case>/index.html` — no README, no extra CSS/JS files, no
   subfolders, nothing else.
3. **One single page — never a slideshow.** No play/pause/next/prev HUD, no
   scene switching, no powerpoint-style stepping. Everything plays on one
   continuous timeline by itself (loops if possible). If it can be done with
   CSS keyframes + `animation-delay`, do that instead of JS.
4. **Animation over static elements.** Every element should enter, move,
   pulse, count, or transition. Nothing should sit frozen for a beat.
5. **Minimal text.** Short title (3–6 words), 2–4 word node labels, no
   paragraphs. Prefer `.counter` numbers over sentences.

## Reference

`ha-proxy-motion-graphic/` is a legacy example of linking the shared CSS.
It is a scene-cycling slideshow with a HUD — **do not imitate its
interaction pattern**; only copy its `<link>` usage and class styling.
