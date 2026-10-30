'use strict';
// Running "house" emblem shared by scenes 4–8: one window lights up per product family.
// Window order (lit[] index): 0 bottom-left, 1 bottom-right, 2 top-left, 3 top-middle, 4 top-right.
const INK = '#14233A';
const EMB = { x: 190, y: 150, s: 0.82 };   // standard placement (scenes 4–7); s08 uses a slightly smaller variant
function houseEmblem(ctx, L, x, y, s, lit, alpha) {
  if (alpha <= 0.002) return;
  L.at(ctx, { x, y, scale: s, alpha }, () => {
    const w = 96, h = 70, rh = 36;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.32)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
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
module.exports = { houseEmblem, EMB };
