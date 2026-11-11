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
MODEL="$HOME/.cache/huggingface/hub/models--Systran--faster-whisper-base.en/snapshots/3d3d5dee26484f91867d81cb899cfcf72b96be6c"
if [ -f "$MODEL/model.bin" ]; then
  "$LIB/.venv/bin/python" "$LIB/core/tts/asr_check.py" "$HERE/tts/lines.json" "$HERE/tts/voices" --lang en --model "$MODEL"
else
  "$LIB/.venv/bin/python" "$LIB/core/tts/asr_check.py" "$HERE/tts/lines.json" "$HERE/tts/voices" --lang en
fi

node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/one-ember.mp4" 24 2

cp "$HERE/one-ember.mp4" "$HERE/../one-ember.mp4"
ffmpeg -y -loglevel error -ss 21.0 -i "$HERE/one-ember.mp4" -frames:v 1 -q:v 2 "$HERE/../poster.jpg"
"$LIB/.venv/bin/python" -c "
import json
tl = json.load(open('$HERE/timeline.json', encoding='utf-8'))
cues = [{'t0': c['t0'], 't1': c['t1'], 'text': c['text']} for c in tl['cues']]
json.dump(cues, open('$HERE/cues.json', 'w', encoding='utf-8'), indent=2)
print('cues', len(cues))
"
"$LIB/.venv/bin/python" "$LIB/core/render/srt.py" "$HERE/cues.json" "$HERE/one-ember.srt"
cp "$HERE/one-ember.srt" "$HERE/../one-ember.srt"
echo "done: $HERE/../one-ember.mp4"
