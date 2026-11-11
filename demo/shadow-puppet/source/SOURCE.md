# One Lamp Across — source notes

The picture is a function of time. `cue.json` is the clock: voice, subtitles, silences, pole strokes and steps. `film.js` reads it and draws the cloth. `score.py` and `mix.py` read the same file.

`engine/sprites.js` cuts the hide pieces. `engine/rig.js` poses the jointed puppets. `engine/composite.js` is the lamp × transmission × cloth pass. `engine/stage.js` is the lacquer frame, the placard, the rods and the backstage hand.

```sh
./build.sh
```

Needs the FilmCode library at `$LIB` or `~/.filmcode/library`, with the voice tools installed. The script writes `one-lamp-across.mp4`, `one-lamp-across.srt` and `poster.jpg` next to `DEMO.md`. Render intermediates stay in `source/out/` and are gitignored.

Delete `source/tts/voices/` before a rebuild if a spoken line changes. The script skips speech synthesis when `v01.wav` is already there.
