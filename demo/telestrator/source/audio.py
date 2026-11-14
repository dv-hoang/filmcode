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

def beep(at, freq, dur=0.08, gain=0.1, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.3))
    add(buf, x, at, gain, pan)

def click(at, gain=0.04, pan=0.0):
    x = hp(noise(0.02), 3000) * env_exp(0.02, 0.003)
    add(buf, x, at, gain, pan)

# Broadcast TV studio hum & ambiance
hum = 0.015 * np.sin(2 * np.pi * 60 * t) + 0.008 * np.sin(2 * np.pi * 120 * t)
add(buf, hum, 0.0, 0.8, 0.0)

# VCR Rewind sound whirr around 1.8s - 2.3s
rewind_noise = hp(brown(0.5), 800) * env_exp(0.5, 0.1)
add(buf, rewind_noise, 1.8, 0.25, 0.0)

# Pundit marker beeps / touch beeps (3.2s, 4.0s, 5.0s, 6.2s)
beep(3.2, 880, 0.08, 0.15, -0.2)
click(3.2, 0.06, -0.2)

beep(4.0, 1046.5, 0.08, 0.15, 0.1)
click(4.0, 0.06, 0.1)

beep(5.0, 1318.5, 0.08, 0.15, -0.1)
click(5.0, 0.06, -0.1)

beep(6.2, 1567.98, 0.1, 0.18, 0.0)
click(6.2, 0.08, 0.0)

# Transition wipe swoosh at 7.5s
wipe_sfx = hp(noise(0.8), 400) * env_exp(0.8, 0.2)
add(buf, wipe_sfx, 7.5, 0.3, 0.0)
beep(7.5, 523.25, 0.2, 0.2, 0.0)

# Master norm & limit
buf = norm(buf, 0.9)
buf = limit(buf, 0.95)

out_path = os.path.join(os.path.dirname(__file__), "audio.wav")
sf.write(out_path, buf, SR)
print(f"Wrote {out_path}, duration {DUR}s")
