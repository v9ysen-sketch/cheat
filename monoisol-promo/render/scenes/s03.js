'use strict';
// Scene 3 — «Матеріал: спінений поліетилен» (≈11.47 s, global 33.83–45.30)
// Beats (local s, synced to env.cues):
//   A 0.40  framed photo pipe_ins_cut (right) + headline «Спінений поліетилен» (left), slow push-in on one tube end
//   B 3.17  the camera dives into the cut foam wall → it flows into a macro "lens" of closed cells (rounded hexagons,
//           thin walls, white highlights); headline recedes, label «Закриті комірки» with a leader line;
//           warm particles pulse calmly inside the cells, cold arrows bounce off the surface
//   C 6.27  split screen: vertical card white_rolls → crossfade shock_rolls_2 (left); three badges with ~1 s
//           micro-animations synced to the words (measured from line08.wav): «пружний» 7.12, «майже» 7.80, «поглинає» ~9.77
// Top-right corner (x>1500, y<150) is kept free for the global logo; nothing but ambience below y≈910.

const CARD = { x: 960, y: 268, w: 780, h: 444, fy: 1 }; // beat A photo card (bottom-anchored crop: hides the cut-off banner at the photo top)
const PIV = [165, 220];                                // cut foam wall of the bottom-right tube end (pipe_ins_cut px)
const LENS = { x: 1290, y: 520, r: 330 };              // beat B macro lens
const HL = { x: 120, y1: 478, y1b: 410, lh: 112, size: 96, recScale: 0.66 };
const LABEL_Y = 604;                                   // beat B label centre
const SPLIT = { x: 170, y: 162, w: 550, h: 756 };      // beat C vertical card
const TILE = { x: 990, s: 190, rows: [300, 540, 780] };// beat C badge tiles (centre x, size, centre ys)
const PILL_X = TILE.x + TILE.s / 2 + 42;

// ---------------------------------------------------------------- precomputed geometry
let CELLS = null;
function cells(L) {
  if (CELLS) return CELLS;
  const r = L.rng(303); CELLS = [];
  for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) {
    const u = i + (j & 1 ? 0.5 : 0) + (r() - 0.5) * 0.05, v = j * 0.866 + (r() - 0.5) * 0.05;
    const vf = Array.from({ length: 6 }, () => 0.95 + r() * 0.08);
    const c = { u, v, rot: (r() - 0.5) * 0.12, vf, ph: r() * 6.28, ox: (r() - 0.5) * 0.18, oy: (r() - 0.5) * 0.18, sz: 0.92 + r() * 0.14 };
    if (Math.hypot(u, v) < 6.2) CELLS.push(c);
  }
  return CELLS;
}
let BUBBLES = null;
function bubbles(L) {
  if (BUBBLES) return BUBBLES;
  const r = L.rng(77); BUBBLES = [];
  for (let i = 0; i < 26; i++) BUBBLES.push({ x: r() * L.W, y: r() * L.H, s: 6 + r() * 22, v: 6 + r() * 14, ph: r() * 6.28, a: 0.05 + r() * 0.07 });
  return BUBBLES;
}

// ---------------------------------------------------------------- helpers
function cueStart(env, k, fb) { const c = env && env.cues && env.cues.find(q => q.k === k); return c ? c.start : fb; }

// rounded hexagon path centred at (x,y), circumradius R, per-vertex factors vf, corner radius cr
function hexPath(ctx, x, y, R, rot, vf, cr) {
  const P = [];
  for (let k = 0; k < 6; k++) { const a = rot + Math.PI / 6 + k * Math.PI / 3, rr = R * (vf ? vf[k] : 1); P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  ctx.beginPath();
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = m(P[5], P[0]); ctx.moveTo(s[0], s[1]);
  for (let k = 0; k < 6; k++) { const n = m(P[k], P[(k + 1) % 6]); ctx.arcTo(P[k][0], P[k][1], n[0], n[1], cr); }
  ctx.closePath();
}

// photo in a rounded frame; image zoomed by k (>=1) about photo point P (keeps the frame covered)
function pivotCard(ctx, L, name, x, y, w, h, k, P, { r = 22, alt = null, altA = 0, border = 'rgba(255,255,255,0.88)', bw = 4, shadow = true, fy = 0.5 } = {}) {
  const im = L.img(name), iw = im.width, ih = im.height;
  const s0 = Math.max(w / iw, h / ih), ox = x + (w - iw * s0) / 2, oy = y + (h - ih * s0) * fy;
  const qx = ox + P[0] * s0, qy = oy + P[1] * s0, s = s0 * k, dx = qx - P[0] * s, dy = qy - P[1] * s;
  if (shadow) L.save(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24; L.roundRect(ctx, x, y, w, h, r); ctx.fillStyle = '#0B1A2E'; ctx.fill(); });
  L.save(ctx, () => {
    L.roundRect(ctx, x, y, w, h, r); ctx.clip();
    ctx.drawImage(im, dx, dy, iw * s, ih * s);
    if (alt && altA > 0.001) { ctx.globalAlpha *= altA; ctx.drawImage(alt, dx, dy, iw * s, ih * s); ctx.globalAlpha /= altA; }
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.24)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  });
  if (border && bw) { L.roundRect(ctx, x, y, w, h, r); ctx.lineWidth = bw; ctx.strokeStyle = border; ctx.stroke(); }
}

