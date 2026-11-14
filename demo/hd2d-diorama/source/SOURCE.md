# HD‑2D Diorama Demo

**Title:** HD‑2D Diorama
**Duration:** 10 seconds
**Style:** `hd2d-diorama`

## Overview
A short 10‑second animated scene rendered with the Canvas 2D API, emulating a miniature diorama. A soft sky shifts colour, a sun rises, a foggy platform stretches into the distance, and a stylised train silhouette glides across the scene. A tilt‑shift blur creates a miniature‑look, while a subtle procedural ground texture adds depth.

## Files
- `index.html` – Boiler‑plate page that loads the canvas and the film script.
- `film.js` – Implements `window.DUR`, `window.render(ctx, t)`, and `window.READY`. All drawing is done with Canvas 2D; no external assets are fetched.
- `audio.py` – Generates a 10‑second mono WAV file (`audio.wav`) with gentle wind and three brief chime notes using the Python standard library.
- `build.sh` – Calls the FilmCode renderer (`core/render/video.mjs`) to produce a video, runs the audio script, and muxes the result into `hd2d-diorama.mp4`.
- `SOURCE.md` – This document.
- `CREDITS` – Attribution for the demo.

## Build Process
```sh
./source/build.sh
```
The script creates `hd2d-diorama.mp4` and a poster frame automatically.

## Usage
Open `index.html` in a browser to view the animation, or play the generated MP4.
