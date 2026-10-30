'use strict';
// Scene 1 — «Холод шукає шпарину» (global 0.00–18.30 s). Pure vector motion graphics, cold palette
// (night blue #0E2A47, ice #8FD3FF, white hoarfrost). No photos.
//  0.0–3.0  music only: a 2.5D camera floats over a snowy night village; snow falls in three parallax layers
//  3.0      «Зима не питає…»        dolly push into ONE warm window (the same window returns in scene 10)
//  6.2      «Мороз малює візерунки…» procedural frost grows from the glass edges towards the centre
//  8.7      «…вітер шукає кожну шпарину» pull back; white wind strokes wrap the house and slip into the gaps
// 11.5      «І тепло…»              thermal scan → cutaway: heat sparks leak through walls / floor / bare pipes,
//                                    thermometer column falls, headline grows hoarfrost; 17+ warm light dims
const W = 1920, H = 1080;
const ICE = '#8FD3FF';
const HAZE = '#123257';
// hero house (house-local units, origin = bottom centre of the front face, y up = negative)
const HERO = { x: 0, w: 260, wallH: 130, rise: 90, depth: 130, type: 'front', wall: '#36587E', hero: true };
const HW = HERO.w / 2, WT = 12, HI = HW - WT;      // half width, wall thickness, inner face
const WIN = { x: -72, y: -104, w: 52, h: 58 };      // hero window glass
const MUL = 3;                                     // mullion width
const DOOR = { x: 36, y: -92, w: 42, h: 92 };
const HOUSE_X = 1432, ANCHOR_LY = -60, S_MED = 2.5, HOUSE_Y = 552; // medium / thermal framing
const DEPTH = { hills2: 6400, hills: 4200, far: 2600, mid: 1600, hero: 1000, near: 650 };
// wind gaps (house-local): window bottom-left, window top-left, door left edge, under the door
const GAPS = [[-78.6, -41], [-78.6, -108], [34.6, -52], [57, -1.5]];
// thermal false-colour ramp (cold navy → violet → plum → ember → amber → warm white)
const RAMP = [[0, '#040C1E'], [0.12, '#0E2A47'], [0.26, '#1F3F8A'], [0.4, '#4A2D8C'], [0.52, '#8B2B80'], [0.63, '#CC3A52'],
  [0.74, '#F2652B'], [0.85, '#FF9C33'], [0.94, '#FFCB5A'], [1, '#FFF4D6']];
// headline
const HL = { x: 120, y1: 470, y2: 575, size: 96, l1: 'Холод шукає', l2: 'шпарину' };
const HM = { ox: 100, oy: 340, w: 960, h: 290 };    // headline frost canvas placement (screen)
const THERMO = { x: 148, y: 696, len: 430 };

let G = null;

