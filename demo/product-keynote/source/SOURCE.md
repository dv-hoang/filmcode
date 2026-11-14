# product-keynote — Source Notes

## Concept
A 10-second software launch film demonstrating "Focus Mode" — the interface itself is the protagonist. The film moves from chaotic multi-window desktop to a single decisive action (⌘⇧F) that sweeps the stage clean, revealing one giant number: **47** focus sessions this week.

## Visual Language
- **Stage**: Near-black radial gradient (#040406 → #0a0a10) with off-centre cool glow and 52% corner vignette.
- **Grid**: 48 px hairline module, primary lines at 3% white, every 4th at 6%.
- **Surfaces**: Three elevation steps (SURF_0/1/2) with 1 px border, 1 px inner top highlight, layered soft shadows.
- **Depth**: 2.5D camera `s = 1/(1 − z·0.0015)`; cards near lens magnify and blur.
- **Light as reveal**: Only pixels the radial sweep passes "turn on"; unlit areas stay at base opacity.
- **Colour**: Cool blue-neutral ladder only. One accent — **#00d4aa** (saturated cyan) — reserved for the protagonist element (Focus notification, key hint, giant number, confirmation tones).

## Animation Choreography
| Time | Event |
|------|-------|
| 0.00–0.25 | Stage + grid fade in |
| 0.25–3.10 | Five windows stagger in (Messages, Files, Notifications, Projects, Terminal) — each snaps to grid, lands on 165 ms beat |
| 3.10–3.50 | Key hint (⌘⇧F) appears bottom-right |
| 3.35 | Cursor taps "Notifications" window — accent tone |
| 3.50–4.20 | Radial light sweep crosses stage left→right, washing out all windows |
| 4.50–10.0 | Giant "47" scales in with snap-grid easing; phasing accent pulses; final confirmation tone at 9.2 s |

All motion uses `easeOut(cubic)` or `ease(quadratic)`; zero frame-dependent randomness.

## Audio Design
- **Room tone**: LP-filtered brown noise at –36 dB, cool and ordered.
- **UI clicks**: 18 high-pass clicks (2.8–3.6 kHz) on a 165 ms grid, panned across 5 positions — each window arrival gets its own click.
- **Key press**: Two pure sine tones (880 Hz → 1320 Hz) with fast attack, the only melodic event before the sweep.
- **Light sweep**: Dual logarithmic frequency sweeps (200→1800 Hz, 150→2200 Hz) panned slightly L/R.
- **Number reveal**: Three sustained sine partials (440/660/880 Hz) fade in with 2.5 s exponential decay.
- **Phasing pulses**: 12 accent tone pairs (880+1320 Hz) at 380 ms intervals — Steve Reich–style subtraction, alternating pan.
- **Final confirmation**: 1760 Hz tone at 9.2 s.
- All levels peak-limited to –0.7 dBFS.

## Implementation Notes
- `film.js` < 250 lines (237 LOC), single `draw(t)` function, deterministic.
- System font stack only (`-apple-system, BlinkMacSystemFont, system-ui`).
- No external assets, no network, no `requestAnimationFrame`.
- `audio.py` uses only `core.audio.sfx` primitives (`SR, add, limit, noise, hp, lp, brown, env_exp, norm`).