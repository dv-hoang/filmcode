"""One Rectangle — shamisen, shakuhachi, one koto glissando. 60 BPM, 40 s."""
import os
import sys

import numpy as np
import soundfile as sf

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)

from core.audio.pluck import pluck
from core.audio.sfx import SR, add, bp, norm

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 40.0
N = int(DUR * SR)
music = np.zeros((N, 2), np.float32)


def shakuhachi(f0, dur, slide=0.2, meri=0.0, seed=1):
    n = int(dur * SR)
    t = np.arange(n) / SR
    semi = -0.65 * np.clip(1 - t / max(slide, 1e-3), 0, 1)
    if meri > 0:
        tail = np.clip((t - (dur - 0.6)) / 0.6, 0, 1)
        semi = semi - meri * tail
    f = f0 * (2 ** (semi / 12))
    ph = 2 * np.pi * np.cumsum(f) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 4.1 * t) * np.clip(t / 0.45, 0, 1)
    tone = np.sin(ph * vib)
    rng = np.random.default_rng(seed)
    air = bp(rng.standard_normal(n), 1000, 3800)
    burst = bp(rng.standard_normal(n), 1400, 4200) * np.exp(-t / 0.045)
    att = np.clip(t / 0.07, 0, 1) * np.clip((dur - t) / 0.28, 0, 1)
    y = (tone * 0.72 + air * 0.22 + burst * 0.4) * att
    return norm(y, 0.42)


def hz(name):
    note = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[name[0]]
    acc = 0
    rest = name[1:]
    if rest[0] == 'b':
        acc = -1
        rest = rest[1:]
    elif rest[0] == '#':
        acc = 1
        rest = rest[1:]
    octave = int(rest)
    midi = 12 * (octave + 1) + note + acc
    return 440 * 2 ** ((midi - 69) / 12)


# Morning, ritsu on D. Sparse, one shamisen note a bar.
add(music, pluck('shamisen', 'D3', 2.4, vel=0.62), 0.15, 1.0, -0.15)
add(music, shakuhachi(hz('G4'), 3.3, 0.22, 0.0, 2), 1.2, 0.85, 0.2)
add(music, pluck('shamisen', 'A3', 2.2, vel=0.55), 4.0, 0.9, -0.1)
add(music, shakuhachi(hz('E4'), 2.4, 0.16, 0.35, 3), 5.6, 0.7, 0.25)
add(music, pluck('shamisen', 'D4', 2.0, vel=0.5), 8.0, 0.75, -0.05)
add(music, shakuhachi(hz('B4'), 1.8, 0.12, 0.5, 4), 9.15, 0.55, 0.3)

# Tide: koto slides down into miyako-bushi. Music is muted across the ma in mix.py.
add(music, pluck('koto', 'D5', 2.3, vel=0.7, bend=[(0, 0), (0.45, -1), (1.05, -4), (1.7, -6), (2.15, -7)]), 16.0, 1.0, 0.05)

# The note that decides she starts again, left ringing.
add(music, pluck('shamisen', 'D3', 3.6, vel=0.7), 22.4, 1.05, -0.12)

# Evening reprint. Miyako-bushi: D, Eb, G, A.
add(music, pluck('shamisen', 'D3', 2.2, vel=0.58), 24.0, 0.85, -0.12)
add(music, shakuhachi(hz('A4'), 2.5, 0.18, 0.2, 5), 27.15, 0.62, 0.22)
add(music, pluck('shamisen', 'Eb3', 2.0, vel=0.52), 28.0, 0.8, -0.08)
add(music, pluck('shamisen', 'G3', 2.4, vel=0.5), 32.0, 0.72, -0.05)
add(music, shakuhachi(hz('A4'), 3.3, 0.16, 1.0, 6), 36.2, 0.8, 0.18)

peak = np.abs(music).max()
if peak > 0:
    music *= np.float32(0.85 / peak)

out = os.path.join(HERE, 'music.wav')
sf.write(out, music, SR)
print('score', out, f'{DUR:.1f}s')