// cover-fit card with focus drift (for the vertical split-screen card)
function coverCard(ctx, L, name, x, y, w, h, zoom, fx, fy, r = 22) {
  L.save(ctx, () => { L.roundRect(ctx, x, y, w, h, r); ctx.clip(); L.drawCover(ctx, L.img(name), x, y, w, h, zoom, fx, fy); });
}

// label plate: optional icon drawer, white bold text in a rounded green-glass plate. returns width
function plate(ctx, L, str, x, y, p, { size = 40, icon = null, out = 0 } = {}) {
  const { C } = L;
  const a = L.clamp(p * 1.6) * (1 - L.ease.inCubic(L.clamp(out)));
  if (a <= 0.002) return 0;
  const e = L.ease.outCubic(L.clamp(p));
  const tw = L.measure(ctx, str, 'bodyBold', size), ph = Math.round(size * 1.95), ir = ph * 0.32;
  const padL = icon ? 20 + ir * 2 + 16 : 32, pw = padL + tw + 34;
  L.at(ctx, { x: x + (1 - e) * 34 - L.ease.inCubic(L.clamp(out)) * 24, y, alpha: a }, () => {
    L.save(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; L.roundRect(ctx, 0, -ph / 2, pw, ph, ph / 2); ctx.fillStyle = 'rgba(9,30,40,0.72)'; ctx.fill(); });
    L.roundRect(ctx, 0, -ph / 2, pw, ph, ph / 2); ctx.fillStyle = L.rgba(C.brand, 0.2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = L.rgba(C.brandHi, 0.62); ctx.stroke();
    if (icon) {
      ctx.beginPath(); ctx.arc(20 + ir, 0, ir, 0, Math.PI * 2); ctx.fillStyle = L.rgba(C.brandHi, 0.18); ctx.fill();
      icon(20 + ir, 0, ir);
    }
    L.text(ctx, str, padL, 1, { role: 'bodyBold', size, color: C.white, baseline: 'middle' });
  });
  return pw;
}

