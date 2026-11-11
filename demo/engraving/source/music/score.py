"""The Night Lamp — harpsichord while the plate is cut, viola when the wash arrives.

66 BPM, E minor. Not the library demo's D-major quartet.
"""
import os
import sys

import numpy as np

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)

import soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 38.0
buf = np.zeros((int(DUR * SR), 2), np.float32)


def n(t, inst, pitch, dur, vel, pan=0.0, **kw):
    x = S.note(inst, pitch, dur, vel=vel, **kw)
    add(buf, x, t, 1.0, pan)


# Dry harpsichord, lit side. Melody sits on A4–B5, above a speaking voice.
for t, pitch, dur, vel in (
    (0.00, 'B4', 0.7, 0.34),
    (0.91, 'E5', 0.55, 0.28),
    (1.82, 'D5', 0.5, 0.24),
    (2.73, 'B4', 0.8, 0.26),
    (4.55, 'E5', 0.45, 0.32),
    (5.45, 'G5', 0.4, 0.22),
    (6.36, 'E5', 0.55, 0.2),
):
    n(t, 'harpsichord', pitch, dur, vel, 0.15)

# Silence 8.5–9.9, then the hatch tightens.
for i, pitch in enumerate(('E5', 'G5', 'B5', 'A5', 'G5', 'E5', 'D5', 'E5')):
    n(10.0 + i * 0.45, 'harpsichord', pitch, 0.38, 0.22 + (i % 3) * 0.03, 0.2 - i * 0.02)

n(14.55, 'harpsichord', 'B4', 0.9, 0.2, -0.1)
n(15.45, 'harpsichord', 'E5', 0.7, 0.18, 0.15)

# Silence 16.4–18.15. The burnish is the next musical event: one low viola pluck.
n(18.18, 'violas', 'E3', 0.55, 0.22, -0.25)
n(18.55, 'harpsichord', 'E4', 0.4, 0.16, 0.1)
n(20.0, 'harpsichord', 'B4', 0.35, 0.18, 0.12)
n(21.1, 'harpsichord', 'E5', 0.4, 0.2, 0.18)
n(22.45, 'harpsichord', 'B5', 0.55, 0.16, 0.28)  # scribe ting, top of the instrument

for i, pitch in enumerate(('E5', 'G5', 'A5', 'B5')):
    n(23.6 + i * 0.45, 'harpsichord', pitch, 0.4, 0.16, 0.22)

n(26.36, 'harpsichord', 'E4', 0.7, 0.24, -0.05)  # landing

# Bowed viola only once the wash is wet. Melody stays up.
n(26.5, 'violas', 'B4', 3.2, 0.28, -0.15, attack=0.35)
n(26.7, 'violas', 'E5', 2.8, 0.22, 0.2, attack=0.5)
n(27.4, 'harpsichord', 'B5', 1.2, 0.12, 0.3)
n(29.1, 'harpsichord', 'G5', 1.1, 0.12, 0.25)
n(30.2, 'violas', 'D5', 2.6, 0.2, 0.05, attack=0.4)
n(32.4, 'violas', 'B4', 2.4, 0.16, -0.1, attack=0.45)
n(33.64, 'harpsichord', 'E5', 1.4, 0.18, 0.2)
n(35.5, 'harpsichord', 'B4', 1.6, 0.12, 0.05)

buf = limit(buf, 0.9)
buf = S.room(buf, size=0.28, mix=0.1)
out = os.path.join(HERE, 'music.wav')
sf.write(out, buf, SR)
print('wrote', out)
