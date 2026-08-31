---
name: motion-graphics
description: Create or EDIT a branded motion graphic in the motion-graphics workspace (c:\Clones\motion-graphics). Use this skill whenever the user asks to make, build, create, animate, design, update, tweak or fix a motion graphic, explainer animation, animated diagram, concept animation (e.g. "make a motion graphic about X", "animate how Y works", "update the Y graphic"). ALWAYS check for an existing graphic covering the topic first and edit it in place; only create a new folder when the concept is genuinely new. The output is a single index.html styled with the shared css/brand.css + css/motion.css, one continuously animating page — never a slideshow. After creating or editing, ALWAYS run the motion-graphic-validation skill before reporting done.
---

# Motion Graphics

Create or edit one self-contained, branded, continuously animating motion graphic.

## Step 0 — Edit before you generate (mandatory)

New folders are expensive; most requests are tweaks to something that exists.

1. **List the existing graphic folders first** (every folder with an
   `index.html` at the workspace root).
2. **Match the request against them.** If the topic matches or is a variant of
   an existing graphic (e.g. the `1nf`–`5nf` series, `auth-schema-erd`,
   `pgsodium-salted-hashing`, `high-availability-proxy`), **edit that
   `index.html` in place** — do not fork it into a second folder.
3. **Create a new folder only when the concept is distinct from every
   existing graphic.** When in doubt, ask the user: extend an existing
   graphic, or create a new one?
4. A batch of related tweaks = a series of edits to one file, never several
   new folders.

## Hard rules (non-negotiable)

1. **One folder, two files.** A graphic is exactly `<workspace>/<topic-kebab-case>/index.html` plus `<topic-kebab-case>/README.md` (the standard description file — see "Per-graphic README" below). Nothing else — no extra CSS/JS files, no subfolders. Put all CSS in a `<style>` block and all JS in a `<script>` block inside that one `index.html`.
2. **Reuse the shared CSS for brand tokens only.** Always link the shared sheets:

```html
<link rel="stylesheet" href="../css/brand.css" />
<link rel="stylesheet" href="../css/motion.css" />
```

Read `css/brand.css` to know the available CSS variables (`--bg`, `--accent`, `--fail`, `--font-mono`, etc.). Reference them via `var(--...)` inside your local `<style>` block. Never hardcode brand hex values. `css/motion.css` provides optional helper classes you may use, but the primary rendering approach is canvas-based (see below).

3. **One single page, never a slideshow.** The graphic must be one continuously playing canvas that loops. No play/pause, no next/previous, no scene switching, no keyboard navigation.

4. **Canvas is the stage.** The primary rendering surface is an HTML5 `<canvas>` element that fills the viewport (or a fixed 16:9 aspect ratio). All animation happens in a `requestAnimationFrame` loop — not CSS keyframes on DOM nodes. This gives you easing, particle systems, trails, glows, and dynamic layout that CSS cannot.

5. **Prioritize motion and flow.** Every meaningful element must move, travel, pulse, fade, or change state. Entities travel between nodes along curved paths. Nodes pulse. Meters fill and drain. Counters tick. A diagram where things sit still is a failure.

6. **Minimize text.** Use a short title (3–6 words) and at most a two-line subtitle drawn on canvas. Node labels are 2–4 words max. Never draw paragraphs. Prefer animated counters over sentences.

7. **Validate before done.** After creating or editing, run the
   `motion-graphic-validation` skill
   (`skills/motion-graphic-validation/SKILL.md`). A graphic is only finished
   when it passes that loop.

## Per-graphic README (mandatory, kept in sync)

Every graphic folder has a `README.md` that describes what the visual **is**
(after a create) or **should be** (write it first when creating, so it acts
as the spec you build against). It is the single human-readable description
of the graphic.

**Workflow:**

- **Creating:** write `README.md` first (the intended visual), then build
  `index.html` to match it.
- **Editing:** whenever you change the visual — beats, labels, layout,
  timing, colors, entities — update the same `README.md` in the same change
  so it always matches the current `index.html`. If an existing graphic has
  no `README.md` yet, create one describing what the graphic currently shows
  before (or while) you edit it.

