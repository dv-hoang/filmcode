#!/bin/sh
# Render every 10 s teaser into films/teasers/ (ignored). Safe to re-run: existing files are skipped.
set -eu
HERE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$HERE/../.." && pwd)
LIB=${LIB:-$HOME/.filmcode/library}
OUT=${1:-$ROOT/films/teasers}
mkdir -p "$OUT"
cd "$LIB"

SLUGS=$(python3 -c "import json;print(' '.join(x['slug'] for x in json.load(open('$HERE/styles.json'))))")
for slug in $SLUGS; do
  [ -s "$OUT/$slug.mp4" ] && { echo "skip $slug"; continue; }
  echo "render $slug"
  if ! node core/render/video.mjs "$HERE" --fps 24 --workers 4 --q "style=$slug" --out "$OUT/$slug.mp4"; then
    echo "FAIL $slug"
  fi
done
echo "done: $(find "$OUT" -name '*.mp4' | wc -l | tr -d ' ') files in $OUT"
