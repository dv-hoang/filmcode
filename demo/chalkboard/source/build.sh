#!/bin/sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/.filmcode/library}
export LIB

# This machine's Playwright cache, if the library has not registered its own browser.
if [ -z "$PLAYWRIGHT_CHROME" ] && [ -x "$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell" ]; then
  export PLAYWRIGHT_CHROME="$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell"
fi

[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the FilmCode library folder"; exit 1; }
cd "$LIB"

if [ ! -f "$HERE/tts/voices/v01.wav" ]; then
  "$LIB/.venv/bin/python" "$LIB/core/tts/tts.py" "$HERE/tts/lines.json" "$HERE/tts/voices"
fi

node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/heat-leaves.mp4" 24

"$LIB/.venv/bin/python" - "$HERE" <<'PY'
import json, sys, os
here = sys.argv[1]
sys.path.insert(0, os.environ["LIB"])
ev = json.load(open(os.path.join(here, "events.json"), encoding="utf-8"))
cues = [{"t0": e["t"], "t1": e["t1"], "text": e["text"]} for e in ev["ev"] if e.get("type") == "sub"]
path = os.path.join(here, "tts", "cues.json")
json.dump(cues, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(path, len(cues))
PY
"$LIB/.venv/bin/python" "$LIB/core/render/srt.py" "$HERE/tts/cues.json" "$HERE/heat-leaves.srt"

cp "$HERE/heat-leaves.mp4" "$HERE/../heat-leaves.mp4"
cp "$HERE/heat-leaves.srt" "$HERE/../heat-leaves.srt"
ffmpeg -y -loglevel error -ss 18.4 -i "$HERE/heat-leaves.mp4" -frames:v 1 -q:v 2 "$HERE/../poster.jpg"
echo "done: $HERE/../heat-leaves.mp4"