// ---------------------------------------------------------------- background: navy + faint blueprint grid
function background(ctx, L, t) {
  const { W, H, C } = L;
  const g = ctx.createLinearGradient(0, 0, W * 0.7, H * 1.2);
  g.addColorStop(0, '#040C19'); g.addColorStop(0.55, '#0A1D37'); g.addColorStop(1, '#102D55');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  L.glow(ctx, W * (0.68 + 0.05 * Math.sin(t * 0.13)), H * (0.42 + 0.05 * Math.cos(t * 0.11)), 820, C.cyan, 0.06);
  L.glow(ctx, W * (0.16 + 0.04 * Math.cos(t * 0.09)), H * (0.82 + 0.04 * Math.sin(t * 0.12)), 760, C.brand, 0.07);
  // blueprint grid
  L.save(ctx, () => {
    const step = 48, ox = (t * 5) % (step * 4), oy = (t * 2) % (step * 4);
    ctx.lineWidth = 1;
    for (let k = -4; k * step < W + step * 4; k++) {
      const x = Math.round(k * step + ox) + 0.5, major = ((k % 4) + 4) % 4 === 0;
      ctx.strokeStyle = L.rgba('#7FB8E8', major ? 0.065 : 0.03); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let k = -4; k * step < H + step * 4; k++) {
      const y = Math.round(k * step + oy) + 0.5, major = ((k % 4) + 4) % 4 === 0;
      ctx.strokeStyle = L.rgba('#7FB8E8', major ? 0.065 : 0.03); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  });
  // drifting faint "cells"
  L.save(ctx, () => {
    ctx.lineWidth = 1.5;
    for (const b of bubbles(L)) {
      const y = ((b.y - t * b.v) % (H + 80) + H + 80) % (H + 80) - 40, x = b.x + Math.sin(t * 0.4 + b.ph) * 14;
      ctx.strokeStyle = L.rgba('#BFE3FF', b.a); ctx.beginPath(); ctx.arc(x, y, b.s, 0, Math.PI * 2); ctx.stroke();
    }
  });
}

// ---------------------------------------------------------------- macro lens of closed cells
function lens(ctx, L, cx, cy, R, cs, t, heat, alpha) {
  if (alpha <= 0.002 || R < 2) return;
  const { C } = L;
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha;
    // drop shadow + soft halo
    L.save(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = '#DCE4EE'; ctx.fill(); });
    L.save(ctx, () => {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      // cell walls (bright)
      const wg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      wg.addColorStop(0, '#FFFFFF'); wg.addColorStop(1, '#C9D4E1');
      ctx.fillStyle = wg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      const hr = cs * 0.577 * 0.86;
      for (const c of cells(L)) {
        const br = 1 + 0.025 * Math.sin(t * 1.3 + c.ph);
        const x = cx + c.u * cs, y = cy + c.v * cs;
        if (Math.hypot(x - cx, y - cy) > R + cs) continue;
        const rr = hr * c.sz * br;
        hexPath(ctx, x, y, rr, c.rot, c.vf, rr * 0.34);
        const g = ctx.createRadialGradient(x - rr * 0.3, y - rr * 0.35, rr * 0.05, x, y, rr * 1.05);
        g.addColorStop(0, '#E4EBF3'); g.addColorStop(0.65, '#BCC8D6'); g.addColorStop(1, '#93A3B8');
        ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = Math.max(1, cs * 0.025); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
        if (heat > 0.002) {
          const pu = 0.5 + 0.5 * Math.sin(t * 2.0 + c.ph);
          const px = x + c.ox * cs * Math.cos(t * 0.6 + c.ph), py = y + c.oy * cs * Math.sin(t * 0.5 + c.ph);
          L.glow(ctx, px, py, cs * (0.26 + 0.07 * pu), C.orange, heat * (0.55 + 0.35 * pu));
          ctx.beginPath(); ctx.arc(px, py, cs * (0.055 + 0.015 * pu), 0, Math.PI * 2); ctx.fillStyle = L.rgba(C.amber, heat * 0.95); ctx.fill();
        }
        // white highlight
        ctx.beginPath(); ctx.ellipse(x - rr * 0.32, y - rr * 0.4, rr * 0.26, rr * 0.13, -0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.fill();
      }
      if (heat > 0.002) L.glow(ctx, cx, cy, R * 0.9, C.orange, 0.12 * heat);
      // spherical lens shading
      const sg = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.3, cx, cy, R);
      sg.addColorStop(0, 'rgba(255,255,255,0.08)'); sg.addColorStop(0.7, 'rgba(10,30,60,0)'); sg.addColorStop(1, 'rgba(10,30,60,0.38)');
      ctx.fillStyle = sg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    });
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
  });
}

// blueprint construction marks around the lens
function lensMarks(ctx, L, cx, cy, R, t, a) {
  if (a <= 0.002) return;
  L.save(ctx, () => {
    ctx.globalAlpha *= a;
    ctx.strokeStyle = L.rgba('#9FD0F5', 0.35); ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 12]); ctx.lineDashOffset = -t * 14;
    ctx.beginPath(); ctx.arc(cx, cy, R + 34, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    // ticks on the outer circle
    for (let k = 0; k < 72; k++) {
      const ang = k * Math.PI / 36 + t * 0.03, l = k % 6 === 0 ? 12 : 5;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * (R + 46), cy + Math.sin(ang) * (R + 46)); ctx.lineTo(cx + Math.cos(ang) * (R + 46 + l), cy + Math.sin(ang) * (R + 46 + l));
      ctx.strokeStyle = L.rgba('#9FD0F5', k % 6 === 0 ? 0.32 : 0.16); ctx.stroke();
    }
  });
}

