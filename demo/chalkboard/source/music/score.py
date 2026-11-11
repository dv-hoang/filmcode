"""Heat Leaves — original score. 80 BPM, 4/4, bar = 3 s. 39 s.

Sparse nylon guitar, marimba, and pizzicato bass.
Silent through the wipe and the verdict (7.8–13.5) and again before the last line.
"""
import sys, os
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, limit

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 39.0
buf = np.zeros((int(DUR * SR), 2), np.float32)


def pl(preset, t, pitch, dur, vel, pan=0.0, **kw):
    x = P.pluck(preset, pitch, dur, vel=vel, **kw)
    add(buf, x, t, 1.0, pan)


def mb(t, pitch, dur, vel, pan=0.0):
    x = S.note('marimba', pitch, dur, vel=vel)
    add(buf, x, t, 0.85, pan)


# A — one guitar note on the bar, while COLD is written
pl('nylon_guitar', 0.05, 'D3', 2.6, 0.42, -0.15)
pl('nylon_guitar', 3.02, 'F3', 2.4, 0.36, -0.1)
mb(3.15, 'A4', 1.2, 0.22, 0.25)
pl('nylon_guitar', 6.02, 'A3', 1.6, 0.34, -0.12)
mb(6.4, 'D5', 0.9, 0.18, 0.3)

# silence 7.8 – 13.5 : wipe, then "Cold does not travel."

# The note is born on LEAVES
pl('nylon_guitar', 14.7, 'D3', 2.8, 0.48, -0.18)
pl('upright_bass_pizz', 15.02, 'D2', 1.4, 0.4, -0.35)
mb(15.15, 'F4', 1.3, 0.24, 0.22)
pl('nylon_guitar', 18.02, 'G3', 2.2, 0.34, -0.08)
mb(18.2, 'A4', 1.1, 0.2, 0.28)
pl('upright_bass_pizz', 18.05, 'G2', 1.2, 0.36, -0.3)

# Whip lands on the bar; the right panel is quieter
pl('nylon_guitar', 21.35, 'A3', 2.2, 0.3, 0.05)
mb(21.55, 'C5', 1.0, 0.16, 0.32)
pl('upright_bass_pizz', 24.02, 'F2', 1.3, 0.34, -0.28)
pl('nylon_guitar', 24.05, 'F3', 2.4, 0.32, 0.08)
mb(24.4, 'A4', 1.2, 0.2, 0.26)
mb(27.1, 'D5', 1.4, 0.18, 0.3)
pl('nylon_guitar', 27.05, 'D3', 2.2, 0.28, -0.1)

# silence 30.2 – 31.2, then one harmonic over the wide hold
pl('nylon_guitar', 33.05, 'D4', 3.2, 0.22, 0.05, harmonic=True)
pl('nylon_guitar', 36.5, 'A3', 2.4, 0.2, -0.05)

for ch in range(2):
    buf[:, ch] = limit(buf[:, ch], 0.9, 0.008)

out = os.path.join(HERE, 'music.wav')
sf.write(out, buf, SR)
print(out)
print(S.credits(['marimba']))
