# Chalkboard — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Story of Chinese Characters* (49.3 s) · `chalkboard.mp4` · `chalkboard.srt` · source in [`demo/`](demo)

A child has left a question in the corner of a freshly wiped classroom board: are (shoot) and (short) swapped? A teacher's voice in Chinese tells the story; a subtitle plate carries each line in Chinese and English. Every fact and its source is in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Online, people say the two characters got swapped: is +, "one inch tall", so it should mean short; is (an arrow) + (to let go), "let an arrow go", so it should mean shoot. The front panel slides away and the back board writes through time: a bow with an arrow, then a hand pulling the string, then the bow bent into and the hand into. has an arrow because arrows were once used as rulers, and (short) has one too: an orange arrow is laid along a line and ticks off lengths. One wipe removes the wrong readings; the right ones are written in the same place, and after a held beat the answer goes under the child's question:, not swapped. The panel slides back for the end card.

Native moves spent: drying wet streak (opening), second hand (the child's question), write–wipe–rewrite in place (the verdict), tracked component in orange (the bow →, the), sliding panel reveal (away and back), chalk as a measuring tool (the arrow-ruler), a line sewing two boards.

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0–2.7 | title / The Story of Chinese Characters written at the top of the front panel | close | |
| 2 | 2.7–5.7 | the wet streak dries; and go into their grids; the child's yellow question and the date | pull to the question frame | drying wet streak, second hand |
| 3 | 5.7–10.7 | close: · underlined and labelled, " / An inch tall?" | close, then widen | |
| 4 | 10.7–17.5 |:, " / Let an arrow fly?", two white crossed arrows | locked medium | the claim |
| 5 | 17.5–18.5 | front panel slides right; whip to the back board; a timeline is drawn | locked, whip | sliding panel |
| 6 | 18.5–21.8 | oracle-bone form: an orange bow with a white arrow | close pan | tracked component |
| 7 | 21.8–24.4 | bronze form: bow and arrow, then a hand lands on the string as the voice names it | pan | |
| 8 | 24.4–28.7 | seal and regular script, the bow orange in both; ← · ← / body ← bow · inch ← hand | pan, push out | |
| 9 | 28.7–33.5 | with an orange; / the arrow is the ruler; the arrow-ruler; an orange line leaves along the bottom | locked medium | chalk as a measuring tool |
| 10 | 33.5–39.7 | the line crosses the seam and circles the under; one wipe; + / bow + hand, + / arrow → length · wei → sound; 1.5 s hold | same frame as shot 4 | write–wipe–rewrite |
| 11 | 39.7–43.0 | ✓ / Not swapped under the child's question | same frame | the verdict |
| 12 | 43.0–45.2 | the whole front wall: both boards, tray, clock at 7:58, window light | pull back, hold | summary |
| 13 | 45.2–49.3 | the front panel slides back; on the clean panel: title and sign-off | locked | end card |

## Voice

Edge TTS `zh-CN-XiaoxiaoNeural` at +15 % (`demo/lines.json`). Readings fixed in `say` only: → (shǐ), → (wěi), → (liáng). Lines start 0.35–0.5 s after the previous one ends; the only longer hold, 1.5 s, comes before the verdict.

| # | Chinese (spoken) | English (subtitle) |
|---|---|---|
| 1 | | People online say the characters and got swapped. |
| 2 | | is (body) plus (inch). One inch tall: isn't that short? |
| 3 | | On the left of is, an arrow; on the right is, to let go. Letting an arrow go: isn't that shooting? |
| 4 | | In fact, the oldest is a bow with an arrow on it. |
| 5 | | Later a hand was added, pulling the string. |
| 6 | | The bow slowly became, and the hand became. |
| 7 | | Why is there an arrow in? People once used arrows as rulers to measure length. That is why (short) has one too. |
| 8 | | means drawing a bow and shooting; means short, and only gives the sound. |
| 9 | | So they were never swapped. |

Subtitles split each line at sentence ends (one cue per sentence, Chinese line over English line), timed by each sentence's share of the spoken characters. An English-voice version uses the same picture: `en-US-AvaNeural` at +10 % (n1, n5, n6 at +14 %, n7 at +12 %; n6 drops "slowly" in the spoken text), the characters read in pinyin (Shè, Ǎi, Shēn, Shǐ, Wěi, Duǎn; as "Tsun"), each line starting with its Chinese line (`demo/lines_en.json`, `sh demo/build.sh en`).

## Score structure

Cold open on room tone and chalk. Two guqin notes mark and finished. From the panel slide, a quiet pulse in D (marimba and pizzicato bass, two notes a second); the oracle-bone bow "sounds" an open A on the guqin and each later form adds a note. A rising marimba run follows the orange line and hangs on a suspended chord through the wipe; the check mark lands on D with a guqin harmonic; the motif plays in full over the wall with a distant bell. The score ducks about 17 dB under the voice and comes up in the pauses. Mix −16 LUFS, true peak −4.0 dBFS before mastering.

## Palette & props

Slate #0f1c15 with slow mottling; white chalk, orange chalk (the bow, the, the arrow-ruler and the line), pale yellow for the child. Front panels with two painted tian-zi grids, a back board with one small grid, wooden frame and stiles, a tray with two white sticks and an orange stub, a wall clock at 7:58, a warm white wall and green dado, a faint window patch on the lower left.

## End card

The front panel slides back over the rewritten board; on the clean right panel / The Story of Chinese Characters and "FilmCode × CommandCode" are written in chalk and held about 3.5 s. The licence credit for the chalk recording (Work With Sounds, CC BY 4.0) is already on that panel in small chalk when it slides back: its strokes are dated before the film starts, so they draw whole and add no chalk sound. The sign-off belongs to this library's demo only; a user's film carries no FilmCode credit and no copy of this card.

## Build notes

- `sh styles/chalkboard/demo/build.sh` (Chinese voice) or `… build.sh en` (English voice, `chalkboard-en.mp4`): fonts and chalk recordings are downloaded, the subtitle font subset is cut (`tools/subset.py`), recordings are sliced into grains (`tools/foley_lib.py`), the voice is made and checked, `events.json` is exported from the page, `audio.py` writes `mix.wav` (or `mix_en.wav`), then render, master, readcheck, `chalkboard.srt` (`tools/srt.py`), poster and gallery frame (picture only, `index.html?nosubs`).
- Code: `index.html` → `js/app.js` (compositor, subtitles, `TEXTS`) → `js/film.js` (every stroke, voice start, subtitle cue and camera key, as data). Engine files are listed in STYLE.md §10. `index.html?lab=hz&chars=…` shows stroke data over the reference font.
- Voice lengths are copied into `VO` in `js/film.js`; the picture is timed from them, so a new voice means new timings.
- The page bakes about 500 strokes on load (about 10 s), then 20–50 ms per 1080p frame.
- Chalk speeds as set here (`speed` in `writeChar` / `writeLine`, in sizes per second): 9–11 for the 520-unit characters, 16–22 for the title and, 40–90 for labels; `lspeed` 90–200 for English. What can be reused, what film.js must give app.js, new characters and the chalk recordings: STYLE.md §10.
- Demo pitfalls: arrows inside English lines on the board are drawn from `hz.js` (the font has none); the bronze form's name is written before its hand so the label can be read while the hand waits for the voice.
