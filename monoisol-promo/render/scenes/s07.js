'use strict';
// Scene 7 — «Фольговане полотно та стрічки» (17.37 s, global ≈107.07–124.43).
// Light warm ivory look (continuity with scene 6), brand-green accents, orange only for heat.
//  Beat A (cue 0, 0.40): headline «Фольговане полотно»; framed card foil_roll_sample in the centre (Ken Burns + a
//         metallic glint running over the foil); foil_wall_insitu / foil_duct_insitu fan out behind it; four round
//         badges pop under the cards in sync with the four words (тепло 3.35 · гідро 4.62 · звуко 5.86 · паро 7.34 —
//         word onsets measured from the voice file line19.wav).
//  Beat B (cue 1, 8.63): split screen — left: full-height blurred, warm-toned foil_wall_insitu whose right edge is the
//         silver foil line; right: a radiator emits wavy orange rays that bounce off the foil straight back to it;
//         label «Відбиває теплове випромінювання». ≈12.1 («до джерела») the radiator pulses as the rays return.
//  Beat C (cue 2, 13.23): headline «Демпферна стрічка» + pill «Стяжка без тріщин»; card damper_floor_insitu (cropped
//         below the site's inset caption) with Ken Burns along the tape; cross-section: heating pipes, the screed pours,
//         expands, a crack tries to form by the wall and dies in the tape strip. 15.4 mini card sealing_tape_1 + pill
//         «Ущільнювальні стрічки». 16.3 fourth window of the house emblem lights up.
// Top-right corner (x>1500, y<150) is kept free for the global logo; no text below y≈910.

// ---------- palette (light theme, shared with scene 6) ----------
const INK = '#14233A', INK2 = '#5B6577';
const HEAT = '#EC5B1F', HEAT2 = '#F6A12E';
const SHADOW = 'rgba(86,62,30,';

// ---------- layout ----------
const LM = 120;
const HEAD_A = { y: 186, size: 72 };
const MAIN = { cx: 960, cy: 466, w: 640, h: 427, rot: 0 };
const FAN = [
  { cx: 652, cy: 486, w: 468, h: 312, rot: -0.12 },
  { cx: 1268, cy: 486, w: 468, h: 312, rot: 0.12 },
];
const BADGE = { y: 796, xs: [510, 810, 1110, 1410], r: 52 };
const PX = 780;                                   // beat B: x of the foil line (edge of the photo panel)
const RAD = { x: 1420, y: 428, w: 300, h: 372 };  // radiator (top-left)
const FLOOR_Y = 836;
const RAYS = [450, 574, 698].map(y => ({ y0: y, yh: y + 44, y1: y + 88 }));
const HEAD_C = { x: LM, y: 296, size: 72 };
const DAMP = { cx: LM + 420, cy: 730 - 137, w: 840, h: 274, rot: 0 };
const DAMP_SRC = [0, 206, 600, 194];              // crop under the inset caption of the site photo
const DG = { wallX: 1086, wallW: 84, top: 352, tapeW: 32, tapeTop: 444, screedTop: 498, insTop: 652, baseTop: 674, baseBot: 730, right: 1790 };
const MINI = { cx: 1716, cy: 860, w: 160, h: 176, rot: 0.04 };

