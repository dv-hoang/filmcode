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

def chord(at, freqs, dur=0.8, gain=0.12):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    sig = np.zeros(n, np.float32)
    for f in freqs:
        tone = np.sin(2 * np.pi * f * tt) * np.exp(-tt / (dur * 0.4))
        sig += tone * (0.5 / len(freqs))
    env = np.sin(np.pi * tt / dur) ** 0.5
    sig *= env
    add(buf, sig, at, gain, 0.0)

def train_click(at):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    x = hp(noise(0.08), 1200) * env_exp(0.08, 0.01)
    add(buf, x, at, 0.12, 0.0)

# Ambient wind / summer day drone
wind = lp(brown(DUR), 400) * 0.08
add(buf, wind, 0.0, 1.0, 0.0)

# Chords / Miniature Music box feel
chord(0.0, [261.63, 329.63, 392.00, 523.25], 2.5, 0.1)
chord(2.5, [293.66, 369.99, 440.00, 587.33], 2.5, 0.1)
chord(5.0, [329.63, 415.30, 493.88, 659.25], 2.5, 0.1)
chord(7.5, [349.23, 440.00, 523.25, 698.46], 2.5, 0.1)

# Rhythmic model train / traffic clicks
for i in range(20):
    train_click(0.4 * i + 0.1)

out = limit(norm(buf, 0.88), 0.95)
sf.write(os.path.join(os.path.dirname(__file__), "audio.wav"), out, SR)
