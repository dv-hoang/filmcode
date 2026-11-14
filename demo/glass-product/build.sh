#!/usr/bin/env bash
# Build script for glass-product demo
# Requires: node, python3, ffmpeg

set -e

# Duration in seconds
DUR=10

# Render video using the core renderer
# The renderer expects: --output <basename> --fps <fps> --duration <seconds> --width <w> --height <h>
# It will produce <basename>.mp4
./core/render/video.mjs --output "glass-product" --fps 60 --duration "$DUR" --width 1280 --height 720

# Generate audio
python3 audio.py

# Mux audio and video into final mp4
ffmpeg -y -i glass-product.mp4 -i audio.wav -c copy -shortest glass-product-final.mp4

# Rename to final name
mv glass-product-final.mp4 glass-product.mp4

# Clean up intermediate files
rm -f glass-product.mp4

# Done
