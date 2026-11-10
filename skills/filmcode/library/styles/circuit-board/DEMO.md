# Circuit Board — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Seven Milliseconds* (60 s, Chinese voice-over, bilingual subtitles) · `circuit-board.mp4` · source in [`demo/`](demo)

## Story & structure

Power made deep in the mountains of Sichuan reaches Jiangsu, 2,000 km away, in seven milliseconds. A Chinese voice (edge-tts Xiaoxiao, +20%) tells it as a friend would: household power swings back and forth (alternating current); sent that far it would be lost on the way; so a converter station turns it into one-way direct current; it races 2,080 km in 7 ms; at the other end it is turned back, stepped down level by level and sent to a wall socket; inside a phone charger a tiny bridge rectifier does the same job as the giant in the converter station, on the same circuit principle, with 400 million times less power. Every line has a subtitle (Chinese over English, bottom safe area); the board itself only prints the voice's key words and numbers ( / AC, / LOSS, 2,080, 7, 4). Facts: [`demo/FACTS.md`](demo/FACTS.md).

Native moves spent: flow becomes current (dam), pulse-path explainer (the whole film), AC vs DC told by the shape of the light (bus close-up, loss board, Butuo), the map is a board (corridor), matched step-down (four cuts), plunge through a hole (socket → charger), detail callout (verdict), nested boards (closing pull-out).

## Shots

| # | Time | Voice (first words) | Shot | Camera | Note |
|---|---|---|---|---|---|
| 1 | 0–4.7 | … | Baihetan: water through 16 penstocks, generators light on 16ths; title / SEVEN MILLISECONDS top right | macro on G1 at frame 0, pull-out ×10 by 2.0 s, hold | flow becomes current |
| 2 | 4.7–10.1 | … | the right-bank bus close up: big AC dashes swinging slowly back and forth; / AC with a silk sine | push in, hold | the swing slowed to ~0.55 Hz |
| 3 | 10.1–14.4 | … | a long straight board: AC dashes move on, dimmer, thinner and fewer; / LOSS | slow pan right | stand-alone board |
| 4 | 14.4–19.1 | … | Butuo: AC in, the bridge conducts at 16.3, two DC streams out;, | slow push, whip east at 18.75 | |
| 5 | 19.1–23.5 | … | the corridor: rides the DC head, rises until both ends are in frame; / large, 2,080 | ride → rise → crash zoom at 23.0 | main line ≥ 6.5 px wide at map scale |
| 6 | 23.5–29.6 | … / … | Yucheng: 7 / 7 ms tag; at 27.4 AC leaves ( / AC) | locked | reading hold |
| 7 | 29.6–32.4 | …… | four step-down transformers T1–T4 at one screen size, 0.7 s each; / STEP DOWN stays in the same place | matched cuts | |
| 8 | 32.4–34.6 | … | the block flashes by; the socket wall (switch, two sockets, L/N/PE wiring); plunge into the live hole | pan, hold, plunge | |
| 9 | 34.6–42.1 | … | out of the charger's pin: the whole charger (plug, fuse, bridge, capacitor, transformer, USB-C), / CHARGER; push in to the bridge:, → | reverse out, hold, push | |
| 10 | 42.1–52.9 | … / … | detail callout: Butuo's bridge beside DB1 at the same size; "=" and at 47.6; 4 at 49.4 | locked | verdict held 5.4 s before "=" |
| 11 | 52.9–54.5 | … | one pull-out from the charger to the whole board, the main line glowing | log zoom | |
| 12 | 54.5–60 | — | the whole board on a desk, noon window light; title block: / SEVEN MILLISECONDS, FilmCode × Claude | slow push, 2° turn | end card |

## Voice-over

Chinese voice, edge-tts `zh-CN-XiaoxiaoNeural` at +20% (`demo/voice/lines.json`); each line starts at the time below, and its subtitle (Chinese over English) comes and goes with it. The English version (`sh demo/build.sh en`) speaks the English subtitle lines with `en-US-AvaNeural` at +10% (a few lines faster, up to +25%), starting at the same moments (`demo/voice_en/lines.json`; where a spoken line is shorter than its subtitle, the `say` field holds what is spoken).

| # | Start | Chinese | English |
|---|---|---|---|
| 1 | 0.40 s | | Power made deep in the mountains of Sichuan reaches Jiangsu, 2,000 km away, in just 7 milliseconds. |
| 2 | 5.58 s | | The electricity in our homes swings back and forth as it flows. It's called alternating current, AC. |
| 3 | 10.22 s | | Sent that far as it is, a lot of it would simply be lost on the way. |
| 4 | 14.55 s | | So first it goes through a converter station and becomes direct current, DC, flowing one way only. |
| 5 | 19.24 s | | Then it races along this line, more than 2,000 km long, all the way to Jiangsu. |
| 6 | 23.53 s | | The whole trip takes 7 milliseconds, less than the blink of an eye. |
| 7 | 27.15 s | | At the end it's turned back into AC, stepped down level by level, and sent to the socket in your wall. |
| 8 | 34.20 s | | Plug in your phone charger, and inside it a tiny part called a bridge rectifier turns the AC back into DC. |
| 9 | 42.24 s | | Believe it or not, it works on the same circuit principle as the giant, storeys tall, in the converter station. |
| 10 | 48.39 s | | Only the station's power is a full 400 million times that of this little charger. |
| 11 | 53.05 s | | Every bar of charge on your phone came this far, across mountains and rivers. |

