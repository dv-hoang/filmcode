#!/bin/sh
set -eu
HERE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/.filmcode/library}
export HERE
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the FilmCode library folder"; exit 1; }
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/tts/voices" "$HERE/music"

if [ ! -f "$HERE/tts/voices/v01.wav" ]; then
  "$LIB/.venv/bin/python" "$LIB/core/tts/tts.py" "$HERE/tts/lines.json" "$HERE/tts/voices"
fi

node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/one-lamp-across.mp4" 24 1

"$LIB/.venv/bin/python" -c "
import json, os
here = os.environ['HERE']
cue = json.load(open(os.path.join(here, 'cue.json'), encoding='utf-8'))
json.dump(cue['subs'], open(os.path.join(here, 'cues.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
"
HERE="$HERE" "$LIB/.venv/bin/python" "$LIB/core/render/srt.py" "$HERE/cues.json" "$HERE/one-lamp-across.srt"

cp "$HERE/one-lamp-across.mp4" "$HERE/../one-lamp-across.mp4"
cp "$HERE/one-lamp-across.srt" "$HERE/../one-lamp-across.srt"
ffmpeg -y -loglevel error -i "$HERE/../one-lamp-across.mp4" -ss 26.80 -frames:v 1 -q:v 2 "$HERE/../poster.jpg"
echo "done: $HERE/../one-lamp-across.mp4"
