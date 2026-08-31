/* ================================================================
   CRATER — Web Audio sound engine. No external files.
   All ticks, chimes, beeps synthesized on the fly.
   ================================================================ */

window.CRATER = window.CRATER || {};

CRATER.sound = (function () {
  let ctx = null;
  let masterGain = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  function tone(freq, dur, type, gain, when) {
    const c = ensure();
    if (!c || muted) return;
    resume();
    const t0 = (when || c.currentTime);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain || 0.6, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, filterFreq, gain, when) {
    const c = ensure();
    if (!c || muted) return;
    resume();
    const t0 = (when || c.currentTime);
    const bufSize = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource(); src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq || 4000;
    filter.Q.value = 3;
    const g = c.createGain();
    g.gain.setValueAtTime(gain || 0.35, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter); filter.connect(g); g.connect(masterGain);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  return {
    click:  () => { tone(800, 0.05, 'triangle', 0.35); },
    tick:   () => { tone(1400 + Math.random() * 200, 0.025, 'square', 0.15); },
    tock:   () => { tone(600, 0.04, 'triangle', 0.25); },
    win:    () => {
      const c = ensure(); if (!c) return;
      const t0 = c.currentTime;
      tone(660, 0.14, 'triangle', 0.4, t0);
      tone(880, 0.14, 'triangle', 0.4, t0 + 0.08);
      tone(1320, 0.3, 'triangle', 0.35, t0 + 0.16);
      noise(0.4, 6000, 0.15, t0);
    },
    bigwin: () => {
      const c = ensure(); if (!c) return;
      const t0 = c.currentTime;
      [523, 659, 784, 1046, 1319].forEach((f, i) =>
        tone(f, 0.22, 'triangle', 0.4, t0 + i * 0.08));
      noise(0.6, 8000, 0.2, t0 + 0.4);
    },
    fail:   () => {
      const c = ensure(); if (!c) return;
      const t0 = c.currentTime;
      tone(220, 0.18, 'sawtooth', 0.35, t0);
      tone(160, 0.22, 'sawtooth', 0.3, t0 + 0.12);
      noise(0.25, 500, 0.2, t0);
    },
    chime:  () => {
      const c = ensure(); if (!c) return;
      const t0 = c.currentTime;
      tone(880, 0.12, 'sine', 0.35, t0);
      tone(1320, 0.15, 'sine', 0.3, t0 + 0.05);
    },
    coin:   () => {
      const c = ensure(); if (!c) return;
      const t0 = c.currentTime;
      tone(1200, 0.06, 'square', 0.25, t0);
      tone(1800, 0.08, 'square', 0.22, t0 + 0.05);
    },
    setMuted(m) { muted = !!m; },
    isMuted() { return muted; },
    resume,
  };
})();

// Initialize mute state from prefs
if (CRATER.state && CRATER.state.prefs) {
  CRATER.sound.setMuted(!!CRATER.state.prefs.muted);
}
