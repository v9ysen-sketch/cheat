'use strict';
// Scene 5 — «Серія HD, пожежостійка HD V2 і ламінована ізоляція» (≈26.6 s, global 69.77–96.40)
// Beats (local s, synced to env.cues):
//   A  0.67  HD premium: card hd_tubes_1 + stamped «HD» badge, «Серія HD»; 2.67 wall section «Стінка 13 мм»;
//            4.71 1 m³ cube fills + counter «25–30 кг/м³»; 9.29 «зносостійка поверхня» (hd_print strip + sanding block)
//   B 11.33  thin amber-red line wipe → HD V2 fire-resistant: pipe_ins_print card + line-icon self-extinguish diagram
//   C 16.70  background lightens → laminated collage (lam_red_blue + lam_pipes_2024), colour chips, hot/cold mini plan
//   D 22.43  moisture / wear / UV feature icons (+ effects over the collage); 26.2 second window lights in the house icon
// Top-right corner (x>1500, y<150) is kept free for the global logo; nothing but background below y≈905.

const DEF = [0.667, 11.333, 16.7, 22.433];

// ---------------------------------------------------------------- helpers
// rounded-rect sub-path without beginPath (for even-odd clips)
function rrPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}
function card(ctx, L, name, x, y, w, h, o = {}) {
  const { alpha = 1, zoom = 1.08, fx = 0.5, fy = 0.5, r = 18, rot = 0, scale = 1, clipW = 1,
    border = 'rgba(255,255,255,0.86)', bw = 4, shadow = true, after = null } = o;
  if (alpha <= 0.002 || clipW <= 0.001) return;
  const im = L.img(name);
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha;
    ctx.translate(x + w / 2, y + h / 2); if (rot) ctx.rotate(rot); if (scale !== 1) ctx.scale(scale, scale); ctx.translate(-w / 2, -h / 2);
    if (clipW < 1) { ctx.beginPath(); ctx.rect(-90, -90, w * clipW + 90, h + 180); ctx.clip(); }
    if (shadow) { // shadow only outside the card (no dark underlay showing through while the card fades)
      ctx.save(); ctx.beginPath(); ctx.rect(-400, -400, w + 800, h + 800); rrPath(ctx, 0, 0, w, h, r); ctx.clip('evenodd');
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 46; ctx.shadowOffsetY = 22; L.roundRect(ctx, 0, 0, w, h, r); ctx.fillStyle = '#0F141A'; ctx.fill(); ctx.restore();
    }
    ctx.save(); L.roundRect(ctx, 0, 0, w, h, r); ctx.clip();
    L.drawCover(ctx, im, 0, 0, w, h, zoom, fx, fy);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (after) after(w, h);
    ctx.restore();
    if (border && bw) { L.roundRect(ctx, 0, 0, w, h, r); ctx.lineWidth = bw; ctx.strokeStyle = border; ctx.stroke(); }
  });
}

// value + unit stat, left aligned at x (baseline y); rises in with p
function stat(ctx, L, x, y, p, value, unit, size, unitColor) {
  if (p <= 0.001) return 0;
  const e = L.ease.outCubic(L.clamp(p)), a = L.clamp(p * 1.6), dy = (1 - e) * 34;
  const vw = L.text(ctx, value, x, y + dy, { role: 'display', size, color: L.C.white, alpha: a });
  if (unit) L.text(ctx, unit, x + vw + 14, y + dy, { role: 'displaySemi', size: size * 0.42, color: unitColor, alpha: a });
  return vw;
}

// label pill with an animated check (p appear, pc check draw)
function labelPill(ctx, L, str, x, y, p, pc, { size = 34, icon = 'check', iconColor = null } = {}) {
  if (p <= 0.001) return 0;
  const { C } = L;
  const e = L.ease.outCubic(L.clamp(p)), a = L.clamp(p * 1.5);
  const tw = L.measure(ctx, str, 'bodyBold', size), ph = size * 1.9, ir = ph * 0.34, pw = 22 + ir * 2 + 16 + tw + 30;
  L.at(ctx, { x: x + (1 - e) * -26, y, alpha: a }, () => {
    L.roundRect(ctx, 0, -ph / 2, pw, ph, ph / 2); ctx.fillStyle = L.rgba(C.brand, 0.2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = L.rgba(C.brandHi, 0.65); ctx.stroke();
    ctx.beginPath(); ctx.arc(22 + ir, 0, ir, 0, Math.PI * 2); ctx.fillStyle = L.rgba(C.brandHi, 0.2); ctx.fill();
    L.drawIcon(ctx, icon, 22 + ir, 0, ir * 1.25, iconColor || C.brandHi, icon === 'check' ? L.clamp(pc) : L.clamp(pc * 2), icon === 'check' ? undefined : 3.2);
    L.text(ctx, str, 22 + ir * 2 + 16, 0, { role: 'bodyBold', size, color: C.white, baseline: 'middle' });
  });
  return pw;
}

function accentBar(ctx, L, x, y, p, c1, c2) {
  if (p <= 0.001) return;
  const w = 64 * L.ease.outCubic(L.clamp(p));
  const g = ctx.createLinearGradient(x, 0, x + 64, 0); g.addColorStop(0, c1); g.addColorStop(1, c2);
  L.save(ctx, () => { ctx.globalAlpha *= L.clamp(p * 2); ctx.fillStyle = g; L.roundRect(ctx, x, y, w, 4, 2); ctx.fill(); });
}

// ---------------------------------------------------------------- background (graphite, lightens for beat C)
function background(ctx, L, t, lk) {
  const { W, H, C } = L;
  const g = ctx.createLinearGradient(0, 0, W * 0.7, H * 1.25);
  g.addColorStop(0, L.mixColor('#10151B', '#222D3A', lk));
  g.addColorStop(0.55, L.mixColor('#1E2630', '#33404F', lk));
  g.addColorStop(1, L.mixColor('#28323D', '#465568', lk));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // drifting light: warm amber (premium) + brand green + cool lift when lighter
  L.glow(ctx, W * (0.30 + 0.08 * Math.sin(t * 0.11)), H * (0.32 + 0.06 * Math.cos(t * 0.09)), 760, C.amber, 0.055 * (1 - 0.5 * lk));
  L.glow(ctx, W * (0.78 + 0.05 * Math.cos(t * 0.08)), H * (0.70 + 0.05 * Math.sin(t * 0.1)), 820, C.brand, 0.07);
  if (lk > 0) L.glow(ctx, W * 0.62, H * 0.45, 980, '#DCE8F6', 0.07 * lk);
  // thin brand-green diagonal hairlines with a travelling light pulse
  L.save(ctx, () => {
    const sl = 420;
    for (let i = 0; i < 6; i++) {
      const x0 = -300 + i * 470 + ((t * 7) % 470);
      ctx.strokeStyle = L.rgba(C.brandHi, 0.055 + 0.02 * (i % 2)); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x0, H + 20); ctx.lineTo(x0 + sl, -20); ctx.stroke();
      if (i % 2 === 0) { // light pulse moving up the line
        const q = ((t * 0.09 + i * 0.37) % 1), px = x0 + sl * q, py = H + 20 - (H + 40) * q;
        const pg = ctx.createLinearGradient(px - sl * 0.12, py + (H + 40) * 0.12, px, py);
        pg.addColorStop(0, L.rgba(C.brandHi, 0)); pg.addColorStop(1, L.rgba(C.brandHi, 0.28));
        ctx.strokeStyle = pg; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(px - sl * 0.12, py + (H + 40) * 0.12); ctx.lineTo(px, py); ctx.stroke();
      }
    }
  });
  // sparse warm dust
  const r = L.rng(55);
  for (let i = 0; i < 26; i++) {
    const x0 = r() * W, y0 = r() * H, v = 6 + r() * 14, ph = r() * 6.28, s = 1 + r() * 2.2;
    const y = ((y0 - t * v) % H + H) % H, x = x0 + Math.sin(t * 0.3 + ph) * 22;
    ctx.fillStyle = L.rgba(i % 3 ? C.warmLight : C.brandHi, (0.10 + 0.12 * (0.5 + 0.5 * Math.sin(t * 1.1 + ph))));
    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  }
  L.vignette(ctx, 0.5 - 0.15 * lk);
}