// cold arrows that hit the lens surface and bounce off
const ARROWS = [{ th: -0.5, al: 0.42, ph: 0.0 }, { th: -0.05, al: -0.4, ph: 0.5 }, { th: 0.45, al: 0.38, ph: 0.25 }, { th: 0.85, al: -0.42, ph: 0.75 }];
function coldArrows(ctx, L, cx, cy, R, t, t0, amt) {
  if (amt <= 0.002) return;
  const { C } = L, P = 2.3;
  for (const A of ARROWS) {
    const tt = t - t0 - A.ph * P; if (tt < 0) continue;
    const ph = (tt % P) / P;
    const n = [Math.cos(A.th), Math.sin(A.th)];
    const ca = Math.cos(A.al), sa = Math.sin(A.al);
    const d = [-(n[0] * ca - n[1] * sa), -(n[0] * sa + n[1] * ca)];           // incoming direction (towards the lens)
    const dn = d[0] * n[0] + d[1] * n[1], rf = [d[0] - 2 * dn * n[0], d[1] - 2 * dn * n[1]];
    const E = [cx + n[0] * (R + 10), cy + n[1] * (R + 10)], Lin = 270, Lout = 200;
    let hx, hy, dir, fade;
    if (ph < 0.4) { const k = L.ease.inQuad(ph / 0.4) * 0.6 + (ph / 0.4) * 0.4; hx = E[0] - d[0] * Lin * (1 - k); hy = E[1] - d[1] * Lin * (1 - k); dir = d; fade = L.clamp(ph / 0.12); }
    else if (ph < 0.8) { const k = L.ease.outCubic((ph - 0.4) / 0.4); hx = E[0] + rf[0] * Lout * k; hy = E[1] + rf[1] * Lout * k; dir = rf; fade = 1 - L.clamp((ph - 0.55) / 0.25); }
    else continue;
    const a = amt * fade, tl = 105;
    L.save(ctx, () => {
      ctx.lineCap = 'round'; ctx.shadowColor = L.rgba(C.cyan, 0.8 * a); ctx.shadowBlur = 18;
      const tx = hx - dir[0] * tl, ty = hy - dir[1] * tl;
      const g = ctx.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, L.rgba(C.cyan, 0)); g.addColorStop(1, L.rgba(C.ice, a));
      ctx.strokeStyle = g; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      // arrow head
      const ang = Math.atan2(dir[1], dir[0]);
      L.at(ctx, { x: hx, y: hy, rot: ang }, () => {
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-14, -14); ctx.lineTo(-8, 0); ctx.lineTo(-14, 14); ctx.closePath();
        ctx.fillStyle = L.rgba(C.ice, a); ctx.fill();
      });
    });
    // impact flash on the rim
    const ip = (ph - 0.4) / 0.3;
    if (ip > 0 && ip < 1) L.save(ctx, () => {
      const e = L.ease.outCubic(ip);
      ctx.strokeStyle = L.rgba(C.ice, amt * (1 - ip) * 0.9); ctx.lineWidth = 5 * (1 - ip) + 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, R + 8 + e * 16, A.th - 0.16 - e * 0.06, A.th + 0.16 + e * 0.06); ctx.stroke();
    });
  }
}

// ---------------------------------------------------------------- badge tiles (beat C)
function tile(ctx, L, cx, cy, S, p, act, draw) {
  const a = L.clamp(p * 1.6); if (a <= 0.002) return;
  const e = L.ease.outBack(L.clamp(p)), { C } = L;
  L.at(ctx, { x: cx + (1 - L.ease.outCubic(L.clamp(p))) * 40, y: cy, scale: L.lerp(0.82, 1, e), alpha: a }, () => {
    L.save(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 16; L.roundRect(ctx, -S / 2, -S / 2, S, S, 38); ctx.fillStyle = '#0E2442'; ctx.fill(); });
    L.roundRect(ctx, -S / 2, -S / 2, S, S, 38);
    const g = ctx.createLinearGradient(0, -S / 2, 0, S / 2); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = L.rgba(L.mixColor('#9DB3CC', C.brandHi, act), 0.35 + 0.45 * act); ctx.stroke();
    if (act > 0.01) L.glow(ctx, 0, 0, S * 0.75, C.brand, 0.10 * act);
    L.save(ctx, () => { L.roundRect(ctx, -S / 2 + 2, -S / 2 + 2, S - 4, S - 4, 36); ctx.clip(); ctx.scale(S / 176, S / 176); draw(); });
  });
}

