# One Rectangle — source

40.0 s, 1920×1080, 24 fps. Rebuild from this folder:

```sh
sh build.sh
```

`LIB` defaults to `~/.filmcode/library`. The script speaks the four lines with Kokoro `af_heart` if the wavs are missing, checks them, renders the picture, scores, mixes, and muxes to −14 LUFS with no film-grain pass (the paper is already in the picture).

| File | Role |
|---|---|
| `index.html` | Page contract: `render(t)`, `DUR`, `EV`, `TEXTS` |
| `main.js` | Camera, subtitle cartouches, cue list |
| `scene.js` | Two impressions of one shore, the figure, the tide |
| `print.js` | Paper, woodgrain, baren, specks, bokashi, seals |
| `music/score.py` | Shamisen, shakuhachi, koto |
| `mix.py` | Foley, voice, ducking, the two silences |
| `tts/lines.json` | Narration |

Output: `one-rectangle.mp4` beside this file and in `demo/ukiyoe/`, plus `poster.jpg` and `one-rectangle.srt`.
