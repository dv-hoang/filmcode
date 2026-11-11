"""Sparse guqin, rain and seal for the 10 s ink-wash film."""
import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio import pluck as P
from core.audio.sfx import SR, add, limit, noise, bp, hp, lp, brown, norm, env_exp, thump

DUR = 10.0
N = int(DUR * SR)
buf = np.zeros((N, 2), np.float32)
t = np.arange(N) / SR

# Guqin: unmetred, sparse, pentatonic in D.
notes = [
    ("D3", 0.55, 3.0, 0.26, -0.15), ("A3", 1.65, 2.6, 0.22, 0.15),
    ("F3", 2.55, 2.4, 0.20, -0.1), ("C4", 3.45, 2.2, 0.18, 0.2),
    ("D4", 4.35, 2.0, 0.17, -0.2), ("A4", 5.25, 1.8, 0.14, 0.22),
    ("G4", 6.10, 1.8, 0.13, -0.1), ("D4", 7.65, 2.4, 0.18, 0.1),
    ("A3", 8.55, 2.2, 0.16, -0.2), ("D3", 9.15, 2.4, 0.20, 0.0),
]
for p, at, dur, vel, pan in notes:
    x = P.pluck("guqin", p, dur, vel=vel)
    add(buf, x, at, 1.0, pan)

# Rain: band-limited air, with a held breath before the title.
rain = bp(noise(DUR), 500, 4800) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.13 * t + 1.2))
rain *= np.minimum(1, np.maximum(0, (t - 3.0) / 1.4)) * np.minimum(1, np.maximum(0, (9.2 - t) / 1.0))
add(buf, rain, 0, 0.32, 0.0)
add(buf, lp(brown(DUR), 100) * 0.04, 0, 1.0, 0.0)

# Steps on wet stone.
for at in (4.8, 5.35, 5.9, 6.45):
    add(buf, thump(0.5, 95), at, 0.06, -0.15)

# Seal: wooden thump and paper crackle.
add(buf, thump(0.8, 62), 8.82, 0.18, 0.1)
add(buf, hp(noise(0.18), 1800) * env_exp(0.18, 0.035), 8.82, 0.07, 0.2)

# A literal silence around 7.0-7.5: duck everything, then lift for the title.
env = np.ones(N, np.float32)
a, b = int(6.95 * SR), int(7.55 * SR)
env[a:b] = np.linspace(1, 0.02, b - a)
env[b:b + int(0.25 * SR)] = 0.02
buf *= env[:, None]

buf = limit(buf, 0.9)
peak = np.abs(buf).max()
if peak > 0:
    buf *= 0.84 / peak
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out, buf, SR)
print("audio.wav", buf.shape, f"{buf.shape[0] / SR:.1f}s")