let S = null, BUF = null, BUFX = null;
function rngLocal(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

function prep(L) {
  if (S) return S;
  S = {};
  // screed texture (sand specks), drawn once
  const sw = DG.right - DG.wallX - DG.wallW + 40, sh = DG.insTop - DG.screedTop + 40;
  const sc = L.offscreen(sw, sh), sx = sc.getContext('2d');
  const g = sx.createLinearGradient(0, 0, 0, sh);
  g.addColorStop(0, '#D3CEC4'); g.addColorStop(1, '#BDB6AA');
  sx.fillStyle = g; sx.fillRect(0, 0, sw, sh);
  const r = rngLocal(29);
  for (let i = 0; i < 1400; i++) {
    const x = r() * sw, y = r() * sh, d = r();
    sx.fillStyle = d < 0.5 ? `rgba(90,80,66,${0.10 + r() * 0.16})` : `rgba(255,255,255,${0.14 + r() * 0.2})`;
    sx.beginPath(); sx.arc(x, y, 0.8 + r() * 1.6, 0, Math.PI * 2); sx.fill();
  }
  S.screed = sc;
  // lightly blurred wall photo (≈6 px on screen at the panel's scale)
  const wi = L.img('foil_wall_insitu');
  const wa = L.offscreen(240, 160), wax = wa.getContext('2d'); wax.imageSmoothingQuality = 'high'; wax.drawImage(wi, 0, 0, 240, 160);
  const wb = L.offscreen(600, 400), wbx = wb.getContext('2d'); wbx.imageSmoothingQuality = 'high'; wbx.drawImage(wa, 0, 0, 600, 400);
  S.wall = wb;
  // crack polyline (deterministic), from the screed top near the tape, down towards the tape
  const cr = rngLocal(5); S.crack = [];
  const x0 = DG.wallX + DG.wallW + DG.tapeW + 78, y0 = DG.screedTop;
  for (let i = 0; i <= 8; i++) {
    const f = i / 8;
    S.crack.push([x0 - f * 74 + (i && i < 8 ? (cr() - 0.5) * 18 : 0), y0 + f * 104]);
  }
  return S;
}

// ---------- background (same family as scene 6) ----------
function ivoryBg(ctx, L, t) {
  const { W, H } = L;
  const g = ctx.createLinearGradient(0, 0, W * 0.7, H * 1.25);
  g.addColorStop(0, '#FCF9F3'); g.addColorStop(0.55, '#F5EFE4'); g.addColorStop(1, '#EBE1CF');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 3; i++) {
    const x = W * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.12 + i * 2.2 + 1.1)));
    const y = H * (0.25 + 0.5 * (0.5 + 0.5 * Math.cos(t * 0.10 + i * 1.6 + 0.7)));
    L.glow(ctx, x, y, 560 + 120 * i, i === 1 ? '#FFE9D2' : '#FFFFFF', 0.55);
  }
  ctx.fillStyle = 'rgba(120,96,60,0.07)';
  const step = 46, ox = (t * 5) % step;
  for (let y = step / 2; y < H; y += step) for (let x = -step + ox; x < W + step; x += step) ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
  const r = rngLocal(23);
  for (let i = 0; i < 34; i++) {
    const d = r(), x0 = r() * W, y0 = r() * H, ph = r() * 6.28, v = 6 + d * 16;
    const y = ((y0 - t * v) % H + H) % H, x = x0 + Math.sin(t * 0.4 + ph) * 22;
    ctx.fillStyle = `rgba(150,110,60,${0.10 + d * 0.14})`;
    ctx.beginPath(); ctx.arc(x, y, 1.2 + d * 2.4, 0, Math.PI * 2); ctx.fill();
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.1);
  v.addColorStop(0, 'rgba(120,85,40,0)'); v.addColorStop(1, 'rgba(120,85,40,0.16)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// ---------- framed photo card (centre-based), optional source crop + metallic glint ----------
function card(ctx, L, name, c, o = {}) {
  const { alpha = 1, dx = 0, dy = 0, scale = 1, rot = c.rot || 0, k = 0, zoom = [1.03, 1.12], focus = [0.5, 0.5, 0.5, 0.5],
    src = null, glint = null, bw = 9, r = 20, shadowA = 0.30, dim = 0 } = o;
  if (alpha <= 0.002) return;
  const im = L.img(name);
  const kk = L.ease.inOutSine(L.clamp(k));
  const z = L.lerp(zoom[0], zoom[1], kk), fx = L.lerp(focus[0], focus[2], kk), fy = L.lerp(focus[1], focus[3], kk);
  const { w, h } = c;
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha;
    ctx.translate(c.cx + dx, c.cy + dy); if (rot) ctx.rotate(rot); if (scale !== 1) ctx.scale(scale, scale); ctx.translate(-w / 2, -h / 2);
    ctx.save(); ctx.shadowColor = SHADOW + shadowA + ')'; ctx.shadowBlur = 46; ctx.shadowOffsetY = 20;
    L.roundRect(ctx, -bw, -bw, w + bw * 2, h + bw * 2, r + bw); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
    ctx.save(); L.roundRect(ctx, 0, 0, w, h, r); ctx.clip();
    const [sx, sy, sw, sh] = src || [0, 0, im.width, im.height];
    const s = Math.max(w / sw, h / sh) * z, vw = w / s, vh = h / s;
    const vx = sx + (sw - vw) * L.clamp(fx), vy = sy + (sh - vh) * L.clamp(fy);
    ctx.drawImage(im, vx, vy, vw, vh, 0, 0, w, h);
    if (glint !== null && glint > -0.2 && glint < 1.2) {
      ctx.save();
      ctx.translate(w / 2, h / 2); ctx.rotate(0.42);
      const gx = L.lerp(-w * 0.9, w * 0.9, glint), bwid = 230;
      const gr = ctx.createLinearGradient(gx - bwid, 0, gx + bwid, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.46, 'rgba(255,255,255,0.32)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.42)'); gr.addColorStop(0.54, 'rgba(255,255,255,0.32)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = gr; ctx.fillRect(-w, -h * 1.2, w * 2, h * 2.4);
      ctx.restore();
    }
    const sg = ctx.createLinearGradient(0, 0, 0, h);
    sg.addColorStop(0, 'rgba(255,255,255,0.06)'); sg.addColorStop(0.6, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(40,25,10,0.14)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
    if (dim > 0.001) { ctx.fillStyle = `rgba(245,239,228,${dim})`; ctx.fillRect(0, 0, w, h); }
    ctx.restore();
  });
}

// light pill: white body, coloured border + icon. align left|center|right. returns width
function lightPill(ctx, L, str, x, y, p, { accent = L.C.brand, icon = null, align = 'left', size = 30, out = 0 } = {}) {
  const tw = L.measure(ctx, str, 'bodyBold', size), ih = icon ? size * 1.15 : 0;
  const padX = 28, pw = tw + padX * 2 + (icon ? ih + 14 : 0), ph = size * 1.95;
  if (p <= 0.001) return pw;
  const sx = align === 'center' ? x - pw / 2 : align === 'right' ? x - pw : x;
  const e = L.ease.outBack(L.clamp(p)), oo = L.ease.inCubic(L.clamp(out));
  if (oo >= 0.999) return pw;
  L.at(ctx, { x: sx + pw / 2, y: y - oo * 12, scale: L.lerp(0.75, 1, e), alpha: L.clamp(p * 1.6) * (1 - oo) }, () => {
    ctx.save(); ctx.shadowColor = SHADOW + '0.16)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    L.roundRect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
    L.roundRect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2); ctx.lineWidth = 2.5; ctx.strokeStyle = L.rgba(accent, 0.75); ctx.stroke();
    let cx = -pw / 2 + padX;
    if (icon) { icon(cx + ih / 2, 0, ih); cx += ih + 14; }
    L.text(ctx, str, cx, 1, { role: 'bodyBold', size, color: INK, baseline: 'middle' });
  });
  return pw;
}

// small house emblem (same as scene 6): 5 windows (bottom-left, bottom-right, top-left, top-middle, top-right)
function houseEmblem(ctx, L, x, y, s, lit, alpha) {
  if (alpha <= 0.002) return;
  L.at(ctx, { x, y, scale: s, alpha }, () => {
    const w = 96, h = 70, rh = 36;
    ctx.save(); ctx.shadowColor = SHADOW + '0.18)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
    L.roundRect(ctx, -w / 2 - 22, -h - rh - 22, w + 44, h + rh + 40, 26); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill(); ctx.restore();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-w / 2 - 8, -h + 2); ctx.lineTo(0, -h - rh); ctx.lineTo(w / 2 + 8, -h + 2); ctx.stroke();
    ctx.strokeRect(-w / 2, -h, w, h);
    const wins = [[-w / 2 + 12, -30], [w / 2 - 34, -30], [-w / 2 + 12, -h + 10], [-11, -h + 10], [w / 2 - 34, -h + 10]];
    wins.forEach(([wx, wy], i) => {
      const l = L.clamp(lit[i] || 0);
      if (l > 0.01) L.glow(ctx, wx + 11, wy + 9, 34, '#FFB547', 0.55 * l);
      ctx.fillStyle = L.mixColor('#E3E7EC', '#FFB547', l); ctx.fillRect(wx, wy, 22, 18);
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.strokeRect(wx, wy, 22, 18);
    });
    ctx.fillStyle = INK; L.roundRect(ctx, -9, -30, 18, 30, 3); ctx.fill();
  });
}

