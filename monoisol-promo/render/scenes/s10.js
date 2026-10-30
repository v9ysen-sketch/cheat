'use strict';
// Scene 10 — «Заклик до дії та слоган» (global 162.33–174.07 s, 11.73 s)
// Beat 0 (cue 0, 0.63 s): the warm, snowy village of scene 1 mirrored. A 1-second thermal look shows sparks of heat
//   circling INSIDE the houses (none leaking), then the camera pushes into the same window as scene 1 (white trim,
//   icicles, curtains, candle); the frost melts edges→centre, the icicles melt, the curtains part and the casements
//   swing open into the warm room.
//   On screen: «Для тих, кого любите».
// Beat 1 (cue 1, 3.90 s): the window becomes a frame with a warm amber interior, blurred collage panels drift left and
//   right, a big rounded «monoisol.com» button builds and types, a press wave runs through it, then it pulses softly.
//   Contacts with line icons below (shown, not voiced).
// Beat 2 (cue 2, 7.67 s): warm sparks gather above the button into the logo silhouette → real MONOISOL logo,
//   «Тепло, яке залишається вдома» types underneath. Address + contacts stay to the end; the frame slides out.

const TAU = Math.PI * 2;
const sstep = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// ---------------------------------------------------------------- world layout (z = 1 view, 1920x1080 units)
const HERO = { x: 900, y: 872, s: 1.1, hw: 120, wh: 160, gh: 96, dx: 124, dy: -52, hero: true };
const HOUSES = [
  // back row
  { x: 150, y: 742, s: 0.42 }, { x: 430, y: 738, s: 0.40 }, { x: 1335, y: 740, s: 0.42 }, { x: 1600, y: 745, s: 0.44 }, { x: 1830, y: 738, s: 0.38 },
  // middle row
  { x: 245, y: 806, s: 0.62 }, { x: 585, y: 812, s: 0.60 }, { x: 1440, y: 810, s: 0.64 }, { x: 1735, y: 818, s: 0.66 },
].map(h => ({ hw: 100, wh: 128, gh: 80, dx: 110, dy: -46, ...h }));
const PINES = [
  { x: 60, y: 870, s: 1.05 }, { x: 395, y: 832, s: 0.72 }, { x: 700, y: 846, s: 0.78 }, { x: 1255, y: 850, s: 0.86 },
  { x: 1585, y: 842, s: 0.74 }, { x: 1880, y: 884, s: 1.1 }, { x: 1080, y: 760, s: 0.42 }, { x: 760, y: 752, s: 0.38 },
];
// hero window (house-local units, origin = bottom centre of the front face). Same window as scene 1: left of centre
// with the brown door on the right, white trim, lintel with snow + icicles, 2×2 sash, curtains and a candle on a bright
// amber glass (a wider sash than in scene 1 so it can become the 16:9 frame of beat 1).
const WL = { x: -100, y: -128, w: 104, h: 57 }, MUL = 3;
const DOORL = { x: 34, y: -100, w: 46, h: 100 };
const TRIM = '#DCE6F1';
// glass of the hero window (world units)
const GW = WL.w * HERO.s, GH = WL.h * HERO.s;
const GX = HERO.x + (WL.x + WL.w / 2) * HERO.s, GY = HERO.y + (WL.y + WL.h / 2) * HERO.s;
const GLASS_FINAL_W = 1760; // glass width on screen when the window has become the frame
const Z_END = GLASS_FINAL_W / GW;

// ---------------------------------------------------------------- lazy caches
let K = null;
function init(L) {
  if (K) return K;
  K = {};
  // spark sprite (warm)
  const sp = L.offscreen(64, 64), sx = sp.getContext('2d');
  const g = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,252,240,1)'); g.addColorStop(0.18, 'rgba(255,214,140,0.95)');
  g.addColorStop(0.45, 'rgba(255,150,60,0.35)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  sx.fillStyle = g; sx.fillRect(0, 0, 64, 64); K.spark = sp;
  // cold glint sprite (snow sparkle)
  const gl = L.offscreen(32, 32), gx = gl.getContext('2d');
  const g2 = gx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g2.addColorStop(0, 'rgba(255,255,255,1)'); g2.addColorStop(0.3, 'rgba(220,240,255,0.5)'); g2.addColorStop(1, 'rgba(200,230,255,0)');
  gx.fillStyle = g2; gx.fillRect(0, 0, 32, 32); K.glint = gl;
  // soft warm bokeh disc
  const bk = L.offscreen(128, 128), bx = bk.getContext('2d');
  const g3 = bx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g3.addColorStop(0, 'rgba(255,196,120,0.10)'); g3.addColorStop(0.75, 'rgba(255,196,120,0.08)'); g3.addColorStop(0.9, 'rgba(255,210,150,0.10)'); g3.addColorStop(1, 'rgba(255,196,120,0)');
  bx.fillStyle = g3; bx.fillRect(0, 0, 128, 128); K.bokeh = bk;

  // logo silhouette + target points for the spark gathering
  const LW = 640, LH = Math.round(LW * L.img('logo_hd.png').height / L.img('logo_hd.png').width);
  const lc = L.offscreen(LW, LH), lx = lc.getContext('2d');
  lx.drawImage(L.img('logo_hd.png'), 0, 0, LW, LH);
  const data = lx.getImageData(0, 0, LW, LH).data;
  const pts = [];
  for (let y = 1; y < LH; y += 3) for (let x = 1; x < LW; x += 3) if (data[(y * LW + x) * 4 + 3] > 150) pts.push([x - LW / 2, y - LH / 2]);
  const r = L.rng(4242);
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  K.logoPts = pts.slice(0, 340);
  lx.globalCompositeOperation = 'source-in';
  const lg = lx.createLinearGradient(0, 0, LW, LH); lg.addColorStop(0, '#FFE9C4'); lg.addColorStop(0.5, '#FFC46B'); lg.addColorStop(1, '#FFD9A0');
  lx.fillStyle = lg; lx.fillRect(0, 0, LW, LH);
  K.logoSil = lc; K.LW = LW; K.LH = LH;
  // sparks: start spread over the interior (mostly below), curved flight to a logo point
  K.sparks = K.logoPts.map(([px, py], i) => {
    const a = r(), b = r(), c = r(), dd = r(), e = r();
    return {
      px, py,
      sx: 160 + a * 1600, sy: 300 + b * 700,
      bend: (c - 0.5) * 520,
      t0: 6.75 + dd * 0.55 + (Math.abs(px) / 320) * 0.12,
      dur: 0.75 + e * 0.4,
      size: 10 + r() * 16, ph: r() * TAU,
    };
  });

  // collage side panels: blurred, feathered towards the centre (side ovals only, central logos stay out of frame)
  const mkPanel = (name, sx0, side) => {
    const src = L.blurred(name, 8), sw = 322, sy0 = 22, sh = 576, k = 1.34;
    const w = Math.round(sw * k), h = Math.round(sh * k);
    const c = L.offscreen(w, h), x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(src, sx0, sy0, sw, sh, 0, 0, w, h);
    x.globalCompositeOperation = 'destination-in';
    const hgz = side === 'L' ? x.createLinearGradient(0, 0, w, 0) : x.createLinearGradient(w, 0, 0, 0);
    hgz.addColorStop(0, 'rgba(0,0,0,1)'); hgz.addColorStop(0.62, 'rgba(0,0,0,1)'); hgz.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = hgz; x.fillRect(0, 0, w, h);
    const vg = x.createLinearGradient(0, 0, 0, h);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.08, 'rgba(0,0,0,1)'); vg.addColorStop(0.92, 'rgba(0,0,0,1)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = vg; x.fillRect(0, 0, w, h);
    return c;
  };
  K.panelL = mkPanel('collage_1', 0, 'L');
  K.panelR = mkPanel('collage_2', 678, 'R');

  // frost pattern (aspect space: x in [0, A], y in [0, 1]) bucketed by distance-to-edge for the melt
  K.frost = buildFrost(L);

  // glints on the snow (world coords)
  const rg = L.rng(77);
  K.glints = Array.from({ length: 70 }, () => ({ x: rg() * 1920, y: 850 + rg() * 220, ph: rg() * TAU, sp: 1.2 + rg() * 2.2, s: 10 + rg() * 16 }));
  // roof glints are generated per house
  K.roofGlints = [...HOUSES, HERO].map((h, i) => { const rr = L.rng(300 + i); return Array.from({ length: 4 }, () => ({ u: rr(), v: 0.1 + rr() * 0.8, ph: rr() * TAU, sp: 1 + rr() * 2 })); });
  // stars
  const rs = L.rng(91);
  K.stars = Array.from({ length: 90 }, () => ({ x: rs() * 1920, y: rs() * 560, r: 0.6 + rs() * 1.6, ph: rs() * TAU, sp: 0.6 + rs() * 1.8 }));
  // icons (Feather, MIT) as Path2D in a 24-unit box
  K.icoMail = [new L.Path2D('M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'), new L.Path2D('M22 6l-10 7L2 6')];
  K.icoPhone = [new L.Path2D('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z')];
  return K;
}

