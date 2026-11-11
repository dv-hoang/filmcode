"""Analog CRT hum, key clicks and relay beeps for the 10 s ASCII demo."""
import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio.sfx import SR, add, limit, noise, hp, lp, brown, norm, env_exp

DUR = 10.0
N = int(DUR * SR)
buf = np.zeros((N, 2), np.float32)
t = np.arange(N) / SR


def beep(at, freq, dur=0.09, gain=0.11, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.34))
    add(buf, x, at, gain, pan)


def click(at, gain=0.05, pan=0.0):
    x = hp(noise(0.025), 2200) * env_exp(0.025, 0.004)
    add(buf, x, at, gain, pan)


# Flyback whine and mains hum.
hum = 0.022 * np.sin(2 * np.pi * 55 * t) + 0.010 * np.sin(2 * np.pi * 110 * t)
hum += 0.004 * np.sin(2 * np.pi * 165 * t)
hum *= 1 + 0.06 * np.sin(2 * np.pi * 0.27 * t)
hum *= np.minimum(1, t / 0.5) * np.minimum(1, (DUR - t) / 0.4)
add(buf, hum, 0, 1.0, 0.0)
add(buf, lp(brown(DUR) * 2.4, 90) * 0.02, 0, 1.0, 0.0)

# A cold, slow synth pad under the terminal.
for f, a, pan in ((110.0, 0.022, -0.2), (164.81, 0.016, 0.15), (220.0, 0.010, 0.0)):
    x = np.sin(2 * np.pi * f * t + 0.35 * np.sin(2 * np.pi * 0.19 * t))
    x *= np.minimum(1, t / 2.0) * np.minimum(1, (DUR - t) / 1.4)
    add(buf, x, 0, a, pan)

# Power-on relay, typing, line acknowledgements, end of transmission.
beep(0.06, 740, 0.12, 0.12)
click(0.36, 0.10)
for i in range(34):
    click(0.55 + i * 0.038, 0.035, -0.3 + 0.6 * (i % 3) / 2)
for i in range(30):
    click(1.25 + i * 0.033, 0.030, 0.25)
for i in range(32):
    click(1.95 + i * 0.034, 0.030, -0.1)
beep(1.38, 880, 0.07, 0.10, -0.2)
beep(2.10, 660, 0.08, 0.10, 0.2)
beep(2.80, 990, 0.07, 0.09, 0.0)
beep(8.55, 1320, 0.10, 0.10, 0.0)
beep(9.62, 330, 0.22, 0.09, 0.0)
click(9.66, 0.06)

buf = limit(buf, 0.9)
peak = np.abs(buf).max()
if peak > 0:
    buf *= 0.82 / peak

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out, buf, SR)
print("audio.wav", buf.shape, f"{buf.shape[0] / SR:.1f}s")
