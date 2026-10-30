'use strict';
// Scene 8 — «Джгути, гофротруба, пакування» (18.2 s; global 124.43–142.63).
// Deep-navy stage with three product showcases, separated by vertical shutters (six slats sweeping left → right).
// Each showcase headline flies in with a kinetic jolt (skewed slide + motion ghosts + green accent bar).
//   S1 (cue 0, 0.40 s) «Джгути»: framed card cords_1 + glass panel: a foam cord is laid into the seam around a
//        window frame (cold-air wisps stop where it is sealed), a blue draft arrow hits the seam and dissolves.
//        3.5 s the panel turns frosty: snowflake, the clamped cord bends and springs back, frost shakes off.
//        Pills «Шви · вікна · двері» (1.75 s), «Еластичні на морозі» (3.8 s).
//   S2 (cue 1, 6.80 s) «Гофротруба»: split screen corr_electric | worker_corr; the spotlight follows the voice;
//        pills «Електропроводка · УФ-стійкий ПНД» (sun icon, 8.1 s) and «Водопровідні труби» (9.5 s).
//   S3 (cue 2, 11.57 s) «Пакувальні матеріали»: bento of bubble_banner / profile_mix / lodgement_device with
//        captions; panel: box opens, bubble film + lodgement wrap a fragile cup, the box rides a truck over bumps,
//        green check. 14.8 s: stretch film / cardboard / foam-block icons are crossed out one per spoken word and
//        turn into green MONOISOL packaging icons; pill «Замість стрейч-плівки, картону, пінопласту».
//        17.5 s: fifth window of the running house emblem (same white tile as scenes 6–7) lights up.
// Top-right corner (x>1500, y<150) stays free for the global logo; no text below y≈920.

// ---------------------------------------------------------------- layout
const LM = 120;
const HEAD_Y = 258, HEAD_SIZE = 88;
const BAND_Y = 322, BAND_H = 510;
const PILL_Y = 892;
const CARD1 = { x: LM, y: BAND_Y, w: 765, h: BAND_H };
const P1 = { x: 945, y: BAND_Y, w: 855, h: BAND_H };
const WIN = { x: 240, y: 58, w: 420, h: 394, g: 28, prof: 44 };   // window opening inside P1 (panel-local)
const CL = { x: LM, y: BAND_Y, w: 800, h: BAND_H }, CR = { x: 1000, y: BAND_Y, w: 800, h: BAND_H };
const B1 = { x: LM, y: BAND_Y, w: 450, h: BAND_H };
const B2 = { x: 594, y: BAND_Y, w: 346, h: 243 };
const B3 = { x: 594, y: BAND_Y + 267, w: 346, h: 243 };
const P3 = { x: 1000, y: BAND_Y, w: 800, h: BAND_H };

// ---------------------------------------------------------------- timing (from the voice cues, with fallbacks)
function timing(env) {
  const c = (k, def) => (env && env.cues && env.cues[k] ? env.cues[k].start : def);
  const c0 = c(0, 0.4), c1 = c(1, 6.8), c2 = c(2, 11.567);
  return {
    // S1 — «Джгути ущільнюють шви, вікна й двері та лишаються еластичними на морозі.»
    head1: c0 - 0.36, card1: c0 - 0.55, panel1: c0 - 0.3,
    cordA: c0 + 0.6, cordD: 1.8, pillSeam: c0 + 1.35,
    arrow: c0 + 2.45, frost: c0 + 3.1, flake: c0 + 3.25, pillFrost: c0 + 3.4,
    bend: c0 + 3.72, release: c0 + 4.45,
    mid1: c1 - 0.33,
    // S2 — «Гофротруба вберігає електропроводку й водопровідні труби.»
    head2: c1 - 0.27, cardL: c1 - 0.24, cardR: c1 - 0.06,
    pillE: c1 + 1.3, pillW: c1 + 2.72, both: c1 + 3.75,
    mid2: c2 - 0.3,
    // S3 — «Пакування береже вантаж у дорозі й вигідно замінює стрейч-плівку, картон і пінопласт.»
    head3: c2 - 0.22, bento: c2 - 0.18, caps: c2 + 0.3,
    box: c2 + 0.06, open: c2 + 0.3, cup: c2 + 0.5, wrap: c2 + 0.7, lodg: c2 + 0.85, drop: c2 + 1.05,
    close: c2 + 1.3, boxOut: c2 + 1.62, truck: c2 + 1.8, stop: c2 + 2.5, check: c2 + 2.66,
    stageOut: c2 + 3.2, comp: c2 + 3.4, pillR: c2 + 3.42,
    xs: [c2 + 3.95, c2 + 4.65, c2 + 5.25],
    house: c2 + 5.35, win5: c2 + 5.95,
  };
}

// ---------------------------------------------------------------- small helpers
function backMild(x) { const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

// headline flying in from the left with a kinetic jolt (lean + ghost trails), green accent bar underneath
function kineticTitle(ctx, L, str, x, y, t, t0, size = HEAD_SIZE) {
  const p = L.prog(t, t0, 0.7);
  if (p <= 0) return;
  const { C, ease, clamp } = L;
  const dx = (1 - backMild(p)) * -340;
  const skew = -0.3 * (1 - ease.outCubic(clamp(p * 1.5)));
  const a = clamp(p * 4);
  const draw = (ox, alpha) => L.save(ctx, () => {
    ctx.translate(x + ox, y); ctx.transform(1, 0, skew, 1, 0, 0);
    L.text(ctx, str, 0, 0, { role: 'display', size, color: C.white, alpha });
  });
  if (p < 0.6) for (let k = 3; k >= 1; k--) draw(dx - k * 44 * (1 - p), a * 0.12 * (1 - p / 0.6));
  draw(dx, a);
  const bp = L.ep(t, t0 + 0.3, 0.6, 'outCubic');
  if (bp > 0) L.save(ctx, () => { ctx.fillStyle = C.brandHi; L.roundRect(ctx, x, y + 30, 96 * bp, 6, 3); ctx.fill(); });
}

// dark caption plaque on a photo
function capPill(ctx, L, str, x, y, p) {
  if (p <= 0.001) return;
  const { C, ease, clamp } = L;
  const tw = L.measure(ctx, str, 'bodyBold', 26) + 40;
  const e = ease.outCubic(clamp(p));
  L.at(ctx, { x: x + (1 - e) * -18, y, alpha: clamp(p * 1.6) }, () => {
    L.roundRect(ctx, 0, -24, tw, 48, 24); ctx.fillStyle = 'rgba(7,22,41,0.86)'; ctx.fill();
    ctx.strokeStyle = L.rgba(C.brandHi, 0.8); ctx.lineWidth = 2; ctx.stroke();
    L.text(ctx, str, 20, 1, { role: 'bodyBold', size: 26, color: C.white, baseline: 'middle' });
  });
}

// dim veil + optional green "active" outline over a card
function cardVeil(ctx, L, R, dim, active) {
  if (dim > 0.002) L.save(ctx, () => { L.roundRect(ctx, R.x, R.y, R.w, R.h, 22); ctx.fillStyle = `rgba(4,10,22,${dim})`; ctx.fill(); });
  if (active > 0.002) L.save(ctx, () => {
    L.roundRect(ctx, R.x - 7, R.y - 7, R.w + 14, R.h + 14, 27); ctx.lineWidth = 3; ctx.strokeStyle = L.rgba(L.C.brandHi, 0.85 * active); ctx.stroke();
  });
}

// diagonal light sweep across a card (p 0..1)
function sheen(ctx, L, R, p) {
  if (p <= 0 || p >= 1) return;
  L.save(ctx, () => {
    L.roundRect(ctx, R.x, R.y, R.w, R.h, 22); ctx.clip();
    const x = L.lerp(R.x - 300, R.x + R.w + 300, L.ease.inOutSine(p));
    const g = ctx.createLinearGradient(x - 160, R.y, x + 160, R.y + R.h * 0.35);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.22 * Math.sin(Math.PI * p)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
  });
}

// polyline helpers
function polyLen(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }
function pathAt(pts, s) {
  const total = polyLen(pts); let need = Math.max(0, Math.min(1, s)) * total;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], l = Math.hypot(bx - ax, by - ay);
    if (need <= l || i === pts.length - 1) { const k = l ? Math.min(1, need / l) : 0; const dx = (bx - ax) / (l || 1), dy = (by - ay) / (l || 1); return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, dx, dy, nx: dy, ny: -dx }; }
    need -= l;
  }
  return { x: pts[0][0], y: pts[0][1], dx: 1, dy: 0, nx: 0, ny: -1 };
}
function slotPts() {
  const g = WIN.g, x0 = WIN.x + g / 2, y0 = WIN.y + g / 2, x1 = WIN.x + WIN.w - g / 2, y1 = WIN.y + WIN.h - g / 2;
  return [[x0, y1], [x0, y0], [x1, y0], [x1, y1], [x0, y1]];
}

