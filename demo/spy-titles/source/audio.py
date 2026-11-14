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

def brass_stab(at, freq, dur=0.6, gain=0.28, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    # Sawtooth-like rich brass timbre using harmonics
    x = (
        np.sin(2 * np.pi * freq * tt) +
        0.5 * np.sin(2 * np.pi * freq * 2.01 * tt) +
        0.3 * np.sin(2 * np.pi * freq * 3.02 * tt) +
        0.2 * np.sin(2 * np.pi * freq * 4.0 * tt)
    )
    env = np.exp(-tt * 4.0) * (1.0 - np.exp(-tt * 40.0))
    x *= env
    add(buf, x, at, gain, pan)

def snip(at, gain=0.18, pan=0.0):
    # Scissors / paper cut sound (crisp filtered noise burst)
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    x = hp(noise(0.08), 3500) * np.exp(-tt * 30.0)
    add(buf, x, at, gain, pan)

def snare_hit(at, gain=0.22, pan=0.0):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    x = (hp(noise(0.25), 1200) * 0.7 + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 25.0)) * np.exp(-tt * 12.0)
    add(buf, x, at, gain, pan)

# 1. Act I Stabs & Paper snips
brass_stab(0.0, 110.0, 0.8, 0.3, -0.2)
snip(0.4, 0.2, 0.3)
snip(0.7, 0.2, -0.1)
brass_stab(1.2, 146.8, 0.8, 0.32, 0.2) # D3
snare_hit(1.8, 0.25, 0.0)

# 2. Act II Chase Rhythm (Jazz spy groove / bass & brass stabs)
for beat in range(4):
    t_base = 3.5 + beat * 0.8
    brass_stab(t_base, 220.0, 0.4, 0.25, -0.3)
    snare_hit(t_base + 0.4, 0.2, 0.3)
    snip(t_base + 0.6, 0.15, 0.0)

# Final climax resolution at 7.2s
brass_stab(7.2, 110.0, 1.2, 0.35, 0.0)
brass_stab(7.2, 164.81, 1.2, 0.3, -0.2) # E3
brass_stab(7.2, 220.0, 1.2, 0.3, 0.2)  # A3
snare_hit(7.2, 0.3, 0.0)
snip(8.2, 0.2, 0.0)

# Master limit and export
limit(buf)
out_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "audio.wav"))
sf.write(out_path, buf, SR)
print(f"Wrote audio to {out_path}, duration: {DUR}s")
