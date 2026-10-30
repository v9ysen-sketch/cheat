#!/usr/bin/env python3
"""Synthesize every narration line with the uk_UA neural voice, best-of-N by Whisper back-transcription.

usage: make_voice.py <script_final.json> <out_dir> [--speaker mykyta] [--length 0.95] [--n 3]
writes <out_dir>/lineNN.wav (22.05 kHz mono, trimmed) and <out_dir>/lines.json
"""
import argparse, difflib, json, os, re, sys
import numpy as np, soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import uktts  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument('script'); ap.add_argument('out')
ap.add_argument('--speaker', default='mykyta'); ap.add_argument('--length', type=float, default=0.95)
ap.add_argument('--n', type=int, default=3); ap.add_argument('--noise', type=float, default=0.5); ap.add_argument('--noise-w', type=float, default=0.7)
ap.add_argument('--asr', action='store_true', help='score candidates with Whisper (slower, better)')
ap.add_argument('--only', default='', help='comma-separated line indices to regenerate in an existing lines.json')
args = ap.parse_args()
os.makedirs(args.out, exist_ok=True)

def norm(s):
    s = s.lower().replace('́', '').replace('’', "'").replace('ʼ', "'")
    s = re.sub(r"[^a-zа-яіїєґ0-9' ]+", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def trim(a, sr, thr=0.006, pad=0.11):
    env = np.convolve(np.abs(a), np.ones(256) / 256, 'same')
    idx = np.where(env > thr)[0]
    if not len(idx): return a
    s, e = max(0, idx[0] - int(pad * sr)), min(len(a), idx[-1] + int(pad * sr))
    out = a[s:e].copy(); f = int(0.01 * sr)
    out[:f] *= np.linspace(0, 1, f); out[-f:] *= np.linspace(1, 0, f)
    return out

if args.asr:
    import asr

script = json.load(open(args.script))
lines = []
for sc in script['scenes']:
    for k, ln in enumerate(sc['lines']):
        lines.append({'scene': sc['id'], 'k': k, 'text': ln['text'], 'tts': ln['tts']})

only = {int(x) for x in args.only.split(',') if x.strip()}
prev = json.load(open(os.path.join(args.out, 'lines.json')))['lines'] if only else None
result = []
for i, ln in enumerate(lines):
    if only and i not in only:
        result.append(prev[i]); continue
    best = None
    for trial in range(args.n):
        a, sr = uktts.synth(ln['tts'], args.speaker, length_scale=args.length, noise_scale=args.noise, noise_w=args.noise_w)
        a = trim(a, sr)
        if args.asr:
            hyp = asr.transcribe(a, sr)
            score = difflib.SequenceMatcher(None, norm(hyp), norm(ln['text'])).ratio()
        else:
            hyp, score = '', 0.0
        # mild preference for natural pacing: penalise outlier durations relative to text length
        cps = len(ln['text']) / (len(a) / sr)
        cand = {'audio': a, 'sr': sr, 'hyp': hyp, 'score': score, 'cps': cps}
        if best is None or score > best['score'] + 1e-9: best = cand
        if not args.asr: break
        if score > 0.995: break
    a = best['audio']; peak = np.abs(a).max() or 1; a = a / peak * 0.89
    fn = os.path.join(args.out, f'line{i:02d}.wav'); sf.write(fn, a, best['sr'], subtype='PCM_16')
    rec = {**ln, 'file': os.path.basename(fn), 'dur': round(len(a) / best['sr'], 3), 'asr': best['hyp'], 'score': round(best['score'], 3), 'cps': round(best['cps'], 2)}
    result.append(rec)
    print(f"{i:02d} s{ln['scene']} {rec['dur']:5.2f}s score={rec['score']:.3f} | {ln['text'][:70]}", flush=True)
    if args.asr and rec['score'] < 0.9: print(f"     ASR: {best['hyp']}", flush=True)

json.dump({'speaker': args.speaker, 'length_scale': args.length, 'lines': result}, open(os.path.join(args.out, 'lines.json'), 'w'), ensure_ascii=False, indent=1)
tot = sum(r['dur'] for r in result)
print(f'TOTAL speech {tot:.1f}s over {len(result)} lines; mean score {np.mean([r["score"] for r in result]):.3f}')
