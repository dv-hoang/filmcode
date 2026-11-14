"""Audio for Paper Pop-up: Clockwork Aviary (mechanical clicks, book unfolding swoosh, brass gear whirr, pop chime)."""
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

def rustle(at, dur=0.6, gain=0.15, pan=0.0):
    n = int(dur * SR)
    x = hp(brown(dur), 1200) * env_exp(dur, 0.05)
    add(buf, x, at, gain, pan)

def pop_chime(at, freq=880, gain=0.2, pan=0.0):
    dur = 0.4
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.25))
    x += 0.5 * np.sin(2 * np.pi * freq * 1.5 * tt) * np.exp(-tt / (dur * 0.2))
    x *= env_exp(dur, 0.01)
    add(buf, x, at, gain, pan)

def gear_click(at, gain=0.08, pan=0.0):
    x = hp(noise(0.015), 3500) * env_exp(0.015, 0.002)
    add(buf, x, at, gain, pan)

# Book opening rustle & thud
rustle(0.2, dur=0.8, gain=0.25, pan=0.0)
thud = hp(brown(0.15), 150) * env_exp(0.15, 0.02)
add(buf, thud, 0.8, 0.3, 0.0)

# Pop-up mechanism springing up
rustle(1.5, dur=0.5, gain=0.2, pan=-0.2)
pop_chime(1.8, freq=523.25, gain=0.25, pan=0.1) # C5
pop_chime(2.0, freq=659.25, gain=0.25, pan=-0.1) # E5
pop_chime(2.2, freq=783.99, gain=0.3, pan=0.0)  # G5

# Clockwork ticking & whirring gears
for i in range(12):
    t_gear = 3.0 + i * 0.35
    gear_click(t_gear, gain=0.1 + (i % 3) * 0.03, pan=(i % 2 * 2 - 1) * 0.3)

# Placard slide & action rating star
rustle(3.5, dur=0.3, gain=0.15, pan=0.2)
pop_chime(5.0, freq=1046.50, gain=0.35, pan=0.0) # C6 high star chime
rustle(5.0, dur=0.4, gain=0.18, pan=-0.1)

# Final gentle desk ambient warmth
room_tone = 0.008 * brown(DUR)
add(buf, room_tone, 0.0, 1.0, 0.0)

limit(buf)
sf.write(os.path.join(os.path.dirname(__file__), "audio.wav"), buf, SR)
print("Generated audio.wav successfully.")