// ---------------------------------------------------------------- cached textures
let CACHE = null;
function cache(L) {
  if (CACHE) return CACHE;
  CACHE = {};
  // block wall behind the window (panel-local)
  const c = L.offscreen(P1.w, P1.h), x = c.getContext('2d'), r = L.rng(808);
  x.fillStyle = '#18263A'; x.fillRect(0, 0, P1.w, P1.h);
  const bh = 56, bw = 148;
  for (let j = 0; j * bh < P1.h + bh; j++) {
    const off = (j % 2) * (bw / 2) - bw / 2;
    for (let i = 0; off + i * bw < P1.w + bw; i++) {
      const bx = off + i * bw + 2, by = j * bh + 2;
      x.fillStyle = L.mixColor('#2B3D55', '#36496A', r()); x.fillRect(bx, by, bw - 4, bh - 4);
      x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(bx, by, bw - 4, 2);
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(bx, by + bh - 7, bw - 4, 3);
    }
  }
  const lg = x.createLinearGradient(0, 0, P1.w, P1.h); lg.addColorStop(0, 'rgba(255,255,255,0.07)'); lg.addColorStop(1, 'rgba(0,0,0,0.32)');
  x.fillStyle = lg; x.fillRect(0, 0, P1.w, P1.h);
  CACHE.wall = c;
  return CACHE;
}

// ---------------------------------------------------------------- background + shutters
function background(ctx, L, t, seg) {
  const { W, H, C } = L;
  const g = ctx.createLinearGradient(0, 0, W * 0.55, H * 1.25);
  g.addColorStop(0, '#040B17'); g.addColorStop(0.55, '#0A1D38'); g.addColorStop(1, '#0F2C52');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const tint = seg === 1 ? '#7FCBEB' : seg === 2 ? '#3F7FC4' : C.brand;
  L.glow(ctx, W * (0.62 + 0.08 * Math.sin(t * 0.21)), H * (0.42 + 0.06 * Math.cos(t * 0.17)), 780, tint, 0.10);
  L.glow(ctx, W * (0.18 + 0.05 * Math.cos(t * 0.15)), H * (0.78 + 0.04 * Math.sin(t * 0.19)), 620, '#2C5E9C', 0.08);
  if (seg === 1) L.snow(ctx, t, { amount: 0.32, count: 70, wind: 18, speed: 0.55, seed: 81 });
  else L.bokeh(ctx, t, { amount: 0.7, count: 14, color: seg === 3 ? C.brandHi : '#6FA8E8', seed: 33 + seg });
}

// six vertical slats close left → right until `mid`, then open in the same direction
function shutter(ctx, L, t, mid) {
  const N = 6, sw = L.W / N, st = 0.036, dur = 0.28;
  const cs = mid - dur - (N - 1) * st - 0.02, os = mid + 0.02;
  if (t < cs || t > os + dur + (N - 1) * st) return;
  const { C, W, H } = L;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0C2140'); g.addColorStop(1, '#050E1C');
  for (let i = 0; i < N; i++) {
    const c = L.ep(t, cs + i * st, dur, 'inOutCubic'), o = L.ep(t, os + i * st, dur, 'inOutCubic');
    if (c <= 0 || o >= 1) continue;
    const x0 = i * sw + sw * o, x1 = i * sw + sw * c;
    if (x1 - x0 < 0.5) continue;
    L.save(ctx, () => {
      ctx.fillStyle = g; ctx.fillRect(Math.floor(x0), 0, Math.ceil(x1 - x0) + 1, H);
      // soft fold shading inside the slat
      const sg = ctx.createLinearGradient(i * sw, 0, (i + 1) * sw, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0.06)'); sg.addColorStop(0.5, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = sg; ctx.fillRect(x0, 0, x1 - x0, H);
      // moving edge: brand-green light line
      const ex = c < 1 ? x1 : x0, ea = c < 1 ? Math.sin(Math.PI * c) : Math.sin(Math.PI * o);
      if (ea > 0.01) {
        ctx.shadowColor = C.brandHi; ctx.shadowBlur = 22; ctx.fillStyle = L.rgba(C.brandHi, 0.9 * ea);
        ctx.fillRect(ex - 2, 0, 4, H);
      }
    });
  }
  void W;
}

// ---------------------------------------------------------------- S1 · cords
function showcase1(ctx, L, t, d, T) {
  const { C, ep, prog, clamp } = L;
  kineticTitle(ctx, L, 'Джгути', LM, HEAD_Y, t, T.head1);
  L.photo(ctx, 'cords_1', CARD1.x, CARD1.y, CARD1.w, CARD1.h, prog(t, T.card1, 0.8), clamp((t + 0.4) / 7.2),
    { zoom: [1.18, 1.28], focus: [0.38, 0.92, 0.46, 0.7], r: 22, borderW: 4 });
  const pa = ep(t, T.panel1, 0.75);
  if (pa > 0) {
    L.at(ctx, { y: (1 - pa) * 70, alpha: clamp(pa * 1.4) }, () => {
      L.panel(ctx, P1.x, P1.y, P1.w, P1.h, { r: 24, fill: 'rgba(8,19,36,0.85)', stroke: 'rgba(255,255,255,0.16)' });
      L.save(ctx, () => {
        L.roundRect(ctx, P1.x + 2, P1.y + 2, P1.w - 4, P1.h - 4, 22); ctx.clip();
        ctx.translate(P1.x, P1.y);
        // window view → frost view: vertical wipe with a frosty light edge (no double exposure)
        const fB = ep(t, T.frost, 0.6, 'inOutCubic');
        if (fB < 1) windowView(ctx, L, t, T, 1 - 0.25 * fB);
        if (fB > 0) {
          const wx = L.lerp(-30, P1.w + 30, fB);
          L.save(ctx, () => { ctx.beginPath(); ctx.rect(0, 0, wx, P1.h); ctx.clip(); frostView(ctx, L, t, T, 1); });
          if (fB < 1) L.save(ctx, () => {
            ctx.shadowColor = C.ice; ctx.shadowBlur = 24; ctx.fillStyle = L.rgba(C.frost, 0.85 * Math.sin(Math.PI * fB));
            ctx.fillRect(wx - 2, 0, 4, P1.h);
          });
        }
      });
    });
  }
  L.pill(ctx, 'Шви · вікна · двері', P1.x, PILL_Y, prog(t, T.pillSeam, 0.55), { size: 30 });
  const w1 = L.measure(ctx, 'Шви · вікна · двері', 'bodyBold', 30) + 52;
  L.pill(ctx, 'Еластичні на морозі', P1.x + w1 + 22, PILL_Y, prog(t, T.pillFrost, 0.55), { size: 30, icon: 'snowflake', iconColor: C.ice });
}

