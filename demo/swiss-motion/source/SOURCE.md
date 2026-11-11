# The Grid System — source

A real 10-second Swiss Motion Graphics film: a 12-column page, one signal
element and a 120 BPM grid.

## Build

Set `LIB` to the FilmCode library folder:

```bash
export LIB="$HOME/.filmcode/library"
sh build.sh
```

Outputs: `swiss-motion.mp4` (video + audio), `out/video.mp4` and `audio.wav`
(intermediates). Outputs are gitignored.

## Files

- `index.html`, `film.js` — grid, layout, clip reveals, bars, exception dot.
- `audio.py` — 120 BPM pulse, print clicks, exception glide and final chord.
- `fonts/` — Archivo (variable), SIL OFL 1.1 (`fonts/OFL-Archivo.txt`).

The red dot is the only signal element; grid scale and motion are driven by a
single precise ease, except the dot, which moves linearly off-grid.