// fern-like frost crystals growing inward from each pane's edges (the same crystal language as scene 1), in glass-local
// units [0, WL.w] × [0, WL.h]. Each segment keeps its growth parameter b (0 at the edge root → 1 at the deepest tip),
// so the melt can retract every crystal from its root at the edge towards its tip in the centre.
function buildFrost(L) {
  const r = L.rng(1010), segs = [];
  const pw = (WL.w - MUL) / 2, ph = (WL.h - MUL) / 2;
  const panes = [[0, 0], [pw + MUL, 0], [0, ph + MUL], [pw + MUL, ph + MUL]].map(([x, y]) => ({ x, y, w: pw, h: ph }));
  const o = { step: 0.85, len: 10, reach: 15 };
  for (const { x, y, w, h } of panes) {
    const inside = (px, py) => px > x + 0.15 && px < x + w - 0.15 && py > y + 0.15 && py < y + h - 0.15;
    const grow = (px, py, ang, len, depth, b) => {
      const step = depth === 0 ? o.step : o.step * 0.72, n = Math.max(1, Math.round(len / step));
      let side = r() < 0.5 ? 1 : -1;
      for (let i = 0; i < n; i++) {
        ang += (r() - 0.5) * 0.28;
        const nx = px + Math.cos(ang) * step, ny = py + Math.sin(ang) * step;
        if (!inside(nx, ny)) return;
        const b1 = b + step / o.reach;
        segs.push([px, py, nx, ny, b, b1, depth]);
        if (depth < 2 && i % 2 === 1 && i < n - 1 && (depth === 0 || r() < 0.55)) {
          side = -side;
          const cl = len * (0.3 + r() * 0.14) * (1 - (i / n) * 0.55);
          grow(nx, ny, ang + side * (0.95 + r() * 0.25), cl, depth + 1, b1);
          if (depth === 0 && r() < 0.4) grow(nx, ny, ang - side * (0.95 + r() * 0.25), cl * 0.8, depth + 1, b1);
        }
        px = nx; py = ny; b = b1;
      }
    };
    const corners = [[x, y, Math.PI / 4], [x + w, y, Math.PI * 3 / 4], [x, y + h, -Math.PI / 4], [x + w, y + h, -Math.PI * 3 / 4]];
    for (const [cx, cy, a] of corners) for (let k = 0; k < 3; k++) {
      const aa = a + (k - 1) * 0.42 + (r() - 0.5) * 0.2;
      grow(cx + Math.cos(aa) * 0.5, cy + Math.sin(aa) * 0.5, aa, o.len * (0.85 + r() * 0.5), 0, r() * 0.05);
    }
    const edges = [[x, y, w, 0, Math.PI / 2], [x, y + h, w, 0, -Math.PI / 2], [x, y, 0, h, 0], [x + w, y, 0, h, Math.PI]];
    for (const [ex, ey, ew, eh, nrm] of edges) {
      const ns = Math.max(2, Math.round((ew + eh) / 9));
      for (let k = 0; k < ns; k++) {
        const u = (k + 0.5 + (r() - 0.5) * 0.7) / ns, mid = 1 - Math.abs(u - 0.5) * 2;
        const px = ex + ew * u + Math.cos(nrm) * 0.4, py = ey + eh * u + Math.sin(nrm) * 0.4;
        grow(px, py, nrm + (r() - 0.5) * 1.1, o.len * (0.45 + r() * 0.55), 0, 0.06 + r() * 0.2 + mid * 0.12);
      }
    }
  }
  let mx = 0; for (const s of segs) mx = Math.max(mx, s[5]);
  const batches = [[], [], []];
  for (const s of segs) { s[4] /= mx; s[5] /= mx; batches[s[6]].push(s); }
  return { panes, batches, count: segs.length };
}

// ---------------------------------------------------------------- camera
const Z0 = 1.2, F0X = 960, F0Y = 610;
function camera(L, t) {
  const e = L.ease.inOutCubic(L.prog(t, 0.6, 3.2));
  const drift = 1 + 0.02 * sstep(-0.6, 0.9, t);
  let z = Z0 * Math.pow(Z_END / 1.02 / Z0, e) * drift;
  const offX = (1 - e) * Z0 * (GX - F0X - 24 * sstep(-0.6, 0.9, t)), offY = (1 - e) * Z0 * (GY - F0Y);
  const fx = GX - offX / z, fy = GY - offY / z;
  const push = 1 + 0.018 * L.prog(t, 3.8, 3.2) + 0.13 * L.ease.inOutCubic(L.prog(t, 7.0, 2.8)) + 0.006 * Math.max(0, t - 9.8);
  return { z: z * push, fx, fy, e };
}
const toScreen = (cam, x, y) => [960 + cam.z * (x - cam.fx), 540 + cam.z * (y - cam.fy)];

