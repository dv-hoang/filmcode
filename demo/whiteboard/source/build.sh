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

node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
# Light board: a little grain, not the default.
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/the-open-top.mp4" 24 1
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/cues.json" "$HERE/the-open-top.srt"
cp "$HERE/the-open-top.mp4" "$HERE/../the-open-top.mp4"
cp "$HERE/the-open-top.srt" "$HERE/../the-open-top.srt"
ffmpeg -y -loglevel error -ss 32.8 -i "$HERE/the-open-top.mp4" -frames:v 1 -q:v 2 "$HERE/../poster.jpg"
echo "done: $HERE/../the-open-top.mp4"
