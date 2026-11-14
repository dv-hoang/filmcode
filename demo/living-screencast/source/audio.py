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

def beep(at, freq, dur=0.08, gain=0.12, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.25))
    add(buf, x, at, gain, pan)

def click(at, gain=0.08, pan=0.0):
    x = hp(noise(0.015), 3000) * env_exp(0.015, 0.003)
    add(buf, x, at, gain, pan)

# Soft ambient workspace hum
hum = 0.018 * np.sin(2 * np.pi * 60 * t) + 0.008 * np.sin(2 * np.pi * 120 * t)
add(buf, hum, 0.0, 0.5, 0.0)

# Action sound effects matching product walkthrough timeline
# 1. Mascot entry / greeting chime (t=0.5)
beep(0.5, 587.33, 0.12, 0.15, -0.2) # D5
beep(0.62, 880.00, 0.15, 0.18, -0.2) # A5

# 2. Toggle click (t=3.8)
click(3.8, 0.12, 0.1)
beep(3.85, 783.99, 0.1, 0.14, 0.1) # G5

# 3. AI typing & submission chime (t=5.5, t=7.8)
for i in range(5):
    click(5.5 + i * 0.35, 0.05, 0.2)

click(7.8, 0.15, 0.2)
beep(7.85, 1046.50, 0.2, 0.2, 0.2) # C6 (Success chime)

# Final envelope and normalization
buf = limit(norm(buf, 0.92))
out_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "audio.wav")
sf.write(out_path, buf, SR)
print(f"Wrote audio to {out_path}, duration {DUR}s")
