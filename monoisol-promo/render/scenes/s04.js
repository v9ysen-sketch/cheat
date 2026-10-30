'use strict';
// Scene 4 — «Трубна ізоляція» (≈24.47 s, global 45.27–69.73)
// Beats (local s, synced to env.cues):
//   A 0.80  headline «Трубна ізоляція» (left); vector foam sleeve with a slit spins above a bare hot steel pipe,
//           an amber knitted pattern runs over it (~1 s), the slit opens and the sleeve wraps the pipe like a scarf;
//           3.4 a curtain wipe reveals the photo card pipe_ins_on_pipes, 4.15 pipe_ins_metal lands on top, tilted
//   B 5.33  the card stack slides into the left third; a house cut-away draws itself on the right with five coloured
//           engineering lines; icons + labels flash in sync with the list (Опалення … Холодильні системи)
//   C 11.43 blueprint: pipe_ins_sizes blurred + tinted blue behind a grid; a 2-metre tube with a dimension line «2 м»;
//           a row of rings grows small → large with the counter «Ø 15–114 мм»
//   D 17.03 «Товщина стінки» + «6 · 9 · 13 · 20 мм»: four cross-sections thicken their wall one after another,
//           each number lights up with its section
//   E ~20.9 «а інші розміри — під замовлення»: the blurred background sharpens and shrinks into a framed card,
//           plate with a caliper icon «Інші розміри — під замовлення»; 22.4 house emblem (top-left), window 1 lights
// Top-right corner (x>1500, y<150) is kept free for the global logo; no text below y≈900.

const DEF = [0.8, 5.333, 11.433, 17.033];
const M = 120;                                   // left text margin (same as scene 3)

// ---- beat A geometry
const PIPE = { x0: 860, x1: 1780, y: 596, r: 34 };
const SLV = { x0: 990, x1: 1610, R: 86, r: 38, yUp: 352 };
const CARD1_A = { x: 944, y: 236, w: 780, h: 520 };
const CARD2_A = { x: 1372, y: 566, w: 410, h: 312, rot: 0.07 };
// ---- beat B geometry
const CARD1_B = { x: M, y: 300, w: 462, h: 308 };
const CARD2_B = { x: 318, y: 528, w: 276, h: 210, rot: 0.06 };
const HS = { x0: 760, x1: 1230, gy: 770, f2: 585, ey: 404, ay: 252, by: 868, ax: 995 };
const LIST = { x: 1338, y0: 292, dy: 118, r: 40 };
const SYS = [
  { key: 'heat', label: 'Опалення', col: '#FF8A3D', off: -0.15 },
  { key: 'water', label: 'Водогін', col: '#4FB0FF', off: 0.85 },
  { key: 'sewer', label: 'Каналізація', col: '#CDB98F', off: 1.8 },
  { key: 'vent', label: 'Вентиляція', col: '#5BD68C', off: 3.1 },
  { key: 'cold', label: 'Холодильні системи', col: '#A8E8FF', off: 4.25 },
];
const PATHS = {
  heat: [[[927, 795], [927, 528], [868, 528]], [[927, 712], [868, 712]]],
  water: [[[1262, 806], [1185, 806], [1185, 470], [1146, 470]], [[1185, 655], [1146, 655]]],
  sewer: [[[1082, 566], [1082, 850], [1262, 850]]],
  vent: [[[1012, 636], [1012, 236]]],
  cold: [[[780, 826], [702, 826], [702, 772]]],
};
// ---- beat C geometry
const TUBE = { x0: 200, x1: 1720, y: 300, R: 40, r: 19 };
const DIM_Y = 412;
const RINGS = { floor: 862, x0: 190, gap: 28, scale: 1.75, wall: 13, d: [15, 22, 28, 35, 54, 76, 114] };
const COUNTER = { x: 1320, y: 764, size: 78 };
// ---- beat D geometry
const SEC = { y: 684, rIn: 56, k: 5.2, gap: 96, mm: [6, 9, 13, 20] };
// ---- beat E geometry
const CARD_E = { x: 880, y: 262, w: 920, h: 518 };
const PLATE = { x: M, y: 421, w: 720, h: 200 };

const FOAM = { color: '#D2D8DF', shade: '#7D8A9C' };
const GRID_COL = '#7FB8E8';

// ---------------------------------------------------------------- precomputed
let BUBBLES = null;
function bubbles(L) {
  if (BUBBLES) return BUBBLES;
  const r = L.rng(404); BUBBLES = [];
  for (let i = 0; i < 24; i++) BUBBLES.push({ x: r() * L.W, y: r() * L.H, s: 6 + r() * 20, v: 6 + r() * 14, ph: r() * 6.28, a: 0.04 + r() * 0.06 });
  return BUBBLES;
}
function cueStart(env, k, fb) { const c = env && env.cues && env.cues.find(q => q.k === k); return c ? c.start : fb; }
const rectLerp = (L, a, b, k) => ({ x: L.lerp(a.x, b.x, k), y: L.lerp(a.y, b.y, k), w: L.lerp(a.w, b.w, k), h: L.lerp(a.h, b.h, k), rot: L.lerp(a.rot || 0, b.rot || 0, k) });

