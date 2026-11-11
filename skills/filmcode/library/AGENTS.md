# FilmCode: instructions for agents

This repository is a library of film styles. Each style has a `styles/<slug>/STYLE.md` (what the style is) and `demo/<slug>/DEMO.md` (what its demo looks like). People pick a style and ask for a film about **their own** topic. Your job is to direct and produce that film.

| The request | Go to |
|---|---|
| Any request: first see the user's own styles; no request yet: offer the ways in | **Start** below |
| A film about the user's topic (the normal case) | **Style and story**, **Workflow** below |
| "Which styles are there?" / no style chosen | **Finding the style** below |
| Directing: story, sound, rhythm, camera, maps, checks, delivery | [`DIRECTOR.md`](DIRECTOR.md) |
| Building: install, pages, voice, music, mix | [`TECHNIQUE.md`](TECHNIQUE.md) |
| Tool commands and flags | [`core/README.md`](core/README.md) |
| The user wants to change a style and keep it as their own, or make their own style from a blank page, or names a style in `~/filmcode-my-styles/` | [`MY-STYLES.md`](MY-STYLES.md) |

**Films outside `styles/` are the user's: no FilmCode credit, no watermark.**

## Start

- **Their own styles first.** If `~/filmcode-my-styles/README.md` exists, read it: it lists every style the user has saved, wherever it's kept, and their own styles ([`MY-STYLES.md`](MY-STYLES.md)) count like library styles. When they name a style, look there first, then in the library.
- **Their language.** Talk to them in the language they write in. When they started the skill without writing anything, your first question is always the language, even when their settings, memory or earlier messages suggest one: your agent's question tool (or a plain chat question) headed "Language" with two options, English and Chinese, plus a free-text path for any other language. Use it from then on, and as the film's default language.
- **No request yet** (they only started the skill, or said hello): offer the ways in with one question, using your agent's question tool when available (otherwise a short numbered list), in their language, with the first as the recommended one:
 1. a film in a library style (**Finding the style**);
 2. change a library style and keep it as their own ([`MY-STYLES.md`](MY-STYLES.md));
 3. make their own style from a blank page ([`MY-STYLES.md`](MY-STYLES.md));
 4. a film in one of their own styles, only when they have some (name them).

 When their request already says which, skip the question.

## Style and story

- **`STYLE.md` is fixed**: the style's invariants (look, colour, type, motion, camera grammar, sound palette, native moves, pitfalls). Keep all of it.
- **Everything else is yours to direct** from the user's topic: story, structure, characters, settings, shots, timings, references, how data is charted. Never bend the topic toward the demo.
- **Treatment first, demo later.** Write your own `TREATMENT.md`, with three candidate structures and your choice (DIRECTOR.md §4), before you open the demo note. Then use the style's `STYLE.md` for techniques and the demo only for its look (palette, type, motion), never its story, arc, shots, props or timeline. A style cut from real material (Edit & Documentary) needs its material before the treatment. Demo film sources are outside the installed skill: when `demo/tools/` or other helpers named in a `STYLE.md` aren't available locally, search for material and log each item's page, author and licence yourself, as its `STYLE.md` describes.
- **Scene styles** (a set-up guide, a spec walkthrough, a museum plate, a trail guide) list use cases in their `STYLE.md`. Read them as grammar for the order in which information arrives and how long each part needs on screen, then build the user's content in your own structure. Swapping text into a demo's `content.json` is only a technical check, never the way to deliver.
- Never build inside `styles/`: copy what you need into the film's project folder.

## Finding the style

Users name a style by its gallery name in English or Chinese ("Impasto Oil Painting", "") or by its folder (`impasto`). Look it up in [`styles/README.md`](styles/README.md). If nothing matches clearly, show the closest two or three and ask.