function windowView(ctx, L, t, T, a) {
  const { C, ep, prog, clamp, lerp, ease } = L;
  const K = cache(L), O = WIN, g = O.g, pr = O.prof;
  L.at(ctx, { x: P1.w / 2, y: P1.h / 2, scale: lerp(0.93, 1, a), alpha: a }, () => {
    ctx.translate(-P1.w / 2, -P1.h / 2);
    ctx.drawImage(K.wall, 0, 0);
    // opening (the seam is the dark slot between wall and frame)
    ctx.fillStyle = '#03070E'; ctx.fillRect(O.x, O.y, O.w, O.h);
    // frame
    const F = { x: O.x + g, y: O.y + g, w: O.w - 2 * g, h: O.h - 2 * g };
    L.save(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5; L.roundRect(ctx, F.x, F.y, F.w, F.h, 5); ctx.fillStyle = '#DCE3EB'; ctx.fill(); });
    const fg = ctx.createLinearGradient(F.x, F.y, F.x + F.w, F.y + F.h); fg.addColorStop(0, '#F8FBFE'); fg.addColorStop(1, '#B8C3D0');
    L.roundRect(ctx, F.x, F.y, F.w, F.h, 5); ctx.fillStyle = fg; ctx.fill();
    // sash line
    ctx.strokeStyle = 'rgba(110,126,148,0.55)'; ctx.lineWidth = 2; ctx.strokeRect(F.x + 12, F.y + 12, F.w - 24, F.h - 24);
    // glass: cold night outside, reflections, tiny snow
    const G = { x: F.x + pr, y: F.y + pr, w: F.w - 2 * pr, h: F.h - 2 * pr };
    L.save(ctx, () => {
      ctx.beginPath(); ctx.rect(G.x, G.y, G.w, G.h); ctx.clip();
      const gg = ctx.createLinearGradient(G.x, G.y, G.x, G.y + G.h); gg.addColorStop(0, '#0B213D'); gg.addColorStop(1, '#1C4E7E'); ctx.fillStyle = gg; ctx.fillRect(G.x, G.y, G.w, G.h);
      const r = L.rng(51);
      for (let i = 0; i < 16; i++) {
        const sx = G.x + ((r() * G.w + t * 9) % G.w), sy = G.y + ((r() * G.h + t * (18 + r() * 22)) % G.h), sz = 1.4 + r() * 2;
        ctx.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.4})`; ctx.beginPath(); ctx.arc(sx, sy, sz, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      const sh = (t * 14) % 60;
      ctx.beginPath(); ctx.moveTo(G.x + 30 + sh, G.y + G.h); ctx.lineTo(G.x + 110 + sh, G.y + G.h); ctx.lineTo(G.x + 230 + sh, G.y); ctx.lineTo(G.x + 150 + sh, G.y); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath(); ctx.moveTo(G.x + 150 + sh, G.y + G.h); ctx.lineTo(G.x + 175 + sh, G.y + G.h); ctx.lineTo(G.x + 295 + sh, G.y); ctx.lineTo(G.x + 270 + sh, G.y); ctx.fill();
    });
    ctx.strokeStyle = 'rgba(90,105,125,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(G.x, G.y, G.w, G.h);
    // handle
    L.save(ctx, () => {
      ctx.translate(F.x + F.w - pr / 2, F.y + F.h / 2);
      L.roundRect(ctx, -6, -8, 12, 16, 4); ctx.fillStyle = '#C9D2DD'; ctx.fill();
      L.roundRect(ctx, -4, -2, 8, 38, 4); ctx.fillStyle = '#EEF2F6'; ctx.fill(); ctx.strokeStyle = '#8D9AAC'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    const pts = slotPts();
    const pc = ease.inOutSine(prog(t, T.cordA, T.cordD));
    // cold-air wisps leaking out of the unsealed part of the seam
    const wa = ep(t, T.panel1 + 0.3, 0.5) * (1 - ep(t, T.arrow, 0.3));
    if (wa > 0.01) {
      ctx.lineCap = 'round'; ctx.lineWidth = 3.6;
      for (let k = 0; k < 18; k++) {
        const s = (k + 0.5) / 18, act = clamp((s - pc) * 14) * wa;
        if (act <= 0.01) continue;
        const q = pathAt(pts, s);
        for (let j = 0; j < 2; j++) {
          const ph = (t * 0.75 + k * 0.137 + j * 0.5) % 1, al = act * Math.sin(Math.PI * ph) * 0.9;
          if (al <= 0.01) continue;
          const d0 = 14 + ph * 46;
          ctx.strokeStyle = L.rgba(C.ice, al); ctx.beginPath();
          for (let m = 0; m <= 7; m++) {
            const dd = d0 + m * 4.5, lat = Math.sin(dd * 0.16 + t * 5 + k) * 5;
            const px = q.x + q.nx * dd + q.dx * lat, py = q.y + q.ny * dd + q.dy * lat;
            m ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.stroke();
        }
      }
    }
    // the cord laid into the seam
    if (pc > 0.002) {
      L.cord(ctx, pts, g * 0.56, { p: pc, color: '#F2F5F8' });
      if (pc < 1) { const q = pathAt(pts, pc); L.glow(ctx, q.x, q.y, 34, C.brandHi, 0.45); }
    }
    // draft arrow: hits the sealed seam and dissolves
    const ap = prog(t, T.arrow, 0.45), hit = prog(t, T.arrow + 0.45, 0.4);
    if (ap > 0 && hit < 1) {
      const ay = 255, hitX = O.x + g / 2 - 18;
      const head = lerp(-40, hitX, ease.outCubic(ap)), len = 240 * (1 - ease.inCubic(hit));
      const al = (1 - hit) * clamp(ap * 3);
      L.save(ctx, () => {
        ctx.shadowColor = C.cyan; ctx.shadowBlur = 16;
        ctx.strokeStyle = L.rgba(C.cyan, al); ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath();
        let first = true;
        for (let x = head - 24 - len; x <= head - 24; x += 5) { const yy = ay + Math.sin(x * 0.045 - t * 9) * 9 * (1 - hit); first ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); first = false; }
        ctx.stroke();
        ctx.fillStyle = L.rgba(C.cyan, al);
        ctx.beginPath(); ctx.moveTo(head + 4, ay); ctx.lineTo(head - 30, ay - 22); ctx.lineTo(head - 30, ay + 22); ctx.closePath(); ctx.fill();
      });
      if (hit > 0) {
        const hx = O.x + g / 2;
        ctx.strokeStyle = L.rgba(L.mixColor(C.cyan, C.brandHi, hit), 0.8 * (1 - hit)); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(hx, ay, 12 + 70 * ease.outCubic(hit), 0, Math.PI * 2); ctx.stroke();
        const r = L.rng(77);
        for (let i = 0; i < 9; i++) {
          const an = Math.PI * (0.62 + r() * 0.76), sp = 50 + r() * 90, e = ease.outCubic(hit);
          ctx.fillStyle = L.rgba(C.ice, 0.85 * (1 - hit)); ctx.beginPath();
          ctx.arc(hx - 16 + Math.cos(an) * sp * e, ay + Math.sin(an) * sp * e, 3 + r() * 2.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    // "sealed" glint running round the cord
    const gl = ep(t, T.arrow + 0.55, 0.8, 'inOutSine');
    if (gl > 0 && gl < 1) { const q = pathAt(pts, gl); L.glow(ctx, q.x, q.y, 46, C.brandHi, 0.55 * Math.sin(Math.PI * gl)); L.glow(ctx, q.x, q.y, 14, '#FFFFFF', 0.8 * Math.sin(Math.PI * gl)); }
  });
}

function bendAmp(L, t, T) {
  const press = L.ease.inOutSine(L.prog(t, T.bend, 0.6));
  if (t < T.release) return 92 * press;
  const tau = t - T.release;
  return 92 * Math.cos(2 * Math.PI * 1.45 * tau) * Math.exp(-3.4 * tau);
}

function frostView(ctx, L, t, T, a) {
  const { C, ep, prog, clamp, lerp } = L;
  L.save(ctx, () => {
    ctx.globalAlpha *= a;
    const g = ctx.createLinearGradient(0, 0, 0, P1.h); g.addColorStop(0, '#163E66'); g.addColorStop(1, '#0A1E38');
    ctx.fillStyle = g; ctx.fillRect(0, 0, P1.w, P1.h);
    L.glow(ctx, 200, 110, 320, C.ice, 0.2);
    L.snow(ctx, t, { amount: 0.85, count: 46, wind: 14, speed: 0.5, seed: 17, area: [0, 0, P1.w, P1.h] });
    // frost rime in the corners
    for (const [cx, cy] of [[0, 0], [P1.w, 0], [0, P1.h], [P1.w, P1.h]]) L.glow(ctx, cx, cy, 170, C.frost, 0.16);
    // snowflake above the cord
    const fp = prog(t, T.flake, 0.7);
    if (fp > 0) {
      L.glow(ctx, 168, 118, 130, C.ice, 0.38 * fp);
      L.at(ctx, { x: 168, y: 118, rot: t * 0.22 + (1 - L.ease.outCubic(fp)) * -1.4, scale: lerp(0.55, 1, L.ease.outBack(fp)), alpha: clamp(fp * 2) }, () => {
        L.drawIcon(ctx, 'snowflake', 0, 0, 118, C.frost, 1, 7);
      });
    }
    // clamped cord bending and springing back
    const A = bendAmp(L, t, T), x0 = 132, x1 = P1.w - 132, y0 = 336;
    const pts = [];
    for (let i = 0; i <= 30; i++) { const s = i / 30; pts.push([lerp(x0, x1, s), y0 + A * Math.sin(Math.PI * s)]); }
    // end clamps
    for (const [cx, dir] of [[x0, -1], [x1, 1]]) {
      L.save(ctx, () => {
        ctx.translate(cx, y0);
        const cg = ctx.createLinearGradient(0, -40, 0, 40); cg.addColorStop(0, '#E7ECF2'); cg.addColorStop(1, '#8D9AAC');
        L.roundRect(ctx, dir < 0 ? -64 : 18, -40, 46, 80, 10); ctx.fillStyle = cg; ctx.fill();
        L.roundRect(ctx, dir < 0 ? -24 : -4, -34, 28, 68, 8); ctx.fillStyle = '#5B6B80'; ctx.fill();
      });
    }
    L.cord(ctx, pts, 25, { p: 1, color: '#F2F5F8' });
    // rime sparkles on the cord
    const r = L.rng(29);
    for (let i = 0; i < 11; i++) {
      const s = 0.06 + r() * 0.88, px = lerp(x0, x1, s), py = y0 + A * Math.sin(Math.PI * s) - 6 + (r() - 0.5) * 22;
      const tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.7), sz = 4 + r() * 4;
      ctx.strokeStyle = `rgba(255,255,255,${0.75 * tw})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px - sz, py); ctx.lineTo(px + sz, py); ctx.moveTo(px, py - sz); ctx.lineTo(px, py + sz); ctx.stroke();
    }
    // press chevrons while bending
    const pe = L.envelope(t, T.bend - 0.1, T.release + 0.12, 0.3, 0.2);
    if (pe > 0.01) {
      ctx.strokeStyle = L.rgba(C.brandHi, 0.9 * pe); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let k = 0; k < 2; k++) {
        const yy = y0 + A - 70 - k * 26 + Math.sin(t * 8) * 3;
        ctx.beginPath(); ctx.moveTo(P1.w / 2 - 22, yy - 12); ctx.lineTo(P1.w / 2, yy + 6); ctx.lineTo(P1.w / 2 + 22, yy - 12); ctx.stroke();
      }
    }
    // frost shaken off when it springs back
    const tau = t - T.release;
    if (tau > 0 && tau < 1.3) {
      const q = L.rng(64);
      for (let i = 0; i < 14; i++) {
        const s = 0.15 + q() * 0.7, sx = lerp(x0, x1, s), sy = y0 - 10, vx = (q() - 0.5) * 120, vy = -70 - q() * 110;
        const px = sx + vx * tau, py = sy + vy * tau + 420 * tau * tau;
        ctx.fillStyle = L.rgba(C.frost, 0.9 * (1 - tau / 1.3)); ctx.beginPath(); ctx.arc(px, py, 2.5 + q() * 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  });
}

