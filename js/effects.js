/* ================================================================
   CRATER — visual effects: confetti burst, screen flash.
   ================================================================ */

window.CRATER = window.CRATER || {};

CRATER.confetti = (function () {
  let canvas = null, ctx = null, particles = [], raf = 0;

  function ensure() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.className = 'confetti-layer';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(count, colors, origin) {
    ensure();
    const W = window.innerWidth, H = window.innerHeight;
    const cx = origin ? origin.x : W / 2;
    const cy = origin ? origin.y : H / 2;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = 6 + Math.random() * 10;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        w:  6 + Math.random() * 8,
        h:  8 + Math.random() * 10,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.35,
        color: colors[i % colors.length],
        life: 90 + Math.random() * 60,
        shape: Math.random() < 0.5 ? 'rect' : 'tri',
      });
    }
    if (!raf) tick();
  }

  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const gravity = 0.28;
    const drag = 0.985;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.life--;
      if (p.life <= 0 || p.y > window.innerHeight + 40) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life / 40);
      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.h / 2);
        ctx.lineTo(p.w / 2, p.h / 2);
        ctx.lineTo(-p.w / 2, p.h / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    if (particles.length) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      // Fade canvas out
      setTimeout(() => { if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }, 100);
    }
  }

  return function (opts) {
    opts = opts || {};
    const colors = opts.colors || ['#2be07b','#ffd700','#e4ae39','#4b69ff','#d32ce6','#eb4b4b'];
    const count = opts.count || 80;
    spawn(count, colors, opts.origin);
  };
})();

CRATER.screenFlash = function (color) {
  let el = document.querySelector('.screen-flash');
  if (!el) {
    el = document.createElement('div');
    el.className = 'screen-flash';
    document.body.appendChild(el);
  }
  el.style.background = color || 'rgba(43,224,123,0.25)';
  el.style.opacity = '1';
  el.style.transition = 'opacity 0s';
  requestAnimationFrame(() => {
    el.style.transition = 'opacity .5s ease-out';
    el.style.opacity = '0';
  });
};
