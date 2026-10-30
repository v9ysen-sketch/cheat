"""Minimal piper-style runner for uk_UA text-phoneme voices (onnxruntime)."""
import json, re, sys, unicodedata
import numpy as np, onnxruntime as ort, soundfile as sf

import os
MD = os.environ.get('UK_VOICE_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models', 'vits-piper-uk_UA-ukrainian_tts-medium')) + '/'
_sess = None; _cfg = None

def load():
    global _sess, _cfg
    if _sess is None:
        _cfg = json.load(open(MD + 'uk_UA-ukrainian_tts-medium.onnx.json'))
        so = ort.SessionOptions(); so.intra_op_num_threads = 4
        _sess = ort.InferenceSession(MD + 'uk_UA-ukrainian_tts-medium.onnx', so, providers=['CPUExecutionProvider'])
    return _sess, _cfg

def to_ids(text):
    _, cfg = load(); m = cfg['phoneme_id_map']
    t = unicodedata.normalize('NFD', text.lower().replace('’', "'").replace('ʼ', "'").replace('+', ''))
    ids = m['^'] + m['_']; dropped = []
    for ch in t:
        if ch in m: ids += m[ch] + m['_']
        else: dropped.append(ch)
    ids += m['$']
    return ids, dropped

def synth(text, speaker='lada', length_scale=1.0, noise_scale=0.667, noise_w=0.8):
    sess, cfg = load()
    ids, dropped = to_ids(text)
    if dropped and set(dropped) - {'«', '»', '"', '\n'}:
        print('WARN dropped chars:', repr(''.join(sorted(set(dropped)))), file=sys.stderr)
    feeds = {'input': np.array([ids], dtype=np.int64),
             'input_lengths': np.array([len(ids)], dtype=np.int64),
             'scales': np.array([noise_scale, length_scale, noise_w], dtype=np.float32),
             'sid': np.array([cfg['speaker_id_map'][speaker]], dtype=np.int64)}
    audio = sess.run(None, feeds)[0].squeeze()
    return audio.astype(np.float32), cfg['audio']['sample_rate']

if __name__ == '__main__':
    text, out = sys.argv[1], sys.argv[2]
    spk = sys.argv[3] if len(sys.argv) > 3 else 'lada'
    a, sr = synth(text, spk); sf.write(out, a, sr); print(out, len(a) / sr)
