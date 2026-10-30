// Shared drawing library for the MONOISOL promo. Canvas 2D (Skia via @napi-rs/canvas).
// Every scene gets this object as `L`. All sizes are in 1920x1080 pixel space.
'use strict';
const path = require('path');
const { createCanvas, GlobalFonts, Path2D } = require('@napi-rs/canvas');

const W = 1920, H = 1080, FPS = 30;

// Robustness: scenes evaluate easing/phase maths for t slightly outside [0, d] during transitions; never let a
// negative radius (Skia throws IndexSizeError) kill a render.
{
  const P = Object.getPrototypeOf(createCanvas(1, 1).getContext('2d'));
  const arc = P.arc, ellipse = P.ellipse, radial = P.createRadialGradient;
  P.arc = function (x, y, r, a0, a1, ccw) { return arc.call(this, x, y, r > 0 ? r : 0, a0, a1, ccw); };
  P.ellipse = function (x, y, rx, ry, rot, a0, a1, ccw) { return ellipse.call(this, x, y, rx > 0 ? rx : 0, ry > 0 ? ry : 0, rot, a0, a1, ccw); };
  P.createRadialGradient = function (x0, y0, r0, x1, y1, r1) { return radial.call(this, x0, y0, r0 > 0 ? r0 : 0, x1, y1, r1 > 0 ? r1 : 0.0001); };
}

// ---------- fonts ----------
const FD = path.join(__dirname, 'fonts');
for (const w of [400, 600, 800]) {
  GlobalFonts.registerFromPath(path.join(FD, `Unbounded-${w}.ttf`), `UB${w}`);
  GlobalFonts.registerFromPath(path.join(FD, `Manrope-${w}.ttf`), `MR${w}`);
}
// role -> family. display = Unbounded (headlines), body = Manrope.
const FONTS = { display: 'UB800', displaySemi: 'UB600', displayLight: 'UB400', body: 'MR600', bodyBold: 'MR800', bodyLight: 'MR400' };
const font = (role, size) => `${Math.round(size)}px ${FONTS[role] || role}`;

// ---------- palette ----------
const C = {
  navy: '#071629', navy2: '#0B2240', navy3: '#123561', ink: '#0A1424',
  blue: '#1E6FD9', cyan: '#2CC4F5', ice: '#9EE3FF', frost: '#DDF5FF',
  orange: '#FF7A2F', amber: '#FFB547', ember: '#FF5A1F', warmLight: '#FFE2B8',
  white: '#F6FAFF', grey: '#AAB6C6', greyDark: '#5B6B80',
  foam: '#E7ECF2', foamShade: '#B9C4D2', foamDark: '#8D9AAC',
  foil: '#D9DEE5', foilHi: '#FFFFFF', foilLo: '#8F99A6',
  green: '#3DDC97', red: '#FF4D5E', uaBlue: '#0057B7', uaYellow: '#FFD700',
  // MONOISOL brand (sampled from the official logo): green ring + silver lettering
  brand: '#2FA25A', brandHi: '#5BD68C', brandDark: '#1B6A39', silver: '#C3C6CA', silverDark: '#8E9399',
};

// ---------- math / time ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, x) => (x - a) / (b - a);
const remap = (x, a, b, c, d) => lerp(c, d, clamp(invLerp(a, b, x)));
// progress of t through [start, start+dur], clamped 0..1
const prog = (t, start, dur = 1) => clamp((t - start) / Math.max(1e-6, dur));
const ease = {
  linear: x => x,
  inQuad: x => x * x, outQuad: x => 1 - (1 - x) * (1 - x),
  inCubic: x => x * x * x, outCubic: x => 1 - Math.pow(1 - x, 3),
  inOutCubic: x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
  inOutExpo: x => x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  outElastic: x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
};
// eased progress helper: ep(t, start, dur, 'outCubic')
const ep = (t, start, dur, e = 'outCubic') => ease[e](prog(t, start, dur));
// in-hold-out envelope: rises over [a, a+fin], holds, falls over [b-fout, b]
const envelope = (t, a, b, fin = 0.4, fout = 0.4) => Math.min(ease.outCubic(prog(t, a, fin)), 1 - ease.inCubic(prog(t, b - fout, fout)));
// deterministic PRNG
function rng(seed = 1) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
// smooth 1D value noise in [-1, 1]
function noise1(x, seed = 0) {
  const h = n => { const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u);
}

