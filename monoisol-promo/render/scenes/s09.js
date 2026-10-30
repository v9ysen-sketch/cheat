'use strict';
// Scene 9 — «Чому Моноізол».
// Light warm stage with brand green/silver accents. «Чому MONOISOL?» is typed in the centre, the «?» flips into a
// check and the headline docks top-left. Five reason cards flip in (3D, Y axis) one per voice line and form a 3 + 2
// grid; older cards recede. At the end the cards are pulled into a degree ring that morphs into a shield badge with a
// glowing house, and «Кожен градус — під захистом» flashes underneath.

const INK = '#0B2240', INK2 = '#44546A', GREEN = '#24884A', AMBER = '#F0A23B';
const CARD_R = 26;

// ---------- layout ----------
const MX = 120, GAP = 32, TOP = 212, R1H = 306, R2H = 380;
const W1 = (1920 - 2 * MX - 2 * GAP) / 3, W2 = (1920 - 2 * MX - GAP) / 2;
const CARDS = [
  { x: MX, y: TOP, w: W1, h: R1H, vh: 206 },
  { x: MX + W1 + GAP, y: TOP, w: W1, h: R1H, vh: 206 },
  { x: MX + 2 * (W1 + GAP), y: TOP, w: W1, h: R1H, vh: 206 },
  { x: MX, y: TOP + R1H + GAP, w: W2, h: R2H, vh: 274 },
  { x: MX + W2 + GAP, y: TOP + R1H + GAP, w: W2, h: R2H, vh: 274 },
];
const LABELS = ['Виробник з 2010 року', 'Контроль на всіх етапах', 'Незалежні сертифіковані лабораторії', 'Українські та європейські норми', 'Доставка по всій Україні'];
const BADGE = { x: 960, y: 452 };

// ---------- timing (derived from the voice cues, with fallbacks) ----------
function timing(env) {
  const c = (k, def) => (env && env.cues && env.cues[k] ? env.cues[k].start : def);
  const c0 = c(0, 0.667), c1 = c(1, 2.567), c2 = c(2, 7.2), c3 = c(3, 11.267), c4 = c(4, 15.067);
  // Each card's face is fully turned 0.4 s after its flip starts, so flips start ~0.5 s before the cue (face and label
  // land ~0.1–0.2 s ahead of the words). Card 2 lands on «контроль якості» (≈ c1 + 1.68 s in the voice line), the
  // wholesale pill ~0.45 s before «оптом і вроздріб» (≈ c4 + 2.58 s). The headline docks before the card backs rise.
  return {
    type0: c0 - 0.36, type1: c0 + 0.42, qflip: c0 + 0.6, move: c0 + 0.95, moveDur: 0.6,
    backs: c0 + 1.18,
    flips: [c1 - 0.45, c1 + 1.28, c2 - 0.5, c3 - 0.5, c4 - 0.5],
    pill: c4 + 2.12,
    collapse: c4 + 2.82,
  };
}
const FLIP_DUR = 0.8;
// back-rise order: bottom row first (the headline is still docking over the top row), then the top row
const APPEAR_DELAY = [0.16, 0.22, 0.28, 0, 0.07];
// collapse order: the delivery card (with «Опт і роздріб») is pulled in last, so it stays readable longest
const COLLAPSE_DELAY = [0, 0.035, 0.07, 0.105, 0.2];

// ---------- small helpers ----------
function checkPath(c, s) { c.beginPath(); c.moveTo(-30 * s, 2 * s); c.lineTo(-8 * s, 24 * s); c.lineTo(32 * s, -22 * s); }
// partial check stroke (p 0..1), centred at 0,0, s = scale (1 => ~62 px wide)
function drawCheck(c, L, x, y, s, p, color, lw) {
  if (p <= 0.001) return;
  const pts = [[-30, 2], [-8, 24], [32, -22]].map(([a, b]) => [x + a * s, y + b * s]);
  const k = L.clamp(p);
  c.save(); c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  if (k < 0.4) c.lineTo(L.lerp(pts[0][0], pts[1][0], k / 0.4), L.lerp(pts[0][1], pts[1][1], k / 0.4));
  else { c.lineTo(pts[1][0], pts[1][1]); const k2 = (k - 0.4) / 0.6; c.lineTo(L.lerp(pts[1][0], pts[2][0], k2), L.lerp(pts[1][1], pts[2][1], k2)); }
  c.stroke(); c.restore();
}
// green disc with white check (badge)
function checkBadge(c, L, x, y, r, p, { ring = '#FFFFFF', ringW = 0 } = {}) {
  if (p <= 0.001) return;
  const e = L.ease.outBack(L.clamp(p / 0.6));
  c.save(); c.translate(x, y); c.scale(e, e);
  if (ringW) { c.beginPath(); c.arc(0, 0, r + ringW, 0, Math.PI * 2); c.fillStyle = ring; c.fill(); }
  const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#3DB56C'); g.addColorStop(1, '#1E7A42');
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = g; c.fill();
  c.restore();
  drawCheck(c, L, x, y + r * 0.02, r / 52 * e, L.clamp((p - 0.25) / 0.6), '#FFFFFF', Math.max(3, r * 0.2));
}
// 5-point star
function star(c, x, y, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.42 : r, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }

// ---------- cached assets ----------
let MAP = null;
function mapSilhouette(L) { // ukraine_map flattened to one colour through its alpha channel (no city labels survive)
  if (MAP) return MAP;
  const im = L.img('ukraine_map'), c = L.offscreen(im.width, im.height), x = c.getContext('2d');
  x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#2E9A57'; x.fillRect(0, 0, im.width, im.height);
  MAP = c; return c;
}
const FB = { c: null, x: null };
function flipBuf(L) { if (!FB.c) { FB.c = L.offscreen(860, 400); FB.x = FB.c.getContext('2d'); } return FB; }

