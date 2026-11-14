#!/bin/sh
set -eu
HERE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/.filmcode/library}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the FilmCode library folder"; exit 1; }
cd "$LIB"
mkdir -p "$HERE/out"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/audio.py"
ffmpeg -y -v error -i "$HERE/out/video.mp4" -i "$HERE/audio.wav" \
  -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart "$HERE/microgame.mp4"
cp "$HERE/microgame.mp4" "$HERE/../microgame.mp4"
ffmpeg -y -loglevel error -ss 4 -i "$HERE/microgame.mp4" -frames:v 1 -q:v 2 "$HERE/../poster.jpg" || true
echo "done: $HERE/../microgame.mp4"