// ---------------------------------------------------------------- drawing helpers: world
function sky(ctx, L, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 1080);
  g.addColorStop(0, '#040B18'); g.addColorStop(0.45, '#0B2240'); g.addColorStop(0.75, '#173B63'); g.addColorStop(1, '#22476E');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  // warm horizon breath + moon
  L.glow(ctx, 960, 760, 1100, '#FF9A4A', 0.10);
  L.glow(ctx, 1712, 150, 240, '#DDEBFF', 0.16);
  ctx.fillStyle = 'rgba(236,244,255,0.9)'; ctx.beginPath(); ctx.arc(1712, 150, 30, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(11,34,64,0.9)'; ctx.beginPath(); ctx.arc(1724, 143, 26, 0, TAU); ctx.fill();
  for (const s of K.stars) {
    const a = 0.25 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin(t * s.sp + s.ph), 3);
    ctx.fillStyle = `rgba(230,242,255,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
  }
}

function hills(ctx, L, base, amp, freq, seed, top, bottom, snowCap) {
  ctx.beginPath(); ctx.moveTo(-400, 1400);
  for (let x = -400; x <= 2320; x += 40) ctx.lineTo(x, base + L.noise1(x * freq, seed) * amp + Math.sin(x * freq * 0.37 + seed) * amp * 0.6);
  ctx.lineTo(2320, 1400); ctx.closePath();
  const g = ctx.createLinearGradient(0, base - amp * 1.6, 0, base + 160); g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fill();
  if (snowCap) { ctx.strokeStyle = snowCap; ctx.lineWidth = 3; ctx.stroke(); }
}

function pine(ctx, L, p) {
  L.at(ctx, { x: p.x, y: p.y, scale: p.s }, () => {
    ctx.fillStyle = '#3A2A20'; ctx.fillRect(-7, -16, 14, 18);
    for (let k = 0; k < 3; k++) {
      const yb = -14 - k * 46, w = 70 - k * 16, h = 78 - k * 8;
      ctx.beginPath(); ctx.moveTo(-w, yb); ctx.lineTo(0, yb - h); ctx.lineTo(w, yb); ctx.closePath();
      ctx.fillStyle = k === 0 ? '#12304A' : '#163A57'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-w * 0.9, yb - 3); ctx.lineTo(-w * 0.5, yb - h * 0.42); ctx.lineTo(0, yb - h + 2); ctx.lineTo(w * 0.2, yb - h * 0.62); ctx.lineTo(w * 0.85, yb - 6);
      ctx.quadraticCurveTo(w * 0.3, yb - h * 0.3, -w * 0.9, yb - 3); ctx.fillStyle = 'rgba(226,238,250,0.85)'; ctx.fill();
    }
  });
}

// window on the side wall as parallelogram
function sideWindow(ctx, L, h, u0, u1, v0, v1, lit) {
  const P = (u, v) => [h.hw + h.dx * u, h.dy * u - v];
  const pts = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  const [cx, cy] = P((u0 + u1) / 2, (v0 + v1) / 2);
  const g = ctx.createLinearGradient(0, cy - (v1 - v0), 0, cy + (v1 - v0));
  g.addColorStop(0, L.mixColor('#FFD48A', '#FFE9C2', 0.3)); g.addColorStop(1, '#FF9E42');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#E9E2D6'; ctx.lineWidth = 4; ctx.stroke();
  const [ax, ay] = P((u0 + u1) / 2, v0), [bx, by] = P((u0 + u1) / 2, v1);
  const [lx, ly] = P(u0, (v0 + v1) / 2), [rx, ry] = P(u1, (v0 + v1) / 2);
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
  return [cx, cy];
}

function frontWindow(ctx, L, x, y, w, h) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#FFE0A3'); g.addColorStop(1, '#FF9E42');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ECE5DA'; ctx.lineWidth = 5; ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  ctx.fillStyle = 'rgba(240,248,255,0.95)'; L.roundRect(ctx, x - 6, y + h + 1, w + 12, 7, 3); ctx.fill();
}

// house polygon pieces (local coords)
function housePieces(h) {
  const { hw, wh, gh, dx, dy } = h;
  return {
    side: [[hw, 0], [hw + dx, dy], [hw + dx, -wh + dy], [hw, -wh]],
    roof: [[0, -wh - gh], [dx, -wh - gh + dy], [hw * 1.13 + dx, -wh + gh * 0.13 + dy], [hw * 1.13, -wh + gh * 0.13]],
    front: [[-hw, 0], [hw, 0], [hw, -wh], [0, -wh - gh], [-hw, -wh]],
  };
}
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); };

function drawHouse(ctx, L, h, t, idx) {
  const { hw, wh, gh, dx, dy } = h, P = housePieces(h);
  L.at(ctx, { x: h.x, y: h.y, scale: h.s }, () => {
    // warm spill on the snow in front
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    L.glow(ctx, hw * 0.6, 14, hw * 2.4, '#FF9A40', 0.16); ctx.restore();
    // side wall
    poly(ctx, P.side);
    const sg = ctx.createLinearGradient(hw, 0, hw + dx, 0); sg.addColorStop(0, '#22385A'); sg.addColorStop(1, '#1A2C49');
    ctx.fillStyle = sg; ctx.fill();
    const lights = [];
    lights.push(sideWindow(ctx, L, h, 0.2, 0.44, wh * 0.36, wh * 0.68));
    lights.push(sideWindow(ctx, L, h, 0.58, 0.82, wh * 0.36, wh * 0.68));
    // chimney (behind the ridge snow, on the far part of the roof)
    const cb = [hw * 0.42 + dx * 0.62, -wh - gh + gh * 0.42 + dy * 0.62];
    ctx.fillStyle = '#2A3346'; ctx.fillRect(cb[0] - 13, cb[1] - 52, 26, 60);
    ctx.fillStyle = '#3A455C'; ctx.fillRect(cb[0] - 13, cb[1] - 52, 9, 60);
    ctx.fillStyle = '#EEF4FB'; L.roundRect(ctx, cb[0] - 17, cb[1] - 60, 34, 11, 5); ctx.fill();
    // smoke
    for (let k = 0; k < 5; k++) {
      const ph = ((t * 0.28 + k / 5 + idx * 0.13) % 1);
      const sx = cb[0] + Math.sin(ph * 5 + idx) * 10 + ph * 46, sy = cb[1] - 66 - ph * 130;
      ctx.fillStyle = `rgba(190,205,225,${(0.16 * Math.sin(Math.PI * ph)).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(sx, sy, 10 + ph * 26, 0, TAU); ctx.fill();
    }
    // roof (snow covered)
    poly(ctx, P.roof);
    const rg = ctx.createLinearGradient(0, -wh - gh, hw, -wh); rg.addColorStop(0, '#F4F8FD'); rg.addColorStop(1, '#BFD0E4');
    ctx.fillStyle = rg; ctx.fill();
    ctx.strokeStyle = 'rgba(30,48,74,0.9)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(hw * 1.13, -wh + gh * 0.13 + 3); ctx.lineTo(hw * 1.13 + dx, -wh + gh * 0.13 + dy + 3); ctx.stroke();
    // icicle-free soft snow lip along the eave
    ctx.strokeStyle = 'rgba(244,249,255,0.95)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hw * 1.13, -wh + gh * 0.13); ctx.lineTo(hw * 1.13 + dx, -wh + gh * 0.13 + dy); ctx.stroke();
    // front gable
    poly(ctx, P.front);
    const fg = ctx.createLinearGradient(0, -wh - gh, 0, 0); fg.addColorStop(0, '#3A5478'); fg.addColorStop(1, '#2A4163');
    ctx.fillStyle = fg; ctx.fill();
    // horizontal siding boards
    ctx.save(); poly(ctx, P.front); ctx.clip();
    ctx.strokeStyle = 'rgba(10,22,40,0.22)'; ctx.lineWidth = h.hero ? 0.45 : 0.8;
    ctx.beginPath(); for (let yy = -8; yy > -wh - gh; yy -= (h.hero ? 11 : 14)) { ctx.moveTo(-hw, yy); ctx.lineTo(hw, yy); } ctx.stroke();
    ctx.restore();
    // warm light wash on the front wall from inside
    ctx.save(); poly(ctx, P.front); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    L.glow(ctx, 0, -wh * 0.55, hw * 1.5, '#FF9A40', 0.12); ctx.restore();
    // gable trim + snow band
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1B2A40'; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(-hw * 1.13, -wh + gh * 0.13); ctx.lineTo(0, -wh - gh - 3); ctx.lineTo(hw * 1.13, -wh + gh * 0.13); ctx.stroke();
    ctx.strokeStyle = '#F2F7FD'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(-hw * 1.13, -wh + gh * 0.13 - 6); ctx.lineTo(0, -wh - gh - 9); ctx.lineTo(hw * 1.13, -wh + gh * 0.13 - 6); ctx.stroke();
    // front window(s) / door
    if (!h.hero) {
      frontWindow(ctx, L, -hw * 0.62, -wh * 0.7, hw * 0.5, wh * 0.36);
      lights.push([-hw * 0.37, -wh * 0.52]);
      ctx.fillStyle = '#5A3C2A'; ctx.fillRect(hw * 0.18, -wh * 0.62, hw * 0.42, wh * 0.62);
      ctx.fillStyle = '#FFB547'; ctx.beginPath(); ctx.arc(hw * 0.52, -wh * 0.3, 3.5, 0, TAU); ctx.fill();
      // attic window
      ctx.fillStyle = '#FFC266'; ctx.beginPath(); ctx.arc(0, -wh - gh * 0.42, 12, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ECE5DA'; ctx.lineWidth = 4; ctx.stroke();
    } else {
      // hero (scene 1's house): brown door with a lit pane on the right, round lit attic window; the picture window
      // itself is drawn in screen space (heroWindow) so it stays crisp at any zoom
      const d = DOORL;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; L.glow(ctx, d.x + d.w / 2, -1, 30, '#FFB547', 0.18); ctx.restore();
      ctx.fillStyle = '#D5E0EC'; ctx.fillRect(d.x - 4, d.y - 4, d.w + 8, d.h + 4);
      ctx.fillStyle = '#5A3E31'; ctx.fillRect(d.x, d.y, d.w, d.h);
      const dg = ctx.createLinearGradient(d.x, 0, d.x + d.w, 0); dg.addColorStop(0, 'rgba(255,255,255,0.06)'); dg.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = dg; ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1.2;
      for (const yy of [38, 69]) { ctx.strokeRect(d.x + 6, d.y + yy, d.w / 2 - 9, 24); ctx.strokeRect(d.x + d.w / 2 + 3, d.y + yy, d.w / 2 - 9, 24); }
      ctx.fillStyle = '#FFC468'; ctx.fillRect(d.x + 8, d.y + 8, d.w - 16, 21);
      ctx.strokeStyle = '#D5E0EC'; ctx.lineWidth = 2; ctx.strokeRect(d.x + 8, d.y + 8, d.w - 16, 21);
      ctx.beginPath(); ctx.moveTo(d.x + d.w / 2, d.y + 8); ctx.lineTo(d.x + d.w / 2, d.y + 29); ctx.stroke();
      ctx.fillStyle = '#E8B04A'; ctx.beginPath(); ctx.arc(d.x + d.w - 7, d.y + 56, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,100,0.9)'; ctx.fillRect(d.x + 1, -1.8, d.w - 2, 1.2);
      lights.push([d.x + d.w / 2, d.y + 18]);
      // round attic window with a cross
      const ay = -wh - gh * 0.4;
      ctx.fillStyle = '#FFC468'; ctx.beginPath(); ctx.arc(0, ay, 12, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#D5E0EC'; ctx.lineWidth = 3; ctx.stroke();
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-12, ay); ctx.lineTo(12, ay); ctx.moveTo(0, ay - 12); ctx.lineTo(0, ay + 12); ctx.stroke();
      lights.push([0, ay]);
    }
    // snow drift at the base
    ctx.fillStyle = '#DCE7F3';
    ctx.beginPath(); ctx.ellipse(hw * 0.2, 4, hw * 1.35, 12, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hw + dx * 0.55, dy * 0.5 + 6, dx * 0.7, 9, Math.atan2(dy, dx), 0, TAU); ctx.fill();
    // window glows
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [lx, ly] of lights) L.glow(ctx, lx, ly, 70, '#FFB050', 0.30 + 0.05 * Math.sin(t * 2 + lx));
    ctx.restore();
  });
}

