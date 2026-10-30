'use strict';
// Scene 6 — «Поліпропіленові труби HD і фітинги» (10.7 s).
// Light ivory look with thin red "marking stripe" accents.
//  Beat 1 (cue 0, 0.63 s): pill «Для водопостачання» + headline left; framed photo cards fittings_1 (from the left,
//          caption «Фітинги») and pp_pipes_3 (from the right, overlapping); real pp_print strip floats along the bottom.
//  Beat 2 (cue 1, 5.77 s): cards defocus and leave; white panel with the official 3-layer scheme (pp_hd_scheme_ua),
//          layers 1 → 2 → 3 are spot-lit, the middle (fibreglass) layer pulses with fibre dots; on the right a rotating
//          vector cross-section, stat «3 шари» and pill «Армування скловолокном». 9.75 s: third window of the house
//          emblem lights up.

// ---------- palette (light theme) ----------
const INK = '#14233A', INK2 = '#5B6577', RED = '#D3303C', REDSOFT = '#EC6A63', REDDEEP = '#B4232F';
const PP = '#ECE4D4', PP_HI = '#FBF8F0', PP_LO = '#C8BAA1', PP_DK = '#A8987D';
const SHADOW = 'rgba(86,62,30,';

// ---------- timing (local seconds) ----------
const T = {
  pill: 0.15, fit: 0.22, head: 0.95, line: 1.55, cap: 1.40, pipes: 2.05, strip: 2.55,
  out1: 4.82,                       // beat-1 exit (cue 0 ends 5.19) — fully clear by ~5.34, before the panel builds
  panel: 5.32, scheme: 5.36, xs: 5.42, stat: 5.52,
  hl1: 6.00, hl2: 6.50, hl3: 7.00, hl2b: 7.50, pill2: 7.62,
  win: 9.75,
};

// ---------- layout ----------
const LM = 120;                                         // left margin (right margin is also 120)
const FIT = { x: 1000, y: 178, w: 560, h: 420, rot: -0.032 };
const PIPES = { x: 1296, y: 372, w: 492, h: 369, rot: 0.042 };
const STRIP = { y: 852, scale: 1.2 };                  // centre line of the floating pp_print belt
const PANEL = { x: LM, y: 212, w: 1000, h: 694, pad: 28 };   // ≥ 45 px below the house emblem
const XS = { cx: 1466, cy: 418, R: 176 };               // rotating cross-section
const SCH = { w: 800, h: 540 };                         // crop of pp_hd_scheme_ua (left drawing + labels)
// label rectangles inside the crop, one per layer (kept crisp together with their layer)
const LABELS = [[116, 160, 290, 62], [324, 216, 408, 100], [462, 326, 316, 54]];
// label areas excluded from the layer ownership map (so labels never get a green outline); label 3 is trimmed to
// y < 376 because the inner tube starts at y ≈ 378 right under it
const NOOWN = [[116, 160, 290, 62], [324, 216, 408, 100], [462, 324, 330, 52]];

let S = null; // lazily built caches (images are decoded by render.js before the first draw)