// ---------------------------------------------------------------- S2 · corrugated pipe
function showcase2(ctx, L, t, d, T) {
  const { C, ep, prog, clamp, envelope } = L;
  kineticTitle(ctx, L, 'Гофротруба', LM, HEAD_Y, t, T.head2);
  const actL = envelope(t, T.pillE, T.pillW + 0.1, 0.35, 0.35), actR = envelope(t, T.pillW, T.both, 0.35, 0.5);
  const k = clamp((t + 0.4) / d);
  L.photo(ctx, 'corr_electric', CL.x, CL.y, CL.w, CL.h, prog(t, T.cardL, 0.8), k, { zoom: [1.2, 1.3], focus: [0.3, 0.55, 0.45, 0.58], r: 22, borderW: 4 });
  if (prog(t, T.cardL, 0.8) >= 1) cardVeil(ctx, L, CL, 0.5 * actR, actL);
  sheen(ctx, L, CL, prog(t, T.pillE + 0.05, 0.9));
  L.photo(ctx, 'worker_corr', CR.x, CR.y, CR.w, CR.h, prog(t, T.cardR, 0.8), k, { zoom: [1.0, 1.05], focus: [0.5, 0.12, 0.46, 0.22], r: 22, borderW: 4 });
  if (prog(t, T.cardR, 0.8) >= 1) cardVeil(ctx, L, CR, 0.5 * actL, actR);
  sheen(ctx, L, CR, prog(t, T.pillW + 0.05, 0.9));
  L.at(ctx, { alpha: 1 - 0.35 * actR }, () => L.pill(ctx, 'Електропроводка · УФ-стійкий ПНД', CL.x, PILL_Y, prog(t, T.pillE, 0.55), { size: 30, icon: 'sun', iconColor: C.amber }));
  L.at(ctx, { alpha: 1 - 0.35 * actL }, () => L.pill(ctx, 'Водопровідні труби', CR.x, PILL_Y, prog(t, T.pillW, 0.55), { size: 30, icon: 'drop', iconColor: C.brandHi }));
}

