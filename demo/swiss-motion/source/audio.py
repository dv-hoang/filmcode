"""120 BPM pulse, print clicks and an exception glide for the Swiss demo."""
import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio.sfx import SR, add, limit, noise, hp, lp, norm, env_exp

DUR = 10.0
N = int(DUR * SR)
buf = np.zeros((N, 2), np.float32)


def kick(at, gain=0.26):
    n = int(0.22 * SR); t = np.arange(n) / SR
    f = 52 * np.exp(-t * 18) + 38
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.085)
    add(buf, x, at, gain, 0.0)


def hat(at, gain=0.05, pan=0.25):
    x = hp(noise(0.035), 5200) * env_exp(0.035, 0.006)
    add(buf, x, at, gain, pan)


def click(at, gain=0.10, pan=0.0):
    x = hp(noise(0.018), 2400) * env_exp(0.018, 0.004)
    add(buf, x, at, gain, pan)


def bass(at, freq, dur=0.24, gain=0.07):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) * np.minimum(1, t / 0.01) * np.exp(-t / (dur * 0.7))
    add(buf, x, at, gain, -0.1)


# 120 BPM: a beat every 0.5 s.
for i in range(19):
    kick(0.5 + i * 0.5, 0.24 if i % 2 == 0 else 0.18)
for i in range(34):
    hat(1.0 + i * 0.25, 0.045, 0.25 if i % 2 else -0.2)
for i in range(19):
    bass(0.5 + i * 0.5, [110.0, 110.0, 146.83, 110.0][i % 4], 0.3, 0.055)
for at in (2.0, 2.5, 3.0, 3.5, 4.0, 4.5):
    click(at, 0.11, 0.15)
click(7.0, 0.13, -0.2)
click(7.1, 0.08, -0.2)

# The exception sings: one linear sine glide, no rhythm.
g0, g1 = 4.8, 7.2
n = int((g1 - g0) * SR); t = np.arange(n) / SR
freq = 440 + (880 - 440) * (t / (g1 - g0))
glide = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.minimum(1, t / 0.3) * np.minimum(1, (g1 - g0 - t) / 0.4)
add(buf, glide, g0, 0.055, 0.25)

# One quiet final chord on the lockup.
for f, g in ((130.81, 0.035), (155.56, 0.025), (196.0, 0.02)):
    n = int(1.8 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.2) * np.exp(-t / 1.1)
    add(buf, x, 8.0, g, 0.0)

buf = limit(buf, 0.9)
peak = np.abs(buf).max()
if peak > 0:
    buf *= 0.84 / peak
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out, buf, SR)
print("audio.wav", buf.shape, f"{buf.shape[0] / SR:.1f}s")