function prep(L) {
  if (S) return S;
  S = {};
  // --- scheme crop + per-layer masks -------------------------------------------------------
  const src = L.img('pp_hd_scheme_ua');
  const base = L.offscreen(SCH.w, SCH.h), bx = base.getContext('2d');
  bx.fillStyle = '#FFFFFF'; bx.fillRect(0, 0, SCH.w, SCH.h);
  bx.drawImage(src, 0, 0, SCH.w, SCH.h, 0, 0, SCH.w, SCH.h);
  const id = bx.getImageData(0, 0, SCH.w, SCH.h), d = id.data, Wd = SCH.w;
  const lum = i => (d[i] + d[i + 1] + d[i + 2]) / 3;
  const isRed = i => d[i] > 150 && d[i] - d[i + 1] > 45;
  const owner = new Uint8Array(SCH.w * SCH.h);
  for (let y = 290; y < 534; y++) {
    let minR = -1, maxR = -1;
    for (let x = 188; x < 470; x++) { const i = (y * Wd + x) * 4; if (isRed(i)) { if (minR < 0) minR = x; maxR = x; } }
    for (let x = 0; x < 680; x++) {
      const i = (y * Wd + x) * 4; if (lum(i) > 243) continue;
      if (NOOWN.some(([lx, ly, lw, lh]) => x >= lx && x < lx + lw && y >= ly && y < ly + lh)) continue;
      let k;
      if (y < 334) { if (x >= 262) continue; k = 1; }
      else if (isRed(i)) k = x < 190 ? 1 : 2;
      else if (minR >= 0) k = x < minR ? 1 : x <= maxR ? 2 : (x >= 385 ? 3 : 2);
      else k = x < 262 ? 1 : x < 470 ? 2 : 3;
      owner[y * Wd + x] = k;
    }
  }
  const brand = [47, 162, 90];
  S.cut = []; S.glow = [];
  const N = SCH.w * SCH.h;
  // 3×3 morphological opening (erode → dilate) of one layer's mask: drops stray anti-aliased pixels and thin leader
  // lines, so the green outline follows the solid layer silhouette instead of speckling
  const opened = k => {
    const er = new Uint8Array(N), op = new Uint8Array(N);
    for (let y = 1; y < SCH.h - 1; y++) for (let x = 1; x < SCH.w - 1; x++) {
      const p = y * Wd + x; let ok = 1;
      for (let b = -1; b <= 1 && ok; b++) for (let a = -1; a <= 1; a++) if (owner[p + b * Wd + a] !== k) { ok = 0; break; }
      er[p] = ok;
    }
    for (let y = 1; y < SCH.h - 1; y++) for (let x = 1; x < SCH.w - 1; x++) {
      const p = y * Wd + x; let on = 0;
      for (let b = -1; b <= 1 && !on; b++) for (let a = -1; a <= 1; a++) if (er[p + b * Wd + a]) { on = 1; break; }
      op[p] = on;
    }
    return op;
  };
  for (let k = 1; k <= 3; k++) {
    const cut = L.offscreen(SCH.w, SCH.h), cx = cut.getContext('2d');
    const out = cx.createImageData(SCH.w, SCH.h), o = out.data;
    const edge = L.offscreen(SCH.w, SCH.h), ex = edge.getContext('2d');
    const eimg = ex.createImageData(SCH.w, SCH.h), e = eimg.data;
    const [lx, ly, lw, lh] = LABELS[k - 1];
    const op = opened(k);
    for (let y = 0; y < SCH.h; y++) for (let x = 0; x < SCH.w; x++) {
      const p = y * Wd + x, i = p * 4;
      const inLab = x >= lx && x < lx + lw && y >= ly && y < ly + lh;
      if (owner[p] === k || inLab) { o[i] = d[i]; o[i + 1] = d[i + 1]; o[i + 2] = d[i + 2]; o[i + 3] = 255; }
      if (op[p] && x > 0 && y > 0 && x < SCH.w - 1 && y < SCH.h - 1) {
        const nb = !op[p - 1] || !op[p + 1] || !op[p - Wd] || !op[p + Wd];
        if (nb) { e[i] = brand[0]; e[i + 1] = brand[1]; e[i + 2] = brand[2]; e[i + 3] = 255; }
      }
    }
    cx.putImageData(out, 0, 0); ex.putImageData(eimg, 0, 0);
    const gl = L.offscreen(SCH.w, SCH.h), gx = gl.getContext('2d');
    gx.shadowColor = 'rgba(47,162,90,0.9)'; gx.shadowBlur = 10;
    gx.drawImage(edge, 0, 0); gx.drawImage(edge, 0, 0); gx.shadowBlur = 0; gx.drawImage(edge, 0, 0);
    S.cut.push(cut); S.glow.push(gl);
  }
  S.base = base;
  // fibre points inside the red layer (jittered grid)
  S.fib = [];
  const r = rngLocal(61);
  for (let gy = 336, row = 0; gy < 528; gy += 12, row++) for (let gx = 196 + (row % 2) * 6; gx < 452; gx += 12) {
    const x = Math.round(gx + (r() - 0.5) * 4), y = Math.round(gy + (r() - 0.5) * 4);
    const ok = [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5]].every(([a, b]) => owner[(y + b) * Wd + (x + a)] === 2);
    if (ok) S.fib.push([x, y, r()]);
  }
  // --- pp_print belt sprite with soft ends ---------------------------------------------------
  // the print starts ~35 px from the photo's left edge, so the pipe is extended on the left with a stretched blank
  // band (the tube is uniform along its length): the soft fade then lands on plain pipe and «MONOISOL HD» stays crisp
  const pr = L.img('pp_print'), y0 = 58, sh = 146, PAD = 170, spw = pr.width + PAD;
  const strip = L.offscreen(spw, sh), sx = strip.getContext('2d');
  sx.drawImage(pr, 3, y0, 22, sh, 0, 0, PAD + 4, sh);
  sx.drawImage(pr, 0, y0, pr.width, sh, PAD, 0, pr.width, sh);
  sx.globalCompositeOperation = 'destination-in';
  const g = sx.createLinearGradient(0, 0, spw, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop((PAD - 6) / spw, 'rgba(0,0,0,1)'); g.addColorStop(0.86, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  sx.fillStyle = g; sx.fillRect(0, 0, spw, sh);
  S.strip = strip;
  // --- white panel sprite with soft warm shadow ---------------------------------------------
  const m = 90, pc = L.offscreen(PANEL.w + m * 2, PANEL.h + m * 2), px = pc.getContext('2d');
  px.shadowColor = SHADOW + '0.20)'; px.shadowBlur = 60; px.shadowOffsetY = 22;
  L.roundRect(px, m, m, PANEL.w, PANEL.h, 30); px.fillStyle = '#FFFFFF'; px.fill();
  px.shadowColor = 'transparent';
  px.lineWidth = 2; px.strokeStyle = 'rgba(20,35,58,0.06)'; px.stroke();
  S.panel = pc; S.panelM = m;
  return S;
}
function rngLocal(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// ---------- background ----------
function ivoryBg(ctx, L, t) {
  const { W, H } = L;
  const g = ctx.createLinearGradient(0, 0, W * 0.7, H * 1.25);
  g.addColorStop(0, '#FCF9F3'); g.addColorStop(0.55, '#F5EFE4'); g.addColorStop(1, '#EBE1CF');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // drifting soft lights
  for (let i = 0; i < 3; i++) {
    const x = W * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.12 + i * 2.2)));
    const y = H * (0.25 + 0.5 * (0.5 + 0.5 * Math.cos(t * 0.10 + i * 1.6)));
    L.glow(ctx, x, y, 560 + 120 * i, i === 1 ? '#FFE9D2' : '#FFFFFF', 0.55);
  }
  // fine dot grid, warm grey
  ctx.fillStyle = 'rgba(120,96,60,0.07)';
  const step = 46, ox = (t * 5) % step;
  for (let y = step / 2; y < H; y += step) for (let x = -step + ox; x < W + step; x += step) { ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); }
  // floating dust specks
  const r = rngLocal(17);
  for (let i = 0; i < 34; i++) {
    const d = r(), x0 = r() * W, y0 = r() * H, ph = r() * 6.28, v = 6 + d * 16;
    const y = ((y0 - t * v) % H + H) % H, x = x0 + Math.sin(t * 0.4 + ph) * 22;
    ctx.fillStyle = `rgba(150,110,60,${0.10 + d * 0.14})`;
    ctx.beginPath(); ctx.arc(x, y, 1.2 + d * 2.4, 0, Math.PI * 2); ctx.fill();
  }
  // warm vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.1);
  v.addColorStop(0, 'rgba(120,85,40,0)'); v.addColorStop(1, 'rgba(120,85,40,0.16)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// ---------- components ----------
// framed photo card (light theme): rotation, scale, defocus (blur 0..1), Ken Burns, caption pill
function card(ctx, L, name, c, o) {
  const { alpha = 1, dx = 0, dy = 0, scale = 1, rot = c.rot, blur = 0, k = 0, zoom = [1.04, 1.12], focus = [0.5, 0.5, 0.5, 0.5], caption = null, capP = 0 } = o;
  if (alpha <= 0.002) return;
  const im = L.img(name);
  const z = L.lerp(zoom[0], zoom[1], L.ease.inOutSine(L.clamp(k)));
  const fx = L.lerp(focus[0], focus[2], k), fy = L.lerp(focus[1], focus[3], k);
  const { w, h } = c, r = 20, bw = 9;
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha;
    ctx.translate(c.x + w / 2 + dx, c.y + h / 2 + dy); ctx.rotate(rot); ctx.scale(scale, scale); ctx.translate(-w / 2, -h / 2);
    ctx.save(); ctx.shadowColor = SHADOW + (0.30 * (1 - blur * 0.5)) + ')'; ctx.shadowBlur = 46; ctx.shadowOffsetY = 20;
    L.roundRect(ctx, -bw, -bw, w + bw * 2, h + bw * 2, r + bw); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
    ctx.save(); L.roundRect(ctx, 0, 0, w, h, r); ctx.clip();
    if (blur < 0.999) L.drawCover(ctx, im, 0, 0, w, h, z, fx, fy);
    if (blur > 0.001) { ctx.globalAlpha *= L.clamp(blur * 1.3); L.drawCover(ctx, L.blurred(name, 18), 0, 0, w, h, z, fx, fy); }
    ctx.restore();
    if (blur > 0.001) { L.roundRect(ctx, -bw, -bw, w + bw * 2, h + bw * 2, r + bw); ctx.fillStyle = `rgba(250,246,238,${0.35 * blur})`; ctx.fill(); }
    if (caption && capP > 0.001) {
      const e = L.ease.outCubic(L.clamp(capP));
      const tw = L.measure(ctx, caption, 'bodyBold', 30) + 64;
      L.at(ctx, { x: 26, y: h - 40 + (1 - e) * 14, alpha: L.clamp(capP * 1.6) }, () => {
        L.roundRect(ctx, 0, -29, tw, 58, 29); ctx.fillStyle = 'rgba(20,35,58,0.88)'; ctx.fill();
        ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(26, 0, 6, 0, Math.PI * 2); ctx.fill();
        L.text(ctx, caption, 44, 1, { role: 'bodyBold', size: 30, color: '#FFFFFF', baseline: 'middle' });
      });
    }
  });
}