// ---------------------------------------------------------------- beat A pieces
function hdBadge(ctx, L, cx, cy, t, tI, sheen) {
  const { C, ease, clamp, lerp } = L;
  const q = clamp((t - (tI - 0.32)) / 0.32); if (q <= 0) return;
  const after = t - tI;
  let sc = lerp(1.9, 1, ease.inCubic(q)), a = clamp(q * 1.8);
  if (after > 0) sc *= 1 - 0.06 * Math.exp(-after * 9) * Math.cos(after * 26);
  const rx = 104, ry = 60;
  // impact ring
  if (after > 0 && after < 0.6) {
    const k = after / 0.6;
    L.save(ctx, () => { ctx.translate(cx, cy); ctx.rotate(-0.06); ctx.beginPath(); ctx.ellipse(0, 0, rx * (1 + k * 0.55), ry * (1 + k * 0.55), 0, 0, Math.PI * 2); ctx.lineWidth = 4 * (1 - k) + 1; ctx.strokeStyle = L.rgba(C.brandHi, 0.6 * (1 - k)); ctx.stroke(); });
  }
  L.at(ctx, { x: cx, y: cy, scale: sc, alpha: a, rot: lerp(-0.2, -0.06, ease.outCubic(q)) }, () => {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14 + (1 - q) * 30;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = '#161B21'; ctx.fill(); ctx.restore();
    const fg = ctx.createRadialGradient(-rx * 0.3, -ry * 0.5, 4, 0, 0, rx); fg.addColorStop(0, '#36404B'); fg.addColorStop(1, '#12171C');
    ctx.beginPath(); ctx.ellipse(0, 0, rx - 6, ry - 6, 0, 0, Math.PI * 2); ctx.fillStyle = fg; ctx.fill();
    // green metallic ring (logo echo) + silver inner ring
    const rg = ctx.createLinearGradient(-rx, -ry, rx, ry); rg.addColorStop(0, C.brandDark); rg.addColorStop(0.3, C.brandHi); rg.addColorStop(0.55, C.brand); rg.addColorStop(0.8, '#9BE8B8'); rg.addColorStop(1, C.brandDark);
    ctx.beginPath(); ctx.ellipse(0, 0, rx - 5, ry - 5, 0, 0, Math.PI * 2); ctx.lineWidth = 10; ctx.strokeStyle = rg; ctx.stroke();
    const sg = ctx.createLinearGradient(0, -ry, 0, ry); sg.addColorStop(0, '#FFFFFF'); sg.addColorStop(0.5, '#9AA0A7'); sg.addColorStop(1, '#E4E7EA');
    ctx.beginPath(); ctx.ellipse(0, 0, rx - 14, ry - 14, 0, 0, Math.PI * 2); ctx.lineWidth = 2.5; ctx.strokeStyle = sg; ctx.stroke();
    // embossed HD
    L.setFont(ctx, 'display', 58); const tw = ctx.measureText('HD').width;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText('HD', -tw / 2 + 2, 4);
    const tg = ctx.createLinearGradient(0, -26, 0, 26); tg.addColorStop(0, '#FFFFFF'); tg.addColorStop(0.48, '#C9CDD2'); tg.addColorStop(0.52, '#8E949B'); tg.addColorStop(1, '#E9ECEF');
    ctx.fillStyle = tg; ctx.fillText('HD', -tw / 2, 2);
    // metallic light sweep
    if (sheen > 0 && sheen < 1) {
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
      const sx = lerp(-rx * 1.6, rx * 1.6, sheen);
      const shg = ctx.createLinearGradient(sx - 40, -ry, sx + 40, ry); shg.addColorStop(0, 'rgba(255,255,255,0)'); shg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); shg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = shg; ctx.fillRect(-rx, -ry, rx * 2, ry * 2); ctx.restore();
    }
  });
}