// ---------------------------------------------------------------- small helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mod = (a, n) => ((a % n) + n) % n;
function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
function th(v, a = 1) { const c = G.ramp[Math.round(clamp(v) * 200)]; return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function thc(v) { return G.ramp[Math.round(clamp(v) * 200)]; }
function glowRGB(ctx, x, y, r, c, a) {
  if (a <= 0.003 || r <= 0.3) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`); g.addColorStop(0.4, `rgba(${c[0]},${c[1]},${c[2]},${a * 0.35})`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
class Path2DLike { constructor() { this.a = []; } push(x, y, r) { this.a.push(x, y, r); } }
const bump = (t, a, d) => { const p = (t - a) / d; return p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p); };
// ∫ of a raised-cosine gust envelope on [a,b] (so wind displacement stays a pure function of t)
function gustInt(t, a, b) { if (t <= a) return 0; if (t >= b) return (b - a) / 2; const d = b - a, x = t - a; return (x - d / (2 * Math.PI) * Math.sin(2 * Math.PI * x / d)) / 2; }

// ---------------------------------------------------------------- camera (2.5D layered perspective)
function camAt(s, lx, ly, px, py) { return { s, x: lx - (px - W / 2) / s, y: ly - (py - H / 2) / s }; }
// log-zoom with the pan linear in 1/s => a pure zoom about one fixed screen point (natural dolly feel)
function zoomLerp(a, b, u) {
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * u);
  const den = 1 / b.s - 1 / a.s, w = Math.abs(den) < 1e-9 ? u : (1 / s - 1 / a.s) / den;
  return { s, x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w };
}
function camera(L, t, K) {
  const { ease, prog, lerp } = L;
  const k = ease.inOutSine(prog(t, -0.4, 3.8));
  const A = { s: lerp(1.0, 1.13, k), x: lerp(-175, -86, k), y: lerp(-230, -214, k) };
  if (t <= K.push) return A;
  const cx = WIN.x + WIN.w / 2, cy = -72;
  const K2 = camAt(9.6, cx, cy, W / 2, H / 2);
  if (t <= K.pushEnd) return zoomLerp(A, K2, ease.inOutCubic(prog(t, K.push, K.pushEnd - K.push)));
  const K3 = camAt(10.3, cx, cy, W / 2, H / 2);
  if (t <= K.pull) return zoomLerp(K2, K3, ease.inOutSine(prog(t, K.pushEnd, K.pull - K.pushEnd)));
  const K4 = camAt(S_MED, 0, ANCHOR_LY, HOUSE_X, HOUSE_Y);
  if (t <= K.pullEnd) return zoomLerp(K3, K4, ease.inOutCubic(prog(t, K.pull, K.pullEnd - K.pull)));
  return camAt(S_MED * Math.exp(0.0052 * (t - K.pullEnd)), 0, ANCHOR_LY, HOUSE_X, HOUSE_Y);
}
function plane(cam, Dl, sh) {
  const camZ = 1000 - 1000 / cam.s, s = 1000 / Math.max(25, Dl - camZ);
  return { s, ox: W / 2 - cam.x * s + sh.x, oy: H / 2 - cam.y * s + sh.y };
}

// ---------------------------------------------------------------- build (once)
function spline(pts, n = 16) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  const cum = [0]; for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { p: out, cum, len: cum[cum.length - 1] };
}
function sampleAt(path, u) {
  const d = clamp(u) * path.len, c = path.cum; let lo = 0, hi = c.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] < d) lo = m; else hi = m; }
  const a = path.p[lo], b = path.p[hi], seg = Math.max(1e-6, c[hi] - c[lo]), f = (d - c[lo]) / seg;
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return [a[0] + dx * f, a[1] + dy * f, -dy / l, dx / l];
}

// fern-like frost crystals growing inward from rectangle edges. Returns batches per depth (sorted by birth).
function genFrost(L, panes, seed, o) {
  const r = L.rng(seed), segs = [];
  for (const pn of panes) {
    const { x, y, w, h } = pn;
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
    for (const [cx, cy, a] of corners) for (let k = 0; k < o.cornerSeeds; k++) {
      const aa = a + (k - (o.cornerSeeds - 1) / 2) * 0.42 + (r() - 0.5) * 0.2;
      grow(cx + Math.cos(aa) * 0.5, cy + Math.sin(aa) * 0.5, aa, o.len * (0.85 + r() * 0.5), 0, r() * 0.05);
    }
    const edges = [[x, y, w, 0, Math.PI / 2], [x, y + h, w, 0, -Math.PI / 2], [x, y, 0, h, 0], [x + w, y, 0, h, Math.PI]];
    for (const [ex, ey, ew, eh, nrm] of edges) for (let k = 0; k < o.edgeSeeds; k++) {
      const u = (k + 0.5 + (r() - 0.5) * 0.7) / o.edgeSeeds, mid = 1 - Math.abs(u - 0.5) * 2;
      const px = ex + ew * u + Math.cos(nrm) * 0.4, py = ey + eh * u + Math.sin(nrm) * 0.4;
      grow(px, py, nrm + (r() - 0.5) * 1.1, o.len * (0.45 + r() * 0.55), 0, 0.06 + r() * 0.2 + mid * 0.12);
    }
  }
  let mx = 0; for (const s of segs) mx = Math.max(mx, s[5]);
  const batches = [[], [], []];
  for (const s of segs) { s[4] /= mx; s[5] /= mx; batches[s[6]].push(s); }
  for (const b of batches) b.sort((p, q) => p[4] - q[4]);
  return batches;
}
function drawFrost(ctx, batches, P, widths, color, glowColor, glowMul) {
  if (P <= 0) return;
  ctx.lineCap = 'round';
  for (let pass = glowColor ? 0 : 1; pass < 2; pass++) {
    for (let d = 0; d < 3; d++) {
      if (pass === 0 && d === 2) continue;
      const B = batches[d]; if (!B.length) continue;
      ctx.beginPath();
      for (let i = 0; i < B.length; i++) {
        const s = B[i]; if (s[4] >= P) break;
        const f = s[5] <= P ? 1 : (P - s[4]) / (s[5] - s[4]);
        ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0] + (s[2] - s[0]) * f, s[1] + (s[3] - s[1]) * f);
      }
      ctx.lineWidth = widths[d] * (pass === 0 ? glowMul : 1); ctx.strokeStyle = pass === 0 ? glowColor : color; ctx.stroke();
    }
  }
}

function mkHouse(r, x, sc, type) {
  const w = (200 + r() * 80) * sc, wallH = (108 + r() * 28) * sc;
  const t = type || (r() < 0.55 ? 'front' : 'side');
  const walls = ['#3E5E86', '#4B6A8C', '#55698A', '#3B6276', '#5B5878', '#4A657C', '#56708F'];
  const h = { x, w, wallH, rise: (t === 'front' ? 72 + r() * 26 : 52 + r() * 22) * sc, depth: (140 + r() * 70) * sc, type: t, wall: walls[Math.floor(r() * walls.length)], wins: [], door: null, chimney: r() < 0.6, smoke: r() < 0.4 };
  const hw = w / 2, ww = w * 0.17, wh = ww * 1.12, wy = -wallH * 0.74;
  if (t === 'front') {
    h.wins.push({ x: -hw + w * 0.12, y: wy, w: ww, h: wh, lit: r() < 0.8 });
    h.door = { x: hw - w * 0.12 - w * 0.17, y: -wallH * 0.68, w: w * 0.17, h: wallH * 0.68 };
    if (r() < 0.7) h.attic = { lit: r() < 0.6 };
  } else {
    const n = w > 235 * sc ? 3 : 2, dpos = Math.floor(r() * n);
    for (let i = 0; i < n; i++) {
      const cx = -hw + w * (i + 0.5) / n;
      if (i === dpos && !h.door) { h.door = { x: cx - w * 0.07, y: -wallH * 0.66, w: w * 0.14, h: wallH * 0.66 }; continue; }
      h.wins.push({ x: cx - ww / 2, y: wy, w: ww, h: wh, lit: r() < 0.72 });
    }
  }
  h.sideWin = r() < 0.6 ? { lit: r() < 0.7 } : null;
  return h;
}

function build(L) {
  const r = L.rng(20251030);
  const g = { ramp: [] };
  for (let i = 0; i <= 200; i++) {
    const v = i / 200; let k = 0; while (k < RAMP.length - 2 && v > RAMP[k + 1][0]) k++;
    const [a, ca] = RAMP[k], [b, cb] = RAMP[k + 1];
    g.ramp.push(L.hexToRgb(L.mixColor(ca, cb, (v - a) / (b - a))));
  }
  // sky stars
  g.stars = []; for (let i = 0; i < 150; i++) g.stars.push([r() * W, r() * 560, 0.5 + r() * 1.3, r() * 6.28, 0.25 + r() * 0.5]);
  // hill silhouettes
  const hill = (D, seed, base, amp, step) => { const pts = []; for (let x = -9000; x <= 9000; x += step) pts.push([x, -(base + amp * (0.5 + 0.5 * L.noise1(x * 0.00055, seed)) + amp * 0.25 * L.noise1(x * 0.0021, seed + 3))]); return { D, pts }; };
  g.hills = [hill(DEPTH.hills2, 11, 420, 620, 220), hill(DEPTH.hills, 17, 200, 420, 180)];
  // village rows
  g.far = []; for (let x = -3600; x < 3400; x += 150 + r() * 140) { if (r() < 0.22) continue; g.far.push(mkHouse(r, x, 0.85 + r() * 0.25)); }
  g.mid = []; for (let x = -2300; x < 2100; x += 300 + r() * 120) { if (Math.abs(x + 60) < 120) continue; g.mid.push(mkHouse(r, x, 0.9 + r() * 0.2)); }
  g.heroRow = [
    Object.assign(mkHouse(r, -640, 1.0, 'side'), { w: 270, wallH: 120, x: -640 }),
    Object.assign(mkHouse(r, 430, 0.95, 'front'), { x: 430 }),
    Object.assign(mkHouse(r, -1150, 1.0, 'front'), { x: -1150 }),
    Object.assign(mkHouse(r, 930, 1.0, 'side'), { x: 930 }),
  ];
  for (const h of g.heroRow) { const hh = mkHouse(L.rng(Math.round(h.x + 5000)), h.x, h.w / 240, h.type); Object.assign(h, { wins: hh.wins, door: hh.door, wallH: h.wallH }); }
  g.pinesFar = []; for (let x = -3600; x < 3600; x += 90 + r() * 260) g.pinesFar.push([x, 120 + r() * 140, r()]);
  g.pinesMid = []; for (let x = -2300; x < 2300; x += 260 + r() * 380) { if (Math.abs(x + 60) < 260) continue; g.pinesMid.push([x, 170 + r() * 120, r()]); }
  g.pinesHero = [[-330, 230, 0.3], [-890, 260, 0.6], [250, 210, 0.2], [700, 250, 0.8], [-1400, 240, 0.5]];
  g.pinesNear = [[-770, 600, 0.1], [-575, 380, 0.7], [330, 540, 0.4], [480, 400, 0.9]];
  g.fence = []; for (let x = -330; x <= 120; x += 46) g.fence.push(x);
  g.glitter = []; for (let i = 0; i < 46; i++) g.glitter.push([-620 + r() * 900, 14 + r() * 170, r() * 6.28, 0.5 + r() * 0.5]);
  // hero window frost (four panes)
  const pw = (WIN.w - MUL) / 2, ph = (WIN.h - MUL) / 2;
  g.panes = [[WIN.x, WIN.y], [WIN.x + pw + MUL, WIN.y], [WIN.x, WIN.y + ph + MUL], [WIN.x + pw + MUL, WIN.y + ph + MUL]].map(([x, y]) => ({ x, y, w: pw, h: ph }));
  g.frost = genFrost(L, g.panes, 77, { step: 0.85, len: 10, reach: 15, cornerSeeds: 3, edgeSeeds: 3 });
  // wind paths (house-local)
  const WP = [
    { pts: [[-800, -200], [-500, -244], [-250, -262], [-40, -258], [160, -232], [380, -192]], st: 8.55, dur: 1.9, w: 4.6, gap: -1 },
    { pts: [[-800, -40], [-500, -18], [-280, -26], [-160, -46], [-104, -48], [-79, -42]], st: 8.8, dur: 1.55, w: 4.2, gap: 0 },
    { pts: [[-800, -150], [-520, -170], [-310, -152], [-170, -124], [-104, -110], [-79, -108]], st: 9.1, dur: 1.5, w: 3.8, gap: 1 },
    { pts: [[-800, -10], [-480, -5], [-240, -12], [-70, -22], [12, -44], [34.6, -52]], st: 9.4, dur: 1.45, w: 4.0, gap: 2 },
    { pts: [[-800, -118], [-480, -138], [-240, -134], [-150, -126], [-132, -150], [-80, -200], [30, -240], [220, -262]], st: 9.55, dur: 1.75, w: 3.4, gap: -1 },
    { pts: [[-800, -2], [-450, -4], [-170, -4], [20, -2.5], [57, -1.5]], st: 9.85, dur: 1.0, w: 3.2, gap: 3 },
    { pts: [[-800, -64], [-500, -48], [-280, -60], [-150, -62], [-100, -50], [-79, -42]], st: 10.0, dur: 0.95, w: 3.4, gap: 0 },
    { pts: [[-800, -176], [-540, -196], [-330, -190], [-170, -178], [-90, -172], [60, -160], [260, -150]], st: 10.05, dur: 1.1, w: 3.0, gap: -1 },
  ];
  g.wind = WP.map(o => Object.assign(o, { path: spline(o.pts, 18) }));
  // heat sparks (house-local paths for the thermal cutaway)
  g.sparks = [];
  const add = (fam, pts, T, ph, sz) => g.sparks.push({ fam, pts, T, ph, sz, len: pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0) });
  for (let i = 0; i < 40; i++) {
    const side = i % 2 ? 1 : -1, leaks = side < 0 ? [-62, -100] : [-40, -96];
    const yc = leaks[Math.floor(r() * 2)] + (r() - 0.5) * 14;
    const x0 = side * (20 + r() * 85), y0 = -18 - r() * 95;
    add('wall', [[x0, y0], [side * HI, yc], [side * HW, yc - 2], [side * (HW + 30 + r() * 55), yc - 18 - r() * 45]], 2.6 + r() * 1.2, r(), 0.85 + r() * 0.5);
  }
  for (let i = 0; i < 26; i++) {
    const x0 = -105 + r() * 210, x1 = x0 + (r() - 0.5) * 18, spot = r() < 0.65 ? (r() < 0.5 ? -40 : 40) : x1;
    add('floor', [[x0, -12 - r() * 20], [spot + (r() - 0.5) * 10, 0], [spot + (r() - 0.5) * 10, 9], [spot + (r() - 0.5) * 50, 34 + r() * 30]], 2.2 + r() * 1.0, r(), 0.85 + r() * 0.5);
  }
  for (let i = 0; i < 34; i++) {
    const onSupply = r() < 0.6, py = onSupply ? 50 : 62, x0 = -82 + r() * 160, toWall = r() < 0.45;
    if (toWall) { const side = x0 < 0 ? -1 : 1, yy = py + (r() - 0.5) * 16; add('pipe', [[x0, py], [side * HI, yy], [side * HW, yy + 1], [side * (HW + 30 + r() * 45), yy + 6 + r() * 30]], 2.4 + r() * 1.1, r(), 0.85 + r() * 0.5); }
    else { const xx = x0 + (r() - 0.5) * 30; add('pipe', [[x0, py + 3], [xx, 75], [xx, 84], [xx + (r() - 0.5) * 50, 112 + r() * 30]], 2.0 + r() * 1.0, r(), 0.85 + r() * 0.5); }
  }
  // headline mask + hoarfrost crystals
  const mask = L.offscreen(HM.w, HM.h), m = mask.getContext('2d');
  m.font = `${HL.size}px UB800`; m.fillStyle = '#fff'; m.strokeStyle = '#fff'; m.lineJoin = 'round'; m.lineWidth = 7;
  for (const [s, y] of [[HL.l1, HL.y1], [HL.l2, HL.y2]]) { m.strokeText(s, HL.x - HM.ox, y - HM.oy); m.fillText(s, HL.x - HM.ox, y - HM.oy); }
  const maskF = L.offscreen(HM.w, HM.h), mf = maskF.getContext('2d'); mf.font = m.font; mf.fillStyle = '#fff';
  for (const [s2, y] of [[HL.l1, HL.y1], [HL.l2, HL.y2]]) mf.fillText(s2, HL.x - HM.ox, y - HM.oy);
  g.hlMask = mask; g.hlMaskF = maskF; g.hlTmp = L.offscreen(HM.w, HM.h); g.hlTmp2 = L.offscreen(HM.w, HM.h);
  const data = m.getImageData(0, 0, HM.w, HM.h).data, isIn = (x, y) => x >= 0 && y >= 0 && x < HM.w && y < HM.h && data[(Math.floor(y) * HM.w + Math.floor(x)) * 4 + 3] > 128;
  const hs = []; let tries = 0;
  while (hs.length < 300 && tries++ < 20000) { const x = r() * HM.w, y = r() * HM.h; if (isIn(x, y)) hs.push([x, y]); }
  const hseg = [[], [], []];
  for (const [sx, sy] of hs) {
    const b0 = (1 - sy / HM.h) * 0.72 + r() * 0.12;
    let x = sx, y = sy, ang = -Math.PI / 2 + (r() - 0.5) * 2.4; const n = 3 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      ang += (r() - 0.5) * 0.4; const nx = x + Math.cos(ang) * 3.2, ny = y + Math.sin(ang) * 3.2;
      const b = b0 + i * 0.012; hseg[0].push([x, y, nx, ny, b, b + 0.012, 0]);
      for (const sd of [-1, 1]) if (r() < 0.7) { const a2 = ang + sd * (1.0 + r() * 0.2), l2 = 2 + r() * 3; hseg[1].push([nx, ny, nx + Math.cos(a2) * l2, ny + Math.sin(a2) * l2, b + 0.01, b + 0.03, 1]); }
      x = nx; y = ny;
    }
  }
  for (const b of hseg) b.sort((p, q) => p[4] - q[4]);
  g.hlFrost = hseg;
  g.hlGlints = []; for (let i = 0; i < 7; i++) { let p; do { p = [r() * HM.w, r() * HM.h]; } while (!isIn(p[0], p[1])); g.hlGlints.push([p[0], p[1], r() * 6.28, 0.35 + r() * 0.4]); }
  // spark glow sprites along the cooling path (hot amber → plum → ice blue), avoids per-frame gradients
  g.sparkSpr = [];
  for (let i = 0; i < 32; i++) {
    const temp = 0.08 + 0.92 * i / 31;
    const col = temp > 0.3 ? g.ramp[Math.round(temp * 200)] : L.hexToRgb(L.mixColor(ICE, '#2C6CB0', clamp((0.3 - temp) / 0.22)));
    const c = L.offscreen(64, 64), x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},1)`); gr.addColorStop(0.4, `rgba(${col[0]},${col[1]},${col[2]},0.35)`); gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    g.sparkSpr.push({ c, cs: `${Math.min(255, col[0] + 50)},${Math.min(255, col[1] + 50)},${Math.min(255, col[2] + 50)}` });
  }
  return g;
}

