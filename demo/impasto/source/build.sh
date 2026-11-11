#!/bin/sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/.filmcode/library}
export LIB

[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the FilmCode library folder"; exit 1; }
cd "$LIB"

# voice (skip if already rendered)
if [ ! -f "$HERE/tts/voices/v01.wav" ]; then
  "$LIB/.venv/bin/python" "$LIB/core/tts/tts.py" "$HERE/tts/lines.json" "$HERE/tts/voices"
fi

node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/first-orange.mp4" 24
# also place deliverables next to DEMO.md (watercolor pattern: film beside source/)
cp "$HERE/first-orange.mp4" "$HERE/../first-orange.mp4"
ffmpeg -y -loglevel error -ss 24.0 -i "$HERE/first-orange.mp4" -frames:v 1 -q:v 2 "$HERE/../poster.jpg"
# srt
cat > "$HERE/../first-orange.srt" <<'EOF'
1
00:00:02,000 --> 00:00:04,800
Before the sun, one colour waited.

2
00:00:11,000 --> 00:00:12,500
A knife found it.

3
00:00:15,000 --> 00:00:16,200
Skin broke.

4
00:00:17,500 --> 00:00:20,800
And the room remembered how to be warm.

5
00:00:28,000 --> 00:00:29,200
Breakfast.
EOF
cp "$HERE/../first-orange.srt" "$HERE/first-orange.srt"
echo "done: $HERE/../first-orange.mp4"
