# The Orchard at First Light — source

A real 10-second Crayon Picture Book demo, drawn live in code.

## Build

Set `LIB` to the FilmCode library folder (with `core/` and `.venv/`):

```bash
export LIB="$HOME/.filmcode/library"
sh build.sh
```

Outputs: `crayon-book.mp4` (video + music), `out/video.mp4` and `music.wav` (intermediates). Outputs are gitignored.

## Files

- `index.html`, `film.js` — the page, scene, palette and timeline.
- `crayon.js` — Canvas2D crayon stroke/fill engine (layer, line, fill, dab, text, boil).
- `music.py` — the 10 s music-box score.
- `fonts/` — Gaegu and Patrick Hand, both SIL OFL 1.1 (`fonts/OFL-*.txt`).

## Sound

The score is synthesised by `music.py` with the library's physical models (`core/audio/pluck.py`); no samples are bundled. The video carries AAC stereo audio at 48 kHz.