// ---------------------------------------------------------------- palettes
function nightPal(L, wall, fog) {
  const m = c => fog > 0 ? L.mixColor(c, HAZE, fog) : c;
  return {
    wall: m(wall), wallHi: m(L.mixColor(wall, '#B9D2EA', 0.13)), wallLo: m(L.mixColor(wall, '#081426', 0.3)), side: m(L.mixColor(wall, '#06101E', 0.45)),
    roofEdge: m('#15253B'), snow: m('#E3EFFA'), snowShade: m('#9DB8D4'), trim: m('#D5E0EC'), glass: m('#1B2D47'),
    lit: L.mixColor('#FFC56A', HAZE, fog * 0.45), lit2: L.mixColor('#FF9E45', HAZE, fog * 0.45), litGlow: L.hexToRgb('#FFB547'), door: m('#5A3E31'), chimney: m('#2B3A50'),
    glowAmt: 1 - fog * 0.6, thermal: false,
  };
}
function thermPal(L, v0) {
  return {
    wall: th(v0), wallHi: th(v0 + 0.03), wallLo: th(v0 - 0.03), side: th(v0 - 0.05), roofEdge: th(v0 + 0.08), snow: th(v0 + 0.16), snowShade: th(v0 + 0.12),
    trim: th(v0 + 0.06), glass: th(v0 + 0.22), lit: th(0.44), lit2: th(0.4), litGlow: thc(0.5), door: th(v0 + 0.1), chimney: th(0.32), glowAmt: 0.3, thermal: true,
  };
}

// ---------------------------------------------------------------- vector pieces
function pine(ctx, x, h, pal, k) {
  const w = h * (0.42 + k * 0.1), tiers = 4;
  ctx.fillStyle = pal.trunk; ctx.fillRect(x - h * 0.025, -h * 0.12, h * 0.05, h * 0.13);
  for (let i = 0; i < tiers; i++) {
    const y0 = -h * 0.1 - i * h * 0.21, tw = w * (1 - i * 0.2), top = y0 - h * 0.34;
    ctx.beginPath(); ctx.moveTo(x - tw / 2, y0); ctx.quadraticCurveTo(x - tw * 0.12, y0 - h * 0.08, x, top); ctx.quadraticCurveTo(x + tw * 0.12, y0 - h * 0.08, x + tw / 2, y0); ctx.closePath();
    ctx.fillStyle = pal.needle; ctx.fill();
    // snow on the tier
    ctx.beginPath(); ctx.moveTo(x - tw * 0.36, y0 - h * 0.05); ctx.quadraticCurveTo(x - tw * 0.1, y0 - h * 0.12, x, top + h * 0.02); ctx.quadraticCurveTo(x + tw * 0.14, y0 - h * 0.13, x + tw * 0.4, y0 - h * 0.035);
    ctx.quadraticCurveTo(x + tw * 0.1, y0 - h * 0.1, x, top + h * 0.09); ctx.quadraticCurveTo(x - tw * 0.08, y0 - h * 0.09, x - tw * 0.36, y0 - h * 0.05); ctx.closePath();
    ctx.fillStyle = pal.snow; ctx.fill();
  }
}

function drawWindowGeneric(ctx, L, wx, wy, ww, wh, lit, pal, sc) {
  ctx.fillStyle = lit ? pal.lit : pal.glass; ctx.fillRect(wx, wy, ww, wh);
  if (lit) { const g = ctx.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, pal.lit); g.addColorStop(1, pal.lit2); ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh); }
  const fw = Math.max(ww * 0.09, 1.2 / sc);
  ctx.strokeStyle = pal.trim; ctx.lineWidth = fw; ctx.strokeRect(wx, wy, ww, wh);
  ctx.lineWidth = fw * 0.6; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh * 0.45); ctx.lineTo(wx + ww, wy + wh * 0.45); ctx.stroke();
  // sill snow
  ctx.fillStyle = pal.snow; ctx.beginPath(); ctx.ellipse(wx + ww / 2, wy + wh + fw * 0.6, ww * 0.62, fw * 1.1, 0, Math.PI, 0); ctx.fill();
}

