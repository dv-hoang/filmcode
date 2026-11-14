# Silent Misadventure

**Story**

A lone wanderer in a 1920s cityscape attempts to cross a bustling street. He slips, falls, and then, with a wink, escapes the chaos. The film is a single wide shot, with intertitles and a piano score, evoking the classic silent‑film era.

**Style**

- 4:3 aspect ratio, 1920×1080 canvas (scaled down).
- Ink‑line drawing with silver wash effect (simulated by white strokes on black background).
- Intertitles appear at the top of the frame.
- No sound in the film; audio is a separate WAV file.
- No network access; all assets are generated in code.

**Implementation**

- `film.js` renders the scene frame‑by‑frame using a deterministic `draw(t)` function.
- `audio.py` generates a 10‑second WAV file with simple piano notes and ambient noise.
- The build script (provided by the runner) stitches the frames and audio into an MP4.

---

**Files**
- `index.html` – Canvas setup.
- `film.js` – Rendering logic.
- `audio.py` – Audio generation.
- `DEMO.md` – Build instructions.
- `CREDITS` – Credits.
