#!/bin/sh
# Upload every rendered teaser to the public Supabase bucket. Internal use only.
set -eu
HERE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$HERE/../.." && pwd)
OUT=${1:-$ROOT/films/teasers}
[ -d "$OUT" ] || { echo "no renders in $OUT" >&2; exit 1; }

for f in "$OUT"/*.mp4; do
  [ -f "$f" ] || continue
  slug=$(basename "$f" .mp4)
  case "$slug" in crayon-book|ascii-crt|swiss-motion) continue;; esac
  echo "upload $slug"
  if ! sh "$ROOT/scripts/upload-supabase.sh" "$f" "$slug.mp4"; then
    echo "FAIL $slug" >&2
  fi
done