// ---------- color ----------
function hexToRgb(hex) { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const rgba = (hex, a = 1) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const mixColor = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp(t)))); return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`; };

// ---------- canvas helpers ----------
function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}
function save(ctx, fn) { ctx.save(); try { fn(); } finally { ctx.restore(); } }
// run fn translated/rotated/scaled around (x, y) with alpha
function at(ctx, { x = 0, y = 0, rot = 0, scale = 1, sx, sy, alpha = 1 } = {}, fn) {
  if (alpha <= 0.001) return;
  save(ctx, () => { ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx ?? scale, sy ?? scale); ctx.globalAlpha *= alpha; fn(); });
}
function glow(ctx, x, y, r, color, a = 1) {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(0.4, rgba(color, a * 0.35)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
const offscreen = (w = W, h = H) => createCanvas(w, h);

// ---------- backgrounds ----------
const BG = {
  night: ['#040C18', '#0B2240', '#123561'],
  cold: ['#06182E', '#0E3A66', '#1B6CA8'],
  warm: ['#1A0C08', '#4A1E0E', '#A8461A'],
  brand: ['#05122A', '#0A2A5C', '#1452A8'],
  deep: ['#03070E', '#0A1628', '#14294A'],
  light: ['#EAF3FB', '#F7FBFF', '#DCEBFA'],
};
// animated diagonal gradient + soft moving light blobs
function background(ctx, t, variant = 'night', opts = {}) {
  const [a, b, c] = BG[variant] || BG.night;
  const g = ctx.createLinearGradient(0, 0, W * 0.6, H * 1.2);
  g.addColorStop(0, a); g.addColorStop(0.55, b); g.addColorStop(1, c);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const blobs = opts.blobs ?? 3, col = opts.glow || (variant === 'warm' ? C.orange : variant === 'light' ? '#FFFFFF' : C.cyan);
  for (let i = 0; i < blobs; i++) {
    const x = W * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.13 + i * 2.1)));
    const y = H * (0.25 + 0.5 * (0.5 + 0.5 * Math.cos(t * 0.11 + i * 1.7)));
    glow(ctx, x, y, 520 + 120 * i, col, (opts.glowAlpha ?? 0.10));
  }
}
function vignette(ctx, strength = 0.55) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// subtle grid of dots (tech feel)
function dotGrid(ctx, t, { color = C.cyan, alpha = 0.08, step = 48, drift = 6 } = {}) {
  ctx.fillStyle = rgba(color, alpha);
  const ox = (t * drift) % step;
  for (let y = step / 2; y < H; y += step) for (let x = -step + ox; x < W + step; x += step) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); }
}
// falling snow; amount 0..1
function snow(ctx, t, { amount = 1, seed = 7, count = 160, wind = 30, color = '#FFFFFF', speed = 1, area = [0, 0, W, H] } = {}) {
  if (amount <= 0) return;
  const r = rng(seed), [ax, ay, aw, ah] = area;
  for (let i = 0; i < count; i++) {
    const depth = r(), size = 1.2 + depth * 4.2, v = (30 + depth * 90) * speed;
    const x0 = r() * aw, y0 = r() * ah, ph = r() * 10;
    const y = ay + ((y0 + t * v) % ah + ah) % ah;
    const x = ax + ((x0 + t * wind * (0.4 + depth) + Math.sin(t * 0.8 + ph) * 18) % aw + aw) % aw;
    ctx.fillStyle = rgba(color, (0.25 + depth * 0.6) * amount);
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
  }
}
// rising warm particles (embers / dust); amount 0..1
function embers(ctx, t, { amount = 1, seed = 11, count = 70, color = C.amber, area = [0, 0, W, H] } = {}) {
  if (amount <= 0) return;
  const r = rng(seed), [ax, ay, aw, ah] = area;
  for (let i = 0; i < count; i++) {
    const d = r(), x0 = r() * aw, y0 = r() * ah, ph = r() * 6.28, v = 15 + d * 40;
    const y = ay + ah - (((ah - y0) + t * v) % ah);
    const x = ax + x0 + Math.sin(t * 0.7 + ph) * 25;
    glow(ctx, x, y, 6 + d * 14, color, (0.25 + 0.5 * d) * amount * (0.6 + 0.4 * Math.sin(t * 3 + ph)));
  }
}
// floating bokeh circles
function bokeh(ctx, t, { amount = 1, seed = 5, count = 18, color = C.cyan } = {}) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = (r() * W + t * (8 + r() * 14)) % (W + 200) - 100, y = r() * H + Math.sin(t * 0.3 + i) * 20, s = 30 + r() * 90;
    ctx.fillStyle = rgba(color, 0.035 * amount); ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(color, 0.06 * amount); ctx.lineWidth = 1.5; ctx.stroke();
  }
}

// ---------- text ----------
function setFont(ctx, role, size) { ctx.font = font(role, size); }
function measure(ctx, str, role, size, letterSpacing = 0) { setFont(ctx, role, size); return ctx.measureText(str).width + letterSpacing * Math.max(0, [...str].length - 1); }
// draw text with optional letter spacing; returns width
function text(ctx, str, x, y, { role = 'body', size = 40, color = C.white, align = 'left', baseline = 'alphabetic', letterSpacing = 0, alpha = 1, shadow = null, maxWidth } = {}) {
  if (alpha <= 0.001 || !str) return 0;
  setFont(ctx, role, size);
  if (maxWidth) { const w0 = measure(ctx, str, role, size, letterSpacing); if (w0 > maxWidth) { size *= maxWidth / w0; setFont(ctx, role, size); letterSpacing *= maxWidth / w0; } }
  const w = ctx.measureText(str).width + letterSpacing * Math.max(0, [...str].length - 1);
  let sx = x; if (align === 'center') sx = x - w / 2; else if (align === 'right') sx = x - w;
  save(ctx, () => {
    ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.textBaseline = baseline; ctx.textAlign = 'left';
    if (shadow) { ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.45)'; ctx.shadowBlur = shadow.blur ?? 24; ctx.shadowOffsetY = shadow.y ?? 6; }
    if (!letterSpacing) ctx.fillText(str, sx, y);
    else { let cx = sx; for (const ch of str) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + letterSpacing; } }
  });
  return w;
}
// greedy word wrap -> array of lines
function wrap(ctx, str, role, size, maxWidth) {
  setFont(ctx, role, size);
  const words = str.split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur); return lines;
}
// Kinetic reveal: words rise from a mask with stagger. p in 0..1 (use ep()). Supports multi-line via maxWidth.
// Returns {width, height, lines}.
function revealText(ctx, str, x, y, p, { role = 'display', size = 80, color = C.white, align = 'left', lineHeight = 1.15, maxWidth = 1600, stagger = 0.12, letterSpacing = 0, highlight = null, highlightColor = C.brandHi, alpha = 1, out = 0 } = {}) {
  const lines = wrap(ctx, str, role, size, maxWidth);
  setFont(ctx, role, size);
  const words = []; lines.forEach((ln, li) => ln.split(' ').forEach(w => words.push({ w, li })));
  const n = words.length; let wi = 0; let maxW = 0;
  lines.forEach((ln, li) => {
    const lw = measure(ctx, ln, role, size, letterSpacing); maxW = Math.max(maxW, lw);
    let cx = align === 'center' ? x - lw / 2 : align === 'right' ? x - lw : x;
    const ly = y + li * size * lineHeight;
    for (const w of ln.split(' ')) {
      const k = n > 1 ? wi / (n - 1) : 0;
      const span = 1 / (1 + stagger * (n - 1));
      const wp = ease.outCubic(clamp((p - k * (1 - span)) / span));
      const wo = ease.inCubic(clamp(out));
      const ww = measure(ctx, w, role, size, letterSpacing);
      save(ctx, () => {
        ctx.beginPath(); ctx.rect(cx - 10, ly - size * 1.05, ww + 20, size * 1.4); ctx.clip();
        const dy = (1 - wp) * size * 1.1 - wo * size * 1.1;
        const isHi = highlight && highlight.some(h => w.toLowerCase().includes(h.toLowerCase()));
        text(ctx, w, cx, ly + dy, { role, size, color: isHi ? highlightColor : color, letterSpacing, alpha: alpha * wp * (1 - wo) });
      });
      cx += ww + measure(ctx, ' ', role, size); wi++;
    }
  });
  return { width: maxW, height: lines.length * size * lineHeight, lines };
}
// typewriter: shows first round(p*len) characters, with cursor
function typeText(ctx, str, x, y, p, opts = {}) {
  const chars = [...str]; const n = Math.round(clamp(p) * chars.length);
  const w = text(ctx, chars.slice(0, n).join(''), x, y, opts);
  if (p < 1 && opts.cursor !== false) { save(ctx, () => { ctx.fillStyle = opts.color || C.white; ctx.fillRect(x + w + 6, y - (opts.size || 40) * 0.8, 4, (opts.size || 40) * 0.9); }); }
  return w;
}

// ---------- UI components ----------
// glass panel
function panel(ctx, x, y, w, h, { r = 28, fill = 'rgba(255,255,255,0.07)', stroke = 'rgba(255,255,255,0.18)', alpha = 1, shadow = true, accent = null } = {}) {
  if (alpha <= 0.001) return;
  save(ctx, () => {
    ctx.globalAlpha *= alpha;
    if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; }
    roundRect(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.shadowColor = 'transparent';
    const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = stroke; ctx.stroke();
    if (accent) { roundRect(ctx, x, y + 18, 6, h - 36, 3); ctx.fillStyle = accent; ctx.fill(); }
  });
}
// pill label; p = 0..1 appear progress. returns width
function pill(ctx, str, x, y, p = 1, { size = 30, color = C.white, bg = rgba(C.brand, 0.22), border = rgba(C.brandHi, 0.7), role = 'bodyBold', align = 'left', icon = null, iconColor = C.brandHi, padX = 26, h } = {}) {
  if (p <= 0.001) return 0;
  const tw = measure(ctx, str, role, size); const ih = icon ? size * 1.1 : 0; const pw = tw + padX * 2 + (icon ? ih + 12 : 0); const ph = h || size * 1.9;
  const sx = align === 'center' ? x - pw / 2 : align === 'right' ? x - pw : x;
  const e = ease.outBack(clamp(p));
  at(ctx, { x: sx + pw / 2, y, scale: lerp(0.7, 1, e), alpha: clamp(p * 1.5) }, () => {
    roundRect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = border; ctx.stroke();
    let cx = -pw / 2 + padX;
    if (icon) { drawIcon(ctx, icon, cx + ih / 2, 0, ih, iconColor); cx += ih + 12; }
    text(ctx, str, cx, 0, { role, size, color, baseline: 'middle' });
  });
  return pw;
}
// kicker (small caps line) + headline + optional sub, revealed by p (0..1); out (0..1) hides
function headline(ctx, x, y, p, { kicker, title, sub, align = 'left', titleSize = 84, subSize = 36, maxWidth = 1100, color = C.white, kickerColor = C.brandHi, highlight, highlightColor = C.brandHi, out = 0 } = {}) {
  let cy = y;
  if (kicker) {
    const kp = clamp(p * 2) * (1 - out);
    const kw = measure(ctx, kicker.toUpperCase(), 'bodyBold', 26, 4);
    const lx = align === 'center' ? x - kw / 2 : align === 'right' ? x - kw : x;
    save(ctx, () => { ctx.fillStyle = rgba(kickerColor, kp); ctx.fillRect(lx, cy - 40, 64 * ease.outCubic(kp), 4); });
    text(ctx, kicker.toUpperCase(), x, cy, { role: 'bodyBold', size: 26, color: kickerColor, letterSpacing: 4, align, alpha: kp });
    cy += titleSize * 1.15;
  }
  const r = revealText(ctx, title, x, cy, clamp(p * 1.25), { role: 'display', size: titleSize, color, align, maxWidth, highlight, highlightColor, out });
  cy += r.height;
  if (sub) {
    const sp = clamp((p - 0.45) / 0.55) * (1 - out);
    const lines = wrap(ctx, sub, 'body', subSize, maxWidth);
    lines.forEach((ln, i) => text(ctx, ln, x, cy + subSize * 0.6 + i * subSize * 1.35 + (1 - ease.outCubic(sp)) * 20, { role: 'body', size: subSize, color: rgba('#DCE8F6', 1), align, alpha: sp }));
    cy += subSize * 0.6 + lines.length * subSize * 1.35;
  }
  return cy - y;
}
// big number callout: value string (e.g. "25–30"), unit (e.g. "кг/м³"), label
function stat(ctx, x, y, p, { value, unit = '', label = '', color = C.white, accent = C.brandHi, size = 120, align = 'left' } = {}) {
  if (p <= 0.001) return;
  const e = ease.outCubic(clamp(p));
  const vw = measure(ctx, value, 'display', size), uw = unit ? measure(ctx, unit, 'displaySemi', size * 0.38) + 16 : 0;
  const total = vw + uw; const sx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  save(ctx, () => {
    ctx.globalAlpha *= clamp(p * 1.4);
    text(ctx, value, sx, y + (1 - e) * 40, { role: 'display', size, color });
    if (unit) text(ctx, unit, sx + vw + 16, y + (1 - e) * 40, { role: 'displaySemi', size: size * 0.38, color: accent });
    if (label) text(ctx, label, align === 'center' ? x : sx, y + size * 0.55 + (1 - e) * 30, { role: 'body', size: Math.max(26, size * 0.26), color: C.grey, align: align === 'center' ? 'center' : 'left' });
  });
}
// checklist with animated check icons; items appear with stagger from p (0..1)
function checklist(ctx, items, x, y, p, { size = 40, gap = 1.7, color = C.white, check = C.brandHi, maxWidth = 900 } = {}) {
  items.forEach((it, i) => {
    const ip = clamp(p * (items.length * 0.6 + 1) - i * 0.6);
    if (ip <= 0) return;
    const e = ease.outCubic(ip), yy = y + i * size * gap;
    at(ctx, { x: x + (1 - e) * -40, y: yy, alpha: e }, () => {
      ctx.beginPath(); ctx.arc(size * 0.5, -size * 0.32, size * 0.55, 0, Math.PI * 2); ctx.fillStyle = rgba(check, 0.18); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = rgba(check, 0.7); ctx.stroke();
      drawIcon(ctx, 'check', size * 0.5, -size * 0.32, size * 0.6, check, clamp(ip * 2));
      text(ctx, it, size * 1.5, 0, { role: 'body', size, color, maxWidth });
    });
  });
}
// thin progress/underline sweep
function underline(ctx, x, y, w, p, color = C.brandHi, th = 6) { save(ctx, () => { ctx.fillStyle = color; roundRect(ctx, x, y, w * ease.inOutCubic(clamp(p)), th, th / 2); ctx.fill(); }); }

// ---------- icons (stroked, centered at x,y, size = box) ----------
function drawIcon(ctx, name, x, y, size, color = C.white, p = 1, lw) {
  if (p <= 0.001) return;
  save(ctx, () => {
    ctx.translate(x, y); const s = size / 100; ctx.scale(s, s);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw ? lw / s : 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha *= clamp(p);
    const L = (pts, close) => { ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); if (close) ctx.closePath(); ctx.stroke(); };
    const O = (cx, cy, r, fill) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); fill ? ctx.fill() : ctx.stroke(); };
    switch (name) {
      case 'check': { ctx.lineWidth = 12; const k = clamp(p); const pts = [[-30, 2], [-8, 24], [32, -22]]; ctx.beginPath(); ctx.moveTo(...pts[0]); if (k < 0.4) ctx.lineTo(lerp(pts[0][0], pts[1][0], k / 0.4), lerp(pts[0][1], pts[1][1], k / 0.4)); else { ctx.lineTo(...pts[1]); const k2 = (k - 0.4) / 0.6; ctx.lineTo(lerp(pts[1][0], pts[2][0], k2), lerp(pts[1][1], pts[2][1], k2)); } ctx.stroke(); break; }
      case 'snowflake': for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); L([[0, 0], [0, -44]]); L([[-12, -30], [0, -20], [12, -30]]); ctx.restore(); } break;
      case 'flame': ctx.beginPath(); ctx.moveTo(0, 44); ctx.bezierCurveTo(-34, 40, -38, 8, -22, -10); ctx.bezierCurveTo(-14, 6, -6, 6, -4, -2); ctx.bezierCurveTo(-8, -24, 4, -40, 10, -46); ctx.bezierCurveTo(10, -24, 36, -14, 34, 14); ctx.bezierCurveTo(34, 34, 18, 44, 0, 44); ctx.stroke(); break;
      case 'drop': ctx.beginPath(); ctx.moveTo(0, -44); ctx.bezierCurveTo(10, -24, 34, -4, 34, 14); ctx.arc(0, 14, 34, 0, Math.PI); ctx.bezierCurveTo(-34, -4, -10, -24, 0, -44); ctx.stroke(); break;
      case 'house': L([[-40, -2], [0, -38], [40, -2]]); L([[-30, -10], [-30, 38], [30, 38], [30, -10]]); L([[-10, 38], [-10, 14], [10, 14], [10, 38]]); break;
      case 'shield': ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(36, -30); ctx.lineTo(34, 4); ctx.bezierCurveTo(30, 26, 14, 38, 0, 46); ctx.bezierCurveTo(-14, 38, -30, 26, -34, 4); ctx.lineTo(-36, -30); ctx.closePath(); ctx.stroke(); L([[-14, 2], [-3, 13], [16, -10]]); break;
      case 'sound': L([[-40, -12], [-24, -12], [-4, -30], [-4, 30], [-24, 12], [-40, 12]], true); ctx.beginPath(); ctx.arc(-4, 0, 22, -0.8, 0.8); ctx.stroke(); ctx.beginPath(); ctx.arc(-4, 0, 38, -0.8, 0.8); ctx.stroke(); break;
      case 'mute': L([[-40, -12], [-24, -12], [-4, -30], [-4, 30], [-24, 12], [-40, 12]], true); L([[14, -14], [40, 14]]); L([[40, -14], [14, 14]]); break;
      case 'box': L([[-38, -18], [0, -38], [38, -18], [38, 22], [0, 42], [-38, 22]], true); L([[-38, -18], [0, 2], [38, -18]]); L([[0, 2], [0, 42]]); break;
      case 'cable': ctx.beginPath(); ctx.moveTo(-44, 30); ctx.bezierCurveTo(-10, 30, -20, -10, 14, -10); ctx.stroke(); L([[14, -24], [14, 4]]); L([[14, -18], [36, -18]]); L([[14, -2], [36, -2]]); break;
      case 'pipe': L([[-44, -14], [44, -14]]); L([[-44, 14], [44, 14]]); ctx.beginPath(); ctx.ellipse(-44, 0, 6, 14, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(44, 0, 6, 14, 0, 0, Math.PI * 2); ctx.stroke(); break;
      case 'thermo': roundRect(ctx, -10, -44, 20, 62, 10); ctx.stroke(); O(0, 28, 16); O(0, 28, 8, true); L([[0, 20], [0, -20]]); break;
      case 'lab': L([[-14, -42], [14, -42]]); L([[-8, -42], [-8, -12], [-34, 34], [34, 34], [8, -12], [8, -42]]); L([[-22, 12], [22, 12]]); break;
      case 'doc': L([[-28, -42], [14, -42], [30, -26], [30, 42], [-28, 42]], true); L([[-14, -10], [16, -10]]); L([[-14, 8], [16, 8]]); L([[-14, 26], [6, 26]]); break;
      case 'cart': L([[-44, -30], [-30, -30], [-18, 18], [30, 18], [40, -14], [-24, -14]]); O(-12, 34, 7); O(24, 34, 7); break;
      case 'globe': O(0, 0, 40); ctx.beginPath(); ctx.ellipse(0, 0, 16, 40, 0, 0, Math.PI * 2); ctx.stroke(); L([[-40, 0], [40, 0]]); L([[-34, -20], [34, -20]]); L([[-34, 20], [34, 20]]); break;
      case 'bolt': L([[8, -44], [-22, 6], [2, 6], [-8, 44], [24, -8], [0, -8]], true); break;
      case 'ruler': ctx.save(); ctx.rotate(-Math.PI / 4); roundRect(ctx, -48, -14, 96, 28, 4); ctx.stroke(); for (let i = -36; i <= 36; i += 12) L([[i, -14], [i, i % 24 === 0 ? 2 : -4]]); ctx.restore(); break;
      case 'star': { ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 18 : 42, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); break; }
      case 'factory': L([[-44, 40], [-44, -4], [-20, 10], [-20, -4], [4, 10], [4, -40], [20, -40], [20, 10], [44, 10], [44, 40]], true); L([[-30, 26], [-20, 26]]); L([[-6, 26], [4, 26]]); L([[22, 26], [32, 26]]); break;
      case 'truck': L([[-44, -20], [10, -20], [10, 22], [-44, 22]], true); L([[10, -6], [30, -6], [44, 8], [44, 22], [10, 22]]); O(-26, 28, 8); O(26, 28, 8); break;
      case 'wind': ctx.beginPath(); ctx.moveTo(-44, -10); ctx.lineTo(16, -10); ctx.arc(16, -22, 12, Math.PI / 2, -Math.PI * 0.9, true); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-44, 8); ctx.lineTo(26, 8); ctx.arc(26, 22, 14, -Math.PI / 2, Math.PI * 0.8); ctx.stroke(); L([[-30, 26], [0, 26]]); break;
      case 'sun': O(0, 0, 18); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; L([[Math.cos(a) * 28, Math.sin(a) * 28], [Math.cos(a) * 42, Math.sin(a) * 42]]); } break;
      case 'leaf': ctx.beginPath(); ctx.moveTo(-36, 36); ctx.bezierCurveTo(-40, -20, 0, -40, 40, -40); ctx.bezierCurveTo(40, 0, 20, 40, -36, 36); ctx.stroke(); L([[-36, 36], [14, -14]]); break;
      case 'hand': ctx.beginPath(); ctx.moveTo(-44, 10); ctx.lineTo(-20, 10); ctx.bezierCurveTo(0, 10, 10, 20, 20, 20); ctx.lineTo(-4, 20); ctx.moveTo(-44, 36); ctx.lineTo(10, 36); ctx.lineTo(44, 14); ctx.bezierCurveTo(40, 6, 30, 6, 20, 12); ctx.stroke(); break;
      case 'heart': ctx.beginPath(); ctx.moveTo(0, 38); ctx.bezierCurveTo(-50, 4, -34, -40, 0, -18); ctx.bezierCurveTo(34, -40, 50, 4, 0, 38); ctx.stroke(); break;
      case 'hryvnia': O(0, 0, 42); ctx.beginPath(); ctx.moveTo(-14, -16); ctx.bezierCurveTo(-10, -30, 16, -30, 16, -14); ctx.bezierCurveTo(16, 2, -18, 10, -18, 22); ctx.bezierCurveTo(-18, 34, 12, 34, 16, 22); ctx.stroke(); L([[-22, -4], [22, -4]]); L([[-22, 8], [22, 8]]); break;
      default: O(0, 0, 36);
    }
  });
}

// ---------- foam texture ----------
const _foamCache = new Map();
// returns a cached canvas tile of closed-cell foam (seamless-ish), used as pattern
function foamTile({ cell = 14, color = C.foam, shade = C.foamShade, seed = 3, size = 256 } = {}) {
  const key = [cell, color, shade, seed, size].join('|');
  if (_foamCache.has(key)) return _foamCache.get(key);
  const c = createCanvas(size, size), x = c.getContext('2d'); const r = rng(seed);
  x.fillStyle = color; x.fillRect(0, 0, size, size);
  const n = Math.round((size * size) / (cell * cell) * 1.3);
  for (let i = 0; i < n; i++) {
    const cx = r() * size, cy = r() * size, rad = cell * (0.25 + r() * 0.5);
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const px = cx + ox, py = cy + oy; if (px < -rad || py < -rad || px > size + rad || py > size + rad) continue;
      const g = x.createRadialGradient(px - rad * 0.3, py - rad * 0.3, rad * 0.1, px, py, rad);
      g.addColorStop(0, rgba(shade, 0.0)); g.addColorStop(0.75, rgba(shade, 0.45)); g.addColorStop(1, rgba('#FFFFFF', 0.55));
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rad, 0, Math.PI * 2); x.fill();
    }
  }
  _foamCache.set(key, c); return c;
}
// fill current path / rect with foam pattern
function foamFill(ctx, opts = {}) { const p = ctx.createPattern(foamTile(opts), 'repeat'); ctx.fillStyle = p; ctx.fill(); }
// macro view of closed cells (big hexagon-ish bubbles) in a rect; t animates gentle breathing; p reveals
function foamMacro(ctx, x, y, w, h, t, { cell = 70, seed = 9, p = 1, color = C.foam, edge = C.foamShade, glowColor = null, glowAmt = 0 } = {}) {
  const r = rng(seed); const cols = Math.ceil(w / cell) + 2, rows = Math.ceil(h / (cell * 0.866)) + 2;
  save(ctx, () => {
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    for (let j = -1; j < rows; j++) for (let i = -1; i < cols; i++) {
      const jx = (r() - 0.5) * cell * 0.35, jy = (r() - 0.5) * cell * 0.35, rr = cell * (0.47 + r() * 0.08);
      const cx = x + i * cell + (j % 2 ? cell / 2 : 0) + jx, cy = y + j * cell * 0.866 + jy;
      const k = clamp(p * 1.6 - ((cx - x) / w) * 0.6); if (k <= 0) continue;
      const br = 1 + 0.03 * Math.sin(t * 1.5 + i * 0.7 + j * 1.3);
      const rad = rr * br * ease.outBack(k);
      const g = ctx.createRadialGradient(cx - rad * 0.35, cy - rad * 0.4, rad * 0.05, cx, cy, rad);
      g.addColorStop(0, rgba('#FFFFFF', 0.95)); g.addColorStop(0.55, rgba(color, 0.9)); g.addColorStop(0.92, rgba(edge, 0.95)); g.addColorStop(1, rgba(C.foamDark, 1));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
      if (glowColor && glowAmt > 0) { ctx.fillStyle = rgba(glowColor, 0.25 * glowAmt); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(cx - rad * 0.35, cy - rad * 0.42, rad * 0.22, rad * 0.12, -0.6, 0, Math.PI * 2); ctx.fill();
    }
  });
}

// ---------- illustrations ----------
// horizontal-ish cylinder (pipe) from (x1,y1) to (x2,y2) with radius r. Lit from top.
function cylinder(ctx, x1, y1, x2, y2, r, { base = '#B87333', hi = '#F3C08A', lo = '#5E3413', cap = true, alpha = 1, pattern = null } = {}) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy); if (len < 1) return; const ang = Math.atan2(dy, dx);
  at(ctx, { x: x1, y: y1, rot: ang, alpha }, () => {
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, lo); g.addColorStop(0.18, base); g.addColorStop(0.36, hi); g.addColorStop(0.55, base); g.addColorStop(1, lo);
    ctx.beginPath(); ctx.rect(0, -r, len, r * 2);
    if (pattern) { ctx.fillStyle = pattern; ctx.fill(); ctx.globalAlpha *= 0.75; }
    ctx.fillStyle = g; ctx.fill(); ctx.globalAlpha = alpha;
    if (cap) { ctx.beginPath(); ctx.ellipse(len, 0, r * 0.28, r, 0, 0, Math.PI * 2); const cg = ctx.createLinearGradient(len - r * 0.3, -r, len + r * 0.3, r); cg.addColorStop(0, hi); cg.addColorStop(1, lo); ctx.fillStyle = cg; ctx.fill(); }
  });
}
// Pipe with insulation sleeve. insulated 0..1 slides the sleeve on from the left. metal: 'copper'|'steel'|'plastic'
function insulatedPipe(ctx, x1, y1, x2, y2, r, { insulated = 1, thickness = 0.9, metal = 'steel', sleeve = 'foam', frost = 0, heat = 0, t = 0, label = null } = {}) {
  const M = { copper: ['#B87333', '#F6C796', '#5A2E10'], steel: ['#8D99A8', '#E9EEF4', '#3E4752'], plastic: ['#E9EDF1', '#FFFFFF', '#9AA4B0'] }[metal] || ['#8D99A8', '#E9EEF4', '#3E4752'];
  cylinder(ctx, x1, y1, x2, y2, r, { base: M[0], hi: M[1], lo: M[2] });
  if (frost > 0) { // frosty coat on bare pipe
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    at(ctx, { x: x1, y: y1, rot: Math.atan2(dy, dx), alpha: frost }, () => {
      ctx.fillStyle = 'rgba(220,245,255,0.55)'; ctx.fillRect(0, -r * 1.02, len, r * 2.04);
      const rr = rng(4); for (let i = 0; i < len / 6; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + rr() * 0.5})`; ctx.beginPath(); ctx.arc(rr() * len, (rr() - 0.5) * r * 2, 1 + rr() * 3, 0, 7); ctx.fill(); }
    });
  }
  if (heat > 0) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; heatWaves(ctx, mx, my - r * 1.2, Math.hypot(x2 - x1, y2 - y1) * 0.8, r * 3, t, heat); }
  if (insulated > 0) {
    const R = r * (1 + thickness), e = clamp(insulated);
    const ex = lerp(x1, x2, e), ey = lerp(y1, y2, e);
    const S = sleeve === 'foil' ? ['#C9D0D8', '#FFFFFF', '#7D8794'] : sleeve === 'hd' ? ['#9AA6B5', '#D6DEE7', '#5D6979'] : sleeve === 'fire' ? ['#C33C2E', '#F27A62', '#6E1A12'] : [C.foam, '#FFFFFF', C.foamDark];
    const pat = sleeve === 'foil' ? null : ctx.createPattern(foamTile({ cell: 9, color: S[0], shade: S[2], seed: 5, size: 192 }), 'repeat');
    cylinder(ctx, x1, y1, ex, ey, R, { base: S[0], hi: S[1], lo: S[2], pattern: pat, cap: true });
    if (sleeve === 'hd' || sleeve === 'fire') { // printed stripe
      const dx = ex - x1, dy = ey - y1, len = Math.hypot(dx, dy);
      at(ctx, { x: x1, y: y1, rot: Math.atan2(dy, dx) }, () => { ctx.fillStyle = sleeve === 'fire' ? 'rgba(255,220,180,0.55)' : 'rgba(44,196,245,0.55)'; ctx.fillRect(0, -R * 0.12, len, R * 0.1); });
    }
    if (label && e > 0.6) { const mx = lerp(x1, ex, 0.5), my = lerp(y1, ey, 0.5); text(ctx, label, mx, my + 10, { role: 'bodyBold', size: R * 0.55, color: 'rgba(30,50,80,0.55)', align: 'center', alpha: remap(e, 0.6, 1, 0, 1) }); }
  }
}
// cross-section of insulated pipe: metal ring, foam ring with cells, optional foil ring. p 0..1 grows layers.
function pipeSection(ctx, x, y, rPipe, rOuter, p = 1, { metal = 'steel', foil = false, t = 0, fluid = C.orange, labels = false } = {}) {
  const M = { copper: ['#B87333', '#F6C796'], steel: ['#7E8A99', '#D9E0E8'], plastic: ['#E9EDF1', '#FFFFFF'] }[metal] || ['#7E8A99', '#D9E0E8'];
  const e1 = ease.outCubic(clamp(p * 2)), e2 = ease.outBack(clamp(p * 2 - 0.7)), e3 = ease.outCubic(clamp(p * 2 - 1.2));
  save(ctx, () => {
    ctx.translate(x, y);
    if (e2 > 0) {
      const R = lerp(rPipe, rOuter, e2);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = C.foam; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.arc(0, 0, rPipe, 0, Math.PI * 2, true);
      foamFill(ctx, { cell: Math.max(8, (rOuter - rPipe) / 5), seed: 21 });
      const sg = ctx.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.2, 0, 0, R); sg.addColorStop(0, 'rgba(255,255,255,0.35)'); sg.addColorStop(1, 'rgba(40,60,90,0.35)');
      ctx.fillStyle = sg; ctx.fill('evenodd');
    }
    if (foil && e3 > 0) { ctx.beginPath(); ctx.arc(0, 0, rOuter + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * e3); ctx.lineWidth = 12; const fg = ctx.createLinearGradient(-rOuter, -rOuter, rOuter, rOuter); fg.addColorStop(0, C.foilHi); fg.addColorStop(0.5, C.foilLo); fg.addColorStop(1, C.foilHi); ctx.strokeStyle = fg; ctx.stroke(); }
    // pipe wall
    ctx.beginPath(); ctx.arc(0, 0, rPipe * e1, 0, Math.PI * 2); const mg = ctx.createLinearGradient(-rPipe, -rPipe, rPipe, rPipe); mg.addColorStop(0, M[1]); mg.addColorStop(1, M[0]); ctx.fillStyle = mg; ctx.fill();
    // fluid
    ctx.beginPath(); ctx.arc(0, 0, rPipe * 0.82 * e1, 0, Math.PI * 2); const fl = ctx.createRadialGradient(0, 0, 0, 0, 0, rPipe); fl.addColorStop(0, rgba(fluid, 1)); fl.addColorStop(1, rgba(mixColor(fluid, '#000000', 0.35), 1)); ctx.fillStyle = fl; ctx.fill();
    for (let i = 0; i < 6; i++) { const a = t * 1.2 + i, rr = rPipe * 0.5 * (0.3 + 0.7 * ((i * 0.37 + t * 0.2) % 1)); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a * 1.3) * rr, rPipe * 0.07, 0, 7); ctx.fill(); }
  });
}
// wavy heat lines rising; amt 0..1
function heatWaves(ctx, x, y, w, h, t, amt = 1, color = C.orange) {
  if (amt <= 0) return;
  save(ctx, () => {
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const xx = x - w / 2 + (i + 0.5) * w / 5, ph = (t * 0.6 + i * 0.23) % 1;
      ctx.strokeStyle = rgba(color, amt * Math.sin(ph * Math.PI) * 0.8); ctx.lineWidth = 5;
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) { const yy = y - ph * h * 0.5 - k * h / 40; const xo = Math.sin(k * 0.6 + t * 4 + i) * 9; k ? ctx.lineTo(xx + xo, yy) : ctx.moveTo(xx + xo, yy); }
      ctx.stroke();
    }
  });
}
// stylised house (front elevation with roof); x,y = bottom-center; s = scale (1 => ~600px wide)
// warm 0..1 (window light / interior glow), leak 0..1 (heat escaping through walls/roof), shield 0..1 (blue protective outline), snowRoof 0..1
function house(ctx, x, y, s, t, { warm = 0.5, leak = 0, shield = 0, snowRoof = 0, insulated = 0, wall = '#D9E2EC', roof = '#2B3F5C' } = {}) {
  at(ctx, { x, y, scale: s }, () => {
    const w = 520, h = 330, rh = 210;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
    ctx.fillStyle = wall; ctx.fillRect(-w / 2, -h, w, h); ctx.restore();
    const wg = ctx.createLinearGradient(-w / 2, -h, w / 2, 0); wg.addColorStop(0, 'rgba(255,255,255,0.25)'); wg.addColorStop(1, 'rgba(0,30,60,0.25)'); ctx.fillStyle = wg; ctx.fillRect(-w / 2, -h, w, h);
    if (insulated > 0) { // foam layer outline growing around walls
      ctx.save(); ctx.lineWidth = 26; ctx.strokeStyle = rgba(C.foam, 0.95); ctx.setLineDash([2400 * insulated, 3000]);
      ctx.beginPath(); ctx.moveTo(-w / 2 - 13, 0); ctx.lineTo(-w / 2 - 13, -h - 13); ctx.lineTo(w / 2 + 13, -h - 13); ctx.lineTo(w / 2 + 13, 0); ctx.stroke(); ctx.restore();
    }
    // roof
    ctx.beginPath(); ctx.moveTo(-w / 2 - 50, -h); ctx.lineTo(0, -h - rh); ctx.lineTo(w / 2 + 50, -h); ctx.closePath();
    const rg = ctx.createLinearGradient(0, -h - rh, 0, -h); rg.addColorStop(0, mixColor(roof, '#FFFFFF', 0.15)); rg.addColorStop(1, roof); ctx.fillStyle = rg; ctx.fill();
    if (snowRoof > 0) { ctx.beginPath(); ctx.moveTo(-w / 2 - 50, -h); ctx.lineTo(0, -h - rh); ctx.lineTo(w / 2 + 50, -h); ctx.lineTo(w / 2 + 30, -h + 4); ctx.lineTo(0, -h - rh + 26 * snowRoof); ctx.lineTo(-w / 2 - 30, -h + 4); ctx.closePath(); ctx.fillStyle = rgba('#FFFFFF', 0.95 * snowRoof); ctx.fill(); }
    // chimney
    ctx.fillStyle = mixColor(roof, '#000000', 0.2); ctx.fillRect(w * 0.18, -h - rh * 0.8, 46, 110);
    // windows
    const lit = clamp(warm);
    const win = (wx, wy, ww, wh) => {
      ctx.fillStyle = mixColor('#1C2D45', '#FFC266', lit); ctx.fillRect(wx, wy, ww, wh);
      if (lit > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, wx + ww / 2, wy + wh / 2, ww * 1.6, C.amber, 0.35 * lit); ctx.restore(); }
      ctx.strokeStyle = '#F4F7FB'; ctx.lineWidth = 8; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    };
    win(-w / 2 + 50, -h + 70, 110, 100); win(w / 2 - 160, -h + 70, 110, 100);
    ctx.fillStyle = '#6B4A35'; ctx.fillRect(-50, -170, 100, 170); ctx.fillStyle = '#E8B04A'; ctx.beginPath(); ctx.arc(30, -85, 6, 0, 7); ctx.fill();
    // heat leaks (orange waves out of roof/walls)
    if (leak > 0) {
      heatWaves(ctx, 0, -h - rh * 0.4, 320, 260, t, leak, C.orange);
      heatWaves(ctx, -w / 2 - 40, -h * 0.4, 60, 200, t + 0.3, leak * 0.8, C.ember);
      heatWaves(ctx, w / 2 + 40, -h * 0.4, 60, 200, t + 0.6, leak * 0.8, C.ember);
    }
    if (shield > 0) {
      ctx.save(); ctx.globalAlpha *= shield;
      ctx.beginPath(); ctx.moveTo(-w / 2 - 80, 10); ctx.lineTo(-w / 2 - 80, -h - 20); ctx.lineTo(0, -h - rh - 70); ctx.lineTo(w / 2 + 80, -h - 20); ctx.lineTo(w / 2 + 80, 10);
      ctx.lineWidth = 10; ctx.strokeStyle = rgba(C.cyan, 0.9); ctx.shadowColor = C.cyan; ctx.shadowBlur = 30; ctx.stroke(); ctx.restore();
    }
  });
}
// roll of sheet material at (x,y) center of roll end, radius r, length (depth) d drawn as a horizontal roll; unroll 0..1 extends a sheet to the right
function roll(ctx, x, y, r, { unroll = 0, length = 600, sheetH = null, foil = false, t = 0, alpha = 1 } = {}) {
  at(ctx, { alpha }, () => {
    const sh = sheetH || r * 2;
    // unrolled sheet (in perspective: a band going right on the floor)
    if (unroll > 0) {
      const L = length * ease.outCubic(unroll);
      const g = ctx.createLinearGradient(0, y + r - sh * 0.12, 0, y + r + sh * 0.12);
      if (foil) { g.addColorStop(0, C.foilHi); g.addColorStop(0.5, C.foilLo); g.addColorStop(1, C.foil); } else { g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, C.foamShade); }
      ctx.beginPath(); ctx.moveTo(x, y + r - 6); ctx.lineTo(x + L, y + r - 6); ctx.lineTo(x + L + 30, y + r + 22); ctx.lineTo(x + 20, y + r + 22); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      if (!foil) { ctx.save(); ctx.clip(); ctx.globalAlpha *= 0.55; ctx.fillStyle = ctx.createPattern(foamTile({ cell: 8, seed: 12, size: 160 }), 'repeat'); ctx.fillRect(x, y + r - 10, L + 40, 40); ctx.restore(); }
      else { for (let i = 0; i < 4; i++) { const sx = x + ((t * 120 + i * 260) % Math.max(1, L)); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(sx, y + r - 6, 18, 28); } }
    }
    // roll body (side view circle with spiral)
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = foil ? C.foil : C.foam; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (!foil) foamFill(ctx, { cell: 7, seed: 13, size: 160 });
    const rg = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,0.4)'); rg.addColorStop(1, 'rgba(30,50,80,0.3)'); ctx.fillStyle = rg; ctx.fill();
    ctx.strokeStyle = foil ? 'rgba(80,90,105,0.55)' : 'rgba(120,135,155,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); const turns = 7, rot = -unroll * 6;
    for (let a = 0; a < turns * Math.PI * 2; a += 0.08) { const rr = r * 0.12 + (r * 0.86) * (a / (turns * Math.PI * 2)); const px = x + Math.cos(a + rot) * rr, py = y + Math.sin(a + rot) * rr; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
    if (foil) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.lineWidth = 8; const fg = ctx.createLinearGradient(x - r, y - r, x + r, y + r); fg.addColorStop(0, C.foilHi); fg.addColorStop(0.5, C.foilLo); fg.addColorStop(1, C.foilHi); ctx.strokeStyle = fg; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y, r * 0.12, 0, Math.PI * 2); ctx.fillStyle = '#4A5668'; ctx.fill();
  });
}
// corrugated pipe along straight line, ribs animate with t (flow); color e.g. orange/grey/black
function corrugated(ctx, x1, y1, x2, y2, r, { color = '#FF8A3D', t = 0, p = 1, cable = false } = {}) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) * clamp(p);
  at(ctx, { x: x1, y: y1, rot: Math.atan2(dy, dx) }, () => {
    if (cable) { // cable sticking out of the pipe end
      ctx.fillStyle = '#20252C'; roundRect(ctx, 0, -r * 0.35, len + 90, r * 0.7, r * 0.35); ctx.fill();
      ctx.fillStyle = '#C8792E'; ctx.fillRect(len + 70, -r * 0.18, 40, r * 0.12); ctx.fillStyle = '#9FA9B5'; ctx.fillRect(len + 70, r * 0.05, 40, r * 0.12);
    }
    const step = r * 0.42;
    const base = color, hi = mixColor(color, '#FFFFFF', 0.45), lo = mixColor(color, '#000000', 0.45);
    for (let s = 0; s < len; s += step) {
      const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, lo); g.addColorStop(0.3, hi); g.addColorStop(0.6, base); g.addColorStop(1, lo);
      ctx.fillStyle = g; roundRect(ctx, s, -r, step * 0.92, r * 2, step * 0.45); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(s + step * 0.88, -r * 0.92, step * 0.12, r * 1.84);
    }
  });
}
// isometric box (packaging); x,y = front-bottom corner on screen; w (width, along right-down axis), d (depth, along left-down axis), h (height)
// open 0..1 swings 4 flaps outward and shows foam padding inside
function isoBox(ctx, x, y, w, h, d, { color = '#C99A62', open = 0, foam = true, label = null } = {}) {
  const cx = Math.cos(Math.PI / 6), sy = 0.5;
  // u: 0..w goes to upper-right from the front corner, v: 0..d goes to upper-left; z up
  const P = (u, v, z) => [x + (u - v) * cx, y - z - (u + v) * sy];
  const poly = (pts, fill, stroke) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } };
  const th = ease.outBack(clamp(open)) * 2.0, f = Math.min(w, d) * 0.48, fc = Math.cos(th) * f, fz = Math.sin(th) * f;
  const flapCol = mixColor(color, '#FFFFFF', 0.08), edge = 'rgba(60,35,10,0.25)';
  save(ctx, () => {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 25;
    poly([P(0, 0, 0), P(w, 0, 0), P(w, d, 0), P(0, d, 0)], mixColor(color, '#000000', 0.3)); ctx.restore();
    if (open > 0) { // back flaps (hinged at far edges u=w and v=d), drawn behind
      poly([P(0, d, h), P(w, d, h), P(w, d - fc, h + fz), P(0, d - fc, h + fz)], mixColor(color, '#000000', 0.12), edge);
      poly([P(w, 0, h), P(w, d, h), P(w - fc, d, h + fz), P(w - fc, 0, h + fz)], mixColor(color, '#000000', 0.18), edge);
      // interior: back walls + foam padding
      poly([P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)], mixColor(color, '#000000', 0.35));
      poly([P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)], mixColor(color, '#000000', 0.42));
      if (foam) {
        const m = Math.min(w, d) * 0.08, fh = h * 0.82;
        ctx.beginPath(); [P(m, m, fh), P(w - m, m, fh), P(w - m, d - m, fh), P(m, d - m, fh)].forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath();
        foamFill(ctx, { cell: 10, seed: 41, size: 192 }); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
      }
    }
    // front faces: left face (v=0) and right face (u=0)
    poly([P(0, 0, 0), P(w, 0, 0), P(w, 0, h), P(0, 0, h)], mixColor(color, '#000000', 0.05), edge);
    poly([P(0, 0, 0), P(0, d, 0), P(0, d, h), P(0, 0, h)], mixColor(color, '#000000', 0.22), edge);
    // tape stripe on the closed lid / front
    if (open <= 0) {
      poly([P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)], mixColor(color, '#FFFFFF', 0.14), edge);
      poly([P(0, d * 0.44, h), P(w, d * 0.44, h), P(w, d * 0.56, h), P(0, d * 0.56, h)], 'rgba(255,255,255,0.25)');
    } else { // front flaps hinged at u=0 / v=0 edges, swinging outward
      poly([P(0, 0, h), P(w, 0, h), P(w, fc, h + fz), P(0, fc, h + fz)], flapCol, edge);
      poly([P(0, 0, h), P(0, d, h), P(fc, d, h + fz), P(fc, 0, h + fz)], mixColor(color, '#000000', 0.1), edge);
    }
    if (label) { const [lx, ly] = P(w * 0.5, 0, h * 0.45); save(ctx, () => { ctx.translate(lx, ly); ctx.transform(1, -0.5, 0, 1, 0, 0); text(ctx, label, 0, 0, { role: 'bodyBold', size: Math.max(14, h * 0.13), color: 'rgba(60,35,10,0.75)', align: 'center' }); }); }
  });
}
// cord (джгут) along a smooth path of points with radius r; p reveals along path
function cord(ctx, pts, r, { p = 1, color = C.foam } = {}) {
  if (pts.length < 2) return;
  const lens = [0]; for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1] * clamp(p); const sub = [pts[0]];
  for (let i = 1; i < pts.length; i++) { if (lens[i] <= total) sub.push(pts[i]); else { const k = (total - lens[i - 1]) / (lens[i] - lens[i - 1]); sub.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); break; } }
  save(ctx, () => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const stroke = (lw, style) => { ctx.beginPath(); sub.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.lineWidth = lw; ctx.strokeStyle = style; ctx.stroke(); };
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
    stroke(r * 2, C.foamDark); ctx.shadowColor = 'transparent';
    stroke(r * 1.75, color);
    stroke(r * 1.75, ctx.createPattern(foamTile({ cell: 6, seed: 31, size: 128 }), 'repeat'));
    ctx.translate(-r * 0.3, -r * 0.35); stroke(r * 0.5, 'rgba(255,255,255,0.55)');
  });
}

