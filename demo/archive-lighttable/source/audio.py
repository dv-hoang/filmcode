"""Archive Light Table — soft hum, paper slide, loupe click. 10 s."""
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

add(buf, lp(brown(DUR) * 2.0, 90) * 0.025, 0, 1.0, 0.0)
hum = 0.012 * np.sin(2 * np.pi * 60 * t) * np.minimum(1, t / 0.5) * np.minimum(1, (DUR - t) / 0.4)
add(buf, hum, 0, 1.0, 0.0)


def click(at, gain=0.06):
    x = hp(noise(0.03), 2000) * env_exp(0.03, 0.005)
    add(buf, x, at, gain, 0.1)


# paper slide + loupe moments
slide = lp(noise(0.4), 800) * env_exp(0.4, 0.08)
add(buf, slide, 1.2, 0.05, -0.2)
for at in (2.5, 4.0, 5.8, 7.2):
    click(at, 0.05)
tone_n = int(0.5 * SR)
tt = np.arange(tone_n) / SR
tone = np.sin(2 * np.pi * 660 * tt) * np.exp(-tt / 0.2)
add(buf, tone, 8.2, 0.04, 0.0)

buf = limit(buf, 0.9)
peak = np.abs(buf).max()
if peak > 0:
    buf *= 0.82 / peak
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out, buf, SR)
print("audio.wav", buf.shape, f"{buf.shape[0] / SR:.1f}s")