function foamBlock(ctx, L, x, y, w, h, r, seed) {
  L.roundRect(ctx, x, y, w, h, r); ctx.fillStyle = '#E8EEF4'; ctx.fill();
  L.save(ctx, () => {
    L.roundRect(ctx, x, y, w, h, r); ctx.clip();
    ctx.fillStyle = 'rgba(141,154,172,0.28)';
    const rr = L.rng(seed);
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(x + rr() * w, y + rr() * h, 2.5 + rr() * 4.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x, y, w, Math.min(6, h * 0.15));
  });
}

// «Пружний»: a plate presses the foam block, it springs back
function animSpring(ctx, L, t, t0) {
  const { C } = L, base = 50, H0 = 62, Hc = 32, W0 = 100;
  let h = H0, gap = 24;
  const tt = t - t0;
  if (tt > 0) {
    const a = tt % 3.4;
    if (a < 0.2) gap = L.lerp(24, 0, L.ease.inCubic(a / 0.2));
    else if (a < 0.45) { gap = 0; h = L.lerp(H0, Hc, L.ease.inOutCubic((a - 0.2) / 0.25)); }
    else if (a < 0.55) { gap = 0; h = Hc; }
    else if (a < 1.5) { const k = (a - 0.55) / 0.95; h = Hc + (H0 - Hc) * L.ease.outElastic(L.clamp(k * 1.15)); gap = 24 * L.ease.outCubic(L.clamp(k * 2.2)); }
  }
  const w = W0 * (1 + 0.22 * (1 - (h - Hc * 0.0) / H0) * (h < H0 ? 1 : 0.0));
  // floor
  ctx.fillStyle = 'rgba(159,208,245,0.35)'; L.roundRect(ctx, -66, base, 132, 4, 2); ctx.fill();
  foamBlock(ctx, L, -w / 2, base - h, w, h, 10, 5);
  // press plate + handle
  const py = base - h - gap - 14;
  ctx.fillStyle = C.brandHi; L.roundRect(ctx, -60, py, 120, 14, 7); ctx.fill();
  ctx.fillStyle = L.rgba(C.brandHi, 0.85); L.roundRect(ctx, -6, py - 20, 12, 22, 5); ctx.fill();
  // compression chevrons
  const sq = L.clamp((H0 - h) / (H0 - Hc));
  if (sq > 0.05) L.save(ctx, () => {
    ctx.strokeStyle = L.rgba(C.ice, 0.8 * sq); ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const s of [-1, 1]) { const x = s * (w / 2 + 8); ctx.beginPath(); ctx.moveTo(x, base - h / 2 - 7); ctx.lineTo(x + s * 6, base - h / 2); ctx.lineTo(x, base - h / 2 + 7); ctx.stroke(); }   // kept clear of the tile rim
  });
}

// «Майже не вбирає вологу»: drops land, bead up and roll off a slightly tilted foam slab
function animDrops(ctx, L, t, t0) {
  const { C } = L, P = 2.1, tilt = 0.16, top = 20;
  L.save(ctx, () => {
    ctx.rotate(tilt);
    foamBlock(ctx, L, -66, top, 132, 30, 8, 9);
    const tt = t - t0; if (tt <= 0) return;
    const D = [{ x: -30, d: 0 }, { x: 2, d: 0.7 }, { x: -14, d: 1.4 }];
    for (const q of D) {
      const a = tt - q.d; if (a < 0) continue;
      const ph = a % P; let x = q.x, y, shape, al = 1;
      const fall = 0.38;
      if (ph < fall) { const k = L.ease.inQuad(ph / fall); y = L.lerp(-62, top - 10, k); shape = 0; al = L.ease.outQuad(L.clamp(ph / 0.16)); }
      else if (ph < fall + 0.14) { y = top - 9.5; shape = (ph - fall) / 0.14; }
      else if (ph < fall + 0.42) { y = top - 9.5; shape = 1; }
      else {
        const k = ph - fall - 0.42; x = q.x + 120 * k * k + 26 * k; y = top - 9.5; shape = 1;
        if (x > 70) y += (x - 70) * 0.9;
        al = 1 - L.clamp((x - 72) / 34);
      }
      if (al <= 0.01) continue;
      L.save(ctx, () => {
        ctx.globalAlpha *= al;
        ctx.translate(x, y);
        ctx.rotate(-tilt * shape);
        if (shape < 1) {
          const sq = shape > 0 ? Math.sin(shape * Math.PI) * 0.35 : 0;
          ctx.scale(1 + sq, 1 - sq);
          const tip = -16 * (1 - shape) - 9;
          ctx.beginPath(); ctx.moveTo(0, tip);
          ctx.bezierCurveTo(5, -8, 9, -2, 9, 2); ctx.arc(0, 2, 9, 0, Math.PI); ctx.bezierCurveTo(-9, -2, -5, -8, 0, tip);
        } else { ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, Math.PI * 2); }
        const g = ctx.createRadialGradient(-3, -4, 1, 0, 0, 12); g.addColorStop(0, '#BFEFFF'); g.addColorStop(0.6, C.cyan); g.addColorStop(1, '#1688C9');
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-3, -4, 3, 2, -0.6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      });
    }
  });
}

