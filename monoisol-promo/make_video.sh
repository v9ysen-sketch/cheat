#!/usr/bin/env bash
# Final assembly: render frames -> H.264, mux with the mixed soundtrack, make a subtitled social version.
# Prerequisites: render/timeline.json, build/mix.wav (see README for the voice/music steps).
set -euo pipefail
cd "$(dirname "$0")"
JOBS=${JOBS:-4}
mkdir -p build out

if [ "${SKIP_RENDER:-0}" != 1 ]; then
  echo "== render video ($JOBS jobs)"
  (cd render && STRICT=1 node render.js parallel ../build/video.mp4 "$JOBS")
fi
# delivery encode settings (intermediate build/video.mp4 is CRF 16)
X264="-c:v libx264 -preset slow -tune animation -crf ${CRF_OUT:-20} -pix_fmt yuv420p -profile:v high -level 4.1 -g 60 -bf 3"

echo "== mux"
ffmpeg -y -loglevel error -i build/video.mp4 -i build/mix.wav -i script/subtitles.uk.srt \
  -map 0:v -map 1:a -map 2:s $X264 -c:a aac -b:a 192k -ar 48000 -c:s mov_text \
  -metadata title="MONOISOL — Тепло, яке залишається вдома" -metadata:s:a:0 language=ukr -metadata:s:s:0 language=ukr \
  -movflags +faststart -t 180 out/monoisol-promo-3min.mp4

echo "== subtitled social version"
ffmpeg -y -loglevel error -i build/video.mp4 -i build/mix.wav \
  -vf "subtitles=script/subtitles.uk.srt:fontsdir=render/fonts:force_style='FontName=Manrope,FontSize=10.5,Bold=1,PrimaryColour=&H00FFFFFF,BackColour=&H96071629,BorderStyle=4,Outline=0,Shadow=0,MarginV=9,MarginL=40,MarginR=40'" \
  $X264 -c:a aac -b:a 192k -ar 48000 -movflags +faststart -t 180 \
  out/monoisol-promo-3min-subtitles.mp4
cp script/subtitles.uk.srt out/monoisol-promo-3min.uk.srt

echo "== checks"
for f in out/monoisol-promo-3min.mp4 out/monoisol-promo-3min-subtitles.mp4; do
  ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact "$f"
done
ffmpeg -hide_banner -nostats -i out/monoisol-promo-3min.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