// ---------------------------------------------------------------- S3 · packaging
function showcase3(ctx, L, t, d, T) {
  const { C, ep, prog, clamp } = L;
  kineticTitle(ctx, L, 'Пакувальні матеріали', LM, HEAD_Y, t, T.head3);
  const k = clamp((t - 10.8) / 7.8), rec = ep(t, T.stageOut, 0.5, 'inOutSine');
  const cards = [
    ['bubble_rolls', B1, { zoom: [1.04, 1.14], focus: [0.5, 0.4, 0.55, 0.5] }, 'Бульбашкова плівка'],
    ['profile_mix', B2, { zoom: [1.48, 1.56], focus: [0.56, 1, 0.6, 1] }, 'П- та L-профілі'],
    ['lodgement_device', B3, { zoom: [1.06, 1.16], focus: [0.45, 0.55, 0.55, 0.5] }, 'Ложементи'],
  ];
  cards.forEach(([name, R, o, cap], i) => {
    const p = prog(t, T.bento + i * 0.13, 0.8);
    L.photo(ctx, name, R.x, R.y, R.w, R.h, p, k, Object.assign({ r: 22, borderW: 4 }, o));
    if (p >= 1) cardVeil(ctx, L, R, 0.3 * rec, 0);
    capPill(ctx, L, cap, R.x + 18, R.y + R.h - 36, prog(t, T.caps + i * 0.25, 0.5) * (1 - rec));
  });
  const pa = ep(t, T.bento + 0.15, 0.75);
  if (pa > 0) {
    L.at(ctx, { y: (1 - pa) * 70, alpha: clamp(pa * 1.4) }, () => {
      L.panel(ctx, P3.x, P3.y, P3.w, P3.h, { r: 24, fill: 'rgba(8,19,36,0.85)', stroke: 'rgba(255,255,255,0.16)' });
      L.save(ctx, () => {
        L.roundRect(ctx, P3.x + 2, P3.y + 2, P3.w - 4, P3.h - 4, 22); ctx.clip();
        ctx.translate(P3.x, P3.y);
        const sa = 1 - ep(t, T.stageOut + 0.25, 0.3, 'inOutSine');   // road fades once the truck has mostly left
        if (sa > 0) boxStage(ctx, L, t, T, sa);
        const ca = ep(t, T.comp, 0.45);
        if (ca > 0) compStage(ctx, L, t, T, ca);
      });
    });
  }
  L.pill(ctx, 'Замість стрейч-плівки, картону, пінопласту', P3.x, PILL_Y, prog(t, T.pillR, 0.55), { size: 30 });
}

// running motif overlay (drawn after the vignette so the white tile reads as white, as in scenes 6–7)
function emblem(ctx, L, t, T) {
  const { ep, prog } = L;
  const ha = ep(t, T.house, 0.6), w5 = ep(t, T.win5, 0.45, 'outCubic');
  if (ha > 0) {
    const pop = Math.sin(Math.PI * prog(t, T.win5 - 0.05, 0.6)) * 0.07;
    houseEmblem(ctx, L, EMB.x, EMB.y + (1 - ha) * 14, EMB.s * (1 + pop), [1, 1, 1, 1, w5], ha);
    if (w5 > 0 && w5 < 1) {   // light burst from the fifth (top-right) window, as in scenes 6–7
      const bx = EMB.x + (48 - 34 + 11) * EMB.s, by = EMB.y + (-70 + 10 + 9) * EMB.s;
      ctx.save(); ctx.strokeStyle = L.rgba('#FFB547', 0.8 * (1 - w5)); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bx, by, 10 + 40 * w5, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  }
}

// line icon of a fragile cup with saucer (100-unit box)
function cupIcon(ctx, L, x, y, s, color, lw = 6) {
  L.save(ctx, () => {
    ctx.translate(x, y); ctx.scale(s / 100, s / 100);
    ctx.strokeStyle = color; ctx.lineWidth = lw * 100 / s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-32, -26); ctx.lineTo(32, -26); ctx.lineTo(26, 14); ctx.quadraticCurveTo(22, 28, 0, 28); ctx.quadraticCurveTo(-22, 28, -26, 14); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(34, -6, 13, -Math.PI * 0.55, Math.PI * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-46, 38); ctx.quadraticCurveTo(0, 48, 46, 38); ctx.stroke();
    // steam-free "fragile" sparkle
    ctx.lineWidth = 3.5 * 100 / s;
    ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(-14, 6); ctx.stroke();
  });
}

