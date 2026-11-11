#!/bin/sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/.filmcode/library}
export LIB

[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the FilmCode library folder"; exit 1; }
cd "$LIB"

if [ ! -f "$HERE/tts/voices/v01.wav" ]; then
  "$LIB/.venv/bin/python" "$LIB/core/tts/tts.py" "$HERE/tts/lines.json" "$HERE/tts/voices"
fi
"$LIB/.venv/bin/python" "$LIB/core/tts/asr_check.py" "$HERE/tts/lines.json" "$HERE/tts/voices" --lang en

node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/still-lit.mp4" 24 1
cp "$HERE/still-lit.mp4" "$HERE/../still-lit.mp4"
ffmpeg -y -loglevel error -ss 32.0 -i "$HERE/still-lit.mp4" -frames:v 1 -q:v 2 "$HERE/../poster.jpg"
"$LIB/.venv/bin/python" "$LIB/core/render/srt.py" "$HERE/cues.json" "$HERE/../still-lit.srt"
cp "$HERE/../still-lit.srt" "$HERE/still-lit.srt"
echo "done: $HERE/../still-lit.mp4"
