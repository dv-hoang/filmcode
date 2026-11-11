# The Dry Stair — source

40.0 s, 1920×1080, 24 fps. Rebuild from this folder:

```sh
sh build.sh
```

`LIB` defaults to `~/.filmcode/library`. The script speaks six lines with Kokoro `af_heart` if the wavs are missing, checks them, renders the picture, scores, mixes, and muxes to −14 LUFS with a light grain pass.

| File | Role |
|---|---|
| `index.html` | Page contract: `render(t)`, `DUR`, `EV`, `TEXTS` |
| `timeline.js` | The 96 BPM grid, pulls, lines, notes |
| `main.js` | Camera, subtitle strip, screen lift, pine pass |
| `scene.js` | One poster: sun, bands, stair knockout, misprint, band |
| `engine/silk.js` | Paper, ink, ragged pull, squeegee, screen |
| `music/score.py` | Nylon guitar, bass, brushes, harmonica |
| `mix.py` | Foley, voice, the two silences, ducking |
| `tts/lines.json` | Narration |

Output: `the-dry-stair.mp4` beside this file and in `demo/silkscreen-poster/`, plus `poster.jpg` and `the-dry-stair.srt`.

The hosted 10-second card ("The Travel Poster", silent, a winter palette and a grid) is a different film: this one is a misprint story, opens on a lone sun, snaps registration on the hour, scores a folk trio, and ends in a ticket window.
