"""Still Lit — nylon guitar and a few upright-piano chords. 80 BPM, 4/4, 40 s.

Not a waltz. Two gaps with no notes: 7.55–9.00 and 17.65–19.35.
"""
import sys, os
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, limit

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 40.0
buf = np.zeros((int(DUR * SR), 2), np.float32)
S.seed(11)

SILENCE = [(7.55, 9.00), (17.65, 19.35)]


def quiet(t):
    return any(a <= t < b for a, b in SILENCE)


def pl(t, pitch, dur, vel, pan=0.0):
    if quiet(t) or t >= DUR - 0.2:
        return
    x = P.pluck('nylon_guitar', pitch, dur, vel=vel)
    add(buf, x, t, 1.0, pan)


def piano(t, pitch, dur, vel, pan=0.0):
    if quiet(t):
        return
    x = S.note('upright', pitch, dur, vel=vel)
    add(buf, x, t, 1.0, pan)


def arp(t0, notes, vel=0.34, eighths=8):
    order = [0, 2, 1, 2, 3, 1, 2, 1]
    for i in range(eighths):
        pl(t0 + i * 0.375, notes[order[i % 8]], 1.15, vel if i % 2 == 0 else vel * 0.72, -0.16)


def quarters(t0, notes, vel=0.28, n=4):
    for i in range(n):
        pl(t0 + i * 0.75, notes[i % len(notes)], 1.45, vel, -0.08)


D = ['D3', 'A3', 'D4', 'F#4']
G = ['G3', 'B3', 'D4', 'G4']
Bm = ['B2', 'D3', 'F#3', 'B3']
Em = ['E3', 'B3', 'E4', 'G4']
A = ['A2', 'E3', 'A3', 'C#4']

arp(0.0, D, 0.30, 8)
arp(3.0, G, 0.30, 8)
arp(6.0, D, 0.26, 4)          # stops before the silence at 7.55
arp(9.05, D, 0.36, 8)
arp(12.0, G, 0.34, 8)
arp(15.0, Bm, 0.30, 7)        # last eighth would land inside the silence
for i, pitch in enumerate(['D3', 'A3', 'D4', 'F#4']):
    pl(19.5 + i * 0.375, pitch, 1.2, 0.30, -0.12)
arp(21.0, G, 0.30, 8)
arp(24.0, D, 0.28, 8)
quarters(27.0, Em, 0.26)
quarters(30.0, A, 0.24)
quarters(33.0, D, 0.22)
quarters(36.0, ['D3', 'A3', 'F#4', 'D4'], 0.20, 2)

# upper voice, original, same guitar
for t, pitch, vel in (
    (10.50, 'F#4', 0.30), (11.25, 'A4', 0.28), (12.00, 'D5', 0.26),
    (13.50, 'E4', 0.26), (14.25, 'F#4', 0.28), (15.00, 'D4', 0.24),
    (20.25, 'A4', 0.26), (21.00, 'G4', 0.24), (22.50, 'F#4', 0.24), (24.00, 'D4', 0.22),
    (31.50, 'A4', 0.22), (33.00, 'F#4', 0.20), (36.75, 'D4', 0.24),
):
    pl(t, pitch, 1.7, vel, 0.28)

piano(9.08, 'D3', 2.4, 0.20, -0.22)
piano(9.12, 'A3', 2.2, 0.12, 0.08)
piano(12.02, 'G3', 2.2, 0.16, -0.18)
piano(21.05, 'B3', 2.6, 0.15, -0.2)
piano(30.5, 'D4', 3.6, 0.16, 0.12)
piano(30.55, 'F#4', 3.4, 0.11, 0.22)

for ch in range(2):
    buf[:, ch] = limit(buf[:, ch], 0.9, 0.006)
peak = float(np.abs(buf).max())
if peak > 0:
    buf *= 0.85 / peak
out = os.path.join(HERE, 'music.wav')
sf.write(out, buf, SR)
print('wrote', out, f'{DUR:.1f}s', 'peak', round(float(np.abs(buf).max()), 3))