// heat inside a house for the thermal look (world transform already applied)
function thermalHouse(ctx, L, h, t, k, idx) {
  const P = housePieces(h), { hw, wh, gh, dx, dy } = h;
  L.at(ctx, { x: h.x, y: h.y, scale: h.s }, () => {
    const cx = hw * 0.55 + dx * 0.3, cy = -wh * 0.48 + dy * 0.4;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, hw * 1.55);
    g.addColorStop(0, '#FFF6C8'); g.addColorStop(0.22, '#FFD24A'); g.addColorStop(0.45, '#FF7A1F'); g.addColorStop(0.7, '#C2185B'); g.addColorStop(1, '#4A1470');
    ctx.save(); ctx.globalAlpha *= k;
    ctx.fillStyle = g;
    for (const pc of [P.side, P.roof, P.front]) { poly(ctx, pc); ctx.fill(); }
    // cold outline: no leaks
    ctx.strokeStyle = 'rgba(80,40,160,0.9)'; ctx.lineWidth = 6;
    for (const pc of [P.side, P.roof, P.front]) { poly(ctx, pc); ctx.stroke(); }
    // sparks circling inside, clipped to the house
    ctx.beginPath(); for (const pc of [P.side, P.roof, P.front]) pc.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const a = t * (1.1 + (i % 3) * 0.35) + i * 0.7 + idx;
      const rx = hw * (0.35 + 0.08 * (i % 4)), ry = wh * (0.22 + 0.05 * (i % 3));
      const sx = cx + Math.cos(a) * rx, sy = cy + Math.sin(a) * ry;
      const s = 26 + 10 * (i % 3);
      ctx.drawImage(K.spark, sx - s / 2, sy - s / 2, s, s);
    }
    ctx.restore();
  });
}

// ---------------------------------------------------------------- the hero window, drawn in screen space
function glassRect(cam) {
  const [x0, y0] = toScreen(cam, GX - GW / 2, GY - GH / 2), [x1, y1] = toScreen(cam, GX + GW / 2, GY + GH / 2);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function warmInterior(ctx, L, R, t) {
  const g = ctx.createLinearGradient(0, R.y, 0, R.y + R.h);
  g.addColorStop(0, '#2A1108'); g.addColorStop(0.5, '#4E220E'); g.addColorStop(1, '#311409');
  ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
  const cx = R.x + R.w * (0.5 + 0.03 * Math.sin(t * 0.21)), cy = R.y + R.h * 0.6;
  const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R.w * 0.6);
  rg.addColorStop(0, 'rgba(236,140,58,0.78)'); rg.addColorStop(0.4, 'rgba(190,96,38,0.42)'); rg.addColorStop(1, 'rgba(110,44,16,0)');
  ctx.fillStyle = rg; ctx.fillRect(R.x, R.y, R.w, R.h);
  // soft drifting bokeh
  for (let i = 0; i < 7; i++) {
    const u = (0.12 + 0.13 * i + 0.03 * Math.sin(t * 0.17 + i * 1.9)) % 1, v = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(i * 2.3 + t * 0.11));
    const rr = R.w * (0.05 + 0.025 * (i % 3));
    ctx.globalAlpha = 0.55 + 0.25 * (i % 2);
    ctx.drawImage(K.bokeh, R.x + u * R.w - rr, R.y + v * R.h - rr, rr * 2, rr * 2);
    ctx.globalAlpha = 1;
  }
}

function embersIn(ctx, L, R, t, amount) {
  if (amount <= 0.01) return;
  const r = L.rng(515);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const u = r(), v0 = r(), sp = 0.025 + r() * 0.05, ph = r() * TAU, sz = 6 + r() * 14;
    const v = 1 - ((v0 + t * sp) % 1);
    const x = R.x + (u + 0.02 * Math.sin(t * 0.8 + ph)) * R.w, y = R.y + v * R.h;
    const a = amount * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.2 + ph))) * Math.sin(Math.PI * v);
    if (a <= 0.01) continue;
    ctx.globalAlpha = a; ctx.drawImage(K.spark, x - sz / 2, y - sz / 2, sz, sz);
  }
  ctx.restore();
}

// frost: per-pane haze + fern crystals; melt (≤0 full frost … ≥1 clear) clears from the pane edges towards the centre
function drawFrost(ctx, L, R, melt) {
  const F = K.frost; if (melt >= 1.02) return;
  const u = R.w / WL.w, m = Math.max(0, melt);
  ctx.save();
  ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
  ctx.translate(R.x, R.y); ctx.scale(u, u);
  // haze strongest at the pane edges; a soft melt front moves from the edges to the centre
  const hz = 1 - sstep(0.6, 1.0, melt), rm = 1.6 - 1.6 * m;
  if (hz > 0.01) for (const pn of F.panes) {
    ctx.save(); ctx.beginPath(); ctx.rect(pn.x, pn.y, pn.w, pn.h); ctx.clip();
    ctx.translate(pn.x + pn.w / 2, pn.y + pn.h / 2); ctx.scale(pn.w / 2, pn.h / 2);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.5);
    for (let k = 0; k <= 10; k++) {
      const rr = k * 0.15;
      const prof = rr < 0.275 ? 0 : rr < 0.675 ? 0.18 * (rr - 0.275) / 0.4 : 0.18 + 0.54 * (rr - 0.675) / 0.825;
      g.addColorStop(k / 10, `rgba(236,248,255,${(prof * (1 - sstep(rm - 0.32, rm + 0.02, rr)) * hz).toFixed(3)})`);
    }
    ctx.fillStyle = g; ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  // crystals retract from their roots (edges) towards their tips (centre)
  ctx.lineCap = 'round';
  const widths = [0.3, 0.19, 0.13].map(v => Math.max(v, 0.55 / u));
  for (let pass = 0; pass < 2; pass++) {
    for (let d = 0; d < 3; d++) {
      if (pass === 0 && d === 2) continue;
      ctx.beginPath();
      for (const s of F.batches[d]) {
        if (s[5] <= m) continue;
        const f = s[4] >= m ? 0 : (m - s[4]) / (s[5] - s[4]);
        ctx.moveTo(s[0] + (s[2] - s[0]) * f, s[1] + (s[3] - s[1]) * f); ctx.lineTo(s[2], s[3]);
      }
      ctx.lineWidth = widths[d] * (pass === 0 ? 3.6 : 1);
      ctx.strokeStyle = pass === 0 ? 'rgba(180,225,255,0.16)' : 'rgba(248,253,255,0.9)';
      ctx.stroke();
    }
  }
  ctx.restore();
}