// cardboard box in oblique projection; (x, y) = bottom-centre of the front face; th = flap angle (0 closed … ~2 rad);
// content(cx, cy) is drawn inside the open box (behind the front faces)
const BOX = { w: 190, h: 150, dp: 120 };
function obBox(ctx, L, x, y, s, th, content) {
  const open = th;
  const { w, h, dp } = BOX, ox = dp * 0.5, oy = dp * 0.36;
  const K = { front: '#C8965B', side: '#A27341', top: '#DDB27A', inner: '#4E3418', inner2: '#7A552B', edge: 'rgba(70,40,12,0.4)' };
  const poly = (pts, fill, stroke = K.edge) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } };
  const FL = [-w / 2, -h], FR = [w / 2, -h], BL = [-w / 2 + ox, -h - oy], BR = [w / 2 + ox, -h - oy];
  const Dv = [ox / dp, -oy / dp];
  const flap = (h0, h1, dir, len) => { // hinge h0-h1, closed direction dir (unit, screen), rotate up by th
    const v = [Math.cos(th) * dir[0] * len, Math.cos(th) * dir[1] * len - Math.sin(th) * len];
    return [h0, h1, [h1[0] + v[0], h1[1] + v[1]], [h0[0] + v[0], h0[1] + v[1]]];
  };
  L.save(ctx, () => {
    ctx.translate(x, y); ctx.scale(s, s);
    // floor shadow
    L.save(ctx, () => { ctx.scale(1, 0.25); L.glow(ctx, ox * 0.5, -oy * 2, w * 0.85, '#000000', 0.55); });
    if (open > 0.001) {
      poly(flap(BL, BR, [-Dv[0], -Dv[1]], dp * 0.5), L.mixColor(K.top, '#000000', 0.12));      // back flap
      poly(flap(FL, BL, [1, 0], w * 0.42), L.mixColor(K.side, '#000000', 0.05));                // left flap
      poly(flap(FR, BR, [-1, 0], w * 0.42), L.mixColor(K.side, '#000000', 0.15));               // right flap
      const ig = ctx.createLinearGradient(0, -h - oy, 0, -h); ig.addColorStop(0, K.inner2); ig.addColorStop(1, K.inner);
      poly([FL, FR, BR, BL], ig);
      if (content) content(ox * 0.5, -h - oy * 0.5);
    }
    poly([[-w / 2, 0], [w / 2, 0], FR, FL], K.front);
    poly([[w / 2, 0], FR, BR, [w / 2 + ox, -oy]], K.side);
    if (open <= 0.001) {
      poly([FL, FR, BR, BL], K.top);
      poly([[FL[0] + Dv[0] * dp * 0.4, FL[1] + Dv[1] * dp * 0.4], [FR[0] + Dv[0] * dp * 0.4, FR[1] + Dv[1] * dp * 0.4], [FR[0] + Dv[0] * dp * 0.6, FR[1] + Dv[1] * dp * 0.6], [FL[0] + Dv[0] * dp * 0.6, FL[1] + Dv[1] * dp * 0.6]], 'rgba(255,255,255,0.28)', null);
      ctx.strokeStyle = 'rgba(70,40,12,0.35)'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(FL[0] + Dv[0] * dp * 0.5, FL[1] + Dv[1] * dp * 0.5); ctx.lineTo(FR[0] + Dv[0] * dp * 0.5, FR[1] + Dv[1] * dp * 0.5); ctx.stroke();
    } else {
      poly(flap(FL, FR, Dv, dp * 0.5), L.mixColor(K.top, '#FFFFFF', 0.06));                    // front flap
    }
    // front-face print: fragile glass mark
    L.save(ctx, () => {
      ctx.strokeStyle = 'rgba(70,40,12,0.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-14, -h * 0.66); ctx.lineTo(14, -h * 0.66); ctx.quadraticCurveTo(14, -h * 0.42, 0, -h * 0.4); ctx.quadraticCurveTo(-14, -h * 0.42, -14, -h * 0.66); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -h * 0.4); ctx.lineTo(0, -h * 0.26); ctx.moveTo(-11, -h * 0.25); ctx.lineTo(11, -h * 0.25); ctx.stroke();
    });
  });
}

// bubble film + lodgement around the cup (bundle centred at 0,0)
function bundle(ctx, L, t, T, alpha) {
  const { C, ep, prog, clamp, lerp, ease } = L;
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha;
    // lodgement cradle (foam) rising under the cup
    const lp = ep(t, T.lodg, 0.45);
    if (lp > 0) L.at(ctx, { y: (1 - lp) * 46, alpha: clamp(lp * 1.6) }, () => {
      ctx.beginPath(); ctx.moveTo(-82, 10); ctx.lineTo(-50, 10); ctx.arc(0, 10, 50, Math.PI, 0, true); ctx.lineTo(82, 10); ctx.lineTo(82, 66); ctx.lineTo(-82, 66); ctx.closePath();
      L.save(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; ctx.fillStyle = '#E7ECF2'; ctx.fill(); });
      L.foamFill(ctx, { cell: 7, seed: 44, size: 128 });
      const sg = ctx.createLinearGradient(0, 10, 0, 66); sg.addColorStop(0, 'rgba(255,255,255,0.25)'); sg.addColorStop(1, 'rgba(40,60,90,0.3)'); ctx.fillStyle = sg; ctx.fill();
      ctx.strokeStyle = 'rgba(141,154,172,0.9)'; ctx.lineWidth = 2; ctx.stroke();
    });
    cupIcon(ctx, L, 0, -14, 104, C.white, 6);
    // bubble film wrapping
    const wp = prog(t, T.wrap, 0.45);
    if (wp > 0) {
      const sc = lerp(1.3, 1, ease.outCubic(wp));
      L.at(ctx, { y: -12, scale: sc, alpha: clamp(wp * 1.8) }, () => {
        L.roundRect(ctx, -64, -56, 128, 104, 24); ctx.fillStyle = 'rgba(190,225,255,0.16)'; ctx.fill();
        ctx.strokeStyle = 'rgba(220,240,255,0.7)'; ctx.lineWidth = 2.5; ctx.stroke();
        L.save(ctx, () => {
          L.roundRect(ctx, -64, -56, 128, 104, 24); ctx.clip();
          for (let j = 0; j < 6; j++) for (let i = 0; i < 7; i++) {
            const bx = -60 + i * 20 + (j % 2) * 10, by = -50 + j * 19;
            if (Math.abs(bx) < 40 && by > -40 && by < 34) continue;   // keep the cup readable: bubbles form a border
            ctx.beginPath(); ctx.arc(bx, by, 7.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(220,240,255,0.14)'; ctx.fill();
            ctx.strokeStyle = 'rgba(235,246,255,0.62)'; ctx.lineWidth = 1.8; ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(bx - 2.6, by - 2.6, 2, 0, Math.PI * 2); ctx.fill();
          }
        });
      });
    }
  });
}

// flat side-view truck; origin = road point midway between the axles. lr/lf = wheel lifts, wa = wheel angle
function truck(ctx, L, x, roadY, lr, lf, wa) {
  const { C } = L;
  const R = 30, rearX = -125, frontX = 125;
  const dy = -(lr + lf) / 2, tilt = Math.atan2(lr - lf, frontX - rearX);
  L.save(ctx, () => {
    ctx.translate(x, roadY - R + dy); ctx.rotate(tilt);
    // chassis
    ctx.fillStyle = '#0F1C2E'; L.roundRect(ctx, -205, -18, 420, 20, 6); ctx.fill();
    // bed
    const bg = ctx.createLinearGradient(0, -46, 0, -18); bg.addColorStop(0, '#4B6E9C'); bg.addColorStop(1, '#2A4870');
    ctx.fillStyle = bg; L.roundRect(ctx, -210, -46, 258, 26, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-206, -46, 250, 3);
    // cab
    ctx.beginPath(); ctx.moveTo(58, -14); ctx.lineTo(58, -150); ctx.quadraticCurveTo(58, -158, 66, -158); ctx.lineTo(140, -158); ctx.lineTo(206, -92); ctx.lineTo(212, -40); ctx.lineTo(212, -14); ctx.closePath();
    const cg = ctx.createLinearGradient(0, -158, 0, -14); cg.addColorStop(0, '#2E64A6'); cg.addColorStop(1, '#173A66'); ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(74, -142); ctx.lineTo(134, -142); ctx.lineTo(186, -96); ctx.lineTo(74, -96); ctx.closePath();
    const wg = ctx.createLinearGradient(74, -142, 186, -96); wg.addColorStop(0, '#CFEFFF'); wg.addColorStop(1, '#6FA9D6'); ctx.fillStyle = wg; ctx.fill();
    ctx.fillStyle = C.brand; ctx.fillRect(60, -62, 150, 10);
    ctx.fillStyle = C.amber; L.roundRect(ctx, 200, -56, 12, 14, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(108, -86, 22, 4);
  });
  // wheels
  for (const [wx, lift] of [[rearX, lr], [frontX, lf]]) {
    L.save(ctx, () => {
      ctx.translate(x + wx, roadY - R - lift);
      ctx.fillStyle = '#0B111A'; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9AA6B5'; ctx.beginPath(); ctx.arc(0, 0, R * 0.48, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3E4752'; ctx.lineWidth = 3; ctx.rotate(wa);
      for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * 0.44, 0); ctx.stroke(); }
    });
  }
  return { dy, tilt };
}

