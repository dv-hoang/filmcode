"""Night Elevator — lacquer-black pad, lift hum, gold chimes. 16 s."""
import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio.sfx import SR, add, limit, noise, hp, lp, brown, env_exp

DUR = 16.0
N = int(DUR * SR)
buf = np.zeros((N, 2), np.float32)
t = np.arange(N) / SR


def chime(at, freq, dur=0.55, gain=0.09, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.38))
    x += 0.35 * np.sin(2 * np.pi * freq * 2 * tt) * np.exp(-tt / (dur * 0.22))
    add(buf, x, at, gain, pan)


def thud(at, gain=0.12):
    n = int(0.18 * SR)
    tt = np.arange(n) / SR
    f = 70 * np.exp(-tt * 14) + 40
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.07)
    add(buf, x, at, gain, 0.0)


# Soft lacquer room tone.
hum = 0.018 * np.sin(2 * np.pi * 55 * t) + 0.008 * np.sin(2 * np.pi * 110 * t)
hum *= np.minimum(1, t / 0.8) * np.minimum(1, (DUR - t) / 0.6)
add(buf, hum, 0, 1.0, 0.0)
add(buf, lp(brown(DUR) * 2.0, 70) * 0.018, 0, 1.0, 0.0)

# Gold triad pad under the climb.
for f, a, pan in ((130.81, 0.02, -0.2), (164.81, 0.016, 0.15), (196.0, 0.012, 0.0)):
    x = np.sin(2 * np.pi * f * t + 0.25 * np.sin(2 * np.pi * 0.12 * t))
    x *= np.minimum(1, t / 2.2) * np.minimum(1, (DUR - t) / 1.6)
    add(buf, x, 0, a, pan)

# Door close / floor ticks / midnight hit.
thud(1.1, 0.14)
for i, floor_t in enumerate(np.linspace(2.2, 11.0, 10)):
    chime(float(floor_t), 660 + i * 28, 0.28, 0.06, -0.2 + 0.04 * i)
    thud(float(floor_t) + 0.05, 0.05)

# Power dip.
dip_n = int(0.7 * SR)
dip = hp(noise(0.7), 1800) * env_exp(0.7, 0.05) * np.linspace(1, 0.2, dip_n)
add(buf, dip, 11.4, 0.05, 0.0)

# Roof sign letters.
for i, f in enumerate((523.25, 659.25, 783.99, 987.77, 1174.66)):
    chime(12.2 + i * 0.28, f, 0.45, 0.08, -0.25 + 0.1 * i)

# Final held chord.
for f, g in ((130.81, 0.03), (196.0, 0.022), (261.63, 0.016)):
    n = int(2.4 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt) * np.minimum(1, tt / 0.25) * np.exp(-tt / 1.4)
    add(buf, x, 13.6, g, 0.0)

buf = limit(buf, 0.9)
peak = np.abs(buf).max()
if peak > 0:
    buf *= 0.82 / peak

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out, buf, SR)
print("audio.wav", buf.shape, f"{buf.shape[0] / SR:.1f}s")
