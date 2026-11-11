"""Alborada — original score, 80 BPM, 4/4 (bar = 3.0 s), 45 s.

Felt-piano lead (upright), fingerpicked guitar, clarinet/flute, glockenspiel,
warm string pad, soft bass. Additive after the silence at the mill.
"""
import sys, os
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, limit

DUR = 45.0
BPM = 80.0
BEAT = 60.0 / BPM      # 0.75
BAR = BEAT * 4         # 3.0
buf = np.zeros((int(DUR * SR), 2), np.float32)


def n(t, inst, pitch, dur, vel, pan=0.0, **kw):
    x = S.note(inst, pitch, dur, vel=vel, **kw)
    add(buf, x, t, 1.0, pan)


def pl(preset, t, pitch, dur, vel, pan=0.0, **kw):
    x = P.pluck(preset, pitch, dur, vel=vel, **kw)
    add(buf, x, t, 1.0, pan)


# ---------------- A (0–9): first light, one note at a time ----------------
n(0.0, 'upright', 'D3', 3.0, .40, -.15)
n(0.15, 'upright', 'A4', 2.6, .22, .18)
n(3.0, 'upright', 'F#3', 3.0, .38, -.12)
n(3.1, 'upright', 'D5', 2.4, .18, .22)
n(6.0, 'upright', 'E3', 3.0, .40, -.14)
n(6.1, 'upright', 'A4', 2.6, .22, .16)
n(7.5, 'upright', 'B4', 1.5, .16, .24)
# a low pad arrives under the pull-back
n(6.0, 'cellos', 'D2', 3.4, .18, -.25, attack=.9)

# ---------------- B (9–21): the slope, guitar and kalimba ----------------
chords = [
    (9.0, ['D3', 'A3', 'F#4', 'A3']),
    (12.0, ['A2', 'E3', 'A3', 'C#4']),
    (15.0, ['B2', 'F#3', 'B3', 'D4']),
    (18.0, ['G2', 'D3', 'G3', 'B3']),
]
pat = [0, 1, 2, 3, 2, 1, 2, 1]
for (t0, ch) in chords:
    for i in range(8):
        t = t0 + i * BEAT / 2
        pl('acoustic_guitar', t, ch[pat[i]], 1.2, .34 if i % 2 == 0 else .26, -.28)
    n(t0, 'upright', ch[0], 2.0, .26, -.1)
    n(t0 + 1.5, 'upright', ch[2].replace('4', '5'), 1.5, .16, .2)
# kalimba ticks on the off-beats
for i in range(6):
    t = 12.0 + i * BAR
    if t > 20.5: break
    pl('kalimba', t + 0.375, ['A5', 'D5', 'F#5', 'B5'][i % 4], .8, .2, .3)
    pl('kalimba', t + 2.25, ['D5', 'A5', 'B5', 'D6'][i % 4], .8, .16, .32)
# string pad, low and slow
n(9.0, 'violins', 'D4', 6.0, .12, .15, attack=1.2)
n(15.0, 'violins', 'E4', 6.0, .12, -.1, attack=1.2)
n(15.0, 'cellos', 'B1', 6.0, .16, -.3, attack=1.0)

# ---------------- C (21–30): the mill, subtractive ----------------
n(21.0, 'upright', 'D3', 2.6, .30, -.12)
n(21.1, 'upright', 'A4', 2.0, .16, .16)
n(24.0, 'upright', 'F#3', 2.4, .28, -.1)
n(24.1, 'upright', 'D4', 1.8, .15, .18)
n(27.0, 'upright', 'A3', 2.2, .26, -.08)
n(27.05, 'upright', 'E4', 1.6, .14, .2)
# glassy drops over the water
for i, t in enumerate([22.4, 23.6, 25.2, 26.4, 28.0]):
    n(t, 'glockenspiel', ['A5', 'D6', 'F#6', 'E6', 'A5'][i], 1.4, .10, .28)
# the mill's own low hum, cut before the silence
n(21.5, 'cellos', 'D2', 6.2, .14, -.2, attack=.5)

# ---------------- silence 29.6 – 30.8 (brush lifted) ----------------

# ---------------- D (30–39): the patio, additive from the bottom ----------------
n(30.9, 'cellos', 'D2', 7.6, .22, -.25, attack=.5)
n(30.9, 'upright', 'D3', 3.0, .34, -.12)
n(31.0, 'upright', 'A3', 2.8, .20, .1)
n(31.1, 'upright', 'D4', 2.6, .18, .22)
n(33.0, 'upright', 'F#3', 3.0, .34, -.1)
n(33.05, 'upright', 'A3', 2.6, .18, .12)
# flute takes the melody
n(32.0, 'flute', 'A4', 1.4, .30, .22)
n(33.5, 'flute', 'B4', 1.0, .28, .24)
n(34.5, 'flute', 'A4', .8, .26, .2)
n(35.4, 'flute', 'F#4', 1.6, .28, .18)
n(37.2, 'flute', 'E4', 2.0, .26, .14)
# guitar returns, and the kalimba
for i, t0 in enumerate([31.5, 34.5, 37.5]):
    ch = [['D3', 'A3', 'D4'], ['B2', 'F#3', 'B3'], ['G2', 'D3', 'G3']][i]
    for k in range(6):
        pl('acoustic_guitar', t0 + k * BEAT / 2, ch[[0, 1, 2, 1, 2, 1][k]], 1.2, .28, -.3)
n(33.0, 'violins', 'F#4', 3.0, .14, .18, attack=.8)
n(36.0, 'violins', 'E4', 3.0, .15, .12, attack=.8)
for i, t in enumerate([32.8, 36.2]):
    n(t, 'glockenspiel', ['D6', 'A6'][i], 1.6, .09, .34)

# ---------------- E (39–45): one cup, solo piano ----------------
n(39.2, 'upright', 'B3', 2.4, .28, -.1)
n(39.3, 'upright', 'D4', 2.2, .18, .12)
n(41.4, 'upright', 'G3', 2.4, .26, -.08)
n(41.5, 'upright', 'B3', 2.0, .16, .14)
n(43.0, 'upright', 'D3', 2.6, .34, -.06)
n(43.05, 'upright', 'F#4', 2.4, .22, .18)
n(43.1, 'upright', 'A4', 2.2, .18, .24)
n(44.1, 'upright', 'D5', 1.2, .20, .2)
n(43.2, 'cellos', 'D2', 1.8, .12, -.25, attack=.3)

# ---------------- master ----------------
buf = S.room(buf, size=.42, mix=.15)
buf = limit(buf, .9)
peak = np.abs(buf).max()
if peak > 0:
    buf = buf * (0.89 / peak)
out = os.path.join(os.path.dirname(__file__), 'music.wav')
sf.write(out, buf, SR)
print('music.wav', buf.shape, f'{buf.shape[0]/SR:.1f}s')
print('\n'.join(S.credits(['upright', 'flute', 'violins', 'cellos', 'glockenspiel'])))
