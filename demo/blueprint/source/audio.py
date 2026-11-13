"""Project Signal — drafting-table room tone, pencil ticks, stamp. 10 s."""
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

# Room / paper hush.
add(buf, lp(brown(DUR) * 2.2, 120) * 0.03, 0, 1.0, 0.0)
hum = 0.012 * np.sin(2 * np.pi * 60 * t)
hum *= np.minimum(1, t / 0.4) * np.minimum(1, (DUR - t) / 0.4)
add(buf, hum, 0, 1.0, 0.0)


def tick(at, gain=0.06, pan=0.0):
    x = hp(noise(0.02), 1800) * env_exp(0.02, 0.004)
    add(buf, x, at, gain, pan)


def tone(at, freq, dur=0.12, gain=0.05, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.35))
    add(buf, x, at, gain, pan)


for i in range(18):
    tick(0.5 + i * 0.35, 0.045, -0.2 + 0.4 * (i % 3) / 2)
tone(1.4, 880, 0.08, 0.04)
tone(3.2, 660, 0.09, 0.045)
tone(4.9, 990, 0.08, 0.04)
# stamp
thud = hp(noise(0.08), 400) * env_exp(0.08, 0.01)
add(buf, thud, 8.15, 0.14, 0.0)
tone(8.2, 220, 0.35, 0.06)

buf = limit(buf, 0.9)
peak = np.abs(buf).max()
if peak > 0:
    buf *= 0.82 / peak
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out, buf, SR)
print("audio.wav", buf.shape, f"{buf.shape[0] / SR:.1f}s")
