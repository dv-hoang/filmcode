"""Ordered, precise sound design for product keynote — soft clicks, one accent tone, subtle ambience."""
import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio.sfx import SR, add, limit, noise, hp, lp, brown, env_exp, norm

DUR = 10.0
N = int(DUR * SR)
buf = np.zeros((N, 2), np.float32)
t = np.arange(N) / SR

def tone(at, freq, dur=0.18, gain=0.12, pan=0.0, attack=0.008, release=None):
    if release is None:
        release = dur * 0.35
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt)
    env = np.exp(-tt / release) * (1 - np.exp(-tt / attack))
    x *= env
    add(buf, x, at, gain, pan)

def click(at, gain=0.045, pan=0.0, hp_f=3000):
    x = hp(noise(0.018), hp_f) * env_exp(0.018, 0.0025)
    add(buf, x, at, gain, pan)

def sweep(at, f0, f1, dur=0.6, gain=0.06, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    phase = 2 * np.pi * (f0 * tt + (f1 - f0) * tt**2 / (2 * dur))
    x = np.sin(phase) * np.exp(-tt / (dur * 0.5))
    add(buf, x, at, gain, pan)

# Subtle room tone - cool, ordered
room = lp(brown(DUR) * 1.8, 60) * 0.015
room *= np.minimum(1, t / 1.5) * np.minimum(1, (DUR - t) / 1.0)
add(buf, room, 0, 1.0, 0.0)

# Faint 50Hz mains reference (subtle)
mains = 0.008 * np.sin(2 * np.pi * 50 * t)
mains += 0.004 * np.sin(2 * np.pi * 100 * t)
mains *= np.minimum(1, t / 0.8) * np.minimum(1, (DUR - t) / 0.8)
add(buf, mains, 0, 1.0, 0.0)

# Phase 1: UI clicks as windows appear (0.2 - 3.2s)
# Staggered, grid-aligned clicks
for i in range(18):
    at = 0.25 + i * 0.165
    if at > 3.1: break
    pan = -0.4 + 0.8 * (i % 5) / 4
    click(at, 0.035, pan, 2800 + (i % 3) * 400)

# Phase 2: Accent tone at key press (3.35s)
tone(3.35, 880, 0.22, 0.14, 0.0)
tone(3.38, 1320, 0.18, 0.10, 0.0)

# Light sweep whoosh (3.5 - 4.2s)
sweep(3.5, 200, 1800, 0.7, 0.07, -0.15)
sweep(3.6, 150, 2200, 0.8, 0.05, 0.15)

# Phase 3: Resonant accent chord as number reveals (4.6s onwards)
for f, a, p, d in ((440, 0.11, -0.2, 1.2), (660, 0.08, 0.0, 1.4), (880, 0.06, 0.2, 1.6)):
    x = np.sin(2 * np.pi * f * t)
    x *= np.minimum(1, (t - 4.6) / 0.3) * np.minimum(1, (DUR - t) / 1.5)
    x *= np.exp(-(t - 4.6) / 2.5) * (t > 4.6)
    add(buf, x, 0, a, p)

# Subtle phasing pulse on the accent (Steve Reich style)
for k in range(12):
    at = 4.8 + k * 0.38
    if at > 9.5: break
    tone(at, 880, 0.25, 0.05, 0.15 * (k % 2 - 0.5))
    tone(at + 0.06, 1320, 0.2, 0.035, -0.15 * (k % 2 - 0.5))

# Final confirmation tone
tone(9.2, 1760, 0.35, 0.10, 0.0)

buf = limit(buf, 0.92)
peak = np.abs(buf).max()
if peak > 0:
    buf *= 0.85 / peak

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out, buf, SR)
print("audio.wav", buf.shape, f"{buf.shape[0] / SR:.1f}s")