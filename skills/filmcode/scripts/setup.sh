#!/bin/sh
# FilmCode skill (Command Code edition): put the bundled library in its working folder, then print its path.
#   sh setup.sh                    copy the library that ships with this skill (when it is new or changed) → LIB=<path>
#   sh setup.sh deps [voice] [music]
#                                  the same, then install packages (see the library's tools/setup.sh)
# The library ships inside the skill; nothing is cloned or fetched here. It is copied out because the packages
# (node_modules/, .venv/) and the models it downloads later should survive skill updates.
# FILMCODE_HOME = the working folder (default ~/.filmcode/library).
set -e
SRC=$(cd "$(dirname "$0")/../library" && pwd -P)
LIB=${FILMCODE_HOME:-$HOME/.filmcode/library}
case "$LIB" in /*) ;; *) LIB=$(pwd)/$LIB ;; esac

stamp=$(cat "$SRC/.edition" 2>/dev/null || echo unknown)
if [ "$(cat "$LIB/.edition" 2>/dev/null)" != "$stamp" ]; then
  if [ -e "$LIB" ] && [ -n "$(ls -A "$LIB" 2>/dev/null)" ] && [ ! -f "$LIB/.edition" ]; then
    echo "✗ $LIB exists and is not a FilmCode library folder. Set FILMCODE_HOME to another folder."; exit 1
  fi
  mkdir -p "$LIB"
  # copy over the old files; packages and downloaded models (node_modules/, .venv/, core/tts/*.onnx…) stay
  cp -R "$SRC/." "$LIB/"
  echo "✓ library $stamp ready in $LIB"
fi
LIB=$(cd "$LIB" && pwd -P)
exec sh "$LIB/tools/setup.sh" "$@"
