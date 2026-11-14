#!/usr/bin/env bash
set -e
# Build the demo video
# Assumes $LIB points to the root of the repo
LIB=${LIB:-$(dirname $(dirname $(realpath $0)))}
# Render video frames and mux audio
$LIB/core/render/video.mjs source/film.js source/audio.wav demo/glass-product/glass-product.mp4
# Copy poster (optional)
# cp demo/glass-product/poster.png demo/glass-product/glass-product.png
