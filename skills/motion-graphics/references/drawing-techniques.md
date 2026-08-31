# Drawing techniques — recipe library

Read this file when you are about to write the `<script>` of a motion
graphic. These recipes are layout-tested: glow radii, clearances, and text
sizes here pass the validation loop (`skills/motion-graphic-validation/`).
Prefer reusing them over inventing new drawing code.

The palette helpers below assume the brand-token block from the SETUP
section of the main skill template.

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

**Legacy shortcut (still valid):** some older graphics parse tokens via a
hidden probe node instead:

```js
const probe = document.createElement('i');
probe.style.cssText = 'position:absolute;visibility:hidden;color:var(--fail)';
document.body.appendChild(probe);
const rgb = getComputedStyle(probe).color.match(/rgba\((\d+), (\d+), (\d+)/).slice(1);
probe.remove();
```

Note: `--fail` and `--accent` are hex in `brand.css`, so a probe's computed
color comes back as `rgb(...)` — the regex above must accept both `rgb(` and
`rgba(` forms.

## Recipes

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
