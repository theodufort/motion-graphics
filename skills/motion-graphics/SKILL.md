---
name: motion-graphics
description: Create a new branded motion graphic in the motion-graphics workspace (c:\Clones\motion-graphics). Use this skill whenever the user asks to make, build, create, animate or design a motion graphic, explainer animation, animated diagram, concept animation (e.g. "make a motion graphic about X", "animate how Y works", "create an explainer for Z"), even if they don't use the exact phrase "motion graphic". The output is always a single new folder containing only index.html, styled with the shared css/brand.css + css/motion.css, and it must be one continuously animating page — never a slideshow.
---

# Motion Graphics

Create one self-contained, branded, continuously animating motion graphic.

## Hard rules (non-negotiable)

1. **One folder, one file.** Create exactly `<workspace>/<topic-kebab-case>/index.html`. Nothing else — no README, no extra CSS/JS files, no subfolders. Put all CSS in a `<style>` block and all JS in a `<script>` block inside that one `index.html`.
2. **Reuse the shared CSS for brand tokens only.** Always link the shared sheets:

```html
   <link rel="stylesheet" href="../css/brand.css">
   <link rel="stylesheet" href="../css/motion.css">
```

   Read `css/brand.css` to know the available CSS variables (`--bg`, `--accent`, `--fail`, `--font-mono`, etc.). Reference them via `var(--...)` inside your local `<style>` block. Never hardcode brand hex values. `css/motion.css` provides optional helper classes you may use, but the primary rendering approach is canvas-based (see below).

3. **One single page, never a slideshow.** The graphic must be one continuously playing canvas that loops. No play/pause, no next/previous, no scene switching, no keyboard navigation.

4. **Canvas is the stage.** The primary rendering surface is an HTML5 `<canvas>` element that fills the viewport (or a fixed 16:9 aspect ratio). All animation happens in a `requestAnimationFrame` loop — not CSS keyframes on DOM nodes. This gives you easing, particle systems, trails, glows, and dynamic layout that CSS cannot.

5. **Prioritize motion and flow.** Every meaningful element must move, travel, pulse, fade, or change state. Entities travel between nodes along curved paths. Nodes pulse. Meters fill and drain. Counters tick. A diagram where things sit still is a failure.

6. **Minimize text.** Use a short title (3–6 words) and at most a two-line subtitle drawn on canvas. Node labels are 2–4 words max. Never draw paragraphs. Prefer animated counters over sentences.

## Canvas architecture (required pattern)

Every graphic uses this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="../css/brand.css">
  <link rel="stylesheet" href="../css/motion.css">
  <style>
    /* Only page-shell rules: body centering, canvas sizing */
    body { margin:0; background: var(--bg); display:flex; align-items:center; justify-content:center; min-height:100vh; }
    canvas { display:block; border-radius: var(--radius-lg); border: 1px solid var(--border); }
  </style>
</head>
<body>
<canvas id="stage"></canvas>
<script>
// 1. SETUP — DPI-aware resize
const canvas = document.getElementById('stage');
const ctx    = canvas.getContext('2d');
let W, H;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  // Choose your aspect — 16:9 recommended
  W = Math.min(window.innerWidth - 32, 1100);
  H = Math.round(W * 9/16);
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // setTransform, NOT ctx.scale — scales compound on every resize
  buildLayout(); // recompute all positions from W/H
}
window.addEventListener('resize', resize);

// Brand tokens for canvas — see "Reading brand tokens for canvas" below.
// Resolve each --* token to an [r,g,b] array once, then draw with rgba(token, a).
const PAL = { /* accent: [r,g,b], fail: [...], ... */ };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix  = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t); // lerp two tokens, e.g. accent→fail

// 2. LAYOUT — all positions derived from W and H, never hardcoded pixels
function buildLayout() { /* ... */ }

