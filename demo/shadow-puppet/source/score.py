"""Original gong-and-drum score for One Lamp Across. No samples."""
import json
import os
import sys

import numpy as np
import soundfile as sf

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, hp, lp, norm  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
CUE = json.load(open(os.path.join(HERE, 'cue.json'), encoding='utf-8'))
DUR = float(CUE['dur'])
T = CUE['t']
N = int(round(DUR * SR))
music = np.zeros((N, 2), np.float32)
rng = np.random.default_rng(19)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(x, at, gain=1.0, pan=0.0):
    x = np.asarray(x, np.float32)
    s = int(round(at * SR))
    if s >= N or s + len(x) <= 0:
        return
    if s < 0:
        x = x[-s:]
        s = 0
    e = min(N, s + len(x))
    seg = x[: e - s]
    l = np.cos((pan + 1) * np.pi / 4) * 1.414
    r = np.sin((pan + 1) * np.pi / 4) * 1.414
    music[s:e, 0] += seg * gain * l
    music[s:e, 1] += seg * gain * r


def erhu(freq, dur, vol=0.22, slide=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (2 ** (slide * (1 - t / max(dur, 1e-3)) / 12))
    f = f * (1 + 0.012 * np.sin(2 * np.pi * 5.2 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    y = np.tanh(bp(saw, 650, 3200) * 1.5)
    env = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.08)
    return (y * env * vol).astype(np.float32)


def suona(freq, dur, vol=0.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (1 + 0.008 * np.sin(2 * np.pi * 6.5 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    y = np.tanh(bp(saw, 1100, 3400) * 2.5)
    env = np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.1)
    return (y * env * vol).astype(np.float32)


def flute(freq, dur, vol=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * t) + 0.22 * np.sin(2 * np.pi * 2 * freq * t)
    breath = hp(rng.standard_normal(n).astype(np.float32), 2500) * 0.05
    env = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.12)
    return lp((y + breath) * env * vol, 2200).astype(np.float32)


def pluck(freq, dur=1.1, decay=0.9965):
    n = int(dur * SR)
    period = max(2, int(SR / freq))
    buf = np.zeros(n, np.float32)
    burst = rng.uniform(-1, 1, period).astype(np.float32)
    buf[:period] = burst
    for i in range(period, n):
        buf[i] = decay * 0.5 * (buf[i - period] + buf[i - period - 1])
    t = np.arange(n) / SR
    buf *= np.minimum(1, t / 0.004)
    return buf * 0.35


def barrel(vol=0.55):
    d = 0.42
    t = np.arange(int(d * SR)) / SR
    body = np.sin(2 * np.pi * 148 * t * (1 - 0.4 * t)) * np.exp(-t / 0.07)
    click = lp(rng.standard_normal(len(t)).astype(np.float32), 220) * np.exp(-t / 0.03) * 0.45
    return norm(body + click, vol).astype(np.float32)


def wood(vol=0.38):
    d = 0.07
    t = np.arange(int(d * SR)) / SR
    y = np.sin(2 * np.pi * 1680 * t) * np.exp(-t / 0.012)
    y += hp(rng.standard_normal(len(t)).astype(np.float32), 2200) * np.exp(-t / 0.008) * 0.55
    return norm(y, vol).astype(np.float32)


def gong(f0, dur, fall=True, vol=0.42):
    n = int(dur * SR)
    t = np.arange(n) / SR
    bend = (1 - 0.42 * t / dur) if fall else (1 + 0.5 * np.minimum(t / dur, 0.28))
    f = f0 * bend
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / (dur * 0.38))
    y += 0.38 * np.sin(ph * 2.01) * np.exp(-t / (dur * 0.22))
    y += 0.16 * np.sin(ph * 2.97) * np.exp(-t / (dur * 0.12))
    y += hp(rng.standard_normal(n).astype(np.float32), 2800) * np.exp(-t / 0.05) * 0.12
    return norm(y, vol).astype(np.float32)


def cymbal(vol=0.28):
    d = 0.7
    n = int(d * SR)
    t = np.arange(n) / SR
    y = hp(rng.standard_normal(n).astype(np.float32), 3500) * np.exp(-t / 0.18)
    return norm(bp(y, 3000, 14000), vol).astype(np.float32)


def gate(buf, spans):
    fade = int(0.012 * SR)
    ramp = np.linspace(1, 0, fade, dtype=np.float32)
    for a, b in spans:
        ia = max(0, min(len(buf), int(round(a * SR))))
        ib = max(0, min(len(buf), int(round(b * SR))))
        if ia >= fade:
            buf[ia - fade:ia] *= ramp[:, None]
        buf[ia:ib] = 0


# Pentatonic huan-yin in D, then a short ku-yin fall before the silence.
erhu_line = [
    (0.15, 62, 1.5, 0),
    (1.8, 69, 1.25, 0),
    (3.2, 71, 1.5, 1),
    (4.9, 69, 1.15, 0),
    (6.5, 62, 0.55, 0),
    (7.15, 64, 0.45, 0),
    (7.7, 66, 0.45, 0),
    (8.3, 64, 0.4, 0),
    (8.9, 62, 0.85, 0),
    (10.0, 69, 0.7, 0),
    (10.9, 66, 0.55, 0),
    (11.6, 64, 0.5, 0),
    (12.3, 62, 0.9, 0),
    (13.4, 71, 0.65, 0),
    (14.2, 69, 0.55, 0),
    (15.15, 71, 0.4, -1),
    (15.7, 68, 0.4, -2),
    (16.25, 64, 0.4, -1),
    (16.8, 60, 0.7, -2),
    (23.4, 74, 1.15, 2),
    (24.7, 71, 0.7, 0),
    (25.45, 69, 0.5, 0),
    (28.15, 62, 0.55, 0),
    (28.8, 66, 0.5, 0),
    (29.45, 69, 0.85, 0),
    (30.5, 74, 0.65, 0),
    (31.3, 71, 0.55, 0),
    (32.05, 69, 1.05, 0),
]
for t0, note, dur, slide in erhu_line:
    if note < 50:
        continue
    place(erhu(midi(note), dur, slide=slide), t0, 0.9, 0.18)

# One suona phrase, at the second lamp only.
for t0, note, dur in ((26.25, 78, 0.32), (26.6, 81, 0.38), (27.1, 74, 0.85)):
    place(suona(midi(note), dur), t0, 1.05, 0.0)

for t0, note, dur in ((33.15, 74, 1.15), (34.4, 71, 1.0), (35.5, 66, 1.05)):
    place(flute(midi(note), dur), t0, 0.85, -0.22)

for t0, note in ((0.4, 50), (3.0, 57), (6.6, 62), (12.1, 57), (24.1, 62), (29.9, 50), (33.5, 57)):
    place(pluck(midi(note)), t0, 0.55, -0.32)

for t0 in (0.75, 2.25, 3.75, 5.25):
    place(barrel(0.42), t0, 0.8, 0.0)
t = 6.0
while t < 17.3:
    place(barrel(0.5), t, 0.75, 0.0)
    t += 0.75
for t0 in CUE['poles']:
    place(wood(0.42), t0, 0.7, 0.05)

place(gong(330, 2.4, fall=True, vol=0.55), T['catch'], 1.0, 0.0)
place(barrel(0.6), T['catch'], 0.9, 0.0)
t = 24.0
while t < 25.4:
    place(barrel(0.45), t, 0.7, 0.0)
    t += 0.75
roll = 25.5
step = 0.16
while roll < T['lamp2'] - 0.02:
    place(wood(0.32), roll, 0.65, 0.0)
    roll += step
    step *= 0.84
place(cymbal(0.34), T['lamp2'], 0.9, 0.0)
place(gong(520, 1.3, fall=False, vol=0.36), T['lamp2'], 0.85, 0.08)
t = 27.75
while t < 34.5:
    place(barrel(0.4), t, 0.62, 0.0)
    t += 0.75
place(gong(480, 1.6, fall=False, vol=0.32), T['gongEnd'], 0.8, 0.0)

gate(music, T['silence'])
music[:, 0] = hp(music[:, 0], 95)
music[:, 1] = hp(music[:, 1], 95)

mono = music.mean(axis=1)
spec = np.abs(np.fft.rfft(mono))
freqs = np.fft.rfftfreq(len(mono), 1 / SR)
def band(a, b):
    m = (freqs >= a) & (freqs < b)
    return float(np.mean(spec[m] ** 2) + 1e-12)
print('bass ratio 20-120 / rest', round(band(20, 120) / band(120, 8000), 3))

os.makedirs(os.path.join(HERE, 'music'), exist_ok=True)
out = os.path.join(HERE, 'music', 'music.wav')
sf.write(out, music, SR)
print('wrote', out, f'{DUR:.2f}s')