// the lit window as seen from outside (scene 1): bright amber glass, curtains, a candle, cool reflections
function brightGlass(ctx, L, R, t, S) {
  const u = R.w / WL.w;
  ctx.save(); ctx.globalAlpha *= S.bright;
  const g = ctx.createLinearGradient(0, R.y, 0, R.y + R.h); g.addColorStop(0, '#FFD592'); g.addColorStop(0.6, '#F7A957'); g.addColorStop(1, '#D9813C');
  ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
  L.glow(ctx, R.x + R.w * 0.6, R.y + R.h * 0.36, R.w * 0.42, '#FFF4D6', 0.8);
  // curtains part outwards as the window opens
  const cop = S.curt, ca = 1 - sstep(0.55, 1, cop);
  if (ca > 0.01) {
    ctx.save(); ctx.globalAlpha *= ca;
    for (const side of [-1, 1]) {
      const cw = R.w * (side < 0 ? 0.17 : 0.13), cx = (side < 0 ? R.x : R.x + R.w) + side * cw * 1.05 * cop;
      ctx.beginPath(); ctx.moveTo(cx, R.y - 1); ctx.lineTo(cx - side * cw, R.y - 1);
      ctx.bezierCurveTo(cx - side * cw * 0.7, R.y + R.h * 0.4, cx - side * cw * 1.1, R.y + R.h * 0.7, cx - side * cw * 0.85, R.y + R.h + 1);
      ctx.lineTo(cx, R.y + R.h + 1); ctx.closePath();
      ctx.fillStyle = 'rgba(172,78,40,0.88)'; ctx.fill();
      ctx.strokeStyle = 'rgba(110,40,20,0.45)'; ctx.lineWidth = Math.max(0.6, 0.5 * u);
      for (let k = 1; k < 4; k++) { const fx = cx - side * cw * k / 4.2; ctx.beginPath(); ctx.moveTo(fx, R.y); ctx.quadraticCurveTo(fx - side * 1.5 * u, R.y + R.h * 0.5, fx - side * cw * 0.1, R.y + R.h); ctx.stroke(); }
    }
    // candle on the inner sill
    const fl = 1 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 11.1), x0 = R.x + R.w * 0.78, yb = R.y + R.h;
    ctx.fillStyle = 'rgba(150,72,34,0.8)'; ctx.fillRect(x0, yb - 7 * u, 3.2 * u, 7 * u);
    L.glow(ctx, x0 + 1.6 * u, yb - 9 * u, 9 * u * fl, '#FFECBE', 0.9);
    ctx.fillStyle = '#FFF6DC'; ctx.beginPath(); ctx.ellipse(x0 + 1.6 * u, yb - 9 * u, 0.9 * u, 1.9 * u * fl, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // cool reflections
  ctx.fillStyle = 'rgba(214,236,255,0.10)';
  poly(ctx, [[R.x + R.w * 0.05, R.y + R.h], [R.x + R.w * 0.2, R.y], [R.x + R.w * 0.27, R.y], [R.x + R.w * 0.12, R.y + R.h]]); ctx.fill();
  poly(ctx, [[R.x + R.w * 0.5, R.y + R.h], [R.x + R.w * 0.65, R.y], [R.x + R.w * 0.68, R.y], [R.x + R.w * 0.53, R.y + R.h]]); ctx.fill();
  ctx.restore();
}

// cheap soft drop shadow for big rectangles (a real shadowBlur on a frame-sized rect costs ~25 ms)
function fakeShadow(ctx, L, x, y, w, h, r, blur, oy, a) {
  const n = 5, st = blur / n;
  ctx.save(); ctx.lineWidth = st * 1.15;
  for (let k = 0; k < n; k++) {
    const g = st * (k + 0.5);
    ctx.strokeStyle = `rgba(0,0,0,${(a * 0.5 * (1 - k / n) ** 1.6).toFixed(3)})`;
    L.roundRect(ctx, x - g + st * 0.5, y - g + oy + st * 0.5, w + 2 * g - st, h + 2 * g - st, r + g); ctx.stroke();
  }
  ctx.restore();
}

function heroWindow(ctx, L, cam, t, S) {
  const R = glassRect(cam), u = R.w / WL.w; // u = screen px per house-local unit
  const ft = Math.min(6 * u, 22), rc = Math.min(0.8 * u, 4), bw = Math.max(1, Math.min(0.9 * u, 3));
  // warm glow on the wall around the window
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  L.glow(ctx, R.x + R.w / 2, R.y + R.h * 0.6, R.w * 1.15, '#FF9A40', 0.16); ctx.restore();
  // white casing with bevel
  fakeShadow(ctx, L, R.x - ft, R.y - ft, R.w + 2 * ft, R.h + 2 * ft, rc, Math.min(6 * u, 30), Math.min(1.5 * u, 8), 0.3);
  L.roundRect(ctx, R.x - ft, R.y - ft, R.w + 2 * ft, R.h + 2 * ft, rc); ctx.fillStyle = TRIM; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(R.x - ft, R.y - ft, R.w + 2 * ft, bw); ctx.fillRect(R.x - ft, R.y - ft, bw, R.h + 2 * ft);
  ctx.fillStyle = 'rgba(30,50,80,0.28)'; ctx.fillRect(R.x - ft, R.y + R.h + ft - bw, R.w + 2 * ft, bw); ctx.fillRect(R.x + R.w + ft - bw, R.y - ft, bw, R.h + 2 * ft);
  // lintel with a snow cap, sill with a snow mound
  const ov = Math.min(4 * u, 14), lh = Math.min(5 * u, 16), lx = R.x - ft - ov, lw = R.w + 2 * (ft + ov), ly = R.y - ft - lh;
  ctx.fillStyle = TRIM; ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = 'rgba(30,50,80,0.22)'; ctx.fillRect(lx, ly + lh - bw, lw, bw);
  snowBank(ctx, lx - ov * 0.1, ly + 1, lw + ov * 0.2, Math.min(4.5 * u, 15), 11);
  const sh = Math.min(4 * u, 14), sy = R.y + R.h + ft;
  fakeShadow(ctx, L, lx, sy, lw, sh, 1, Math.min(4 * u, 18), Math.min(1.6 * u, 7), 0.28);
  ctx.fillStyle = TRIM; ctx.fillRect(lx, sy, lw, sh);
  snowBank(ctx, lx + sh * 0.3, sy + 1, lw - sh * 0.6, Math.min(5 * u, 18), 3);
  // glass: the deep amber room of beats 1–2 under the bright lit window of scene 1
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
  warmInterior(ctx, L, R, t);
  if (S.bright > 0.004) brightGlass(ctx, L, R, t, S);
  const isw = L.clamp(1.2 * u, 1, 6); ctx.fillStyle = 'rgba(40,20,10,0.22)'; ctx.fillRect(R.x, R.y, R.w, isw); ctx.fillRect(R.x, R.y, isw, R.h);
  ctx.restore();
  return R;
}

// soft snow mound along a horizontal edge (top at y - h)
function snowBank(ctx, x, y, w, h, seed) {
  ctx.beginPath(); ctx.moveTo(x, y);
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const u = i / n, bump = 0.72 + 0.28 * Math.sin(i * 2.7 + seed) * Math.sin(i * 1.3 + seed * 0.7);
    const yy = y - h * bump * Math.min(1, Math.sin(Math.PI * Math.min(1, u * 1.0001)) * 3.2 + 0.25);
    if (i === 0) ctx.lineTo(x, yy); else { const px = x + w * (i - 0.5) / n; ctx.quadraticCurveTo(px, yy - h * 0.12, x + w * u, yy); }
  }
  ctx.lineTo(x + w, y); ctx.closePath();
  const g = ctx.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#C9D9EA');
  ctx.fillStyle = g; ctx.fill();
}

