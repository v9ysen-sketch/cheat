'use strict';
// Scene 11 — «Фінальна плашка (лише музика)» (timeline: global 174.13–180.00 s, d = 5.87 s; all beats derive from d).
// No voice, the final chord.
// Incoming transition: white flash (scene 11 is visible from t = 0, under a fading flash until t ≈ 0.4).
//   0.00–1.40  packshot builds softly as the flash clears: real logo settles, slogan, big «monoisol.com», contact line.
//   0.55–2.60  one faint elliptical ripple echoes the logo ring outwards (the chord).
//   0.00–4.20  a few snowflakes drift in the side margins, turn into warm sparks one by one and fade out.
//   1.75–3.25  a thin specular glint runs along the logo's ring.
//   0 → d-1.5  slow camera push 100 → 104 %, all ambient motion decelerates to a stop (≈ 4.37 s).
//   d-1.5 → d-0.3  fully static hold.      last 0.3 s: fade to black (fully black on the final frame).
// Text is drawn from 2x pre-rendered sprites so it glides sub-pixel with the push (live text ticked 1 px at a time).

const TAU = Math.PI * 2;
const sstep = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// ---------------------------------------------------------------- layout (1920x1080, push centre PX/PY)
const PX = 960, PY = 520;
const LOGO = { cx: 960, cy: 322, w: 780 };
const SLOGAN = { y: 516, size: 56 };
const DIV_Y = 598;
const URL = { y: 688, size: 84 };
const CONTACT = { y: 792, size: 34, icon: 36 };

// timing (local seconds)
const HOLD = 1.5;          // the last 1.5 s are a fully static frame (rest from d - HOLD)
const FADE_DUR = 0.3;      // fade to black at the very end