// light pill: white body, coloured border + icon. returns width
function lightPill(ctx, L, str, x, y, p, { accent = L.C.brand, icon = null, align = 'left', size = 30, out = 0 } = {}) {
  if (p <= 0.001) return 0;
  const tw = L.measure(ctx, str, 'bodyBold', size), ih = icon ? size * 1.15 : 0;
  const padX = 28, pw = tw + padX * 2 + (icon ? ih + 14 : 0), ph = size * 1.95;
  const sx = align === 'center' ? x - pw / 2 : x;
  const e = L.ease.outBack(L.clamp(p)), oo = L.ease.inCubic(L.clamp(out));
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

// small house emblem: 5 windows (bottom-left, bottom-right, top-left, top-middle, top-right); lit = array 0..1
function houseEmblem(ctx, L, x, y, s, lit, alpha, t) {
  if (alpha <= 0.002) return;
  L.at(ctx, { x, y, scale: s, alpha }, () => {
    const w = 96, h = 70, rh = 36;
    // soft backing disc
    ctx.save(); ctx.shadowColor = SHADOW + '0.18)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
    L.roundRect(ctx, -w / 2 - 22, -h - rh - 22, w + 44, h + rh + 40, 26); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill(); ctx.restore();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-w / 2 - 8, -h + 2); ctx.lineTo(0, -h - rh); ctx.lineTo(w / 2 + 8, -h + 2); ctx.stroke();
    ctx.strokeRect(-w / 2, -h, w, h);
    const wins = [[-w / 2 + 12, -30], [w / 2 - 34, -30], [-w / 2 + 12, -h + 10], [-11, -h + 10], [w / 2 - 34, -h + 10]];
    wins.forEach(([wx, wy], i) => {
      const l = L.clamp(lit[i] || 0);
      if (l > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'source-over'; L.glow(ctx, wx + 11, wy + 9, 34, '#FFB547', 0.55 * l); ctx.restore(); }
      ctx.fillStyle = L.mixColor('#E3E7EC', '#FFB547', l); ctx.fillRect(wx, wy, 22, 18);
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.strokeRect(wx, wy, 22, 18);
    });
    // door
    ctx.fillStyle = INK; L.roundRect(ctx, -9, -30, 18, 30, 3); ctx.fill();
  });
}