// 3. EASING
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t)  { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

// 4. ENTITY SYSTEMS — particles, packets, nodes all managed as arrays of plain objects
let particles = [];
// spawn, update, draw functions for each entity type

// 5. DRAW LAYERS — in order, every frame
function frame(now) {
  ctx.clearRect(0, 0, W, H);
  drawBackground(now);   // subtle grid or gradient
  drawConnections(now);  // lines between nodes
  drawNodes(now);        // boxes/circles with glow and labels
  drawParticles(now);    // traveling entities with trails
  drawHUD(now);          // title + minimal stats, drawn on canvas
  requestAnimationFrame(frame);
}

resize();
requestAnimationFrame(frame);
</script>
</body>
</html>
```

## Drawing techniques (use these)

The palette helpers below assume the brand-token block from the SETUP section.

**Grid background (neutral structure — white with low alpha works over any brand bg):**
```js
function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 44) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();
}
```

**Dashed connection lines with gradient:**
```js
const grad = ctx.createLinearGradient(ax, ay, bx, by);
grad.addColorStop(0, 'rgba(0,212,255,0.05)');
grad.addColorStop(1, 'rgba(0,212,255,0.3)');
ctx.strokeStyle = grad; ctx.setLineDash([6,6]); ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
ctx.setLineDash([]);
```

**Glowing node (rounded-rect, brand tokens — no hex):**
```js
// Glow radius ≈ 0.5–0.7× the node's half-width. r*2 or bigger swallows
// neighboring nodes and labels — keep it tight, or the diagram turns to mush.
const glow = ctx.createRadialGradient(x,y,r*0.5, x,y,r*0.7);
glow.addColorStop(0, rgba(PAL.accent, 0.12));
glow.addColorStop(1, rgba(PAL.accent, 0));
ctx.fillStyle = glow;
ctx.beginPath(); ctx.arc(x,y,r*0.7,0,Math.PI*2); ctx.fill();
// Body — surface fill + token-colored stroke keeps text legible
ctx.fillStyle = rgba(PAL.surface, 0.95); ctx.strokeStyle = rgba(PAL.accent, 0.6); ctx.lineWidth = 1.6;
roundRect(ctx, x-r, y-r, r*2, r*2, r*0.12); ctx.fill(); ctx.stroke();
```

**Traveling packet with tail:**
```js
// Store tail: p.tail.push({x,y}); if (p.tail.length > 14) p.tail.shift();
for (let i = 1; i < p.tail.length; i++) {
  const alpha = (i / p.tail.length) * 0.5;
  ctx.strokeStyle = `rgba(255,209,102,${alpha})`;
  ctx.lineWidth   = (i / p.tail.length) * 4;
  ctx.beginPath(); ctx.moveTo(p.tail[i-1].x, p.tail[i-1].y); ctx.lineTo(p.tail[i].x, p.tail[i].y); ctx.stroke();
}
// Core glow dot
const glow = ctx.createRadialGradient(px,py,0,px,py,10);
glow.addColorStop(0, packetColor); glow.addColorStop(1,'transparent');
ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px,py,10,0,Math.PI*2); ctx.fill();
ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fill();
```

**Quadratic Bézier path (natural arcs between nodes):**
```js
const t  = easeInOut(p.progress); // 0→1
const mx = (ax+bx)/2, my = (ay+by)/2 - H*0.05; // control point above midline
const px = lerp(lerp(ax,mx,t), lerp(mx,bx,t), t);
const py = lerp(lerp(ay,my,t), lerp(my,by,t), t);
```

**Pulse ring (node heartbeat):**
```js
const pulse = 0.5 + 0.5 * Math.sin(now / 700 + node.id);
ctx.strokeStyle = `rgba(0,232,135,${0.15 + 0.1*pulse})`;
ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x,y,r*(1.4+0.2*pulse),0,Math.PI*2); ctx.stroke();
```

**Load bar:**
```js
const bw = r*1.8, bh = 4, bx = x-bw/2, by = y+r*0.5;
ctx.fillStyle = 'rgba(0,232,135,0.12)'; ctx.fillRect(bx,by,bw,bh);
ctx.fillStyle = '#00E887'; ctx.fillRect(bx,by,bw*Math.min(1,node.load),bh);
```

**On-canvas title + stats (instead of DOM overlays):**
```js
ctx.font = `700 ${W*0.028}px var(--font-sans)`;
ctx.fillStyle = '#D0DFF7'; ctx.textAlign = 'center';
ctx.fillText('Your Title Here', W/2, H*0.08);
```

**Rounded rect helper (add once):**
```js
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
```

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
  if (i !== Math.floor(now / CYCLE) % 3) return { status: 'ok', failAmt: 0 };
  const t = now % CYCLE;
  if (t < 7000)  return { status: 'ok', failAmt: 0 };            // window before failure
  if (t < 7500)  return { status: 'dying', failAmt: (t - 7000) / 500 }; // ramp
  if (t < 14000) return { status: 'fail', failAmt: 1 };          // down
  if (t < 16000) return { status: 'recover', failAmt: 0.45 };    // back online
  return { status: 'ok', failAmt: 0 };                            // healed window
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

## Reading brand tokens for canvas

`var(--accent)` is allowed in the local `<style>` block, but **canvas cannot use it** — `ctx.fillStyle = 'var(--accent)'`, gradient color stops, and `rgba(var(...), a)` all fail. Resolve the tokens you need from `brand.css` into plain `[r,g,b]` values once at setup, then draw through helpers:

```js
const cssVars = getComputedStyle(document.documentElement);
const tok = (name) => cssVars.getPropertyValue(name).trim();
function parseColor(str) {
  str = str.trim();
  if (str[0] === '#') {
    let h = str.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  const m = str.match(/[\d.]+/g).map(Number);
  return m.length >= 3 ? m.slice(0,3) : [255,255,255];
}
const PAL = {
  accent: parseColor(tok('--accent')), deep: parseColor(tok('--accent-deep')),
  bright: parseColor(tok('--green-4')), fail: parseColor(tok('--fail')),
  text:   parseColor(tok('--text')),   muted: parseColor(tok('--muted')),
  bg:     parseColor(tok('--bg')),     surface: parseColor(tok('--bg-2')),
};
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix  = (c1, c2, t) => c1.map((v, i) => v + (c2[i] - v) * t); // lerp two tokens (e.g. accent → fail)
// Fonts come from tokens too:
const FONT_SANS = tok('--font-sans');
const FONT_MONO = tok('--font-mono');
```

This satisfies "never hardcode brand hex": every brand hue still resolves from `brand.css`, and neutral structural values (grid lines, faint borders as white at low alpha) are fine as literal `rgba(255,255,255, x)` since they aren't brand colors.

## Verifying in the built-in browser

- **Idle tabs are throttled.** An unfocused integrated-browser tab stalls `requestAnimationFrame`, so the canvas freezes and counters look stuck — that is a browser quirk, not a code bug. Bring the tab to the foreground, or force a repaint (e.g. take a screenshot) before judging the animation. `pageerror`/`console` errors still surface regardless of focus.
- **Screenshots of a "frozen" state can lie** (stale paint). Confirm actual entity motion — packet count / tail positions across two frames — rather than relying on a single frame.
- Keep any in-browser `page.evaluate` payloads small; large inline snippets can come back as syntax errors.

## Anti-patterns (don't do these)

- CSS keyframe animations on DOM nodes as the primary rendering approach
- `position:absolute` boxes flying around with `transition`
- Static diagrams — if nothing moves, it's broken
- Walls of text or long explanations drawn on canvas
- Hardcoded pixel positions (`x = 450`) — always derive from `W*0.5`
- Scene switching, play/pause buttons, or any interactive controls