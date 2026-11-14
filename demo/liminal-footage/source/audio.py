"""1990s VHS camcorder audio: tape hiss, low fluorescent mains hum, rhythmic footsteps."""
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

def step(at, pan=0.0):
    dur_s = 0.12
    x = lp(brown(dur_s), 350) * env_exp(dur_s, 0.02)
    add(buf, x, at, 0.45, pan)
    sq = hp(noise(dur_s), 1800) * env_exp(dur_s, 0.01)
    add(buf, sq, at, 0.15, pan)

# Continuous VHS tape hiss & fluorescent 60Hz hum
hiss = hp(noise(DUR), 800) * 0.04
add(buf, hiss, 0.0, 1.0, 0.0)

hum = 0.03 * np.sin(2 * np.pi * 60 * t) + 0.015 * np.sin(2 * np.pi * 120 * t)
hum *= 1 + 0.05 * np.sin(2 * np.pi * 4 * t)
add(buf, hum, 0.0, 1.0, 0.0)

# Footsteps pacing forward down the endless corridor
foot_times = [0.8, 2.1, 3.4, 4.7, 6.0, 7.3, 8.6, 9.6]
for i, ft in enumerate(foot_times):
    pan = ((i % 2) * 2 - 1) * 0.15
    step(ft, pan)

# Periodic distant metallic echo or fluorescent ballast click
ballast_clicks = [1.5, 4.2, 7.8]
for bt in ballast_clicks:
    click = hp(noise(0.04), 2500) * env_exp(0.04, 0.005)
    add(buf, click, bt, 0.22, 0.2)

buf = limit(buf, 0.95)
sf.write(os.path.join(os.path.dirname(__file__), "audio.wav"), buf, SR)
print("Wrote audio.wav successfully.")
