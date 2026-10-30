#!/usr/bin/env python3
"""Procedural, original background score for the MONOISOL promo (+ transition SFX).

usage: make_music.py <out_dir> [--timeline ../render/timeline.json] [--total 180]
writes music.wav (48 kHz stereo), whoosh.wav, shimmer.wav, pop.wav
Structure follows the timeline: cold/sparse intro -> groove -> breakdown -> lift -> warm resolve.
"""
import argparse, json, os
import numpy as np, soundfile as sf
from scipy import signal

ap = argparse.ArgumentParser()
ap.add_argument('out'); ap.add_argument('--timeline'); ap.add_argument('--total', type=float, default=180.0)
ap.add_argument('--bpm', type=float, default=100.0); ap.add_argument('--seed', type=int, default=7)
args = ap.parse_args()
os.makedirs(args.out, exist_ok=True)

SR = 48000
T = args.total
N = int(T * SR)
rng = np.random.default_rng(args.seed)
beat = 60.0 / args.bpm
bar = 4 * beat

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)

# ---------- harmony: G major, emotional loop Em - C - G - D, final cadence C - D - G ----------
# chords as MIDI note lists (pad voicing around middle register)
CH = {
    'Em': [52, 55, 59, 64], 'C': [48, 55, 60, 64], 'G': [50, 55, 59, 62], 'D': [50, 54, 57, 62],
    'Am': [52, 57, 60, 64], 'Bm': [50, 54, 59, 62], 'Cmaj7': [48, 55, 59, 64], 'Dsus': [50, 55, 57, 62], 'Gadd9': [43, 55, 57, 59, 62],
}
ROOT = {'Em': 40, 'C': 36, 'G': 43, 'D': 38, 'Am': 45, 'Bm': 47, 'Cmaj7': 36, 'Dsus': 38, 'Gadd9': 43}
LOOP = ['Em', 'C', 'G', 'D']

n_bars = int(np.ceil(T / bar))
prog = [LOOP[i % 4] for i in range(n_bars)]

# ---------- section map (seconds) from timeline ----------
sec = {'groove': 13.0, 'break_a': 112.0, 'break_b': 124.0, 'lift': 126.0, 'outro': T - 9.0}
if args.timeline and os.path.exists(args.timeline):
    tl = json.load(open(args.timeline))
    starts = [s['start'] for s in tl['scenes']]
    if len(starts) >= 6:
        sec['groove'] = starts[1] if starts[1] < 25 else 13.0
        # breakdown at the start of the scene nearest 62% of the runtime, lift ~12 s later
        k = min(range(len(starts)), key=lambda j: abs(starts[j] - T * 0.62))
        sec['break_a'] = starts[k]; sec['break_b'] = starts[k] + 12.0; sec['lift'] = sec['break_b'] + 2 * beat
        last = tl['scenes'][-1]['start']
        sec['outro'] = max(last, T - 12.0)
# snap to bars
snap = lambda x: round(x / bar) * bar
for k in sec: sec[k] = snap(sec[k])
# make the last bars a cadence C - D - G(hold)
ob = int(sec['outro'] / bar)
for i in range(ob, n_bars): prog[i] = 'Gadd9'
if ob >= 2: prog[ob - 2], prog[ob - 1] = 'C', 'D'
print('sections:', {k: round(v, 2) for k, v in sec.items()}, 'bars', n_bars)

def level(t, pts):
    """piecewise-linear automation from [(time, value)]"""
    xs, ys = zip(*pts); return np.interp(t, xs, ys)

def adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr); s_len = max(0, n - a - d - r)
    env = np.concatenate([np.linspace(0, 1, max(a, 1)), np.linspace(1, s, max(d, 1)), np.full(s_len, s), np.linspace(s, 0, max(r, 1))])
    return env[:n] if len(env) >= n else np.pad(env, (0, n - len(env)))

L = np.zeros(N); R = np.zeros(N)
def add(sig, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= N: return
    sig = sig[: N - i0] * gain
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i0:i0 + len(sig)] += sig * gl * 1.414; R[i0:i0 + len(sig)] += sig * gr * 1.414

tt = np.arange(N) / SR

