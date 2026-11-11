#!/usr/bin/env python3
"""Build demo/teaser/styles.json from the style library.

Each entry gets a new topic, a palette parsed from STYLE.md, a typeface class and
a motion motif. Watercolor is excluded because it already has a full demo.
"""
import colorsys
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STYLES = ROOT / "skills" / "filmcode" / "library" / "styles"
OUT = Path(__file__).resolve().parent / "styles.json"

TOPICS = {
    "Edit & Documentary": [
        "The Last Dispatch", "Nine Minutes of Rain", "A City at Four in the Morning",
        "The Archive Drawer", "Signal Lost", "The Long Route Home",
        "One Frame of Evidence", "The Quiet Deadline",
    ],
    "Evidence Films": [
        "The Forest Under the Forest", "A Map of Moving Water", "The Weight of a Shadow",
        "Traces in the Concrete", "The Missing Kilometre", "What the Ice Kept",
        "The Shape of a Street", "Three Centimetres of Time",
    ],
    "Hand-drawn & Painting": [
        "The Orchard at First Light", "A House Made of Rain", "The Colour of Distance",
        "Paper Boats at Dusk", "The Garden That Waited", "A Window Facing North",
        "The Last Sketchbook", "Morning, Painted Slowly",
    ],
    "East Asian Traditions": [
        "The Lantern Keeper", "A River in Winter", "The Mountain That Moved",
        "Ten Thousand Cranes",
    ],
    "Print & Printmaking": [
        "The Ink Workshop", "A City in Six Colours", "The Paper Route",
        "The Bell Foundry", "The Travel Poster", "The Woodcutter's Map",
    ],
    "Graphic & Type": [
        "The Grid System", "A Signal in Red", "The Type Specimen",
        "Fifty Years of Posters", "The Diagonal Rule", "One Colour Only",
        "The Moving Sign",
    ],
    "Information & Keynote": [
        "The Quiet Launch", "A Product in Three Acts", "The Data Behind the Day",
        "The Map of a Decision", "The Room That Thinks", "Everything on One Screen",
        "The Slow Reveal", "The Case for Less",
    ],
    "Cartoon & Anime": [
        "The Late Delivery", "A Robot's Day Off", "The Cat in the Rain",
        "The Last Arcade",
    ],
    "Games": [
        "The Final Save", "A Level Without a Map", "The Bonus Round", "Player Two",
    ],
    "Cinema & Eras": [
        "The Silent Projector", "A Night in 1927",
    ],
    "Materials & 3D": [
        "The Table of Objects", "A City on a Desk", "The Glass Prototype",
        "The Paper Machine", "The Model Room", "The Weight of Light",
        "The Object in Pieces",
    ],
}

