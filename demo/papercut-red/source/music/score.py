"""Eighth Fold — original score. A C D E G, 96 bpm, one gong, then a slowing flute."""
import os
import re
import sys

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf

from core.audio import pluck as P
from core.audio import sampler as S
from core.audio.sfx import SR, add, bp, limit, norm

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DUR = 40.0

text = open(os.path.join(ROOT, 'timeline.js'), encoding='utf-8').read()
UNFOLD = [float(x) for x in re.search(r'UNFOLD = \[([^\]]+)\]', text).group(1).split(',')]
RISE = ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5']

buf = np.zeros((int(DUR * SR), 2), np.float32)


def n(t, inst, pitch, dur, vel, pan=0.0, **kw):
    x = S.note(inst, pitch, dur, vel=vel, **kw)
    add(buf, x, t, 1.0, pan)


def hit(t, inst, name, vel, pan=0.0):
    x = S.hit(inst, name, vel)
    add(buf, x, t, 1.0, pan)


def pl(t, pitch, dur, vel, pan=0.0, **kw):
    x = P.pluck('pipa', pitch, dur, vel=vel, **kw)
    add(buf, x, t, 1.0, pan)


def erhu(t0, dur, f0, f1, vel=0.55, pan=0.15):
    nlen = int(dur * SR)
    t = np.arange(nlen) / SR
    f = np.linspace(f0, f1, nlen)
    vib = 1 + 0.012 * np.sin(2 * np.pi * 5.2 * t)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    saw = (ph % (2 * np.pi)) / np.pi - 1
    y = bp(saw.astype(np.float32), 280, 2200)
    env = np.minimum(1, t / 0.09) * np.minimum(1, (dur - t) / 0.18)
    bow = 0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * t)
    y = norm(y * env * bow, 0.35) * vel
    add(buf, y.astype(np.float32), t0, 1.0, pan)


def mute(t0, t1, fade=0.12):
    a = int(t0 * SR)
    b = int(t1 * SR)
    f = int(fade * SR)
    if a - f > 0:
        buf[a - f:a] *= np.linspace(1, 0, f, dtype=np.float32)[:, None]
    buf[a:b] = 0


# Fold and cut — solo pipa, one woodblock on the crease.
pl(0.20, 'A4', 0.7, 0.42, -0.25)
hit(0.86, 'woodblock', None, 0.45, 0.0)
pl(1.50, 'C5', 0.8, 0.34, 0.2)
pl(2.70, 'A4', 0.9, 0.30, -0.15)
pl(4.20, 'E4', 0.55, 0.28, 0.1)
pl(4.70, 'D5', 0.7, 0.32, 0.22)
pl(6.15, 'C5', 0.8, 0.26, -0.1)
pl(7.40, 'A4', 1.1, 0.22, 0.05)
n(3.6, 'dan_tranh', 'E4', 1.2, 0.22, 0.15, attack=0.05)

mute(8.65, 9.98, 0.16)

# Unfold — one gong, then a rising zheng note per panel.
hit(UNFOLD[0], 'gong2', 'big', 0.62, 0.0)
for i, t0 in enumerate(UNFOLD):
    n(t0, 'dan_tranh', RISE[i], 0.85, 0.34 + i * 0.02, -0.2 + i * 0.05)

# Under the second line, one quiet held note. The flute waits.
n(12.95, 'dan_tranh', 'D4', 2.4, 0.16, -0.05, attack=0.08)
pl(13.6, 'A4', 1.4, 0.18, -0.2, trem=11)

# Crossing.
n(17.85, 'flute', 'E5', 1.5, 0.28, 0.25, attack=0.06)
n(19.15, 'flute', 'D5', 1.3, 0.26, 0.22, attack=0.04)
n(20.30, 'flute', 'C5', 1.4, 0.24, 0.18, attack=0.04)
n(21.60, 'flute', 'A4', 2.0, 0.26, 0.12, attack=0.05)
for tt in (19.2, 20.6, 22.0, 23.4, 24.8):
    hit(tt, 'frame_drum', None, 0.42, -0.05)
n(19.4, 'dan_tranh_trem', 'G4', 2.2, 0.14, 0.05, attack=0.1)
erhu(22.1, 2.6, 440, 329.6, 0.5, 0.2)
pl(23.4, 'A4', 1.6, 0.22, -0.25, trem=13)

mute(26.55, 28.45, 0.14)

# Lamp. Notes land further apart.
n(29.55, 'flute', 'A5', 1.45, 0.24, 0.2, attack=0.08)
n(34.65, 'flute', 'E5', 1.9, 0.22, 0.16, attack=0.1)
n(36.90, 'flute', 'D5', 2.4, 0.18, 0.1, attack=0.12)
pl(37.4, 'A4', 2.2, 0.16, -0.2)
hit(35.60, 'woodblock', None, 0.28, 0.05)

peak = float(np.abs(buf).max())
if peak > 0.95:
    buf *= 0.95 / peak
buf = np.stack([limit(buf[:, 0], 0.95), limit(buf[:, 1], 0.95)], 1).astype(np.float32)
out = os.path.join(HERE, 'music.wav')
sf.write(out, buf, SR)
print('score', out, 'peak', round(float(np.abs(buf).max()), 3))