// ---------------------------------------------------------------- lazy caches
let K = null;
function init(L) {
  if (K) return K;
  K = {};
  // logo: the supplied PNG is cropped by a few px on every side (blunt ring tips) and has a small green smudge on the
  // bottom of the silver band — repair both on a padded copy, then pre-scale with a high-quality two-step downscale
  const src = repairLogo(L);
  K.SW = src.width; K.SH = src.height;
  const LW = 840, LH = Math.round(LW * K.SH / K.SW);
  const mid = L.offscreen(LW * 2, LH * 2), mx = mid.getContext('2d');
  mx.imageSmoothingQuality = 'high'; mx.drawImage(src, 0, 0, LW * 2, LH * 2);
  const lc = L.offscreen(LW, LH), lx = lc.getContext('2d');
  lx.imageSmoothingQuality = 'high'; lx.drawImage(mid, 0, 0, LW, LH);
  K.logo = lc; K.LW = LW; K.LH = LH;
  // source px -> cache px, and the original logo's frame inside the padded copy
  const k = LW / K.SW, ox = LP.x * k, oy = LP.y * k, ow = 2488 * k, oh = 776 * k;
  K.k = k; K.ow = ow;
  // ring only: remove the interior (lettering) with an ellipse fitted to the ring's inner edge
  const rc = L.offscreen(LW, LH), rx = rc.getContext('2d');
  rx.drawImage(lc, 0, 0);
  rx.globalCompositeOperation = 'destination-out';
  rx.beginPath(); rx.ellipse(ox + ow * 0.5, oy + oh * (390 / 776), ow * (1080 / 2488), oh * (262 / 776), 0, 0, TAU); rx.fill();
  K.ring = rc;
  // ring centre-line (cache px)
  K.ringCX = ox + ow * 0.5; K.ringRX = ow * 0.4707; K.ringRY = oh * 0.4265; K.ringCY = oy + oh * (392 / 776);
  // per-frame glint buffer
  K.gbuf = L.offscreen(LW, LH); K.gx = K.gbuf.getContext('2d');

  // warm spark sprite
  const sp = L.offscreen(64, 64), sx = sp.getContext('2d');
  const g = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,252,238,1)'); g.addColorStop(0.16, 'rgba(255,218,150,0.95)');
  g.addColorStop(0.42, 'rgba(255,156,62,0.38)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  sx.fillStyle = g; sx.fillRect(0, 0, 64, 64); K.spark = sp;
  // soft bokeh disc
  const bk = L.offscreen(160, 160), bx = bk.getContext('2d');
  const g3 = bx.createRadialGradient(80, 80, 0, 80, 80, 80);
  g3.addColorStop(0, 'rgba(255,206,140,0.11)'); g3.addColorStop(0.6, 'rgba(255,200,130,0.08)');
  g3.addColorStop(0.85, 'rgba(255,210,150,0.05)'); g3.addColorStop(1, 'rgba(255,200,130,0)');
  bx.fillStyle = g3; bx.fillRect(0, 0, 160, 160); K.bokeh = bk;

  // snowflakes in the side margins and top corners, kept >= ~100 px clear of the slogan's ends (x 385 / 1535 at y 516)
  // and of the ring's top arc while they drift down (they used to bracket the slogan like quote marks)
  const r = L.rng(1111);
  const slots = [
    [210, 210], [225, 515], [170, 690], [330, 880], [250, 350], [420, 640],
    [1700, 230], [1680, 500], [1760, 610], [1590, 820], [1820, 400], [1480, 600],
    [650, 96], [1275, 100],
  ];
  K.flakes = slots.map(([x, y], i) => ({
    x: x + (r() - 0.5) * 40, y: y + (r() - 0.5) * 40,
    s: 13 + r() * 15, rot: r() * TAU, spin: (r() - 0.5) * 0.5, sway: 8 + r() * 10, ph: r() * TAU,
    fall: 9 + r() * 10, tc: 0.95 + (i % 7) * 0.24 + r() * 0.18, life: 0.8 + r() * 0.45, depth: 0.55 + r() * 0.45,
  }));
  // tiny warm dust (fades before the hold)
  const rd = L.rng(2222);
  K.dust = Array.from({ length: 26 }, (_, i) => ({ x: (i % 2 ? 1480 + rd() * 400 : 40 + rd() * 400), y: rd() * 1080, v: 8 + rd() * 14, ph: rd() * TAU, s: 1 + rd() * 1.8, a: 0.2 + rd() * 0.35 }));
  // bokeh discs
  const rb = L.rng(3333);
  K.bok = Array.from({ length: 8 }, (_, i) => ({ x: [150, 380, 1580, 1790, 260, 1660, 560, 1380][i], y: [250, 860, 210, 800, 560, 520, 980, 990][i], r: 80 + rb() * 110, ph: rb() * TAU, a: 0.55 + rb() * 0.45 }));

  // icons (Feather, MIT) in a 24-unit box
  K.icoMail = [new L.Path2D('M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'), new L.Path2D('M22 6l-10 7L2 6')];
  K.icoPhone = [new L.Path2D('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z')];
  buildText(L);
  return K;
}