function boxStage(ctx, L, t, T, a) {
  const { C, ep, prog, clamp, lerp, ease } = L;
  const roadY = 452, gx = 380;
  L.save(ctx, () => {
    ctx.globalAlpha *= a;
    // ---- part 1: box on the floor opens, the wrapped cup goes in, the box closes
    const ba = ep(t, T.box, 0.6), bo = ep(t, T.boxOut, 0.3, 'inOutSine');
    if (ba > 0 && bo < 1) {
      const th = t < T.close ? ease.outBack(prog(t, T.open, 0.45)) * 2.0 : 2.0 * (1 - ease.inOutCubic(prog(t, T.close, 0.3)));
      L.at(ctx, { x: gx, y: roadY - 2 + (1 - ba) * 50 - 30 * bo, scale: 1 - 0.12 * bo, alpha: clamp(ba * 1.5) * (1 - bo) }, () => {
        obBox(ctx, L, 0, 0, 1, th, (cx, cy) => {
          const ca = ep(t, T.cup, 0.45), dropP = ep(t, T.drop, 0.42, 'inCubic');
          if (ca <= 0 || dropP >= 1) return;
          const hover = lerp(150, -40, dropP) + Math.sin(t * 2.2) * 4 * (1 - dropP);
          const fade = clamp(ca * 1.6) * (1 - clamp((dropP - 0.55) / 0.45));
          L.at(ctx, { x: cx, y: cy - hover, scale: 0.86 }, () => bundle(ctx, L, t, T, fade));
        });
      });
    }
    // ---- part 2: the loaded truck drives in and over bumps, stops; green check — cup intact
    const tIn = prog(t, T.truck, 0.6), out = prog(t, T.stageOut, 0.5);
    if (tIn <= 0) return;
    const truckX = 400 + lerp(-640, 0, ease.outCubic(tIn)) + 820 * ease.inQuad(out);
    const speed = tt => 900 * ease.inOutSine(prog(tt, T.truck + 0.3, 0.3)) * (1 - ease.inOutSine(prog(tt, T.stop, 0.35)));
    let dist = 0; for (let tt = T.truck + 0.3; tt < t; tt += 1 / 60) dist += speed(tt) / 60;
    const bumps = [620, 820];
    const hump = sx => { let m = 0; for (const b of bumps) { const u = (sx - (b - dist)) / 26; if (Math.abs(u) < 1) m = Math.max(m, 13 * Math.pow(Math.cos(u * Math.PI / 2), 2)); } return m; };
    L.save(ctx, () => {
      ctx.globalAlpha *= ep(t, T.truck - 0.1, 0.4);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, roadY, P3.w, P3.h - roadY);
      ctx.strokeStyle = 'rgba(200,215,235,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, roadY);
      for (let sx = 0; sx <= P3.w; sx += 4) ctx.lineTo(sx, roadY - hump(sx)); ctx.stroke();
      ctx.fillStyle = 'rgba(200,215,235,0.28)';
      const off = ((dist % 90) + 90) % 90;
      for (let sx = -off; sx < P3.w; sx += 90) ctx.fillRect(sx, roadY + 26, 46, 5);
      const v = speed(t) / 900;   // speed lines behind the truck
      if (v > 0.05) { ctx.strokeStyle = `rgba(220,235,255,${0.35 * v})`; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const ly = roadY - 60 - i * 34, lx = truckX - 240 - ((t * 700 + i * 70) % 140); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - 70 * v, ly); ctx.stroke(); } }
    });
    const lr = hump(truckX - 125), lf = hump(truckX + 125);
    const tr = truck(ctx, L, truckX, roadY, lr, lf, (dist + truckX) / 30);
    // the box rides on the bed (inherits body bounce + tilt, plus a little lagging hop)
    const hop = hump(truckX - 82 + 22) * 0.7;
    L.save(ctx, () => {
      ctx.translate(truckX, roadY - 30 + tr.dy); ctx.rotate(tr.tilt);
      obBox(ctx, L, -82, -46 - hop, 0.6, 0, null);
    });
    // check badge
    const cp = prog(t, T.check, 0.55);
    if (cp > 0) {
      const bxp = truckX - 50, byp = roadY - 30 - 46 - 205 + Math.sin(t * 2) * 3, e = ease.outBack(cp);
      L.at(ctx, { x: bxp, y: byp, scale: lerp(0.6, 1, e), alpha: clamp(cp * 2) }, () => {
        L.glow(ctx, 0, 0, 110, C.brand, 0.35);
        ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fillStyle = 'rgba(7,22,41,0.9)'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = L.rgba(C.brandHi, 0.9); ctx.stroke();
        cupIcon(ctx, L, -4, 2, 66, C.white, 5);
        ctx.beginPath(); ctx.arc(40, -38, 24, 0, Math.PI * 2); ctx.fillStyle = C.brand; ctx.fill();
        L.drawIcon(ctx, 'check', 40, -38, 30, C.white, clamp(cp * 1.6), 6);
      });
      const rp = prog(t, T.check + 0.1, 0.7);
      if (rp > 0 && rp < 1) { ctx.strokeStyle = L.rgba(C.brandHi, 0.6 * (1 - rp)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bxp, byp, 60 + 60 * rp, 0, Math.PI * 2); ctx.stroke(); }
    }
  });
}

