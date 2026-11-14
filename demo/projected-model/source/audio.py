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

def beep(at, freq, dur=0.12, gain=0.08, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.25))
    add(buf, x, at, gain, pan)

def click(at, gain=0.04, pan=0.0):
    x = hp(noise(0.015), 3500) * env_exp(0.015, 0.003)
    add(buf, x, at, gain, pan)

# Dark room low ambient drone / projector cooling fan hum
fan = 0.035 * brown(DUR) + 0.015 * np.sin(2 * np.pi * 60 * t)
add(buf, fan, 0.0, 1.0, 0.0)

# Projection gear stepping clicks and layer shift chimes at t=1.5, 3.5, 6.0, 8.5
click(1.5, 0.06, -0.2)
beep(1.52, 440.0, 0.2, 0.08, -0.2)
beep(1.52, 880.0, 0.15, 0.05, -0.2)

click(3.5, 0.06, 0.3)
beep(3.52, 523.25, 0.2, 0.08, 0.3) # C5
beep(3.52, 659.25, 0.15, 0.06, 0.3) # E5

click(6.0, 0.06, 0.0)
beep(6.02, 587.33, 0.2, 0.09, 0.0) # D5
beep(6.02, 783.99, 0.18, 0.07, 0.0) # G5

click(8.5, 0.06, -0.1)
beep(8.52, 659.25, 0.25, 0.1, -0.1) # E5
beep(8.52, 987.77, 0.25, 0.08, -0.1) # B5

# Soft room reverb tail
out = limit(buf, 0.95)
sf.write(os.path.join(os.path.dirname(__file__), "audio.wav"), out, SR)