// rotating cross-section of the 3-layer PP-R pipe (outer PP / fibreglass-reinforced PP / inner PP)
function crossSection(ctx, L, t, a, wts, hOn, build) {
  if (a <= 0.002) return;
  const { cx, cy, R } = XS;
  const r1 = R * 0.80, r2 = R * 0.56, r3 = R * 0.38;
  const ang = -0.6 + t * 0.42 + (1 - L.ease.outCubic(L.clamp(build))) * -1.6;
  const sc = L.lerp(0.72, 1, L.ease.outBack(L.clamp(build)));
  L.at(ctx, { x: cx, y: cy, scale: sc, alpha: a * L.clamp(build * 1.6) }, () => {
    const vx = R * 0.30, vy = -R * 0.22, vl = Math.hypot(vx, vy), nx = -vy / vl, ny = vx / vl;
    // contact shadow
    ctx.save(); ctx.shadowColor = SHADOW + '0.28)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = PP; ctx.fill(); ctx.restore();
    // pipe body going back (extrusion)
    ctx.beginPath();
    ctx.moveTo(nx * R, ny * R); ctx.lineTo(vx + nx * R, vy + ny * R);
    ctx.arc(vx, vy, R, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
    ctx.lineTo(-nx * R, -ny * R); ctx.closePath();
    const bg = ctx.createLinearGradient(-nx * R, -ny * R, nx * R, ny * R);
    bg.addColorStop(0, PP_HI); bg.addColorStop(0.5, PP); bg.addColorStop(1, PP_LO);
    ctx.fillStyle = bg; ctx.fill();
    ctx.beginPath(); ctx.arc(vx, vy, R, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();
    // faint silhouette outline so the cream body reads against the ivory background
    ctx.beginPath(); ctx.moveTo(-nx * R, -ny * R); ctx.lineTo(vx - nx * R, vy - ny * R);
    ctx.arc(vx, vy, R, Math.atan2(-ny, -nx), Math.atan2(ny, nx)); ctx.lineTo(nx * R, ny * R);
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(20,35,58,0.16)'; ctx.stroke();
    // red marking stripe on the visible side of the body
    const sa = ang + 2.2, dot = Math.cos(sa) * vx / vl + Math.sin(sa) * vy / vl;
    if (dot > 0.22) {
      const vis = L.ease.inOutSine(L.clamp((dot - 0.22) / 0.35));
      ctx.strokeStyle = L.rgba(RED, 0.9 * vis); ctx.lineWidth = 2 + 6 * dot; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(Math.cos(sa) * R, Math.sin(sa) * R); ctx.lineTo(vx + Math.cos(sa) * R, vy + Math.sin(sa) * R); ctx.stroke();
    }
    // ---- face ----
    const ring = (ro, ri, fill) => { ctx.beginPath(); ctx.arc(0, 0, ro, 0, Math.PI * 2); ctx.arc(0, 0, ri, 0, Math.PI * 2, true); ctx.fillStyle = fill; ctx.fill('evenodd'); };
    const pg = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.05);
    pg.addColorStop(0, PP_HI); pg.addColorStop(0.7, PP); pg.addColorStop(1, '#DDD2BE');
    ring(R, r1, pg);
    const rg = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R);
    rg.addColorStop(0, '#F6857C'); rg.addColorStop(1, '#E2534E');
    ring(r1, r2, rg);
    ring(r2, r3, pg);
    // bore (inside of the pipe)
    const ig = ctx.createRadialGradient(r3 * 0.25, r3 * 0.3, r3 * 0.1, 0, 0, r3);
    ig.addColorStop(0, '#F3EDE2'); ig.addColorStop(0.7, '#D9CDB8'); ig.addColorStop(1, '#B7A88E');
    ctx.beginPath(); ctx.arc(0, 0, r3, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();
    // fibres in the red ring (rotate with the pipe)
    const rows = [0.24, 0.5, 0.76];
    rows.forEach((f, ri) => {
      const rr = L.lerp(r2, r1, f), n = Math.floor((Math.PI * 2 * rr) / 13);
      for (let i = 0; i < n; i++) {
        const th = ang + (i + ri * 0.5) / n * Math.PI * 2;
        const x = Math.cos(th) * rr, y = Math.sin(th) * rr;
        ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2);
        ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(120,20,25,0.45)'; ctx.stroke();
        if (wts[1] > 0.01) {
          const wave = Math.sin(t * 5.2 - th * 3 - ri * 0.9);
          const b = Math.pow(Math.max(0, wave), 3) * wts[1];
          if (b > 0.02) { ctx.fillStyle = `rgba(255,248,236,${0.95 * b})`; ctx.fill(); }
        }
      }
    });
    // ring outlines
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(20,35,58,0.22)';
    for (const rr of [R, r1, r2, r3]) { ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke(); }
    // global light sheen (fixed, so the rotation reads as a real object)
    const sh = ctx.createLinearGradient(-R, -R, R, R);
    sh.addColorStop(0, 'rgba(255,255,255,0.30)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(60,40,20,0.10)');
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = sh; ctx.fill();
    // highlight: dim the other rings, glow the active one
    const bands = [[R, r1], [r1, r2], [r2, r3]];
    bands.forEach(([ro, ri], k) => {
      const dim = 0.55 * hOn * (1 - wts[k]);
      if (dim > 0.01) ring(ro, ri, `rgba(252,249,243,${dim})`);
    });
    // red marking notch on the rim — drawn after the dimming veil so it stays the same red as the body stripe
    ctx.beginPath(); ctx.arc(0, 0, R - 4, sa - 0.07, sa + 0.07); ctx.lineWidth = 8; ctx.strokeStyle = RED; ctx.lineCap = 'butt'; ctx.stroke();
    bands.forEach(([ro, ri], k) => {
      if (wts[k] < 0.01) return;
      ctx.save(); ctx.shadowColor = L.rgba(L.C.brand, 0.8); ctx.shadowBlur = 14;
      ctx.lineWidth = 3.5; ctx.strokeStyle = L.rgba(L.C.brand, 0.95 * wts[k]);
      ctx.beginPath(); ctx.arc(0, 0, ro - 1.5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, ri + 1.5, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
  });
}

// mini cross-section icon used in the fibreglass pill
function fibreIcon(ctx, L, x, y, s) {
  const R = s * 0.48;
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fillStyle = PP; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, R * 0.74, 0, Math.PI * 2); ctx.arc(x, y, R * 0.46, 0, Math.PI * 2, true); ctx.fillStyle = RED; ctx.fill('evenodd');
  ctx.beginPath(); ctx.arc(x, y, R * 0.30, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#FFF4EC';
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * R * 0.6, y + Math.sin(a) * R * 0.6, 1.4, 0, Math.PI * 2); ctx.fill(); }
}

module.exports = {
  draw(ctx, t, d, L, env) {
    const { C, W, H } = L;
    const s = prep(L);
    ivoryBg(ctx, L, t);

    // ======================= BEAT 1 =======================
    const out1 = L.ep(t, T.out1, 0.65, 'inOutCubic');          // 0..1 beat-1 recede
    const defocus = L.ep(t, T.out1, 0.42, 'inOutSine');
    const cardsGone = L.ep(t, T.out1 + 0.1, 0.42, 'inOutSine'); // gone by ~5.34, as the panel starts to rise

    // floating pp_print belt (behind the cards)
    {
      const inP = L.ep(t, T.strip, 1.1, 'outCubic');
      const a = L.clamp(inP * 1.3) * (1 - L.ep(t, T.out1, 0.4, 'inOutSine'));
      if (a > 0.002) {
        const sw = s.strip.width * STRIP.scale, shh = s.strip.height * STRIP.scale;
        const x = W / 2 - sw / 2 + (1 - inP) * 520 + 70 - (t - T.strip) * 22;
        const y = STRIP.y - shh / 2 + L.ep(t, T.out1, 0.6, 'inCubic') * 50;
        L.save(ctx, () => {
          ctx.globalAlpha *= a;
          // soft contact shadow right under the pipe (shape drawn off-canvas, only its shadow lands here)
          ctx.save(); ctx.shadowColor = SHADOW + '0.30)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 3000 + 16;
          L.roundRect(ctx, x + sw * 0.16, y + shh * 0.55 - 3000, sw * 0.68, shh * 0.42, 40); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
          ctx.drawImage(s.strip, x, y, sw, shh);
        });
      }
    }

    // pp_pipes_3 card (from the right), drawn under the fittings card? -> over it (overlap from the right)
    const fitIn = L.ep(t, T.fit, 0.95, 'outCubic');
    const pipesIn = L.ep(t, T.pipes, 1.0, 'outCubic');
    card(ctx, L, 'fittings_1', FIT, {
      alpha: L.clamp(fitIn * 1.5) * (1 - cardsGone),
      dx: (1 - fitIn) * -240 + out1 * 90, dy: out1 * 20,
      rot: FIT.rot + (1 - fitIn) * -0.06, scale: 1 - out1 * 0.06, blur: defocus,
      k: L.clamp((t - T.fit) / 6), zoom: [1.03, 1.12], focus: [0.5, 0.45, 0.5, 0.55],
      caption: 'Фітинги', capP: L.ep(t, T.cap, 0.6) * (1 - out1),
    });
    card(ctx, L, 'pp_pipes_3', PIPES, {
      alpha: L.clamp(pipesIn * 1.5) * (1 - cardsGone),
      dx: (1 - pipesIn) * 360 + out1 * 160, dy: out1 * 26,
      rot: PIPES.rot + (1 - pipesIn) * 0.07, scale: 1 - out1 * 0.06, blur: defocus,
      // crop below the big banner logo (it is already cut by the photo's own top edge) and keep all pipe ends in frame
      k: L.clamp((t - T.pipes) / 5), zoom: [1.27, 1.32], focus: [0.95, 1, 1, 1],
    });

    // left text column
    {
      const pillY = 330;
      lightPill(ctx, L, 'Для водопостачання', LM, pillY, L.ep(t, T.pill, 0.7, 'linear'), {
        icon: (x, y, sz) => L.drawIcon(ctx, 'drop', x, y + 1, sz * 0.92, C.brand, 1, 3.2), out: L.ep(t, T.out1 - 0.05, 0.35, 'linear'),
      });
      const hp = L.ep(t, T.head, 1.15, 'linear');
      L.revealText(ctx, 'Поліпропіленові труби HD', LM - 4, 458, hp, {
        role: 'display', size: 76, color: INK, maxWidth: 900, lineHeight: 1.2, stagger: 0.2,
        highlight: ['HD'], highlightColor: RED, out: L.ep(t, T.out1, 0.4, 'linear'),
      });
      // thin red marking line under the headline
      const lp = L.ep(t, T.line, 1.0, 'inOutCubic'), lo = L.ep(t, T.out1, 0.4, 'inOutCubic');
      if (lp > lo + 0.001) {
        const x0 = LM + 816 * lo, x1 = LM + 816 * lp;
        L.save(ctx, () => {
          ctx.fillStyle = RED; ctx.fillRect(x0, 602, Math.max(0, x1 - x0), 3);
        });
      }
    }

    // ======================= BEAT 2 =======================
    const panelIn = L.ep(t, T.panel, 0.85, 'outCubic');
    const wts = [
      L.envelope(t, T.hl1, T.hl2 + 0.2, 0.25, 0.25),
      Math.max(L.envelope(t, T.hl2, T.hl3 + 0.2, 0.25, 0.25), L.ep(t, T.hl2b, 0.35, 'inOutSine')),
      L.envelope(t, T.hl3, T.hl2b + 0.2, 0.25, 0.25),
    ];
    const hOn = L.ep(t, T.hl1 - 0.05, 0.3, 'inOutSine');
    if (panelIn > 0.002) {
      const m = s.panelM, e = panelIn;
      L.save(ctx, () => {
        ctx.globalAlpha *= L.clamp(e * 2.0);
        const drift = 0.012 * L.ease.inOutSine(L.clamp((t - 6) / 5));   // slow push-in while holding
        const sc = L.lerp(0.965, 1, e) + drift, ox = PANEL.x + PANEL.w / 2, oy = PANEL.y + PANEL.h / 2 + (1 - e) * 50;
        ctx.translate(ox, oy); ctx.scale(sc, sc); ctx.translate(-PANEL.w / 2, -PANEL.h / 2);
        ctx.drawImage(s.panel, -m, -m);
        // red accent bar on the inner left edge (marking stripe)
        const ra = L.ep(t, T.scheme + 0.3, 0.8, 'inOutCubic');
        if (ra > 0.002) { L.roundRect(ctx, 0, 40, 6, (PANEL.h - 80) * ra, 3); ctx.fillStyle = RED; ctx.fill(); }
        // scheme image with a soft left→right wipe
        const ix = PANEL.pad, iy = PANEL.pad, iw = PANEL.w - PANEL.pad * 2, ih = iw * SCH.h / SCH.w;
        // soft decelerating wipe (outQuad, ≈68 px/frame at most) with a feathered leading edge instead of a hard clip line
        const wp = L.ep(t, T.scheme, 1.0, 'outQuad'), FE = 80, NS = 10;
        const edge = ix + (iw + FE) * wp;               // feather spans [edge - FE, edge]
        if (wp < 1) {
          const solid = Math.min(ix + iw, edge - FE);
          if (solid > ix) { ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, solid - ix, ih); ctx.clip(); ctx.drawImage(s.base, ix, iy, iw, ih); ctx.restore(); }
          for (let j = 0; j < NS; j++) {
            const x0 = Math.max(ix, edge - FE + j * FE / NS), x1 = Math.min(ix + iw, edge - FE + (j + 1) * FE / NS);
            if (x1 <= x0) continue;
            ctx.save(); ctx.globalAlpha *= 1 - (j + 0.5) / NS;
            ctx.beginPath(); ctx.rect(x0, iy, x1 - x0, ih); ctx.clip(); ctx.drawImage(s.base, ix, iy, iw, ih); ctx.restore();
          }
        }
        ctx.save();
        ctx.beginPath(); ctx.rect(ix, iy, Math.max(0, Math.min(iw, edge - ix)), ih); ctx.clip();
        if (wp >= 1) ctx.drawImage(s.base, ix, iy, iw, ih);
        const sc2 = iw / SCH.w;
        if (hOn > 0.002) {
          ctx.fillStyle = `rgba(255,255,255,${0.66 * hOn})`; ctx.fillRect(ix, iy + 150 * sc2, iw, ih - 150 * sc2);
          for (let k = 0; k < 3; k++) {
            const w = wts[k] * hOn; if (w < 0.004) continue;
            ctx.globalAlpha = w; ctx.drawImage(s.cut[k], ix, iy, iw, ih);
            ctx.globalAlpha = w * 0.7; ctx.drawImage(s.glow[k], ix, iy, iw, ih);
            ctx.globalAlpha = 1;
          }
          // fibre pulse in the middle layer
          const w2 = wts[1] * hOn;
          if (w2 > 0.01) {
            for (const [fx, fy, ph] of s.fib) {
              const wave = Math.sin(t * 4.2 - fx * 0.034 + ph * 0.7);
              const b = Math.pow(Math.max(0, wave), 3) * (0.55 + 0.45 * ph) * w2;
              if (b < 0.03) continue;
              const X = ix + fx * sc2, Y = iy + fy * sc2;
              L.glow(ctx, X, Y, 11, '#FFFFFF', 0.55 * b);
              ctx.fillStyle = `rgba(255,252,246,${0.95 * b})`; ctx.beginPath(); ctx.arc(X, Y, 3.2, 0, Math.PI * 2); ctx.fill();
            }
          }
        }
        ctx.restore();
      });
    }

    // cross-section, stat, pill (right column)
    {
      const build = L.ep(t, T.xs, 1.0, 'linear');
      crossSection(ctx, L, t, 1, wts, hOn, build);
      const sp = L.ep(t, T.stat, 0.8, 'outCubic');
      if (sp > 0.002) {
        const vw = L.measure(ctx, '3', 'display', 132), uw = L.measure(ctx, 'шари', 'displaySemi', 62), gap = 22;
        const x0 = XS.cx - (vw + gap + uw) / 2, by = 778;
        L.save(ctx, () => {
          ctx.beginPath(); ctx.rect(x0 - 20, by - 150, vw + gap + uw + 40, 190); ctx.clip();
          L.text(ctx, '3', x0, by + (1 - sp) * 150, { role: 'display', size: 132, color: RED, alpha: L.clamp(sp * 1.5) });
          const sp2 = L.ep(t, T.stat + 0.15, 0.8, 'outCubic');
          L.text(ctx, 'шари', x0 + vw + gap, by - 4 + (1 - sp2) * 90, { role: 'displaySemi', size: 62, color: INK, alpha: L.clamp(sp2 * 1.5) });
        });
      }
      lightPill(ctx, L, 'Армування скловолокном', XS.cx, 860, L.ep(t, T.pill2, 0.7, 'linear'), {
        accent: RED, align: 'center', icon: (x, y, sz) => fibreIcon(ctx, L, x, y, sz),
      });
    }

    // ======================= HOUSE EMBLEM =======================
    {
      const a = 1;   // running motif: present from t = -0.4 so it carries straight through the incoming wipe
      const w3 = L.ep(t, T.win, 0.45, 'outCubic');
      const pop = Math.sin(Math.PI * L.prog(t, T.win - 0.05, 0.6)) * 0.07;   // gentle pulse as the window turns on
      houseEmblem(ctx, L, LM + 70, 150, 0.82 * (1 + pop), [1, 1, w3, 0, 0], a, t);
      if (w3 > 0 && w3 < 1) {
        // little light burst when the third window turns on
        const bx = LM + 70 + (-48 + 12 + 11) * 0.82, by = 150 + (-70 + 10 + 9) * 0.82;
        ctx.save(); ctx.strokeStyle = L.rgba('#FFB547', 0.8 * (1 - w3)); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(bx, by, 10 + 40 * w3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }
  },
};
