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

def beep(at, freq, dur=0.08, gain=0.08, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.3))
    add(buf, x, at, gain, pan)

def click(at, gain=0.04, pan=0.0):
    x = hp(noise(0.015), 3000) * env_exp(0.015, 0.003)
    add(buf, x, at, gain, pan)

# Laser pulse rhythmic sweeps and survey equipment ambiance
hum = 0.015 * np.sin(2 * np.pi * 60 * t) + 0.008 * np.sin(2 * np.pi * 120 * t)
add(buf, hum, 0.0, 1.0, 0.0)

# Periodic laser ping / return clicks
for i in range(10):
    at = 0.5 + i * 0.95
    beep(at, 1800, 0.05, 0.06, -0.2)
    beep(at + 0.02, 2400, 0.05, 0.04, 0.2)
    click(at, 0.05, 0.0)

# End tone
beep(9.0, 880, 0.6, 0.1, 0.0)

out = norm(limit(buf)) * 0.9
sf.write(os.path.join(os.path.dirname(__file__), "audio.wav"), out, SR, subtype="PCM_16")
