# MONOISOL — рекламний ролик (3:00, українське озвучення)

Повністю відтворюваний пайплайн: сценарій → нейронне озвучення українською → таймлайн →
моушн-графіка з реальними фото та логотипом з monoisol.com → оригінальна музика → мікс → MP4.

## Результат
- `out/monoisol-promo-3min.mp4` — 1920×1080, 30 fps, H.264 (High, tune animation) + AAC 192k, 3:00.000,
  −14.1 LUFS / true peak −1.0 dBFS, м'які субтитри (mov_text, ukr), ~58 МБ
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
python3 tts/make_voice.py script/script_final.json build/voice --speaker mykyta --length 0.90 --n 4 --asr
python3 tts/build_timeline.py script/script_final.json build/voice/lines.json render/timeline.json script/subtitles.uk.srt --gap 0.24 --lead 0.4 --tail 0.4
#   (render/timeline.json in the repo additionally sets cornerLogo, shimmers and per-scene transitions)
python3 music/make_music.py build/music --timeline render/timeline.json
python3 music/mix.py render/timeline.json build/voice build/music build/mix.wav
./make_video.sh            # render (4 jobs) + delivery encodes + checks
```

## Голос
Модель `uk_UA-ukrainian_tts-medium` (Piper/VITS, датасет CC0), диктор «Микита», темп 0.90. Наголоси задаються
вручну знаком U+0301 після наголошеної голосної — модель на них реагує. Кожна репліка генерується кілька разів,
і обирається варіант, який Whisper (turbo) розпізнає найточніше: середня схожість 0.99. Назва бренду в TTS-тексті
пишеться «Моно ізо́л» — так Whisper впізнає «Моноізол» у 12/12 спроб (проти 7/12 для злитного написання).

## Перевірка
- `node render/render.js check 2` — рендер кожного 2-го кадру всього ролика без винятків
- `node render/render.js boundaries out.png` — кадри на всіх переходах між сценами
- `node render/render.js sheet out.png 36` — контактний аркуш усього ролика

## Джерела
Факти, фото продукції та логотип — з офіційного сайту monoisol.com. Музика і звукові ефекти синтезовані
процедурно (оригінальні). Шрифти — Google Fonts (SIL Open Font License).
