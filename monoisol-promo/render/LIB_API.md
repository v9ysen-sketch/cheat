# MONOISOL promo — scene authoring guide

Frames are 1920×1080 @ 30 fps, drawn with Canvas 2D (Skia via `@napi-rs/canvas`).
Each scene is a CommonJS module `render/scenes/sNN.js`:

```js
'use strict';
// t: local time in seconds (0 = scene start). Can be slightly < 0 or > d during the
//    0.8 s cross-transition with neighbours — keep drawing sensibly (clamp progress, keep ambient motion).
// d: scene duration (s). L: the library (render/lib.js). env.cues: narration lines of this scene,
//    [{k, start, end, text}] in local seconds — sync entrances to these.
module.exports = {
  draw(ctx, t, d, L, env) {
    const { C } = L;
    L.background(ctx, t, 'night');           // ALWAYS paint the full frame first (opaque)
    // ...
  },
};
```

Rules
- Deterministic: never use `Math.random()`/`Date`. Use `L.rng(seed)` (returns a function) or `L.noise1(x, seed)`.
- Paint an opaque full-frame background first. Do not depend on state from previous frames.
- Safe area: keep text ≥ 96 px from the left/right edges and ≥ 70 px from top/bottom. Nothing important under y > 960
  (subtitles may be burned in there for a social version) — keep the bottom 120 px for background/ambient only.
- Typography: headlines `display` (Unbounded 800), 64–110 px; body `body`/`bodyBold` (Manrope) ≥ 30 px. Max ~2 text
  blocks on screen at once. Ukrainian text exactly as given in the spec (on-screen items).
- Colours: navy backgrounds, white/silver text, brand green `C.brand`/`C.brandHi` for accents (it is the logo colour),
  `C.cyan`/`C.ice` only for cold/frost, `C.orange`/`C.amber` for heat/warmth. Use `L.rgba(hex, a)` for alpha.
- Motion: every element enters with easing (no pops), staggered; elements leave (or the composition evolves) before the
  next beat; keep subtle ambient motion all the time (particles, slow Ken Burns, gentle drift) — no frozen frames.
  Sync the key reveal of each on-screen item to the narration cue that mentions it (`env.cues[k].start`).
- Performance: aim < 120 ms per frame. Avoid per-frame creation of huge offscreen canvases; `L.foamTile` and
  `L.blurred` are cached.
- Images: real photos from the official site are available by catalogue name (see `render/assets/photos.json`):
  `L.photo(...)`, `L.photoBg(...)`. The official logo: `L.brandLogo(...)`. Photos are 600–1200 px wide, so show them as
  cards ≤ ~1000 px wide; full-screen only via `L.photoBg` (blurred) or with strong darkening.

## Math / time
- `L.clamp(x,a=0,b=1)`, `L.lerp(a,b,t)`, `L.invLerp`, `L.remap(x,a,b,c,d)` (clamped)
- `L.prog(t, start, dur)` → 0..1 clamped; `L.ep(t, start, dur, easeName='outCubic')` → eased progress
- `L.ease.{linear,inQuad,outQuad,inCubic,outCubic,inOutCubic,inOutSine,outExpo,inOutExpo,outBack,outElastic}`
- `L.envelope(t, a, b, fin=0.4, fout=0.4)` → 0..1 rise at a, fall ending at b
- `L.rng(seed)` → () => [0,1); `L.noise1(x, seed)` → smooth [-1,1]
- `L.rgba(hex, a)`, `L.mixColor(hexA, hexB, t)`
- `L.W`, `L.H`, `L.FPS`, palette `L.C` (navy, navy2, navy3, blue, cyan, ice, frost, orange, amber, ember, warmLight,
  white, grey, greyDark, foam, foamShade, foamDark, foil, foilHi, foilLo, red, uaBlue, uaYellow, brand, brandHi,
  brandDark, silver, silverDark)

## Canvas helpers
- `L.save(ctx, fn)`; `L.at(ctx, {x,y,rot,scale,sx,sy,alpha}, fn)` — transformed sub-drawing
- `L.roundRect(ctx,x,y,w,h,r)` (path only), `L.glow(ctx,x,y,r,color,a)` radial glow
- `L.offscreen(w,h)` → canvas (create once at module scope if needed, not per frame)

## Backgrounds & ambience
- `L.background(ctx, t, variant, {blobs, glow, glowAlpha})` variants: night, cold, warm, brand, deep, light
- `L.vignette(ctx, strength=0.55)`, `L.dotGrid(ctx, t, {color, alpha, step})`
- `L.snow(ctx, t, {amount, count, wind, speed, area:[x,y,w,h], seed})`, `L.embers(ctx, t, {amount, count, color, area})`
- `L.bokeh(ctx, t, {amount, count, color})`
- `L.photoBg(ctx, name, t, {blur=18, dim=0.6, tint=C.navy, zoom=1.12, drift, alpha, sharp=false})`

