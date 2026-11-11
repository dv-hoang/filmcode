# FilmCode

**66 film styles, each with a short film made entirely in code.** Pick a style, bring your own story, and let your Command Code agent direct the film: a treatment, every frame drawn in code, an original score, a mix, and a finished MP4. No video model, no stock footage.

FilmCode is a self-contained film-style toolkit for Command Code. The guides, the 66 style prompts and the rendering tools ship inside the skill, so nothing is cloned or fetched to tell the agent what to do. Demo film sources and large assets are left out.

## Install

Command Code installs skills from a GitHub repository:

```bash
# global: available in every project
cmd skills add dv-hoang/filmcode --skill filmcode --global

# or project-only: .commandcode/skills/filmcode/
cmd skills add dv-hoang/filmcode --skill filmcode
```

From a local checkout, point a session at the skill directly:

```bash
cmd --skill ./skills/filmcode
```

Or copy `skills/filmcode/` into `~/.commandcode/skills/` (global) or `.commandcode/skills/` (project).

## Use it

Start Command Code in the folder where you want the film to live, then:

```bash
/skill:filmcode
```

The namespaced form always resolves to the skill. `/filmcode` also works unless a built-in or custom command owns that name.

Then ask in your own words:

> Make a 45-second film in the **watercolor** style about the coffee farm my family runs. Warm female narrator.

> Make a 40-second **LiDAR Survey** film about the old quarry in the hills behind our town, from public laser-scan data.

> Make a 30-second **whiteboard explainer** about how vaccines train the immune system.

> Which film styles are there? I want something for a product launch.

> I want to change the **Ukiyo-e** style into my own version.

> Start from a blank page: chalk on a blackboard, warm and slow.

Name a style, or describe your topic and let the agent suggest two or three. It asks once, up front: anything about your topic it can't decide, whether you have your own voice, music or photos, and whether you want a storyboard first. Films go in a project folder in your working directory.

## Before you start

- **Node 20+, ffmpeg 7+ and Python 3.11+** (or [uv](https://docs.astral.sh/uv/)). The agent reports anything missing; install system tools yourself. Ubuntu 24.04's ffmpeg 6.1 is too old: use a static build.
- A film takes an agent a while and a fair amount of tokens. Default output is 1920x1080 at 24 fps.
- The styles were tuned for the model that made the original demo films. Other models may not reproduce them as closely.

## What happens on first use

`skills/filmcode/scripts/setup.sh` copies the bundled library to `~/.filmcode/library` (set `FILMCODE_HOME` for another folder). Packages install there, so they survive skill updates; nothing is installed system-wide. The agent installs only what the film needs:

| What | From | When |
|---|---|---|
| Node packages: `playwright-core`, `three` | npm | first film |
| Headless Chromium for frame-by-frame rendering | Playwright's download servers | first film |
| Python packages: numpy, scipy, soundfile, soxr, pillow | PyPI | first film |
| Voice tier: kokoro-onnx, edge-tts, faster-whisper | PyPI | only for a film with narration |
| Kokoro voice model | this project's GitHub Releases (or `FILMCODE_ASSETS_REPO`) | only for narration |
| Whisper model for the speech check | Hugging Face (or `HF_ENDPOINT`) | first narration check |
| Instrument samples, HDRIs, textures | this project's GitHub Releases (or `FILMCODE_ASSETS_REPO`) | only styles and scores that use them |
| Fonts, style-specific packages, public data | Google Fonts, npm/PyPI, open-data sources | only when the film needs them |

Asset packs (voice model, instruments, HDRIs, textures) download from this repository's `assets` release. Set `FILMCODE_ASSETS_REPO=<owner>/<repo>` to fetch them from another mirror.

Chinese narration uses offline Kokoro by default. edge-tts sounds better but sends the narration text to Microsoft's speech service; the agent asks first and uses it only if you agree.

## Demo video

Every style has a demo: Watercolor is a 45 s film, Crayon Picture Book, ASCII / CRT Terminal and Swiss Motion Graphics are hand-built 10 s films, and the other 62 styles are 10 s style teasers. Every video plays in [`demo/index.html`](demo/index.html). Enable GitHub Pages (Settings -> Pages -> Deploy from a branch -> `main` / root) and open `https://dv-hoang.github.io/filmcode/demo/`.

## Layout

```
demo/
├── index.html            # demo gallery (GitHub Pages)
├── watercolor/           # DEMO.md + poster.jpg + source/
└── <style>/              # DEMO.md + poster.jpg

skills/filmcode/
├── SKILL.md              # Command Code entry point
├── scripts/setup.sh      # copies the vendored library out, installs packages
└── library/              # self-contained library
    ├── AGENTS.md         # how the agent works
    ├── DIRECTOR.md       # how to direct
    ├── TECHNIQUE.md      # how to build, voice, score, mix
    ├── MY-STYLES.md      # change a style or make your own
    ├── styles/<slug>/    # 66 x STYLE.md
    ├── core/             # renderer, TTS, speech check, audio, fonts
    └── tools/            # setup.sh, fetch.sh, asset manifest
```

Your saved styles live in `~/filmcode-my-styles/<name>/`, outside the installed skill, so updates never touch them.

## What differs from the original edition

- Installed with `cmd skills add` and invoked as `/skill:filmcode` instead of a plugin marketplace.
- `${COMMANDCODE_SKILL_DIR}` replaces the skill-base placeholder.
- `AskUserQuestion` is mapped to `ask_user_question` (max 4 questions per call, 2-4 options, labels 1-5 words, explanation in `description`); free-text replies are always offered.
- Commands run through `shell_command`; long installs and renders use background tasks.
- The library is vendored, so a missing network or upstream repository change cannot break the skill.
- User-facing names, paths and environment variables are rebranded: `FILMCODE_HOME`, `~/.filmcode/library`, `~/filmcode-my-styles`.

## Updating

Reinstall the skill after pulling a new version:

```bash
cmd skills add dv-hoang/filmcode --skill filmcode --global --force
```

The vendored library re-copies itself when its `.edition` stamp changes; packages and models stay. To ship a new library build, replace `skills/filmcode/library/` wholesale and update its `.edition` file.

## Licence and credit

MIT. Based on an MIT-licensed open-source film-style library. The upstream demo films and stills are CC BY 4.0 and are not included here. Fonts in `core/fonts/` are OFL; sample libraries and HDRIs keep their own licences (`core/audio/INSTRUMENTS.md`, `core/assets/polyhaven/SOURCES.md`). Films you make are yours.