// «Поглинає шум»: a sound wave enters the foam layer and comes out flat
function animWave(ctx, L, t, t0) {
  const { C } = L;
  const tt = t - t0, slab = L.ease.outCubic(L.clamp(tt / 0.35)), damp = L.ease.inOutCubic(L.clamp((tt - 0.15) / 1.0));
  const A = 24, k = 0.13, w = t * 7;
  L.save(ctx, () => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const wave = (x0, x1, amp, col, lw) => {
      ctx.beginPath();
      for (let x = x0; x <= x1; x += 3) { const y = Math.sin(x * k - w) * amp; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    };
    wave(-80, -14, A, L.rgba(C.white, 0.95), 5);
    const a2 = A * L.lerp(1, 0.1, damp);
    wave(14, 80, a2, L.mixColor(C.white, C.brandHi, damp), 5);
    if (slab > 0.01) L.save(ctx, () => {
      const h = 124 * slab;
      foamBlock(ctx, L, -16, -h / 2, 32, h, 9, 13);
      // absorbed energy pulse inside the slab
      L.glow(ctx, 0, Math.sin(-w) * 8, 30, C.brandHi, 0.25 * slab * (0.6 + 0.4 * Math.sin(t * 7)));
    });
  });
}

// ---------------------------------------------------------------- scene
module.exports = {
  draw(ctx, t, d, L, env) {
    const { C, clamp, lerp, ease, ep, prog } = L;
    const c0 = cueStart(env, 0, 0.4), c1 = cueStart(env, 1, 3.167), c2 = cueStart(env, 2, 6.267);

    background(ctx, L, t);

    // ---------- beat A/B timings
    const zRaw = prog(t, c1 - 0.62, 1.05), zE = ease.inOutCubic(zRaw);           // dive into the tube end
    const lensE = ep(t, c1 - 0.45, 0.95, 'inOutCubic');                          // lens growth
    const outB = ep(t, c2 - 0.85, 0.8, 'inOutCubic');                            // beat B exit (lens closes)
    const recede = ep(t, c1 - 0.75, 0.8, 'inOutCubic');                           // headline recedes
    const textOut = prog(t, c2 - 0.85, 0.45);

    // ---------- beat A: photo card (with camera dive into the cut foam wall)
    const cardIn = ep(t, c0 - 0.8, 1.1);
    const cardA = clamp(cardIn * 1.4) * (1 - ease.inOutSine(clamp((zRaw - 0.42) / 0.28)));
    if (cardA > 0.002 && t < c2) {
      const kb = lerp(1.02, 1.1, ease.inOutSine(prog(t, -0.4, c1 - 0.2)));
      const dive = lerp(1, 3.6, ease.inCubic(zRaw) * 0.6 + zE * 0.4);
      const fs = lerp(1, 1.05, zE), rise = (1 - cardIn) * 70;
      const cx = CARD.x + CARD.w / 2, cy = CARD.y + CARD.h / 2;
      L.save(ctx, () => {
        ctx.globalAlpha *= cardA;
        ctx.translate(cx, cy + rise); ctx.scale(fs, fs); ctx.translate(-cx, -cy);
        pivotCard(ctx, L, 'pipe_ins_cut', CARD.x, CARD.y, CARD.w, CARD.h, kb * dive, PIV,
          { alt: L.blurred('pipe_ins_cut', 9), altA: clamp(zRaw * 2.2), fy: CARD.fy });
      });
    }

    // ---------- beat B: macro lens
    const lensA = clamp(lensE * 2.2) * (1 - ease.inOutSine(clamp((outB - 0.5) / 0.48)));   // closes almost to a point before it fades
    if (lensA > 0.002) {
      const im = L.img('pipe_ins_cut'), s0 = Math.max(CARD.w / im.width, CARD.h / im.height);
      const Q0 = [CARD.x + (CARD.w - im.width * s0) / 2 + PIV[0] * s0, CARD.y + (CARD.h - im.height * s0) * CARD.fy + PIV[1] * s0];
      const lc = [lerp(Q0[0], LENS.x, ease.inOutCubic(clamp(zRaw * 1.15))), lerp(Q0[1], LENS.y, ease.inOutCubic(clamp(zRaw * 1.15)))];
      const R = lerp(18, LENS.r, lensE) * (1 - outB);
      const kbB = 1 + 0.07 * ease.inOutSine(prog(t, c1, c2 - c1));
      const cs = 74 * (R / LENS.r) * kbB;
      const heat = ep(t, c1 - 0.05, 0.8);
      const cx = lc[0], cy = lc[1];
      lensMarks(ctx, L, cx, cy, R, t, ep(t, c1 + 0.1, 0.7) * (1 - outB));
      lens(ctx, L, cx, cy, R, cs, t, heat * (1 - outB), lensA);
      coldArrows(ctx, L, cx, cy, R, t, c1 + 0.05, ep(t, c1 + 0.05, 0.3) * (1 - prog(t, c2 - 1.0, 0.4)));
    }

    // ---------- headline «Спінений поліетилен» (A) → recedes (B) → exits
    if (t < c2 + 0.2) {
      const p1 = prog(t, c0 - 0.32, 0.85), p2 = prog(t, c0 - 0.18, 0.85);
      const sc = lerp(1, HL.recScale, recede), y1 = lerp(HL.y1, HL.y1b, recede);
      const dim = lerp(1, 0.86, recede);
      L.at(ctx, { x: HL.x, y: y1, scale: sc, alpha: dim }, () => {
        // accent bar
        const bp = ep(t, c0 - 0.4, 0.7) * (1 - textOut);
        if (bp > 0.002) L.save(ctx, () => { ctx.fillStyle = L.rgba(C.brandHi, bp); L.roundRect(ctx, 0, -HL.size - 34, 72 * bp, 6, 3); ctx.fill(); });
        L.revealText(ctx, 'Спінений', 0, 0, p1, { role: 'display', size: HL.size, color: C.brandHi, out: textOut, stagger: 0 });
        L.revealText(ctx, 'поліетилен', 0, HL.lh, p2, { role: 'display', size: HL.size, color: C.white, out: clamp(textOut * 1.2 - 0.05), stagger: 0 });
      });
    }

    // ---------- label «Закриті комірки» + leader line to the lens
    {
      const lp = ep(t, c1 - 0.15, 0.75, 'linear');
      const lo = textOut;
      const hexIcon = (x, y, r) => L.save(ctx, () => {
        hexPath(ctx, x, y, r * 0.62, 0, null, r * 0.12); ctx.strokeStyle = C.brandHi; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, r * 0.18, 0, Math.PI * 2); ctx.fillStyle = C.amber; ctx.fill();
      });
      const pw = plate(ctx, L, 'Закриті комірки', HL.x, LABEL_Y, lp, { size: 44, icon: hexIcon, out: lo });
      if (pw > 0) {
        const lineP = ep(t, c1 + 0.05, 0.6, 'inOutCubic') * (1 - ease.inCubic(clamp(lo)));
        const x0 = HL.x + pw + 18, ex = LENS.x - Math.sqrt(LENS.r * LENS.r - (LABEL_Y - LENS.y) ** 2) - 6;
        if (lineP > 0.002) L.save(ctx, () => {
          ctx.strokeStyle = L.rgba(C.brandHi, 0.75 * lineP); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x0, LABEL_Y); ctx.lineTo(lerp(x0, ex, lineP), LABEL_Y); ctx.stroke();
          ctx.beginPath(); ctx.arc(x0, LABEL_Y, 4.5, 0, Math.PI * 2); ctx.fillStyle = L.rgba(C.brandHi, lineP); ctx.fill();
          if (lineP > 0.95) { ctx.beginPath(); ctx.arc(ex, LABEL_Y, 7, 0, Math.PI * 2); ctx.fillStyle = C.brandHi; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#FFFFFF'; ctx.stroke(); }
        });
      }
    }

    // ---------- beat C: split screen
    const inC = ep(t, c2 - 0.72, 1.1);
    const wipeC = ease.inOutSine(prog(t, c2 - 0.72, 1.0));                            // calmer wipe (was the fastest edge in the scene)
    if (inC > 0.002) {
      const xf = ep(t, c2 + 2.05, 0.7, 'inOutSine');                                    // white_rolls → shock_rolls_2 (done before badge 3)
      const { x, y, w, h } = SPLIT, rise = (1 - inC) * 40;
      L.save(ctx, () => {
        ctx.globalAlpha *= clamp(inC * 3);
        ctx.translate(0, rise);
        const hh = (h + 140) * wipeC;
        ctx.beginPath(); ctx.rect(x - 80, y + h + 70 - hh, w + 160, hh); ctx.clip();
        L.save(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24; L.roundRect(ctx, x, y, w, h, 22); ctx.fillStyle = '#0B1A2E'; ctx.fill(); });
        // white_rolls: starts tight on the rolls (top edge below the banner logos, ~1:1 pixels), then the camera rises and
        // eases back until the whole MONOISOL banner is in frame, so no logo row sits sliced at the card edge while it holds
        const kw = ease.inOutSine(prog(t, c2 - 0.55, 2.8));
        const k = prog(t, c2 - 0.4, d - c2 + 0.8);
        if (xf < 0.999) coverCard(ctx, L, 'white_rolls', x, y, w, h, lerp(1.3, 1.08, kw), 0.42, lerp(1, 0, kw));
        // shock_rolls_2: slow push-in that keeps rising until the top roll's pink core is whole (not touching the card edge)
        if (xf > 0.001) L.save(ctx, () => { ctx.globalAlpha *= xf; coverCard(ctx, L, 'shock_rolls_2', x, y, w, h, lerp(1.03, 1.09, k), 0.4, lerp(0.6, 0.02, ease.inOutSine(prog(t, c2 + 1.9, d - c2 - 1.3)))); });
        L.save(ctx, () => {
          L.roundRect(ctx, x, y, w, h, 22); ctx.clip();
          const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.22)');
          ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        });
        L.roundRect(ctx, x, y, w, h, 22); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.88)'; ctx.stroke();
      });

      // badges: tile with micro-animation + label plate
      const B = [
        // word starts measured from the voice line's energy envelope (line08.wav): «пружний» +0.85 s, «майже» +1.53 s,
        // «поглинає» +3.5 s after c2 → each label is fully readable 0.3–0.4 s before its word
        { str: 'Пружний', at: c2 + 0.22, anim: animSpring },
        { str: 'Майже не вбирає вологу', at: c2 + 1.18, anim: animDrops },
        { str: 'Поглинає шум', at: c2 + 3.05, anim: animWave },
      ];
      // thin vertical guide connecting the tiles
      const gp = ep(t, c2 + 0.1, 3.2, 'inOutCubic');
      if (gp > 0.002) L.save(ctx, () => {
        const y0 = TILE.rows[0], y1 = lerp(y0, TILE.rows[2], gp);
        ctx.strokeStyle = L.rgba(C.brandHi, 0.22); ctx.lineWidth = 2; ctx.setLineDash([4, 10]);
        ctx.beginPath(); ctx.moveTo(TILE.x, y0); ctx.lineTo(TILE.x, y1); ctx.stroke();
      });
      B.forEach((b, i) => {
        const p = prog(t, b.at - 0.1, 0.75), t0 = b.at + 0.3;
        const act = L.envelope(t, t0 - 0.1, t0 + 1.4, 0.25, 0.6);
        tile(ctx, L, TILE.x, TILE.rows[i], TILE.s, p, act, () => b.anim(ctx, L, t, t0));
        plate(ctx, L, b.str, PILL_X, TILE.rows[i], prog(t, b.at + 0.05, 0.7), { size: 42 });
      });
    }

    L.vignette(ctx, 0.45);
  },
};