TYPE_BY_CATEGORY = {
    "Edit & Documentary": "sans",
    "Evidence Films": "mono",
    "Hand-drawn & Painting": "serif",
    "East Asian Traditions": "serif",
    "Print & Printmaking": "serif",
    "Graphic & Type": "sans",
    "Information & Keynote": "sans",
    "Cartoon & Anime": "display",
    "Games": "mono",
    "Cinema & Eras": "serif",
    "Materials & 3D": "sans",
}
MOTIFS = ["grid", "rings", "bands", "orbit", "columns", "wave"]
HEX = re.compile(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b")
FALLBACK = {"bg": "#f2ede2", "ink": "#171717", "accent": "#d2402f", "support": "#6f7f8f"}
CATEGORY_PALETTES = {
    "Edit & Documentary": {"bg": "#f4f1e8", "ink": "#121417", "accent": "#d2402f", "support": "#2a5cb3"},
    "Evidence Films": {"bg": "#f2eee1", "ink": "#101a16", "accent": "#d9b25b", "support": "#1c6a44"},
    "Hand-drawn & Painting": {"bg": "#f4efe3", "ink": "#1d1a17", "accent": "#d2402f", "support": "#2e8b57"},
    "East Asian Traditions": {"bg": "#f2ecde", "ink": "#1f1a17", "accent": "#b02e22", "support": "#3a4a3f"},
    "Print & Printmaking": {"bg": "#f5f0e6", "ink": "#171717", "accent": "#c8363a", "support": "#2a5cb3"},
    "Graphic & Type": {"bg": "#f2f2f0", "ink": "#111111", "accent": "#e2483d", "support": "#6b4ce6"},
    "Information & Keynote": {"bg": "#0f1419", "ink": "#f2f2f2", "accent": "#4e7cf6", "support": "#19b388"},
    "Cartoon & Anime": {"bg": "#fff6e5", "ink": "#1f1a17", "accent": "#f2c14e", "support": "#e0543a"},
    "Games": {"bg": "#111318", "ink": "#f2f2f2", "accent": "#ff2e88", "support": "#1fd1d1"},
    "Cinema & Eras": {"bg": "#121212", "ink": "#f2ede2", "accent": "#d9b25b", "support": "#8a1c1c"},
    "Materials & 3D": {"bg": "#ece9e2", "ink": "#1d1a17", "accent": "#d97757", "support": "#2a5cb3"},
}


def rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lum(h):
    r, g, b = (c / 255 for c in rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def sat(h):
    r, g, b = (c / 255 for c in rgb(h))
    return colorsys.rgb_to_hsv(r, g, b)[1]


def palette(colors, category):
    base = dict(CATEGORY_PALETTES.get(category, FALLBACK))
    colors = list(dict.fromkeys(c.lower() for c in colors))
    if not colors:
        return base
    ordered = sorted(colors, key=lum)
    if len(ordered) == 1:
        c = ordered[0]
        if sat(c) > 0.35 and abs(lum(c) - lum(base["bg"])) > 0.25:
            base["accent"] = c
        elif abs(lum(c) - lum(base["bg"])) > 0.25:
            base["support"] = c
        return base

    median = lum(ordered[len(ordered) // 2])
    if median < 0.45:
        bg, ink = ordered[0], ordered[-1]
    else:
        bg, ink = ordered[-1], ordered[0]
    if abs(lum(bg) - lum(ink)) < 0.35:
        bg, ink = base["bg"], base["ink"]

    rest = [c for c in colors if c not in (bg, ink)]
    accent = max(rest, key=sat) if rest else base["accent"]
    if sat(accent) < 0.18 or abs(lum(accent) - lum(bg)) < 0.12:
        accent = base["accent"]
    support = next((c for c in rest if c != accent and abs(lum(c) - lum(accent)) > 0.05), base["support"])
    return {"bg": bg, "ink": ink, "accent": accent, "support": support}


def main():
    entries = []
    for p in STYLES.glob("*/style.json"):
        d = json.loads(p.read_text(encoding="utf-8"))
        if d["slug"] == "watercolor":
            continue
        text = (p.parent / "STYLE.md").read_text(encoding="utf-8")
        colors = [c.lower() for c in HEX.findall(text)]
        entries.append({
            "slug": d["slug"],
            "en": d["en"],
            "category": d["category_en"],
            "num": int(d["num"]),
            "topic": None,
            "colors": palette(colors, d["category_en"]),
            "type": TYPE_BY_CATEGORY.get(d["category_en"], "sans"),
            "motif": MOTIFS[int(d["num"], 10) % len(MOTIFS)] if d["num"].isdigit() else MOTIFS[0],
            "seed": sum(ord(c) * (i + 1) for i, c in enumerate(d["slug"])),
        })

    for cat, topics in TOPICS.items():
        group = sorted([e for e in entries if e["category"] == cat], key=lambda e: e["num"])
        for i, e in enumerate(group):
            e["topic"] = topics[i % len(topics)]

    entries.sort(key=lambda e: e["num"])
    OUT.write_text(json.dumps(entries, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    missing = [e["slug"] for e in entries if not e["topic"]]
    print(f"{len(entries)} teasers -> {OUT.relative_to(ROOT)}")
    if missing:
        print("missing topics:", ", ".join(missing))


if __name__ == "__main__":
    main()