If the user hasn't picked a style:
- Suggest two or three that fit their topic.
- If they have their own styles, list those first, under "My styles" (in their language).
- Show them the full list below in the chat, in the user's language: English names and English category names. Don't drop, merge or rename anything.
- Every style has a demo in the gallery: [https://dv-hoang.github.io/filmcode/demo/](https://dv-hoang.github.io/filmcode/demo/). Notes are in `demo/<slug>/DEMO.md` in the repository; the demo notes and videos are outside the installed skill.
- Then ask them to type the name. The list goes in your own message (a command's output isn't shown to them), and the question is plain text, not a short multiple-choice tool call: its few options would hide the rest of the list.

<!-- style-list:start -->
All 66 styles:

- **Edit & Documentary** (8): Caption News, 1920s Newsreel, Live Countdown Split-screen, Time-lapse Symphony, Visual Investigation, Constructivist Montage, Sports Telestrator, Broadcast News Package
- **Evidence Films** (8): Satellite Briefing, Engineering Briefing Board, LiDAR Survey, Projection on White Model, Data Physicalization, Exploded Teardown, Microscope Story, Archive Light Table
- **Hand-drawn & Painting** (8): Crayon Picture Book, Watercolor Brush, Chinese Ink Wash, Impasto Oil Painting, One-line Drawing, Whiteboard Explainer, Urban Sketch · Pen & Wash, Chalkboard
- **East Asian Traditions** (4): Shadow Puppetry, Ukiyo-e, Red Paper-cut, Paper-cut Lightbox
- **Print & Printmaking** (6): Risograph Print, Halftone Dossier, Woodcut Print, Copperplate Engraving, Silkscreen Travel Poster, Printed Long Take
- **Graphic & Type** (7): Swiss Motion Graphics, 60s Spy Title Sequence, Art Deco, Blueprint, Stained Glass, Pictogram Motion, ASCII / CRT Terminal
- **Information & Keynote** (8): Data Storytelling, Isometric Infographic, Dark Tech Keynote, Living Screencast, Sci-fi Hologram HUD, Transit Map, Isometric Picture Book, Circuit Board
- **Cartoon & Anime** (4): 1930s Rubber Hose Cartoon, 80s Cel Anime, Sci-Fi Sitcom Toon, Mid-century Cartoon
- **Games** (4): 16-bit Pixel RPG, HD-2D, Microgame Frenzy, Game Show Flat
- **Cinema & Eras** (2): 1920s Silent Film, Liminal Found Footage
- **Materials & 3D** (7): Brick Toy, Paper Pop-up Book, Tilt-Shift Miniature, Low-poly Isometric Island, Glass Product Render, Memphis Diorama, Desktop Flythrough
<!-- style-list:end -->

## Workflow

1. **Brief.** Make sure the style and the topic are clear, then ask the user once, in a single message (DIRECTOR.md §1):
 - anything about the topic you can't decide yourself (facts; names, logos or products that must appear);
 - whether they have material of their own: a voice recording or a preferred voice, music, photos, logos, fonts, and for a style built from real material, their own data or scans;
 - the film's language, if it isn't obvious (default: the language they write in or chose, for voice and subtitles);
 - whether they want to review a storyboard first (default: no);
 - anything missing on their machine: first run `sh tools/setup.sh deps` from the library root (core only) and include what it reports. Add the voice and music tiers later, only if the film needs them (TECHNIQUE.md §1).

 Skip what their request already answers. Wait for the reply, fill every other gap with a sensible default, sum up the brief in a few lines and start. Don't come back with more questions.
2. **Treatment.** Write `TREATMENT.md` in the project folder (DIRECTOR.md §4), before you open the demo (an Edit & Documentary style gathers its material first: **Treatment first** above).
3. **Look.** Render style frames or a model sheet with the real drawing code and check them against `STYLE.md` (DIRECTOR.md §5).
4. **Storyboard, only if the user asked for it** (DIRECTOR.md §5). **Stop and wait for approval.** Otherwise don't stop.
5. **Produce.** Voice → check → score (can run in parallel) → animation → mix → render (TECHNIQUE.md).
6. **Self-check and deliver** (DIRECTOR.md §11).

Report progress in the user's language. If a step fails, read the error, fix the cause and retry; go back to the user only for a decision or something only they can provide.

## Where things go

- The film's project folder is `films/<name>/` in a clone (ignored by git), or `<name>/` in the user's folder in skill mode (see the skill's `SKILL.md`). Wherever a guide says `films/<name>/`, read "the project folder". Work only there, unless the user asks you to work in their own project.
- Run `node core/…` and `sh tools/…` from the library root (`$LIB` in skill mode).
- `core/` has ready-made tools (rendering, TTS, speech check, sampler, sfx, mux). Use them or your own stack, but don't edit `core/` or `styles/` for a user's film.
- Never kill processes you didn't start. Don't leave background processes running.