// padded, repaired copy of the official logo at source resolution (2488x776 -> +pad)
const LP = { x: 14, y: 8 };
function repairLogo(L) {
  const im = L.img('logo_hd.png'), W0 = im.width, H0 = im.height;
  const c = L.offscreen(W0 + LP.x * 2, H0 + LP.y * 2), x = c.getContext('2d');
  x.drawImage(im, LP.x, LP.y);
  // the PNG carries 1-px matte lines on its outermost rows/columns (they show as faint hairlines): erase them
  x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  x.fillRect(LP.x, LP.y, W0, 1); x.fillRect(LP.x, LP.y + H0 - 1, W0, 1);
  x.fillRect(LP.x, LP.y, 1, H0); x.fillRect(LP.x + W0 - 1, LP.y, 1, H0);
  x.restore();
  // smudge on the silver band's lower edge (x 1125–1465): besides the green/pink stain, its alpha forms a flat tab that
  // hangs ~2–6 px below the ring with hard corners. 1) cut the tab back to the ring's natural outer curve (quadratic fitted
  // to the clean edge on both sides, residual < 0.9 px, blended to meet the real edge exactly at both ends);
  // 2) recolour the band's lower rows from a clean row just above (the band is vertically uniform there; alpha kept)
  const edgeY = X => { const u = (X - 1300) / 100; return 773.517 - 0.3524 * u - 1.1966 * u * u + 0.47 - 0.6 * (X - 1120) / 350; };
  x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  x.beginPath(); x.moveTo(LP.x + 1118, LP.y + edgeY(1118));
  for (let X = 1120; X <= 1472; X += 2) x.lineTo(LP.x + X, LP.y + edgeY(X));
  x.lineTo(LP.x + 1472, LP.y + H0 + 4); x.lineTo(LP.x + 1118, LP.y + H0 + 4); x.closePath(); x.fill();
  x.restore();
  x.save(); x.globalCompositeOperation = 'source-atop';
  x.drawImage(im, 1100, 750, 375, 1, LP.x + 1100, LP.y + 751, 375, H0 - 751);
  x.restore();
  // ring tips cut flat by the crop (right: rows 384–420 at x 2486, left: rows 340–376 at x 1):
  // parabolic caps made by stretching the outermost real column, clipped to the cap shape
  const cap = (edgeX, sg, cy, hh, dep, srcCol) => {
    x.save(); x.beginPath();
    x.moveTo(edgeX - sg * 1.5, LP.y + cy - hh - 1); x.quadraticCurveTo(edgeX + sg * 2 * dep, LP.y + cy, edgeX - sg * 1.5, LP.y + cy + hh + 1);
    x.closePath(); x.clip();
    const x0 = sg > 0 ? edgeX - 2 : edgeX - dep - 1;
    x.drawImage(im, srcCol, 0, 1, H0, x0, LP.y, dep + 3, H0);
    x.restore();
  };
  cap(LP.x + 2487, 1, 402, 18, 4.5, 2485);
  cap(LP.x + 1, -1, 358, 18, 6, 2);
  return c;
}

// decelerated "ambient" time: runs 1:1 until tStill - 1.6 s, then slows to a stop exactly at tStill
function ambientTime(t, tStill) {
  const a = tStill - 1.6, b = tStill, span = b - a;
  if (t <= a) return t;
  const u = Math.min(t, b) - a;
  return a + u - (u * u) / (2 * span);
}

// ---------------------------------------------------------------- background
function background(ctx, L, ta) {
  // deep warm base
  const g = ctx.createLinearGradient(0, 0, 0, 1080);
  g.addColorStop(0, '#220C05'); g.addColorStop(0.45, '#4A1D0A'); g.addColorStop(1, '#1C0904');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  // broad amber glow (centre-low, behind the text block) — slowly breathing until the hold
  const cx = 960 + 40 * Math.sin(ta * 0.18), cy = 600;
  const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1150);
  rg.addColorStop(0, 'rgba(232,140,58,0.85)'); rg.addColorStop(0.3, 'rgba(200,104,40,0.55)');
  rg.addColorStop(0.62, 'rgba(130,56,20,0.22)'); rg.addColorStop(1, 'rgba(70,26,8,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, 1920, 1080);
  // soft warm top light (a hint of sunrise behind the logo)
  const tg = ctx.createRadialGradient(960, 300, 0, 960, 300, 700);
  tg.addColorStop(0, 'rgba(255,186,110,0.16)'); tg.addColorStop(1, 'rgba(255,186,110,0)');
  ctx.fillStyle = tg; ctx.fillRect(0, 0, 1920, 1080);
}

function bokeh(ctx, L, ta) {
  for (const b of K.bok) {
    const x = b.x + 22 * Math.sin(ta * 0.21 + b.ph), y = b.y + 14 * Math.cos(ta * 0.17 + b.ph);
    ctx.globalAlpha = b.a * (0.8 + 0.2 * Math.sin(ta * 0.5 + b.ph));
    ctx.drawImage(K.bokeh, x - b.r, y - b.r, b.r * 2, b.r * 2);
  }
  ctx.globalAlpha = 1;
}

