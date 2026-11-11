# The Crossing — build notes

40 s, 1920×1080, 24 fps. Two plates: teal in R, fluorescent pink in G. The shader
prints halftone, misregistration, pinholes and a roller. Camera moves on ones;
boats and figures step on twos.

```
source/
  index.html, main.js     page, voice timing, cues
  timeline.js             the only clock
  scene.js                harbour, boats, sheet, type
  draw.js                 knockouts, overprint, halo
  riso.js                 WebGL2 print
  music/score.py          bass, marimba, nylon, toy piano
  mix.py                  foley, ducked voice, score
  build.sh                one command
```

`sh source/build.sh` from this folder, or with `LIB` set to the FilmCode library.
It speaks the lines, checks them, renders, scores, mixes to about −14 LUFS and
writes `the-crossing.mp4`, the `.srt` and `poster.jpg`.
