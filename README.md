# FilmCode

**66 film styles, each with a short film made entirely in code.** Pick a style, bring your own story, and let your AI agent direct the film: a treatment, every frame drawn in code, an original score, a mix, and a finished MP4. No video model, no stock footage.

FilmCode is a self-contained film-style toolkit for AI coding agents (Claude Code, Cursor, Command Code, Codex, and others that load [Agent Skills](https://agentskills.io)). The guides, the 66 style prompts and the rendering tools ship inside the skill, so nothing is cloned or fetched to tell the agent what to do.

## Demo films

Watch every style in the gallery: **[https://dv-hoang.github.io/filmcode/demo/](https://dv-hoang.github.io/filmcode/demo/)**

Watercolor is a 45 s film; Impasto and several hand-drawn, East Asian and print styles are full-length demos; Crayon Picture Book, ASCII / CRT Terminal, Swiss Motion Graphics and Chinese Ink Wash are hand-built 10 s films; the rest are 10 s style teasers. Sources and notes live under [`demo/`](demo/).

## Install

**Command Code** (from this GitHub repo):

```bash
# global: available in every project
cmd skills add dv-hoang/filmcode --skill filmcode --global

# or project-only: .commandcode/skills/filmcode/
cmd skills add dv-hoang/filmcode --skill filmcode

# from a local checkout
cmd --skill ./skills/filmcode
```

**Claude Code / Cursor** (and other agents that load a skills folder):

```bash
# Claude Code (global)
ln -s "$(pwd)/skills/filmcode" ~/.claude/skills/filmcode

# Cursor (project)
mkdir -p .cursor/skills && ln -s ../../skills/filmcode .cursor/skills/filmcode

# Or copy
cp -R skills/filmcode ~/.claude/skills/filmcode
```

Any agent that reads a `SKILL.md` can use the same folder. Point the session at `./skills/filmcode` if your tool loads skills by path.

## Use it

Start the agent in the folder where you want the film to live, then invoke the skill — e.g. `/skill:filmcode` in Command Code, `/filmcode` elsewhere — and ask in your own words:

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
- The styles were tuned for the model that made the demo films. Other models may not reproduce them as closely.

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

## Layout

```
demo/
├── index.html            # demo gallery (GitHub Pages)
├── watercolor/           # DEMO.md + poster.jpg + source/
└── <style>/              # DEMO.md + poster.jpg (+ source/ for full demos)

skills/filmcode/
├── SKILL.md              # agent skill entry point
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

## Updating

Pull a new version of this repository, then refresh the copy or symlink in your agent's skills folder. Re-run setup if the library's `.edition` stamp changed:

```bash
sh skills/filmcode/scripts/setup.sh
```

The vendored library re-copies itself when its `.edition` stamp changes; packages and models stay. To ship a new library build, replace `skills/filmcode/library/` wholesale and update its `.edition` file.

## Licence and credit

MIT. Fonts in `core/fonts/` are OFL; sample libraries and HDRIs keep their own licences (`core/audio/INSTRUMENTS.md`, `core/assets/polyhaven/SOURCES.md`). Films you make are yours.
