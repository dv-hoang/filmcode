# The Moving Sign — source

A real 10-second ASCII / CRT Terminal film: an 80-column character grid, an
amber phosphor CRT and a synthesised analog score.

## Build

Set `LIB` to the FilmCode library folder:

```bash
export LIB="$HOME/.filmcode/library"
sh build.sh
```

Outputs: `ascii-crt.mp4` (video + audio), `out/video.mp4` and `audio.wav`
(intermediates). Outputs are gitignored.

## Files

- `index.html`, `film.js` — grid renderer, terminal timeline, CRT post.
- `audio.py` — mains hum, pad, relay beeps and key clicks.
- `fonts/` — VT323, SIL Open Font License 1.1 (`fonts/OFL-VT323.txt`).

Every visible mark is a glyph on the grid. The only continuous motions are the
CRT post and power state; the sign moves cell by cell.
