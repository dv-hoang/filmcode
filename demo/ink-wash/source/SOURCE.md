# A House Made of Rain — source

A real 10-second Chinese Ink Wash film: rice paper, loaded brushstrokes,
bleeding washes, a red umbrella and a vermilion seal.

## Build

Set `LIB` to the FilmCode library folder:

```bash
export LIB="$HOME/.filmcode/library"
sh build.sh
```

Outputs: `ink-wash.mp4` (video + audio), `out/video.mp4` and `audio.wav`
(intermediates). Outputs are gitignored.

## Files

- `index.html`, `film.js` — paper, brush engine, landscape, house, rain,
  figure, vertical title and seal.
- `audio.py` — sparse guqin, rain, steps, seal and a held silence.
- `fonts/` — Cormorant Garamond Italic, SIL OFL 1.1 (`fonts/OFL-Cormorant.txt`).

The paper is procedural; no texture files. Ink is drawn in five tones with
tapered, bristled strokes; the only hues are ink and the vermilion accent.