// shield outline sampled to N points (clockwise from top centre), in a ~76 x 96 box centred on 0,0
const N_PTS = 120;
let SHIELD = null, CIRCLE = null;
function shapes() {
  if (SHIELD) return;
  const dense = [];
  const line = (a, b) => { for (let i = 0; i < 30; i++) { const k = i / 30; dense.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); } };
  const bez = (p0, p1, p2, p3) => { for (let i = 0; i < 40; i++) { const k = i / 40, m = 1 - k; dense.push([m * m * m * p0[0] + 3 * m * m * k * p1[0] + 3 * m * k * k * p2[0] + k * k * k * p3[0], m * m * m * p0[1] + 3 * m * m * k * p1[1] + 3 * m * k * k * p2[1] + k * k * k * p3[1]]); } };
  const top = [0, -46], tr = [38, -34], r2 = [38, 0], bot = [0, 50], l2 = [-38, 0], tl = [-38, -34];
  bez(top, [12, -40], [26, -35], tr); line(tr, r2); bez(r2, [38, 24], [20, 40], bot); bez(bot, [-20, 40], [-38, 24], l2); line(l2, tl); bez(tl, [-26, -35], [-12, -40], top);
  dense.push(top);
  const acc = [0]; for (let i = 1; i < dense.length; i++) acc.push(acc[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const total = acc[acc.length - 1]; SHIELD = []; let j = 0;
  for (let i = 0; i < N_PTS; i++) {
    const s = (i / N_PTS) * total; while (acc[j + 1] < s) j++;
    const k = (s - acc[j]) / Math.max(1e-6, acc[j + 1] - acc[j]);
    SHIELD.push([dense[j][0] + (dense[j + 1][0] - dense[j][0]) * k, dense[j][1] + (dense[j + 1][1] - dense[j][1]) * k + 2]);
  }
  CIRCLE = []; for (let i = 0; i < N_PTS; i++) { const a = -Math.PI / 2 + (i / N_PTS) * Math.PI * 2; CIRCLE.push([Math.cos(a), Math.sin(a)]); }
}

// ---------- background ----------
function stage(ctx, L, t) {
  const { W, H, C } = L;
  const g = ctx.createLinearGradient(0, 0, W * 0.75, H * 1.15);
  g.addColorStop(0, '#FBF8F2'); g.addColorStop(0.5, '#F4EEE4'); g.addColorStop(1, '#E7DCCC');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  L.glow(ctx, 560 + Math.sin(t * 0.13) * 170, 330 + Math.cos(t * 0.11) * 90, 820, '#FFFFFF', 0.6);
  L.glow(ctx, 1480 + Math.cos(t * 0.09) * 150, 860 + Math.sin(t * 0.12) * 60, 760, '#F5C27E', 0.12);
  L.glow(ctx, 1320 + Math.sin(t * 0.07) * 120, 360, 640, C.brand, 0.05);
  // brand ring motif: two huge thin ellipses drifting slowly behind everything
  L.save(ctx, () => {
    ctx.translate(1180, 600); ctx.rotate(-0.16 + Math.sin(t * 0.05) * 0.025);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(142,147,153,0.20)';
    ctx.beginPath(); ctx.ellipse(0, 0, 980 + Math.sin(t * 0.2) * 10, 400, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(47,162,90,0.10)';
    ctx.beginPath(); ctx.ellipse(30, 10, 1060, 450 + Math.cos(t * 0.17) * 8, 0, 0, Math.PI * 2); ctx.stroke();
  });
  // warm dust motes
  const r = L.rng(909);
  for (let i = 0; i < 42; i++) {
    const x0 = r() * W, y0 = r() * H, d = r(), ph = r() * 6.28;
    const y = ((y0 - t * (6 + d * 14)) % H + H) % H, x = x0 + Math.sin(t * 0.35 + ph) * 22;
    ctx.fillStyle = L.rgba(i % 3 ? '#D7B488' : '#9FC9AE', (0.18 + 0.32 * d) * (0.7 + 0.3 * Math.sin(t * 0.9 + ph)));
    ctx.beginPath(); ctx.arc(x, y, 1.4 + d * 2.6, 0, Math.PI * 2); ctx.fill();
  }
}
function warmVignette(ctx, L) {
  const { W, H } = L;
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(110,80,40,0)'); g.addColorStop(1, 'rgba(110,80,40,0.13)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---------- headline «Чому MONOISOL?» ----------
let HL = null;
function headline(ctx, L, t, T) {
  const S = 104, P1 = 'Чому ', P2 = 'MONOISOL';
  if (!HL) {
    const chars = [...(P1 + P2)], xs = []; let acc = '';
    for (const ch of chars) { xs.push(L.measure(ctx, acc, 'display', S)); acc += ch; }
    const wText = L.measure(ctx, P1 + P2, 'display', S), wq = L.measure(ctx, '?', 'display', S);
    HL = { chars, xs, wText, wq, gap: S * 0.05, total: wText + S * 0.05 + wq };
  }
  const out = L.ep(t, T.collapse - 0.05, 0.45, 'inOutCubic');
  if (out >= 1) return;
  const mv = L.ep(t, T.move, T.moveDur, 'inOutCubic');
  const s = L.lerp(1, 60 / S, mv);
  const x0 = L.lerp(960 - HL.total / 2, MX, mv), y0 = L.lerp(578, 150, mv) - out * 20;
  const n = HL.chars.length, nP1 = [...P1].length;
  const tp = L.prog(t, T.type0, T.type1 - T.type0) * n; // chars typed (fractional)
  L.save(ctx, () => {
    ctx.globalAlpha *= 1 - out;
    ctx.translate(x0, y0); ctx.scale(s, s);
    for (let i = 0; i < n; i++) {
      const a = L.clamp(tp - i); if (a <= 0) break;
      const e = L.ease.outCubic(a);
      L.text(ctx, HL.chars[i], HL.xs[i], (1 - e) * 18, { role: 'display', size: S, color: i < nP1 ? INK : GREEN, alpha: e });
    }
    // cursor while typing
    // (before typing, i.e. during the push transition in, the cursor waits with a soft sine pulse — no hard blink)
    let cur = L.envelope(t, T.type0 - 0.1, T.type1 + 0.02, 0.1, 0.14);
    if (t < T.type0) cur = Math.max(cur, 0.4 + 0.45 * (0.5 + 0.5 * Math.cos((t - T.type0) * Math.PI * 2 / 0.9)));
    if (cur > 0) {
      const nc = Math.ceil(tp - 0.05), cx = nc >= n ? HL.wText + 10 : HL.xs[nc] + 2;
      ctx.fillStyle = L.rgba(GREEN, cur * 0.9); ctx.fillRect(cx, -S * 0.78, 7, S * 0.86);
    }
    // «?» → flips on the Y axis into a green check
    const qa = L.ep(t, T.type1 - 0.05, 0.3);
    const fl = L.prog(t, T.qflip, 0.5), ang = L.ease.inOutCubic(fl) * Math.PI;
    const qx = HL.wText + HL.gap + HL.wq / 2, qy = -S * 0.36;
    if (qa > 0) {
      ctx.save(); ctx.translate(qx, qy);
      const sx = Math.cos(ang);
      if (sx > 0) { ctx.scale(Math.max(0.02, sx), 1); L.text(ctx, '?', 0, S * 0.36 + (1 - qa) * 18, { role: 'display', size: S, color: INK, align: 'center', alpha: qa }); }
      else {
        ctx.scale(Math.max(0.02, -sx), 1);
        drawCheck(ctx, L, 4, 6, S / 100 * 1.0, L.clamp((fl - 0.5) / 0.5 * 1.3), GREEN, S * 0.17);
      }
      ctx.restore();
    }
  });
  // short brand bar above the docked headline (style-reference kicker line)
  const bar = L.ep(t, T.move + T.moveDur - 0.15, 0.6) * (1 - out);
  if (bar > 0) { ctx.fillStyle = L.rgba(GREEN, bar); L.roundRect(ctx, MX, 80, 64 * bar, 5, 2.5); ctx.fill(); }
}

// ---------- card faces ----------
function cardBack(c, L, i, w, h, t = 0) {
  const g = c.createLinearGradient(0, 0, w * 0.4, h);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#F1EBE1');
  L.roundRect(c, 0, 0, w, h, CARD_R); c.fillStyle = g; c.fill();
  c.save(); L.roundRect(c, 0, 0, w, h, CARD_R); c.clip();
  c.globalAlpha *= 0.22; c.fillStyle = c.createPattern(L.foamTile({ cell: 12, color: '#F6F2EC', shade: '#BFC5CC', seed: 17, size: 192 }), 'repeat'); c.fillRect(0, 0, w, h);
  c.globalAlpha = 1;
  const sx = (((t * 0.12 + i * 0.23) % 1.4) - 0.2) * (w + h);
  const sh = c.createLinearGradient(sx - 160, 0, sx + 160, h * 0.5);
  sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.55)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sh; c.fillRect(0, 0, w, h);
  c.restore();
  L.roundRect(c, 0, 0, w, h, CARD_R); c.lineWidth = 1.5; c.strokeStyle = 'rgba(11,34,64,0.07)'; c.stroke();
  const rx = Math.min(w * 0.2, 120), ry = rx * 0.44;
  const rg = c.createLinearGradient(w / 2 - rx, 0, w / 2 + rx, 0);
  rg.addColorStop(0, 'rgba(47,162,90,0.55)'); rg.addColorStop(0.5, 'rgba(195,198,202,0.8)'); rg.addColorStop(1, 'rgba(47,162,90,0.55)');
  c.lineWidth = 4; c.strokeStyle = rg; c.beginPath(); c.ellipse(w / 2, h / 2, rx, ry, 0, 0, Math.PI * 2); c.stroke();
  L.text(c, '0' + (i + 1), w / 2, h / 2 + 2, { role: 'displaySemi', size: 40, color: '#A3A9B1', align: 'center', baseline: 'middle' });
}

function cardFront(c, L, i, t, lt, T) {
  const k = CARDS[i], w = k.w, h = k.h, vh = k.vh;
  L.roundRect(c, 0, 0, w, h, CARD_R); c.fillStyle = '#FFFFFF'; c.fill();
  c.save(); L.roundRect(c, 0, 0, w, h, CARD_R); c.clip(); c.beginPath(); c.rect(0, 0, w, vh); c.clip();
  VIS[i](c, L, w, vh, t, lt, T);
  c.restore();
  c.fillStyle = 'rgba(11,34,64,0.07)'; c.fillRect(0, vh, w, 1.5);
  // label row: check badge + label (+ wholesale pill on the delivery card)
  const midY = vh + (h - vh) / 2, cp = L.prog(lt, 0.38, 0.55);
  checkBadge(c, L, 28 + 18, midY, 18, cp);
  const lines = L.wrap(c, LABELS[i], 'bodyBold', 32, w - 84 - 28);
  const tpp = L.ep(lt, 0.34, 0.55);
  lines.forEach((ln, li) => L.text(c, ln, 84 + (1 - tpp) * 16, midY + (li - (lines.length - 1) / 2) * 39 + 1, { role: 'bodyBold', size: 32, color: INK, baseline: 'middle', alpha: L.clamp(tpp * 1.3) }));
  if (i === 4) {
    const pp = L.prog(t, T.pill, 0.55);
    L.pill(c, 'Опт і роздріб', w - 28, midY, pp, { align: 'right', size: 28, color: '#FFFFFF', bg: GREEN, border: 'rgba(255,255,255,0)', icon: 'cart', iconColor: '#FFFFFF', padX: 24 });
  }
  L.roundRect(c, 0.75, 0.75, w - 1.5, h - 1.5, CARD_R); c.lineWidth = 1.5; c.strokeStyle = 'rgba(11,34,64,0.08)'; c.stroke();
}

const VIS = [
  // 1 — manufacturer since 2010: hd_category photo + «2010» stamp
  (c, L, w, vh, t, lt) => {
    const kb = L.ease.inOutSine(L.clamp(lt / 15));
    // framed high so the MONOISOL banner behind the tubes stays whole (no half-cut lettering), slow push-in
    L.drawCover(c, L.img('hd_category'), 0, 0, w, vh, L.lerp(1.02, 1.1, kb), L.lerp(0.3, 0.4, kb), 0);
    const g = c.createLinearGradient(0, vh * 0.55, 0, vh); g.addColorStop(0, 'rgba(11,34,64,0)'); g.addColorStop(1, 'rgba(11,34,64,0.22)');
    c.fillStyle = g; c.fillRect(0, 0, w, vh);
    const sp = L.prog(lt, 0.78, 0.5);
    if (sp > 0) {
      const e = L.ease.outBack(sp), x = w - 82, y = 80, r = 54;
      c.save(); c.translate(x, y); c.rotate(-0.2 + (1 - e) * 0.25); const sc = L.lerp(1.6, 1, e); c.scale(sc, sc); c.globalAlpha *= L.clamp(sp * 2.2);
      c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 16; c.shadowOffsetY = 6;
      c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,0.94)'; c.fill(); c.shadowColor = 'transparent';
      c.lineWidth = 4; c.strokeStyle = GREEN; c.beginPath(); c.arc(0, 0, r - 6, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r - 13, 0, Math.PI * 2); c.stroke();
      L.text(c, '2010', 0, 4, { role: 'display', size: 22, color: GREEN, align: 'center', baseline: 'middle' });
      L.uaRibbon(c, -15, 18, 30, 8, 1);
      c.fillStyle = GREEN; star(c, -22, -20, 4.5); star(c, 0, -25, 4.5); star(c, 22, -20, 4.5);
      c.restore();
      // ink ring burst
      const rb = L.prog(lt, 0.9, 0.5);
      if (rb > 0 && rb < 1) { c.strokeStyle = L.rgba(GREEN, 0.5 * (1 - rb)); c.lineWidth = 3; c.beginPath(); c.arc(x, y, r + 8 + rb * 30, 0, Math.PI * 2); c.stroke(); }
    }
  },
  // 2 — quality control at every stage: lam_red_stack + three-step line with checks
  (c, L, w, vh, t, lt) => {
    const kb = L.ease.inOutSine(L.clamp(lt / 15));
    L.drawCover(c, L.img('lam_red_stack'), 0, 0, w, vh, L.lerp(1.24, 1.34, kb), L.lerp(0.1, 0.2, kb), 0.8);
    const g = c.createLinearGradient(0, vh * 0.42, 0, vh); g.addColorStop(0, 'rgba(11,34,64,0)'); g.addColorStop(1, 'rgba(11,34,64,0.78)');
    c.fillStyle = g; c.fillRect(0, 0, w, vh);
    const xs = [w * 0.22, w * 0.5, w * 0.78], y = vh - 44, r = 19, steps = [0.75, 1.3, 1.85];
    const la = L.ep(lt, 0.4, 0.4);
    c.lineCap = 'round';
    c.strokeStyle = L.rgba('#FFFFFF', 0.4 * la); c.lineWidth = 4; c.beginPath(); c.moveTo(xs[0], y); c.lineTo(xs[0] + (xs[2] - xs[0]) * la, y); c.stroke();
    const gp = L.clamp(L.remap(lt, steps[0], steps[2], 0, 1));
    if (gp > 0) { c.strokeStyle = '#5BD68C'; c.lineWidth = 5; c.beginPath(); c.moveTo(xs[0], y); c.lineTo(L.lerp(xs[0], xs[2], gp), y); c.stroke(); }
    xs.forEach((x, j) => {
      const a = L.ep(lt, 0.45 + j * 0.08, 0.35);
      if (a <= 0) return;
      c.save(); c.globalAlpha *= a;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = 'rgba(11,34,64,0.55)'; c.fill();
      c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
      c.restore();
      const cp = L.prog(lt, steps[j], 0.5);
      if (cp > 0) {
        checkBadge(c, L, x, y, r + 2, cp);
        const pr = L.prog(lt, steps[j] + 0.1, 0.6);
        if (pr > 0 && pr < 1) { c.strokeStyle = L.rgba('#5BD68C', 0.7 * (1 - pr)); c.lineWidth = 3; c.beginPath(); c.arc(x, y, r + 4 + pr * 22, 0, Math.PI * 2); c.stroke(); }
      }
    });
  },
  // 3 — independent certified labs: animated flask with a check
  (c, L, w, vh, t, lt) => {
    const g = c.createLinearGradient(0, 0, w, vh); g.addColorStop(0, '#EEF7F1'); g.addColorStop(1, '#D9ECDF');
    c.fillStyle = g; c.fillRect(0, 0, w, vh);
    // faint molecule hexes
    c.strokeStyle = 'rgba(36,136,74,0.13)'; c.lineWidth = 2;
    const hex = (x, y, r, rot) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.stroke(); };
    hex(80, 62, 26, t * 0.1); hex(125, 88, 26, t * 0.1); hex(w - 92, vh - 58, 30, -t * 0.08); hex(w - 70, 52, 18, t * 0.12);
    const cx = w / 2, cy = vh / 2 + 10, sc = L.lerp(0.9, 1, L.ep(lt, 0.3, 0.6, 'outBack'));
    c.save(); c.translate(cx, cy); c.scale(sc, sc);
    const flask = () => { c.beginPath(); c.moveTo(-16, -74); c.lineTo(-16, -28); c.lineTo(-62, 52); c.quadraticCurveTo(-68, 66, -52, 66); c.lineTo(52, 66); c.quadraticCurveTo(68, 66, 62, 52); c.lineTo(16, -28); c.lineTo(16, -74); };
    c.save(); c.shadowColor = 'rgba(30,70,45,0.18)'; c.shadowBlur = 24; c.shadowOffsetY = 10; flask(); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fill(); c.restore();
    // liquid
    const lvl = L.lerp(66, 6, L.ep(lt, 0.45, 1.2, 'inOutCubic'));
    c.save(); flask(); c.closePath(); c.clip();
    const lg = c.createLinearGradient(0, lvl, 0, 66); lg.addColorStop(0, '#4CC27C'); lg.addColorStop(1, '#1F7E45');
    c.beginPath(); c.moveTo(-80, 80); c.lineTo(-80, lvl);
    for (let x = -80; x <= 80; x += 8) c.lineTo(x, lvl + Math.sin(x * 0.07 + t * 3.2) * 3.2);
    c.lineTo(80, 80); c.closePath(); c.fillStyle = lg; c.fill();
    const br = L.rng(33);
    for (let i = 0; i < 9; i++) {
      const bx = (br() - 0.5) * 70, sp = 18 + br() * 22, ph = br() * 100, rr = 2 + br() * 3.5;
      const by = 62 - ((t * sp + ph) % 90);
      if (by > lvl + 4) { c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(bx * (1 - (62 - by) / 160), by, rr, 0, Math.PI * 2); c.fill(); }
    }
    c.restore();
    // outline + rim + gloss
    flask(); c.lineWidth = 6; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.moveTo(-25, -74); c.lineTo(25, -74); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-6, -64); c.lineTo(-6, -34); c.stroke();
    c.beginPath(); c.moveTo(-40, 30); c.lineTo(-30, 12); c.stroke();
    // bubbles leaving the neck
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.55 + i / 3) % 1, a = Math.sin(ph * Math.PI) * L.ep(lt, 1.0, 0.5);
      c.fillStyle = L.rgba('#2E9A57', 0.55 * a); c.beginPath(); c.arc(Math.sin(ph * 6 + i) * 8, -84 - ph * 46, 3 + i * 1.5, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    checkBadge(c, L, cx + 66 * sc, cy + 40 * sc, 25, L.prog(lt, 1.15, 0.55), { ringW: 5 });
  },
  // 4 — Ukrainian & European norms: document + check seal, flanked by UA flag and EU stars
  (c, L, w, vh, t, lt) => {
    const { C } = L;
    const g = c.createLinearGradient(0, 0, 0, vh); g.addColorStop(0, '#F2F4F7'); g.addColorStop(1, '#E3E8EE');
    c.fillStyle = g; c.fillRect(0, 0, w, vh);
    c.strokeStyle = 'rgba(11,34,64,0.05)'; c.lineWidth = 1;
    for (let x = 24; x < w; x += 36) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, vh); c.stroke(); }
    const cx = w / 2, cy = vh / 2 + 4;
    // connectors to the two emblems
    const ea = L.ep(lt, 1.15, 0.6);
    const dx = 215;
    if (ea > 0) {
      c.save(); c.setLineDash([3, 9]); c.lineCap = 'round'; c.lineWidth = 3; c.strokeStyle = 'rgba(11,34,64,0.25)';
      c.beginPath(); c.moveTo(cx - 98, cy); c.lineTo(cx - 98 - (dx - 98 - 52) * ea, cy); c.stroke();
      c.beginPath(); c.moveTo(cx + 98, cy); c.lineTo(cx + 98 + (dx - 98 - 52) * ea, cy); c.stroke();
      c.restore();
    }
    const emb = (x, kind, p) => {
      if (p <= 0) return;
      const e = L.ease.outBack(L.clamp(p)), r = 48;
      c.save(); c.translate(x, cy + Math.sin(t * 1.1 + x) * 2); c.scale(e, e);
      c.shadowColor = 'rgba(11,34,64,0.22)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
      c.beginPath(); c.arc(0, 0, r + 6, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill(); c.shadowColor = 'transparent';
      c.save(); c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.clip();
      if (kind === 'ua') { c.fillStyle = C.uaBlue; c.fillRect(-r, -r, 2 * r, r); c.fillStyle = C.uaYellow; c.fillRect(-r, 0, 2 * r, r); }
      else { c.fillStyle = '#103D96'; c.fillRect(-r, -r, 2 * r, 2 * r); c.fillStyle = '#FFCC00'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 - Math.PI / 2 + t * 0.15; star(c, Math.cos(a) * 29, Math.sin(a) * 29, 6.2); } }
      c.restore(); c.restore();
    };
    emb(cx - dx, 'ua', L.prog(lt, 1.4, 0.5));
    emb(cx + dx, 'eu', L.prog(lt, 1.55, 0.5));
    // document sheet
    const da = L.ep(lt, 0.3, 0.7, 'outBack');
    c.save(); c.translate(cx - 6, cy + (1 - da) * 30); c.rotate(-0.045 + Math.sin(t * 0.6) * 0.006);
    const dw = 166, dh = 210;
    c.shadowColor = 'rgba(11,34,64,0.2)'; c.shadowBlur = 26; c.shadowOffsetY = 12;
    c.beginPath(); c.moveTo(-dw / 2, -dh / 2); c.lineTo(dw / 2 - 30, -dh / 2); c.lineTo(dw / 2, -dh / 2 + 30); c.lineTo(dw / 2, dh / 2); c.lineTo(-dw / 2, dh / 2); c.closePath();
    c.fillStyle = '#FFFFFF'; c.fill(); c.shadowColor = 'transparent';
    c.fillStyle = '#E4E9EF'; c.beginPath(); c.moveTo(dw / 2 - 30, -dh / 2); c.lineTo(dw / 2 - 30, -dh / 2 + 30); c.lineTo(dw / 2, -dh / 2 + 30); c.closePath(); c.fill();
    c.fillStyle = INK; L.roundRect(c, -dw / 2 + 22, -dh / 2 + 24, 76, 11, 5.5); c.fill();
    c.fillStyle = GREEN; L.roundRect(c, -dw / 2 + 22, -dh / 2 + 44, 40, 7, 3.5); c.fill();
    const widths = [118, 104, 122, 88, 110, 70];
    widths.forEach((ww, j) => { const lp = L.ep(lt, 0.55 + j * 0.06, 0.35); c.fillStyle = '#CBD3DD'; L.roundRect(c, -dw / 2 + 22, -dh / 2 + 70 + j * 19, ww * lp, 7, 3.5); c.fill(); });
    c.restore();
    // seal stamps onto the sheet
    const sp = L.prog(lt, 0.85, 0.45);
    if (sp > 0) {
      const e = L.ease.outBack(sp), sx = cx + 50, sy = cy + 58, r = 40;
      c.save(); c.translate(sx, sy); c.rotate(0.15 + Math.sin(t * 0.8) * 0.02); const sc = L.lerp(1.8, 1, e); c.scale(sc, sc); c.globalAlpha *= L.clamp(sp * 2.2);
      c.shadowColor = 'rgba(20,90,50,0.3)'; c.shadowBlur = 14; c.shadowOffsetY = 5;
      c.beginPath(); for (let i = 0; i < 32; i++) { const rr = i % 2 ? r : r * 0.88, a = i * Math.PI / 16; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath();
      const sg = c.createLinearGradient(-r, -r, r, r); sg.addColorStop(0, '#3DB56C'); sg.addColorStop(1, '#1E7A42'); c.fillStyle = sg; c.fill(); c.shadowColor = 'transparent';
      c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(0, 0, r * 0.7, 0, Math.PI * 2); c.stroke();
      c.restore();
      drawCheck(c, L, sx, sy + 1, 0.42 * L.lerp(1.8, 1, e), L.clamp((sp - 0.4) / 0.6), '#FFFFFF', 7);
      const rb = L.prog(lt, 1.0, 0.55);
      if (rb > 0 && rb < 1) { c.strokeStyle = L.rgba(GREEN, 0.5 * (1 - rb)); c.lineWidth = 3; c.beginPath(); c.arc(sx, sy, r + 6 + rb * 34, 0, Math.PI * 2); c.stroke(); }
    }
  },
  // 5 — delivery across Ukraine: one-colour map silhouette, amber dashed routes from the centre, warehouse inset photo
  (c, L, w, vh, t, lt) => {
    const g = c.createLinearGradient(0, 0, w, vh); g.addColorStop(0, '#F3F7F2'); g.addColorStop(1, '#E2EEE5');
    c.fillStyle = g; c.fillRect(0, 0, w, vh);
    const sil = mapSilhouette(L), mw = 352, ms = mw / sil.width, mh = sil.height * ms;
    const mx = 70, my = (vh - mh) / 2 + 2;
    const ma = L.ep(lt, 0.3, 0.9, 'inOutCubic');
    c.save();
    c.beginPath(); c.rect(mx - 20, 0, (mw + 40) * ma, vh); c.clip();
    c.shadowColor = 'rgba(20,80,45,0.25)'; c.shadowBlur = 22; c.shadowOffsetY = 10;
    c.drawImage(sil, mx, my, mw, mh);
    c.restore();
    // routes
    const P = (x, y) => [mx + x * ms, my + y * ms];
    const hub = P(305, 182);
    const dests = [[58, 122], [100, 70], [30, 184], [282, 98], [395, 70], [468, 132], [418, 196], [268, 262]];
    c.save(); c.lineCap = 'round';
    dests.forEach(([dx, dy], j) => {
      const rp = L.ep(lt, 0.75 + j * 0.07, 0.7, 'inOutCubic');
      if (rp <= 0) return;
      const d = P(dx, dy), mxp = (hub[0] + d[0]) / 2, myp = (hub[1] + d[1]) / 2;
      // (the Uzhhorod route bends less so it stays over the silhouette instead of dipping past the southern border)
      const nx = -(d[1] - hub[1]), ny = d[0] - hub[0], nl = Math.hypot(nx, ny) || 1, bend = j === 2 ? -0.07 : 0.18 * (j % 2 ? 1 : -1);
      const cxp = mxp + nx / nl * Math.hypot(nx, ny) * bend, cyp = myp + ny / nl * Math.hypot(nx, ny) * bend;
      const pts = []; const K = 26;
      for (let s = 0; s <= K * rp; s++) { const k = s / K, m = 1 - k; pts.push([m * m * hub[0] + 2 * m * k * cxp + k * k * d[0], m * m * hub[1] + 2 * m * k * cyp + k * k * d[1]]); }
      { const k = rp, m = 1 - k; pts.push([m * m * hub[0] + 2 * m * k * cxp + k * k * d[0], m * m * hub[1] + 2 * m * k * cyp + k * k * d[1]]); }
      c.setLineDash([7, 7]); c.lineDashOffset = -t * 22;
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 6.5;
      c.beginPath(); pts.forEach((q, n) => n ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke();
      c.strokeStyle = AMBER; c.lineWidth = 3.5; c.stroke();
      c.setLineDash([]);
      const arrive = L.prog(lt, 0.75 + j * 0.07 + 0.62, 0.35);
      if (arrive > 0) {
        const pulse = (t * 0.7 + j * 0.13) % 1;
        c.strokeStyle = L.rgba(AMBER, 0.6 * (1 - pulse) * arrive); c.lineWidth = 2; c.beginPath(); c.arc(d[0], d[1], 6 + pulse * 14, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(d[0], d[1], 6.5 * L.ease.outBack(arrive), 0, Math.PI * 2); c.fill();
        c.fillStyle = AMBER; c.beginPath(); c.arc(d[0], d[1], 3.8 * L.ease.outBack(arrive), 0, Math.PI * 2); c.fill();
      }
    });
    const ha = L.ep(lt, 0.62, 0.4, 'outBack');
    if (ha > 0) {
      const pulse = (t * 0.6) % 1;
      c.strokeStyle = L.rgba(AMBER, 0.7 * (1 - pulse)); c.lineWidth = 3; c.beginPath(); c.arc(hub[0], hub[1], 10 + pulse * 26, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(hub[0], hub[1], 11 * ha, 0, Math.PI * 2); c.fill();
      c.fillStyle = AMBER; c.beginPath(); c.arc(hub[0], hub[1], 7 * ha, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    // warehouse inset (shock_rolls_1)
    const ip = L.prog(lt, 1.3, 0.7);
    if (ip > 0) {
      const e = L.ease.outCubic(ip), iw = 236, ih = 200, ix = w - iw - 78, iy = (vh - ih) / 2 + (1 - e) * 40;
      c.save(); c.globalAlpha *= L.clamp(ip * 1.6); c.translate(ix + iw / 2, iy + ih / 2); c.rotate(0.035); c.translate(-iw / 2, -ih / 2);
      c.shadowColor = 'rgba(30,40,30,0.3)'; c.shadowBlur = 26; c.shadowOffsetY = 12;
      L.roundRect(c, -6, -6, iw + 12, ih + 12, 18); c.fillStyle = '#FFFFFF'; c.fill(); c.shadowColor = 'transparent';
      c.save(); L.roundRect(c, 0, 0, iw, ih, 13); c.clip();
      const kb = L.ease.inOutSine(L.clamp((lt - 1.5) / 6));
      L.drawCover(c, L.img('shock_rolls_1'), 0, 0, iw, ih, L.lerp(1.12, 1.24, kb), 0.42, L.lerp(0.5, 0.42, kb));
      c.restore(); c.restore();
    }
  },
];

// ---------- card compositing ----------
// 3D Y-axis flip: face rendered offscreen, drawn in vertical strips with perspective.
function drawFlipping(ctx, L, i, cx, cy, ang, lift, t, lt, T) {
  const k = CARDS[i], w = k.w, h = k.h;
  const front = ang < Math.PI / 2;
  const { c, x } = flipBuf(L);
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, Math.ceil(w) + 4, Math.ceil(h) + 4);
  if (front) cardFront(x, L, i, t, lt, T); else cardBack(x, L, i, w, h, t);
  // light falloff while turned
  const ca = Math.cos(ang), sa = Math.sin(ang);
  x.globalCompositeOperation = 'source-atop';
  const sg = x.createLinearGradient(0, 0, w, 0);
  const dark = 0.28 * sa, far = front ? [0, 1] : [1, 0];
  sg.addColorStop(0, `rgba(30,25,15,${dark * (far[0] ? 1 : 0.25)})`); sg.addColorStop(1, `rgba(30,25,15,${dark * (far[1] ? 1 : 0.25)})`);
  x.fillStyle = sg; x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'source-over';
  const D = 2200, N = 40;
  const proj = u => { const s = front ? (u - w / 2) : (w / 2 - u); const Z = s * sa, f = D / (D + Z); return [cx + s * ca * f * lift, f * lift]; };
  // shadow (trapezoid)
  const [xl, fl] = proj(0), [xr, fr] = proj(w);
  L.save(ctx, () => {
    ctx.shadowColor = 'rgba(70,50,20,0.22)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 22;
    ctx.beginPath(); ctx.moveTo(xl, cy - h * fl / 2); ctx.lineTo(xr, cy - h * fr / 2); ctx.lineTo(xr, cy + h * fr / 2); ctx.lineTo(xl, cy + h * fl / 2); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  });
  for (let j = 0; j < N; j++) {
    const u0 = (j / N) * w, u1 = ((j + 1) / N) * w;
    const [x0, f0] = proj(u0), [x1, f1] = proj(u1);
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1), f = (f0 + f1) / 2, hh = h * f;
    if (xb - xa < 0.05) continue;
    ctx.drawImage(c, u0, 0, u1 - u0, h, xa, cy - hh / 2, xb - xa + 0.8, hh);
  }
}

function drawCard(ctx, L, i, t, T, env) {
  const k = CARDS[i];
  const f0 = T.flips[i];
  const appear = L.ep(t, T.backs + APPEAR_DELAY[i], 0.55);
  if (appear <= 0) return;
  // collapse into the badge
  const cp = L.ep(t, T.collapse + COLLAPSE_DELAY[i], 0.45, 'inOutCubic');
  if (cp >= 1) return;
  const bob = Math.sin(t * 0.55 + i * 1.7) * 2.5;
  let cx = k.x + k.w / 2, cy = k.y + k.h / 2 + bob + (1 - appear) * 36;
  const next = i < 4 ? T.flips[i + 1] : T.collapse;
  const veil = i < 4 ? L.ep(t, next - 0.05, 0.6, 'inOutSine') : 0;
  let s = 1 - 0.018 * veil;
  cx = L.lerp(cx, BADGE.x, cp); cy = L.lerp(cy, BADGE.y, cp); s *= L.lerp(1, 0.05, cp);
  // fade while travelling, so the converging cards never pile up as an opaque cluster
  const alpha = appear * (1 - L.ease.inOutSine(L.clamp((cp - 0.22) / 0.58)));
  const fp = L.prog(t, f0, FLIP_DUR);
  const lt = t - f0 - FLIP_DUR * 0.5 + 0.4; // label/visual clock: front becomes visible at lt ≈ 0.4
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha;
    if (fp > 0 && fp < 1) {
      const ang = Math.PI * (1 - L.ease.inOutCubic(fp));
      drawFlipping(ctx, L, i, cx, cy, ang, (1 + 0.06 * Math.sin(fp * Math.PI)) * s, t, lt, T);
      return;
    }
    ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-k.w / 2, -k.h / 2);
    const active = fp >= 1 ? L.ep(t, f0 + FLIP_DUR * 0.6, 0.5) * (1 - veil) : 0;
    L.save(ctx, () => {
      ctx.shadowColor = `rgba(70,50,20,${0.13 + 0.07 * active})`; ctx.shadowBlur = 34 + 16 * active; ctx.shadowOffsetY = 14 + 8 * active;
      L.roundRect(ctx, 0, 0, k.w, k.h, CARD_R); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    });
    if (fp <= 0) cardBack(ctx, L, i, k.w, k.h, t);
    else {
      cardFront(ctx, L, i, t, lt, T);
      if (active > 0.01) { L.roundRect(ctx, 0, 0, k.w, k.h, CARD_R); ctx.lineWidth = 3; ctx.strokeStyle = L.rgba('#2FA25A', 0.85 * active); ctx.stroke(); }
      if (veil > 0.01) { L.roundRect(ctx, 0, 0, k.w, k.h, CARD_R); ctx.fillStyle = `rgba(246,241,233,${0.4 * veil})`; ctx.fill(); }
    }
  });
}