function hdSection(ctx, L, cx, cy, R, r, p) {
  if (p <= 0.001) return;
  const e = L.ease.outBack(L.clamp(p)), a = L.clamp(p * 2);
  L.at(ctx, { x: cx, y: cy, scale: L.lerp(0.55, 1, e), alpha: a, rot: (1 - L.ease.outCubic(L.clamp(p))) * -0.6 }, () => {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = '#3A424C'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.arc(0, 0, r, 0, Math.PI * 2, true);
    L.foamFill(ctx, { cell: 8, color: '#4C5560', shade: '#20262D', seed: 17, size: 192 });
    ctx.fillStyle = 'rgba(28,33,40,0.5)'; ctx.fill();
    const g = ctx.createRadialGradient(-R * 0.35, -R * 0.45, R * 0.1, 0, 0, R * 1.05);
    g.addColorStop(0, 'rgba(255,255,255,0.24)'); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    const hg = ctx.createRadialGradient(0, r * 0.35, r * 0.1, 0, 0, r); hg.addColorStop(0, '#1B2129'); hg.addColorStop(1, '#06080B');
    ctx.fillStyle = hg; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(0, 0, R - 1, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(0, 0, r + 1, 0, Math.PI * 2); ctx.stroke();
  });
}

// dimension arrow across the wall at angle ang (radial), with edge marks
function wallDim(ctx, L, cx, cy, r, R, ang, p) {
  if (p <= 0.001) return;
  const { C, ease, clamp } = L;
  const k = ease.inOutCubic(clamp(p)), ca = Math.cos(ang), sa = Math.sin(ang);
  const m = (r + R) / 2, half = (R - r) / 2 * k;
  const A = [cx + ca * (m - half), cy + sa * (m - half)], B = [cx + ca * (m + half), cy + sa * (m + half)];
  L.save(ctx, () => {
    ctx.strokeStyle = C.amber; ctx.fillStyle = C.amber; ctx.lineCap = 'round'; ctx.lineWidth = 4.5;
    ctx.shadowColor = L.rgba(C.amber, 0.8); ctx.shadowBlur = 12;
    // edge arcs
    const da = 0.32 * k;
    ctx.beginPath(); ctx.arc(cx, cy, r, ang - da, ang + da); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R, ang - da * 0.62, ang + da * 0.62); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    if (k > 0.6) {
      const hk = clamp((k - 0.6) / 0.4), hs = 17 * hk, nx = -sa, ny = ca;
      for (const [P, dir] of [[A, 1], [B, -1]]) {
        ctx.beginPath(); ctx.moveTo(P[0], P[1]);
        ctx.lineTo(P[0] + ca * hs * dir + nx * hs * 0.55, P[1] + sa * hs * dir + ny * hs * 0.55);
        ctx.lineTo(P[0] + ca * hs * dir - nx * hs * 0.55, P[1] + sa * hs * dir - ny * hs * 0.55); ctx.closePath(); ctx.fill();
      }
    }
  });
}

// isometric 1x1x1 cube that fills with dark HD foam
function densityCube(ctx, L, ox, oy, a, pe, lv, alpha) {
  if (pe <= 0.001 || alpha <= 0.001) return;
  const { clamp, ease } = L, c30 = Math.cos(Math.PI / 6);
  const P = (u, v, z) => [ox + (u - v) * c30 * a, oy - (u + v) * 0.5 * a - z * a];
  const poly = (pts) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); };
  const k = ease.outCubic(clamp(pe));
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha * clamp(pe * 2);
    // floor shadow
    L.save(ctx, () => { ctx.translate(ox, oy + 6); ctx.scale(1, 0.5); L.glow(ctx, 0, 0, a * 1.4, '#000000', 0.45); });
    // hidden back edges
    ctx.setLineDash([6, 8]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(220,228,238,0.22)';
    const Bk = P(1, 1, 0);
    for (const q of [P(1, 0, 0), P(0, 1, 0), P(1, 1, 1)]) { ctx.beginPath(); ctx.moveTo(Bk[0], Bk[1]); ctx.lineTo(L.lerp(Bk[0], q[0], k), L.lerp(Bk[1], q[1], k)); ctx.stroke(); }
    ctx.setLineDash([]);
    // fill (foam prism up to level lv)
    if (lv > 0.002) {
      const z = lv;
      const pat = ctx.createPattern(L.foamTile({ cell: 7, color: '#4C5560', shade: '#20262D', seed: 23, size: 160 }), 'repeat');
      const faces = [
        [[P(0, 0, 0), P(1, 0, 0), P(1, 0, z), P(0, 0, z)], 'rgba(20,24,30,0.25)'],
        [[P(0, 0, 0), P(0, 1, 0), P(0, 1, z), P(0, 0, z)], 'rgba(10,12,16,0.5)'],
        [[P(0, 0, z), P(1, 0, z), P(1, 1, z), P(0, 1, z)], 'rgba(255,255,255,0.12)'],
      ];
      for (const [pts, sh] of faces) { poly(pts); ctx.fillStyle = pat; ctx.fill(); ctx.fillStyle = sh; ctx.fill(); }
      // bright rim on the fill surface
      ctx.strokeStyle = 'rgba(255,214,150,0.55)'; ctx.lineWidth = 2;
      poly([P(0, 0, z), P(1, 0, z), P(1, 1, z), P(0, 1, z)]); ctx.stroke();
    }
    // glass faces
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    poly([P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)]); ctx.fill();
    poly([P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)]); ctx.fill();
    poly([P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)]); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    // visible edges (draw-on)
    ctx.lineCap = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(232,238,246,0.8)';
    const E = [[P(0, 0, 0), P(1, 0, 0)], [P(0, 0, 0), P(0, 1, 0)], [P(0, 0, 0), P(0, 0, 1)], [P(1, 0, 0), P(1, 0, 1)], [P(0, 1, 0), P(0, 1, 1)],
      [P(0, 0, 1), P(1, 0, 1)], [P(0, 0, 1), P(0, 1, 1)], [P(1, 0, 1), P(1, 1, 1)], [P(0, 1, 1), P(1, 1, 1)]];
    E.forEach(([s, e], i) => {
      const kk = clamp(pe * 1.6 - i * 0.07); if (kk <= 0) return;
      ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(L.lerp(s[0], e[0], kk), L.lerp(s[1], e[1], kk)); ctx.stroke();
    });
  });
}

