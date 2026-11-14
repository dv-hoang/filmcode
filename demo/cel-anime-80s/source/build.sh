#!/usr/bin/env bash
cd "$(dirname "$0")"

echo "=== Building 80s Cel Anime Demo ==="
python3 audio.py

# Render video using framework library
node "$LIB/core/render/video.mjs" source/index.html source/film.js 10 cel-anime-80s.mp4

# Mux audio and video
ffmpeg -y -i cel-anime-80s.mp4 -i audio.wav -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest final.mp4

cp final.mp4 ../cel-anime-80s.mp4
cp cel-anime-80s.mp4 ../cel-anime-80s-poster.mp4

echo "=== Build Complete ==="