// ---------- badge icons (100-unit box, centred) ----------
function iconThermo(ctx, L, k, t) {
  ctx.beginPath(); L.roundRect(ctx, -11, -44, 22, 62, 11); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 30, 17, -Math.PI * 0.32, Math.PI * 1.32); ctx.stroke();
  const lvl = L.clamp(k) * (0.72 + 0.05 * Math.sin(t * 2.1));
  ctx.beginPath(); ctx.arc(0, 30, 9, 0, Math.PI * 2); ctx.fill();
  const top = 26 - lvl * 60;
  L.roundRect(ctx, -4.5, top, 9, 30 - top, 4.5); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(20, -32 + i * 13); ctx.lineTo(28, -32 + i * 13); ctx.stroke(); }
}
function iconDrop(ctx, L, k, t) {
  ctx.beginPath(); ctx.moveTo(0, -44); ctx.bezierCurveTo(10, -24, 34, -4, 34, 14); ctx.arc(0, 14, 34, 0, Math.PI); ctx.bezierCurveTo(-34, -4, -10, -24, 0, -44); ctx.stroke();
  // shine
  ctx.save(); ctx.lineWidth *= 0.8; ctx.globalAlpha *= 0.75;
  ctx.beginPath(); ctx.arc(0, 14, 21, Math.PI * 0.62, Math.PI * 0.98); ctx.stroke(); ctx.restore();
  // little bead sliding off the surface (water repelled)
  const ph = ((t * 0.55) % 1);
  if (k > 0.99) { ctx.save(); ctx.globalAlpha *= Math.sin(Math.PI * ph) * 0.8; ctx.beginPath(); ctx.arc(46, 22 + ph * 26, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
}
function iconSound(ctx, L, k, t) {
  ctx.beginPath(); const P = [[-40, -12], [-24, -12], [-4, -30], [-4, 30], [-24, 12], [-40, 12]];
  P.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.stroke();
  for (let j = 0; j < 2; j++) {
    const a = k > 0.99 ? 0.35 + 0.65 * Math.max(0, Math.sin(t * 3.2 - j * 1.3)) : 1;
    ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.arc(-4, 0, 22 + j * 16, -0.8, 0.8); ctx.stroke(); ctx.restore();
  }
}
function iconSteam(ctx, L, k, t) {
  for (let j = -1; j <= 1; j++) {
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const f = i / 14, y = 36 - f * 76;
      const x = j * 22 + Math.sin(f * 5.2 + t * 2.4 + j * 1.7) * 7 * (0.4 + f * 0.6);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
}
const ICONS = [iconThermo, iconDrop, iconSound, iconSteam];
const LABELS_A = ['Теплоізоляція', 'Гідроізоляція', 'Звукоізоляція', 'Пароізоляція'];

function badge(ctx, L, i, x, y, p, out, t) {
  if (p <= 0.001) return;
  const { C } = L, R = BADGE.r;
  const oo = L.ease.inCubic(L.clamp(out));
  if (oo >= 0.999) return;
  const e = L.ease.outBack(L.clamp(p / 0.75)), a = L.clamp(p * 2.4) * (1 - oo);
  const yy = y + oo * 26;
  // pop flash ring
  const fl = L.clamp((p - 0.15) / 0.85);
  if (fl > 0 && fl < 1) {
    ctx.save(); ctx.globalAlpha = (1 - fl) * 0.55 * (1 - oo); ctx.strokeStyle = C.brand; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, yy, R + 6 + fl * 34, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  L.at(ctx, { x, y: yy, scale: L.lerp(0.5, 1, e), alpha: a }, () => {
    ctx.save(); ctx.shadowColor = SHADOW + '0.22)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
    const rp = L.ease.inOutCubic(L.clamp((p - 0.05) / 0.6));
    ctx.beginPath(); ctx.arc(0, 0, R - 6, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = L.rgba(C.brand, 0.18); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R - 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rp); ctx.lineWidth = 4; ctx.strokeStyle = C.brand; ctx.lineCap = 'round'; ctx.stroke();
    const ik = L.clamp((p - 0.2) / 0.5);
    ctx.save(); ctx.scale(0.56, 0.56); ctx.globalAlpha *= L.clamp(ik * 1.5);
    ctx.strokeStyle = C.brandDark; ctx.fillStyle = C.brandDark; ctx.lineWidth = 6.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ICONS[i](ctx, L, ik, t);
    ctx.restore();
  });
  const lp = L.ease.outCubic(L.clamp((p - 0.18) / 0.6));
  L.text(ctx, LABELS_A[i], x, yy + R + 50 + (1 - lp) * 16, { role: 'bodyBold', size: 30, color: INK, align: 'center', alpha: lp * (1 - oo) });
}

// ---------- beat B pieces ----------
function photoPanel(ctx, L, t, wR) {
  if (wR <= 0.5) return;
  const { H } = L;
  const bl = S.wall;
  L.save(ctx, () => {
    ctx.beginPath(); ctx.rect(0, 0, wR, H); ctx.clip();
    const z = 1.06 + 0.04 * L.ease.inOutSine(L.clamp((t - 8) / 6));
    L.drawCover(ctx, bl, 0, 0, PX, H, z, 0.82 - 0.06 * L.clamp((t - 8) / 5), 0.55);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(120,96,80,0.22)'; ctx.fillRect(0, 0, PX, H);
    ctx.globalCompositeOperation = 'soft-light';
    const g = ctx.createLinearGradient(0, 0, PX, H);
    g.addColorStop(0, 'rgba(255,176,104,0.42)'); g.addColorStop(1, 'rgba(255,140,70,0.38)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, PX, H);
    ctx.globalCompositeOperation = 'source-over';
    // warm light from the radiator side
    const rg = ctx.createLinearGradient(PX - 360, 0, PX, 0);
    rg.addColorStop(0, 'rgba(255,150,70,0)'); rg.addColorStop(1, 'rgba(255,150,70,0.20)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, PX, H);
    const vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(20,10,4,0.25)'); vg.addColorStop(0.5, 'rgba(20,10,4,0)'); vg.addColorStop(1, 'rgba(20,10,4,0.3)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, PX, H);
  });
}

function foilBar(ctx, L, x, t, a, hitGlow) {
  if (a <= 0.002) return;
  const { H } = L, bw = 22;
  L.save(ctx, () => {
    ctx.globalAlpha *= a;
    // soft shadow onto the room side
    const sg = ctx.createLinearGradient(x, 0, x + 60, 0);
    sg.addColorStop(0, 'rgba(70,50,30,0.22)'); sg.addColorStop(1, 'rgba(70,50,30,0)');
    ctx.fillStyle = sg; ctx.fillRect(x, 0, 60, H);
    const g = ctx.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
    g.addColorStop(0, '#5F6873'); g.addColorStop(0.18, '#C4CBD4'); g.addColorStop(0.45, '#FFFFFF'); g.addColorStop(0.7, '#AEB6C0'); g.addColorStop(1, '#58616C');
    ctx.fillStyle = g; ctx.fillRect(x - bw / 2, 0, bw, H);
    ctx.fillStyle = 'rgba(30,40,55,0.35)'; ctx.fillRect(x + bw / 2, 0, 1.5, H);
    // crinkle: faint horizontal facets
    ctx.globalAlpha *= 0.5;
    for (let y = 0; y < H; y += 9) {
      const v = Math.sin(y * 0.37) * 0.5 + Math.sin(y * 0.11 + 1.3) * 0.5;
      ctx.fillStyle = v > 0 ? `rgba(255,255,255,${0.35 * v})` : `rgba(70,80,92,${-0.3 * v})`;
      ctx.fillRect(x - bw / 2, y, bw, 4);
    }
    ctx.globalAlpha /= 0.5;
    // travelling sheen
    const sy = ((t * 260) % (H + 600)) - 300;
    const sh = ctx.createLinearGradient(0, sy - 160, 0, sy + 160);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.9)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(x - bw / 2, sy - 160, bw, 320);
    for (const [hy, ha] of hitGlow) if (ha > 0.01) { L.glow(ctx, x + 6, hy, 54, '#FFFFFF', 0.75 * ha); L.glow(ctx, x + 10, hy, 80, HEAT2, 0.35 * ha); }
  });
}

function radiator(ctx, L, t, a, heat, pulse) {
  if (a <= 0.002) return;
  const { x, y, w, h } = RAD;
  const n = 7, gap = 9, cw = (w - gap * (n - 1)) / n;
  L.save(ctx, () => {
    ctx.globalAlpha *= a;
    L.glow(ctx, x + w / 2, y + h / 2, w * 1.05, '#FF9A4A', 0.20 + 0.22 * heat + 0.25 * pulse);
    // floor line
    ctx.fillStyle = 'rgba(20,35,58,0.14)'; ctx.fillRect(PX + 8, FLOOR_Y, 1800 - PX - 8, 2);
    // legs
    ctx.fillStyle = '#C9C1B3';
    ctx.fillRect(x + 26, y + h - 4, 10, FLOOR_Y - y - h + 4); ctx.fillRect(x + w - 36, y + h - 4, 10, FLOOR_Y - y - h + 4);
    // contact shadow
    const cg = ctx.createRadialGradient(x + w / 2, FLOOR_Y, 10, x + w / 2, FLOOR_Y, w * 0.7);
    cg.addColorStop(0, 'rgba(80,55,30,0.20)'); cg.addColorStop(1, 'rgba(80,55,30,0)');
    ctx.fillStyle = cg; ctx.fillRect(x - w * 0.3, FLOOR_Y - 30, w * 1.6, 50);
    // header tubes
    const hg = ctx.createLinearGradient(0, 0, 0, 26);
    for (const hy of [y + 20, y + h - 46]) {
      ctx.save(); ctx.translate(0, hy);
      hg.addColorStop(0, '#FFFFFF'); hg.addColorStop(1, '#D3CBBD');
      L.roundRect(ctx, x - 8, 0, w + 16, 26, 13); ctx.fillStyle = hg; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(20,35,58,0.16)'; ctx.stroke();
      ctx.restore();
    }
    // columns
    for (let i = 0; i < n; i++) {
      const cx = x + i * (cw + gap);
      const g = ctx.createLinearGradient(cx, 0, cx + cw, 0);
      g.addColorStop(0, '#EDE7DC'); g.addColorStop(0.35, '#FFFFFF'); g.addColorStop(1, '#CFC6B6');
      ctx.save(); ctx.shadowColor = SHADOW + '0.18)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
      L.roundRect(ctx, cx, y, cw, h, cw / 2); ctx.fillStyle = g; ctx.fill(); ctx.restore();
      L.roundRect(ctx, cx, y, cw, h, cw / 2); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(20,35,58,0.18)'; ctx.stroke();
      // warm inner glow
      const wg = ctx.createLinearGradient(0, y, 0, y + h);
      const hA = 0.10 + 0.16 * heat + 0.22 * pulse;
      wg.addColorStop(0, `rgba(255,140,60,${hA * 0.6})`); wg.addColorStop(1, `rgba(255,110,40,${hA})`);
      L.roundRect(ctx, cx + 3, y + 3, cw - 6, h - 6, cw / 2 - 3); ctx.fillStyle = wg; ctx.fill();
    }
    // valve (bottom right)
    const vx = x + w + 8, vy = y + h - 33;
    ctx.fillStyle = '#B9C0C8'; L.roundRect(ctx, vx, vy - 8, 26, 16, 5); ctx.fill();
    ctx.fillStyle = '#E9ECEF'; L.roundRect(ctx, vx + 18, vy - 22, 14, 30, 5); ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(20,35,58,0.25)'; ctx.stroke();
  });
}

// wavy ray segment from P0 to P1, visible between distances s0..s1 (px); arrow chevron at s1
function wave(ctx, L, P0, P1, s0, s1, phase, color, a, arrowAt, A = 9, lw = 5, tIn = 40, tOut = 30) {
  if (a <= 0.002 || s1 - s0 < 2) return;
  const dx = P1[0] - P0[0], dy = P1[1] - P0[1], len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const lam = 50;
  const pt = s => {
    const env = L.ease.inOutSine(L.clamp(s / tIn)) * L.ease.inOutSine(L.clamp((len - s) / tOut));
    const o = Math.sin((s - phase) / lam * Math.PI * 2) * A * env;
    return [P0[0] + ux * s + nx * o, P0[1] + uy * s + ny * o];
  };
  L.save(ctx, () => {
    ctx.globalAlpha *= a;
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = L.rgba(color, 0.5); ctx.shadowBlur = 10;
    ctx.beginPath();
    const st = 5; let first = true;
    for (let s = s0; s < s1; s += st) { const [x, y] = pt(s); first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false; }
    const [ex, ey] = pt(s1); ctx.lineTo(ex, ey);
    ctx.stroke();
    if (arrowAt != null && arrowAt > 30) {
      const sa = Math.min(arrowAt, s1), hx = P0[0] + ux * sa, hy = P0[1] + uy * sa, k = 18;
      ctx.beginPath();
      ctx.moveTo(hx - ux * k + nx * k * 0.75, hy - uy * k + ny * k * 0.75); ctx.lineTo(hx, hy); ctx.lineTo(hx - ux * k - nx * k * 0.75, hy - uy * k - ny * k * 0.75);
      ctx.stroke();
    }
  });
}

// ---------- beat C: damper tape cross-section ----------
function damperDiagram(ctx, L, t, T, a) {
  if (a <= 0.002) return;
  const { C } = L, s = S;
  const wx = DG.wallX, ww = DG.wallW, tx = wx + ww, R = DG.right;
  const build = L.ep(t, T.dg, 0.7, 'outCubic');
  const pour = L.ep(t, T.pour, 1.0, 'inOutSine');
  const pushP = L.envelope(t, T.push, T.push + 1.3, 0.35, 0.5);
  const comp = L.ep(t, T.push, 0.5, 'inOutSine') * (1 - 0.6 * L.ep(t, T.push + 1.0, 0.8, 'inOutSine'));
  const crackGrow = L.ep(t, T.crack, 0.4, 'outCubic');
  const crackFade = L.ep(t, T.crack + 0.42, 0.45, 'inOutSine');
  const okP = L.ep(t, T.ok, 0.6, 'linear');
  const tapeW = DG.tapeW - 10 * comp;
  const shift = -10 * comp;
  const heat = L.ep(t, T.push - 0.3, 0.6, 'inOutSine') * (1 - 0.45 * L.ep(t, T.ok, 1.0, 'inOutSine'));
  L.save(ctx, () => {
    ctx.globalAlpha *= a * L.clamp(build * 1.5);
    ctx.translate(0, (1 - build) * 30);
    // soft ground shadow under the section
    ctx.save(); ctx.shadowColor = SHADOW + '0.18)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#C7C9CC'; ctx.fillRect(wx, DG.baseTop, R - wx, DG.baseBot - DG.baseTop); ctx.restore();
    // base slab (section hatch)
    ctx.save(); ctx.beginPath(); ctx.rect(tx, DG.baseTop, R - tx, DG.baseBot - DG.baseTop); ctx.clip();
    ctx.fillStyle = '#C3C6CA'; ctx.fillRect(tx, DG.baseTop, R - tx, DG.baseBot - DG.baseTop);
    ctx.strokeStyle = 'rgba(20,35,58,0.20)'; ctx.lineWidth = 1.5;
    for (let x = tx - 60; x < R; x += 16) { ctx.beginPath(); ctx.moveTo(x, DG.baseBot); ctx.lineTo(x + 56, DG.baseTop); ctx.stroke(); }
    ctx.restore();
    // wall (masonry hatch)
    const wg = ctx.createLinearGradient(wx, 0, wx + ww, 0);
    wg.addColorStop(0, '#D8D0C2'); wg.addColorStop(1, '#E8E1D5');
    ctx.fillStyle = wg; ctx.fillRect(wx, DG.top, ww, DG.baseBot - DG.top);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, DG.top, ww, DG.baseBot - DG.top); ctx.clip();
    ctx.strokeStyle = 'rgba(120,96,60,0.22)'; ctx.lineWidth = 1.5;
    for (let y = DG.top - 100; y < DG.baseBot; y += 18) { ctx.beginPath(); ctx.moveTo(wx, y + ww); ctx.lineTo(wx + ww, y); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = 'rgba(20,35,58,0.25)'; ctx.fillRect(wx + ww - 2, DG.top, 2, DG.baseBot - DG.top);
    // wall top fades out (it continues upwards)
    const tg = ctx.createLinearGradient(0, DG.top - 2, 0, DG.top + 70);
    tg.addColorStop(0, 'rgba(247,242,233,1)'); tg.addColorStop(1, 'rgba(247,242,233,0)');
    ctx.fillStyle = tg; ctx.fillRect(wx - 2, DG.top - 2, ww + 4, 72);
    // insulation sheet with foil top
    const ix = tx + DG.tapeW;
    ctx.save(); ctx.beginPath(); ctx.rect(ix, DG.insTop, R - ix, DG.baseTop - DG.insTop);
    L.foamFill(ctx, { cell: 6, seed: 4 }); ctx.restore();
    ctx.fillStyle = '#EEF1F4'; ctx.fillRect(ix, DG.insTop - 3, R - ix, 4);
    ctx.fillStyle = 'rgba(110,120,135,0.7)'; ctx.fillRect(ix, DG.insTop + 1, R - ix, 1.2);
    // screed pour (flows in from the right, levels out)
    const left = tx + tapeW, front = L.lerp(R + 10, left, L.ease.outQuad(L.clamp(pour * 1.18)));
    const Hmax = DG.insTop - DG.screedTop, lvlP = L.lerp(0.5, 1, L.ease.inOutSine(pour));
    const taper = 190 * (1 - L.ease.inOutSine(L.clamp((pour - 0.78) / 0.22)));
    const lvl = DG.insTop - Hmax * lvlP;
    if (pour > 0.001) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(R, DG.insTop);
      const wob = (1 - L.ease.outCubic(pour)) * 5;
      for (let x = R; x >= front - 1; x -= 8) {
        const xx = Math.max(x, front), f = taper > 1 ? L.clamp((xx - front) / taper) : 1;
        const hgt = Hmax * lvlP * Math.sqrt(f * (2 - f));
        ctx.lineTo(xx, DG.insTop - hgt + Math.sin(xx * 0.03 + t * 4) * wob * f);
      }
      ctx.lineTo(front, DG.insTop);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(s.screed, tx - 10 + shift, DG.screedTop - 20);
      if (heat > 0.01) {
        const hg = ctx.createLinearGradient(0, DG.screedTop, 0, DG.insTop);
        hg.addColorStop(0, 'rgba(255,140,60,0)'); hg.addColorStop(1, `rgba(255,120,50,${0.26 * heat})`);
        ctx.fillStyle = hg; ctx.fillRect(front, DG.screedTop, R - front, DG.insTop - DG.screedTop);
      }
      ctx.restore();
    }
    // heating pipes (on the insulation, embedded in the screed)
    const pipesP = L.ep(t, T.dg + 0.2, 0.7, 'outCubic');
    const pipeY = DG.insTop - 30;
    for (let i = 0; i < 8; i++) {
      const px = ix + 66 + i * 76 + shift * 0.7;
      if (px > R - 24) continue;
      const pp = L.clamp(pipesP * 2.2 - i * 0.16);
      if (pp <= 0) continue;
      const rr = L.lerp(0.5, 1, L.ease.outBack(pp));
      ctx.save(); ctx.globalAlpha *= L.clamp(pp * 2);
      ctx.beginPath(); ctx.arc(px, pipeY, 17 * rr, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(20,35,58,0.35)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(px, pipeY, 10 * rr, 0, Math.PI * 2); ctx.fillStyle = L.mixColor('#9FB4C8', HEAT, heat); ctx.fill();
      if (heat > 0.05) L.glow(ctx, px, pipeY, 40, HEAT2, 0.35 * heat);
      ctx.restore();
    }
    // section break line on the right
    ctx.save(); ctx.strokeStyle = 'rgba(20,35,58,0.55)'; ctx.lineWidth = 2; ctx.lineJoin = 'miter';
    const y0 = (pour > 0.5 ? DG.screedTop : DG.insTop) - 12, y1 = DG.baseBot + 12, ym = (y0 + y1) / 2;
    ctx.fillStyle = 'rgba(247,242,233,1)';
    ctx.beginPath(); ctx.moveTo(R, y0); ctx.lineTo(R, ym - 16); ctx.lineTo(R + 12, ym - 6); ctx.lineTo(R - 12, ym + 6); ctx.lineTo(R, ym + 16); ctx.lineTo(R, y1); ctx.stroke();
    ctx.restore();
    // damper tape (foam strip against the wall)
    ctx.save(); ctx.beginPath(); ctx.rect(tx, DG.tapeTop, tapeW, DG.baseTop - DG.tapeTop);
    L.foamFill(ctx, { cell: 5, color: '#8FDBAE', shade: '#3E9E66', seed: 6 }); ctx.restore();
    ctx.lineWidth = 1.5; ctx.strokeStyle = L.rgba(C.brandDark, 0.7); ctx.strokeRect(tx + 0.75, DG.tapeTop + 0.75, tapeW - 1.5, DG.baseTop - DG.tapeTop - 1.5);
    const absorb = L.envelope(t, T.crack + 0.3, T.crack + 1.4, 0.3, 0.6);
    if (absorb > 0.01) L.glow(ctx, tx + tapeW / 2, DG.screedTop + 60, 110, C.brandHi, 0.65 * absorb);
    // expansion arrows inside the screed (heat makes the screed grow towards the wall)
    if (pushP > 0.01 && pour > 0.9) {
      for (let i = 0; i < 3; i++) {
        const ax = tx + 190 + i * 170 - pushP * 22, ay = DG.screedTop + 50;
        ctx.save(); ctx.globalAlpha *= pushP; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(160,70,20,0.45)'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(ax + 56, ay); ctx.lineTo(ax, ay); ctx.moveTo(ax + 17, ay - 15); ctx.lineTo(ax, ay); ctx.lineTo(ax + 17, ay + 15); ctx.stroke();
        ctx.restore();
      }
    }
    // crack: tries to form by the wall, dies in the tape
    if (crackGrow > 0.001 && crackFade < 0.999) {
      const pts = s.crack, n = pts.length - 1, upto = crackGrow * n;
      ctx.save(); ctx.globalAlpha *= 1 - crackFade;
      ctx.strokeStyle = '#2E241E'; ctx.lineWidth = 3.4; ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pts[0][0] + shift, pts[0][1]);
      for (let i = 1; i <= Math.ceil(upto); i++) {
        const f = Math.min(1, upto - (i - 1));
        ctx.lineTo(L.lerp(pts[i - 1][0], pts[i][0], f) + shift, L.lerp(pts[i - 1][1], pts[i][1], f));
      }
      ctx.stroke();
      ctx.restore();
    }
    // ok badge above the tape
    if (okP > 0.001) {
      const e = L.ease.outBack(L.clamp(okP / 0.7));
      L.at(ctx, { x: tx + DG.tapeW / 2, y: DG.tapeTop - 52, scale: L.lerp(0.4, 1, e), alpha: L.clamp(okP * 2) }, () => {
        ctx.save(); ctx.shadowColor = SHADOW + '0.25)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
        ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fillStyle = C.brand; ctx.fill(); ctx.restore();
        L.drawIcon(ctx, 'check', 0, 1, 34, '#FFFFFF', L.clamp((okP - 0.2) / 0.6), 4.5);
      });
    }
  });
}

function rollIcon(ctx, L, x, y, s) {
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = L.C.brand;
  ctx.beginPath(); ctx.arc(x, y, s * 0.42, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, s * 0.16, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// ---------- timing ----------
function timing(env) {
  const cs = (env && env.cues) || [];
  const c0 = cs[0] ? cs[0].start : 0.4, c1 = cs[1] ? cs[1].start : 8.633, c2 = cs[2] ? cs[2].start : 13.233;
  return {
    c0, c1, c2,
    card: c0 - 0.55, head: c0 - 0.22, fan: c0 + 0.5,
    words: [2.95, 4.22, 5.46, 6.94].map(x => c0 + x - 0.22),     // word onsets in line19.wav, shown 0.22 s early
    outA: c1 - 0.66,
    panel: c1 - 0.34, label: c1 - 0.26, rad: c1 - 0.1, rays: c1 + 0.3, back: c1 + 1.05, src: c1 + 3.45,
    outB: c1 + 3.97,                                            // ≈12.60 (cue 1 ends 12.98)
    headC: c2 - 0.24, cardC: c2 - 0.36, dg: c2 - 0.2, pour: c2 + 0.6, push: c2 + 1.55, crack: c2 + 1.8, ok: c2 + 2.55,
    pillC: c2 + 1.5, mini: c2 + 2.17, win: c2 + 3.07,
  };
}

function beatA(ctx, L, t, T) {
  const { W } = L;
  const cardIn = L.ep(t, T.card, 1.0, 'outCubic');
  const fanIn = L.ep(t, T.fan, 1.1, 'inOutCubic');
  FAN.forEach((c, i) => {
    card(ctx, L, i ? 'foil_duct_insitu' : 'foil_wall_insitu', c, {
      alpha: L.clamp(fanIn * 2.2),
      dx: (1 - fanIn) * (MAIN.cx - c.cx) * 0.92, dy: (1 - fanIn) * (MAIN.cy - c.cy),
      rot: c.rot * fanIn, scale: L.lerp(0.86, 1, fanIn),
      k: L.clamp((t - T.fan) / 7.5), zoom: [1.04, 1.13], focus: i ? [0.45, 0.5, 0.6, 0.45] : [0.6, 0.5, 0.45, 0.5],
      shadowA: 0.22, dim: 0.06,
    });
  });
  card(ctx, L, 'foil_roll_sample', MAIN, {
    alpha: L.clamp(cardIn * 1.6),
    dy: (1 - cardIn) * 60, scale: L.lerp(0.94, 1, cardIn),
    k: L.clamp((t - T.card) / 8.6), zoom: [1.03, 1.15], focus: [0.42, 0.55, 0.5, 0.42],
    glint: ((t - 1.0) % 3.2 + 3.2) % 3.2 / 1.6 - 0.1,
  });
  L.revealText(ctx, 'Фольговане полотно', W / 2, HEAD_A.y, L.ep(t, T.head, 1.1, 'linear'), {
    role: 'display', size: HEAD_A.size, color: INK, align: 'center', stagger: 0.25,
  });
  BADGE.xs.forEach((x, i) => badge(ctx, L, i, x, BADGE.y, L.prog(t, T.words[i], 0.75), 0, t));
}

module.exports = {
  draw(ctx, t, d, L, env) {
    const { C, W, H } = L;
    prep(L);
    const T = timing(env);
    ivoryBg(ctx, L, t);

    // ======================= BEAT A — foil sheet =======================
    // the whole group recedes together (rendered into a reusable buffer during the exit, so cards never ghost)
    const outA = L.ep(t, T.outA, 0.55, 'inOutCubic');
    if (outA <= 0.001) beatA(ctx, L, t, T);
    else if (outA < 0.999) {
      if (!BUF) { BUF = L.offscreen(W, H); BUFX = BUF.getContext('2d'); }
      BUFX.setTransform(1, 0, 0, 1, 0, 0); BUFX.globalAlpha = 1; BUFX.globalCompositeOperation = 'source-over';
      BUFX.clearRect(0, 0, W, H);
      beatA(BUFX, L, t, T);
      L.save(ctx, () => {
        const sc = 1 - 0.07 * outA;
        ctx.globalAlpha = 1 - outA;
        ctx.translate(W / 2, 540); ctx.scale(sc, sc); ctx.translate(-W / 2, -540 + 24 * outA);
        ctx.drawImage(BUF, 0, 0);
      });
    }

    // ======================= BEAT B — reflection =======================
    const panelIn = L.ep(t, T.panel, 0.75, 'inOutCubic');
    const panelOut = L.ep(t, T.outB - 0.05, 0.5, 'inOutCubic');
    const panelW = PX * panelIn * (1 - panelOut);
    if (panelW > 0.5) {
      photoPanel(ctx, L, t, panelW);
      foilBar(ctx, L, panelW, t, 1, []);
    }
    const bOut = L.ep(t, T.outB, 0.45, 'inOutSine');
    if (t > T.panel - 0.1 && bOut < 0.999) {
      const radIn = L.ep(t, T.rad, 0.8, 'outCubic');
      const pulse = Math.max(L.envelope(t, T.src, T.src + 0.9, 0.25, 0.6), 0);
      const heatAmt = L.ep(t, T.rad, 1.2, 'inOutSine');
      L.save(ctx, () => {
        ctx.globalAlpha *= 1 - bOut;
        ctx.translate((1 - radIn) * 80 + bOut * 40, 0);
        radiator(ctx, L, t, L.clamp(radIn * 1.5), heatAmt, pulse);
        if (pulse > 0.01) {
          ctx.save(); ctx.strokeStyle = L.rgba(HEAT2, 0.6 * pulse); ctx.lineWidth = 3;
          const rr = 60 + 160 * L.prog(t, T.src, 0.9);
          ctx.beginPath(); ctx.ellipse(RAD.x + RAD.w / 2, RAD.y + RAD.h / 2, rr * 1.1, rr, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
      });
      // rays
      const hits = [];
      const fx = PX + 9;
      RAYS.forEach((r, i) => {
        const P0 = [RAD.x - 18, r.y0], P1 = [fx, r.yh], P2 = [RAD.x - 18, r.y1];
        const l1 = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), l2 = l1;
        const g1 = L.ep(t, T.rays + i * 0.16, 0.85, 'inOutSine') * l1;
        const g2 = L.ep(t, T.back + i * 0.16, 0.85, 'inOutSine') * l2;
        const ph = t * 95;
        const a = (1 - bOut) * L.clamp(radIn * 1.4);
        wave(ctx, L, P0, P1, 0, g1, ph, HEAT, a, g1 < l1 * 0.5 ? g1 : l1 * 0.5, 9, 5, 40, 90);
        wave(ctx, L, P1, P2, 0, g2, ph - l1, HEAT2, a, g2, 7, 4.5, 90, 30);
        // energy packets travelling along the full path once both legs exist
        const live = L.ep(t, T.back + 0.9 + i * 0.16, 0.4, 'linear') * a;
        if (live > 0.01) {
          const per = 1.5, sp = (l1 + l2) / 1.5;
          for (let q = 0; q < 2; q++) {
            const s = (((t - T.back) + q * per / 2 + i * 0.37) % per + per) % per * sp;
            let x, y;
            if (s < l1) { const f = s / l1; x = L.lerp(P0[0], P1[0], f); y = L.lerp(P0[1], P1[1], f); }
            else { const f = (s - l1) / l2; x = L.lerp(P1[0], P2[0], f); y = L.lerp(P1[1], P2[1], f); }
            const edge = L.clamp(s / 60) * L.clamp((l1 + l2 - s) / 60);
            L.glow(ctx, x, y, 26, '#FFF3E0', 0.9 * live * edge);
            ctx.fillStyle = `rgba(255,255,255,${0.95 * live * edge})`; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
          }
        }
        // impact glow when the incident wave reaches the foil, then a gentle flicker of energy
        const hitA = L.envelope(t, T.rays + i * 0.16 + 0.75, T.rays + i * 0.16 + 1.6, 0.15, 0.6) +
          0.35 * L.ep(t, T.back + 0.9, 0.5) * (0.6 + 0.4 * Math.sin(t * 5 + i * 2));
        hits.push([r.yh, Math.min(1, hitA) * (1 - bOut)]);
      });
      // impact glows on top of the foil line
      if (panelW > PX - 2) for (const [hy, ha] of hits) if (ha > 0.01) { L.glow(ctx, PX + 6, hy, 50, '#FFFFFF', 0.7 * ha); L.glow(ctx, PX + 10, hy, 80, HEAT2, 0.3 * ha); }
      // label
      const lp = L.ep(t, T.label, 1.1, 'linear');
      const lo = L.ep(t, T.outB - 0.05, 0.4, 'linear');
      const ap = L.ep(t, T.label, 0.7, 'inOutCubic') * (1 - L.ep(t, T.outB - 0.05, 0.35, 'inOutCubic'));
      if (ap > 0.002) L.save(ctx, () => { ctx.fillStyle = C.brand; L.roundRect(ctx, PX + 120, 188, 64 * ap, 6, 3); ctx.fill(); });
      L.revealText(ctx, 'Відбиває теплове випромінювання', PX + 120, 272, lp, {
        role: 'display', size: 58, color: INK, maxWidth: 760, lineHeight: 1.2, stagger: 0.3,
        highlight: ['теплове'], highlightColor: HEAT, out: lo,
      });
    }

    // ======================= BEAT C — damper tape =======================
    if (t > T.cardC - 0.05) {
      const hp = L.ep(t, T.headC, 1.0, 'linear');
      const ap = L.ep(t, T.headC, 0.7, 'inOutCubic');
      L.save(ctx, () => { ctx.fillStyle = C.brand; L.roundRect(ctx, HEAD_C.x, HEAD_C.y - 86, 64 * ap, 6, 3); ctx.fill(); });
      L.revealText(ctx, 'Демпферна стрічка', HEAD_C.x - 3, HEAD_C.y, hp, { role: 'display', size: HEAD_C.size, color: INK, stagger: 0.3 });
      lightPill(ctx, L, 'Стяжка без тріщин', HEAD_C.x, HEAD_C.y + 78, L.ep(t, T.pillC, 0.7, 'linear'), {
        icon: (x, y, sz) => L.drawIcon(ctx, 'check', x, y + 1, sz * 0.95, C.brand, L.clamp((t - T.pillC - 0.15) / 0.5), 3.6),
      });
      const ci = L.ep(t, T.cardC, 0.95, 'outCubic');
      card(ctx, L, 'damper_floor_insitu', DAMP, {
        alpha: L.clamp(ci * 1.6), dy: (1 - ci) * 70, scale: L.lerp(0.95, 1, ci), src: DAMP_SRC,
        k: L.clamp((t - T.cardC) / 5.2), zoom: [1.0, 1.14], focus: [0.1, 0.4, 0.95, 0.75],
      });
      damperDiagram(ctx, L, t, T, 1);
      // sealing tape mini card + pill
      const mp = L.prog(t, T.mini, 0.8);
      if (mp > 0.001) {
        const e = L.ease.outBack(L.clamp(mp / 0.8));
        card(ctx, L, 'sealing_tape_1', MINI, {
          alpha: L.clamp(mp * 2.2), scale: L.lerp(0.6, 1, e), rot: MINI.rot * e + (1 - e) * 0.2, bw: 7, r: 16,
          k: L.clamp((t - T.mini) / 2.5), zoom: [1.06, 1.14], focus: [0.5, 0.45, 0.5, 0.55],
        });
        lightPill(ctx, L, 'Ущільнювальні стрічки', MINI.cx - MINI.w / 2 - 30, MINI.cy + 22, L.ep(t, T.mini + 0.2, 0.7, 'linear'), {
          align: 'right', icon: (x, y, sz) => rollIcon(ctx, L, x, y, sz),
        });
      }
    }

    // ======================= HOUSE EMBLEM =======================
    {
      const w4 = L.ep(t, T.win, 0.45, 'outCubic');
      const pop = Math.sin(Math.PI * L.prog(t, T.win - 0.05, 0.6)) * 0.07;
      houseEmblem(ctx, L, LM + 70, 150, 0.82 * (1 + pop), [1, 1, 1, w4, 0], 1);
      if (w4 > 0 && w4 < 1) {
        const bx = LM + 70 + (-11 + 11) * 0.82, by = 150 + (-70 + 10 + 9) * 0.82;
        ctx.save(); ctx.strokeStyle = L.rgba('#FFB547', 0.8 * (1 - w4)); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(bx, by, 10 + 40 * w4, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }
  },
};
