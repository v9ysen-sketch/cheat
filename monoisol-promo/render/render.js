#!/usr/bin/env node
// MONOISOL promo renderer.
//   node render.js still <seconds> <out.png> [width]        one global-timeline frame
//   node render.js scene <sceneId> <t> <out.png> [width]     one frame of a scene at local time t
//   node render.js contact <sceneId> <out.png> [n=8]          contact sheet of a scene (n frames)
//   node render.js sheet <out.png> [n=36]                     contact sheet of the whole timeline
//   node render.js video <out.mp4> [startSec endSec]         render (part of) the timeline to H.264
//   node render.js parallel <out.mp4> [jobs=4]               split the timeline into chunks and concat
//   node render.js perf <sceneId> [n=30]                      average ms/frame of a scene
//   node render.js times <sceneId> <out.png> t1,t2,...       sheet of specific local times
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const L = require('./lib');
const { W, H, FPS } = L;

const TL_PATH = process.env.TIMELINE || path.join(__dirname, 'timeline.json');
const timeline = JSON.parse(fs.readFileSync(TL_PATH, 'utf8'));
const TR = timeline.transition ?? 0.8; // transition window (s), centred on scene boundaries

// scene modules are loaded lazily and isolated: a broken scene renders an error card instead of killing the render
const scenes = timeline.scenes.map(s => ({ ...s, mod: null }));
function sceneMod(i) {
  const s = scenes[i];
  if (!s.mod) {
    const f = path.join(__dirname, 'scenes', s.file);
    try { s.mod = require(f); }
    catch (e) {
      const msg = String(e && e.message || e).split('\n')[0];
      if (process.env.STRICT) throw e;
      s.mod = { draw(ctx, t) { ctx.fillStyle = '#300'; ctx.fillRect(0, 0, W, H); L.text(ctx, `scene ${s.id}: ${fs.existsSync(f) ? 'error' : 'missing'}`, 100, 200, { role: 'display', size: 60 }); L.text(ctx, msg.slice(0, 120), 100, 300, { size: 30 }); } };
    }
  }
  return s.mod;
}
const DURATION = timeline.duration;

const bufA = L.offscreen(), bufB = L.offscreen();
const ctxA = bufA.getContext('2d'), ctxB = bufB.getContext('2d');

function drawScene(ctx, i, T) {
  const s = scenes[i];
  const t = T - s.start;
  ctx.save();
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  try { sceneMod(i).draw(ctx, t, s.dur, L, { cues: s.cues || [], scene: s, T, timeline }); }
  finally { ctx.restore(); }
}

