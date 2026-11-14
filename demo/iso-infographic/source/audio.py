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

def beep(at, freq, dur=0.1, gain=0.1, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.3))
    add(buf, x, at, gain, pan)

def click(at, gain=0.04, pan=0.0):
    x = hp(noise(0.02), 3000) * env_exp(0.02, 0.005)
    add(buf, x, at, gain, pan)

def whoosh(at, dur=0.8, gain=0.08):
    x = lp(brown(dur), 1200) * env_exp(dur, 0.1)
    add(buf, x, at, gain, 0.0)

# Ambient atmospheric pad
pad = 0.015 * np.sin(2 * np.pi * 110 * t) + 0.01 * np.sin(2 * np.pi * 220 * t)
pad *= 1.0 - np.exp(-t * 2.0)
pad *= 1.0 - np.exp(-(DUR - t) * 2.0)
add(buf, pad, 0.0, 1.0, 0.0)

# UI clicks and radar beeps
click(0.5, 0.05)
beep(0.5, 880, 0.08, 0.08)

whoosh(2.0, 1.0, 0.07)
click(2.2, 0.06)
beep(2.2, 587.33, 0.12, 0.1) # D5

whoosh(5.0, 1.0, 0.07)
click(5.5, 0.06)
beep(5.5, 440.0, 0.12, 0.1) # A4

whoosh(7.8, 1.0, 0.08)
click(8.0, 0.08)
beep(8.0, 659.25, 0.2, 0.12) # E5
beep(8.2, 880.0, 0.3, 0.15) # A5

limit(buf)
sf.write(os.path.join(os.path.abspath(os.path.dirname(__file__)), "audio.wav"), buf, SR)
print("Generated audio.wav successfully.")
