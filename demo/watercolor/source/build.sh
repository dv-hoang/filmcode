#!/bin/sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/.filmcode/library}
export LIB

[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the FilmCode library folder"; exit 1; }
cd "$LIB"

node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/alborada.mp4" 30 2
ffmpeg -y -loglevel error -ss 44.6 -i "$HERE/alborada.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/alborada.mp4"
