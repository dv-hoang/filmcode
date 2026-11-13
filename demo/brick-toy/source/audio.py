"""Brick-Toy Train — chugs and track rattle. 10 s."""
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

add(buf, lp(brown(DUR) * 1.8, 110) * 0.02, 0, 1.0, 0.0)


def chug(at, gain=0.1):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    f = 90 * np.exp(-tt * 12) + 50
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.05)
    x += hp(noise(0.12), 600) * env_exp(0.12, 0.01) * 0.4
    add(buf, x, at, gain, -0.15 + 0.3 * ((at * 2) % 1))


for i in range(18):
    chug(0.4 + i * 0.45, 0.11 if i % 2 == 0 else 0.08)

buf = limit(buf, 0.9)
peak = np.abs(buf).max()
if peak > 0:
    buf *= 0.82 / peak
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out, buf, SR)
print("audio.wav", buf.shape, f"{buf.shape[0] / SR:.1f}s")
