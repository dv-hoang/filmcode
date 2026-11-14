#!/usr/bin/env bash
export LIB="../../../lib"
set -euo pipefail
cd "$(dirname "$0")"

echo "=== Building Broadcast News Package ==="
python3 audio.py

node "$LIB/core/render/video.mjs"

echo "=== Muxing audio & video ==="
ffmpeg -y -i raw.mp4 -i audio.wav -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192000 -shortest output.mp4

cp output.mp4 ../broadcast-package.mp4
ffmpeg -y -ss 2 -i ../broadcast-package.mp4 -vframes 1 ../poster.jpg
echo "=== Build complete ==="
