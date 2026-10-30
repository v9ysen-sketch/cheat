#!/usr/bin/env python3
"""Mix voice-over + music bed + SFX into the final soundtrack.

usage: mix.py <timeline.json> <voice_dir> <music_dir> <out.wav> [--lufs -14]
- voice lines are placed at the timeline cue times, EQ'd and compressed, normalised to ~-16 LUFS
- music is ducked ~11 dB under speech with smooth ramps
- whooshes on scene transitions, shimmer on logo moments
- final master normalised to the target LUFS with a true-peak-safe limiter
"""
import argparse, json, os
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy import signal

ap = argparse.ArgumentParser()
ap.add_argument('timeline'); ap.add_argument('voice'); ap.add_argument('music'); ap.add_argument('out')
ap.add_argument('--lufs', type=float, default=-14.0); ap.add_argument('--duck-db', type=float, default=-11.0)
ap.add_argument('--music-db', type=float, default=-3.0, help='music bed gain relative to voice-normalised level')
args = ap.parse_args()

SR = 48000
tl = json.load(open(args.timeline)); T = tl['duration']; N = int(round(T * SR))
meter = pyln.Meter(SR)

def biquad_peak(f0, gain_db, q):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]; a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return np.array(b) / a[0], np.array(a) / a[0]

def compress(x, thr_db=-20, ratio=3.0, tc=0.012, makeup_db=0.0):
    """feed-forward RMS-ish compressor with a one-pole envelope (time constant tc seconds)"""
    k = np.exp(-1 / (tc * SR))
    env = np.sqrt(signal.lfilter([1 - k], [1, -k], x * x) + 1e-12)
    over = np.maximum(0, 20 * np.log10(env) - thr_db)
    return x * 10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20)

# ---------- voice ----------
voice = np.zeros(N)
for c in tl['voice']:
    a, sr = sf.read(os.path.join(args.voice, c['file']), dtype='float64')
    if a.ndim > 1: a = a.mean(1)
    if sr != SR: a = signal.resample_poly(a, SR // 50, sr // 50) if (SR % 50 == 0 and sr % 50 == 0) else signal.resample(a, int(len(a) * SR / sr))
    i0 = int(round(c['start'] * SR)); a = a[: max(0, N - i0)]
    voice[i0:i0 + len(a)] += a
voice = signal.lfilter(*signal.butter(2, 85 / (SR / 2), 'high'), voice)
voice = signal.lfilter(*biquad_peak(250, -2.0, 1.0), voice)    # de-mud
voice = signal.lfilter(*biquad_peak(3200, 2.5, 0.9), voice)    # presence
voice = signal.lfilter(*biquad_peak(9000, 1.5, 0.7), voice)    # air
voice = compress(voice, thr_db=-22, ratio=2.6)
vl = meter.integrated_loudness(np.stack([voice, voice], 1))
voice *= 10 ** ((-16.0 - vl) / 20)
print(f'voice loudness {vl:.1f} -> -16.0 LUFS')

# ---------- music + ducking ----------
m, msr = sf.read(os.path.join(args.music, 'music.wav'), dtype='float64')
assert msr == SR, msr
m = m[:N] if len(m) >= N else np.pad(m, ((0, N - len(m)), (0, 0)))
ml = meter.integrated_loudness(m)
m *= 10 ** ((-16.0 + args.music_db - ml) / 20)
duck = np.zeros(N)
for c in tl['voice']:
    a0, a1 = int((c['start'] - 0.25) * SR), int((c['end'] + 0.15) * SR)
    duck[max(0, a0):min(N, a1)] = 1.0
# smooth: fast-ish attack, slow release
k_att, k_rel = int(0.25 * SR), int(0.8 * SR)
duck = np.maximum(signal.lfilter(np.ones(k_att) / k_att, [1], duck), 0)
duck = np.maximum(duck, np.convolve(duck, np.ones(k_rel) / k_rel, 'full')[:N] * 0.999)
duck = np.clip(duck, 0, 1)
gain = 10 ** (args.duck_db * duck / 20)
m *= gain[:, None]

# ---------- SFX ----------
def load_sfx(name):
    x, sr = sf.read(os.path.join(args.music, name), dtype='float64'); return x if x.ndim > 1 else np.stack([x, x], 1)
sfx = np.zeros((N, 2))
def place(x, t0, g_db):
    i0 = int(round(t0 * SR));
    if i0 < 0: x = x[-i0:]; i0 = 0
    x = x[: max(0, N - i0)]; sfx[i0:i0 + len(x)] += x * 10 ** (g_db / 20)
wh, sh = load_sfx('whoosh.wav'), load_sfx('shimmer.wav')
for s in tl['scenes'][1:]:
    if s.get('transition', 'wipe') != 'cut': place(wh, s['start'] - 0.45, -21)
for t0 in tl.get('shimmers', []): place(sh, t0, -19)

mix = np.stack([voice, voice], 1) + m + sfx
# ---------- master: loudness + limiter ----------
il = meter.integrated_loudness(mix)
mix *= 10 ** ((args.lufs - il) / 20)
ceiling = 10 ** (-1.2 / 20)
from scipy.ndimage import minimum_filter1d, uniform_filter1d
# lookahead-style limiter: per-sample required gain, held by a centred min-filter, then smoothed
need = np.minimum(1.0, ceiling / np.maximum(np.abs(mix).max(1), 1e-9))
hold = int(0.006 * SR)
g = minimum_filter1d(need, size=2 * hold + 1)
g = uniform_filter1d(g, size=hold)
g = np.minimum(g, minimum_filter1d(need, size=5))
mix *= g[:, None]
mix = np.clip(mix, -ceiling, ceiling)
fl = meter.integrated_loudness(mix)
sf.write(args.out, mix.astype(np.float32), SR, subtype='PCM_24')
print(f'master: {fl:.2f} LUFS, peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS, {len(mix) / SR:.2f}s -> {args.out}')