// ---------- final badge: degree ring → shield, house with lit windows ----------
function badge(ctx, L, t, T) {
  const { C } = L;
  const ring = L.prog(t, T.collapse + 0.3, 0.4);
  if (ring <= 0) return;
  shapes();
  const morph = L.ep(t, T.collapse + 0.45, 0.45, 'inOutCubic');
  const re = L.ease.outBack(ring), R0 = 46 * re, KS = 3.05;
  const breathe = 1 + 0.008 * Math.sin(t * 2.2);
  const pts = CIRCLE.map((q, n) => [L.lerp(q[0] * R0, SHIELD[n][0] * KS, morph) * breathe, L.lerp(q[1] * R0, SHIELD[n][1] * KS, morph) * breathe]);
  L.save(ctx, () => {
    ctx.translate(BADGE.x, BADGE.y);
    // glow + shock ring
    L.glow(ctx, 0, 0, 380, '#F6C47F', 0.32 * morph);
    L.glow(ctx, 0, 0, 260, C.brand, 0.12 * ring);
    const sr = L.prog(t, T.collapse + 0.85, 0.8);
    if (sr > 0 && sr < 1) { ctx.strokeStyle = L.rgba(C.brand, 0.35 * (1 - sr)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 170 + sr * 120, 0, Math.PI * 2); ctx.stroke(); }
    const path = (sc = 1) => { ctx.beginPath(); pts.forEach((q, n) => n ? ctx.lineTo(q[0] * sc, q[1] * sc) : ctx.moveTo(q[0] * sc, q[1] * sc)); ctx.closePath(); };
    // fill (navy) grows in with the morph
    {
      ctx.save(); ctx.shadowColor = 'rgba(11,34,64,0.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 22;
      path(); const fe = L.ease.inOutSine(L.clamp((morph - 0.25) / 0.6)), fg = ctx.createLinearGradient(0, -150, 0, 160);
      fg.addColorStop(0, L.mixColor('#FFFFFF', '#173E6B', fe)); fg.addColorStop(1, L.mixColor('#F4F1EA', '#0A1E38', fe));
      ctx.fillStyle = fg; ctx.fill(); ctx.restore();
    }
    ctx.lineJoin = 'round';
    path(); const sg = ctx.createLinearGradient(-150, -150, 150, 150);
    sg.addColorStop(0, '#2FA25A'); sg.addColorStop(0.45, '#6EDB97'); sg.addColorStop(0.6, '#2FA25A'); sg.addColorStop(1, '#1B6A39');
    ctx.lineWidth = L.lerp(15, 13, morph); ctx.strokeStyle = sg; ctx.stroke();
    if (morph > 0.05) { path(0.86); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(195,198,202,${0.8 * morph})`; ctx.stroke(); }
    // house with glowing windows
    const hp = L.ep(t, T.collapse + 0.62, 0.45, 'outBack');
    if (hp > 0) {
      ctx.save(); ctx.translate(0, 14); const hs = 1.12 * L.lerp(0.7, 1, hp); ctx.scale(hs, hs); ctx.globalAlpha *= L.clamp(hp * 1.5);
      const lit = n => L.ep(t, T.collapse + 0.75 + n * 0.06, 0.3) * (0.92 + 0.08 * Math.sin(t * 5 + n * 1.7));
      const wins = [[-38, -6], [18, -6], [-38, 24], [18, 24]];
      wins.forEach(([wx, wy], n) => L.glow(ctx, wx + 10, wy + 9, 50, C.amber, 0.8 * lit(n)));
      L.glow(ctx, 0, -36, 38, C.amber, 0.75 * lit(4));
      ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#F2F5F8';
      ctx.beginPath(); ctx.moveTo(-70, -10); ctx.lineTo(0, -70); ctx.lineTo(70, -10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-52, -24); ctx.lineTo(-52, 58); ctx.lineTo(52, 58); ctx.lineTo(52, -24); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-10, 58); ctx.lineTo(-10, 26); ctx.lineTo(10, 26); ctx.lineTo(10, 58); ctx.stroke();
      wins.forEach(([wx, wy], n) => { ctx.fillStyle = L.mixColor('#2A4566', '#FFC86A', lit(n)); L.roundRect(ctx, wx, wy, 20, 18, 3); ctx.fill(); });
      ctx.fillStyle = L.mixColor('#2A4566', '#FFC86A', lit(4)); ctx.beginPath(); ctx.arc(0, -36, 9, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  });
  // unvoiced line under the badge
  const sp = L.prog(t, T.collapse + 0.62, 0.55); // fully set as the voice ends (~c4 + 3.97 s)
  if (sp > 0) L.revealText(ctx, 'Кожен градус — під захистом', 960, 742, sp, { role: 'display', size: 54, color: INK, align: 'center', maxWidth: 1500, highlight: ['під', 'захистом'], highlightColor: GREEN, stagger: 0.15 });
}

module.exports = {
  draw(ctx, t, d, L, env) {
    const T = timing(env);
    stage(ctx, L, t);
    // draw the flipping card last so it sits above its neighbours
    const order = [0, 1, 2, 3, 4].sort((a, b) => {
      const fa = L.prog(t, T.flips[a], FLIP_DUR), fb = L.prog(t, T.flips[b], FLIP_DUR);
      return (fa > 0 && fa < 1 ? 1 : 0) - (fb > 0 && fb < 1 ? 1 : 0);
    });
    for (const i of order) drawCard(ctx, L, i, t, T, env);
    headline(ctx, L, t, T);
    badge(ctx, L, t, T);
    warmVignette(ctx, L);
  },
};
