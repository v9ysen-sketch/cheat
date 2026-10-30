'use strict';
// Scene 2 — «Тихий охоронець і поява бренду» (15.53 s)
//  0.0  frozen bare steel pipe, heat sparks leak out, cold air crystals
//  0.12 foam sleeve with a longitudinal slit slides on (visible ~0.45, cue 0 at 0.77), frost bursts off at its front
//  1.7  slit zips shut left→right, soft flash at 2.0, ice crystals blast away, palette turns amber,
//       heat sparks bounce off an invisible shield and fall back inside
//  2.8  sparks swirl into a vortex and assemble into the logo silhouette, pipe recedes
//  3.9  silhouette → real MONOISOL logo (cue 1 at 4.4), light sweep on the silver at 4.05 (shimmer sfx)
//  5.85 «з 2010» stamps in under the logo
//  8.2  match cut: the logo shrinks onto the centre logo of collage_1 (cue 2 at 8.9), camera pulls back
//  11.5 label «Теплоізоляція» (word spoken ~12.0); 12.35 logo-ellipse wipe to collage_2, «· пакування» at 12.75
//       (word spoken ~13.15)
//  13.4 collage blurs into a warm backdrop, logo returns to centre, tagline is typed underneath (14.05–14.75)

const TAU = Math.PI * 2;
const W = 1920, H = 1080;

// ---------- timing (local s) ----------
const T = {
  slideA: 0.12, slideD: 1.58,     // sleeve slides along the pipe
  zipA: 1.68, zipD: 0.32,       // slit zips shut
  snap: 2.0,                    // flash + ice blast
  warmA: 1.95, warmD: 1.6,      // blue → amber
  recedeA: 2.85, recedeD: 1.0,  // pipe group recedes
  vortexA: 2.75,                // first spark leaves the sleeve
  silA: 3.7, logoA: 3.9, logoD: 0.45,
  shine: 4.05,
  stamp: 5.85, stampOut: 7.75,
  match: 8.2, matchD: 1.05,
  // synced to the spoken words of cue 2 (measured on line05.wav): «теплоізоляції» ≈ 12.0–12.8, «пакування» ≈ 13.15–13.8,
  // VO ends 14.78. Label words land ~0.45 s before they are spoken; the packaging collage arrives with «пакування».
  label1: 11.5, label2: 12.75, labelOut: 13.75,
  wipe: 12.35, wipeD: 0.75,
  outro: 13.4, outroD: 0.85,
  tag: 14.05, tagD: 0.7,
};

// ---------- geometry ----------
const PY = 560, ANG = -0.055, PR = 44, SR = 88; // pipe centre line, tilt, pipe radius, sleeve radius
const U0 = -1300, U1 = 1300;                     // pipe extent along its axis (local)
const SLIT = -0.6;                               // slit position on the sleeve (fraction of SR)
const LOGO_W = 760, OX = 960, OY = 450;          // hero logo
const LOGO_AR = 776 / 2488;
// collage: centre logo ring bbox in collage px = 319..681 x 257..369 → centre (500, 313), width 362
const CL = { cx: 500, cy: 313, w: 362 };
const COL_S = 1.16, COL_Y = 455;                 // collage scale, screen y of its centre logo

// ---------- small helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, d) => clamp((t - a) / d);
const inOutCubic = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const outCubic = x => 1 - Math.pow(1 - x, 3);
const inCubic = x => x * x * x;
const inOutSine = x => -(Math.cos(Math.PI * x) - 1) / 2;
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// sleeve front position along the pipe axis
const sleeveFront = t => lerp(-1060, 1100, inOutCubic(prog(t, T.slideA, T.slideD)));
const zipX = t => lerp(-1050, 1050, inOutSine(prog(t, T.zipA, T.zipD)));
function timeFrontReaches(u) { // inverse of sleeveFront
  let a = T.slideA, b = T.slideA + T.slideD;
  if (sleeveFront(b) < u) return 1e9;
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (sleeveFront(m) < u) a = m; else b = m; }
  return (a + b) / 2;
}
// pipe group transform (push-in, then recede)
function pipeXf(t) {
  const push = 1 + 0.035 * inOutSine(prog(t, -0.4, 3.3));
  const e = inOutCubic(prog(t, T.recedeA, T.recedeD));
  return { s: push * lerp(1, 0.86, e), dy: 90 * e, alpha: 1 - e };
}
function pipeToScreen(u, v, xf) {
  const c = Math.cos(ANG), s = Math.sin(ANG);
  return [OX + xf.s * (u * c - v * s), PY + xf.dy + xf.s * (u * s + v * c)];
}

