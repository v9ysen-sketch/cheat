# MONOISOL — рекламний ролик (3:00, українське озвучення)

Повністю відтворюваний пайплайн: сценарій → нейронне озвучення українською → таймлайн →
моушн-графіка з реальними фото та логотипом з monoisol.com → оригінальна музика → мікс → MP4.

## Результат
- `out/monoisol-promo-3min.mp4` — 1920×1080, 30 fps, H.264 + AAC, 3:00.000, гучність −14 LUFS
- `out/monoisol-promo-3min-subtitles.mp4` — та сама версія з вшитими субтитрами (для соцмереж)
- `out/monoisol-promo-3min.uk.srt` — субтитри українською
- `script/script_final.json` — фінальний сценарій (текст, TTS-текст із наголосами, розкадровка)

## Структура
| Папка | Що всередині |
|---|---|
| `script/` | сценарій (JSON), субтитри |
| `tts/` | `uktts.py` (запуск голосу uk_UA через onnxruntime), `asr.py` (контроль розбірливості Whisper), `make_voice.py` (best-of-N за ASR), `build_timeline.py` (вкладає репліки в рівно 180 с) |
| `render/` | `lib.js` (бібліотека графіки), `scenes/sNN.js` (сцени), `render.js` (рендер у ffmpeg), `assets/` (логотип і фото з monoisol.com), `fonts/` (Unbounded, Manrope — OFL) |
| `music/` | `make_music.py` (процедурна оригінальна музика + SFX), `mix.py` (мікс і мастеринг) |
| `tools/` | векторизація логотипу |

## Як перезібрати
```bash
pip install sherpa-onnx onnxruntime soundfile scipy pyloudnorm potracer fonttools
(cd render && npm install)
# моделі (GitHub releases k2-fsa/sherpa-onnx): vits-piper-uk_UA-ukrainian_tts-medium, sherpa-onnx-whisper-turbo -> tts/models/
python3 tts/make_voice.py script/script_final.json build/voice --speaker mykyta --length 0.95 --n 3 --asr
python3 tts/build_timeline.py script/script_final.json build/voice/lines.json render/timeline.json out/monoisol-promo-3min.uk.srt
python3 music/make_music.py build/music --timeline render/timeline.json
python3 music/mix.py render/timeline.json build/voice build/music build/mix.wav
(cd render && node render.js parallel ../build/video.mp4 4)
ffmpeg -i build/video.mp4 -i build/mix.wav -c:v copy -c:a aac -b:a 256k out/monoisol-promo-3min.mp4
```

## Голос
Модель `uk_UA-ukrainian_tts-medium` (Piper/VITS, датасет CC0), диктор «Микита». Наголоси задаються вручну
знаком U+0301 після наголошеної голосної — модель на них реагує. Кожна репліка генерується кілька разів, і
обирається варіант, який Whisper розпізнає найточніше.

## Джерела
Факти, фото продукції та логотип — з офіційного сайту monoisol.com. Музика і звукові ефекти синтезовані
процедурно (оригінальні). Шрифти — Google Fonts (SIL Open Font License).