// ---------- brand ----------
// ---------- images: real MONOISOL logo + site photos ----------
const fs = require('fs');
const { Image, loadImage } = require('@napi-rs/canvas');
const ASSETS = path.join(__dirname, 'assets');
const _img = new Map();
// load an image by catalogue name ("pipe_ins_banner") or relative asset path ("logo_hd.png"); cached, synchronous
function img(name) {
  if (_img.has(name)) return _img.get(name);
  let file = path.join(ASSETS, name);
  if (!fs.existsSync(file)) {
    const dir = path.join(ASSETS, 'photos'); const hit = fs.readdirSync(dir).find(f => f.replace(/\.[^.]+$/, '') === name);
    if (!hit) throw new Error('no image ' + name); file = path.join(dir, hit);
  }
  const im = new Image(); im.src = fs.readFileSync(file); _img.set(name, im); return im;
}
// decode every asset up front (image decoding is async in Skia); call `await L.preload()` before drawing
async function preload() {
  const jobs = [['logo_hd.png', path.join(ASSETS, 'logo_hd.png')]];
  for (const f of fs.readdirSync(path.join(ASSETS, 'photos'))) jobs.push([f.replace(/\.[^.]+$/, ''), path.join(ASSETS, 'photos', f)]);
  for (const f of fs.existsSync(path.join(ASSETS, 'extra')) ? fs.readdirSync(path.join(ASSETS, 'extra')) : []) jobs.push([f.replace(/\.[^.]+$/, ''), path.join(ASSETS, 'extra', f)]);
  await Promise.all(jobs.map(async ([n, f]) => { if (fs.existsSync(f)) _img.set(n, await loadImage(fs.readFileSync(f))); }));
  return _img.size;
}
const _blur = new Map();
// cheap gaussian-ish blur: downscale then upscale (cached per image+amount)
function blurred(name, amount = 24) {
  const key = name + '|' + amount; if (_blur.has(key)) return _blur.get(key);
  const im = img(name), k = Math.max(2, amount / 3);
  const sw = Math.max(8, Math.round(im.width / k)), sh = Math.max(8, Math.round(im.height / k));
  const a = createCanvas(sw, sh), ax = a.getContext('2d'); ax.imageSmoothingQuality = 'high'; ax.drawImage(im, 0, 0, sw, sh);
  const b = createCanvas(Math.round(sw / 2), Math.round(sh / 2)), bx = b.getContext('2d'); bx.drawImage(a, 0, 0, b.width, b.height);
  const c = createCanvas(im.width, im.height), cx = c.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(b, 0, 0, im.width, im.height);
  _blur.set(key, c); return c;
}
// draw image covering rect (x,y,w,h) with zoom (>=1) and focus point (fx,fy in 0..1 of the source)
function drawCover(ctx, im, x, y, w, h, zoom = 1, fx = 0.5, fy = 0.5) {
  const s = Math.max(w / im.width, h / im.height) * zoom;
  const dw = im.width * s, dh = im.height * s;
  const dx = x + (w - dw) * clamp(fx), dy = y + (h - dh) * clamp(fy);
  ctx.drawImage(im, dx, dy, dw, dh);
}
// Framed photo card with Ken Burns.
// p: appear progress 0..1 (reveal), k: Ken Burns progress 0..1 (usually local time / scene dur)
// opts: r radius, zoom [from,to], focus [fx0,fy0,fx1,fy1], reveal 'rise'|'wipe'|'scale'|'fade', border, rot (radians), caption, shadow, out (0..1 exit)
function photo(ctx, name, x, y, w, h, p = 1, k = 0, { r = 22, zoom = [1.04, 1.16], focus = [0.5, 0.5, 0.5, 0.5], reveal = 'rise', border = 'rgba(255,255,255,0.9)', borderW = 5, rot = 0, caption = null, captionColor = C.white, shadow = true, out = 0, alpha = 1 } = {}) {
  const e = ease.outCubic(clamp(p)), o = ease.inCubic(clamp(out));
  const a = alpha * clamp(p * 1.6) * (1 - o);
  if (a <= 0.001) return;
  const im = img(name);
  const z = lerp(zoom[0], zoom[1], ease.inOutSine(clamp(k)));
  const fx = lerp(focus[0], focus[2], ease.inOutSine(clamp(k))), fy = lerp(focus[1], focus[3], ease.inOutSine(clamp(k)));
  let dy = 0, sc = 1, wipe = 1;
  if (reveal === 'rise') dy = (1 - e) * 80 + o * -60;
  else if (reveal === 'scale') sc = lerp(0.82, 1, ease.outBack(clamp(p))) * (1 - o * 0.1);
  else if (reveal === 'wipe') wipe = e;
  save(ctx, () => {
    ctx.globalAlpha *= a;
    ctx.translate(x + w / 2, y + h / 2 + dy); if (rot) ctx.rotate(rot * (1 - o)); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
    if (shadow) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24; roundRect(ctx, 0, 0, w, h, r); ctx.fillStyle = '#0B1A2E'; ctx.fill(); ctx.restore(); }
    ctx.save(); roundRect(ctx, 0, 0, w, h, r); ctx.clip();
    if (wipe < 1) { ctx.beginPath(); ctx.rect(0, 0, w * wipe, h); ctx.clip(); }
    drawCover(ctx, im, 0, 0, w, h, z, fx, fy);
    // subtle top sheen
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.restore();
    if (border && borderW) { roundRect(ctx, 0, 0, w, h, r); ctx.lineWidth = borderW; ctx.strokeStyle = border; ctx.stroke(); }
    if (caption) {
      const cp = clamp((p - 0.4) / 0.6);
      const tw = measure(ctx, caption, 'bodyBold', 28) + 40;
      at(ctx, { x: 24, y: h - 30, alpha: cp }, () => { roundRect(ctx, 0, -26, tw, 52, 26); ctx.fillStyle = 'rgba(7,22,41,0.82)'; ctx.fill(); ctx.strokeStyle = rgba(C.brandHi, 0.8); ctx.lineWidth = 2; ctx.stroke(); text(ctx, caption, 20, 0, { role: 'bodyBold', size: 28, color: captionColor, baseline: 'middle' }); });
    }
  });
}
// full-frame photo background: blurred + darkened, slow drift. dim 0..1, tint colour optional
function photoBg(ctx, name, t, { blur = 18, dim = 0.6, tint = C.navy, zoom = 1.12, drift = 0.02, alpha = 1, sharp = false } = {}) {
  if (alpha <= 0.001) return;
  save(ctx, () => {
    ctx.globalAlpha *= alpha;
    const src = sharp ? img(name) : blurred(name, blur);
    const z = zoom + Math.sin(t * 0.07) * drift;
    drawCover(ctx, src, 0, 0, W, H, z, 0.5 + Math.sin(t * 0.05) * 0.1, 0.5);
    ctx.fillStyle = rgba(tint, dim); ctx.fillRect(0, 0, W, H);
  });
}
// Official MONOISOL logo (vectorised edges, see tools/vectorize_logo.py). cx,cy = centre, width in px.
// p: 0..1 reveal (scale-in + fade), shine: 0..1 position of a light sweep across the logo (or null)
const _logoBuf = { w: 0, c: null, x: null };
function brandLogo(ctx, cx, cy, width, p = 1, { shine = null, alpha = 1, glowAmt = 0.6 } = {}) {
  if (p <= 0.001 || alpha <= 0.001) return;
  const im = img('logo_hd.png'), h = width * im.height / im.width;
  const e = ease.outBack(clamp(p)), a = clamp(p * 1.8) * alpha;
  save(ctx, () => {
    ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.scale(lerp(0.86, 1, e), lerp(0.86, 1, e));
    if (glowAmt > 0) glow(ctx, 0, 0, width * 0.62, C.brand, 0.16 * glowAmt);
    if (shine == null || shine <= 0 || shine >= 1) { ctx.drawImage(im, -width / 2, -h / 2, width, h); return; }
    // logo + light sweep composited offscreen so the sweep only touches logo pixels
    const bw = Math.ceil(width), bh = Math.ceil(h);
    if (_logoBuf.w !== bw) { _logoBuf.w = bw; _logoBuf.c = createCanvas(bw, bh); _logoBuf.x = _logoBuf.c.getContext('2d'); }
    const bx = _logoBuf.x; bx.globalCompositeOperation = 'source-over'; bx.clearRect(0, 0, bw, bh); bx.drawImage(im, 0, 0, bw, bh);
    bx.globalCompositeOperation = 'source-atop';
    const sx = lerp(-bw * 0.3, bw * 1.3, shine), g = bx.createLinearGradient(sx - bw * 0.12, 0, sx + bw * 0.12, bh * 0.3);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    bx.fillStyle = g; bx.fillRect(0, 0, bw, bh); bx.globalCompositeOperation = 'source-over';
    ctx.drawImage(_logoBuf.c, -width / 2, -h / 2, width, h);
  });
}
// legacy name used by older scene drafts: logo(ctx, x, y, size, p) -> official logo, size≈100 => 520px wide
function logo(ctx, x, y, size, p = 1, opts = {}) { brandLogo(ctx, x, y, size * 5.2, p, opts); }

// Ukrainian flag ribbon accent
function uaRibbon(ctx, x, y, w, h, p = 1) {
  const e = ease.outCubic(clamp(p));
  save(ctx, () => { ctx.fillStyle = C.uaBlue; roundRect(ctx, x, y, w * e, h / 2, 2); ctx.fill(); ctx.fillStyle = C.uaYellow; roundRect(ctx, x, y + h / 2, w * e, h / 2, 2); ctx.fill(); });
}

module.exports = {
  W, H, FPS, C, FONTS, font,
  clamp, lerp, invLerp, remap, prog, ease, ep, envelope, rng, noise1,
  rgba, mixColor, hexToRgb,
  roundRect, save, at, glow, offscreen, Path2D,
  background, vignette, dotGrid, snow, embers, bokeh,
  setFont, measure, text, wrap, revealText, typeText,
  panel, pill, headline, stat, checklist, underline, drawIcon,
  foamTile, foamFill, foamMacro,
  cylinder, insulatedPipe, pipeSection, heatWaves, house, roll, corrugated, isoBox, cord,
  logo, brandLogo, uaRibbon, img, preload, blurred, drawCover, photo, photoBg,
};
