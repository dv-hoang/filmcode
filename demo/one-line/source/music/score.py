"""The Mend — one solo violin, one melodic line, written to the drawing."""
import os
import sys

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 40.0
S.seed(11)

# (t, inst, pitch, dur, vel). Nothing is allowed to sustain into the hard silence at 14.0.
NOTES = [
    (0.00, 'violin', 'A3', 0.42, 0.34),
    (0.50, 'violin', 'D4', 0.40, 0.32),
    (1.00, 'violin', 'F4', 0.42, 0.30),
    (1.50, 'violin', 'E4', 0.42, 0.30),
    (2.00, 'violin', 'D4', 0.85, 0.28),
    (3.00, 'violin', 'A3', 0.42, 0.32),
    (3.50, 'violin', 'C4', 0.42, 0.30),
    (4.00, 'violin', 'E4', 0.85, 0.32),
    (5.00, 'violin', 'F4', 0.85, 0.30),
    (6.00, 'violin', 'E4', 0.85, 0.28),
    (7.00, 'violin', 'D4', 0.90, 0.28),
    (8.00, 'violin', 'C4', 1.35, 0.26),
    (9.50, 'violin', 'A3', 1.30, 0.24),
    (11.00, 'violin', 'B3', 1.15, 0.22),
    (12.20, 'violin', 'G3', 1.45, 0.20),
    (16.00, 'violin_pizz', 'D4', 0.35, 0.42),
    (16.45, 'violin', 'A4', 0.32, 0.30),
    (16.85, 'violin', 'C5', 0.30, 0.28),
    (17.25, 'violin', 'A4', 0.38, 0.26),
    (17.75, 'violin', 'G4', 0.48, 0.26),
    (18.40, 'violin', 'E5', 1.55, 0.40),
    (20.05, 'violin', 'C5', 1.05, 0.30),
    (21.20, 'violin', 'A4', 1.15, 0.26),
    (22.50, 'violin', 'G4', 0.85, 0.24),
    (23.50, 'violin', 'A4', 0.80, 0.24),
    (24.40, 'violin', 'F4', 0.80, 0.22),
    (25.30, 'violin', 'G4', 0.80, 0.22),
    (26.20, 'violin', 'E4', 0.90, 0.22),
    (27.20, 'violin', 'D4', 1.05, 0.20),
    (28.40, 'violin', 'F4', 0.85, 0.20),
    (29.40, 'violin', 'E4', 0.90, 0.18),
    (30.50, 'violin', 'D4', 1.6, 0.18),
    (32.30, 'violin', 'A3', 1.7, 0.16),
]


def main():
    events = []
    for t, inst, pitch, dur, vel in NOTES:
        if t < 14 and t + dur > 13.65:
            dur = max(0.12, 13.65 - t)
        rel = 0.12 if inst.endswith('pizz') else 0.18
        if t >= 14:
            rel = min(rel, 0.16)
        events.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=-0.12, release=rel, attack=0.02))
    buf = S.render(events, DUR, master=True)
    buf = S.room(buf, size=0.22, mix=0.12, damp=0.45, seed_=11)
    a, b = int(14.0 * SR), int(16.0 * SR)
    if a > 80:
        buf[a - 80:a] *= np.linspace(1, 0, 80)[:, None]
    buf[a:b] = 0
    peak = float(np.abs(buf).max())
    if peak > 0.9:
        buf *= 0.9 / peak
    out = os.path.join(HERE, 'music.wav')
    sf.write(out, buf, SR)
    print('wrote', out, 'peak', round(peak, 3))


if __name__ == '__main__':
    main()
