"""Music-box score for the 10 s Crayon Picture Book demo."""
import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio import pluck as P
from core.audio.sfx import SR, add, limit, brown, lp, norm

DUR = 10.0
buf = np.zeros((int(DUR * SR), 2), np.float32)


def note(pitch, t, dur=2.4, vel=0.28, pan=0.0):
    x = P.pluck("music_box", pitch, dur, vel=vel)
    add(buf, x, t, 1.0, pan)


# A small lullaby in C, 80 BPM (beat = 0.75 s).
melody = [
    ("C5", 0.00), ("E5", 0.75), ("G5", 1.50), ("E5", 2.25),
    ("A4", 3.00), ("C5", 3.75), ("E5", 4.50), ("C5", 5.25),
    ("F4", 6.00), ("A4", 6.75), ("C5", 7.50), ("E5", 8.25),
    ("C5", 9.00),
]
for i, (p, t) in enumerate(melody):
    note(p, t, 2.4, 0.30 if i % 2 == 0 else 0.23, -0.12 + 0.24 * ((i % 3) / 2))
    if i in (0, 4, 8, 12):
        note("G4", t, 2.8, 0.16, -0.2)
    if i in (2, 6, 10):
        note("C6", t + 0.06, 1.8, 0.10, 0.25)

# A soft bed under the box, and a final low C.
bed = lp(brown(DUR) * 3, 110) * 0.035
add(buf, norm(bed, 0.5), 0.0, 1.0, 0.0)
note("C3", 0.0, 4.0, 0.10, 0.0)
note("C3", 6.0, 4.0, 0.10, 0.0)

buf = limit(buf, 0.9)
peak = np.abs(buf).max()
if peak > 0:
    buf *= 0.86 / peak

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "music.wav")
sf.write(out, buf, SR)
print("music.wav", buf.shape, f"{buf.shape[0] / SR:.1f}s")