function dust(ctx, L, t, ta, tStill) {
  const amt = 1 - sstep(tStill - 1.0, tStill - 0.1, t);
  if (amt <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of K.dust) {
    const y = ((p.y - ta * p.v) % 1080 + 1080) % 1080, x = p.x + 10 * Math.sin(ta * 0.6 + p.ph);
    ctx.fillStyle = `rgba(255,200,130,${(p.a * amt * (0.6 + 0.4 * Math.sin(ta * 1.7 + p.ph))).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, p.s, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- snowflake -> warm spark
function flakeShape(ctx, s, col, lw) {
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = k * TAU / 6, c = Math.cos(a), sn = Math.sin(a);
    ctx.moveTo(0, 0); ctx.lineTo(c * s, sn * s);
    // two little branches per arm
    for (const f of [0.45, 0.72]) {
      const bx = c * s * f, by = sn * s * f, bl = s * (f < 0.6 ? 0.3 : 0.2);
      for (const sg of [-1, 1]) { const b = a + sg * 0.75; ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(b) * bl, by + Math.sin(b) * bl); }
    }
  }
  ctx.stroke();
}

function flakes(ctx, L, t, ta) {
  for (const f of K.flakes) {
    const conv = L.ease.inOutSine(L.prog(t, f.tc, 0.65));           // flake -> spark morph
    const life = L.prog(t, f.tc + 0.35, f.life);                     // spark burns out
    const appear = sstep(-0.2, 0.5, t);
    if (life >= 1 || appear <= 0.001) continue;
    const x = f.x + f.sway * Math.sin(ta * 0.7 + f.ph);
    const y = f.y + ta * f.fall * (1 - conv) - 26 * L.ease.outCubic(life) + f.fall * f.tc * conv;
    // the snowflake (cool white), shrinking and warming as it turns
    const fa = appear * (1 - conv) * f.depth;
    if (fa > 0.01) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(f.rot + f.spin * ta + conv * 1.4); const sc = 1 - 0.55 * conv; ctx.scale(sc, sc);
      ctx.globalAlpha = fa * 0.85;
      flakeShape(ctx, f.s, L.mixColor('#EEF7FF', '#FFD9A0', conv * 1.6 > 1 ? 1 : conv * 1.6), 1.9);
      ctx.restore();
    }
    // the warm spark
    const sa = conv * (1 - L.ease.inQuad(life));
    if (sa > 0.01) {
      const flare = 1 + 0.6 * Math.sin(Math.PI * L.clamp(conv * 1.15)) * (1 - life);
      const sz = f.s * 2.8 * flare * (1 - 0.35 * life);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = sa * appear * 0.95;
      ctx.drawImage(K.spark, x - sz / 2, y - sz / 2, sz, sz);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- logo + ring glint
function drawLogo(ctx, L, t) {
  const pIn = L.prog(t, -0.05, 0.75), e = L.ease.outCubic(pIn);
  const a = L.clamp(pIn * 1.6);
  if (a <= 0.001) return;
  // padded logo canvas: same centre as the original artwork; LOGO.w is the width of the original 2488-px artwork
  const w = LOGO.w * K.SW / 2488, h = w * K.LH / K.LW, sc = L.lerp(0.965, 1, e);
  ctx.save();
  ctx.translate(LOGO.cx, LOGO.cy); ctx.scale(sc, sc);
  // contact shadow + warm halo for depth on the amber field
  ctx.save(); ctx.globalAlpha = a;
  const sg = ctx.createRadialGradient(0, h * 0.62, 0, 0, h * 0.62, w * 0.55);
  sg.addColorStop(0, 'rgba(30,8,0,0.42)'); sg.addColorStop(1, 'rgba(30,8,0,0)');
  ctx.translate(0, 0); ctx.scale(1, 0.22);
  ctx.fillStyle = sg; ctx.fillRect(-w * 0.6, h * 0.62 - w * 0.55, w * 1.2, w * 1.1);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
  L.glow(ctx, 0, 0, w * 0.62, '#FFB060', 0.10);
  ctx.restore();
  // the official logo (keyed PNG)
  ctx.globalAlpha = a;
  ctx.drawImage(K.logo, -w / 2, -h / 2, w, h);
  // thin specular glint travelling along the ring, over the top arc
  const gp = L.prog(t, 1.75, 1.5);
  if (gp > 0 && gp < 1) {
    const gx = K.gx, LW = K.LW, LH = K.LH;
    const th = L.lerp(0.80 * Math.PI, 2.20 * Math.PI, L.ease.inOutSine(gp));
    const px = K.ringCX + K.ringRX * Math.cos(th), py = K.ringCY + K.ringRY * Math.sin(th);
    const tang = Math.atan2(K.ringRY * Math.cos(th), -K.ringRX * Math.sin(th));
    const amp = Math.sin(Math.PI * gp);
    gx.globalCompositeOperation = 'source-over'; gx.clearRect(0, 0, LW, LH);
    gx.drawImage(K.ring, 0, 0);
    gx.globalCompositeOperation = 'source-in';
    gx.save(); gx.translate(px, py); gx.rotate(tang); gx.scale(1, 0.34);
    const rad = LW * 0.11;
    const gg = gx.createRadialGradient(0, 0, 0, 0, 0, rad);
    gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(0.14, 'rgba(255,253,245,0.95)');
    gg.addColorStop(0.4, 'rgba(255,244,222,0.42)'); gg.addColorStop(1, 'rgba(255,240,215,0)');
    gx.fillStyle = gg; gx.fillRect(-rad, -rad, rad * 2, rad * 2);
    gx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * amp;
    ctx.drawImage(K.gbuf, -w / 2, -h / 2, w, h);
    ctx.globalAlpha = a * amp * 0.6; ctx.drawImage(K.gbuf, -w / 2, -h / 2, w, h); // second pass: specular burn to white
    ctx.restore();
    // a tiny star twinkle as the glint crests the top of the ring
    const crest = Math.exp(-Math.pow((th - 1.5 * Math.PI) / 0.22, 2));
    if (crest > 0.02) {
      const sx = (px / LW - 0.5) * w, sy = (py / LH - 0.5) * h, s = 26 * crest;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * crest * 0.9;
      ctx.drawImage(K.spark, sx - s, sy - s, s * 2, s * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.moveTo(sx - s * 1.6, sy); ctx.lineTo(sx, sy - 1.4); ctx.lineTo(sx + s * 1.6, sy); ctx.lineTo(sx, sy + 1.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx, sy - s * 1.1); ctx.lineTo(sx + 1.4, sy); ctx.lineTo(sx, sy + s * 1.1); ctx.lineTo(sx - 1.4, sy); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

// faint elliptical ripple echoing the logo ring (the final chord)
function ripple(ctx, L, t) {
  const p = L.prog(t, 0.55, 2.05);
  if (p <= 0 || p >= 1) return;
  const e = L.ease.outCubic(p), sc = L.lerp(1.02, 1.75, e);
  const rx = LOGO.w * 0.4707 * sc, ry = LOGO.w * (776 / 2488) * 0.4265 * L.lerp(1.02, 1.9, e);
  ctx.save();
  ctx.strokeStyle = `rgba(255,214,160,${(0.22 * Math.sin(Math.PI * Math.min(1, p * 1.25)) * (1 - p)).toFixed(3)})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.ellipse(LOGO.cx, LOGO.cy, rx, ry, 0, 0, TAU); ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- text
// All text is pre-rendered ONCE at 2x into sprites (a glyph layer and a shadow-only layer) and drawn as images.
// Skia snaps glyph baselines to whole device pixels, so live fillText under the slow 100→104 % push made the lines tick
// 1 px at a time (and shimmer horizontally) while the bitmap logo glided; sprites move sub-pixel smoothly with the logo.
// The shadow layer is drawn at alpha a² vs the glyphs' a, so the shadow fades faster than the glyphs (no muddy halo).
const SS = 2, OFF = 6000;
function makeSprite(L, bx, by, bw, bh, paintGlyphs, paintShadow) {
  const mk = () => { const c = L.offscreen(Math.ceil(bw * SS), Math.ceil(bh * SS)), x = c.getContext('2d'); x.scale(SS, SS); x.translate(-bx, -by); return [c, x]; };
  const [g, gx] = mk(); paintGlyphs(gx);
  const [s, sx] = mk(); paintShadow(sx);
  return { g, s, bx, by, bw, bh };
}
function drawSprite(ctx, sp, dy, a, shA) {
  if (a <= 0.001) return;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (shA > 0.001) { ctx.globalAlpha = shA; ctx.drawImage(sp.s, sp.bx, sp.by + dy, sp.bw, sp.bh); }
  ctx.globalAlpha = a; ctx.drawImage(sp.g, sp.bx, sp.by + dy, sp.bw, sp.bh);
  ctx.restore();
}
// shadow only: the glyphs are drawn far outside the sprite and only their (device-space) shadow lands inside it
function shadowText(L, x, str, px, py, opts, sh) {
  x.save();
  x.shadowColor = sh.color; x.shadowBlur = sh.blur * SS; x.shadowOffsetX = OFF * SS; x.shadowOffsetY = sh.y * SS;
  L.text(x, str, px - OFF, py, opts);
  x.restore();
}

function icon(ctx, paths, x, y, size, color, alpha) {
  if (alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x - size / 2, y - size / 2); const s = size / 24; ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.lineWidth = 1.9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const p of paths) ctx.stroke(p);
  ctx.restore();
}

function buildText(L) {
  const m = L.offscreen(8, 8).getContext('2d');
  const SH = { color: 'rgba(36,10,0,0.55)', blur: 18, y: 4 };
  { // slogan: «Тепло,» in light brand green, the rest in cream
    const s1 = 'Тепло,', s2 = ' яке залишається вдома', role = 'displaySemi', size = SLOGAN.size, y = SLOGAN.y;
    const w1 = L.measure(m, s1, role, size), w2 = L.measure(m, s2, role, size), x0 = 960 - (w1 + w2) / 2;
    const o = { role, size, baseline: 'middle' };
    K.tSlogan = makeSprite(L, Math.floor(x0 - 60), Math.floor(y - size - 40), Math.ceil(w1 + w2 + 120), Math.ceil(size * 2 + 90),
      x => { L.text(x, s1, x0, y, { ...o, color: '#8FE8B2' }); L.text(x, s2, x0 + w1, y, { ...o, color: '#FFF4E6' }); },
      x => { shadowText(L, x, s1, x0, y, o, SH); shadowText(L, x, s2, x0 + w1, y, o, SH); });
  }
  { // big URL
    const str = 'monoisol.com', o = { role: 'display', size: URL.size, align: 'center', baseline: 'middle' }, y = URL.y;
    const w = L.measure(m, str, o.role, o.size);
    K.tUrl = makeSprite(L, Math.floor(960 - w / 2 - 70), Math.floor(y - URL.size - 50), Math.ceil(w + 140), Math.ceil(URL.size * 2 + 110),
      x => L.text(x, str, 960, y, { ...o, color: '#FFFFFF' }),
      x => shadowText(L, x, str, 960, y, o, { color: 'rgba(36,10,0,0.6)', blur: 24, y: 6 }));
  }
  { // contact line with green line icons
    const { size, icon: isz } = CONTACT, role = 'body', gi = 14, sep = 64, y = CONTACT.y;
    const s1 = 'info@monoisol.com', s2 = '+38 (067) 523-51-17', o = { role, size, baseline: 'middle' };
    const w1 = isz + gi + L.measure(m, s1, role, size), w2 = isz + gi + L.measure(m, s2, role, size);
    const x0 = 960 - (w1 + sep + w2) / 2, x1 = x0 + w1 + sep;
    K.tContact = makeSprite(L, Math.floor(x0 - 50), Math.floor(y - size - 30), Math.ceil(w1 + sep + w2 + 100), Math.ceil(size * 2 + 70),
      x => {
        icon(x, K.icoMail, x0 + isz / 2, y, isz, L.C.brandHi, 1);
        L.text(x, s1, x0 + isz + gi, y + 1, { ...o, color: '#FFEBD6' });
        x.fillStyle = 'rgba(255,214,170,0.6)'; x.beginPath(); x.arc(x1 - sep / 2, y, 3.5, 0, TAU); x.fill();
        icon(x, K.icoPhone, x1 + isz / 2, y, isz, L.C.brandHi, 1);
        L.text(x, s2, x1 + isz + gi, y + 1, { ...o, color: '#FFEBD6' });
      },
      x => { shadowText(L, x, s1, x0 + isz + gi, y + 1, o, SH); shadowText(L, x, s2, x1 + isz + gi, y + 1, o, SH); });
  }
}

function slogan(ctx, L, t) {
  const p = L.prog(t, 0.22, 0.8);
  if (p <= 0) return;
  const e = L.ease.outCubic(p), a = L.ease.outQuad(L.clamp(p * 1.5));
  drawSprite(ctx, K.tSlogan, (1 - e) * 22, a, a * a);
}

function divider(ctx, L, t) {
  const p = L.ease.inOutCubic(L.prog(t, 0.45, 0.8));
  if (p <= 0) return;
  const half = 300 * p;
  const g = ctx.createLinearGradient(960 - half, 0, 960 + half, 0);
  g.addColorStop(0, 'rgba(255,214,170,0)'); g.addColorStop(0.5, 'rgba(255,214,170,0.38)'); g.addColorStop(1, 'rgba(255,214,170,0)');
  ctx.fillStyle = g; ctx.fillRect(960 - half, DIV_Y - 1, half * 2, 2);
  // green centre accent
  const cw = 34 * p;
  ctx.fillStyle = L.C.brandHi; L.roundRect(ctx, 960 - cw, DIV_Y - 2.5, cw * 2, 5, 2.5); ctx.fill();
}

function url(ctx, L, t) {
  const p = L.prog(t, 0.42, 0.85);
  if (p <= 0) return;
  const e = L.ease.outCubic(p), a = L.ease.outQuad(L.clamp(p * 1.5));
  // soft dark plate glow behind the URL for contrast on the brightest part of the field
  ctx.save(); ctx.globalAlpha = a * 0.55;
  ctx.translate(960, URL.y); ctx.scale(1, 0.24);
  const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, 520);
  pg.addColorStop(0, 'rgba(60,18,2,0.55)'); pg.addColorStop(1, 'rgba(60,18,2,0)');
  ctx.fillStyle = pg; ctx.fillRect(-520, -520, 1040, 1040);
  ctx.restore();
  drawSprite(ctx, K.tUrl, (1 - e) * 26, a, a * a);
}