const TRANSITIONS = {
  fade(ctx, a, b, q) { ctx.drawImage(a, 0, 0); ctx.globalAlpha = L.ease.inOutSine(q); ctx.drawImage(b, 0, 0); ctx.globalAlpha = 1; },
  // diagonal band wipe with glowing cyan edge
  wipe(ctx, a, b, q, color = L.C.cyan) {
    const e = L.ease.inOutCubic(q), slant = 360, x = L.lerp(-slant - 60, W + 60, e);
    ctx.drawImage(a, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(x + slant, -10); ctx.lineTo(x, H + 10); ctx.lineTo(-10, H + 10); ctx.closePath(); ctx.clip(); ctx.drawImage(b, 0, 0); ctx.restore();
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.shadowColor = color; ctx.shadowBlur = 40;
    ctx.globalAlpha = Math.sin(Math.PI * q); ctx.beginPath(); ctx.moveTo(x + slant, -10); ctx.lineTo(x, H + 10); ctx.stroke(); ctx.restore();
  },
  warm(ctx, a, b, q) { TRANSITIONS.wipe(ctx, a, b, q, L.C.orange); },
  // iris: circle grows from centre (or from timeline-provided point)
  iris(ctx, a, b, q, cx = W / 2, cy = H / 2) {
    const e = L.ease.inOutCubic(q), r = e * Math.hypot(W, H) * 0.6;
    ctx.drawImage(a, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(b, 0, 0); ctx.restore();
    ctx.save(); ctx.globalAlpha = Math.sin(Math.PI * q) * 0.9; ctx.strokeStyle = L.C.ice; ctx.lineWidth = 8; ctx.shadowColor = L.C.cyan; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  },
  // push: incoming slides in from right while outgoing slides left
  push(ctx, a, b, q) {
    const e = L.ease.inOutCubic(q);
    ctx.drawImage(a, -W * e, 0); ctx.drawImage(b, W * (1 - e), 0);
  },
  // zoom-through: outgoing scales up and fades, incoming scales down from 1.15
  zoom(ctx, a, b, q) {
    const e = L.ease.inOutCubic(q);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + e * 0.25, 1 + e * 0.25); ctx.drawImage(a, -W / 2, -H / 2); ctx.restore();
    ctx.save(); ctx.globalAlpha = L.ease.inOutSine(L.clamp(q * 1.4 - 0.2)); ctx.translate(W / 2, H / 2); const s = 1.15 - 0.15 * e; ctx.scale(s, s); ctx.drawImage(b, -W / 2, -H / 2); ctx.restore();
  },
  // white flash
  flash(ctx, a, b, q) {
    ctx.drawImage(q < 0.5 ? a : b, 0, 0);
    ctx.fillStyle = `rgba(255,255,255,${Math.sin(Math.PI * q) * 0.9})`; ctx.fillRect(0, 0, W, H);
  },
  cut(ctx, a, b, q) { ctx.drawImage(q < 0.5 ? a : b, 0, 0); },
};

function drawFrame(ctx, T) {
  // find scene
  let i = scenes.findIndex(s => T >= s.start && T < s.start + s.dur);
  if (i < 0) i = T < 0 ? 0 : scenes.length - 1;
  const s = scenes[i];
  const next = scenes[i + 1], prev = scenes[i - 1];
  let pair = null;
  if (next && T > s.start + s.dur - TR / 2) pair = [i, i + 1, next.start];
  else if (prev && T < s.start + TR / 2) pair = [i - 1, i, s.start];
  if (pair) {
    const [ia, ib, b] = pair;
    const q = L.clamp((T - (b - TR / 2)) / TR);
    const kind = scenes[ib].transition || 'wipe';
    if (kind === 'cut') { drawScene(ctx, q < 0.5 ? ia : ib, T); return; }
    drawScene(ctxA, ia, T); drawScene(ctxB, ib, T);
    ctx.save(); (TRANSITIONS[kind] || TRANSITIONS.wipe)(ctx, bufA, bufB, q); ctx.restore();
  } else drawScene(ctx, i, T);
  // global overlay hook (e.g. persistent corner logo), drawn by timeline option
  if (timeline.cornerLogo) {
    const [a, b] = timeline.cornerLogo; // visible window
    const k = L.envelope(T, a, b, 0.6, 0.6);
    if (k > 0) { ctx.save(); L.brandLogo(ctx, W - 175, 78, 230, 1, { alpha: 0.92 * k, glowAmt: 0 }); ctx.restore(); }
  }
}

function toPng(canvas, out, width) {
  if (width && width !== W) {
    const h = Math.round(H * width / W), c = L.offscreen(width, h), x = c.getContext('2d');
    x.drawImage(canvas, 0, 0, width, h); fs.writeFileSync(out, c.toBuffer('image/png'));
  } else fs.writeFileSync(out, canvas.toBuffer('image/png'));
}

function contact(frames, out, cols = 4, thumbW = 640) {
  const thumbH = Math.round(thumbW * H / W), rows = Math.ceil(frames.length / cols), pad = 8, lab = 34;
  const sheet = L.offscreen(cols * (thumbW + pad) + pad, rows * (thumbH + pad + lab) + pad), sx = sheet.getContext('2d');
  sx.fillStyle = '#111'; sx.fillRect(0, 0, sheet.width, sheet.height);
  const c = L.offscreen(), x = c.getContext('2d');
  frames.forEach(([label, fn], k) => {
    fn(x);
    const cx = pad + (k % cols) * (thumbW + pad), cy = pad + Math.floor(k / cols) * (thumbH + pad + lab);
    sx.drawImage(c, cx, cy + lab, thumbW, thumbH);
    sx.fillStyle = '#fff'; sx.font = '22px MR600'; sx.fillText(label, cx + 4, cy + 25);
  });
  fs.writeFileSync(out, sheet.toBuffer('image/png'));
}

function encodeRange(out, t0, t1) {
  return new Promise((resolve, reject) => {
    const f0 = Math.round(t0 * FPS), f1 = Math.round(t1 * FPS);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', process.env.X264_PRESET || 'medium', '-crf', process.env.CRF || '16', '-pix_fmt', 'yuv420p', '-g', String(FPS * 2), '-threads', '2', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    ff.on('error', reject); ff.on('close', code => code === 0 ? resolve() : reject(new Error('ffmpeg ' + code)));
    const c = L.offscreen(), x = c.getContext('2d');
    let f = f0; const tStart = Date.now();
    const pump = () => {
      while (f < f1) {
        drawFrame(x, f / FPS);
        const ok = ff.stdin.write(Buffer.from(c.data()));
        f++;
        if (f % (FPS * 5) === 0) process.stderr.write(`  [${path.basename(out)}] ${(f / FPS).toFixed(1)}s ${((Date.now() - tStart) / 1000 / ((f - f0) / FPS)).toFixed(2)}x\n`);
        if (!ok) { ff.stdin.once('drain', pump); return; }
      }
      ff.stdin.end();
    };
    pump();
  });
}

async function main() {
  const [mode, ...a] = process.argv.slice(2);
  await L.preload();
  const c = L.offscreen(), x = c.getContext('2d');
  const sceneIdx = id => { const k = scenes.findIndex(s => String(s.id) === String(id)); if (k < 0) throw new Error('no scene ' + id); return k; };
  if (mode === 'still') { drawFrame(x, +a[0]); toPng(c, a[1], a[2] && +a[2]); }
  else if (mode === 'scene') { const k = sceneIdx(a[0]); drawScene(x, k, scenes[k].start + +a[1]); toPng(c, a[2], a[3] && +a[3]); }
  else if (mode === 'contact') {
    const k = sceneIdx(a[0]), n = +(a[2] || 8), s = scenes[k];
    const frames = Array.from({ length: n }, (_, j) => { const t = (s.dur * (j + 0.5)) / n; return [`scene ${s.id}  t=${t.toFixed(2)}s`, ctx => drawScene(ctx, k, s.start + t)]; });
    contact(frames, a[1]);
  } else if (mode === 'sheet') {
    const n = +(a[1] || 36);
    const frames = Array.from({ length: n }, (_, j) => { const T = (DURATION * (j + 0.5)) / n; return [`${T.toFixed(1)}s`, ctx => drawFrame(ctx, T)]; });
    contact(frames, a[0], 6, 400);
  } else if (mode === 'perf') {
    const k = sceneIdx(a[0]), s = scenes[k], n = +(a[1] || 30); drawScene(x, k, s.start + 0.01);
    const t0 = Date.now(); for (let j = 0; j < n; j++) { drawScene(x, k, s.start + (s.dur * j) / n); c.data(); } // data() forces rasterisation
    console.log(`scene ${s.id}: ${((Date.now() - t0) / n).toFixed(1)} ms/frame over ${n} frames`);
  } else if (mode === 'times') { // strip of specific local times: times <id> <out.png> t1,t2,...
    const k = sceneIdx(a[0]), ts = a[2].split(',').map(Number);
    contact(ts.map(t => [`scene ${scenes[k].id}  t=${t.toFixed(2)}s`, ctx => drawScene(ctx, k, scenes[k].start + t)]), a[1], Math.min(4, ts.length), ts.length <= 2 ? 940 : 640);
  } else if (mode === 'video') { await encodeRange(a[0], a[1] ? +a[1] : 0, a[2] ? +a[2] : DURATION); }
  else if (mode === 'parallel') {
    const out = a[0], jobs = +(a[1] || 4), dir = path.join(path.dirname(path.resolve(out)), '.chunks'); fs.mkdirSync(dir, { recursive: true });
    const frames = Math.round(DURATION * FPS), per = Math.ceil(frames / jobs);
    const parts = [];
    await Promise.all(Array.from({ length: jobs }, (_, j) => new Promise((res, rej) => {
      const s0 = (j * per) / FPS, s1 = Math.min(frames, (j + 1) * per) / FPS, p = path.join(dir, `part${j}.mp4`); parts[j] = p;
      const ch = spawn(process.execPath, [__filename, 'video', p, String(s0), String(s1)], { stdio: 'inherit', env: process.env });
      ch.on('close', code => code === 0 ? res() : rej(new Error('chunk ' + j + ' failed')));
    })));
    fs.writeFileSync(path.join(dir, 'list.txt'), parts.map(p => `file '${p}'`).join('\n'));
    const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-c', 'copy', out], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('concat failed');
  } else { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 9).join('\n')); }
}
main().catch(e => { console.error(e); process.exit(1); });