// generic / hero house. Local origin = bottom centre of the front face.
function drawHouse(ctx, L, h, pal, sc, t, hero, frostP) {
  const hw = h.w / 2, wh = h.wallH, rise = h.rise, dx = h.depth * 0.5, dy = -h.depth * 0.3, e = 14 * h.w / 240;
  const px1 = 1 / sc;
  ctx.lineJoin = 'round';
  let A, ER, EL;
  if (h.type === 'front') {
    const m = rise / hw;
    A = [0, -wh - rise]; ER = [hw + e, -wh + e * m]; EL = [-hw - e, -wh + e * m];
    poly(ctx, [A, EL, [EL[0] + dx, EL[1] + dy], [A[0] + dx, A[1] + dy]]); ctx.fillStyle = pal.snowShade; ctx.fill();
    poly(ctx, [[hw, 0], [hw, -wh], [hw + dx, -wh + dy], [hw + dx, dy]]); ctx.fillStyle = pal.side; ctx.fill();
    if (h.sideWin) sideWindow(ctx, h, pal, hw, wh, dx, dy);
    poly(ctx, [A, ER, [ER[0] + dx, ER[1] + dy], [A[0] + dx, A[1] + dy]]);
    const rg = ctx.createLinearGradient(A[0], A[1], ER[0], ER[1]); rg.addColorStop(0, pal.snow); rg.addColorStop(1, pal.snowShade); ctx.fillStyle = rg; ctx.fill();
    poly(ctx, [ER, [ER[0] + dx, ER[1] + dy], [ER[0] + dx, ER[1] + dy + 5 * h.w / 240], [ER[0], ER[1] + 5 * h.w / 240]]); ctx.fillStyle = pal.roofEdge; ctx.fill();
    if (h.chimney || hero) chimney(ctx, L, h, pal, A, ER, dx, dy, t, sc, hero);
    // front face
    poly(ctx, [[-hw, 0], [-hw, -wh], A, [hw, -wh], [hw, 0]]); ctx.fillStyle = pal.wall; ctx.fill();
    const fg = ctx.createLinearGradient(-hw, A[1], hw * 0.6, 0); fg.addColorStop(0, pal.wallHi); fg.addColorStop(0.55, pal.wall); fg.addColorStop(1, pal.wallLo); ctx.fillStyle = fg; ctx.fill();
    if (hero && sc > 1.4 && !pal.thermal) siding(ctx, L, hw, wh, A, sc);
    // gable trim: fascia + snow ridge
    ctx.lineCap = 'round';
    ctx.strokeStyle = pal.roofEdge; ctx.lineWidth = 7 * h.w / 240; ctx.beginPath(); ctx.moveTo(EL[0], EL[1] + 2); ctx.lineTo(A[0], A[1] + 2); ctx.lineTo(ER[0], ER[1] + 2); ctx.stroke();
    ctx.strokeStyle = pal.snow; ctx.lineWidth = 6 * h.w / 240; ctx.beginPath(); ctx.moveTo(EL[0], EL[1] - 2.5); ctx.lineTo(A[0], A[1] - 2.5); ctx.lineTo(ER[0], ER[1] - 2.5); ctx.stroke();
    if (h.attic && !hero) { const rr = h.w * 0.05; ctx.fillStyle = h.attic.lit ? pal.lit : pal.glass; ctx.beginPath(); ctx.arc(0, -wh - rise * 0.42, rr, 0, 7); ctx.fill(); ctx.strokeStyle = pal.trim; ctx.lineWidth = rr * 0.3; ctx.stroke(); }
    if (hero) { // round attic window
      ctx.fillStyle = pal.thermal ? pal.glass : '#FFC468'; ctx.beginPath(); ctx.arc(0, -wh - 34, 11, 0, 7); ctx.fill();
      if (!pal.thermal) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowRGB(ctx, 0, -wh - 34, 34, pal.litGlow, 0.22); ctx.restore(); }
      ctx.strokeStyle = pal.trim; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -wh - 34, 11, 0, 7); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-11, -wh - 34); ctx.lineTo(11, -wh - 34); ctx.moveTo(0, -wh - 45); ctx.lineTo(0, -wh - 23); ctx.stroke();
    }
  } else {
    const R1 = [-hw + dx / 2 - e * 0.3, -wh - rise + dy / 2], R2 = [hw + dx / 2 + e * 0.3, -wh - rise + dy / 2];
    poly(ctx, [[hw, 0], [hw, -wh], [hw + dx / 2, -wh - rise + dy / 2], [hw + dx, -wh + dy], [hw + dx, dy]]); ctx.fillStyle = pal.side; ctx.fill();
    if (h.sideWin) sideWindow(ctx, h, pal, hw, wh, dx, dy);
    EL = [-hw - e, -wh + 3]; ER = [hw + e, -wh + 3]; A = [0, R1[1]];
    poly(ctx, [EL, ER, R2, R1]);
    const rg = ctx.createLinearGradient(0, R1[1], 0, EL[1]); rg.addColorStop(0, pal.snow); rg.addColorStop(1, pal.snowShade); ctx.fillStyle = rg; ctx.fill();
    ctx.fillStyle = pal.roofEdge; ctx.fillRect(EL[0], EL[1], ER[0] - EL[0], 5 * h.w / 240);
    if (h.chimney) { const cx = -hw * 0.45, base = -wh - rise * 0.55, cw = 18 * h.w / 240; ctx.fillStyle = pal.chimney; ctx.fillRect(cx, base - 34 * h.w / 240, cw, 34 * h.w / 240 + 6); ctx.fillStyle = pal.snow; ctx.fillRect(cx - 2, base - 37 * h.w / 240, cw + 4, 5 * h.w / 240); }
    ctx.fillStyle = pal.wall; ctx.fillRect(-hw, -wh, h.w, wh);
    const fg = ctx.createLinearGradient(-hw, -wh, hw * 0.6, 0); fg.addColorStop(0, pal.wallHi); fg.addColorStop(0.55, pal.wall); fg.addColorStop(1, pal.wallLo); ctx.fillStyle = fg; ctx.fillRect(-hw, -wh, h.w, wh);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-hw, -wh, h.w, 8 * h.w / 240);
  }
  // corner boards
  ctx.fillStyle = pal.trim; ctx.globalAlpha *= 0.55; ctx.fillRect(-hw, -wh, 4 * h.w / 240, wh); ctx.fillRect(hw - 4 * h.w / 240, -wh, 4 * h.w / 240, wh); ctx.globalAlpha /= 0.55;
  if (hero) {
    heroDoor(ctx, L, pal, sc, t);
    heroWindow(ctx, L, t, sc, frostP, pal);
  } else {
    for (const w of h.wins) drawWindowGeneric(ctx, L, w.x, w.y, w.w, w.h, w.lit, pal, sc);
    if (h.door) { const d = h.door; ctx.fillStyle = pal.door; ctx.fillRect(d.x, d.y, d.w, d.h); ctx.strokeStyle = pal.trim; ctx.lineWidth = d.w * 0.08; ctx.strokeRect(d.x, d.y, d.w, d.h); }
    if (pal.glowAmt > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const w of h.wins) if (w.lit) { glowRGB(ctx, w.x + w.w / 2, w.y + w.h / 2, w.w * 1.9, pal.litGlow, 0.3 * pal.glowAmt); if (!pal.thermal) glowRGB(ctx, w.x + w.w / 2, 8, w.w * 2.4, pal.litGlow, 0.1 * pal.glowAmt); }
      ctx.restore();
    }
  }
  // snow drift along the base
  const kk = h.w / 240;
  poly(ctx, [[hw, 2], [hw + dx + 4 * kk, dy + 2], [hw + dx + 4 * kk, dy - 5 * kk], [hw, -7 * kk]]); ctx.fillStyle = pal.snowShade; ctx.fill();
  ctx.fillStyle = pal.snow; ctx.beginPath(); ctx.moveTo(-hw - 16 * kk, 2);
  const nb = 7; for (let i = 0; i <= nb; i++) { const x = -hw - 16 * kk + (h.w + 26 * kk) * i / nb; ctx.quadraticCurveTo(x - h.w / nb / 2, -(5 + ((i * 37) % 5)) * kk, x, 1); }
  ctx.lineTo(hw + 10 * kk, 8); ctx.lineTo(-hw - 16 * kk, 8); ctx.closePath(); ctx.fill();
  return { A, ER, EL };
}
function sideWindow(ctx, h, pal, hw, wh, dx, dy) {
  const u0 = 0.38, u1 = 0.6, y0 = -wh * 0.76, y1 = -wh * 0.38;
  const P = (u, y) => [hw + dx * u, y + dy * u];
  poly(ctx, [P(u0, y0), P(u1, y0), P(u1, y1), P(u0, y1)]); ctx.fillStyle = h.sideWin.lit ? pal.lit2 : pal.glass; ctx.fill();
  ctx.strokeStyle = pal.trim; ctx.globalAlpha *= 0.7; ctx.lineWidth = 2.2 * h.w / 240; ctx.stroke(); ctx.globalAlpha /= 0.7;
}
function chimney(ctx, L, h, pal, A, ER, dx, dy, t, sc, hero) {
  const P = [A[0] + (ER[0] - A[0]) * 0.45 + dx * 0.6, A[1] + (ER[1] - A[1]) * 0.45 + dy * 0.6], k = h.w / 240;
  const cw = 20 * k, chh = 48 * k, sdx = 8 * k, sdy = -5 * k;
  poly(ctx, [[P[0] + cw / 2, P[1] - chh], [P[0] + cw / 2 + sdx, P[1] - chh + sdy], [P[0] + cw / 2 + sdx, P[1] + 4 + sdy], [P[0] + cw / 2, P[1] + 4]]); ctx.fillStyle = pal.side; ctx.fill();
  ctx.fillStyle = pal.chimney; ctx.fillRect(P[0] - cw / 2, P[1] - chh, cw, chh + 6 * k);
  ctx.fillStyle = pal.snow; poly(ctx, [[P[0] - cw / 2 - 2 * k, P[1] - chh + 1], [P[0] - cw / 2 - 1 * k, P[1] - chh - 4 * k], [P[0] + cw / 2 + sdx + 1, P[1] - chh + sdy - 4 * k], [P[0] + cw / 2 + sdx + 2 * k, P[1] - chh + sdy + 1]]); ctx.fill();
  if ((h.smoke || hero) && !pal.thermal) { // soft smoke wisps rising and drifting right
    for (let i = 0; i < 7; i++) {
      const ph = mod(t * 0.22 + i / 7, 1), x = P[0] + 4 * k + ph * 70 * k + Math.sin(t * 0.9 + i * 1.7) * 6 * k, y = P[1] - chh - ph * 120 * k;
      ctx.fillStyle = `rgba(200,215,232,${0.14 * Math.sin(Math.PI * ph)})`; ctx.beginPath(); ctx.arc(x, y, (6 + ph * 18) * k, 0, 7); ctx.fill();
    }
  }
}
function siding(ctx, L, hw, wh, A, sc) {
  ctx.save(); poly(ctx, [[-hw, 0], [-hw, -wh], A, [hw, -wh], [hw, 0]]); ctx.clip();
  const a = clamp((sc - 1.4) / 2) * 0.16;
  ctx.beginPath(); for (let y = -6; y > A[1]; y -= 9) { ctx.moveTo(-hw, y); ctx.lineTo(hw, y); }
  ctx.strokeStyle = `rgba(4,14,30,${a})`; ctx.lineWidth = 1.3 / sc; ctx.stroke();
  ctx.beginPath(); for (let y = -7.2; y > A[1]; y -= 9) { ctx.moveTo(-hw, y); ctx.lineTo(hw, y); }
  ctx.strokeStyle = `rgba(200,225,255,${a * 0.45})`; ctx.lineWidth = 1 / sc; ctx.stroke();
  ctx.restore();
}
function heroDoor(ctx, L, pal, sc, t) {
  const d = DOOR;
  if (!pal.thermal) { // warm light leaking under the door
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowRGB(ctx, d.x + d.w / 2, -1, 26, pal.litGlow, 0.18); ctx.restore();
  }
  ctx.fillStyle = pal.trim; ctx.fillRect(d.x - 4, d.y - 4, d.w + 8, d.h + 4);
  ctx.fillStyle = pal.door; ctx.fillRect(d.x, d.y, d.w, d.h);
  const dg = ctx.createLinearGradient(d.x, 0, d.x + d.w, 0); dg.addColorStop(0, 'rgba(255,255,255,0.06)'); dg.addColorStop(1, 'rgba(0,0,0,0.22)'); ctx.fillStyle = dg; ctx.fillRect(d.x, d.y, d.w, d.h);
  // panels
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1.2;
  ctx.strokeRect(d.x + 6, d.y + 36, d.w / 2 - 9, 22); ctx.strokeRect(d.x + d.w / 2 + 3, d.y + 36, d.w / 2 - 9, 22);
  ctx.strokeRect(d.x + 6, d.y + 64, d.w / 2 - 9, 22); ctx.strokeRect(d.x + d.w / 2 + 3, d.y + 64, d.w / 2 - 9, 22);
  // small lit pane
  ctx.fillStyle = pal.thermal ? pal.glass : '#FFC468'; ctx.fillRect(d.x + 8, d.y + 8, d.w - 16, 20);
  ctx.strokeStyle = pal.trim; ctx.lineWidth = 2; ctx.strokeRect(d.x + 8, d.y + 8, d.w - 16, 20); ctx.beginPath(); ctx.moveTo(d.x + d.w / 2, d.y + 8); ctx.lineTo(d.x + d.w / 2, d.y + 28); ctx.stroke();
  ctx.fillStyle = '#E8B04A'; ctx.beginPath(); ctx.arc(d.x + d.w - 7, d.y + 52, 1.8, 0, 7); ctx.fill();
  if (!pal.thermal) { ctx.fillStyle = 'rgba(255,190,100,0.9)'; ctx.fillRect(d.x + 1, -1.6, d.w - 2, 1.1); }
  // step + snow
  ctx.fillStyle = pal.trim; ctx.globalAlpha *= 0.6; ctx.fillRect(d.x - 8, -1, d.w + 16, 4); ctx.globalAlpha /= 0.6;
}
// hero window: warm interior, curtains, glass reflections, frost, frame, sill snow, icicles
function heroWindow(ctx, L, t, sc, frostP, pal) {
  const { x, y, w, h } = WIN, thermal = pal.thermal;
  if (!thermal) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowRGB(ctx, x + w / 2, y + h * 0.6, 95, pal.litGlow, 0.2); glowRGB(ctx, x + w / 2, 8, 80, pal.litGlow, 0.12); ctx.restore(); }
  // frame (outer)
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 6 * sc; ctx.shadowOffsetY = 1.5 * sc;
  ctx.fillStyle = pal.trim; ctx.fillRect(x - 6, y - 6, w + 12, h + 12); ctx.restore();
  // glass interior
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (!thermal) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#FFD592'); g.addColorStop(0.6, '#F7A957'); g.addColorStop(1, '#D9813C'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    glowRGB(ctx, x + w * 0.66, y + h * 0.36, w * 0.62, [255, 244, 214], 0.85);
    if (sc > 1.2) {
      // curtains (soft folds)
      for (const side of [-1, 1]) {
        const cx = side < 0 ? x : x + w, cw = w * (side < 0 ? 0.24 : 0.17);
        ctx.beginPath(); ctx.moveTo(cx, y - 1); ctx.lineTo(cx - side * cw, y - 1);
        ctx.bezierCurveTo(cx - side * cw * 0.7, y + h * 0.4, cx - side * cw * 1.1, y + h * 0.7, cx - side * cw * 0.85, y + h + 1); ctx.lineTo(cx, y + h + 1); ctx.closePath();
        ctx.fillStyle = 'rgba(172,78,40,0.88)'; ctx.fill();
        ctx.strokeStyle = 'rgba(110,40,20,0.45)'; ctx.lineWidth = 0.5;
        for (let k = 1; k < 4; k++) { const fx = cx - side * cw * k / 4.2; ctx.beginPath(); ctx.moveTo(fx, y); ctx.quadraticCurveTo(fx - side * 1.5, y + h * 0.5, fx - side * cw * 0.1, y + h); ctx.stroke(); }
      }
      // a candle on the inner sill: tiny warm flame (cosy cue, reads at any scale)
      const fl = 1 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 11.1);
      ctx.fillStyle = 'rgba(150,72,34,0.8)'; ctx.fillRect(x + w * 0.73, y + h - 7, 3.2, 7);
      glowRGB(ctx, x + w * 0.73 + 1.6, y + h - 9, 9 * fl, [255, 236, 190], 0.9);
      ctx.fillStyle = '#FFF6DC'; ctx.beginPath(); ctx.ellipse(x + w * 0.73 + 1.6, y + h - 9, 0.9, 1.9 * fl, 0, 0, 7); ctx.fill();
      // cool reflections on the glass
      ctx.fillStyle = 'rgba(214,236,255,0.10)';
      poly(ctx, [[x + w * 0.05, y + h], [x + w * 0.3, y], [x + w * 0.42, y], [x + w * 0.17, y + h]]); ctx.fill();
      poly(ctx, [[x + w * 0.5, y + h], [x + w * 0.75, y], [x + w * 0.8, y], [x + w * 0.55, y + h]]); ctx.fill();
    }
  } else {
    ctx.fillStyle = th(0.1); ctx.fillRect(x, y, w, h);
  }
  // frost per pane
  if (frostP > 0) {
    for (const pn of G.panes) {
      ctx.save(); ctx.beginPath(); ctx.rect(pn.x, pn.y, pn.w, pn.h); ctx.clip();
      ctx.translate(pn.x + pn.w / 2, pn.y + pn.h / 2); ctx.scale(pn.w / 2, pn.h / 2);
      const r0 = Math.max(0.05, 1.25 - frostP * 0.75);
      const fg = ctx.createRadialGradient(0, 0, r0 * 0.55, 0, 0, 1.5);
      const fc = thermal ? '143,211,255' : '236,248,255';
      fg.addColorStop(0, `rgba(${fc},0)`); fg.addColorStop(0.45, `rgba(${fc},${0.18 * frostP})`); fg.addColorStop(1, `rgba(${fc},${(thermal ? 0.35 : 0.72) * frostP})`);
      ctx.fillStyle = fg; ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
    ctx.save(); ctx.beginPath(); for (const pn of G.panes) ctx.rect(pn.x, pn.y, pn.w, pn.h); ctx.clip();
    const pxw = Math.max(0.55 / sc, 0);
    if (thermal) drawFrost(ctx, G.frost, frostP, [0.3, 0.2, 0.14].map(v => Math.max(v, pxw)), 'rgba(143,211,255,0.55)', null, 1);
    else drawFrost(ctx, G.frost, frostP, [0.3, 0.19, 0.13].map(v => Math.max(v, pxw)), 'rgba(248,253,255,0.9)', 'rgba(180,225,255,0.16)', 3.6);
    ctx.restore();
  }
  // inner shadow of the frame on the glass
  ctx.fillStyle = 'rgba(40,20,10,0.22)'; ctx.fillRect(x, y, w, 1.2); ctx.fillRect(x, y, 1.2, h);
  ctx.restore();
  // mullions + frame bevel
  const pw = (w - MUL) / 2, ph = (h - MUL) / 2;
  ctx.fillStyle = pal.trim; ctx.fillRect(x + pw, y, MUL, h); ctx.fillRect(x, y + ph, w, MUL);
  if (!thermal) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 6, y - 6, w + 12, 0.9); ctx.fillRect(x - 6, y - 6, 0.9, h + 12);
    ctx.fillStyle = 'rgba(30,50,80,0.28)'; ctx.fillRect(x - 6, y + h + 5.1, w + 12, 0.9); ctx.fillRect(x + w + 5.1, y - 6, 0.9, h + 12);
    ctx.fillStyle = 'rgba(30,50,80,0.25)'; ctx.fillRect(x + pw + MUL - 0.6, y, 0.6, h); ctx.fillRect(x, y + ph + MUL - 0.6, w, 0.6);
  }
  // lintel + icicles
  ctx.fillStyle = pal.trim; ctx.fillRect(x - 10, y - 11, w + 20, 5);
  ctx.fillStyle = pal.snow; ctx.beginPath(); ctx.moveTo(x - 11, y - 11); ctx.quadraticCurveTo(x + w / 2, y - 16, x + w + 11, y - 11); ctx.closePath(); ctx.fill();
  if (!thermal) {
    const ic = [[0.1, 7], [0.22, 4], [0.37, 9], [0.55, 5], [0.7, 8], [0.86, 4.5]];
    for (const [u, l] of ic) {
      const ix = x - 8 + (w + 16) * u, iy = y - 6;
      const g = ctx.createLinearGradient(ix, iy, ix, iy + l); g.addColorStop(0, 'rgba(235,248,255,0.95)'); g.addColorStop(1, 'rgba(160,215,255,0.35)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ix - 1.1, iy); ctx.lineTo(ix + 1.1, iy); ctx.lineTo(ix + 0.1, iy + l); ctx.closePath(); ctx.fill();
    }
  }
  // sill + snow mound
  ctx.fillStyle = pal.trim; ctx.fillRect(x - 10, y + h + 6, w + 20, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 9, y + h + 10, w + 18, 1.6);
  ctx.fillStyle = pal.snow; ctx.beginPath(); ctx.moveTo(x - 11, y + h + 6.5);
  ctx.bezierCurveTo(x + 2, y + h + 1.5, x + 10, y + h + 3.5, x + w * 0.3, y + h + 2.6); ctx.bezierCurveTo(x + w * 0.55, y + h + 1.6, x + w * 0.7, y + h + 3.8, x + w + 11, y + h + 6.5); ctx.closePath(); ctx.fill();
}