**Standard template:**

```markdown
# <Title of the graphic>

<One or two sentences: what concept this explains and the one-line takeaway.>

## Story beats

| Time (s) | Beat | What's on screen |
| -------- | ---- | ---------------- |
| 0–6      | …    | …                |
| 6–12     | …    | …                |

Loop length: <N>s.

## Key elements

- <element>: <what it is, its label, its color role (accent/fail/muted)>
- …

## Notes

- <anything non-obvious: seek hook times worth parking at, known layout
  constraints, why a label was shortened, etc.>
```

Keep it short — the README describes the visual, it doesn't duplicate the
code. No implementation details beyond what helps someone understand or
re-validate the graphic.

## Canvas architecture (required pattern)

Every graphic uses this structure:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="../css/brand.css" />
    <link rel="stylesheet" href="../css/motion.css" />
    <style>
      /* Only page-shell rules: body centering, canvas sizing */
      body {
        margin: 0;
        background: var(--bg);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      canvas {
        display: block;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
      }
    </style>
  </head>
  <body>
    <canvas id="stage"></canvas>
    <script>
      // 1. SETUP — DPI-aware resize
      const canvas = document.getElementById("stage");
      const ctx = canvas.getContext("2d");
      const LOOP = 30000; // one full story cycle in ms — everything derives from t % LOOP
      let W, H;

      function resize() {
        const dpr = window.devicePixelRatio || 1;
        // Choose your aspect — 16:9 recommended
        W = Math.min(window.innerWidth - 32, 1100);
        H = Math.round((W * 9) / 16);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // setTransform, NOT ctx.scale — scales compound on every resize
        buildLayout(); // recompute all positions from W/H
      }
      window.addEventListener("resize", resize);

      // Brand tokens for canvas — see references/drawing-techniques.md →
      // "Reading brand tokens for canvas". Resolve each --* token to an [r,g,b]
      // array once, then draw with rgba(token, a).
      const PAL = {
        /* accent: [r,g,b], fail: [...], ... */
      };
      const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t); // lerp two tokens, e.g. accent→fail

      // 2. LAYOUT — all positions derived from W and H, never hardcoded pixels
      function buildLayout() {
        /* ... */
      }

      // 3. EASING
      function lerp(a, b, t) {
        return a + (b - a) * t;
      }
      function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      }

      // 4. ENTITY SYSTEMS — particles, packets, nodes all managed as arrays of plain objects
      let particles = [];
      // spawn, update, draw functions for each entity type

      // 5. SEEK HOOK — required by the motion-graphic-validation skill
      let __seek = null;
      window.__time = (ms) => {
        __seek = ms;
      }; // park the loop at an exact time

      // 6. DRAW LAYERS — in order, every frame; everything a pure function of t
      function frame(now) {
        const t = (__seek != null ? __seek : now) % LOOP;
        ctx.clearRect(0, 0, W, H);
        drawBackground(t); // subtle grid or gradient
        drawConnections(t); // lines between nodes
        drawNodes(t); // boxes/circles with glow and labels
        drawParticles(t); // traveling entities with trails
        drawHUD(t); // title + minimal stats, drawn on canvas
        if (__seek == null) requestAnimationFrame(frame);
      }

      resize();
      requestAnimationFrame(frame);
    </script>
  </body>
</html>
```

## Drawing techniques (recipe library)

Read **`references/drawing-techniques.md`** when you are about to write the
`<script>` of a graphic. It holds the layout-tested recipes — brand-token
parsing for canvas (`PAL`, `rgba`, `mix`), grid background, glowing nodes,
packets with tails, Bézier paths, pulse rings, load bars, on-canvas titles,
and the `roundRect` helper. Reuse those recipes before inventing new drawing
code: their glow radii, clearances, and font sizes already pass the
validation loop.

## Story / timeline approach

You still plan beats first, but timing is driven by JS:

```js
// One loop = e.g. 30s
const LOOP = 30000;
const beat = (now % LOOP) / LOOP; // 0→1 over each loop