// ---------- precomputed particle sets ----------
const R0 = rng(2024);
// frost crystals on the bare pipe (released when the sleeve front passes)
const CRYSTALS = Array.from({ length: 420 }, () => {
  const u = lerp(-1100, 1100, R0()), top = R0() < 0.55;
  const v = top ? -PR * (0.8 + 0.32 * R0()) : lerp(-PR * 0.7, PR * 1.02, R0());
  return { u, v, size: 1.8 + R0() * 4.2, rot: R0() * TAU, spin: (R0() - 0.5) * 10, vx: 120 + R0() * 420, vy: (v < 0 ? -1 : 1) * (120 + R0() * 420), tc: timeFrontReaches(u), spike: top && R0() < 0.7 };
});
// cold air crystals (screen space) — blasted away at the snap
const AIR = Array.from({ length: 170 }, () => ({ x: R0() * W, y: R0() * H, d: R0(), ph: R0() * TAU, k: 0.6 + R0() * 0.8 }));
// ice shards blown off the sleeve at the snap (local space)
const SHARDS = Array.from({ length: 230 }, () => {
  const dir = R0() < 0.5 ? -1 : 1;
  return { u: lerp(-1000, 1000, R0()), dir, sp: 260 + R0() * 820, su: (R0() - 0.5) * 380, size: 2 + R0() * 4.5, rot: R0() * TAU, spin: (R0() - 0.5) * 14, life: 0.8 + R0() * 0.6 };
});
// heat sparks leaking from the bare pipe
const LEAKS = Array.from({ length: 64 }, () => ({ u: lerp(-1000, 1000, R0()), P: 1.5 + R0() * 1.0, ph: R0() * 3, sw: R0() * TAU, sp: 80 + R0() * 70, r: 14 + R0() * 10 }));
// heat sparks bouncing off the invisible shield (post-snap)
const BOUNCE = Array.from({ length: 90 }, () => ({ u: lerp(-950, 950, R0()), dir: R0() < 0.5 ? -1 : 1, P: 0.75 + R0() * 0.45, ph: R0() * 2, r: 12 + R0() * 9 }));
// vortex particles: leave the sleeve and settle on the logo silhouette
const NV = 380;
const VORTEX = Array.from({ length: NV }, () => ({
  u: lerp(-850, 850, R0()), v: lerp(-SR * 0.75, SR * 0.75, R0()),
  tr: T.vortexA + R0() * 0.4, dur: 0.78 + R0() * 0.14, turns: 0.15 + R0() * 0.35, r: 7 + R0() * 7, ph: R0() * TAU,
}));
// stamp dust
const DUST = Array.from({ length: 18 }, (_, i) => ({ a: (i / 18) * TAU + R0() * 0.3, sp: 80 + R0() * 120, r: 5 + R0() * 6 }));

// ---------- lazily built caches (created once) ----------
const cache = {};
function sprite(L, color) { // soft additive glow dot
  const key = 'spr' + color; if (cache[key]) return cache[key];
  const c = L.offscreen(64, 64), x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.16, L.rgba(color, 0.95)); g.addColorStop(0.42, L.rgba(color, 0.32)); g.addColorStop(1, L.rgba(color, 0));
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (cache[key] = c);
}
function logoTargets(L) { // points sampled from the official logo alpha (normalised 0..1)
  if (cache.targets) return cache.targets;
  const im = L.img('logo_hd.png'), w = 300, h = Math.round(300 * LOGO_AR);
  const c = L.offscreen(w, h), x = c.getContext('2d'); drawLogoTrimmed(x, L, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data, pts = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3] > 150) pts.push([(i + 0.5) / w, (j + 0.5) / h]);
  const r = rng(77);
  for (let i = pts.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); const tmp = pts[i]; pts[i] = pts[k]; pts[k] = tmp; }
  return (cache.targets = pts.slice(0, NV));
}
function silhouette(L) { // warm-gold silhouette of the logo (for the particle → logo morph)
  if (cache.sil) return cache.sil;
  const im = L.img('logo_hd.png'), w = 900, h = Math.round(900 * LOGO_AR);
  const c = L.offscreen(w, h), x = c.getContext('2d'); drawLogoTrimmed(x, L, 0, 0, w, h);
  x.globalCompositeOperation = 'source-in';
  const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#FFE6BA'); g.addColorStop(0.5, '#FFC46B'); g.addColorStop(1, '#FF9F43');
  x.fillStyle = g; x.fillRect(0, 0, w, h); return (cache.sil = c);
}
function collageNoLogo(L, name) { // collage with its centre logo erased (the hi-res official logo is drawn on top)
  const key = 'col' + name; if (cache[key]) return cache[key];
  const im = L.img(name), c = L.offscreen(im.width, im.height), x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  // the collage's own logo has a different letter layout than logo_hd.png, so erasing with the logo shape left ghost
  // letters next to the official ones: erase the whole ring ellipse instead (ring = x 319..680, y 258..369), soft edge
  const rx = 184, ry = 58.5, f = 6;
  x.globalCompositeOperation = 'destination-out';
  x.save(); x.translate(CL.cx, CL.cy + 0.5); x.scale(1, ry / rx);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, rx + f);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(rx / (rx + f), 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx + f, 0, TAU); x.fill(); x.restore();
  return (cache[key] = c);
}
const BLUR_PAD = 40;
function collageBlur(L, name) { // true gaussian ~12 px (on screen) blur of the logo-less collage, padded so nothing clips
  const key = 'blur' + name; if (cache[key]) return cache[key];
  const src = collageNoLogo(L, name);
  const c = L.offscreen(src.width + BLUR_PAD * 2, src.height + BLUR_PAD * 2), cx = c.getContext('2d');
  cx.filter = 'blur(9px)'; cx.drawImage(src, BLUR_PAD, BLUR_PAD); cx.filter = 'none';
  cx.globalCompositeOperation = 'source-atop'; cx.fillStyle = 'rgba(255,170,90,0.28)'; cx.fillRect(0, 0, c.width, c.height); // melt into the warm backdrop
  return (cache[key] = c);
}

