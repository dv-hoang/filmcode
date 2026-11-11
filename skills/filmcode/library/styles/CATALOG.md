# FilmCode style catalog (internal)

Restructured from 66 → **54** live styles. Cut styles live under `_archive/` (not listed to agents).

## Cuts → `_archive/`

| Slug | Reason |
|---|---|
| `countdown` | Edit recipe, not a look; needs live event plates |
| `city-symphony` | Needs heavy real time-lapse plates |
| `kino-montage` | Overlaps newsreel / halftone; archive-heavy |
| `data-physical` | Overlaps teardown / brick-toy / dataviz |
| `printed-long-take` | Camera grammar for woodcut, not a second style |
| `pictogram-motion` | Overlaps Swiss grid + icons |
| `isometric-picture-book` | Absorbed into isometric infographic |
| `circuit-board` | Metaphor overlaps transit-map / dataviz |
| `desktop-flythrough` | Absorbed into living screencast |
| `scifi-toon` | Thin vs cel anime + mid-century |
| `game-show` | Absorbed into microgame frenzy |
| `memphis-diorama` | Niche; tabletop covered by pop-up / brick |

## Renames

| Old slug | New slug | Display name |
|---|---|---|
| `caption-news` | `social-captions` | Social Caption News |
| `news-package` | `broadcast-package` | Broadcast News Package |
| `briefing-board` | `photo-briefing` | Photo Briefing Board |
| `white-model` | `projected-model` | Projected White Model |
| `paper-lantern` | `paper-lightbox` | Paper-cut Lightbox |
| `dark-keynote` | `product-keynote` | Dark Product Keynote |
| `hd-2d` | `hd2d-diorama` | HD-2D Diorama |
| `lowpoly-island` | `lowpoly-isometric` | Low-poly Isometric |
| `backrooms` | `liminal-footage` | Liminal Found Footage |

Supabase objects for renamed styles now use the **new** slug (`social-captions.mp4`, etc.). Old object names remain as leftovers and can be deleted from the bucket later.
