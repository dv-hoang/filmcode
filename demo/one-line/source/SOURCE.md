# The Mend — source

Original One-line Drawing film. One continuous ink line on warm paper: a thread leaves a spool, tires, snaps, and is finished in gold by a smaller hand. Pulled back, the path is a blanket, and the thread runs off the frame.

## Build

```bash
export LIB="$HOME/.filmcode/library"
sh build.sh
```

`build.sh` speaks the lines (Kokoro `af_heart`), checks them, renders 1920×1080 at 24 fps, writes the violin score, mixes to the picture, and muxes at −14 LUFS with grain 0.

Outputs, next to this folder's parent:

- `../the-mend.mp4`
- `../poster.jpg`
- `../the-mend.srt`

Regenerated and gitignored: `out/`, `stills/`, `music/music.wav`, `events.json`, `cues.json`, and `the-mend.mp4` inside this folder.

## Picture

`scene.js` is the drawing: SVG polylines and the chapter clock. `engine/geom.js` samples them by arc length and spends more time on sharp turns. `engine/ink.js` fills the ribbon (pressure, bleed, dry brush, one gold stretch, a teardrop blot). `engine/paper.js`, `engine/cam.js`, `engine/hands.js` and `engine/subs.js` are the paper, the camera, the shadows and the written type.

`?all=1` draws the finished path. `?nopen=1` hides the pen shadow. `?nosub=1` hides type. `?cam=x,y,zoom` locks the camera.

## Audio

`tts/lines.json` is the narration. `music/score.py` is one violin line, with the bus cut to silence from 14 s to 16 s. `mix.py` builds the pen scratch from the nib track in `events.json`.
