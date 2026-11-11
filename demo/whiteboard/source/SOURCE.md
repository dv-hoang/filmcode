# The Open Top — source

A 40-second Whiteboard Explainer. Heat leaves a mug through the open top; a lid closes that door.

Not the library demo (*Einstein in Your Pocket*) and not the old 10-second card (“The Garden That Waited”).

## Build

```bash
export LIB="$HOME/.filmcode/library"
sh build.sh
```

`build.sh` checks on-screen reading time, renders 1920×1080 at 24 fps, writes the score, mixes to about −14 LUFS, and outputs:

- `../the-open-top.mp4` — the film
- `../the-open-top.srt` — subtitles
- `../poster.jpg` — poster frame
- `out/video.mp4`, `out/mix.wav`, `events.json`, `music/music.wav` — intermediates

Those outputs are gitignored. Voice WAVs in `tts/voices/` are inputs.

## How it differs from the library demo

| | This film | Library demo |
|---|---|---|
| Structure | Two mugs, a wrong sentence wiped in the middle | GPS in steps, a joke, then a fix |
| Opening | A heat magnet drops on an empty board | A map pin, then a scale reveal |
| Signature | The eraser rewinds “cold cup”, then the lid is drawn | A pin drifts, then time is rewound |
| Camera | Ends by pushing into the word “lid” | Ends by pulling past the frame to the wall |
| Score | Kalimba and nylon guitar, one tempo, a silence before the wipe | Marimba clockwork at 120, two tempi, cue reversed on the rewind |
| Ending | The word circled twice, the pen capped | An end card written under the title |
