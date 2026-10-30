#!/usr/bin/env python3
"""Fit scenes + voice lines into an exact-length timeline.

usage: build_timeline.py <script_final.json> <voice/lines.json> <render/timeline.json> <script/subtitles.srt> [--total 180]
"""
import argparse, json, math, os

ap = argparse.ArgumentParser()
ap.add_argument('script'); ap.add_argument('lines'); ap.add_argument('timeline'); ap.add_argument('srt')
ap.add_argument('--total', type=float, default=180.0); ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--intro', type=float, default=3.0, help='music-only time before the first line')
ap.add_argument('--outro', type=float, default=5.5, help='music/logo time after the last line')
ap.add_argument('--gap', type=float, default=0.42, help='minimum pause between lines')
ap.add_argument('--lead', type=float, default=0.55, help='minimum time from scene start to its first line')
ap.add_argument('--tail', type=float, default=0.55, help='minimum time from last line to scene end')
args = ap.parse_args()

script = json.load(open(args.script)); voice = json.load(open(args.lines))
F = 1.0 / args.fps
q = lambda x: round(x * args.fps) / args.fps
by_scene = {}
for ln in voice['lines']: by_scene.setdefault(ln['scene'], []).append(ln)

TRANS = ['fade', 'wipe', 'iris', 'push', 'zoom', 'warm', 'wipe', 'iris', 'push', 'zoom', 'flash', 'fade']
scenes = []
for i, sc in enumerate(script['scenes']):
    lns = by_scene.get(sc['id'], [])
    speech = sum(l['dur'] for l in lns) + args.gap * max(0, len(lns) - 1)
    lead = args.intro if i == 0 else args.lead
    tail = args.outro if i == len(script['scenes']) - 1 else args.tail
    scenes.append({'sc': sc, 'lines': lns, 'speech': speech, 'lead': lead, 'tail': tail, 'need': lead + speech + tail, 'target': float(sc['seconds'])})

need = sum(s['need'] for s in scenes); slack = args.total - need
print(f'speech total {sum(s["speech"] for s in scenes):.1f}s, needed {need:.1f}s, slack {slack:.1f}s')
if slack < 0: raise SystemExit(f'narration too long by {-slack:.1f}s: lower --length in make_voice or trim the script')

# distribute slack toward each scene's target duration, remainder evenly
want = [max(0.0, s['target'] - s['need']) for s in scenes]; W = sum(want)
for s, w in zip(scenes, want):
    s['extra'] = min(w, slack * (w / W)) if W > 0 else 0.0
rem = slack - sum(s['extra'] for s in scenes)
for s in scenes: s['extra'] += rem / len(scenes)

# frame-quantised boundaries
t = 0.0; out_scenes = []; srt = []; cues_global = []
for i, s in enumerate(scenes):
    dur_raw = s['need'] + s['extra']
    start = q(t); end = q(t + dur_raw) if i < len(scenes) - 1 else args.total
    dur = end - start
    # inside the scene: spread extra across lead / gaps / tail
    extra = dur - s['need']; n = len(s['lines'])
    add_lead = min(1.4, extra * 0.30) if i > 0 else min(1.0, extra * 0.2)
    add_gap = min(0.9, (extra * 0.45) / max(1, n - 1)) if n > 1 else 0
    cur = start + s['lead'] + add_lead; cues = []
    for k, ln in enumerate(s['lines']):
        a = q(cur); b = a + ln['dur']
        cues.append({'k': k, 'start': round(a - start, 3), 'end': round(b - start, 3), 'text': ln['text']})
        cues_global.append({'file': ln['file'], 'start': round(a, 3), 'end': round(b, 3), 'text': ln['text'], 'scene': s['sc']['id']})
        cur = b + args.gap + add_gap
    sc = s['sc']
    out_scenes.append({'id': sc['id'], 'name': sc['name'], 'file': f"s{sc['id']:02d}.js", 'start': round(start, 4), 'dur': round(dur, 4),
                       'transition': TRANS[i % len(TRANS)] if i > 0 else 'fade', 'cues': cues,
                       'onscreen': sc.get('onscreen', []), 'visual': sc.get('visual', '')})
    print(f"scene {sc['id']:2d} {start:7.2f}–{end:7.2f} ({dur:5.2f}s, target {s['target']:.0f}) speech {s['speech']:5.2f}s  {sc['name']}")
    t = end

tl = {'fps': args.fps, 'duration': args.total, 'transition': 0.8, 'title': script.get('title'), 'tagline': script.get('tagline'),
      'scenes': out_scenes, 'voice': cues_global, 'speaker': voice.get('speaker'), 'length_scale': voice.get('length_scale')}
os.makedirs(os.path.dirname(os.path.abspath(args.timeline)), exist_ok=True)
json.dump(tl, open(args.timeline, 'w'), ensure_ascii=False, indent=1)

def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
with open(args.srt, 'w') as f:
    for n, c in enumerate(cues_global, 1):
        f.write(f"{n}\n{ts(c['start'])} --> {ts(c['end'] + 0.25)}\n{c['text']}\n\n")
print(f'wrote {args.timeline} ({len(out_scenes)} scenes, {len(cues_global)} lines) and {args.srt}')
