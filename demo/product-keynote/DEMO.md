# product-keynote
Watch: [product-keynote.mp4](https://veqhxcsoalfnbsbycnwb.supabase.co/storage/v1/object/public/filmcode-demos/product-keynote.mp4) · poster [poster.jpg](poster.jpg) · source [source/](source/)

**A 10-second software launch film where the interface is the star.**

## Logline
Chaotic desktop → one keystroke → light sweeps the stage → a single giant number remains: **47 focus sessions this week**.

## Style
Dark Product Keynote — near-black gradient, 48 px hairline grid, three surface elevations, 2.5D depth, one saturated cyan accent (#00d4aa), light-as-reveal. Ordered, precise, keynote-grade.

## Runtime
10.0 s @ 1920×1080, 30 fps, stereo 48 kHz.

## Files
- `source/index.html` — canvas + module entry
- `source/film.js` — deterministic `draw(t)` (237 LOC)
- `source/audio.py` — procedural sound design (sfx primitives only)
- `source/SOURCE.md` — technical breakdown
- `source/CREDITS` — attribution

## Build
```bash
./source/build.sh
```
Outputs `product-keynote.mp4` + `product-keynote-poster.png` in the demo root.
