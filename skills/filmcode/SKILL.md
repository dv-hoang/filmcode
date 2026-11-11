---
name: filmcode
description: Direct and produce a short film made entirely in code, in one of the 66 styles of the FilmCode library (e.g. Impasto Oil Painting, Watercolor Brush, Ukiyo-e, Satellite Briefing, Exploded Teardown). Use when the user asks for a video, film, short, promo, explainer or animation in a named visual style, including explainers built from real material such as satellite imagery, laser scans, CAD files or archive scans, and films cut from real archive footage and documents; when they want a film about their own topic and haven't chosen a style; when they want to change a style into their own, make one from a blank page, or use a saved style; when they start the skill without a request; or when they ask which film styles exist. Not for plain editing, trimming or converting the user's existing video files.
license: MIT
compatibility: Renders locally with Node 20+, ffmpeg 7+ and Python 3.11+ (or uv). macOS, Linux, or Windows via Git Bash.
when_to_use: A film, short video, promo, explainer, animation or motion graphics in a named visual style; choosing a film style; making or customising a style; asking what styles exist.
---

# FilmCode

The 66 styles, the guides and every production tool ship in `library/` next to this file. Nothing is cloned or downloaded to tell you what to do, and no video model is involved: every frame, note and cut is written as code and rendered locally.

## Start here

1. **Get the library ready.** Run `sh "${COMMANDCODE_SKILL_DIR}/scripts/setup.sh"` with `shell_command`. On first use it copies the bundled library to its working folder (`~/.filmcode/library` by default; override with `FILMCODE_HOME`) so installed packages survive skill updates, then prints `LIB=<path>` on its last line. Use that path as `$LIB`.
2. **Install the core tools early.** Start `sh "${COMMANDCODE_SKILL_DIR}/scripts/setup.sh" deps` right away, in the background if you can (`run_in_background: true`): the first run takes a few minutes. Add `deps voice` or `deps music` later, only if the film needs them (`$LIB/TECHNIQUE.md` section 1). Report missing system tools (Node, ffmpeg, Python) in your one round of questions; don't install system software yourself. Packages a style needs (its `STYLE.md` lists them) you install yourself, into the project folder.
3. **Follow the library.** Read `$LIB/AGENTS.md` and do what it says, starting with **Start** (the user's own styles in `~/filmcode-my-styles/`; when they started the skill without writing anything, the language question first, then the ways in): finding the style or making their own, the one round of questions, the treatment, production and delivery.

## Command Code specifics

The library's guides were written for an agent with slightly different tooling. Translate as you read:

| The library says | In Command Code |
|---|---|
| `AskUserQuestion` | `ask_user_question`: at most 4 questions per call, 2-4 options each. A free-text reply is always offered, so you don't need an "Other" option |
| an option "with one line on what it does" | Keep the label to 1-5 words and put that line in the option's `description` |
| "the tool adds Other" | Command Code always offers a free-text reply |
| run a command | `shell_command`, with `cwd` set to `$LIB` for `node core/...` and `sh tools/...`; `run_in_background: true` for long installs and renders |
| read a guide, style or source file | `read_file` with an absolute path under `$LIB` or the project folder |
| `films/<name>/` | the project folder: `<name>/` in the folder the user started Command Code from. Never build inside `$LIB` or `styles/` |

Keep the film's project folder in the user's working directory, not in the installed skill. Report progress in the user's language.

## What changes in skill mode

| | |
|---|---|
| Project folder | `<name>/` in the folder the user started from (lowercase letters, digits, hyphens; avoid `#` and `?` in the path). Wherever the guides say `films/<name>/`, read this folder |
| Running tools | from `$LIB`, with the project's absolute path: `cd "$LIB" && node core/render/still.mjs "<project>" 1.5 3`. `sh tools/setup.sh` and `sh tools/fetch.sh` also run from `$LIB` |
| Library files in pages | absolute URLs: `/core/lib.js`, `/node_modules/three/...` (the project is served at `/@film/`) |
| Library files in scripts and `build.sh` | `$LIB/...`, with `LIB=<path>` at the top of `build.sh`; never `../..` |
| Demo films | Only the Watercolor demo is bundled: `styles/watercolor/watercolor.mp4` (poster `poster.jpg`). Each style's `DEMO.md` describes how its demo was made; read it only after your `TREATMENT.md` is written. Other demo videos are not included, and neither are `demo/` sources: an Edit & Documentary style's material must be found and logged yourself, as its `STYLE.md` describes |
| Chinese narration | Kokoro's Chinese voices (offline) by default. edge-tts (`core/tts/tts_zh.py`) sounds better but sends the narration text to Microsoft's speech service: offer it in your one round of questions and use it only if the user agrees |
| Big downloads | only what the film needs, from the sources `$LIB/TECHNIQUE.md` section 1 lists (npm, PyPI, Playwright's browser, the upstream project's GitHub Releases, Hugging Face for the speech check). Name them in your one round of questions the first time |

Deliver what `$LIB/DIRECTOR.md` section 11 lists, in the project folder, and tell the user where it is.