// foreground of the hero plot: trodden path to the door, footprints, glittering snow, low garden fence
function heroGround(ctx, L, t, sc) {
  const d0 = DOOR.x, d1 = DOOR.x + DOOR.w;
  ctx.beginPath(); ctx.moveTo(d0 - 2, 1); ctx.bezierCurveTo(d0 - 10, 50, -40, 90, -150, 230); ctx.lineTo(-20, 230); ctx.bezierCurveTo(30, 110, d1 + 6, 60, d1 + 2, 1); ctx.closePath();
  const pg = ctx.createLinearGradient(0, 0, 0, 230); pg.addColorStop(0, 'rgba(70,98,138,0.55)'); pg.addColorStop(1, 'rgba(70,98,138,0.25)'); ctx.fillStyle = pg; ctx.fill();
  ctx.fillStyle = 'rgba(40,62,98,0.5)';
  for (let i = 0; i < 9; i++) {
    const u = (i + 0.5) / 9, cx = L.lerp((d0 + d1) / 2, -85, Math.pow(u, 1.25)) + (i % 2 ? 6 : -6) * (1 + u), cy = 8 + u * 210, sz = 1 + u * 1.2;
    ctx.beginPath(); ctx.ellipse(cx, cy, 2.6 * sz, 1.3 * sz, -0.4, 0, 7); ctx.fill();
  }
  // glitter on the snow (slow, soft twinkle)
  for (const [x, y, ph, a] of G.glitter) {
    const k = a * Math.max(0, Math.sin(t * 0.8 + ph)) ** 3; if (k < 0.04) continue;
    const r = 2.6 / sc * (0.6 + k);
    ctx.strokeStyle = `rgba(235,248,255,${k})`; ctx.lineWidth = 1 / sc; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
  }
}
function heroFence(ctx, L, sc) {
  const y = 96;
  ctx.fillStyle = '#22344B';
  for (const x0 of [[-640, -190], [130, 420]]) {
    ctx.fillRect(x0[0], y - 30, x0[1] - x0[0], 3.4); ctx.fillRect(x0[0], y - 15, x0[1] - x0[0], 3.4);
    for (let x = x0[0]; x <= x0[1]; x += 30) ctx.fillRect(x - 2.6, y - 40, 5.2, 42);
  }
  ctx.fillStyle = '#E3EFFA';
  for (const x0 of [[-640, -190], [130, 420]]) for (let x = x0[0]; x <= x0[1]; x += 30) { L.roundRect(ctx, x - 4, y - 44, 8, 5, 2.5); ctx.fill(); }
  ctx.fillStyle = 'rgba(227,239,250,0.9)'; ctx.beginPath(); ctx.moveTo(-1650, y + 4);
  for (let x = -1650; x <= 1450; x += 55) ctx.quadraticCurveTo(x + 27, y - 4 - (Math.abs(x) % 3), x + 55, y + 4);
  ctx.lineTo(1505, y + 260); ctx.lineTo(-1650, y + 260); ctx.closePath();
  const dg = ctx.createLinearGradient(0, y, 0, y + 160); dg.addColorStop(0, 'rgba(214,230,246,0.95)'); dg.addColorStop(0.12, 'rgba(160,188,218,0.9)'); dg.addColorStop(1, 'rgba(84,112,152,0.9)');
  ctx.fillStyle = dg; ctx.fill();
}