// Show element only during a time window:
const visible = beat > 0.2 && beat < 0.6;
if (visible) drawSomething(ctx, easeInOut((beat - 0.2) / 0.4));
```

Auto-spawn entities on a timer; let them complete their journey and remove them. The loop is continuous, not scene-based.

### Deterministic story state machines (beyond one-shot windows)

When the story has entities that change state over time (a node failing and recovering while traffic keeps flowing), derive each entity's state as a **pure function of `now`** inside the cycle. Every draw layer and every update decision consults the same function, so the story stays in sync and the loop is perfectly seamless by construction — no state to reset at the wrap:

```js
// One 24s cycle: exactly one of three nodes is down at any time.
// (floor(now / CYCLE) % 3 is a pure expression, so it is identical on the 0ms
// of the next wrap — the seam is invisible.)
const CYCLE = 24000;
function nodeState(i, now) {
  if (i !== Math.floor(now / CYCLE) % 3) return { status: "ok", failAmt: 0 };
  const t = now % CYCLE;
  if (t < 7000) return { status: "ok", failAmt: 0 }; // window before failure
  if (t < 7500) return { status: "dying", failAmt: (t - 7000) / 500 }; // ramp
  if (t < 14000) return { status: "fail", failAmt: 1 }; // down
  if (t < 16000) return { status: "recover", failAmt: 0.45 }; // back online
  return { status: "ok", failAmt: 0 }; // healed window
}
// Draw the down cross / status label; lerp the node's stroke+glow token:
const col = mix(PAL.accent, PAL.fail, state.failAmt);
```

**Multi-phase packet journeys** pair this with a per-packet `phase` field, advanced by `dt`-scaled progress each frame (`p.t += dt / DUR; if (p.t >= 1) { nextPhase; }`) so speeds are framerate-independent and the dwell phase gets a distinct, longer duration than travel:

```js
// phases: 'in' (client→proxy) → 'dwell' (orbiting inside the proxy) → 'out' (proxy→node). Each has its own duration.
// Health-check pings are tiny probe packets on the same proxy→node paths;
// a probe landing on a failed node flashes a "detected" blip.
// Failover: if the mid-flight target node collapses, re-target to the
// healthiest surviving node and flash the packet token (accent→fail) briefly —
// traffic visibly reroutes around the outage.
p.pos = quad(a, control, b, easeInOut(Math.min(1, p.t))); // quad = quadratic Bézier point
```

## What still applies from before

- Brand tokens via `var(...)` in `<style>`, resolved to RGB values for canvas — never hardcoded brand hex
- Short labels, no paragraphs
- Responsive: `buildLayout()` recomputes all positions from the current `W` / `H`
- Must loop cleanly with no visible jump

## Validation (mandatory — separate skill)

After **every create and every edit**, run the **`motion-graphic-validation`**
skill (`skills/motion-graphic-validation/SKILL.md`). It is vision-first: park
the graphic at deterministic times with `window.__time`, screenshot, and
inspect the screenshots with your vision for badly placed text, overlapping
elements, and broken animation — then confirm anything suspicious with
`measureText`/pixel probes. Do not report a graphic as done until it passes.

The seek hook in the template above (`window.__time`) is the prerequisite —
if you edited an older graphic that lacks it, add it before validating.

## Anti-patterns (don't do these)

- Creating a new folder when an existing graphic already covers the topic — edit in place instead
- Reporting a graphic as done without running the motion-graphic-validation loop
- Judging text placement/overlaps from downscaled screenshots alone — vision first, then confirm with `measureText` rects / pixel probes
- CSS keyframe animations on DOM nodes as the primary rendering approach
- `position:absolute` boxes flying around with `transition`
- Static diagrams — if nothing moves, it's broken
- Walls of text or long explanations drawn on canvas
- Hardcoded pixel positions (`x = 450`) — always derive from `W*0.5`
- Scene switching, play/pause buttons, or any interactive controls