// ---------------------------------------------------------------- backgrounds
function grid(ctx, L, t, a) {
  if (a <= 0.002) return;
  const { W, H } = L;
  L.save(ctx, () => {
    const step = 48, ox = (t * 5) % (step * 4), oy = (t * 2) % (step * 4);
    ctx.lineWidth = 1;
    for (let k = -4; k * step < W + step * 4; k++) {
      const x = Math.round(k * step + ox) + 0.5, major = ((k % 4) + 4) % 4 === 0;
      ctx.strokeStyle = L.rgba(GRID_COL, (major ? 0.065 : 0.03) * a); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let k = -4; k * step < H + step * 4; k++) {
      const y = Math.round(k * step + oy) + 0.5, major = ((k % 4) + 4) % 4 === 0;
      ctx.strokeStyle = L.rgba(GRID_COL, (major ? 0.065 : 0.03) * a); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  });
}
function baseBackground(ctx, L, t) {
  const { W, H, C } = L;
  const g = ctx.createLinearGradient(0, 0, W * 0.7, H * 1.2);
  g.addColorStop(0, '#040C19'); g.addColorStop(0.55, '#0A1D37'); g.addColorStop(1, '#102D55');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  L.glow(ctx, W * (0.68 + 0.05 * Math.sin(t * 0.13)), H * (0.42 + 0.05 * Math.cos(t * 0.11)), 820, C.cyan, 0.06);
  L.glow(ctx, W * (0.16 + 0.04 * Math.cos(t * 0.09)), H * (0.82 + 0.04 * Math.sin(t * 0.12)), 760, C.brand, 0.07);
  grid(ctx, L, t, 1);
}
function drift(ctx, L, t, a = 1) {
  const { H } = L;
  L.save(ctx, () => {
    ctx.lineWidth = 1.5;
    for (const b of bubbles(L)) {
      const y = ((b.y - t * b.v) % (H + 80) + H + 80) % (H + 80) - 40, x = b.x + Math.sin(t * 0.4 + b.ph) * 14;
      ctx.strokeStyle = L.rgba('#BFE3FF', b.a * a); ctx.beginPath(); ctx.arc(x, y, b.s, 0, Math.PI * 2); ctx.stroke();
    }
  });
}
// blueprint photo layer: pipe_ins_sizes, blurred + blue tint + grid; morph 0..1 shrinks it into the framed card (sharp)
function blueprint(ctx, L, t, a, m) {
  if (a <= 0.002) return;
  const { W, H, C } = L;
  const full = { x: 0, y: 0, w: W, h: H };
  const R = rectLerp(L, full, CARD_E, m);
  const rad = L.lerp(0, 22, m);
  const kb = L.clamp((t - 10) / 15);
  const zoom = L.lerp(1.16 + 0.02 * Math.sin(t * 0.09), L.lerp(1.0, 1.05, L.ease.inOutSine(kb)), m);
  const fx = L.lerp(0.5 + 0.06 * Math.sin(t * 0.05), 0.5, m);
  L.save(ctx, () => {
    ctx.globalAlpha *= a;
    if (m > 0.001) { // card shadow (outside only)
      ctx.save(); ctx.beginPath(); ctx.rect(-50, -50, W + 100, H + 100); rrPath(ctx, R.x, R.y, R.w, R.h, rad); ctx.clip('evenodd');
      ctx.shadowColor = `rgba(0,0,0,${0.5 * m})`; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24; L.roundRect(ctx, R.x, R.y, R.w, R.h, rad); ctx.fillStyle = '#0B1A2E'; ctx.fill(); ctx.restore();
    }
    ctx.save(); L.roundRect(ctx, R.x, R.y, R.w, R.h, rad); ctx.clip();
    const sharpA = L.ease.inOutSine(L.clamp((m - 0.15) / 0.7));
    if (sharpA < 1) L.drawCover(ctx, L.blurred('pipe_ins_sizes', 30), R.x, R.y, R.w, R.h, zoom, fx, 0.5);
    if (sharpA > 0) { ctx.globalAlpha *= sharpA; L.drawCover(ctx, L.img('pipe_ins_sizes'), R.x, R.y, R.w, R.h, zoom, fx, 0.5); ctx.globalAlpha /= sharpA; }
    const tint = 1 - L.ease.outCubic(L.clamp(m * 1.5));
    if (tint > 0.002) {
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = L.rgba('#2A6BC0', 0.8 * tint); ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
      ctx.fillStyle = L.rgba('#06162E', 0.5 * tint); ctx.fillRect(R.x, R.y, R.w, R.h);
      // edge vignette to keep text areas calm
      const vg = ctx.createRadialGradient(R.x + R.w / 2, R.y + R.h / 2, R.h * 0.3, R.x + R.w / 2, R.y + R.h / 2, R.h * 1.05);
      vg.addColorStop(0, 'rgba(3,10,22,0)'); vg.addColorStop(1, `rgba(3,10,22,${0.55 * tint})`);
      ctx.fillStyle = vg; ctx.fillRect(R.x, R.y, R.w, R.h);
      // blueprint grid overlay (stronger than base grid)
      grid(ctx, L, t, 2.2 * tint);
    }
    // sheen
    const g = ctx.createLinearGradient(0, R.y, 0, R.y + R.h); g.addColorStop(0, `rgba(255,255,255,${0.08 * m})`); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(0,0,0,${0.22 * m})`);
    ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
    ctx.restore();
    if (m > 0.001) { L.roundRect(ctx, R.x, R.y, R.w, R.h, rad); ctx.lineWidth = 4; ctx.strokeStyle = `rgba(255,255,255,${0.88 * L.clamp(m * 1.4 - 0.2)})`; ctx.stroke(); }
  });
}

// ---------------------------------------------------------------- helpers
function rrPath(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}
// framed photo card; clipX: only the part left of this x (screen) is shown (curtain reveal)
function card(ctx, L, name, R, o = {}) {
  const { alpha = 1, zoom = 1.04, fx = 0.5, fy = 0.5, r = 20, scale = 1, clipX = null, bw = 4 } = o;
  if (alpha <= 0.002) return;
  const { x, y, w, h, rot = 0 } = R;
  L.save(ctx, () => {
    if (clipX != null) { ctx.beginPath(); ctx.rect(-100, -100, clipX + 100, L.H + 200); ctx.clip(); }
    ctx.globalAlpha *= alpha;
    ctx.translate(x + w / 2, y + h / 2); if (rot) ctx.rotate(rot); if (scale !== 1) ctx.scale(scale, scale); ctx.translate(-w / 2, -h / 2);
    ctx.save(); ctx.beginPath(); ctx.rect(-400, -400, w + 800, h + 800); rrPath(ctx, 0, 0, w, h, r); ctx.clip('evenodd');
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 46; ctx.shadowOffsetY = 22; L.roundRect(ctx, 0, 0, w, h, r); ctx.fillStyle = '#0B1A2E'; ctx.fill(); ctx.restore();
    ctx.save(); L.roundRect(ctx, 0, 0, w, h, r); ctx.clip();
    L.drawCover(ctx, L.img(name), 0, 0, w, h, zoom, fx, fy);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.restore();
    L.roundRect(ctx, 0, 0, w, h, r); ctx.lineWidth = bw; ctx.strokeStyle = 'rgba(255,255,255,0.88)'; ctx.stroke();
  });
}
// draw the first p (0..1) of a polyline as the current path
function polyPath(ctx, pts, p = 1) {
  let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = total * Math.max(0, Math.min(1, p));
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], l = Math.hypot(bx - ax, by - ay);
    if (l <= left) { ctx.lineTo(bx, by); left -= l; } else { const k = left / l; ctx.lineTo(ax + (bx - ax) * k, ay + (by - ay) * k); left = 0; }
  }
}
const polyLen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };

// ---------------------------------------------------------------- foam sleeve (3/4 view from the left)
// angle φ around the axis: 0 = top, π/2 = towards the viewer, π = bottom. Surface point → (x + eR·sinφ, y − R·cosφ)
function sleeve(ctx, L, x0, x1, y, R, r, o = {}) {
  const { e = 0.3, th = 0, gap = 0, slitA = 0, rot = 0, alpha = 1, knit = 0, knitX = 0, sheen = -1, shadow = true, clipX = null } = o;
  if (alpha <= 0.002) return;
  const { C } = L;
  const eR = e * R, er = e * r;
  const body = () => { ctx.beginPath(); ctx.moveTo(x0, y - R); ctx.lineTo(x1, y - R); ctx.ellipse(x1, y, eR, R, 0, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x0, y + R); ctx.closePath(); };
  const tile = L.foamTile({ cell: 8, color: FOAM.color, shade: FOAM.shade, seed: 5, size: 192 });
  L.save(ctx, () => {
    if (clipX != null) { ctx.beginPath(); ctx.rect(-10, -10, clipX + 10, L.H + 20); ctx.clip(); }
    ctx.globalAlpha *= alpha;
    if (shadow) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; body(); ctx.fillStyle = FOAM.color; ctx.fill(); ctx.restore(); }
    // body: foam texture scrolling with the rotation
    ctx.save(); body(); ctx.clip();
    const off = ((rot * R) % 192 + 192) % 192;
    ctx.fillStyle = FOAM.color; ctx.fillRect(x0 - 4, y - R - 4, x1 - x0 + eR + 8, 2 * R + 8);
    ctx.save(); ctx.translate(0, off); ctx.fillStyle = ctx.createPattern(tile, 'repeat'); ctx.fillRect(x0 - 4, y - R - off - 4, x1 - x0 + eR + 8, 2 * R + 8); ctx.restore();
    const g = ctx.createLinearGradient(0, y - R, 0, y + R);
    g.addColorStop(0, 'rgba(30,44,66,0.55)'); g.addColorStop(0.1, 'rgba(255,255,255,0.05)'); g.addColorStop(0.3, 'rgba(255,255,255,0.42)');
    g.addColorStop(0.48, 'rgba(255,255,255,0.08)'); g.addColorStop(0.78, 'rgba(26,40,64,0.32)'); g.addColorStop(1, 'rgba(10,20,38,0.66)');
    ctx.fillStyle = g; ctx.fillRect(x0 - 4, y - R - 4, x1 - x0 + eR + 8, 2 * R + 8);
    const hg = ctx.createLinearGradient(x0, 0, x1 + eR, 0); hg.addColorStop(0, 'rgba(255,255,255,0.06)'); hg.addColorStop(1, 'rgba(10,20,40,0.22)');
    ctx.fillStyle = hg; ctx.fillRect(x0 - 4, y - R - 4, x1 - x0 + eR + 8, 2 * R + 8);
    // knitted amber pattern (scarf), running as a band along the sleeve
    if (knit > 0.002) {
      const band = 210;
      const wg = ctx.createLinearGradient(knitX - band * 1.6, 0, knitX + band * 1.6, 0);
      wg.addColorStop(0, L.rgba(C.amber, 0)); wg.addColorStop(0.5, L.rgba(C.amber, 0.30 * knit)); wg.addColorStop(1, L.rgba(C.amber, 0));
      ctx.fillStyle = wg; ctx.fillRect(x0 - 4, y - R - 4, x1 - x0 + eR + 8, 2 * R + 8);
      const dPhi = 15 / R, ph0 = ((rot % dPhi) + dPhi) % dPhi;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3.2;
      for (let cx = x0 + 10; cx < x1 + 4; cx += 19) {
        const m = Math.exp(-Math.pow((cx - knitX) / band, 2)) * knit;
        if (m < 0.03) continue;
        ctx.strokeStyle = L.rgba('#FFC46B', 0.85 * m);
        ctx.beginPath();
        for (let phi = ph0; phi < Math.PI; phi += dPhi) {
          const s = Math.sin(phi); if (s < 0.12) continue;
          const yy = y - R * Math.cos(phi), xx = cx + eR * s, hh = 6.5 * s;
          ctx.moveTo(xx - 7, yy - hh); ctx.lineTo(xx, yy + hh); ctx.lineTo(xx + 7, yy - hh);
        }
        ctx.stroke();
      }
    }
    // slit on the near side of the body
    const a1 = th - gap / 2, a2 = th + gap / 2;
    const v1 = Math.max(0.0, Math.min(Math.PI, a1)), v2 = Math.max(0.0, Math.min(Math.PI, a2));
    if (slitA > 0.002 && Math.sin(th) > 0.02 && gap < 0.04) {
      const yy = y - R * Math.cos(th), xs = eR * Math.sin(th);
      ctx.strokeStyle = `rgba(30,40,55,${0.75 * slitA * Math.sqrt(Math.sin(th))})`; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(x0 + xs, yy); ctx.lineTo(x1 + xs, yy); ctx.stroke();
    } else if (gap >= 0.04 && v2 > v1) {
      const yA = y - R * Math.cos(v1), yB = y - R * Math.cos(v2);
      ctx.fillStyle = 'rgba(22,30,42,0.92)'; ctx.fillRect(x0, yA, x1 - x0 + eR, yB - yA);
    }
    // sheen sweep (after wrapping)
    if (sheen > 0 && sheen < 1) {
      const sx = L.lerp(x0 - 300, x1 + 300, sheen);
      const sg = ctx.createLinearGradient(sx - 160, y - R, sx + 160, y + R);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, L.rgba(C.brandHi, 0.42)); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(x0 - 4, y - R - 4, x1 - x0 + eR + 8, 2 * R + 8);
    }
    ctx.restore();
    // end face (annulus) at x0
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x0, y, eR, R, 0, 0, Math.PI * 2); ctx.ellipse(x0, y, er, r, 0, 0, Math.PI * 2, true);
    ctx.fillStyle = '#E3E8EE'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.globalAlpha *= 0.7; ctx.fillStyle = ctx.createPattern(L.foamTile({ cell: 6, color: '#E3E8EE', shade: FOAM.shade, seed: 9, size: 128 }), 'repeat'); ctx.fillRect(x0 - eR - 2, y - R - 2, 2 * eR + 4, 2 * R + 4); ctx.restore();
    const cg = ctx.createLinearGradient(x0, y - R, x0, y + R); cg.addColorStop(0, 'rgba(255,255,255,0.35)'); cg.addColorStop(1, 'rgba(40,58,86,0.42)');
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = 'rgba(120,135,155,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x0, y, eR, R, 0, 0, Math.PI * 2); ctx.stroke();
    // hole
    ctx.beginPath(); ctx.ellipse(x0, y, er, r, 0, 0, Math.PI * 2);
    const hg2 = ctx.createLinearGradient(x0 - er, y, x0 + er, y); hg2.addColorStop(0, '#0E151F'); hg2.addColorStop(0.7, '#1C2633'); hg2.addColorStop(1, '#5E6B7C');
    ctx.fillStyle = hg2; ctx.fill();
    // cut through the wall (notch)
    if (slitA > 0.002 || gap > 0.002) {
      const N = 8, ga = Math.max(gap, 0.0);
      ctx.beginPath();
      for (let i = 0; i <= N; i++) { const a = th - ga / 2 + ga * i / N; ctx.lineTo(x0 + eR * Math.sin(a), y - R * Math.cos(a)); }
      for (let i = N; i >= 0; i--) { const a = th - ga / 2 + ga * i / N; ctx.lineTo(x0 + er * Math.sin(a), y - r * Math.cos(a)); }
      ctx.closePath();
      ctx.fillStyle = `rgba(14,21,31,${Math.max(slitA, L.clamp(gap * 8))})`; ctx.fill();
      ctx.strokeStyle = `rgba(14,21,31,${0.9 * Math.max(slitA, L.clamp(gap * 8))})`; ctx.lineWidth = 2.6; ctx.stroke();
    }
    ctx.restore();
  });
}
// cut wedge path of the sleeve end face (for clipping the pipe that passes through the open slit)
function wedgePath(ctx, x0, y, R, r, e, th, gap) {
  const N = 8, eR = e * R, er = e * r;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) { const a = th - gap / 2 + gap * i / N; ctx.lineTo(x0 + eR * Math.sin(a), y - R * Math.cos(a)); }
  for (let i = N; i >= 0; i--) { const a = th - gap / 2 + gap * i / N; ctx.lineTo(x0 + er * Math.sin(a), y - r * Math.cos(a)); }
  ctx.closePath();
}
// steel pipe body from xa to xb (3/4 view), optional open end face at xa
function steelPipe(ctx, L, xa, xb, y, r, { e = 0.3, face = true, warm = 0, right = true } = {}) {
  const { C } = L;
  const er = e * r;
  const g = ctx.createLinearGradient(0, y - r, 0, y + r);
  g.addColorStop(0, '#3A434E'); g.addColorStop(0.16, '#8E9AA9'); g.addColorStop(0.32, '#EEF2F7'); g.addColorStop(0.5, '#A3AEBB'); g.addColorStop(0.82, '#5C6774'); g.addColorStop(1, '#2C333C');
  ctx.beginPath(); ctx.moveTo(xa, y - r); ctx.lineTo(xb, y - r);
  if (right) ctx.ellipse(xb, y, er, r, 0, -Math.PI / 2, Math.PI / 2); else ctx.lineTo(xb, y + r);
  ctx.lineTo(xa, y + r); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  if (face) {
    ctx.beginPath(); ctx.ellipse(xa, y, er, r, 0, 0, Math.PI * 2);
    const fg = ctx.createLinearGradient(xa, y - r, xa, y + r); fg.addColorStop(0, '#F2F5F9'); fg.addColorStop(1, '#7E8996'); ctx.fillStyle = fg; ctx.fill();
    ctx.beginPath(); ctx.ellipse(xa + er * 0.06, y, er * 0.8, r * 0.82, 0, 0, Math.PI * 2);
    const ig = ctx.createRadialGradient(xa, y, 1, xa, y, r * 0.85);
    ig.addColorStop(0, L.mixColor('#141B24', '#FFB547', 0.75 * warm)); ig.addColorStop(1, L.mixColor('#0C1118', '#B8481A', 0.7 * warm));
    ctx.fillStyle = ig; ctx.fill();
    if (warm > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; L.glow(ctx, xa, y, r * 2.4, C.amber, 0.3 * warm); ctx.restore(); }
  }
}

// ---------------------------------------------------------------- icons (100-unit box, stroked)
function sysIcon(ctx, L, key, x, y, size, color, t) {
  L.save(ctx, () => {
    ctx.translate(x, y); const s = size / 100; ctx.scale(s, s);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    switch (key) {
      case 'heat': { // radiator
        for (let i = -2; i <= 2; i++) { L.roundRect(ctx, i * 17 - 6.5, -30, 13, 58, 6.5); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-46, -18); ctx.lineTo(-41, -18); ctx.moveTo(41, 18); ctx.lineTo(46, 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-30, 30); ctx.lineTo(-30, 38); ctx.moveTo(30, 30); ctx.lineTo(30, 38); ctx.stroke();
        break;
      }
      case 'water': { // tap + drop
        ctx.beginPath(); ctx.moveTo(-44, -26); ctx.lineTo(-44, -6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-44, -16); ctx.lineTo(4, -16); ctx.quadraticCurveTo(20, -16, 20, 0); ctx.lineTo(20, 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-14, -16); ctx.lineTo(-14, -34); ctx.moveTo(-28, -36); ctx.lineTo(0, -36); ctx.stroke();
        const ph = (t * 0.7) % 1, dy = 14 + ph * 16;
        ctx.save(); ctx.globalAlpha *= 0.35 + 0.65 * Math.sin(Math.PI * ph);
        ctx.beginPath(); ctx.moveTo(20, dy); ctx.bezierCurveTo(24, dy + 7, 30, dy + 12, 30, dy + 18); ctx.arc(20, dy + 18, 10, 0, Math.PI); ctx.bezierCurveTo(10, dy + 12, 16, dy + 7, 20, dy); ctx.fill();
        ctx.restore();
        break;
      }
      case 'sewer': { // P-trap drain
        ctx.lineWidth = 9;
        ctx.beginPath(); ctx.moveTo(-36, -40); ctx.lineTo(-12, -40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-24, -40); ctx.lineTo(-24, 6); ctx.arc(-4, 6, 20, Math.PI, 0, true); ctx.lineTo(16, -8); ctx.lineTo(44, -8); ctx.stroke();
        ctx.lineWidth = 5; ctx.globalAlpha *= 0.6;
        const k = (t * 0.8) % 1; ctx.beginPath(); ctx.arc(-24 + 0, -30 + k * 30, 3.5, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'vent': { // fan
        ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.stroke();
        ctx.save(); ctx.rotate(t * 2.4);
        for (let i = 0; i < 3; i++) {
          ctx.save(); ctx.rotate(i * Math.PI * 2 / 3);
          ctx.beginPath(); ctx.moveTo(0, -6); ctx.bezierCurveTo(10, -18, 30, -22, 28, -10); ctx.bezierCurveTo(26, 0, 12, 2, 0, -6); ctx.fill();
          ctx.restore();
        }
        ctx.restore();
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'cold': { // snowflake inside a cold chamber
        L.roundRect(ctx, -42, -38, 84, 76, 10); ctx.stroke();
        ctx.lineWidth = 5.5;
        for (let i = 0; i < 6; i++) {
          ctx.save(); ctx.rotate(i * Math.PI / 3);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -24); ctx.moveTo(-7, -16); ctx.lineTo(0, -10); ctx.lineTo(7, -16); ctx.stroke();
          ctx.restore();
        }
        break;
      }
    }
  });
}
function caliperIcon(ctx, L, x, y, size, color, open) {
  L.save(ctx, () => {
    ctx.translate(x, y); const s = size / 100; ctx.scale(s, s);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // main beam
    L.roundRect(ctx, -46, -30, 92, 16, 3); ctx.stroke();
    for (let i = -36; i <= 36; i += 12) { ctx.beginPath(); ctx.moveTo(i, -30); ctx.lineTo(i, i % 24 === 0 ? -21 : -25); ctx.lineWidth = 3; ctx.stroke(); }
    ctx.lineWidth = 6;
    // fixed jaw
    ctx.beginPath(); ctx.moveTo(-46, -14); ctx.lineTo(-46, 34); ctx.lineTo(-34, 22); ctx.lineTo(-34, -14); ctx.stroke();
    // sliding jaw
    const sx = -20 + open * 46;
    L.roundRect(ctx, sx - 4, -36, 26, 28, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx, -8); ctx.lineTo(sx, 34); ctx.lineTo(sx + 12, 22); ctx.lineTo(sx + 12, -8); ctx.stroke();
  });
}

// running motif: small house with five windows (same drawing as scene 5); window 1 lights in this scene
function houseIcon(ctx, L, x, y, alpha, lit1) {
  if (alpha <= 0.001) return;
  const { C } = L;
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha; ctx.translate(x, y);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(10,14,20,0.35)'; ctx.beginPath(); ctx.moveTo(-42, 0); ctx.lineTo(-42, -60); ctx.lineTo(0, -96); ctx.lineTo(42, -60); ctx.lineTo(42, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(220,228,238,0.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-52, -56); ctx.lineTo(0, -98); ctx.lineTo(52, -56); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-42, -64); ctx.lineTo(-42, 0); ctx.lineTo(42, 0); ctx.lineTo(42, -64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-7, -20); ctx.lineTo(7, -20); ctx.lineTo(7, 0); ctx.stroke();
    const wins = [[-23, -44], [0, -44], [23, -44], [-23, -21], [23, -21]];
    wins.forEach(([wx, wy], i) => {
      const lit = i === 0 ? lit1 : 0;
      if (lit > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; L.glow(ctx, wx, wy, 24, C.amber, 0.55 * lit); ctx.restore(); }
      ctx.fillStyle = L.mixColor('#1A222C', '#FFC266', lit); ctx.fillRect(wx - 7, wy - 7, 14, 14);
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(220,228,238,0.85)'; ctx.strokeRect(wx - 7, wy - 7, 14, 14);
    });
  });
}

// foam ring (cross-section) centred at x,y
function foamRing(ctx, L, x, y, rIn, rOut, { alpha = 1, glow = 0, hl = 0 } = {}) {
  if (alpha <= 0.002 || rOut <= 0.5) return;
  const { C } = L;
  rIn = Math.min(rIn, rOut - 1);
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 16;
    ctx.beginPath(); ctx.arc(x, y, rOut, 0, Math.PI * 2); ctx.arc(x, y, Math.max(0, rIn), 0, Math.PI * 2, true); ctx.fillStyle = FOAM.color; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, rOut, 0, Math.PI * 2); ctx.arc(x, y, Math.max(0, rIn), 0, Math.PI * 2, true);
    ctx.save(); ctx.clip();
    ctx.fillStyle = ctx.createPattern(L.foamTile({ cell: 7, color: '#DCE1E7', shade: FOAM.shade, seed: 21, size: 160 }), 'repeat'); ctx.fillRect(x - rOut, y - rOut, rOut * 2, rOut * 2);
    const sg = ctx.createRadialGradient(x - rOut * 0.35, y - rOut * 0.45, rOut * 0.1, x, y, rOut);
    sg.addColorStop(0, 'rgba(255,255,255,0.32)'); sg.addColorStop(1, 'rgba(30,48,76,0.42)'); ctx.fillStyle = sg; ctx.fillRect(x - rOut, y - rOut, rOut * 2, rOut * 2);
    if (hl > 0.002) { ctx.fillStyle = L.rgba(C.brandHi, 0.22 * hl); ctx.fillRect(x - rOut, y - rOut, rOut * 2, rOut * 2); }
    ctx.restore();
    // inner hole shading + rims
    ctx.beginPath(); ctx.arc(x, y, Math.max(0, rIn), 0, Math.PI * 2);
    const hg = ctx.createRadialGradient(x + rIn * 0.25, y + rIn * 0.3, 0, x, y, Math.max(1, rIn)); hg.addColorStop(0, 'rgba(6,14,28,0.15)'); hg.addColorStop(1, 'rgba(6,14,28,0.55)');
    ctx.fillStyle = hg; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x, y, rOut - 0.75, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,55,80,0.55)'; ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, rIn + 0.75), 0, Math.PI * 2); ctx.stroke();
    if (glow > 0.002) { ctx.strokeStyle = L.rgba(C.brandHi, 0.9 * glow); ctx.lineWidth = 3; ctx.shadowColor = C.brandHi; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x, y, rOut + 7, 0, Math.PI * 2); ctx.stroke(); }
  });
}
function arrowHead(ctx, x, y, dir, s) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dir * s, y - s * 0.5); ctx.lineTo(x - dir * s, y + s * 0.5); ctx.closePath(); ctx.fill(); }

// ---------------------------------------------------------------- beat B: house cut-away
function houseCut(ctx, L, t, hp, sysP, glowK, alpha) {
  if (alpha <= 0.002) return;
  const { C } = L;
  const { x0, x1, gy, f2, ey, ay, by, ax } = HS;
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const fa = L.clamp(hp * 1.4 - 0.3);
    // soil + interior fills
    ctx.fillStyle = L.rgba('#5E86B0', 0.10 * fa); ctx.fillRect(650, gy, 612, by - gy + 30);
    ctx.fillStyle = L.rgba('#081830', 0.6 * fa); ctx.fillRect(x0, gy, x1 - x0, by - gy);
    ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x0, ey); ctx.lineTo(x1, ey); ctx.lineTo(x1, gy); ctx.closePath(); ctx.fillStyle = L.rgba('#9CC8F0', 0.05 * fa); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x0 - 34, ey + 18); ctx.lineTo(ax, ay); ctx.lineTo(x1 + 34, ey + 18); ctx.closePath(); ctx.fillStyle = L.rgba('#9CC8F0', 0.035 * fa); ctx.fill();
    // structure lines (drawn progressively)
    const S = (pts, p, w, a) => { polyPath(ctx, pts, p); ctx.lineWidth = w; ctx.strokeStyle = L.rgba('#CFE3F7', a); ctx.stroke(); };
    const p1 = L.clamp(hp * 1.6), p2 = L.clamp(hp * 1.6 - 0.35), p3 = L.clamp(hp * 1.6 - 0.6);
    S([[x0, gy], [x0, ey], [x1, ey], [x1, gy]], p1, 4, 0.8);
    S([[x0 - 34, ey + 18], [ax, ay], [x1 + 34, ey + 18]], p1, 5, 0.85);
    S([[650, gy], [1262, gy]], p1, 3, 0.6);
    S([[x0, gy], [x0, by], [x1, by], [x1, gy]], p2, 3, 0.45);
    S([[x0, f2], [x1, f2]], p2, 3, 0.55);
    S([[x0 + 160, f2], [x0 + 160, f2 - 36]], p3, 2.5, 0.35);
    S([[x0, ey], [x1, ey]], p2, 3, 0.55);
    // soil hatch
    if (fa > 0) {
      ctx.strokeStyle = L.rgba('#9CC8F0', 0.16 * fa); ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = 656; x < 1262; x += 18) { if (x > x0 - 8 && x < x1 + 8) continue; ctx.moveTo(x, gy + 8); ctx.lineTo(x - 12, gy + 20); }
      ctx.stroke();
    }
    // systems
    SYS.forEach((s, i) => {
      const p = sysP[i]; if (p <= 0.002) return;
      const g = glowK[i];
      const paths = PATHS[s.key];
      ctx.save();
      if (g > 0.01) { ctx.shadowColor = s.col; ctx.shadowBlur = 22 * g; }
      paths.forEach((pts, j) => {
        const pp = L.clamp(p * 1.25 - j * 0.25);
        if (pp <= 0) return;
        polyPath(ctx, pts, pp); ctx.lineWidth = s.key === 'vent' ? 12 : 7; ctx.strokeStyle = L.rgba(s.col, 0.95); ctx.stroke();
      });
      ctx.restore();
      // flowing dashes
      if (p > 0.9) {
        ctx.save(); ctx.setLineDash([10, 22]); ctx.lineDashOffset = -t * (s.key === 'sewer' ? -36 : 40);
        paths.forEach(pts => { polyPath(ctx, pts, 1); ctx.lineWidth = s.key === 'vent' ? 4 : 2.6; ctx.strokeStyle = L.rgba('#FFFFFF', 0.55 * L.clamp((p - 0.9) * 10)); ctx.stroke(); });
        ctx.restore();
      }
      // devices
      const da = L.clamp(p * 2 - 0.6);
      if (da <= 0) return;
      ctx.save(); ctx.globalAlpha *= da; ctx.strokeStyle = s.col; ctx.fillStyle = L.rgba(s.col, 0.18); ctx.lineWidth = 3.5;
      if (s.key === 'heat') {
        [[780, 690], [780, 506]].forEach(([rx, ry]) => { L.roundRect(ctx, rx, ry, 88, 44, 6); ctx.fill(); ctx.stroke(); for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(rx + k * 17.6, ry + 6); ctx.lineTo(rx + k * 17.6, ry + 38); ctx.stroke(); } });
        L.roundRect(ctx, 900, 795, 54, 62, 6); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(927, 826, 10, 0, Math.PI * 2); ctx.stroke();
        L.heatWaves(ctx, 824, 498, 64, 60, t, 0.45 * da, s.col);
      } else if (s.key === 'water') {
        [[1146, 470], [1146, 655]].forEach(([tx, ty]) => { ctx.beginPath(); ctx.moveTo(tx + 4, ty); ctx.lineTo(tx - 18, ty); ctx.quadraticCurveTo(tx - 26, ty, tx - 26, ty + 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(tx - 8, ty); ctx.lineTo(tx - 8, ty - 12); ctx.moveTo(tx - 16, ty - 12); ctx.lineTo(tx, ty - 12); ctx.stroke(); });
      } else if (s.key === 'sewer') {
        ctx.beginPath(); ctx.moveTo(1058, 552); ctx.lineTo(1106, 552); ctx.lineTo(1094, 568); ctx.lineTo(1070, 568); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (s.key === 'vent') {
        ctx.beginPath(); ctx.moveTo(986, 650); ctx.lineTo(1038, 650); ctx.lineTo(1024, 634); ctx.lineTo(1000, 634); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(994, 236); ctx.lineTo(1030, 236); ctx.stroke();
        ctx.save(); ctx.translate(1012, 340); ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fillStyle = '#0B2240'; ctx.fill(); ctx.stroke(); ctx.rotate(t * 3);
        for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.ellipse(0, -10, 5, 10, 0, 0, Math.PI * 2); ctx.fillStyle = s.col; ctx.fill(); }
        ctx.restore();
      } else if (s.key === 'cold') {
        L.roundRect(ctx, 780, 795, 96, 62, 6); ctx.fill(); ctx.stroke();
        L.roundRect(ctx, 670, 718, 64, 52, 6); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(702, 744, 15, 0, Math.PI * 2); ctx.stroke();
        L.save(ctx, () => { ctx.translate(828, 826); ctx.lineWidth = 2.5; for (let k = 0; k < 6; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -18); ctx.moveTo(-5, -12); ctx.lineTo(0, -8); ctx.lineTo(5, -12); ctx.stroke(); } });
      }
      ctx.restore();
    });
  });
}
// one row of the systems list: badge + label
function listRow(ctx, L, s, i, t, p, act) {
  if (p <= 0.002) return;
  const { C } = L;
  const y = LIST.y0 + i * LIST.dy, x = LIST.x;
  const e = L.ease.outCubic(L.clamp(p));
  L.at(ctx, { x: x + (1 - e) * 40, y, alpha: L.clamp(p * 1.5) }, () => {
    // flash ring
    if (act > 0 && act < 1) { ctx.strokeStyle = L.rgba(s.col, 0.8 * (1 - act)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, LIST.r + 4 + act * 34, 0, Math.PI * 2); ctx.stroke(); }
    const fl = act > 0 ? Math.sin(Math.PI * L.clamp(act)) : 0;
    if (fl > 0.01) L.glow(ctx, 0, 0, LIST.r * 2.0, s.col, 0.28 * fl);
    ctx.beginPath(); ctx.arc(0, 0, LIST.r, 0, Math.PI * 2); ctx.fillStyle = L.rgba(s.col, 0.14 + 0.16 * fl); ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = L.rgba(s.col, 0.85); ctx.stroke();
    sysIcon(ctx, L, s.key, 0, 0, 44, L.mixColor('#F6FAFF', s.col, 0.25), t);
    L.text(ctx, s.label, LIST.r + 22, 1, { role: 'bodyBold', size: 38, color: C.white, baseline: 'middle' });
  });
}

// ---------------------------------------------------------------- scene
module.exports = {
  draw(ctx, t, d, L, env) {
    const { C, W, H, clamp, lerp, ep, prog, ease } = L;
    const c0 = cueStart(env, 0, DEF[0]), c1 = cueStart(env, 1, DEF[1]), c2 = cueStart(env, 2, DEF[2]), c3 = cueStart(env, 3, DEF[3]);

    // ---- clocks
    const hlIn = c0 - 0.45;                    // headline
    const ws = c0 + 1.25;                      // sleeve starts wrapping
    const knitA = c0 + 0.25, knitD = 1.1;      // knitted pattern sweep
    const curtA = c0 + 2.6, curtD = 0.75;       // curtain reveal of card 1
    const card2A = c0 + 3.35;                  // card 2 lands
    const mvA = c1 - 0.35;                     // cards → left third
    const bOut = c2 - 0.75;                    // beat B exit
    const cOut = c3 - 0.8;                     // beat C exit
    const dOut = c3 + 3.1;                     // beat D exit
    const morphA = c3 + 3.1;                   // bg → card
    const plateA = c3 + 3.9;                   // «Інші розміри — під замовлення»
    const houseA = c3 + 5.35, winA = c3 + 6.05;

    // ---- background
    baseBackground(ctx, L, t);
    const bpA = ep(t, c2 - 0.85, 0.9, 'inOutSine');
    const morph = ep(t, morphA, 1.0, 'inOutCubic');
    blueprint(ctx, L, t, bpA, morph);
    drift(ctx, L, t, 1 - 0.5 * bpA * (1 - morph));

    // ============================================================ BEAT A + B (photo cards, headline, vector)
    const mv = ep(t, mvA, 0.9, 'inOutCubic');
    const bo = ep(t, bOut, 0.6, 'inOutCubic');
    if (bo < 1) {
      // ---- vector: pipe + sleeve (before the curtain has passed)
      const cq = ease.inOutCubic(prog(t, curtA, curtD));
      const curtX = lerp(860, 1830, cq);
      if (cq < 1) L.save(ctx, () => {
        ctx.beginPath(); ctx.rect(curtX, 0, W - curtX + 10, H); ctx.clip();
        const va = ep(t, -0.9, 0.9);
        ctx.globalAlpha *= clamp(va * 1.3);
        const lift = (1 - va) * 40;
        // rotation: spins, then slows to a stop with the slit at the bottom (θ = π) right before wrapping
        const ts = ws - 0.1, om = 2.5, tau = 0.7, xq = Math.max(0, ts - t);
        const fq = xq > tau ? xq - tau / 2 : xq * xq / (2 * tau);
        const th = Math.PI - om * fq;
        const wq = ep(t, ws, 0.7, 'inOutCubic');
        const bob = 6 * Math.sin(t * 1.6) * (1 - wq);
        const sy = lerp(SLV.yUp, PIPE.y, wq) + bob + lift;
        const gap = 1.0 * (ep(t, ws - 0.3, 0.4, 'outCubic') - ep(t, ws + 0.55, 0.35, 'inOutCubic'));
        const e = 0.3 + 0.05 * Math.sin(t * 1.1) * (1 - wq);
        const heat = (1 - ep(t, ws + 0.3, 0.5)) * clamp(va);
        const warm = 0.35 + 0.65 * ep(t, ws + 0.6, 0.6);
        const py = PIPE.y + lift;
        // bare pipe with heat escaping
        steelPipe(ctx, L, PIPE.x0, PIPE.x1, py, PIPE.r, { warm });
        if (heat > 0.01) { L.heatWaves(ctx, 1150, py - 44, 540, 240, t, 0.75 * heat, C.orange); L.heatWaves(ctx, 1580, py - 44, 300, 210, t + 0.4, 0.6 * heat, C.ember); }
        // sleeve
        const knit = L.envelope(t, knitA, knitA + knitD, 0.3, 0.35);
        const knitX = lerp(SLV.x0 - 200, SLV.x1 + 220, ease.inOutSine(prog(t, knitA, knitD)));
        const sheen = prog(t, ws + 0.85, 0.75);
        sleeve(ctx, L, SLV.x0, SLV.x1, sy, SLV.R, SLV.r, { e, th, gap, slitA: 1, rot: th, knit, knitX, sheen: sheen > 0 && sheen < 1 ? sheen : -1 });
        // pipe parts in front of / visible through the sleeve end face
        const dx = SLV.x0, eR = e * SLV.R;
        L.save(ctx, () => { ctx.beginPath(); ctx.rect(0, 0, dx, H); ctx.clip(); steelPipe(ctx, L, PIPE.x0, dx + 2, py, PIPE.r, { warm, right: false }); });
        L.save(ctx, () => { ctx.beginPath(); ctx.ellipse(dx, sy, e * SLV.r, SLV.r, 0, 0, Math.PI * 2); ctx.clip(); steelPipe(ctx, L, PIPE.x0, dx + eR + 4, py, PIPE.r, { warm, right: false, face: true }); ctx.fillStyle = 'rgba(8,14,24,0.35)'; ctx.fillRect(dx - 60, sy - 60, 120, 120); });
        if (gap > 0.02) L.save(ctx, () => { wedgePath(ctx, dx, sy, SLV.R, SLV.r, e, th, gap); ctx.clip(); steelPipe(ctx, L, PIPE.x0, dx + eR + 4, py, PIPE.r, { warm, right: false }); ctx.fillStyle = 'rgba(8,14,24,0.35)'; ctx.fillRect(dx - 90, sy - 90, 180, 180); });
      });
      // curtain edge line
      if (cq > 0 && cq < 1) L.save(ctx, () => {
        const a = Math.sin(Math.PI * cq);
        ctx.strokeStyle = L.rgba(C.brandHi, 0.9 * a); ctx.lineWidth = 4; ctx.shadowColor = C.brandHi; ctx.shadowBlur = 26;
        ctx.beginPath(); ctx.moveTo(curtX, 190); ctx.lineTo(curtX, 940); ctx.stroke();
      });

      // ---- photo cards
      const kb = clamp((t - curtA) / 12);
      const bAlpha = 1 - bo;
      const bShift = -40 * bo;
      if (cq > 0) {
        const R1 = rectLerp(L, CARD1_A, CARD1_B, mv); R1.x += bShift;
        card(ctx, L, 'pipe_ins_on_pipes', R1, { alpha: bAlpha, zoom: lerp(1.0, 1.08, ease.inOutSine(kb)), fx: lerp(0.4, 0.62, ease.inOutSine(kb)), fy: 0.5, clipX: cq < 1 ? curtX : null });
      }
      const c2p = ep(t, card2A, 0.75, 'outCubic');
      if (c2p > 0) {
        const R2 = rectLerp(L, CARD2_A, CARD2_B, mv); R2.x += bShift;
        R2.rot += (1 - c2p) * 0.22; R2.x += (1 - c2p) * 90; R2.y += (1 - c2p) * -60;
        card(ctx, L, 'pipe_ins_metal', R2, { alpha: clamp(c2p * 1.8) * bAlpha, scale: lerp(1.22, 1, c2p), zoom: lerp(1.04, 1.1, ease.inOutSine(clamp((t - card2A) / 10))), fx: 0.5, fy: 0.5 });
      }

      // ---- headline «Трубна ізоляція»
      const hp = ep(t, hlIn, 1.1, 'linear');
      const hout = prog(t, mvA - 0.3, 0.5);
      if (hout < 1) {
        const ba = clamp(hp * 2) * (1 - ease.inCubic(hout));
        L.save(ctx, () => { ctx.fillStyle = L.rgba(C.brandHi, ba); ctx.fillRect(M, 372, 72 * ease.outCubic(clamp(hp * 1.6)), 6); });
        L.revealText(ctx, 'Трубна ізоляція', M, 482, clamp(hp * 1.2), { role: 'display', size: 104, maxWidth: 640, lineHeight: 1.16, stagger: 0.35, out: hout });
      }

      // ---- beat B: house cut-away + systems list
      if (t > mvA - 0.5) {
        const hpB = ep(t, c1 - 0.3, 1.2, 'inOutSine');
        const sysP = SYS.map(s => ep(t, c1 + s.off, 0.75, 'inOutCubic'));
        const glowK = SYS.map(s => { const q = t - (c1 + s.off); return q < 0 ? 0 : q < 0.5 ? q / 0.5 : Math.max(0.25, 1 - (q - 0.5) / 1.2); });
        L.at(ctx, { x: bShift, alpha: bAlpha }, () => {
          houseCut(ctx, L, t, hpB, sysP, glowK, clamp(hpB * 3));
          SYS.forEach((s, i) => listRow(ctx, L, s, i, t, ep(t, c1 + s.off - 0.1, 0.55, 'linear'), prog(t, c1 + s.off + 0.05, 0.8)));
        });
      }
    }

    // ============================================================ BEAT C (blueprint: 2 m, Ø 15–114 мм)
    const co = ep(t, cOut, 0.55, 'inOutCubic');
    if (t > c2 - 0.8 && co < 1) {
      const ca = 1 - co;
      // tube extrudes left → right
      const tp = ep(t, c2 - 0.55, 0.9, 'inOutCubic');
      const lift = 120 * (1 - ep(t, c2 + 1.15, 0.9, 'inOutCubic'));   // «2 м» first holds centre stage, then makes room
      const tubeY = TUBE.y + lift - 50 * co;
      if (tp > 0) {
        const cx = lerp(TUBE.x0 - 20, TUBE.x1 + 30, tp);
        sleeve(ctx, L, TUBE.x0, TUBE.x1, tubeY, TUBE.R, TUBE.r, { e: 0.3, rot: t * 0.25, alpha: ca, clipX: cx, shadow: true });
      }
      // dimension line «2 м»
      const dp = ep(t, c2 - 0.3, 0.75, 'inOutCubic');
      if (dp > 0) L.save(ctx, () => {
        ctx.globalAlpha *= ca;
        const y = DIM_Y + lift - 50 * co, mid = 960, half = (TUBE.x1 - TUBE.x0) / 2, gapH = 150;
        ctx.strokeStyle = L.rgba('#CFE3F7', 0.75); ctx.fillStyle = L.rgba(C.brandHi, 0.95); ctx.lineWidth = 2.5;
        // extension lines
        ctx.save(); ctx.setLineDash([6, 6]); ctx.globalAlpha *= clamp(dp * 2);
        ctx.beginPath(); ctx.moveTo(TUBE.x0, tubeY + TUBE.R + 14); ctx.lineTo(TUBE.x0, y + 24); ctx.moveTo(TUBE.x1, tubeY + TUBE.R + 14); ctx.lineTo(TUBE.x1, y + 24); ctx.stroke(); ctx.restore();
        const ext = half * dp;
        if (ext > gapH) { ctx.beginPath(); ctx.moveTo(mid - gapH, y); ctx.lineTo(mid - ext, y); ctx.moveTo(mid + gapH, y); ctx.lineTo(mid + ext, y); ctx.stroke(); }
        if (dp > 0.98) { arrowHead(ctx, TUBE.x0, y, -1, 20); arrowHead(ctx, TUBE.x1, y, 1, 20); }
        const lp = ep(t, c2 - 0.35, 0.7, 'outCubic');
        L.save(ctx, () => { ctx.beginPath(); ctx.rect(mid - 200, y - 80, 400, 130); ctx.clip(); L.text(ctx, '2 м', mid, y + 30 + (1 - lp) * 70, { role: 'display', size: 84, color: C.white, align: 'center', alpha: clamp(lp * 1.4) }); });
      });
      // rings, bottom-aligned, growing small → large
      const r0 = c2 + 1.55, rStep = 0.3;                                    // ring i starts at r0 + i·rStep
      const fl = ep(t, r0 - 0.35, 0.8, 'inOutCubic');
      L.save(ctx, () => {
        ctx.globalAlpha *= ca;
        if (fl > 0) { ctx.strokeStyle = L.rgba('#CFE3F7', 0.35); ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(RINGS.x0 - 20, RINGS.floor + 1); ctx.lineTo(lerp(RINGS.x0 - 20, 1290, fl), RINGS.floor + 1); ctx.stroke(); ctx.setLineDash([]); }
        let x = RINGS.x0;
        RINGS.d.forEach((dm, i) => {
          const ro = (dm + 2 * RINGS.wall) * RINGS.scale / 2, ri = dm * RINGS.scale / 2;
          const rp = ep(t, r0 + i * rStep, 0.6, 'outBack');
          const k = Math.max(0, rp);
          if (k > 0.001) foamRing(ctx, L, x + ro, RINGS.floor - ro * k, ri * k, ro * k, { alpha: clamp(rp * 2) });
          x += ro * 2 + RINGS.gap;
        });
      });
      // counter «Ø 15–114 мм», tracking the ring that is growing
      const sp = ep(t, r0 - 0.2, 0.6, 'outCubic');
      if (sp > 0) {
        const D = RINGS.d, idx = clamp((t - r0 - 0.12) / rStep, 0, D.length - 1);
        const i0 = Math.floor(idx), f = ease.inOutSine(idx - i0);
        const n = Math.round(lerp(D[i0], D[Math.min(D.length - 1, i0 + 1)], f));
        const val = n > 15 ? 'Ø 15–' + n : 'Ø 15';
        L.save(ctx, () => {
          ctx.globalAlpha *= ca * clamp(sp * 1.4);
          const y = COUNTER.y + (1 - sp) * 40;
          const vw = L.text(ctx, val, COUNTER.x, y, { role: 'display', size: COUNTER.size, color: C.white });
          L.text(ctx, 'мм', COUNTER.x + vw + 16, y, { role: 'displaySemi', size: 30, color: C.brandHi });
        });
      }
    }

    // ============================================================ BEAT D (wall thickness)
    const dOutP = ep(t, dOut, 0.6, 'inOutCubic');
    if (t > c3 - 0.6 && dOutP < 1) {
      const da = 1 - dOutP;
      const ti = ep(t, c3 - 0.4, 0.8, 'outCubic');
      const thk = SEC.mm.map((_, i) => [0.62, 0.98, 1.5, 2.33][i]).map(o => c3 + o);
      // section centres
      const outs = SEC.mm.map(mm => SEC.rIn + mm * SEC.k);
      const total = outs.reduce((s, r) => s + 2 * r, 0) + SEC.gap * (outs.length - 1);
      let x = 960 - total / 2; const cxs = outs.map(r => { const c = x + r; x += 2 * r + SEC.gap; return c; });
      // title
      L.save(ctx, () => {
        ctx.globalAlpha *= da;
        const y = 236 - 30 * dOutP;
        L.text(ctx, 'Товщина стінки', 960, y + (1 - ti) * 24, { role: 'bodyBold', size: 44, color: C.brandHi, align: 'center', alpha: clamp(ti * 1.4), letterSpacing: 1 });
        // numbers row «6 · 9 · 13 · 20 мм», each number above its section
        const np = ep(t, c3 - 0.15, 0.8, 'outCubic');
        const ny = 392 - 30 * dOutP + (1 - np) * 30;
        const lit = thk.map(tt => ep(t, tt - 0.05, 0.35, 'outCubic'));
        SEC.mm.forEach((mm, i) => {
          const col = L.mixColor('#6F8098', C.brandHi, lit[i]);
          const after = i < 3 ? ep(t, thk[i + 1] - 0.05, 0.5) : 0;
          const colF = L.mixColor(col, C.white, after);
          L.text(ctx, String(mm), cxs[i], ny, { role: 'display', size: 88, color: colF, align: 'center', alpha: clamp(np * 1.4) });
          if (i < 3) L.text(ctx, '·', (cxs[i] + cxs[i + 1]) / 2, ny, { role: 'display', size: 88, color: L.rgba('#CFE3F7', 0.55), align: 'center', alpha: clamp(np * 1.4) });
        });
        const w20 = L.measure(ctx, '20', 'display', 88);
        L.text(ctx, 'мм', cxs[3] + w20 / 2 + 22, ny, { role: 'display', size: 88, color: C.white, alpha: clamp(np * 1.4) });
      });
      // sections
      SEC.mm.forEach((mm, i) => {
        const ap = ep(t, c3 - 0.35 + i * 0.08, 0.7, 'outCubic');
        if (ap <= 0) return;
        const g = ep(t, thk[i], 0.55, 'outBack');
        const wall = lerp(2, mm, g) * SEC.k;
        const sc = lerp(0.8, 1, ap) * lerp(1, 0.85, dOutP);
        const cy = SEC.y + (1 - ap) * 30 + 20 * dOutP;
        const act = clamp(1 - Math.abs(t - thk[i] - 0.4) / 0.7);
        L.at(ctx, { x: cxs[i], y: cy, scale: sc, alpha: clamp(ap * 1.5) * da }, () => {
          foamRing(ctx, L, 0, 0, SEC.rIn, SEC.rIn + wall, { glow: act * 0.8, hl: act });
          // steel pipe inside
          ctx.beginPath(); ctx.arc(0, 0, SEC.rIn - 4, 0, Math.PI * 2);
          const mg = ctx.createLinearGradient(-SEC.rIn, -SEC.rIn, SEC.rIn, SEC.rIn); mg.addColorStop(0, '#E4EAF1'); mg.addColorStop(1, '#6E7A88'); ctx.fillStyle = mg; ctx.fill();
          ctx.beginPath(); ctx.arc(0, 0, SEC.rIn - 13, 0, Math.PI * 2); ctx.fillStyle = '#0E1622'; ctx.fill();
          // wall dimension marker (blueprint)
          if (g > 0.05) {
            const a = -Math.PI / 4, r0 = SEC.rIn, r1 = SEC.rIn + wall;
            ctx.strokeStyle = L.rgba(C.brandHi, 0.95 * clamp(g * 2)); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 3;
            const ux = Math.cos(a), uy = Math.sin(a);
            ctx.beginPath(); ctx.moveTo(ux * r0, uy * r0); ctx.lineTo(ux * r1, uy * r1); ctx.stroke();
            const tk = (rr) => { ctx.beginPath(); ctx.moveTo(ux * rr - uy * 9, uy * rr + ux * 9); ctx.lineTo(ux * rr + uy * 9, uy * rr - ux * 9); ctx.stroke(); };
            tk(r0); tk(r1);
          }
        });
      });
    }

    // ============================================================ BEAT E (other sizes on request + house emblem)
    const pp = ep(t, plateA, 0.8, 'outCubic');
    if (pp > 0) {
      const e = pp;
      L.at(ctx, { x: (1 - e) * -40, alpha: clamp(pp * 1.5) }, () => {
        L.panel(ctx, PLATE.x, PLATE.y, PLATE.w, PLATE.h, { r: 26, fill: 'rgba(10,30,56,0.78)', stroke: L.rgba(C.brandHi, 0.45), accent: C.brandHi });
        const ix = PLATE.x + 104, iy = PLATE.y + PLATE.h / 2;
        ctx.beginPath(); ctx.arc(ix, iy, 62, 0, Math.PI * 2); ctx.fillStyle = L.rgba(C.brand, 0.2); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = L.rgba(C.brandHi, 0.8); ctx.stroke();
        const open = 0.45 + 0.35 * Math.sin(t * 1.3);
        caliperIcon(ctx, L, ix + 2, iy + 2, 98, C.white, open);
        const tx = PLATE.x + 192;
        L.revealText(ctx, 'Інші розміри —', tx, iy - 16, clamp(pp * 1.3 - 0.1), { role: 'displaySemi', size: 48, maxWidth: 620, stagger: 0.2 });
        L.revealText(ctx, 'під замовлення', tx, iy + 48, clamp(pp * 1.3 - 0.3), { role: 'displaySemi', size: 48, maxWidth: 620, color: C.brandHi, stagger: 0.2 });
      });
    }
    // running motif: house emblem, first window lights up
    const ha = ep(t, houseA, 0.7, 'outCubic');
    if (ha > 0) {
      const w1 = ep(t, winA, 0.45, 'outCubic');
      const pop = Math.sin(Math.PI * prog(t, winA - 0.05, 0.6)) * 0.07;
      L.at(ctx, { x: 148, y: 150 + (1 - ha) * 16, scale: 1 + pop }, () => houseIcon(ctx, L, 0, 0, ha, w1));
      if (w1 > 0 && w1 < 1) L.save(ctx, () => { ctx.strokeStyle = L.rgba(C.amber, 0.8 * (1 - w1)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(148 - 23, 150 - 44, 10 + 40 * w1, 0, Math.PI * 2); ctx.stroke(); });
    }

    L.vignette(ctx, 0.42);
  },
};