// ---- comparison icons (100-unit box, stroked)
function oldIcon(ctx, L, kind, col) {
  ctx.strokeStyle = col; ctx.fillStyle = L.rgba(col, 0.16); ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const P = (pts, close = true) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); if (close) ctx.closePath(); };
  if (kind === 0) { // stretch film: upright roll, film unwinding to the left
    ctx.beginPath(); ctx.moveTo(-2, -30); ctx.bezierCurveTo(-18, -26, -30, -36, -48, -30); ctx.lineTo(-48, 30); ctx.bezierCurveTo(-30, 24, -18, 34, -2, 30); ctx.closePath();
    ctx.fillStyle = L.rgba(col, 0.12); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(-30, 14); ctx.moveTo(-26, -20); ctx.lineTo(-40, 8); ctx.stroke(); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-6, -32); ctx.lineTo(-6, 34); ctx.ellipse(14, 34, 20, 7, 0, Math.PI, 0, true); ctx.lineTo(34, -32); ctx.closePath();
    ctx.fillStyle = L.rgba(col, 0.3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(14, -32, 20, 7, 0, 0, Math.PI * 2); ctx.fillStyle = '#16263C'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(14, -32, 6, 2.4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, -40); ctx.lineTo(14, -48); ctx.stroke();
  } else if (kind === 1) { // corrugated cardboard sheet
    P([[-48, 4], [30, 4], [48, -26], [-30, -26]]); ctx.fill(); ctx.stroke();
    P([[-48, 4], [30, 4], [30, 22], [-48, 22]]); ctx.fill(); ctx.stroke();
    P([[30, 4], [48, -26], [48, -8], [30, 22]]); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath();
    for (let x = -48; x <= 30; x += 2) { const y = 13 + Math.sin((x + 48) * 0.42) * 6; x === -48 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  } else { // expanded polystyrene block
    P([[-38, -14], [22, -14], [22, 40], [-38, 40]]); ctx.fill(); ctx.stroke();
    P([[-38, -14], [22, -14], [40, -34], [-20, -34]]); ctx.fill(); ctx.stroke();
    P([[22, -14], [40, -34], [40, 20], [22, 40]]); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.5;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-30 + i * 15 + (j % 2) * 6, -4 + j * 13, 4, 0, Math.PI * 2); ctx.stroke(); }
  }
}
function newIcon(ctx, L, kind, col) {
  ctx.strokeStyle = col; ctx.fillStyle = L.rgba(col, 0.18); ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const P = (pts) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); };
  if (kind === 0) { // bubble film sheet
    L.roundRect(ctx, -44, -36, 88, 72, 12); ctx.fill(); ctx.stroke();
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      const bx = -26 + i * 26, by = -18 + j * 18;
      ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = L.rgba('#FFFFFF', 0.7); ctx.beginPath(); ctx.arc(bx - 3, by - 3, 2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 1) { // П-profile (extruded)
    P([[-32, -18], [-14, -34], [46, -34], [28, -18]]); ctx.fill(); ctx.stroke();
    P([[28, -18], [46, -34], [46, 26], [28, 42]]); ctx.fill(); ctx.stroke();
    P([[-32, 42], [-32, -18], [28, -18], [28, 42], [14, 42], [14, -4], [-18, -4], [-18, 42]]); ctx.fillStyle = L.rgba(col, 0.3); ctx.fill(); ctx.stroke();
  } else { // lodgement: foam block with a device in its cavity
    P([[-46, -6], [-22, -6], [-22, 10], [22, 10], [22, -6], [46, -6], [46, 40], [-46, 40]]); ctx.fill(); ctx.stroke();
    P([[-46, -6], [-30, -22], [62, -22], [46, -6]]); ctx.fill(); ctx.stroke();
    P([[46, -6], [62, -22], [62, 24], [46, 40]]); ctx.fill(); ctx.stroke();
    L.roundRect(ctx, -18, -30, 36, 38, 5); ctx.fillStyle = '#0B1A2E'; ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(8, -18); ctx.stroke();
  }
}

function compStage(ctx, L, t, T, a) {
  const { C, ep, prog, clamp, lerp, ease } = L;
  const xs = [150, 400, 650], cy = 236, ts = 210;
  L.save(ctx, () => {
    ctx.globalAlpha *= a;
    // connecting baseline
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(60, cy + ts / 2 + 50); ctx.lineTo(P3.w - 60, cy + ts / 2 + 50); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const ap = prog(t, T.comp + i * 0.12, 0.55);
      if (ap <= 0) continue;
      const xt = T.xs[i];
      const strike = ep(t, xt, 0.28, 'outCubic'), swap = ep(t, xt + 0.32, 0.45, 'inOutCubic');
      const np = prog(t, xt + 0.32, 0.55);
      const e = ease.outCubic(ap), fl = Math.sin(t * 1.3 + i * 1.9) * 3 * swap;
      L.at(ctx, { x: xs[i], y: cy + (1 - e) * 40 + fl, alpha: clamp(ap * 1.6) }, () => {
        // tile
        L.save(ctx, () => {
          ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
          L.roundRect(ctx, -ts / 2, -ts / 2, ts, ts, 28); ctx.fillStyle = L.mixColor('#13253F', '#0F2E2A', swap); ctx.fill();
        });
        if (swap > 0) L.glow(ctx, 0, 0, 150, C.brand, 0.22 * swap);
        L.roundRect(ctx, -ts / 2, -ts / 2, ts, ts, 28); ctx.lineWidth = 2.5;
        ctx.strokeStyle = swap > 0 ? L.rgba(C.brandHi, 0.25 + 0.6 * swap) : 'rgba(255,255,255,0.16)'; ctx.stroke();
        // old icon + strike
        if (swap < 1) L.at(ctx, { scale: 1.25 * (1 - 0.3 * swap), alpha: 1 - swap }, () => {
          oldIcon(ctx, L, i, '#8E9AAC');
          if (strike > 0) {
            ctx.lineCap = 'round';
            const x2 = lerp(-56, 56, strike), y2 = lerp(-56, 56, strike);
            ctx.strokeStyle = '#0B1A2E'; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(-56, -56); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.strokeStyle = '#FF5A66'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-56, -56); ctx.lineTo(x2, y2); ctx.stroke();
          }
        });
        if (np > 0) L.at(ctx, { scale: 1.25 * lerp(0.6, 1, ease.outBack(np)), alpha: clamp(np * 1.8) }, () => newIcon(ctx, L, i, C.brandHi));
        // flash ring at the swap
        const fr = prog(t, xt + 0.3, 0.6);
        if (fr > 0 && fr < 1) { ctx.strokeStyle = L.rgba(C.brandHi, 0.7 * (1 - fr)); ctx.lineWidth = 3; L.roundRect(ctx, -ts / 2 - 14 * fr, -ts / 2 - 14 * fr, ts + 28 * fr, ts + 28 * fr, 28 + 14 * fr); ctx.stroke(); }
      });
      // small green check under each converted tile
      if (np > 0) {
        const ce = ease.outBack(clamp(np * 1.2));
        L.at(ctx, { x: xs[i], y: cy + ts / 2 + 50, scale: ce, alpha: clamp(np * 2) }, () => {
          ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fillStyle = C.brand; ctx.fill();
          L.drawIcon(ctx, 'check', 0, 0, 22, C.white, clamp(np * 1.6), 5);
        });
      }
    }
  });
}

// running motif: the same house emblem as scenes 6–7 (white tile, ink line drawing, same window layout), so the
// window count carries straight on. Window order: bottom-left, bottom-right, top-left, top-middle, top-right;
// windows 1–4 were lit by scenes 4–7, the fifth (top-right) lights here. lit = array 0..1
const EMB = { x: LM + 50, y: 146, s: 0.72 };   // a touch smaller than in s06/s07: this scene's headline is larger and sits higher;
                                               // tile left edge aligns with the left margin, ~35 px clear of the headline caps
function houseEmblem(ctx, L, x, y, s, lit, alpha) {
  if (alpha <= 0.002) return;
  const INK = '#14233A';
  L.at(ctx, { x, y, scale: s, alpha }, () => {
    const w = 96, h = 70, rh = 36;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
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

// ---------------------------------------------------------------- scene
module.exports = {
  draw(ctx, t, d, L, env) {
    const T = timing(env);
    const seg = t < T.mid1 ? 1 : t < T.mid2 ? 2 : 3;
    background(ctx, L, t, seg);
    // outgoing showcase drifts left and dims while the shutter closes over it
    const exitK = mid => L.ep(t, mid - 0.6, 0.6, 'inCubic');
    if (seg === 1) { const k = exitK(T.mid1); L.at(ctx, { x: -60 * k, alpha: 1 - 0.3 * k }, () => showcase1(ctx, L, t, d, T)); }
    else if (seg === 2) { const k = exitK(T.mid2); L.at(ctx, { x: -60 * k, alpha: 1 - 0.3 * k }, () => showcase2(ctx, L, t, d, T)); }
    else showcase3(ctx, L, t, d, T);
    shutter(ctx, L, t, T.mid1);
    shutter(ctx, L, t, T.mid2);
    L.vignette(ctx, 0.42);
    if (seg === 3) emblem(ctx, L, t, T);
  },
};