// ---------------------------------------------------------------- world layers
function drawSky(ctx, L, t, cam, thermal) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (!thermal) { g.addColorStop(0, '#030A17'); g.addColorStop(0.38, '#0A2140'); g.addColorStop(0.56, '#17406A'); g.addColorStop(1, '#0E2A47'); }
  else { g.addColorStop(0, '#02060F'); g.addColorStop(0.5, '#071631'); g.addColorStop(1, '#0A1B3A'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (thermal) return;
  const mx = 300 - (cam.x + 175) * 0.06, my = 170;
  L.glow(ctx, mx, my, 520, ICE, 0.10); L.glow(ctx, mx, my, 160, '#DDF5FF', 0.22);
  ctx.fillStyle = '#EAF5FF'; ctx.beginPath(); ctx.arc(mx, my, 30, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(150,180,215,0.12)'; ctx.beginPath(); ctx.arc(mx - 8, my - 6, 7, 0, 7); ctx.arc(mx + 10, my + 8, 5, 0, 7); ctx.arc(mx + 4, my - 12, 3.5, 0, 7); ctx.fill();
  // stars batched into three brightness buckets (one path each), slow gentle twinkle
  for (let b = 0; b < 3; b++) {
    ctx.beginPath();
    for (const [x, y, r, ph, a] of G.stars) {
      const k = a * (0.8 + 0.2 * Math.sin(t * 0.9 + ph)), bi = k < 0.4 ? 0 : k < 0.58 ? 1 : 2; if (bi !== b) continue;
      const sx = mod(x - (cam.x + 175) * 0.08, W); ctx.moveTo(sx + r, y); ctx.arc(sx, y, r, 0, 6.2832);
    }
    ctx.fillStyle = `rgba(220,238,255,${[0.32, 0.5, 0.68][b]})`; ctx.fill();
  }
}
function groundBand(ctx, L, P, seed, c0, c1, amp, depthPx) {
  if (P.oy > H + 40) return;
  ctx.beginPath(); ctx.moveTo(-20, H + 20);
  for (let sx = -20; sx <= W + 60; sx += 40) { const wx = (sx - P.ox) / P.s; ctx.lineTo(sx, P.oy + (L.noise1(wx * 0.0032, seed) * amp - amp * 0.5) * P.s); }
  ctx.lineTo(W + 20, H + 20); ctx.closePath();
  const g = ctx.createLinearGradient(0, P.oy - amp * P.s, 0, Math.min(H + 400, P.oy + depthPx)); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fill();
}
function drawHills(ctx, L, cam, sh, thermal) {
  const cols = thermal ? [['#071530', '#06112A'], ['#081A38', '#061229']] : [['#203E66', '#16304F'], ['#2B4D78', '#1A3658']];
  G.hills.forEach((hl, i) => {
    const P = plane(cam, hl.D, sh);
    ctx.beginPath(); ctx.moveTo(-20, H + 20);
    for (const [x, y] of hl.pts) { const sx = P.ox + x * P.s; if (sx < -300 || sx > W + 300) continue; ctx.lineTo(sx, P.oy + y * P.s); }
    ctx.lineTo(W + 20, H + 20); ctx.closePath();
    const g = ctx.createLinearGradient(0, P.oy - 900 * P.s, 0, P.oy); g.addColorStop(0, cols[i][0]); g.addColorStop(1, cols[i][1]); ctx.fillStyle = g; ctx.fill();
    if (!thermal) { ctx.strokeStyle = 'rgba(170,205,240,0.12)'; ctx.lineWidth = 1.5; ctx.stroke(); }
  });
}
function rowLayer(ctx, L, t, cam, sh, D, houses, pines, fog, thermal, groundCols, seed, opts = {}) {
  const P = plane(cam, D, sh);
  if (opts.alpha !== undefined && opts.alpha <= 0.002) return P;
  ctx.save(); if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
  groundBand(ctx, L, P, seed, groundCols[0], groundCols[1], opts.amp || 10, opts.depthPx || 260);
  const pinePal = thermal ? { trunk: th(0.05), needle: th(0.07), snow: th(0.12) } : { trunk: L.mixColor('#1B2A33', HAZE, fog), needle: L.mixColor('#0E2B3A', HAZE, fog), snow: L.mixColor('#DCEAF7', HAZE, fog * 0.9) };
  ctx.translate(P.ox, P.oy); ctx.scale(P.s, P.s);
  const vis = (x0, x1) => P.ox + x1 * P.s > -50 && P.ox + x0 * P.s < W + 50;
  for (const [x, hgt, k] of pines) if (vis(x - hgt * 0.3, x + hgt * 0.3)) pine(ctx, x, hgt, pinePal, k);
  for (const h of houses) {
    if (!vis(h.x - h.w * 0.7, h.x + h.w * 0.7 + h.depth * 0.5)) continue;
    if (!h._pal) h._pal = {};
    const key = thermal ? 'T' + D : 'N' + D;
    if (!h._pal[key]) h._pal[key] = thermal ? thermPal(L, D > 2000 ? 0.1 : D > 1200 ? 0.13 : 0.16) : nightPal(L, h.wall, fog);
    ctx.save(); ctx.translate(h.x, 0); drawHouse(ctx, L, h, h._pal[key], P.s, t, false, 0); ctx.restore();
  }
  if (opts.after) opts.after(P);
  ctx.restore();
  return P;
}

// snow: three parallax layers in screen space; they stream outward while the camera dollies in
const SNOW = {
  far: { seed: 31, count: 170, size: 1.15, speed: 22, wind: 9, sway: 8, alpha: 0.45, k: 0.12, par: 0.25, gust: 120 },
  mid: { seed: 32, count: 95, size: 2.2, speed: 48, wind: 18, sway: 14, alpha: 0.62, k: 0.3, par: 0.7, gust: 260 },
  near: { seed: 33, count: 30, size: 7.5, speed: 85, wind: 30, sway: 22, alpha: 0.55, k: 0.52, par: 1.5, gust: 420, flake: true },
};
function snowLayer(ctx, L, t, cam, which, thermal, K) {
  const c = SNOW[which], r = L.rng(c.seed), M = 90, WW = W + 2 * M, HH = H + 2 * M;
  const zf = Math.pow(cam.s, c.k), px = -(cam.x + 175) * c.par * Math.pow(cam.s, 0.5), gi = gustInt(t, K.gustA, K.gustB) * c.gust;
  const col = thermal ? '143,211,255' : '238,247,255', aMul = thermal ? 0.45 : 1;
  ctx.save(); ctx.lineCap = 'round';
  const dots = c.flake ? null : [new Path2DLike(), new Path2DLike(), new Path2DLike()];
  if (c.flake) ctx.beginPath();
  for (let i = 0; i < c.count; i++) {
    const x0 = r() * WW, y0 = r() * HH, ph = r() * 6.283, sp = 0.75 + r() * 0.5, sz = c.size * (0.55 + r() * 0.9), rot = r() * 6.28;
    let x = x0 + (t * c.wind + gi) * sp + Math.sin(t * 0.6 + ph) * c.sway + px, y = y0 + t * c.speed * sp;
    x = mod(x, WW) - M; y = mod(y, HH) - M;
    x = W / 2 + (x - W / 2) * zf; y = H / 2 + (y - H / 2) * zf;
    x = mod(x + M, WW) - M; y = mod(y + M, HH) - M;
    const s = sz * Math.pow(zf, 0.55);
    if (!c.flake) { const bi = sp < 0.92 ? 0 : sp < 1.08 ? 1 : 2; dots[bi].push(x, y, s); }
    else {
      const a = rot + t * 0.35 * (sp - 0.6);
      for (let k = 0; k < 3; k++) { const aa = a + k * Math.PI / 3, cx = Math.cos(aa) * s, cy = Math.sin(aa) * s; ctx.moveTo(x - cx, y - cy); ctx.lineTo(x + cx, y + cy); }
      for (let k = 0; k < 6; k++) { const aa = a + k * Math.PI / 3, bx = x + Math.cos(aa) * s * 0.6, by = y + Math.sin(aa) * s * 0.6; for (const sd of [-1, 1]) { const a2 = aa + sd * 0.75; ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a2) * s * 0.32, by + Math.sin(a2) * s * 0.32); } }
    }
  }
  if (c.flake) { ctx.strokeStyle = `rgba(${col},${c.alpha * aMul})`; ctx.lineWidth = 1.6 * Math.pow(zf, 0.4); ctx.stroke(); }
  else for (let b = 0; b < 3; b++) {
    const d = dots[b].a; if (!d.length) continue; ctx.beginPath();
    for (let i = 0; i < d.length; i += 3) { ctx.moveTo(d[i] + d[i + 2], d[i + 1]); ctx.arc(d[i], d[i + 1], d[i + 2], 0, 6.2832); }
    ctx.fillStyle = `rgba(${col},${c.alpha * aMul * (0.55 + 0.45 * [0.83, 1.0, 1.17][b])})`; ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- wind (house-local)
function drawWind(ctx, L, t, sc, K) {
  const off = K.wind0 - 8.55;
  ctx.save();
  for (const w of G.wind) {
    const st = w.st + off, tail = 0.36, p = (t - st) / w.dur;
    if (p <= 0 || p - tail >= 1) continue;
    const uh = p, ut = p - tail, a = Math.max(0, ut), b = Math.min(1, uh);
    if (b - a < 0.003) continue;
    const N = 30, left = [], right = [], wMax = w.w * 1.3 / sc;
    for (let i = 0; i <= N; i++) {
      const u = a + (b - a) * i / N, [x, y, nx, ny] = sampleAt(w.path, u), k = (u - ut) / (uh - ut);
      const ww = wMax * Math.pow(Math.sin(Math.PI * clamp(k)), 0.85) * 0.5;
      left.push([x + nx * ww, y + ny * ww]); right.push([x - nx * ww, y - ny * ww]);
    }
    const fade = Math.min(1, (1 - ut) * 3.5);
    // soft ice glow under the stroke
    ctx.beginPath(); for (let i = 0; i <= N; i++) { const q = left[i], q2 = right[i]; const mx = (q[0] + q2[0]) / 2, my = (q[1] + q2[1]) / 2; i ? ctx.lineTo(mx, my) : ctx.moveTo(mx, my); }
    ctx.strokeStyle = `rgba(143,211,255,${0.2 * fade})`; ctx.lineWidth = wMax * 3.4; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left[0][0], left[0][1]); for (const q of left) ctx.lineTo(q[0], q[1]); for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]); ctx.closePath();
    ctx.fillStyle = `rgba(246,251,255,${0.95 * fade})`; ctx.fill();
    // faint echo line
    ctx.beginPath(); for (let i = 0; i <= 20; i++) { const u = a + (b - a) * (0.2 + 0.8 * i / 20), [x, y, nx, ny] = sampleAt(w.path, u), o = 7 / sc; i ? ctx.lineTo(x + nx * o, y + ny * o) : ctx.moveTo(x + nx * o, y + ny * o); }
    ctx.strokeStyle = `rgba(210,236,255,${0.45 * fade})`; ctx.lineWidth = 1.5 / sc; ctx.stroke();
    // snow grains carried by the gust
    for (let j = 0; j < 7; j++) {
      const u = uh - 0.02 - j * 0.045; if (u <= 0 || u >= 1) continue;
      const [x, y, nx, ny] = sampleAt(w.path, u), o = L.noise1(j * 3.1 + w.st, 4) * 12 / sc;
      ctx.fillStyle = `rgba(255,255,255,${0.75 * fade})`; ctx.beginPath(); ctx.arc(x + nx * o, y + ny * o, (1.3 + (j % 3) * 0.5) / sc, 0, 7); ctx.fill();
    }
  }
  // gaps: thin dark cracks that light up when a gust slips in
  const crackA = clamp((t - K.wind0 - 0.7) / 0.8);
  if (crackA > 0) {
    ctx.strokeStyle = `rgba(6,14,28,${0.6 * crackA})`; ctx.lineWidth = 1.3 / sc; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-78.6, -46); ctx.lineTo(-78.6, -37); ctx.moveTo(-78.6, -112); ctx.lineTo(-78.6, -103); ctx.moveTo(35, -62); ctx.lineTo(35, -42); ctx.moveTo(40, -1.4); ctx.lineTo(76, -1.4); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const w of G.wind) {
    if (w.gap < 0) continue;
    const arrive = w.st + off + w.dur, gl = bump(t, arrive - 0.12, 0.9);
    if (gl <= 0) continue;
    const [gx, gy] = GAPS[w.gap];
    glowRGB(ctx, gx, gy, 34 / sc, [143, 211, 255], 0.8 * gl);
    glowRGB(ctx, gx, gy, 9 / sc, [255, 255, 255], 0.95 * gl);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- thermal cutaway (house-local units)
function drawCutaway(ctx, L, t, sc, K, amp) {
  const wm = amp.warm;
  const v = x => x * (0.74 + 0.26 * wm);   // everything warm dims a little at the end
  const m = HERO.rise / HW, e = 14 * HERO.w / 240, ex = HW + e, ey = -HERO.wallH + e * m, ap = -HERO.wallH - HERO.rise;
  ctx.save();
  // earth around the basement
  const eg = ctx.createLinearGradient(0, 0, 0, 220); eg.addColorStop(0, th(0.1)); eg.addColorStop(1, th(0.03)); ctx.fillStyle = eg; ctx.fillRect(-900, 0, 1800, 260);
  ctx.strokeStyle = th(0.16, 0.45); ctx.lineWidth = 0.6; ctx.beginPath(); for (let i = 0; i < 5; i++) { const y = 24 + i * 22; ctx.moveTo(-900, y); for (let x = -900; x <= 900; x += 60) ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 2); } ctx.stroke();
  // heat bleeding into the ground around the basement (grows with the pipe cue)
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glowRGB(ctx, -HW - 12, 50, 70, thc(v(0.6)), 0.3 * amp.pipe); glowRGB(ctx, HW + 12, 50, 70, thc(v(0.6)), 0.3 * amp.pipe); glowRGB(ctx, 0, 98, 95, thc(v(0.6)), 0.24 * amp.pipe);
  ctx.restore();
  // snow crust on the ground
  ctx.fillStyle = th(0.24, 0.9); ctx.fillRect(-900, -2.2, 1800, 2.2);
  // attic + roof
  poly(ctx, [[-HI, -130], [0, ap + 9], [HI, -130]]);
  const ag = ctx.createLinearGradient(0, ap, 0, -130); ag.addColorStop(0, th(v(0.18))); ag.addColorStop(1, th(v(0.32))); ctx.fillStyle = ag; ctx.fill();
  ctx.strokeStyle = th(v(0.28), 0.6); ctx.lineWidth = 1.2; ctx.beginPath(); for (const x of [-64, 0, 64]) { ctx.moveTo(x, -130); ctx.lineTo(x, ap + 9 + Math.abs(x) * m); } ctx.stroke();
  poly(ctx, [[-ex, ey], [0, ap], [ex, ey], [ex, ey + 9], [0, ap + 9], [-ex, ey + 9]]); ctx.fillStyle = th(v(0.22)); ctx.fill();
  ctx.strokeStyle = th(0.32, 0.9); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-ex - 2, ey - 1.5); ctx.lineTo(0, ap - 2); ctx.lineTo(ex + 2, ey - 1.5); ctx.stroke();
  // room air: violet → plum, warm only around the sources
  const rg = ctx.createLinearGradient(0, -122, 0, 0); rg.addColorStop(0, th(v(0.45))); rg.addColorStop(1, th(v(0.35))); ctx.fillStyle = rg; ctx.fillRect(-HI, -122, HI * 2, 122);
  glowRGB(ctx, WIN.x + WIN.w / 2, WIN.y + WIN.h / 2, 62, thc(0.28), 0.75);          // cold zone around the window
  glowRGB(ctx, WIN.x + WIN.w / 2, -24, 92, thc(v(0.84)), 0.55 * wm);                  // radiator
  glowRGB(ctx, 100, -88, 58, thc(v(0.92)), 0.75 * wm);                                // lamp
  // ceiling slab
  const cg = ctx.createLinearGradient(0, -130, 0, -122); cg.addColorStop(0, th(v(0.28))); cg.addColorStop(1, th(v(0.5))); ctx.fillStyle = cg; ctx.fillRect(-HW, -130, HW * 2, 8);
  // picture, sofa, floor lamp
  ctx.fillStyle = th(v(0.4)); ctx.fillRect(28, -94, 44, 30); ctx.strokeStyle = th(v(0.52)); ctx.lineWidth = 1.5; ctx.strokeRect(28, -94, 44, 30);
  ctx.fillStyle = th(v(0.5));
  L.roundRect(ctx, 16, -36, 66, 20, 5); ctx.fill(); L.roundRect(ctx, 12, -20, 74, 14, 4); ctx.fill();
  L.roundRect(ctx, 8, -28, 10, 24, 4); ctx.fill(); L.roundRect(ctx, 80, -28, 10, 24, 4); ctx.fill();
  ctx.fillRect(16, -6, 3, 6); ctx.fillRect(77, -6, 3, 6);
  ctx.fillStyle = th(v(0.6)); ctx.fillRect(99, -84, 2.2, 84); ctx.beginPath(); ctx.ellipse(100, -0.8, 9, 2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = th(v(0.98)); poly(ctx, [[93, -102], [107, -102], [111, -86], [89, -86]]); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const lg = ctx.createLinearGradient(0, -86, 0, -10); lg.addColorStop(0, th(v(0.9), 0.32 * wm)); lg.addColorStop(1, th(v(0.9), 0));
  ctx.fillStyle = lg; poly(ctx, [[89, -86], [111, -86], [HI - 2, -8], [72, -8]]); ctx.fill();
  ctx.restore();
  // window on the back wall (same window, frosted — a cold spot in the thermal view)
  heroWindow(ctx, L, t, sc, 1, G.thermPalHero);
  // radiator + pipes
  const rx = WIN.x - 2, ry = -40, rw = 56, rh = 30;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowRGB(ctx, rx + rw / 2, ry + rh / 2, 56, thc(v(0.95)), 0.5 * wm); ctx.restore();
  for (let i = 0; i < 9; i++) { L.roundRect(ctx, rx + i * (rw / 9) + 0.6, ry, rw / 9 - 1.2, rh, 2); ctx.fillStyle = th(v(0.9 + (i % 2) * 0.05)); ctx.fill(); }
  ctx.fillStyle = th(v(0.98)); ctx.fillRect(rx, ry + 3, rw, 2.2); ctx.fillRect(rx, ry + rh - 5, rw, 2.2);
  // convection: warm air curling up from the radiator
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const ph = mod(t * 0.45 + i * 0.25, 1), bx = rx + 8 + i * 13;
    ctx.beginPath(); for (let k = 0; k <= 5; k++) { const yy = ry + 2 - ph * 10 - k * 1.6, xx = bx + Math.sin(k * 0.9 + t * 2.4 + i) * 1.6; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.strokeStyle = th(v(0.9), 0.3 * Math.sin(Math.PI * ph) * wm); ctx.lineWidth = 1.1; ctx.stroke();
  }
  // walls (section): warm inner face → cold outer face, with leak hot-spots
  for (const side of [-1, 1]) {
    const xo = side * HW, xi = side * HI, x0 = Math.min(xo, xi);
    const wg = ctx.createLinearGradient(xi, 0, xo, 0); wg.addColorStop(0, th(v(0.5))); wg.addColorStop(1, th(0.13)); ctx.fillStyle = wg; ctx.fillRect(x0, -130, WT, 139);
    const bg = ctx.createLinearGradient(xi, 0, xo, 0); bg.addColorStop(0, th(0.28)); bg.addColorStop(1, th(0.1)); ctx.fillStyle = bg; ctx.fillRect(x0, 9, WT, 75);
  }
  // floor slab
  const fg = ctx.createLinearGradient(0, 0, 0, 9); fg.addColorStop(0, th(v(0.46))); fg.addColorStop(1, th(0.2)); ctx.fillStyle = fg; ctx.fillRect(-HW, 0, HW * 2, 9);
  // basement
  const bgr = ctx.createLinearGradient(0, 9, 0, 75); bgr.addColorStop(0, th(0.25)); bgr.addColorStop(1, th(0.17)); ctx.fillStyle = bgr; ctx.fillRect(-HI, 9, HI * 2, 66);
  ctx.fillStyle = th(0.13); ctx.fillRect(-HW - 6, 75, HW * 2 + 12, 11);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const spots = [[-HW + WT / 2, -62], [-HW + WT / 2, -100], [HW - WT / 2, -40], [HW - WT / 2, -96]];
  spots.forEach(([sx, sy], i) => {
    const a = amp.wall * (0.85 + 0.15 * Math.sin(t * 2.1 + i * 1.7));
    glowRGB(ctx, sx, sy, 24, thc(v(0.88)), 0.8 * a);
    glowRGB(ctx, sx + Math.sign(sx) * 24, sy - 8, 38, thc(v(0.62)), 0.42 * a);
  });
  [[-40, 4.5], [40, 4.5]].forEach(([sx, sy], i) => { const a = amp.floor * (0.85 + 0.15 * Math.sin(t * 2.3 + i)); glowRGB(ctx, sx, sy, 24, thc(v(0.88)), 0.8 * a); glowRGB(ctx, sx, sy + 22, 36, thc(v(0.6)), 0.4 * a); });
  ctx.restore();
  // boiler
  ctx.fillStyle = th(v(0.56)); L.roundRect(ctx, 82, 20, 28, 55, 3); ctx.fill();
  ctx.fillStyle = th(v(1)); ctx.fillRect(90, 54, 12, 8);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowRGB(ctx, 96, 58, 22, thc(v(0.95)), 0.6 * wm); ctx.restore();
  // bare pipes (hot, unprotected)
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const pa = 0.35 + 0.65 * amp.pipe;
  glowRGB(ctx, 0, 54, 125, thc(v(0.8)), 0.26 * pa); glowRGB(ctx, -82, 10, 50, thc(v(0.8)), 0.22 * pa);
  ctx.restore();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pipe = (pts, r) => {
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = th(v(0.8), 0.3 * pa); ctx.lineWidth = r * 4.5; ctx.stroke();
    ctx.strokeStyle = th(v(0.94)); ctx.lineWidth = r * 2; ctx.stroke();
    ctx.strokeStyle = th(v(1), 0.8); ctx.lineWidth = r * 0.7; ctx.stroke();
  };
  pipe([[82, 50], [-82, 50], [-82, -17], [rx, -17]], 3.0);
  pipe([[rx + rw, -14], [-12, -14], [-12, 62], [82, 62]], 2.6);
  // heat shimmer above the bare pipes
  for (let i = 0; i < 6; i++) {
    const ph = mod(t * 0.5 + i / 6, 1), bx = -70 + i * 27;
    ctx.beginPath(); for (let k = 0; k <= 8; k++) { const yy = 45 - ph * 14 - k * 2, xx = bx + Math.sin(k * 0.7 + t * 3 + i) * 2.2; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.strokeStyle = th(v(0.85), 0.32 * Math.sin(Math.PI * ph) * pa); ctx.lineWidth = 1.0; ctx.stroke();
  }
  ctx.restore();
}
function sparkPos(sp, u) {
  // piecewise-linear with a slow passage through the wall/slab (segment 2)
  const w = [0.42, 0.26, 0.32]; let acc = 0;
  for (let i = 0; i < 3; i++) {
    if (u <= acc + w[i] || i === 2) { const f = clamp((u - acc) / w[i]), a = sp.pts[i], b = sp.pts[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, i, f]; }
    acc += w[i];
  }
}
function drawSparks(ctx, L, t, P, amp) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const starts = { wall: amp.wallStart, floor: amp.floorStart, pipe: amp.pipeStart };
  const amts = { wall: amp.wall, floor: amp.floor, pipe: amp.pipe };
  for (const sp of G.sparks) {
    const a0 = amts[sp.fam]; if (a0 <= 0.01) continue;
    const ct = (t - starts[sp.fam]) / sp.T + sp.ph; if (ct < sp.ph) continue;
    const u = ct - Math.floor(ct), cycleStart = t - u * sp.T;
    if (cycleStart < starts[sp.fam] - 0.01) continue;
    const [lx, ly, seg, f] = sparkPos(sp, u);
    const [qx, qy] = sparkPos(sp, Math.max(0, u - 0.045));
    const temp = seg === 0 ? 0.95 - f * 0.1 : seg === 1 ? 0.85 - f * 0.33 : 0.52 - f * 0.42;
    const fade = Math.min(1, u * 8) * (u > 0.68 ? 1 - (u - 0.68) / 0.32 : 1) * a0 * (0.75 + 0.25 * amp.warm);
    const x = P.ox + lx * P.s, y = P.oy + ly * P.s, sz = sp.sz * P.s / 2.4;
    const si = Math.round(clamp((temp - 0.08) / 0.92) * 31), sp2 = G.sparkSpr[si], R = 17 * sz;
    ctx.globalAlpha = 0.6 * fade; ctx.drawImage(sp2.c, x - R, y - R, R * 2, R * 2); ctx.globalAlpha = 1;
    // short motion trail (two-step alpha instead of a gradient)
    const qx2 = P.ox + qx * P.s, qy2 = P.oy + qy * P.s, mx = (qx2 + x) / 2, my = (qy2 + y) / 2;
    ctx.lineCap = 'round'; ctx.lineWidth = 2.4 * sz;
    ctx.strokeStyle = `rgba(${sp2.cs},${0.22 * fade})`; ctx.beginPath(); ctx.moveTo(qx2, qy2); ctx.lineTo(mx, my); ctx.stroke();
    ctx.strokeStyle = `rgba(${sp2.cs},${0.6 * fade})`; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = `rgba(${sp2.cs},${0.95 * fade})`;
    ctx.beginPath(); ctx.arc(x, y, 2.8 * sz, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- overlays: headline + thermometer + viewfinder
function drawHeadline(ctx, L, t, K) {
  const { ep, ease } = L;
  const p1 = ep(t, K.title, 1.0, 'linear'), p2 = ep(t, K.title + 0.35, 0.9, 'linear');
  if (p1 <= 0) return;
  // accent bar
  const bp = ease.outCubic(L.prog(t, K.title - 0.1, 0.7));
  ctx.fillStyle = L.rgba(L.C.brandHi, bp); L.roundRect(ctx, HL.x, HL.y1 - HL.size - 38, 64 * bp, 5, 2.5); ctx.fill();
  const sh = { color: 'rgba(0,6,20,0.55)', blur: 30, y: 6 };
  L.revealText(ctx, HL.l1, HL.x, HL.y1, p1, { role: 'display', size: HL.size, color: '#F6FAFF', stagger: 0.2, maxWidth: 1400 });
  L.revealText(ctx, HL.l2, HL.x, HL.y2, p2, { role: 'display', size: HL.size, color: '#F6FAFF', stagger: 0.2, maxWidth: 1400 });
  // hoarfrost creeping up the letters
  const gp = ease.inOutSine(L.prog(t, K.title + 1.0, 3.2));
  if (gp <= 0) return;
  const front = L.lerp(HM.h + 30, -60, gp);
  // icy tint: glyph shape only
  const x2 = G.hlTmp2.getContext('2d');
  x2.globalCompositeOperation = 'source-over'; x2.clearRect(0, 0, HM.w, HM.h);
  const g = x2.createLinearGradient(0, front - 50, 0, front + 70); g.addColorStop(0, 'rgba(150,212,255,0)'); g.addColorStop(1, 'rgba(150,212,255,0.6)');
  x2.fillStyle = g; x2.fillRect(0, 0, HM.w, HM.h);
  x2.globalCompositeOperation = 'destination-in'; x2.drawImage(G.hlMaskF, 0, 0); x2.globalCompositeOperation = 'source-over';
  ctx.drawImage(G.hlTmp2, HM.ox, HM.oy);
  // crystals + glints: may bristle slightly past the glyph edges (dilated mask)
  const x = G.hlTmp.getContext('2d');
  x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, HM.w, HM.h);
  drawFrost(x, G.hlFrost, gp * 1.05, [1.5, 1.0, 1.0], 'rgba(255,255,255,0.92)', null, 1);
  // sparkle glints on frosted letters
  for (const [gx, gy, ph, a] of G.hlGlints) {
    const k = clamp((gp - (1 - gy / HM.h) * 0.8) * 4) * a * (0.5 + 0.5 * Math.sin(t * 1.6 + ph));
    if (k <= 0.02) continue;
    x.strokeStyle = `rgba(255,255,255,${k})`; x.lineWidth = 1.4; x.beginPath(); x.moveTo(gx - 7, gy); x.lineTo(gx + 7, gy); x.moveTo(gx, gy - 7); x.lineTo(gx, gy + 7); x.stroke();
  }
  x.globalCompositeOperation = 'destination-in'; x.drawImage(G.hlMask, 0, 0); x.globalCompositeOperation = 'source-over';
  ctx.drawImage(G.hlTmp, HM.ox, HM.oy);
}
function drawThermo(ctx, L, t, K) {
  const { ease, prog, lerp } = L;
  const p = ease.outCubic(prog(t, K.thermo, 0.8));
  if (p <= 0) return;
  const level = lerp(0.88, 0.16, ease.inOutSine(prog(t, K.thermoDrop, K.thermoDropEnd - K.thermoDrop)));
  const cold = clamp((0.88 - level) / 0.72);
  const LQ = ['#FF8A3A', '#E8506A', '#9A6BE8', ICE], lq = cold * 3, li = Math.min(2, Math.floor(lq));
  const liquid = L.mixColor(LQ[li], LQ[li + 1], lq - li);
  const { x, y, len } = THERMO, R = 28, th2 = 32;
  ctx.save(); ctx.globalAlpha *= p; ctx.translate(-(1 - p) * 30, 0);
  // ticks
  ctx.strokeStyle = 'rgba(220,236,255,0.5)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i <= 12; i++) { const tx = x + 52 + i * (len - 76) / 12, tl = i % 3 === 0 ? 16 : 9; ctx.moveTo(tx, y - th2 / 2 - 10); ctx.lineTo(tx, y - th2 / 2 - 10 - tl); }
  ctx.stroke();
  // glass
  ctx.beginPath(); ctx.arc(x, y, R, 0.55, Math.PI * 2 - 0.55); ctx.lineTo(x + len, y - th2 / 2); ctx.arc(x + len, y, th2 / 2, -Math.PI / 2, Math.PI / 2); ctx.closePath();
  ctx.fillStyle = 'rgba(200,225,255,0.08)'; ctx.fill(); ctx.strokeStyle = 'rgba(225,240,255,0.78)'; ctx.lineWidth = 3; ctx.stroke();
  // liquid
  const lx = lerp(x + 34, x + len - 6, level);
  ctx.fillStyle = liquid; ctx.beginPath(); ctx.arc(x, y, R - 8, 0, 7); ctx.fill();
  L.roundRect(ctx, x, y - 8, lx - x, 16, 8); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; L.glow(ctx, x, y, 80, liquid, 0.28); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.38)'; L.roundRect(ctx, x + 22, y - 6, Math.max(0, lx - x - 30), 3, 1.5); ctx.fill();
  // snowflake grows in as it gets cold
  L.drawIcon(ctx, 'snowflake', x + len + 62, y, 50, ICE, clamp(cold * 1.6 - 0.2), 6);
  ctx.restore();
}
function drawViewfinder(ctx, L, t, P, q) {
  if (q <= 0) return;
  const x0 = P.ox - (HW + 34) * P.s, x1 = P.ox + (HW + 34) * P.s, y0 = P.oy - 238 * P.s, y1 = P.oy + 98 * P.s, l = 44;
  ctx.save(); ctx.globalAlpha *= q * 0.6; ctx.strokeStyle = ICE; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { ctx.moveTo(cx + sx * l, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * l); }
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- full views
function drawNight(ctx, L, t, cam, sh, K, frostP) {
  drawSky(ctx, L, t, cam, false);
  drawHills(ctx, L, cam, sh, false);
  rowLayer(ctx, L, t, cam, sh, DEPTH.far, G.far, G.pinesFar, 0.5, false, ['#6C8DB4', '#4E6E97'], 3, { amp: 14, depthPx: 140 });
  snowLayer(ctx, L, t, cam, 'far', false, K);
  rowLayer(ctx, L, t, cam, sh, DEPTH.mid, G.mid, G.pinesMid, 0.28, false, ['#86A6CA', '#5F80A8'], 5, { amp: 12, depthPx: 200 });
  rowLayer(ctx, L, t, cam, sh, DEPTH.hero, G.heroRow, G.pinesHero, 0, false, ['#A9C3DE', '#5C7DA6'], 7, {
    amp: 8, depthPx: 300,
    after: P => {
      ctx.save(); ctx.translate(HERO.x, 0);
      heroGround(ctx, L, t, P.s);
      drawHouse(ctx, L, HERO, G.nightPalHero, P.s, t, true, frostP);
      heroFence(ctx, L, P.s);
        if (t > K.wind0 - 0.4 && t < K.scan + 1.2) drawWind(ctx, L, t, P.s, K);
      ctx.restore();
    },
  });
  snowLayer(ctx, L, t, cam, 'mid', false, K);
  // near foreground: pines, fence, drifts (fade as the camera flies past them)
  const Pn = plane(cam, DEPTH.near, sh), na = clamp(L.remap(Pn.s, 2.6, 4.2, 1, 0));
  if (na > 0) {
    rowLayer(ctx, L, t, cam, sh, DEPTH.near, [], G.pinesNear, 0, false, ['#BFD3E8', '#6F8FB6'], 9, {
      amp: 16, depthPx: 260, alpha: na,
    });
  }
  snowLayer(ctx, L, t, cam, 'near', false, K);
}
function drawThermal(ctx, L, t, cam, sh, K, amp) {
  drawSky(ctx, L, t, cam, true);
  drawHills(ctx, L, cam, sh, true);
  rowLayer(ctx, L, t, cam, sh, DEPTH.far, G.far, G.pinesFar, 0, true, [th(0.07), th(0.05)], 3, { amp: 14, depthPx: 140 });
  snowLayer(ctx, L, t, cam, 'far', true, K);
  rowLayer(ctx, L, t, cam, sh, DEPTH.mid, G.mid, G.pinesMid, 0, true, [th(0.08), th(0.05)], 5, { amp: 12, depthPx: 200 });
  const P = rowLayer(ctx, L, t, cam, sh, DEPTH.hero, G.heroRow, G.pinesHero, 0, true, [th(0.1), th(0.04)], 7, {
    amp: 8, depthPx: 300,
    after: Pp => { ctx.save(); ctx.translate(HERO.x, 0); drawCutaway(ctx, L, t, Pp.s, K, amp); ctx.restore(); },
  });
  drawSparks(ctx, L, t, P, amp);
  snowLayer(ctx, L, t, cam, 'mid', true, K);
  snowLayer(ctx, L, t, cam, 'near', true, K);
  return P;
}

module.exports = {
  draw(ctx, t, d, L, env) {
    if (!G) G = build(L);
    if (!G.nightPalHero) { G.nightPalHero = nightPal(L, HERO.wall, 0); G.thermPalHero = thermPal(L, 0.4); }
    const { ease, prog, clamp: cl } = L;
    const cues = (env && env.cues) || [];
    const T0 = cues[0] ? cues[0].start : 3.0, T1 = cues[1] ? cues[1].start : 6.167, T2 = cues[2] ? cues[2].start : 11.467;
    const K = {
      push: T0 - 0.45, pushEnd: T1 - 0.17, pull: T1 + 2.18, pullEnd: T1 + 3.68,
      wind0: T1 + 2.38, gustA: T1 + 2.1, gustB: T2 - 0.1,
      frost: T1 - 0.45, scan: T2 - 0.8, title: T2 - 0.25,
      thermo: T2 + 0.9, thermoDrop: T2 + 1.9, thermoDropEnd: T2 + 5.9,
      dim: T2 + 5.45,
    };
    const cam = camera(L, t, K);
    const sh = { x: L.noise1(t * 0.23, 3) * 5, y: L.noise1(t * 0.19, 7) * 3.5 };
    const frostP = ease.outQuad(prog(t, K.frost, 3.9));
    const q = ease.inOutCubic(prog(t, K.scan, 0.8));
    const scanX = L.lerp(-140, W + 140, q);
    // heat-loss amounts, staged to the words «стіни» / «підлогу» / «незахищені труби»
    const amp = {
      wallStart: T2 + 2.2, floorStart: T2 + 3.55, pipeStart: T2 + 4.4,
      warm: 1 - 0.3 * ease.inOutSine(prog(t, K.dim, 1.6)),
    };
    amp.wall = 0.25 + 0.75 * ease.outCubic(prog(t, amp.wallStart - 0.3, 1.0));
    amp.floor = 0.15 + 0.85 * ease.outCubic(prog(t, amp.floorStart - 0.3, 1.0));
    amp.pipe = 0.3 + 0.7 * ease.outCubic(prog(t, amp.pipeStart - 0.3, 1.0));

    let Pt = null;
    if (q < 1) drawNight(ctx, L, t, cam, sh, K, frostP);
    if (q > 0) {
      ctx.save();
      if (q < 1) { ctx.beginPath(); ctx.rect(0, 0, scanX, H); ctx.clip(); }
      Pt = drawThermal(ctx, L, t, cam, sh, K, amp);
      // left scrim so the headline sits on a calm field
      const sg = ctx.createLinearGradient(0, 0, 1050, 0); sg.addColorStop(0, 'rgba(2,8,20,0.72)'); sg.addColorStop(0.6, 'rgba(2,8,20,0.45)'); sg.addColorStop(1, 'rgba(2,8,20,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, 1050, H);
      drawViewfinder(ctx, L, t, Pt, ease.outCubic(prog(t, K.scan + 0.55, 0.7)));
      ctx.restore();
    }
    if (q > 0 && q < 1) { // thermal scan line
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(scanX - 120, 0, scanX + 30, 0);
      g.addColorStop(0, 'rgba(143,211,255,0)'); g.addColorStop(0.8, 'rgba(143,211,255,0.28)'); g.addColorStop(1, 'rgba(143,211,255,0)');
      ctx.fillStyle = g; ctx.fillRect(scanX - 120, 0, 150, H);
      ctx.fillStyle = 'rgba(230,246,255,0.9)'; ctx.fillRect(scanX - 1.5, 0, 3, H);
      ctx.restore();
    }
    if (t > K.title - 0.2) { drawHeadline(ctx, L, t, K); drawThermo(ctx, L, t, K); }
    L.vignette(ctx, 0.5);
    // fade in from black at the very start of the ad
    const fi = 1 - ease.inOutSine(prog(t, 0, 1.4));
    if (fi > 0) { ctx.fillStyle = `rgba(0,0,0,${fi})`; ctx.fillRect(0, 0, W, H); }
  },
};
