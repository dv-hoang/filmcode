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

def beep(at, freq, dur=0.08, gain=0.15, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.3))
    add(buf, x, at, gain, pan)

def snare(at, gain=0.15, pan=0.0):
    x = hp(noise(0.08), 1200) * env_exp(0.08, 0.01)
    add(buf, x, at, gain, pan)

# Microgame countdown bleeps & fanfare hits
# Game 1: 0.0, 0.5, 1.0, 1.5, 2.5 (TAP!)
for i, at in enumerate([0.0, 0.5, 1.0, 1.5]):
    beep(at, 440 + i * 110, 0.07, 0.12)
snare(2.0, 0.2)

# Game 2: 2.5, 3.0, 3.5, 4.5 (FLIP!)
for i, at in enumerate([2.5, 3.0, 3.5]):
    beep(at, 520 + i * 110, 0.07, 0.12)
snare(4.5, 0.2)

# Game 3: 5.0, 5.5, 6.0, 7.0 (EAT!)
for i, at in enumerate([5.0, 5.5, 6.0]):
    beep(at, 600 + i * 110, 0.07, 0.12)
snare(7.0, 0.2)

# Boss stage & Finale: 7.5 onwards
for i, at in enumerate([7.5, 7.8, 8.1, 8.4, 8.7, 9.0]):
    beep(at, 880, 0.05, 0.15, (i % 2) * 0.6 - 0.3)
snare(9.5, 0.3)

wav_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(wav_path, limit(buf), SR)