function sandBlock(ctx, L, x, y, w, h, alpha) {
  if (alpha <= 0.001) return;
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    L.roundRect(ctx, x - w / 2, y - h, w, h * 0.72, 12);
    const g = ctx.createLinearGradient(0, y - h, 0, y - h * 0.28); g.addColorStop(0, '#E9B877'); g.addColorStop(1, '#9E6B3A');
    ctx.fillStyle = g; ctx.fill(); ctx.restore();
    // grip groove
    ctx.fillStyle = 'rgba(80,50,20,0.35)'; L.roundRect(ctx, x - w * 0.34, y - h * 0.8, w * 0.68, 5, 2.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,210,0.45)'; L.roundRect(ctx, x - w / 2 + 8, y - h + 4, w - 16, 3, 1.5); ctx.fill();
    // abrasive pad
    L.roundRect(ctx, x - w / 2 + 3, y - h * 0.3, w - 6, h * 0.3, 4); ctx.fillStyle = '#3B4048'; ctx.fill();
    const r = L.rng(91); ctx.fillStyle = 'rgba(210,214,220,0.55)';
    for (let i = 0; i < 46; i++) { ctx.fillRect(x - w / 2 + 6 + r() * (w - 12), y - h * 0.28 + r() * h * 0.26, 1.6, 1.6); }
  });
}

// ---------------------------------------------------------------- beat B pieces
const FLAME = (ctx) => { ctx.beginPath(); ctx.moveTo(0, 44); ctx.bezierCurveTo(-34, 40, -38, 8, -22, -10); ctx.bezierCurveTo(-14, 6, -6, 6, -4, -2); ctx.bezierCurveTo(-8, -24, 4, -40, 10, -46); ctx.bezierCurveTo(10, -24, 36, -14, 34, 14); ctx.bezierCurveTo(34, 34, 18, 44, 0, 44); };
// outline flame whose base sits at (x, y); s = height factor (1 => ~90 px)
function lineFlame(ctx, L, x, y, s, t, alpha, seed) {
  if (s <= 0.01 || alpha <= 0.001) return;
  const { C } = L;
  const fl = 1 + 0.07 * L.noise1(t * 9, seed) , sw = 1 + 0.05 * L.noise1(t * 7, seed + 3);
  L.save(ctx, () => {
    ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(s * sw, s * fl); ctx.translate(0, -44);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.shadowColor = L.rgba(C.orange, 0.9); ctx.shadowBlur = 18;
    FLAME(ctx); ctx.lineWidth = 6.5 / Math.max(0.3, s); ctx.strokeStyle = C.orange; ctx.stroke();
    ctx.translate(2, 18); ctx.scale(0.5, 0.55); FLAME(ctx); ctx.lineWidth = 9 / Math.max(0.3, s); ctx.strokeStyle = C.amber; ctx.stroke();
  });
}

// ---------------------------------------------------------------- beat C/D pieces
function chip(ctx, L, x, y, r, col, p) {
  if (p <= 0.001) return;
  const e = L.ease.outBack(L.clamp(p));
  L.at(ctx, { x, y, scale: e, alpha: L.clamp(p * 2) }, () => {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.restore();
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, 1, 0, 0, r); g.addColorStop(0, 'rgba(255,255,255,0.45)'); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
  });
}

function steamIcon(ctx, x, y, s, color, t) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) { const yy = s * 0.42 - k * s * 0.07, xx = i * s * 0.26 + Math.sin(k * 0.8 + t * 4 + i) * s * 0.07; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
  }
  ctx.restore();
}

// horizontal laminated pipe line drawn left→right; returns end x
function planPipe(ctx, L, x0, x1, y, k, col, hi, t, stubs, stubDir) {
  if (k <= 0.001) return;
  const xe = L.lerp(x0, x1, L.ease.inOutCubic(L.clamp(k)));
  L.save(ctx, () => {
    ctx.lineCap = 'round';
    // branch stubs to outlets appear once the line passed
    for (const sx of stubs) {
      const sk = L.clamp((xe - sx) / 60); if (sk <= 0) continue;
      const ye = y + stubDir * 38 * L.ease.outCubic(sk);
      ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, ye); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, ye, 9 * sk, 0, Math.PI * 2); ctx.fillStyle = '#F2F5F8'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    }
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
    ctx.strokeStyle = col; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xe, y); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = hi; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y - 4); ctx.lineTo(xe, y - 4); ctx.stroke();
    // flow
    ctx.setLineDash([16, 46]); ctx.lineDashOffset = -t * 70; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, y + 2); ctx.lineTo(xe, y + 2); ctx.stroke();
  });
}

function iconCircle(ctx, L, x, y, r, p, col = null) {
  const e = L.ease.outBack(L.clamp(p));
  ctx.save(); ctx.translate(x, y); ctx.scale(e, e);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = L.rgba(col || L.C.brand, 0.2); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = L.rgba(col || L.C.brandHi, 0.7); ctx.stroke();
  ctx.restore();
}
const DROP = (ctx, s) => { ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s * 0.3, -s * 0.5, s * 0.72, -s * 0.05, s * 0.72, s * 0.32); ctx.arc(0, s * 0.32, s * 0.72, 0, Math.PI); ctx.bezierCurveTo(-s * 0.72, -s * 0.05, -s * 0.3, -s * 0.5, 0, -s); ctx.closePath(); };