// official logo, trimmed by ~1 px on every side (the asset has faint 1-px lines along its borders);
// the brand glow is painted separately so the trim never cuts it
function drawLogo(ctx, L, cx, cy, w, alpha, shine, glowAmt = 0.5) {
  if (alpha <= 0.002) return;
  const h = w * LOGO_AR, k = Math.max(1.2, w * 3 / 2488);
  if (glowAmt > 0) { ctx.save(); ctx.globalAlpha = alpha; L.glow(ctx, cx, cy, w * 0.62, L.C.brand, 0.16 * glowAmt); ctx.restore(); }
  ctx.save(); ctx.beginPath(); ctx.rect(cx - w / 2 + k, cy - h / 2 + k, w - 2 * k, h - 2 * k); ctx.clip();
  L.brandLogo(ctx, cx, cy, w, 1, { alpha, shine, glowAmt: 0 });
  ctx.restore();
}
function drawLogoTrimmed(x, L, dx, dy, dw, dh) { // same trim for offscreen uses of the logo image
  const k = Math.max(1, dw * 3 / 2488);
  x.save(); x.beginPath(); x.rect(dx + k, dy + k, dw - 2 * k, dh - 2 * k); x.clip(); x.drawImage(L.img('logo_hd.png'), dx, dy, dw, dh); x.restore();
}

// ---------- background ----------
function paintBackground(ctx, L, t, warm) {
  const cold = ['#040C18', '#0B2240', '#123561'], hot = ['#0A0706', '#1D110B', '#3B1F10'];
  const g = ctx.createLinearGradient(0, 0, W * 0.6, H * 1.2);
  g.addColorStop(0, L.mixColor(cold[0], hot[0], warm)); g.addColorStop(0.55, L.mixColor(cold[1], hot[1], warm)); g.addColorStop(1, L.mixColor(cold[2], hot[2], warm));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const col = L.mixColor(L.C.cyan, '#FF9F43', warm);
  for (let i = 0; i < 3; i++) {
    const x = W * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.13 + i * 2.1)));
    const y = H * (0.25 + 0.5 * (0.5 + 0.5 * Math.cos(t * 0.11 + i * 1.7)));
    L.glow(ctx, x, y, 520 + 120 * i, col, 0.09 + 0.03 * warm);
  }
}

