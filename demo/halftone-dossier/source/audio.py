"""Case File Triptych — paper hush, stamp hits. 10 s."""
import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio.sfx import SR, add, limit, noise, hp, lp, brown, env_exp

DUR = 10.0
N = int(DUR * SR)
buf = np.zeros((N, 2), np.float32)
t = np.arange(N) / SR

# Paper room tone
add(buf, lp(brown(DUR) * 2.0, 140) * 0.028, 0, 1.0, 0.0)
hum = 0.01 * np.sin(2 * np.pi * 55 * t)
hum *= np.minimum(1, t / 0.35) * np.minimum(1, (DUR - t) / 0.35)
add(buf, hum, 0, 1.0, 0.0)


def rustle(at, gain=0.05, pan=0.0):
    x = hp(noise(0.04), 900) * env_exp(0.04, 0.008)
    add(buf, x, at, gain, pan)


def stamp(at, gain=0.12):
    thud = hp(noise(0.07), 350) * env_exp(0.07, 0.012)
    add(buf, thud, at, gain, 0.0)
    click = hp(noise(0.015), 2200) * env_exp(0.015, 0.003)
    add(buf, click, at + 0.02, gain * 0.5, 0.15)


for i in range(14):
    rustle(0.4 + i * 0.55, 0.035, -0.25 + 0.5 * ((i % 4) / 3))

stamp(1.4)
stamp(4.7)
stamp(8.1)

buf = limit(buf, 0.9)
peak = np.abs(buf).max()
if peak > 0:
    buf *= 0.8 / peak
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out, buf, SR)
print("audio.wav", buf.shape, f"{buf.shape[0] / SR:.1f}s")