function featureIcon(ctx, L, kind, x, y, t, p) {
  const { C, clamp } = L;
  if (p <= 0.001) return;
  L.save(ctx, () => {
    // icon art is authored in a ±30 box; drawn 1.22× inside the 48 px badge so it reads at TV distance
    ctx.translate(x, y); ctx.scale(1.22, 1.22); ctx.globalAlpha *= clamp(p * 1.6);
    ctx.beginPath(); ctx.arc(0, 0, 37.5, 0, Math.PI * 2); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'water') {
      // slanted surface; drops bead, slide down and drip off the edge
      const x0 = -26, y0 = -8, x1 = 18, y1 = 12;
      ctx.strokeStyle = '#E6ECF3'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const nx = 0.41, ny = -0.91; // surface normal (up)
      for (let i = 0; i < 2; i++) {
        const s = ((t * 0.62 + i * 0.5) % 1);
        let dx, dy, a = 1;
        if (s < 0.62) { const f = L.ease.inQuad(s / 0.62); dx = L.lerp(x0 + 6, x1, f) + nx * 9; dy = L.lerp(y0 + 2.7, y1, f) + ny * 9; if (s < 0.15) a = s / 0.15; }
        else { const f = (s - 0.62) / 0.38; dx = x1 + nx * 9 + f * 4; dy = y1 + ny * 9 + f * f * 34; a = 1 - f * f; }
        ctx.save(); ctx.translate(dx, dy); ctx.globalAlpha *= a; DROP(ctx, 8); ctx.fillStyle = '#A9D9F6'; ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(-2.5, 0, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    } else if (kind === 'wear') {
      ctx.strokeStyle = '#E6ECF3'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-24, 16); ctx.lineTo(24, 16); ctx.stroke();
      const s = (t * 0.8) % 1, xx = L.lerp(-26, 26, L.ease.inOutSine(clamp(s / 0.7)));
      const a = s < 0.7 ? Math.sin(Math.PI * clamp(s / 0.7)) : 0;
      // swipe streak
      const g = ctx.createLinearGradient(xx - 30, 0, xx, 0); g.addColorStop(0, L.rgba(C.brandHi, 0)); g.addColorStop(1, L.rgba(C.brandHi, 0.95 * a));
      ctx.strokeStyle = g; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(xx - 30, 2); ctx.quadraticCurveTo(xx - 12, -4, xx, 4); ctx.stroke();
      // the little block pressing on the surface
      ctx.globalAlpha *= 0.35 + 0.65 * a; ctx.fillStyle = '#E9B877'; L.roundRect(ctx, xx - 9, -4, 18, 14, 4); ctx.fill();
    } else if (kind === 'uv') {
      ctx.strokeStyle = '#E6ECF3'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-26, 20); ctx.lineTo(26, 20); ctx.stroke();
      // sun
      ctx.strokeStyle = C.amber; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.arc(-15, -14, 8, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.4; ctx.beginPath(); ctx.moveTo(-15 + Math.cos(a) * 12, -14 + Math.sin(a) * 12); ctx.lineTo(-15 + Math.cos(a) * 16, -14 + Math.sin(a) * 16); ctx.stroke(); }
      // ray hits the surface and bounces back
      const pts = [[-6, -4], [4, 18], [16, -6]], s = (t * 0.9) % 1;
      ctx.setLineDash([5, 6]); ctx.lineDashOffset = -t * 30; ctx.strokeStyle = L.rgba(C.amber, 0.7); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.stroke(); ctx.setLineDash([]);
      const seg = s < 0.5 ? 0 : 1, f = (s % 0.5) / 0.5, A = pts[seg], B = pts[seg + 1];
      L.glow(ctx, L.lerp(A[0], B[0], f), L.lerp(A[1], B[1], f), 9, C.amber, 0.9);
      ctx.fillStyle = C.warmLight; ctx.beginPath(); ctx.arc(L.lerp(A[0], B[0], f), L.lerp(A[1], B[1], f), 2.6, 0, Math.PI * 2); ctx.fill();
    }
  });
}

// running motif (shared with scenes 4–8, see _motif.js): window 1 lit since scene 4, window 2 lights here
const MOTIF = require('./_motif');
function houseIcon(ctx, L, x, y, alpha, lit2) {
  MOTIF.houseEmblem(ctx, L, MOTIF.EMB.x, MOTIF.EMB.y, MOTIF.EMB.s, [1, lit2, 0, 0, 0], alpha);
}

