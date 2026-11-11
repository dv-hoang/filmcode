# First Bloom — build notes

A potting-shed lamp, not a journey. One stack of cut card, one cool ladder, one red flower. The camera dollies, racks focus, and at 32 s pulls out of the box onto the table.

Picture: Canvas2D sheets on three.js planes, a backlight shader, analytic match burst (no radial-gradient texture), `core/three/post.js` for depth of field, bloom and vignette at 2×. Grade keys are set from scratch every frame. 1920×1080, 24 fps, on ones.

```sh
LIB=$HOME/.filmcode/library sh demo/paper-lantern/source/build.sh
```

Voice is Kokoro `af_heart` (`tts/lines.json`). The score is `music/score.py` (music box, koto, kalimba). `mix.py` writes `out/mix.wav` and `cues.json`. `core/render/mux.sh` masters to −14 LUFS.

Style rules: `styles/paper-lantern/STYLE.md` in the FilmCode library. Treatment: `TREATMENT.md`.