## Text
- `L.text(ctx, str, x, y, {role, size, color, align, baseline, letterSpacing, alpha, shadow:{color,blur,y}, maxWidth})` → width
- `L.measure(ctx, str, role, size, letterSpacing)`, `L.wrap(ctx, str, role, size, maxWidth)` → lines
- `L.revealText(ctx, str, x, y, p, {role, size, color, align, lineHeight, maxWidth, stagger, highlight:[words], highlightColor, alpha, out})`
  word-by-word masked rise; `p` 0..1, `out` 0..1 exit. Returns {width,height,lines}
- `L.typeText(ctx, str, x, y, p, opts)` typewriter
- `L.headline(ctx, x, y, p, {kicker, title, sub, align, titleSize, subSize, maxWidth, highlight, out})` → height used
  (kicker = small green caps line above the title)
- roles: display, displaySemi, displayLight (Unbounded), body, bodyBold, bodyLight (Manrope)

## UI components
- `L.panel(ctx, x,y,w,h, {r, fill, stroke, alpha, shadow, accent})` glass card
- `L.pill(ctx, str, x, y, p, {size, color, bg, border, icon, iconColor, align})` → width (y = vertical centre)
- `L.stat(ctx, x, y, p, {value, unit, label, size, align, accent})` big number callout
- `L.checklist(ctx, items, x, y, p, {size, gap, check, maxWidth})` staggered check items
- `L.underline(ctx, x, y, w, p, color, th)`
- `L.drawIcon(ctx, name, x, y, size, color, p, lineWidth)` names: check, snowflake, flame, drop, house, shield, sound,
  mute, box, cable, pipe, thermo, lab, doc, cart, globe, bolt, ruler, star, factory, truck, wind, sun, leaf, hand,
  heart, hryvnia

## Illustrations (vector)
- `L.house(ctx, x, y, s, t, {warm, leak, shield, snowRoof, insulated})` x,y = bottom centre, s≈1 → 620 px wide
- `L.insulatedPipe(ctx, x1,y1,x2,y2, r, {insulated:0..1 slide-on, thickness, metal:'steel'|'copper'|'plastic', sleeve:'foam'|'hd'|'fire'|'foil', frost, heat, t, label})`
- `L.cylinder(ctx, x1,y1,x2,y2, r, {base, hi, lo, cap, alpha, pattern})`
- `L.pipeSection(ctx, x, y, rPipe, rOuter, p, {metal, foil, t, fluid})` cross-section rings
- `L.heatWaves(ctx, x, y, w, h, t, amt, color)`
- `L.foamMacro(ctx, x, y, w, h, t, {cell, seed, p, glowColor, glowAmt})` macro closed cells
- `L.foamTile(opts)` / `L.foamFill(ctx, opts)` foam texture for the current path
- `L.roll(ctx, x, y, r, {unroll, length, foil, t, alpha})` sheet roll (side view) unrolling to the right
- `L.corrugated(ctx, x1,y1,x2,y2, r, {color, t, p, cable})`
- `L.isoBox(ctx, x, y, w, h, d, {color, open, foam, label})` x,y = front-bottom corner
- `L.cord(ctx, points, r, {p, color})` foam cord along a polyline
- `L.uaRibbon(ctx, x, y, w, h, p)` Ukrainian flag stripe

## Images
- `L.photo(ctx, name, x, y, w, h, p, k, {r, zoom:[from,to], focus:[fx0,fy0,fx1,fy1], reveal:'rise'|'wipe'|'scale'|'fade', border, borderW, rot, caption, out, alpha, shadow})`
  framed photo card; `p` = appear progress, `k` = Ken Burns progress (e.g. `t/d`), `out` = exit progress
- `L.drawCover(ctx, image, x, y, w, h, zoom, fx, fy)`; `L.img(name)` → decoded image (already preloaded)
- `L.brandLogo(ctx, cx, cy, width, p, {shine: 0..1 light sweep position or null, alpha, glowAmt})` official logo
  (aspect 3.2:1)

## Previewing your scene
```
cd render
node render.js scene <id> <t> /path/out.png [width]   # one frame at local time t
node render.js contact <id> /path/sheet.png 8         # 8 frames across the scene
```
Look at the PNGs (Read tool) and iterate until it looks like a premium TV ad.
