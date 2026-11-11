# Eighth Fold — build notes

40.0 s, 1920×1080, 24 fps, stereo, about −14 LUFS, no film grain.

```
demo/papercut-red/source/
  index.html   page contract (render, DUR, EV, TEXTS)
  main.js      boot
  film.js      shots, rig, fold, channel, lamp
  paper.js     grain, wobble, holes, inset slits, rims
  timeline.js  duration, unfold times, foley events
  cues.json    subtitle intervals (also the .srt source)
  tts/         Kokoro lines
  music/score.py
  mix.py
  cuecheck.py
  build.sh
```

`LIB` defaults to `$HOME/.filmcode/library`. From the library root the picture tools are `node core/render/…`. One command:

```
sh demo/papercut-red/source/build.sh
```

That runs voice (if the wavs are missing), the speech check, events, the cue check, the reading-time check, the 24 fps picture, the score, the mix, and `mux.sh` with grain 0. The film and poster land next to `DEMO.md`.

The library demo of this style is a different film (a New Year threat, a rosette, a dawn window). This one does not reuse that story, that opening, that signature shot, that camera path, that score shape, or that ending.

Checked against the style: red on indigo, not red on red; characters step at 12 fps and the camera, boat and lamp move at 24; one gold foil lamp, late; subtitle banner darker than the sheet; title letters are cut paper, held after the last letter pops.