// frost, the 2×2 sash and icicles on top of the glass. The two casements swing open towards the camera (S.sash 0→1):
// each free stile travels to its hinge while it grows slightly (perspective) and the pane catches a sheen — the cross
// bars leave the frame physically instead of fading in place.
function windowOverlay(ctx, L, R, t, S) {
  const u = R.w / WL.w;
  drawFrost(ctx, L, R, S.melt);
  const e = S.sash;
  if (e < 0.999) {
    const mt = Math.min(MUL * u, 16), cx = R.x + R.w / 2, cy = R.y + R.h / 2;
    ctx.save(); ctx.globalAlpha *= 1 - sstep(0.78, 1, e);
    for (const side of [-1, 1]) {
      const edge = side < 0 ? R.x : R.x + R.w, th = e * Math.PI / 2;
      const fx = edge + (cx - edge) * Math.cos(th);
      const ext = R.h * 0.07 * Math.sin(Math.PI * e);
      const sw = mt / 2 * (1 + 0.6 * Math.sin(Math.PI * e)), rt = mt * 0.7 * Math.sin(Math.PI * e);
      if (e > 0.005) { // swinging pane: sheen + top/bottom rails
        ctx.fillStyle = `rgba(255,246,228,${(0.16 * Math.sin(Math.PI * e)).toFixed(3)})`;
        poly(ctx, [[edge, R.y], [fx, R.y - ext], [fx, R.y + R.h + ext], [edge, R.y + R.h]]); ctx.fill();
        ctx.fillStyle = '#E4ECF5';
        poly(ctx, [[edge, R.y], [fx, R.y - ext], [fx, R.y - ext + rt], [edge, R.y + rt * 0.4]]); ctx.fill();
        poly(ctx, [[edge, R.y + R.h], [fx, R.y + R.h + ext], [fx, R.y + R.h + ext - rt], [edge, R.y + R.h - rt * 0.4]]); ctx.fill();
      }
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = Math.min(4 * u, 16);
      ctx.fillStyle = '#E4ECF5';
      ctx.fillRect(side < 0 ? fx - sw : fx, R.y - ext, sw, R.h + 2 * ext);              // free stile
      const k = ext / (R.h / 2);
      poly(ctx, [[edge, cy - mt / 2], [fx, cy - mt / 2 * (1 + k)], [fx, cy + mt / 2 * (1 + k)], [edge, cy + mt / 2]]); ctx.fill(); // middle rail
      ctx.restore();
    }
    ctx.restore();
  }
  // icicles under the lintel melt (shorten + fade) with the frost
  const ice = 1 - S.ice;
  if (ice > 0.01) {
    const ft = Math.min(6 * u, 22), iu = Math.min(u, 4.6), iy = R.y - ft;
    const ic = [[0.06, 7], [0.15, 4], [0.27, 9], [0.4, 5], [0.52, 8], [0.63, 4.5], [0.75, 7.5], [0.86, 5], [0.95, 6.5]];
    for (const [f, l] of ic) {
      const ix = R.x - ft + (R.w + 2 * ft) * f, len = l * iu * (0.25 + 0.75 * ice);
      const g = ctx.createLinearGradient(ix, iy, ix, iy + len);
      g.addColorStop(0, `rgba(235,248,255,${(0.95 * ice).toFixed(3)})`); g.addColorStop(1, `rgba(160,215,255,${(0.35 * ice).toFixed(3)})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ix - 1.1 * iu, iy); ctx.lineTo(ix + 1.1 * iu, iy); ctx.lineTo(ix + 0.1 * iu, iy + len); ctx.closePath(); ctx.fill();
    }
  }
}

// ---------------------------------------------------------------- UI helpers (screen space)
function icon(ctx, paths, x, y, size, color, alpha) {
  if (alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x - size / 2, y - size / 2); const s = size / 24; ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.lineWidth = 1.9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const p of paths) ctx.stroke(p);
  ctx.restore();
}

// soft per-character typing (centred); returns width
function softType(ctx, L, str, cx, y, p, { role = 'display', size = 50, color = '#FFFFFF', spread = 5, shadow = null, colorFn = null } = {}) {
  const chars = [...str], n = chars.length, total = L.measure(ctx, str, role, size), x0 = cx - total / 2;
  if (p >= 1 && colorFn) { // fully typed: draw colour runs instead of per-character draws (identical look, cheaper)
    let i = 0, x = x0;
    while (i < n) {
      const c0 = colorFn(i); let j = i; while (j < n && colorFn(j) === c0) j++;
      const run = chars.slice(i, j).join('');
      L.text(ctx, run, x, y, { role, size, color: c0, shadow }); x += L.measure(ctx, run, role, size); i = j;
    }
    return total;
  }
  const q = p * (n + spread);
  let prefix = '';
  for (let i = 0; i < n; i++) {
    const a = L.clamp((q - i) / spread);
    if (a > 0.004 && chars[i] !== ' ') {
      const xo = L.measure(ctx, prefix, role, size), e = L.ease.outCubic(a);
      L.text(ctx, chars[i], x0 + xo, y + (1 - e) * size * 0.28, { role, size, color: colorFn ? colorFn(i) : color, alpha: a, shadow });
    }
    prefix += chars[i];
  }
  return total;
}

// word-by-word masked rise (as L.revealText, centred, single line) with a drop shadow for busy backgrounds
function revealLine(ctx, L, str, cx, y, p, out, { role = 'display', size = 84, color = '#FFFFFF', highlight = null, highlightColor = '#FFC27A', stagger = 0.2, shadow = null } = {}) {
  const words = str.split(' '), n = words.length, sp = L.measure(ctx, ' ', role, size);
  let x = cx - L.measure(ctx, str, role, size) / 2;
  // exit: a calm fade with a slight lift (no masked slide), so it clears before the window frame reaches the line
  const span = 1 / (1 + stagger * (n - 1)), wo = L.ease.inOutSine(L.clamp(out)), lift = -24 * L.ease.outCubic(L.clamp(out));
  words.forEach((w, i) => {
    const k = n > 1 ? i / (n - 1) : 0, wp = L.ease.outCubic(L.clamp((p - k * (1 - span)) / span));
    const ww = L.measure(ctx, w, role, size);
    if (wp * (1 - wo) > 0.002) {
      ctx.save(); ctx.beginPath(); ctx.rect(x - 30, y - size * 1.05 + Math.min(0, lift), ww + 60, size * 1.4 + 30); ctx.clip();
      const isHi = highlight && w.toLowerCase().includes(highlight.toLowerCase());
      L.text(ctx, w, x, y + (1 - wp) * size * 1.1 + lift, { role, size, color: isHi ? highlightColor : color, alpha: wp * (1 - wo), shadow });
      ctx.restore();
    }
    x += ww + sp;
  });
}

const BTN = { label: 'monoisol.com', size: 64, h: 128, padL: 66, gap: 34, circ: 88, padR: 20 };
function buttonWidth(ctx, L) { return BTN.padL + L.measure(ctx, BTN.label, 'display', BTN.size) + BTN.gap + BTN.circ + BTN.padR; }

function drawButton(ctx, L, cx, cy, t, alpha) {
  const C = L.C, wFull = buttonWidth(ctx, L), h = BTN.h;
  const pPop = L.prog(t, 3.32, 0.42), pW = L.ease.inOutCubic(L.prog(t, 3.58, 0.55));
  if (pPop <= 0.001 || alpha <= 0.001) return;
  const pressT = 5.45, press = L.prog(t, pressT, 0.55);
  const dip = press > 0 && press < 1 ? Math.sin(Math.PI * L.clamp(press / 0.55)) * (press < 0.55 ? 1 : 0) : 0;
  const pulse = sstep(6.1, 6.9, t) * (0.5 - 0.5 * Math.cos((t - 6.1) * TAU / 1.6));
  const sc = L.lerp(0.55, 1, L.ease.outBack(pPop)) * (1 - 0.045 * dip) * (1 + 0.016 * pulse);
  const w = L.lerp(h, wFull, pW);
  ctx.save(); ctx.globalAlpha *= alpha * L.clamp(pPop * 1.8); ctx.translate(cx, cy); ctx.scale(sc, sc);
  // glow + shadow
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  L.glow(ctx, 0, 6, w * 0.62, C.brand, 0.22 + 0.12 * pulse); ctx.restore();
  ctx.save(); ctx.shadowColor = 'rgba(10,4,0,0.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  L.roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#46C27A'); g.addColorStop(0.55, C.brand); g.addColorStop(1, '#1E7A43');
  ctx.fillStyle = g; ctx.fill(); ctx.restore();
  // top sheen + rim
  ctx.save(); L.roundRect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.clip();
  const sh = ctx.createLinearGradient(0, -h / 2, 0, 0); sh.addColorStop(0, 'rgba(255,255,255,0.28)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh; ctx.fillRect(-w / 2, -h / 2, w, h / 2);
  // press ripple from the arrow
  const ax = w / 2 - BTN.padR - BTN.circ / 2;
  if (press > 0 && press < 1) {
    const rr = L.ease.outCubic(press) * w * 1.05;
    ctx.fillStyle = `rgba(255,255,255,${(0.32 * (1 - press)).toFixed(3)})`; ctx.beginPath(); ctx.arc(ax, 0, rr, 0, TAU); ctx.fill();
  }
  ctx.restore();
  L.roundRect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(200,255,220,0.55)'; ctx.stroke();
  // outer wave ring
  const ring = L.prog(t, pressT + 0.08, 0.95);
  if (ring > 0 && ring < 1) {
    const ex = L.ease.outCubic(ring) * 46;
    L.roundRect(ctx, -w / 2 - ex, -h / 2 - ex, w + 2 * ex, h + 2 * ex, h / 2 + ex);
    ctx.lineWidth = 3; ctx.strokeStyle = L.rgba(C.brandHi, 0.75 * (1 - ring)); ctx.stroke();
  }
  // arrow disc
  ctx.fillStyle = '#F6FAFF'; ctx.beginPath(); ctx.arc(ax, 0, BTN.circ / 2, 0, TAU); ctx.fill();
  const nud = 5 * pulse;
  ctx.strokeStyle = C.brandDark; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(ax - 15 + nud, 0); ctx.lineTo(ax + 15 + nud, 0); ctx.moveTo(ax + 3 + nud, -13); ctx.lineTo(ax + 16 + nud, 0); ctx.lineTo(ax + 3 + nud, 13); ctx.stroke();
  // typed label
  const pType = L.prog(t, 3.95, 0.85);
  if (pType > 0) {
    const tx = -w / 2 + BTN.padL, chars = [...BTN.label], n = chars.length, shown = pType * n;
    ctx.save(); L.roundRect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.clip();
    let pre = '';
    for (let i = 0; i < n; i++) {
      const a = L.clamp(shown - i);
      if (a > 0.01) L.text(ctx, chars[i], tx + L.measure(ctx, pre, 'display', BTN.size), 2 + (1 - L.ease.outCubic(a)) * 14, { role: 'display', size: BTN.size, color: '#FFFFFF', baseline: 'middle', alpha: a });
      pre += chars[i];
    }
    // caret
    const caretA = (1 - sstep(4.85, 5.15, t)) * (Math.sin(t * 14) > -0.2 ? 1 : 0.15);
    if (caretA > 0.01) { const cxp = tx + L.measure(ctx, chars.slice(0, Math.ceil(shown)).join(''), 'display', BTN.size) + 8; ctx.fillStyle = `rgba(255,255,255,${(0.9 * caretA).toFixed(3)})`; ctx.fillRect(cxp, -BTN.size * 0.42, 5, BTN.size * 0.84); }
    ctx.restore();
  }
  ctx.restore();
}

function drawContacts(ctx, L, cx, cy, t, alpha) {
  const size = 38, role = 'body', isz = 42, gi = 16, sep = 80;
  const s1 = 'info@monoisol.com', s2 = '+38 (067) 523-51-17';
  const w1 = isz + gi + L.measure(ctx, s1, role, size), w2 = isz + gi + L.measure(ctx, s2, role, size);
  let x = cx - (w1 + sep + w2) / 2;
  const items = [[K.icoMail, s1, w1, 4.55], [K.icoPhone, s2, w2, 4.8]];
  items.forEach(([ic, s, w, t0], i) => {
    const p = L.ease.outCubic(L.prog(t, t0, 0.6)), a = alpha * p;
    if (a > 0.01) {
      const dy = (1 - p) * 18;
      icon(ctx, ic, x + isz / 2, cy + dy, isz, L.C.brandHi, a);
      L.text(ctx, s, x + isz + gi, cy + dy + 1, { role, size, color: '#FFF4E8', baseline: 'middle', alpha: a * 0.95, shadow: { color: 'rgba(20,6,0,0.5)', blur: 14, y: 3 } });
    }
    if (i === 0) {
      const pd = L.ease.outCubic(L.prog(t, 4.75, 0.5)) * alpha;
      if (pd > 0.01) { ctx.fillStyle = `rgba(255,220,180,${(0.55 * pd).toFixed(3)})`; ctx.beginPath(); ctx.arc(x + w + sep / 2, cy, 3.5, 0, TAU); ctx.fill(); }
    }
    x += w + sep;
  });
}

// ---------------------------------------------------------------- scene
module.exports = {
  draw(ctx, t, d, L, env) {
    const { C } = L;
    init(L);
    const cues = env && env.cues && env.cues.length >= 3 ? env.cues : [{ start: 0.633 }, { start: 3.9 }, { start: 7.667 }];
    void cues; void d;
    const cam = camera(L, t);

    // ---------- world (village) ----------
    // once the hero's front wall covers the whole screen only that house is drawn (the wall surrounds the window frame)
    const [wx0, wy0] = toScreen(cam, HERO.x - HERO.hw * HERO.s, HERO.y - HERO.wh * HERO.s), [wx1, wy1] = toScreen(cam, HERO.x + HERO.hw * HERO.s, HERO.y);
    const worldVisible = !(wx0 < -10 && wx1 > 1930 && wy0 < -10 && wy1 > 1090);
    sky(ctx, L, t);
    if (!worldVisible) { // just the hero's sided front wall around the window (cheap: no glows at this zoom)
      ctx.save(); ctx.translate(960, 540); ctx.scale(cam.z, cam.z); ctx.translate(-cam.fx, -cam.fy);
      L.at(ctx, { x: HERO.x, y: HERO.y, scale: HERO.s }, () => {
        const P = housePieces(HERO);
        poly(ctx, P.front);
        const fg = ctx.createLinearGradient(0, -HERO.wh - HERO.gh, 0, 0); fg.addColorStop(0, '#3A5478'); fg.addColorStop(1, '#2A4163');
        ctx.fillStyle = fg; ctx.fill();
        ctx.strokeStyle = 'rgba(10,22,40,0.22)'; ctx.lineWidth = 0.45;
        ctx.beginPath(); for (let yy = -8; yy > -HERO.wh - HERO.gh; yy -= 11) { ctx.moveTo(-HERO.hw, yy); ctx.lineTo(HERO.hw, yy); } ctx.stroke();
      });
      ctx.restore();
    } else {
      // far hills with parallax
      const zf = 1 + (cam.z - 1) * 0.45;
      ctx.save(); ctx.translate(960, 540); ctx.scale(zf, zf); ctx.translate(-cam.fx + (cam.fx - 960) * 0.4, -cam.fy + (cam.fy - 540) * 0.4);
      hills(ctx, L, 700, 26, 0.004, 3, '#2E4D74', '#6F8DB4', 'rgba(226,238,252,0.55)');
      ctx.restore();
      ctx.save(); ctx.translate(960, 540); ctx.scale(cam.z, cam.z); ctx.translate(-cam.fx, -cam.fy);
      hills(ctx, L, 748, 18, 0.006, 9, '#8EA8C8', '#B8CBE0', 'rgba(244,249,255,0.8)');
      HOUSES.slice(0, 5).forEach((h, i) => drawHouse(ctx, L, h, t, i));
      PINES.filter(p => p.y < 780).forEach(p => pine(ctx, L, p));
      hills(ctx, L, 818, 12, 0.005, 17, '#C3D3E6', '#E2EBF5', 'rgba(255,255,255,0.9)');
      HOUSES.slice(5).forEach((h, i) => drawHouse(ctx, L, h, t, i + 5));
      PINES.filter(p => p.y >= 780 && p.y < 860).forEach(p => pine(ctx, L, p));
      hills(ctx, L, 880, 8, 0.004, 23, '#D9E5F2', '#F1F6FB', null);
      drawHouse(ctx, L, HERO, t, 9);
      PINES.filter(p => p.y >= 860).forEach(p => pine(ctx, L, p));
      ctx.restore();
      // sparkling snow (screen-space glints so they stay crisp)
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const g of K.glints) {
        const a = Math.pow(Math.max(0, Math.sin(t * g.sp + g.ph)), 10);
        if (a < 0.03) continue;
        const [sx, sy] = toScreen(cam, g.x, g.y);
        if (sx < -20 || sx > 1940 || sy < -20 || sy > 1100) continue;
        const s = g.s * (0.6 + 0.4 * a);
        ctx.globalAlpha = a; ctx.drawImage(K.glint, sx - s / 2, sy - s / 2, s, s);
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(sx - s * 0.6, sy - 0.75, s * 1.2, 1.5); ctx.fillRect(sx - 0.75, sy - s * 0.6, 1.5, s * 1.2);
      }
      ctx.restore(); ctx.globalAlpha = 1;
    }

    // ---------- hero window (screen space) ----------
    // window state: frost melts edges→centre (1.55–2.95), icicles melt, curtains part, the casements swing open,
    // the bright lit glass of scene 1 gives way to the deep amber room
    const S = {
      melt: L.lerp(-0.05, 1.03, L.ease.inOutSine(L.prog(t, 1.55, 1.4))),
      ice: L.ease.inOutSine(L.prog(t, 1.7, 1.3)),
      curt: L.ease.inOutCubic(L.prog(t, 2.7, 0.85)),
      sash: L.ease.inOutCubic(L.prog(t, 2.9, 0.65)),
      bright: 1 - sstep(3.0, 3.75, t),
    };
    const R = heroWindow(ctx, L, cam, t, S);
    windowOverlay(ctx, L, R, t, S);

    // ---------- thermal look (≈1 s, swept in after the incoming transition and out again) ----------
    const sweepIn = L.lerp(-80, 2000, L.ease.inOutCubic(L.prog(t, 0.3, 0.5)));
    const sweepOut = L.lerp(-80, 2000, L.ease.inOutCubic(L.prog(t, 1.3, 0.5)));
    if (t > 0.3 && t < 1.83 && worldVisible) {
      ctx.save(); ctx.beginPath(); ctx.rect(sweepOut, 0, Math.max(0, sweepIn - sweepOut), 1080); ctx.clip();
      ctx.fillStyle = 'rgba(16,8,46,0.86)'; ctx.fillRect(0, 0, 1920, 1080);
      ctx.save(); ctx.translate(960, 540); ctx.scale(cam.z, cam.z); ctx.translate(-cam.fx, -cam.fy);
      HOUSES.forEach((h, i) => thermalHouse(ctx, L, h, t, 1, i));
      thermalHouse(ctx, L, HERO, t, 1, 9);
      ctx.restore();
      ctx.restore();
      // scan lines
      for (const sx of [sweepIn, sweepOut]) {
        if (sx > -60 && sx < 1980) {
          const sg = ctx.createLinearGradient(sx - 60, 0, sx + 60, 0);
          sg.addColorStop(0, 'rgba(255,150,60,0)'); sg.addColorStop(0.5, 'rgba(255,190,110,0.35)'); sg.addColorStop(1, 'rgba(255,150,60,0)');
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = sg; ctx.fillRect(sx - 60, 0, 120, 1080);
          ctx.fillStyle = 'rgba(255,236,200,0.85)'; ctx.fillRect(sx - 1.5, 0, 3, 1080); ctx.restore();
        }
      }
    }

    // falling snow outside (fades as we enter the window)
    const snowAmt = 1 - sstep(2.7, 3.7, t);
    if (snowAmt > 0.01) {
      L.snow(ctx, t, { amount: snowAmt * 0.75, count: 110, seed: 31, wind: 18, speed: 0.75 });
      L.snow(ctx, t + 3, { amount: snowAmt, count: 40, seed: 57, wind: 26, speed: 1.1 });
    }

    // ---------- interior content (beats 1–2), clipped to the glass ----------
    const inner = sstep(3.2, 3.9, t);
    if (inner > 0.001) {
      ctx.save();
      ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
      // blurred collage side panels, slow drift
      const pa = 0.35 * sstep(3.55, 4.6, t) * (1 - 0.35 * sstep(7.0, 8.2, t));
      if (pa > 0.005) {
        const dr = Math.sin(t * 0.35) * 10, sc = 1 + 0.03 * L.prog(t, 3.5, 8.5);
        const pw = K.panelL.width * sc, ph = K.panelL.height * sc;
        const slide = (1 - L.ease.outCubic(L.prog(t, 3.55, 1.1))) * 60 + 64 * L.ease.inOutCubic(L.prog(t, 7.0, 1.4));
        ctx.globalAlpha = pa;
        ctx.drawImage(K.panelL, 118 - slide - (pw - K.panelL.width) / 2, 540 - ph / 2 + dr, pw, ph);
        ctx.drawImage(K.panelR, 1920 - 118 - pw + slide + (pw - K.panelR.width) / 2, 540 - ph / 2 - dr, pw, ph);
        ctx.globalAlpha = 1;
      }
      embersIn(ctx, L, R, t, inner * (1 - 0.4 * sstep(6.8, 7.4, t)));

      // layout: button group centred in beat 1, glides down for the logo in beat 2
      const shift = L.ease.inOutCubic(L.prog(t, 6.95, 0.95));
      const btnY = L.lerp(500, 640, shift), conY = L.lerp(664, 800, shift);

      // ---------- logo from warm sparks (drawn under the button + contacts so the sparks never cross the URL) ----------
      const LCX = 960, LCY = 268, LSC = 1.0;
      if (t > 6.5) {
        const sil = sstep(7.45, 8.0, t), real = L.ease.inOutSine(L.prog(t, 7.85, 0.6));
        // silhouette
        if (sil > 0.01 && real < 0.999) {
          ctx.save(); ctx.globalAlpha = sil * (1 - real) * 0.9;
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(K.logoSil, LCX - K.LW / 2 * LSC, LCY - K.LH / 2 * LSC, K.LW * LSC, K.LH * LSC);
          ctx.restore();
        }
        // real logo with a soft settle + later a light sweep
        if (real > 0.001) {
          const sc2 = L.lerp(1.035, 1, L.ease.outCubic(L.prog(t, 7.85, 1.0)));
          const shine = t > 9.1 && t < 10.5 ? L.ease.inOutSine(L.prog(t, 9.1, 1.4)) : null;
          L.at(ctx, { x: LCX, y: LCY, scale: sc2 }, () => L.brandLogo(ctx, 0, 0, K.LW, 1, { alpha: real, shine, glowAmt: 0.0 }));
        }
        // sparks flying in
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const s of K.sparks) {
          const k = (t - s.t0) / s.dur;
          const appear = sstep(s.t0 - 0.35, s.t0 + 0.1, t);
          const fade = 1 - sstep(7.95, 8.5, t);
          const a = appear * fade;
          if (a <= 0.01) continue;
          const e = L.ease.inOutCubic(L.clamp(k));
          const tx = LCX + s.px * LSC, ty = LCY + s.py * LSC;
          const mx = (s.sx + tx) / 2 + s.bend, my = (s.sy + ty) / 2 - Math.abs(s.bend) * 0.3;
          const x = (1 - e) * (1 - e) * s.sx + 2 * (1 - e) * e * mx + e * e * tx + (k < 0 ? Math.sin(t * 1.3 + s.ph) * 6 : 0);
          const y = (1 - e) * (1 - e) * s.sy + 2 * (1 - e) * e * my + e * e * ty + (k < 0 ? -(t - s.t0 + 0.35) * 14 : 0);
          const sz = s.size * (k >= 1 ? 0.55 : 1) * (0.8 + 0.2 * Math.sin(t * 6 + s.ph));
          ctx.globalAlpha = a * (k >= 1 ? 0.8 : 0.9);
          ctx.drawImage(K.spark, x - sz / 2, y - sz / 2, sz, sz);
        }
        ctx.restore();
      }
      drawButton(ctx, L, 960, btnY, t, 1);
      drawContacts(ctx, L, 960, conY, t, 1);
      if (t > 8.2) {
        // slogan
        const pSl = L.prog(t, 8.3, 1.35);
        if (pSl > 0) softType(ctx, L, 'Тепло, яке залишається вдома', 960, 476, pSl, { role: 'displaySemi', size: 52, color: '#FFFFFF', spread: 6, shadow: { color: 'rgba(20,6,0,0.55)', blur: 18, y: 4 }, colorFn: i => (i < 6 ? '#7BE3A4' : '#FFFFFF') });
      }
      ctx.restore();
    }

    // ---------- beat 0 line ----------
    const p0 = L.prog(t, 0.38, 1.1), out0 = L.prog(t, 2.35, 0.42), lift0 = -40 * L.ease.inOutSine(L.prog(t, 1.9, 0.9));
    if (p0 > 0 && out0 < 1) {
      // scrim: a top band + a soft ellipse behind the line, so the bright snow ridge of the gable never cuts the letters
      ctx.save(); ctx.globalAlpha = L.clamp(p0 * 2) * (1 - L.ease.inOutSine(out0)) * sstep(1.0, 1.9, t);
      const sh = ctx.createLinearGradient(0, 0, 0, 400); sh.addColorStop(0, 'rgba(4,10,22,0.8)'); sh.addColorStop(0.55, 'rgba(4,10,22,0.52)'); sh.addColorStop(1, 'rgba(4,10,22,0)');
      ctx.fillStyle = sh; ctx.fillRect(0, 0, 1920, 400);
      ctx.translate(960, 182 + lift0); ctx.scale(1, 0.2);
      const se = ctx.createRadialGradient(0, 0, 0, 0, 0, 760); se.addColorStop(0, 'rgba(6,12,26,0.62)'); se.addColorStop(0.6, 'rgba(6,12,26,0.42)'); se.addColorStop(1, 'rgba(6,12,26,0)');
      ctx.fillStyle = se; ctx.fillRect(-760, -760, 1520, 1520);
      ctx.restore();
      revealLine(ctx, L, 'Для тих, кого любите', 960, 212 + lift0, p0, out0, { size: 84, highlight: 'любите', highlightColor: '#FFC27A', stagger: 0.22, shadow: { color: 'rgba(2,6,16,0.75)', blur: 22, y: 4 } });
    }

    L.vignette(ctx, 0.42);
  },
};