# ---------- instruments ----------
def pad_note(f, dur, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for det in (-0.08, 0.0, 0.07):
        ff = f * 2 ** (det / 12); ph = rng.random() * 6.28
        for h in range(1, 14):
            amp = (1 / h) * np.exp(-h * (1.2 - bright) * 0.35)
            out += amp * np.sin(2 * np.pi * ff * h * t + ph * h)
    vib = 1 + 0.15 * np.sin(2 * np.pi * 0.21 * t)
    return out * adsr(n, 1.2, 0.5, 0.85, 1.4) * vib / 8

def piano(f, dur=3.0, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n); B = 0.0004
    for h in range(1, 11):
        fh = f * h * np.sqrt(1 + B * h * h)
        if fh > 16000: break
        decay = 2.2 + h * 0.9 + f / 400
        out += (vel ** (1 + h * 0.15)) * (0.9 / h ** 1.15) * np.exp(-decay * t) * np.sin(2 * np.pi * fh * t + rng.random())
    att = np.minimum(1, t / 0.004)
    click = rng.standard_normal(n) * np.exp(-t * 400) * 0.03
    return (out * att + click) * 0.5

def pluck(f, dur=0.6):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for h in range(1, 9): out += (1 / h ** 1.4) * np.exp(-(6 + h * 3) * t) * np.sin(2 * np.pi * f * h * t)
    return out * np.minimum(1, t / 0.002) * 0.45

def bell(f, dur=4.0):
    n = int(dur * SR); t = np.arange(n) / SR
    parts = [(1, 1.0, 1.2), (2.76, 0.5, 2.0), (5.40, 0.25, 3.5), (8.93, 0.12, 5)]
    return sum(a * np.exp(-d * t) * np.sin(2 * np.pi * f * m * t) for m, a, d in parts) * np.minimum(1, t / 0.003) * 0.25

def bass(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    return s * adsr(n, 0.01, 0.25, 0.7, 0.12) * 0.55

def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 45 + 85 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t * 7.5) + rng.standard_normal(n) * np.exp(-t * 300) * 0.05) * 0.9

def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR); t = np.arange(n) / SR
    x = signal.lfilter(*signal.butter(2, 7000 / (SR / 2), 'high'), rng.standard_normal(n))
    return x * np.exp(-t * (14 if open_ else 70)) * 0.22

def shaker():
    n = int(0.09 * SR); t = np.arange(n) / SR
    x = signal.lfilter(*signal.butter(2, [5000 / (SR / 2), 12000 / (SR / 2)], 'band'), rng.standard_normal(n))
    return x * np.sin(np.pi * np.minimum(1, t / 0.09)) * 0.16

def clap():
    n = int(0.35 * SR); t = np.arange(n) / SR
    x = signal.lfilter(*signal.butter(2, [900 / (SR / 2), 4000 / (SR / 2)], 'band'), rng.standard_normal(n))
    env = sum(np.exp(-np.maximum(0, t - d) * 60) * (t >= d) for d in (0, 0.011, 0.022)) + np.exp(-t * 14) * 0.4
    return x * env * 0.28

