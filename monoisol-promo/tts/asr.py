import sys, numpy as np, soundfile as sf, sherpa_onnx
import os
W = os.environ.get('WHISPER_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models', 'sherpa-onnx-whisper-turbo')) + '/'
_rec = None
def rec():
    global _rec
    if _rec is None:
        _rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=W+'turbo-encoder.int8.onnx', decoder=W+'turbo-decoder.int8.onnx',
            tokens=W+'turbo-tokens.txt', language='uk', task='transcribe', num_threads=4)
    return _rec
def transcribe(audio, sr):
    if sr != 16000:
        import math
        n = int(len(audio) * 16000 / sr); x = np.linspace(0, len(audio) - 1, n)
        audio = np.interp(x, np.arange(len(audio)), audio).astype(np.float32)
    s = rec().create_stream(); s.accept_waveform(16000, audio); rec().decode_stream(s); return s.result.text.strip()
if __name__ == '__main__':
    for f in sys.argv[1:]:
        a, sr = sf.read(f, dtype='float32')
        if a.ndim > 1: a = a.mean(1)
        print(f, '=>', transcribe(a, sr))