function contacts(ctx, L, t) {
  const p = L.prog(t, 0.62, 0.85);
  if (p <= 0) return;
  const e = L.ease.outCubic(p), a = L.ease.outQuad(L.clamp(p * 1.5));
  drawSprite(ctx, K.tContact, (1 - e) * 18, a, a * a);
}

// ---------------------------------------------------------------- scene
module.exports = {
  draw(ctx, t, d, L) {
    init(L);
    const tStill = d - HOLD;
    const ta = ambientTime(t, tStill);
    // slow push 100 → 104 %, ending at rest at tStill (ease-out, starts already moving under the flash)
    const pp = L.clamp(t / tStill), push = 1 + 0.04 * (1 - Math.pow(1 - pp, 2.2));

    background(ctx, L, ta);
    ctx.save();
    ctx.translate(PX, PY); ctx.scale(push, push); ctx.translate(-PX, -PY);
    bokeh(ctx, L, ta);
    dust(ctx, L, t, ta, tStill);
    flakes(ctx, L, t, ta);
    ripple(ctx, L, t);
    drawLogo(ctx, L, t);
    slogan(ctx, L, t);
    divider(ctx, L, t);
    url(ctx, L, t);
    contacts(ctx, L, t);
    ctx.restore();

    L.vignette(ctx, 0.5);

    // fade to black over the last 0.3 s, fully black on the final rendered frame (t = d - 1/30), and black past the end
    const fb = L.ease.inOutSine(L.prog(t, d - FADE_DUR, FADE_DUR - 1 / 30));
    if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb.toFixed(4)})`; ctx.fillRect(0, 0, 1920, 1080); }
  },
};