// ---------------------------------------------------------------- scene
module.exports = {
  draw(ctx, t, d, L, env) {
    const { C, W, H, clamp, lerp, prog, ep, ease } = L;
    const cs = (env && env.cues && env.cues.length >= 4) ? env.cues.map(c => c.start) : DEF;
    const [c0, c1, c2, c3] = cs;

    // beat clocks
    const tStamp = c0 + 1.2;                  // «HD» badge impact (on "серія HD")
    const tHeadUp = c0 + 1.33;                // headline glides from centre to the top
    // tRecede: density stats stay until «…кубічний метр» (~9.0) is nearly spoken, and are gone before the hd_print strip wipes in
    const tWall = c0 + 1.63, tDens = c0 + 3.72, tRecede = c0 + 7.65, tWear = c0 + 8.36;
    const wipeA = c1 - 0.5, wipeD = 0.85;     // amber-red line wipe A → B (10.83–11.68; calm speed)
    const tB = c1;
    const tC = c2, tD = c3;
    const lk = ep(t, tC - 0.5, 1.1, 'inOutSine');

    background(ctx, L, t, lk);

    // camera shake on badge impact (small, decaying)
    const ai = t - tStamp;
    const shk = ai > 0 && ai < 0.5 ? 5 * Math.exp(-ai * 10) : 0;
    const shx = shk * Math.sin(ai * 61), shy = shk * Math.cos(ai * 47);

    const wq = clamp((t - wipeA) / wipeD), we = ease.inOutCubic(wq), slant = 140;
    const lx = lerp(-slant - 60, W + 60, we); // x at bottom edge; top edge at lx + slant

    // ================================================================ BEAT A — HD
    if (wq < 1) L.save(ctx, () => {
      if (wq > 0) { ctx.beginPath(); ctx.moveTo(lx + slant, -10); ctx.lineTo(W + 10, -10); ctx.lineTo(W + 10, H + 10); ctx.lineTo(lx, H + 10); ctx.closePath(); ctx.clip(); }
      ctx.translate(shx, shy);
      // photo card (vertical), slow camera tilt down
      const pc = ep(t, -0.3, 1.0), kb = clamp((t + 0.4) / 11.5);
      card(ctx, L, 'hd_tubes_1', 96, 160 + (1 - pc) * 70, 620, 715, {
        alpha: clamp(pc * 1.6), zoom: lerp(1.14, 1.2, kb), fx: 0.5, fy: lerp(0.12, 0.88, ease.inOutSine(kb)),
      });
      // stamped badge
      hdBadge(ctx, L, 588, 268, t, tStamp, clamp((t - tStamp - 0.35) / 0.8));

      // headline (right 60 %)
      const hu = 270 * (1 - ease.inOutCubic(prog(t, tHeadUp, 0.6)));
      L.headline(ctx, 816, 200 + hu, prog(t, c0 - 0.3, 1.3), { kicker: 'Преміум-сегмент', title: 'Серія HD', titleSize: 104, maxWidth: 1000, highlight: ['HD'] });

      // --- wall section + density cube (recede before the wear beat)
      const rc = ease.inOutCubic(prog(t, tRecede, 0.5));
      if (rc < 1) L.at(ctx, { x: 0, y: -rc * 40, alpha: 1 - rc }, () => {
        const sx = 1000, sy = 560, R = 152, r = 88;
        hdSection(ctx, L, sx, sy, R, r, prog(t, tWall, 0.9));
        wallDim(ctx, L, sx, sy, r, R, -0.72, prog(t, tWall + 0.45, 0.6));
        // stat 1: «Стінка 13 мм»
        const s1 = prog(t, tWall + 0.1, 0.8), w1 = 116 + 14 + 70, x1 = sx - w1 / 2;
        L.text(ctx, 'Стінка', x1, 792 + (1 - ease.outCubic(s1)) * 24, { role: 'body', size: 30, color: C.grey, alpha: clamp(s1 * 1.6) });
        stat(ctx, L, x1, 872, s1, '13', 'мм', 84, C.amber);

        // cube 1 m³ + counter
        const cx = 1545, cy = 728, a = 158;
        const pe = prog(t, tDens, 0.9), lv = ease.inOutSine(prog(t, tDens + 0.35, 2.7));
        densityCube(ctx, L, cx, cy, a, pe, lv, 1);
        const sp = prog(t, tDens + 0.05, 0.6);
        if (sp > 0) {
          // «25» counts up; «–30» then rises in as one piece (~0.35 s before «до тридцяти» ≈ 6.39) — no odd «25–25…25–29» ticks
          const n1 = Math.round(lerp(0, 25, ease.outCubic(prog(t, tDens + 0.1, 1.25))));
          const n2p = prog(t, tDens + 1.65, 0.55);
          const val = '25–30';
          const fw = L.measure(ctx, val, 'display', 84) + 14 + L.measure(ctx, 'кг/м³', 'displaySemi', 84 * 0.42);
          const x2 = cx - fw / 2;
          const up = prog(t, tDens + 2.1, 0.5);
          stat(ctx, L, x2, 872, sp, `${n1}`, null, 84, C.amber);
          if (n2p > 0) {
            const e2 = ease.outCubic(n2p);
            L.text(ctx, '–30', x2 + L.measure(ctx, '25', 'display', 84), 872 + (1 - e2) * 26, { role: 'display', size: 84, color: C.white, alpha: clamp(n2p * 1.6) });
          }
          if (up > 0) { const vw = L.measure(ctx, val, 'display', 84); L.text(ctx, 'кг/м³', x2 + vw + 14 + (1 - ease.outCubic(up)) * 16, 872, { role: 'displaySemi', size: 84 * 0.42, color: C.amber, alpha: up }); }
        }
      });

      // --- wear-resistant surface
      const ps = ep(t, tWear - 0.3, 0.9);
      if (ps > 0) {
        const sk = clamp((t - (tWear - 0.55)) / 2.9);
        card(ctx, L, 'hd_print', 816, 600, 1008, 275, {
          alpha: clamp(ps * 1.5), clipW: ps, zoom: 1.16, fx: lerp(0.0, 1.0, ease.inOutSine(sk)), fy: 0.2, r: 16,
        });
      }
      const pb = ep(t, tWear - 0.3, 0.6);
      if (pb > 0) {
        const sx0 = 846, sw = 420, sy = 522, sh = 34;
        L.save(ctx, () => {
          ctx.globalAlpha *= clamp(pb * 1.5);
          const yy = sy + (1 - pb) * 20;
          ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
          L.roundRect(ctx, sx0, yy, sw * ease.outCubic(pb), sh, 10); ctx.fillStyle = '#3E464F'; ctx.fill(); ctx.restore();
          L.roundRect(ctx, sx0, yy, sw * ease.outCubic(pb), sh, 10);
          L.foamFill(ctx, { cell: 6, color: '#4C5560', shade: '#20262D', seed: 29, size: 160 });
          ctx.fillStyle = 'rgba(28,33,40,0.3)'; ctx.fill();
          const hg = ctx.createLinearGradient(0, yy, 0, yy + sh); hg.addColorStop(0, 'rgba(255,255,255,0.22)'); hg.addColorStop(0.4, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(0,0,0,0.3)');
          ctx.fillStyle = hg; ctx.fill();
          ctx.strokeStyle = L.rgba(C.brandHi, 0.55); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx0 + 10, yy + 1); ctx.lineTo(sx0 + sw * ease.outCubic(pb) - 10, yy + 1); ctx.stroke();
          // sheen once the strokes are done: surface stays smooth
          const shq = prog(t, tWear + 1.45, 0.8);
          if (shq > 0 && shq < 1) {
            ctx.save(); L.roundRect(ctx, sx0, yy, sw, sh, 10); ctx.clip();
            const gx = lerp(sx0 - 80, sx0 + sw + 80, shq), sg = ctx.createLinearGradient(gx - 60, 0, gx + 60, 0);
            sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = sg; ctx.fillRect(sx0, yy, sw, sh); ctx.restore();
          }
        });
        // block strokes
        const bw = 132, bh = 58, x0 = sx0 + 20 + bw / 2, x1b = sx0 + sw - 20 - bw / 2;
        const st0 = tWear - 0.1, nStr = 3, sDur = 0.48;
        const blockX = (tt) => { const u = clamp((tt - st0) / (nStr * sDur)); const ph = u * nStr; return lerp(x0, x1b, 0.5 - 0.5 * Math.cos(Math.PI * ph)); };
        const bIn = ep(t, tWear - 0.25, 0.4), bOut = ep(t, st0 + nStr * sDur + 0.15, 0.4);
        const bx = blockX(t), lift = (1 - bIn) * -40 + bOut * -30;
        sandBlock(ctx, L, bx, sy + lift, bw, bh, clamp(bIn * 1.5) * (1 - bOut));
        // fine grey dust only (no sparks)
        for (let i = 0; i < 70; i++) {
          const te = st0 + i * (nStr * sDur) / 70, age = t - te;
          if (age < 0 || age > 0.9) continue;
          const v = blockX(te + 0.01) - blockX(te), dir = v >= 0 ? -1 : 1;
          const rr = L.rng(300 + i), jx = (rr() - 0.5) * 18, vx = dir * (10 + rr() * 70), vy = -10 - rr() * 40, gr = 140 + rr() * 160, sz = 1 + rr() * 2;
          const px = blockX(te) + dir * (bw / 2 - 6) + jx + vx * age, py = sy - 3 + vy * age + gr * age * age;
          ctx.fillStyle = L.rgba(i % 3 ? '#C9CED5' : '#9AA2AC', 0.75 * (1 - age / 0.9)); ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fill();
        }
      }
      // label + check
      labelPill(ctx, L, 'Зносостійка поверхня', 1312, 539, prog(t, tWear - 0.2, 0.6), prog(t, tWear + 0.2, 0.6), { size: 34 });
    });

    // ================================================================ BEAT B — HD V2 fire-resistant
    if (wq > 0 && t < tC + 0.6) L.save(ctx, () => {
      if (wq < 1) { ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(lx + slant, -10); ctx.lineTo(lx, H + 10); ctx.lineTo(-10, H + 10); ctx.closePath(); ctx.clip(); }
      // exit: gentle (the big bright photo leaves over 0.65 s, the rest over 0.5 s), all gone before «Ламінована…» at tC - 0.3
      const bo = ease.inOutSine(prog(t, tC - 0.8, 0.5)), boC = ease.inOutSine(prog(t, tC - 0.95, 0.65));
      // headline
      accentBar(ctx, L, 96, 252, prog(t, tB - 0.35, 0.6) * (1 - bo), C.amber, C.red);
      L.revealText(ctx, 'Пожежостійка серія HD V2', 96, 335, prog(t, tB - 0.3, 1.2), { role: 'display', size: 80, maxWidth: 840, highlight: ['HD', 'V2'], highlightColor: C.amber, out: bo });
      // photo card, Ken Burns along the printed marking (no punch-in)
      const pc = ep(t, tB - 0.15, 0.9), kb = clamp((t - tB + 0.4) / 5.8);
      card(ctx, L, 'pipe_ins_print', 1000 + boC * 50, 250 + (1 - pc) * 60, 824, 549, {
        alpha: clamp(pc * 1.6) * (1 - boC), scale: 1 - 0.03 * boC, zoom: lerp(1.14, 1.17, kb), fx: lerp(0.2, 0.8, ease.inOutSine(kb)), fy: 0.42,
      });
      // ---- line-icon diagram: source flame touches the tube, retracts, flame on tube dies out
      const da = clamp(prog(t, tB + 0.1, 0.5) * 1.5) * (1 - bo);
      if (da > 0) L.save(ctx, () => {
        ctx.globalAlpha *= da;
        const tx0 = 112, tx1 = 640, ty = 622, th = 46;
        const k = ease.inOutCubic(prog(t, tB + 0.1, 0.65));
        ctx.save(); ctx.beginPath(); ctx.rect(tx0 - 30, ty - 120, (tx1 - tx0 + 60) * k, 240); ctx.clip();
        ctx.strokeStyle = 'rgba(214,222,232,0.9)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.fillRect(tx0, ty - th, tx1 - tx0, th * 2);
        ctx.beginPath(); ctx.moveTo(tx0, ty - th); ctx.lineTo(tx1, ty - th); ctx.moveTo(tx0, ty + th); ctx.lineTo(tx1, ty + th); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(tx0, ty, 13, th, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(tx1, ty, 13, th, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(tx1, ty, 6.5, th * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        // source (lighter) approaches from below, touches, then retracts
        const fxp = 350;
        // retracts down and fades out completely before the «Згасає…» pill (below it) starts to appear
        const appr = ease.outCubic(prog(t, tB + 0.55, 0.45)), retr = ease.inOutCubic(prog(t, tB + 1.95, 0.5));
        const sOff = (1 - appr) * 140 + retr * 70, sA = clamp(appr * 1.6) * (1 - clamp(retr * 1.5));
        if (sA > 0) L.save(ctx, () => {
          ctx.globalAlpha *= sA; const by = ty + th + 74 + sOff;
          ctx.strokeStyle = 'rgba(214,222,232,0.9)'; ctx.lineWidth = 3.5;
          L.roundRect(ctx, fxp - 20, by, 40, 70, 8); ctx.stroke();
          L.roundRect(ctx, fxp - 12, by - 12, 24, 12, 3); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(fxp - 20, by + 24); ctx.lineTo(fxp + 20, by + 24); ctx.stroke();
          lineFlame(ctx, L, fxp, by - 14, 0.7, t, 1, 3);
        });
        // flame on the tube: grows on contact, dies out after the source leaves
        const ign = ease.outCubic(prog(t, tB + 0.95, 0.5)), die = ease.inOutSine(prog(t, tB + 2.4, 1.1));
        const fs = 0.92 * ign * (1 - die);
        lineFlame(ctx, L, fxp + 4, ty - th - 2, fs, t, 1, 7);
        // little smoke curl once extinguished
        const sm = prog(t, tB + 3.2, 1.1);
        if (sm > 0 && sm < 1) L.save(ctx, () => {
          ctx.globalAlpha *= Math.sin(Math.PI * sm) * 0.6; ctx.strokeStyle = '#B9C2CC'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); for (let i = 0; i <= 16; i++) { const yy = ty - th - 6 - i * 4.2 - sm * 26, xx = fxp + Math.sin(i * 0.55 + sm * 4) * 8; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke();
        });
        // static shield with check
        const shp = prog(t, tB + 3.65, 0.6);
        if (shp > 0) {
          const e = ease.outBack(shp);
          L.save(ctx, () => { ctx.globalAlpha *= clamp(shp * 1.8); L.glow(ctx, 810, ty, 140, C.brand, 0.28); });
          L.at(ctx, { x: 810, y: ty, scale: lerp(0.7, 1, e), alpha: clamp(shp * 1.8) }, () => { L.drawIcon(ctx, 'shield', 0, 0, 170, C.brandHi, 1, 6.5); });
        }
      });
      labelPill(ctx, L, 'Згасає без джерела вогню', 96, 846, prog(t, tB + 2.25, 0.6) * (1 - bo), prog(t, tB + 2.55, 0.6), { size: 34 });
    });

    // amber-red transition line
    if (wq > 0 && wq < 1) L.save(ctx, () => {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.amber); g.addColorStop(1, C.red);
      ctx.globalAlpha = Math.sin(Math.PI * wq); ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.shadowColor = C.orange; ctx.shadowBlur = 26;
      ctx.beginPath(); ctx.moveTo(lx + slant, -10); ctx.lineTo(lx, H + 10); ctx.stroke();
    });

    // ================================================================ BEAT C/D — laminated insulation
    if (t > tC - 0.6) {
      // collage (right) with gentle parallax
      const pv = ep(t, tC - 0.3, 1.0), ph = ep(t, tC + 0.05, 1.0), kk = clamp((t - tC + 0.5) / 10.5);
      // right edge of the collage stays ≥ 96 px from the frame edge (incl. the tilt)
      const vx = 980 - kk * 14, vy = 196 + (1 - pv) * 70, hx = 1246 + kk * 10, hy = 512 + (1 - ph) * 80;
      // zoom ≥ 1.37 with fy = 1 keeps the banner (logo, «…виробник…» line and the www.monoisol.com line) fully outside the card
      card(ctx, L, 'lam_red_blue', vx, vy, 452, 510, {
        alpha: clamp(pv * 1.6), zoom: lerp(1.38, 1.43, kk), fx: lerp(0.42, 0.55, kk), fy: 1, rot: -0.025,
        after: (w, h) => {
          // D: UV — sun glint sweeps the top corner, reflected
          const uq = prog(t, tD + 1.95, 1.6);
          if (uq > 0 && uq < 1) L.save(ctx, () => { ctx.globalCompositeOperation = 'lighter'; L.glow(ctx, w * 0.9, h * 0.06, 220, C.amber, 0.35 * Math.sin(Math.PI * uq)); });
        },
      });
      // the blurred banner swoosh behind the top pipe can't be cropped without cutting the hero pipe rim (y 80–210 of 533),
      // so keep the whole product: low zoom, fy slightly up so the top foam ring is never clipped
      card(ctx, L, 'lam_pipes_2024', hx, hy, 556, 370, {
        alpha: clamp(ph * 1.6), zoom: lerp(1.05, 1.1, kk), fx: lerp(0.35, 0.6, kk), fy: 0.4, rot: 0.02,
        after: (w, h) => {
          // D: wear — a light swipe across the surface, nothing scratched
          const sq = prog(t, tD + 1.45, 0.75);
          if (sq > 0 && sq < 1) {
            // gradient is built in the rotated, card-centred space so the band starts and ends fully outside the card
            const reach = (w / 2) * Math.cos(0.35) + (h / 2) * Math.sin(0.35) + 120;
            const gx = lerp(-reach, reach, ease.inOutSine(sq)), g = ctx.createLinearGradient(gx - 110, 0, gx + 110, 0);
            g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.32)'); g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.translate(w / 2, h / 2); ctx.rotate(0.35); ctx.fillRect(-w, -h, w * 2, h * 2); ctx.restore();
          }
        },
      });

      // left column
      accentBar(ctx, L, 96, 252, prog(t, tC - 0.3, 0.6), C.brandHi, C.brand);
      L.revealText(ctx, 'Ламінована ізоляція', 96, 335, prog(t, tC - 0.3, 1.2), { role: 'display', size: 80, maxWidth: 840 });

      const co = ease.inOutCubic(prog(t, tD - 0.5, 0.45));
      if (co < 1) L.at(ctx, { x: 0, y: co * 24, alpha: 1 - co }, () => {
        // colour chips + label
        const chipC = ['#D8393C', '#2E6BD3', '#9AA4AE'];
        chipC.forEach((col, i) => chip(ctx, L, 122 + i * 62, 505, 24, col, prog(t, tC - 0.15 + i * 0.15, 0.5)));
        const lp = ep(t, tC + 0.25, 0.6);
        L.text(ctx, 'Червона · синя · сіра', 300 + (1 - lp) * -16, 506, { role: 'body', size: 34, color: '#E8EDF3', baseline: 'middle', alpha: lp });
        // mini water-supply plan: hot (red, steam) / cold (blue, snowflake)
        const tp = tC + 2.2;
        planPipe(ctx, L, 110, 650, 640, prog(t, tp - 0.25, 0.9), '#D8393C', '#FF8F86', t, [300, 480], -1);
        planPipe(ctx, L, 110, 650, 742, prog(t, tp + 0.55, 0.9), '#2E6BD3', '#86B4FF', t, [300, 480], 1);
        const b1 = prog(t, tp + 0.5, 0.5), b2 = prog(t, tp + 1.3, 0.5);
        if (b1 > 0) { iconCircle(ctx, L, 708, 640, 34, b1, '#FF6B61'); L.save(ctx, () => { ctx.globalAlpha *= clamp(b1 * 2); steamIcon(ctx, 708, 640, 44, '#FF9A8F', t); }); }
        if (b2 > 0) { iconCircle(ctx, L, 708, 742, 34, b2, '#5B9BFF'); L.drawIcon(ctx, 'snowflake', 708, 742, 40, C.ice, clamp(b2 * 2), 3.2); }
        const cp = ep(t, tp - 0.2, 0.6);
        L.text(ctx, 'Маркування гарячої/холодної води', 96 + (1 - cp) * -16, 858, { role: 'body', size: 34, color: '#E8EDF3', alpha: cp });
      });

      // D: feature list
      if (t > tD - 0.4) {
        const rows = [['water', 'Вологонепроникна', tD + 0.1], ['wear', 'Зносостійка', tD + 1.45], ['uv', 'УФ-стійка', tD + 1.95]];
        rows.forEach(([kind, label, ts], i) => {
          const p = prog(t, ts, 0.6), y = 548 + i * 118;
          if (p <= 0) return;
          iconCircle(ctx, L, 144, y, 48, p);
          featureIcon(ctx, L, kind, 144, y, t - ts, p);
          const e = ease.outCubic(p);
          L.text(ctx, label, 226 + (1 - e) * -20, y + 1, { role: 'bodyBold', size: 40, color: C.white, baseline: 'middle', alpha: clamp(p * 1.4) });
        });
      }
      // running motif: house icon, second window lights at the end of the scene
      houseIcon(ctx, L, 148, 150, ep(t, tD + 2.5, 0.7), ep(t, tD + 3.77, 0.5));
    }
  },
};