// ---------- pipe + sleeve ----------
function tube(ctx, u0, u1, rad, lo, base, hi) {
  if (u1 <= u0) return;
  const g = ctx.createLinearGradient(0, -rad, 0, rad);
  g.addColorStop(0, lo); g.addColorStop(0.16, base); g.addColorStop(0.34, hi); g.addColorStop(0.56, base); g.addColorStop(1, lo);
  ctx.fillStyle = g; ctx.fillRect(u0, -rad, u1 - u0, rad * 2);
}
function drawPipeGroup(ctx, L, t, warm) {
  const xf = pipeXf(t); if (xf.alpha <= 0.002) return;
  const uf = sleeveFront(t), zx = zipX(t);
  const steel = ['#27303C', '#7A8797', '#E3EAF3'];
  ctx.save();
  ctx.globalAlpha = xf.alpha;
  ctx.translate(OX, PY + xf.dy); ctx.rotate(ANG); ctx.scale(xf.s, xf.s);
  // soft contact shadow / cold halo beneath
  ctx.save(); ctx.scale(1, 0.18); L.glow(ctx, 0, (SR + 70) / 0.18, 1100, '#000000', 0.35); ctx.restore();
  // steel pipe (full length)
  tube(ctx, U0, U1, PR, ...steel);
  // ---- sleeve body ----
  if (uf > U0) {
    ctx.save();
    ctx.beginPath(); ctx.rect(U0, -SR, uf - U0, SR * 2); ctx.clip();
    ctx.save(); ctx.translate(uf, 0); // pattern travels with the sleeve
    ctx.fillStyle = ctx.createPattern(L.foamTile({ cell: 9, color: L.C.foam, shade: L.C.foamDark, seed: 5, size: 192 }), 'repeat');
    ctx.fillRect(U0 - uf, -SR, uf - U0 + 4, SR * 2); ctx.restore();
    const sg = ctx.createLinearGradient(0, -SR, 0, SR);
    sg.addColorStop(0, 'rgba(18,26,40,0.62)'); sg.addColorStop(0.1, 'rgba(255,255,255,0.0)'); sg.addColorStop(0.28, 'rgba(255,255,255,0.42)');
    sg.addColorStop(0.5, 'rgba(255,255,255,0.08)'); sg.addColorStop(0.82, 'rgba(18,26,40,0.32)'); sg.addColorStop(1, 'rgba(8,12,22,0.72)');
    ctx.fillStyle = sg; ctx.fillRect(U0, -SR, uf - U0, SR * 2);
    // colour grade: cold blue → warm amber
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = L.mixColor('#B9D3F2', '#FFD3A1', warm); ctx.fillRect(U0, -SR, uf - U0, SR * 2);
    ctx.globalCompositeOperation = 'source-over';
    // warm inner glow (heat held inside)
    if (warm > 0) { const wg = ctx.createLinearGradient(0, -SR, 0, SR); wg.addColorStop(0, L.rgba('#FFB347', 0)); wg.addColorStop(0.5, L.rgba('#FF9F43', 0.16 * warm)); wg.addColorStop(1, L.rgba('#FFB347', 0)); ctx.fillStyle = wg; ctx.fillRect(U0, -SR, uf - U0, SR * 2); }
    // slit: open (dark gap) ahead of the zipper, a hairline behind it
    const vs = SR * SLIT, open = 9, shut = 1.6;
    const zc = Math.min(zx, uf);
    ctx.fillStyle = 'rgba(16,22,32,0.85)';
    if (zc > U0) ctx.fillRect(U0, vs - shut / 2, zc - U0, shut);
    if (uf > zc) ctx.fillRect(zc, vs - open / 2, uf - zc, open);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    if (zc > U0) ctx.fillRect(U0, vs + shut / 2, zc - U0, 1.4);
    if (uf > zc) ctx.fillRect(zc, vs + open / 2, uf - zc, 1.6);
    // zipper flash travelling along the slit + afterglow
    const zp = prog(t, T.zipA, T.zipD);
    if (zp > 0 && t < T.snap + 0.9) {
      const fade = 1 - prog(t, T.snap, 0.9);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createLinearGradient(zc - 900, 0, zc, 0); lg.addColorStop(0, L.rgba('#FFD08A', 0)); lg.addColorStop(1, L.rgba('#FFE7C2', 0.85 * fade));
      ctx.fillStyle = lg; ctx.fillRect(zc - 900, vs - 3, 900, 6);
      if (zp < 1) ctx.drawImage(sprite(L, '#FFD08A'), zc - 60, vs - 60, 120, 120);
      ctx.restore();
    }
    ctx.restore();
    // rim light along the top edge
    ctx.fillStyle = L.rgba(L.mixColor('#CFE8FF', '#FFC27A', warm), 0.35 + 0.25 * warm); ctx.fillRect(U0, -SR, uf - U0, 2);
    // snap flash: soft bloom over the whole sleeve
    const fl = Math.exp(-Math.max(0, t - T.snap) * 4.5) * inOutSine(clamp((t - T.snap + 0.12) / 0.12)); // soft 0.12 s rise (no pop)
    if (fl > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const fg = ctx.createLinearGradient(0, -SR * 2.6, 0, SR * 2.6);
      fg.addColorStop(0, L.rgba('#FFD08A', 0)); fg.addColorStop(0.5, L.rgba('#FFE2B8', 0.3 * fl)); fg.addColorStop(1, L.rgba('#FFD08A', 0));
      ctx.fillStyle = fg; ctx.fillRect(U0, -SR * 2.6, uf - U0, SR * 5.2);
      ctx.restore();
    }
    // front cap (C-shaped cross-section of the slit tube)
    if (uf < U1 - 40) {
      ctx.beginPath(); ctx.ellipse(uf, 0, SR * 0.3, SR, 0, 0, TAU); ctx.ellipse(uf, 0, PR * 0.3, PR, 0, 0, TAU);
      const cg = ctx.createLinearGradient(uf, -SR, uf, SR); cg.addColorStop(0, '#F4F7FB'); cg.addColorStop(1, '#AEB9C8');
      ctx.fillStyle = cg; ctx.fill('evenodd');
      ctx.save(); ctx.clip('evenodd'); ctx.globalAlpha *= 0.5; ctx.fillStyle = ctx.createPattern(L.foamTile({ cell: 7, seed: 13, size: 160 }), 'repeat'); ctx.fillRect(uf - SR, -SR, SR * 2, SR * 2); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.beginPath(); ctx.ellipse(uf, 0, SR * 0.3, SR, 0, 0, TAU); ctx.ellipse(uf, 0, PR * 0.3, PR, 0, 0, TAU); ctx.fillStyle = L.mixColor('#C4D9F2', '#FFD3A1', warm); ctx.fill('evenodd'); ctx.restore();
      const a = -Math.PI * 0.6; // slit notch
      ctx.strokeStyle = 'rgba(16,22,32,0.9)'; ctx.lineWidth = uf > zx ? 7 : 1.6;
      ctx.beginPath(); ctx.moveTo(uf + PR * 0.3 * Math.cos(a), PR * Math.sin(a)); ctx.lineTo(uf + SR * 0.3 * Math.cos(a), SR * Math.sin(a)); ctx.stroke();
      // bare pipe emerging from the cap (in front of the cap's right half)
      tube(ctx, uf, U1, PR, ...steel);
    }
  }
  // ---- frost on the bare part ----
  if (uf < U1) {
    const u0 = Math.max(uf, U0);
    const fg = ctx.createLinearGradient(0, -PR, 0, PR); fg.addColorStop(0, 'rgba(240,250,255,0.78)'); fg.addColorStop(0.3, 'rgba(215,240,255,0.30)'); fg.addColorStop(0.62, 'rgba(200,232,255,0.12)'); fg.addColorStop(1, 'rgba(190,225,250,0.45)');
    ctx.fillStyle = fg; ctx.fillRect(u0, -PR * 1.05, U1 - u0, PR * 2.1);
  }
  // frost crystals: attached ahead of the front, flying once released
  ctx.fillStyle = 'rgba(240,250,255,0.9)';
  for (const c of CRYSTALS) {
    const dt = t - c.tc;
    if (dt < 0) { if (c.u > uf + 2) { if (c.spike) rimeSpike(ctx, c.u, c.v, c.size * 0.9, (c.rot - Math.PI) * 0.12, 0.85); else iceMark(ctx, c.u, c.v, c.size, c.rot, 0.8, false); } continue; }
    if (dt > 0.95) continue;
    const k = 1 - Math.exp(-dt * 3.2);
    iceMark(ctx, c.u + c.vx * k / 3.2 * 3, c.v + c.vy * k / 3.2 * 3 + 160 * dt * dt, c.size * (1 - dt * 0.6), c.rot + c.spin * dt, 0.9 * (1 - dt / 0.95), false);
  }
  // ice shards blasted off at the snap
  const ds = t - T.snap;
  if (ds > 0 && ds < 1.5) {
    for (const s of SHARDS) {
      if (ds > s.life) continue;
      const k = (1 - Math.exp(-ds * 2.6)) / 2.6;
      const v = s.dir * (SR + 4 + s.sp * k), u = s.u + s.su * k;
      iceMark(ctx, u, v, s.size, s.rot + s.spin * ds, 0.85 * (1 - ds / s.life), true);
    }
  }
  // heat sparks (additive)
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const amber = sprite(L, '#FF9F43'), cyan = sprite(L, '#7FD6FF'), gold = sprite(L, '#FFD08A');
  for (const s of LEAKS) { // leaking through the bare pipe, dying in the blue
    const a = ((t + s.ph) % s.P + s.P) % s.P, born = t - a;
    if (born > T.snap - 0.1 || sleeveFront(born) > s.u) continue;
    const k = a / s.P, al = Math.sin(Math.PI * k) * (1 - prog(t, T.snap, 0.3)) * xf.alpha;
    if (al <= 0.01) continue;
    const u = s.u + Math.sin(a * 2.2 + s.sw) * 14 + a * 18, v = -PR - 6 - a * s.sp, r = s.r * (1 - 0.4 * k);
    ctx.globalAlpha = al * (1 - k) * 0.95; ctx.drawImage(amber, u - r, v - r, r * 2, r * 2);
    ctx.globalAlpha = al * k * 0.7; ctx.drawImage(cyan, u - r, v - r, r * 2, r * 2);
  }
  const bIn = prog(t, T.snap + 0.05, 0.3), bOut = 1 - prog(t, T.vortexA + 0.05, 0.4);
  if (bIn > 0 && bOut > 0) for (const s of BOUNCE) { // heat bouncing off the invisible shield
    const a = ((t + s.ph) % s.P + s.P) % s.P, k = a / s.P, tri = 1 - Math.abs(1 - 2 * k);
    const v = s.dir * lerp(PR * 0.2, SR + 8, tri), u = s.u + (k - 0.5) * 30;
    const al = bIn * bOut * xf.alpha;
    ctx.globalAlpha = al * 0.9; ctx.drawImage(amber, u - s.r, v - s.r, s.r * 2, s.r * 2);
    if (tri > 0.8) { // glint where it hits the shield
      const g = (tri - 0.8) / 0.2;
      ctx.globalAlpha = al * g * 0.8; ctx.drawImage(gold, u - 34, s.dir * (SR + 10) - 8, 68, 16);
    }
  }
  ctx.restore();
  ctx.restore();
}
function iceMark(ctx, x, y, s, rot, a, shard) {
  if (a <= 0.01 || s <= 0.2) return;
  ctx.globalAlpha = a;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  if (shard) { ctx.moveTo(0, -s * 1.6); ctx.lineTo(s * 0.55, 0); ctx.lineTo(0, s * 1.6); ctx.lineTo(-s * 0.55, 0); ctx.closePath(); ctx.fill(); }
  else { ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.7, 0); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function rimeSpike(ctx, x, y, s, rot, a) { // needle of hoarfrost sticking out of the pipe
  if (a <= 0.01) return;
  ctx.globalAlpha = a;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-s * 0.35, 0); ctx.lineTo(0, -s * 3.2); ctx.lineTo(s * 0.35, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 1.4); ctx.lineTo(-s * 1.2, -s * 2.2); ctx.lineTo(-s * 0.05, -s * 1.8); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// cold air crystals (screen space): drift, then blown away from the pipe at the snap
function drawAir(ctx, L, t) {
  const ds = Math.max(0, t - T.snap);
  const blast = 1 - Math.exp(-ds * 2.4), fade = 1 - prog(t, T.snap + 0.15, 1.0);
  if (fade <= 0) return;
  ctx.save();
  ctx.fillStyle = '#EAF7FF';
  for (const p of AIR) {
    const sp = 20 + p.d * 60;
    let x = ((p.x + t * (14 + p.d * 26) + Math.sin(t * 0.7 + p.ph) * 16) % W + W) % W;
    let y = ((p.y + t * sp) % H + H) % H;
    const ly = PY + (x - OX) * Math.tan(ANG), side = y < ly ? -1 : 1;
    const dist = Math.abs(y - ly);
    const push = blast * (520 + 380 * p.k) * (0.4 + 0.6 * Math.exp(-dist / 500));
    y += side * push; x += (x - OX) * blast * 0.18;
    const r = 1.2 + p.d * 3.2;
    ctx.globalAlpha = (0.22 + p.d * 0.55) * fade;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---------- vortex → logo ----------
function vortexPos(p, tgt, t, start) {
  const e = inOutCubic(prog(t, p.tr, p.dur));
  const ky = 1.9; // vortex is an ellipse, like the logo ring
  const sx = start[0] - OX, sy = (start[1] - OY) * ky, tx = (tgt[0] - 0.5) * LOGO_W, ty = (tgt[1] - 0.5) * LOGO_W * LOGO_AR * ky;
  const rs = Math.hypot(sx, sy), as = Math.atan2(sy, sx), rt = Math.hypot(tx, ty), at = Math.atan2(ty, tx);
  let da = ((at - as) % TAU + TAU) % TAU; da += p.turns * TAU;
  const ang = as + da * e, r = lerp(rs, rt, e) * (1 + 0.18 * Math.sin(Math.PI * e));
  return [OX + Math.cos(ang) * r, OY + Math.sin(ang) * r / ky, e];
}
function drawVortex(ctx, L, t) {
  if (t < T.vortexA - 0.05 || t > T.logoA + T.logoD + 0.1) return;
  const tg = logoTargets(L), gold = sprite(L, '#FFC46B'), out = 1 - prog(t, T.logoA + 0.05, T.logoD);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < NV; i++) {
    const p = VORTEX[i]; if (t < p.tr) continue;
    const start = pipeToScreen(p.u, p.v, pipeXf(p.tr));
    const [x, y, e] = vortexPos(p, tg[i], t, start);
    const al = clamp((t - p.tr) / 0.18) * out;
    if (al <= 0.01) continue;
    if (e < 0.98) { // motion streak: a short curved trail that follows the spiral (not a straight chord)
      ctx.globalAlpha = al * 0.4; ctx.strokeStyle = '#FFB347'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 1; s <= 4; s++) { const q = vortexPos(p, tg[i], Math.max(p.tr, t - s * 0.0045), start); ctx.lineTo(q[0], q[1]); }
      ctx.stroke();
    }
    const tw = 0.75 + 0.25 * Math.sin(t * 9 + p.ph), r = p.r * lerp(1.2, 0.7, e);
    ctx.globalAlpha = al * tw; ctx.drawImage(gold, x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

// ---------- slow «on guard» ripples around the logo during its hold ----------
function drawGuardRipples(ctx, L, t) {
  const env = clamp((t - 4.3) / 0.8) * (1 - clamp((t - (T.match - 0.6)) / 0.6));
  if (env <= 0) return;
  const w = heroW(t), h = w * LOGO_AR;
  ctx.save(); ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const k = (((t - 4.3) / 3.2 + i / 3) % 1 + 1) % 1, e = outCubic(k);
    const sx = 1.04 + 0.75 * e, a = Math.sin(Math.PI * k) * 0.16 * env;
    if (a <= 0.005) continue;
    ctx.strokeStyle = L.rgba('#FFC27A', a);
    ctx.beginPath(); ctx.ellipse(OX, OY, w / 2 * sx, h / 2 * (1 + (sx - 1) * 1.6), 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

// ---------- stamp «з 2010» ----------
function drawStamp(ctx, L, t) {
  const p = prog(t, T.stamp, 0.3); if (p <= 0) return;
  const out = inCubic(prog(t, T.stampOut, 0.4)); if (out >= 1) return;
  const imp = T.stamp + 0.3, after = t - imp;
  let sc = lerp(1.55, 1, p * p);
  if (after > 0) sc *= 1 - 0.035 * Math.sin(Math.PI * clamp(after / 0.22));
  sc *= 1 - 0.05 * out;
  const a = clamp(p * 2.2) * (1 - out);
  const cx = OX, cy = 700, rot = -0.045;
  const s1 = 'з', s2 = '2010', f1 = 58, f2 = 66;
  const w1 = L.measure(ctx, s1, 'displayLight', f1), gap = 18, w2 = L.measure(ctx, s2, 'display', f2);
  const tw = w1 + gap + w2, bw = tw + 96, bh = 112;
  ctx.save();
  ctx.translate(cx, cy + out * 14); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.globalAlpha = a;
  // impact bloom
  if (after > 0) L.glow(ctx, 0, 0, 260, '#FF9F43', 0.28 * Math.exp(-after * 3));
  L.roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fillStyle = 'rgba(14,10,8,0.55)'; ctx.fill();
  ctx.lineWidth = 3.5; ctx.strokeStyle = L.C.brandHi; ctx.stroke();
  L.roundRect(ctx, -bw / 2 + 9, -bh / 2 + 9, bw - 18, bh - 18, (bh - 18) / 2); ctx.lineWidth = 1.5; ctx.strokeStyle = L.rgba(L.C.brandHi, 0.6); ctx.stroke();
  const x0 = -tw / 2, by = 22;
  L.text(ctx, s1, x0, by, { role: 'displayLight', size: f1, color: '#FFE2B8' });
  L.text(ctx, s2, x0 + w1 + gap, by, { role: 'display', size: f2, color: '#FFF6EA' });
  ctx.restore();
  // impact ring + dust (unrotated, subtle)
  if (after > 0 && after < 0.8) {
    const k = outCubic(after / 0.8);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    const s = 1 + 0.28 * k; ctx.scale(s, s);
    ctx.globalAlpha = 0.55 * (1 - k) * (1 - out);
    L.roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.lineWidth = 2.5 / s; ctx.strokeStyle = L.C.brandHi; ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const spr = sprite(L, '#FFB347');
    for (const d of DUST) {
      const rr = (bw / 2) * 0.9 + d.sp * k;
      const x = cx + Math.cos(d.a) * rr, y = cy + Math.sin(d.a) * rr * 0.42;
      ctx.globalAlpha = 0.7 * (1 - k); ctx.drawImage(spr, x - d.r, y - d.r, d.r * 2, d.r * 2);
    }
    ctx.restore();
  }
}

// hero logo width: slow push while it holds centre stage
const heroW = t => LOGO_W * (1 + 0.025 * inOutSine(prog(t, T.logoA, T.match - T.logoA)));

// ---------- collage phase ----------
// collage zoom: fast pull-back for the match cut, then a slow continuing pull-back (Ken Burns 106 → 100 %)
function collageZoom(t) {
  const fast = 1 - inOutCubic(prog(t, T.match, T.matchD));
  const slow = 1 - inOutSine(prog(t, T.match + 0.6, 4.6));
  const outroDrift = 0.045 * inOutSine(prog(t, T.outro, 3.0));
  const z0 = heroW(T.match) / (CL.w * COL_S); // collage scale at which its logo equals the hero logo
  return 1 + 0.06 * slow + (z0 - 1.06) * fast + outroDrift;
}
function drawCollageImg(ctx, im, S, cy, alpha, pad = 0) {
  if (alpha <= 0.002) return;
  ctx.globalAlpha = alpha;
  ctx.drawImage(im, OX - (CL.cx + pad) * S, cy - (CL.cy + pad) * S, im.width * S, im.height * S);
  ctx.globalAlpha = 1;
}
function drawCollages(ctx, L, t) {
  if (t < T.match - 0.05) return null;
  const z = collageZoom(t), S = COL_S * z;
  const cy = lerp(OY, COL_Y, inOutCubic(prog(t, T.match, T.matchD)));
  const reveal = inOutSine(prog(t, T.match + 0.05, 0.75));
  const blurK = inOutSine(prog(t, T.outro, 0.8));
  const c1 = collageNoLogo(L, 'collage_1'), c2 = collageNoLogo(L, 'collage_2');
  const wp = prog(t, T.wipe, T.wipeD);
  ctx.save();
  if (wp <= 0) drawCollageImg(ctx, c1, S, cy, reveal);
  else {
    const e = inOutCubic(wp);
    const rx = lerp(CL.w * S * 0.5, 1500, e), ry = rx / lerp(LOGO_W / (LOGO_W * LOGO_AR), 1.75, e);
    if (wp < 1) { // collage_1 outside the growing logo-shaped ellipse
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.ellipse(OX, cy, rx, ry, 0, 0, TAU); ctx.clip('evenodd');
      drawCollageImg(ctx, c1, S, cy, 1); ctx.restore();
    }
    // collage_2 inside, pulling back from the centre logo as it opens
    const S2 = S * (1 + 0.14 * (1 - outCubic(wp)));
    ctx.save();
    if (wp < 1) { ctx.beginPath(); ctx.ellipse(OX, cy, rx, ry, 0, 0, TAU); ctx.clip(); }
    drawCollageImg(ctx, c2, S2, cy, 1 - blurK);
    drawCollageImg(ctx, collageBlur(L, 'collage_2'), S2 * (1 + 0.08 * blurK), cy, blurK * 0.42, BLUR_PAD);
    ctx.restore();
    // the wipe edge glows like the logo ring (green → silver)
    if (wp < 1) {
      const ra = Math.sin(Math.PI * wp);
      ctx.save(); ctx.globalAlpha = 0.85 * ra;
      const g = ctx.createLinearGradient(OX - rx, cy - ry, OX + rx, cy + ry);
      g.addColorStop(0, L.C.brandHi); g.addColorStop(0.45, L.C.brand); g.addColorStop(0.55, '#E8ECF0'); g.addColorStop(1, L.C.brandHi);
      ctx.strokeStyle = g; ctx.lineWidth = 9; ctx.shadowColor = L.C.brand; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.ellipse(OX, cy, rx, ry, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
  return { S, cy };
}

// ---------- label «Теплоізоляція · пакування» ----------
function drawLabel(ctx, L, t) {
  if (t < T.label1 || t > T.labelOut + 0.6) return;
  const role = 'displaySemi', size = 44, y = 902;
  const s1 = 'Теплоізоляція', sep = ' · ', s2 = 'пакування';
  const w1 = L.measure(ctx, s1, role, size), ws = L.measure(ctx, sep, role, size), w2 = L.measure(ctx, s2, role, size);
  // the first word is centred on its own, then the line glides left to stay centred as «· пакування» joins
  const x0 = lerp(OX - w1 / 2, OX - (w1 + ws + w2) / 2, inOutCubic(prog(t, T.label2 - 0.12, 0.6)));
  const out = inCubic(prog(t, T.labelOut, 0.45));
  const p1 = outCubic(prog(t, T.label1, 0.6)), p2 = outCubic(prog(t, T.label2, 0.6));
  const seg = (str, x, p, color) => {
    if (p <= 0.001) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 8, y - size * 1.1, L.measure(ctx, str, role, size) + 16, size * 1.5); ctx.clip();
    L.text(ctx, str, x, y + (1 - p) * size * 0.9 - out * size * 0.9, { role, size, color, alpha: p * (1 - out) });
    ctx.restore();
  };
  seg(s1, x0, p1, '#FFF4E6');
  seg('·', x0 + w1 + ws / 2 - L.measure(ctx, '·', role, size) / 2, p2, L.C.brandHi);
  seg(s2, x0 + w1 + ws, p2, '#FFF4E6');
  // active-category underline slides from the first word to the second with the collage swap
  const m = inOutCubic(prog(t, T.label2 + 0.05, 0.55)); // lands on «пакування» as the word is spoken (~13.15)
  const ux = lerp(x0, x0 + w1 + ws, m), uw = lerp(w1, w2, m) * outCubic(prog(t, T.label1 + 0.25, 0.6));
  ctx.save(); ctx.globalAlpha = 1 - out; ctx.fillStyle = L.C.brandHi;
  L.roundRect(ctx, ux, y + 20, uw, 5, 2.5); ctx.fill(); ctx.restore();
}

// ---------- tagline (typed) ----------
function drawTagline(ctx, L, t) {
  const p = prog(t, T.tag, T.tagD); if (p <= 0) return;
  const str = 'Тепло, яке залишається вдома', role = 'displayLight', size = 58, y = 642;
  const chars = [...str], n = chars.length;
  if (!cache.tagX) { cache.tagX = []; let acc = ''; for (const ch of chars) { cache.tagX.push(L.measure(ctx, acc, role, size)); acc += ch; } cache.tagW = L.measure(ctx, str, role, size); }
  const x0 = OX - cache.tagW / 2, k = p * (n + 3);
  for (let i = 0; i < n; i++) {
    const a = clamp((k - i) / 3); if (a <= 0) break;
    L.text(ctx, chars[i], x0 + cache.tagX[i], y + (1 - outCubic(a)) * 12, { role, size, color: i < 5 ? '#FFD08A' : '#FFF4E6', alpha: a });
  }
  if (p < 1) { // soft caret
    const cx = x0 + (Math.min(n, Math.floor(p * n)) < n ? cache.tagX[Math.min(n - 1, Math.floor(p * n))] : cache.tagW) + 4;
    ctx.save(); ctx.globalAlpha = 0.8 * (1 - prog(t, T.tag + T.tagD - 0.1, 0.2)); ctx.fillStyle = '#FFD08A'; ctx.fillRect(cx, y - size * 0.78, 4, size * 0.92); ctx.restore();
  }
}

module.exports = {
  draw(ctx, t, d, L) {
    const warm = inOutSine(prog(t, T.warmA, T.warmD));
    paintBackground(ctx, L, t, warm);

    // warm stage light behind the logo / collage
    const stage = warm * (0.75 + 0.25 * inOutSine(prog(t, T.logoA, 1.2)));
    L.glow(ctx, OX, OY + 10, 820, '#FF9F43', 0.17 * stage);
    // ambient: cold air before the snap, warm embers after
    drawAir(ctx, L, t);
    if (warm > 0) L.embers(ctx, t, { amount: 0.55 * warm, count: 34, color: '#FFB347', seed: 21 });

    drawPipeGroup(ctx, L, t, warm);

    // collage (match cut onwards)
    const col = drawCollages(ctx, L, t);

    // gold silhouette (particles settle into it), then the real logo
    const silA = clamp((t - T.silA) / 0.3) * (1 - clamp((t - T.logoA - 0.1) / T.logoD));
    if (silA > 0.01) {
      ctx.save(); ctx.globalAlpha = 0.85 * silA; ctx.globalCompositeOperation = 'lighter';
      const sil = silhouette(L); ctx.drawImage(sil, OX - LOGO_W / 2, OY - LOGO_W * LOGO_AR / 2, LOGO_W, LOGO_W * LOGO_AR);
      ctx.restore();
    }
    drawVortex(ctx, L, t);

    // real logo: hero → onto the collage → back to centre
    const la = clamp((t - T.logoA) / T.logoD);
    if (la > 0) {
      let w = heroW(t), cx = OX, cy = OY;
      if (col) { w = CL.w * col.S; cy = col.cy; } // locked onto the collage's centre logo
      const back = inOutCubic(prog(t, T.outro + 0.1, T.outroD));
      if (back > 0) { w = lerp(w, 680 * (1 + 0.025 * inOutSine(prog(t, T.outro + 1.0, 2.0))), back); cy = lerp(cy, 420, back); }
      // dark-warm scrim + halo behind the logo and tagline when it returns
      if (back > 0) {
        ctx.save(); ctx.translate(OX, 530); ctx.scale(1, 0.42);
        const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 900);
        sg.addColorStop(0, `rgba(16,9,5,${0.62 * back})`); sg.addColorStop(0.55, `rgba(16,9,5,${0.4 * back})`); sg.addColorStop(1, 'rgba(16,9,5,0)');
        ctx.fillStyle = sg; ctx.fillRect(-900, -900, 1800, 1800); ctx.restore();
        L.glow(ctx, OX, cy + 110, 700, '#FFB347', 0.2 * back);
      }
      const sh = prog(t, T.shine, 1.0);
      drawLogo(ctx, L, cx, cy, w, inOutSine(la), sh > 0 && sh < 1 ? sh : null, 0.5);
    }

    drawGuardRipples(ctx, L, t);
    drawStamp(ctx, L, t);
    drawLabel(ctx, L, t);
    drawTagline(ctx, L, t);

    L.vignette(ctx, 0.6);
  },
};