## Score structure

Voice first: the bed (music and room tone) is ducked 9.5 dB under each line and sits about 17 dB under the voice; effects drop 7 dB. 100 BPM, G (the mains hum on G1). AC is a gated tone (slowed to 1.1 Hz while the voice explains it, dying away over the loss board); at Butuo (16.3) the gate smooths into a steady tone, the kick, ticks and bass enter, an arpeggio climbs through the ride with a glockenspiel at each 500 km pad; impact at 23.0, a bell for 7 ms, AC again at 27.4, four relays one step lower each, cicadas and an air-conditioner drone at the socket, suction and a pop through the hole; in the charger a faint whine, a high gated tone that smooths at the bridge (39.4); in the verdict a low tone (the station) under the high one, a clean G major chord on "=". Pull-out whoosh and pad, the last hit at 54.8, the hum to the end. −16.0 LUFS integrated, −4.5 dBTP.

## Palette & props

Mask greens #05190F / #1C6A44 / #4AA977, gold #D9B25B, bare-copper dam bar #C9784A, silk #F2EEE1, current amber (255,190,84), water silver (170,214,226). Props: the dam with 16 penstocks and generators (a step-up coil on every lead), connector J2; the bridge footprint (a diamond package with four diode symbols and a pad at each vertex: AC in at the left, return via at the right, + top, − bottom), converter transformers, AC filter banks, smoothing reactors, valve-hall courtyards; the corridor geography (octilinear Yangtze with five tributaries, four lakes, the east coast, the board's south-east corner cut at 45° over open sea so its edge stays clear of Taiwan, real cities as test points, three more unlit ±800 kV lines); the loss board (one long bus, a ruler, test points); a city module (streets as channels, buildings as pad grids); a street module (a block of 18 floors as a lit pad array, pole transformer, a socket wall with a switch and a second socket, L/N/PE wiring, a sun and a clock at noon); the charger (plug blades, L/N pads, F1, RV1, CX1, DB1, C1, T1 over an isolation slot, CY1, U1, U2, C2, USB-C).

## End card

The board's own title block, top right of the corridor board, plotted at 54.8: (≈ 75 px) / SEVEN MILLISECONDS; at 56.0 the row FilmCode × Claude (≈ 25 px caps); REV A / SHEET 1 OF 1 in its corner. No voice after 57.0; held to 60.0 under the window light. The "FilmCode × Claude" sign-off belongs to this library's demo only; a user's film carries no FilmCode credit and no copy of this card.

## Build notes

- One command: `sh styles/circuit-board/demo/build.sh` (Chinese voice → `circuit-board.mp4`) or `sh styles/circuit-board/demo/build.sh en` (English voice → `circuit-board-en.mp4`). It cuts the subtitle font, voices and checks every line, exports the events, scores and mixes, renders, masters, writes `circuit-board.srt`, runs the reading-time check and renders the poster and gallery still without the subtitle bar.
- Which files in `src/` are reusable and which are this film's content, and the world-module and scene interfaces: [`STYLE.md`](STYLE.md) §10.
- Files in `demo/`: `index.html`; `src/main.js` (timeline: cameras, scenes, subtitles, sound events), `src/world.js` (corridor board, 1 unit ≈ 1 km), `src/city.js` (10 m), `src/house.js` (10 cm), `src/charger.js` (mm), `src/loss.js` (the loss board), `src/levels.js` (nesting), `src/render.js`, `src/post.js`, `src/parts.js`, `src/geo.js`, `src/font.js`, `src/hanzi.js`, `src/palette.js`; `voice/` and `voice_en/` (`lines.json`, `dur.json`), `data/subs_en.json` (English subtitles); `audio.py` → `mix.wav` / `mix_en.wav`; `tools/subset.py` (subtitle font), `tools/srt.py` (subtitles file), `tools/sheet.sh` (0.5 s contact sheet into `out/`).
- Reading time: `window.TEXTS(t)` reports every word printed on the boards and `readcheck.mjs` passes on all of them. The subtitle bar follows the voice (about 5.6 characters a second), so it is reported only with `--q subs=1`. `?nosub=1` renders without subtitles.
- The page always draws at 1920×1080 and is scaled by CSS, so stills at other sizes keep the framing. 1080p frames take 30–75 ms, about 180–270 ms in the pull-out (several nested boards plus motion-blur sub-frames).
- Demo-specific pitfalls: the sending station is reported both as and (the voice and screen only say); the dam complex is drawn about 50× its map scale, so the river's first reach is schematic; the AC bus and the DC pair cross the river (a trace may cross a bare channel); the four step-down cuts use one on-screen symbol size (300 px), so each transformer's world size follows from its cut's zoom, and the label sits at the same screen place in all four so it reads as one; keep picture text above the subtitle band.