def swell(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    lo = signal.lfilter(*signal.butter(2, 800 / (SR / 2), 'low'), x); hi = x - lo
    k = (t / dur) ** 2
    return (lo * (1 - k) * 0.3 + hi * k) * k * 0.25

# ---------- arrangement ----------
G0, BA, BB, LI, OU = sec['groove'], sec['break_a'], sec['break_b'], sec['lift'], sec['outro']
pad_bus = np.zeros(N); keys_bus = np.zeros((2, N)); drum_bus = np.zeros((2, N)); bass_bus = np.zeros(N)

def to(bus, sig, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= N: return
    sig = sig[: N - i0] * gain
    if bus.ndim == 1: bus[i0:i0 + len(sig)] += sig
    else:
        gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        bus[0, i0:i0 + len(sig)] += sig * gl * 1.414; bus[1, i0:i0 + len(sig)] += sig * gr * 1.414

for b in range(n_bars):
    t0 = b * bar
    if t0 >= T: break
    ch = prog[b]; notes = CH[ch]; root = ROOT[ch]
    hold = bar + 1.2 if t0 < OU else (T - t0)
    bright = 0.35 if t0 < G0 else (0.7 if t0 >= LI else 0.5)
    for n_ in notes: to(pad_bus, pad_note(midi(n_), hold, bright), t0, 0.55)
    # piano: broken chord, sparse in intro/breakdown, flowing elsewhere
    sparse = t0 < G0 or BA <= t0 < BB or t0 >= OU
    pattern = [0, 2] if sparse else [0, 1.5, 2, 3, 3.5]
    pitches = [notes[0] + 12, notes[2] + 12, notes[1] + 12, notes[3] + 12, notes[2] + 24]
    for j, pos in enumerate(pattern):
        if t0 >= OU and b > ob: break
        vel = 0.75 if j else 0.95
        to(keys_bus, piano(midi(pitches[j % len(pitches)]), 3.2, vel), t0 + pos * beat, 0.55, pan=(-0.25 if j % 2 else 0.2))
    if t0 >= OU and b == ob: to(keys_bus, piano(midi(55 + 12), 6.0, 1.0), t0, 0.5); to(keys_bus, piano(midi(43), 6.0, 0.9), t0, 0.5)
    # cold bells in the intro
    if t0 < G0:
        for j, pos in enumerate([0.5, 2.5]): to(keys_bus, bell(midi(notes[(j + 2) % 4] + 24), 4.0), t0 + pos * beat, 0.22, pan=0.5 - j)
    # plucked 8th arpeggio in groove sections
    if G0 + bar * 2 <= t0 < BA or LI <= t0 < OU:
        arp = [notes[0] + 24, notes[1] + 24, notes[2] + 24, notes[3] + 24, notes[2] + 24, notes[1] + 24, notes[3] + 24, notes[2] + 24]
        for j in range(8): to(keys_bus, pluck(midi(arp[j]), 0.5), t0 + j * beat / 2, 0.20 if t0 < LI else 0.26, pan=0.45 if j % 2 else -0.45)
    # bass
    if G0 <= t0 < OU and not (BA <= t0 < BB):
        for pos, ln in ((0, 1.4), (1.5, 0.4), (2, 1.4), (3.5, 0.4)): to(bass_bus, bass(midi(root), ln * beat), t0 + pos * beat, 0.8)
    elif t0 >= OU and b == ob: to(bass_bus, bass(midi(ROOT['G']), 5.0), t0, 0.8)
    # drums
    if G0 <= t0 < OU and not (BA <= t0 < BB):
        full = t0 >= G0 + bar * 4
        for k in range(4):
            if k in (0, 2) or (t0 >= LI and k in (1, 3)): to(drum_bus, kick(), t0 + k * beat, 0.95 if k in (0, 2) else 0.55)
            if full and k in (1, 3): to(drum_bus, clap(), t0 + k * beat, 0.8, pan=0.05)
        for j in range(8):
            to(drum_bus, shaker(), t0 + j * beat / 2 + 0.012, 0.9 if j % 2 else 0.55, pan=0.35)
            if full and j % 2: to(drum_bus, hat(), t0 + j * beat / 2, 0.8, pan=-0.3)
        if t0 >= LI: to(drum_bus, hat(True), t0 + 3.5 * beat, 0.5, pan=-0.2)

# risers into groove, lift and outro
for at, d in ((G0 - 2 * beat * 2, 2 * beat * 2), (LI - bar, bar), (OU - bar, bar)):
    if at > 0: to(drum_bus, swell(d), at, 0.9)
# crash-like noise on lift downbeat
def crash():
    n = int(2.5 * SR); t = np.arange(n) / SR
    x = signal.lfilter(*signal.butter(2, 4500 / (SR / 2), 'high'), rng.standard_normal(n)); return x * np.exp(-t * 2.2) * 0.12
to(drum_bus, crash(), LI, 1.0, 0.2); to(drum_bus, crash(), G0 + bar * 4, 0.7, -0.2)

# ---------- mixing ----------
pad_bus = signal.lfilter(*signal.butter(2, 4200 / (SR / 2), 'low'), pad_bus)
pad_bus = signal.lfilter(*signal.butter(2, 140 / (SR / 2), 'high'), pad_bus)
bass_bus = signal.lfilter(*signal.butter(2, 900 / (SR / 2), 'low'), bass_bus)
# gentle sidechain pump on pads from the kick grid in groove sections
pump = np.ones(N)
for b in range(n_bars):
    t0 = b * bar
    if G0 <= t0 < OU and not (BA <= t0 < BB):
        for k in (0, 2):
            i0 = int((t0 + k * beat) * SR); n = int(0.35 * SR)
            if i0 + n < N: pump[i0:i0 + n] = np.minimum(pump[i0:i0 + n], 1 - 0.35 * np.exp(-np.arange(n) / SR * 9))
pad_l = pad_bus * pump; pad_r = np.roll(pad_bus, int(0.011 * SR)) * pump  # Haas widening

dry_l = pad_l * 0.8 + keys_bus[0] * 1.15 + drum_bus[0] * 0.8 + bass_bus * 0.55
dry_r = pad_r * 0.8 + keys_bus[1] * 1.15 + drum_bus[1] * 0.8 + bass_bus * 0.55

# convolution reverb with synthetic stereo IR
ir_len = int(2.6 * SR); ti = np.arange(ir_len) / SR
def ir():
    x = rng.standard_normal(ir_len) * np.exp(-ti * 2.6)
    x = signal.lfilter(*signal.butter(1, 5000 / (SR / 2), 'low'), x); x[: int(0.012 * SR)] = 0; return x / np.sqrt((x ** 2).sum())
send_l = keys_bus[0] + pad_l * 0.6 + drum_bus[0] * 0.15; send_r = keys_bus[1] + pad_r * 0.6 + drum_bus[1] * 0.15
wet_l = signal.fftconvolve(send_l, ir())[:N]; wet_r = signal.fftconvolve(send_r, ir())[:N]
mix_l = dry_l + wet_l * 0.38; mix_r = dry_r + wet_r * 0.38

# global dynamics automation (intro softer, outro fade to silence at T)
auto = level(tt, [(0, 0.0), (0.8, 0.75), (G0, 0.85), (BA, 0.95), (BB, 0.9), (LI, 1.0), (T - 4.0, 0.95), (T - 0.3, 0.0), (T, 0.0)])
mix_l *= auto; mix_r *= auto
# master tone: tame sub rumble, add air (high shelf ~ +5 dB above 3.5 kHz)
hp = signal.butter(2, 32 / (SR / 2), 'high'); mix_l = signal.lfilter(*hp, mix_l); mix_r = signal.lfilter(*hp, mix_r)
hs = signal.butter(1, 3500 / (SR / 2), 'high'); mix_l = mix_l + 0.8 * signal.lfilter(*hs, mix_l); mix_r = mix_r + 0.8 * signal.lfilter(*hs, mix_r)
peak = max(np.abs(mix_l).max(), np.abs(mix_r).max())
mix = np.stack([mix_l, mix_r], 1) / peak * 0.8
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
mix = mix / np.abs(mix).max() * 0.89
sf.write(os.path.join(args.out, 'music.wav'), mix.astype(np.float32), SR, subtype='PCM_24')

# ---------- SFX ----------
def write(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.8; sf.write(os.path.join(args.out, name), x.astype(np.float32), SR, subtype='PCM_24')
n = int(0.9 * SR); t = np.arange(n) / SR; x = rng.standard_normal((n, 2))
env = np.sin(np.pi * np.clip(t / 0.9, 0, 1)) ** 2
fc = 300 + 5000 * np.sin(np.pi * np.clip(t / 0.9, 0, 1))
wh = np.zeros((n, 2)); blk = 1024
for i in range(0, n, blk):
    b, a = signal.butter(2, [max(80, fc[i] * 0.5) / (SR / 2), min(20000, fc[i] * 1.6) / (SR / 2)], 'band')
    wh[i:i + blk] = signal.lfilter(b, a, x[i:i + blk], axis=0)
pan = np.stack([np.clip(1 - t / 0.9, 0, 1) * 0.6 + 0.4, np.clip(t / 0.9, 0, 1) * 0.6 + 0.4], 1)
write('whoosh.wav', wh * env[:, None] * pan)
n = int(2.5 * SR); t = np.arange(n) / SR
sh = sum(np.sin(2 * np.pi * midi(m) * t + rng.random()) * np.exp(-t * (1.5 + k * 0.4)) * np.minimum(1, t / (0.02 + k * 0.05)) for k, m in enumerate([79, 83, 86, 91, 95]))
write('shimmer.wav', np.stack([sh, np.roll(sh, 400)], 1))
n = int(0.18 * SR); t = np.arange(n) / SR
pp = np.sin(2 * np.pi * (900 - 500 * t / 0.18) * t) * np.exp(-t * 35)
write('pop.wav', np.stack([pp, pp], 1))
print('wrote music.wav', mix.shape[0] / SR, 's, and SFX')
