"""1920s Newsreel orchestral brass fanfare, Charleston rhythm and optical soundtrack noise."""
import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio.sfx import SR, add, limit, noise, hp, lp, brown, env_exp, norm

DUR = 10.0
N = int(DUR * SR)
buf = np.zeros((N, 2), np.float32)
t = np.arange(N) / SR

def brass_note(at, freq, dur=0.4, gain=0.18, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    vib = 1.0 + 0.015 * np.sin(2 * np.pi * 5.5 * tt)
    f = freq * vib
    x = (
        1.0 * np.sin(2 * np.pi * f * tt) +
        0.5 * np.sin(2 * np.pi * f * 2 * tt) +
        0.3 * np.sin(2 * np.pi * f * 3 * tt) +
        0.15 * np.sin(2 * np.pi * f * 4 * tt)
    )
    env = np.exp(-tt / (dur * 0.45)) * np.minimum(1.0, tt / 0.03)
    x *= env
    add(buf, x, at, gain, pan)

def drum_hit(at, gain=0.2, pan=0.0):
    n = int(0.15 * SR)
    tt = np.arange(n) / SR
    x = noise(0.15) * np.exp(-tt / 0.03) + 0.3 * np.sin(2 * np.pi * 80 * tt) * np.exp(-tt / 0.05)
    add(buf, x, at, gain, pan)

def banjo_strum(at, freq, gain=0.15, pan=0.0):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * freq * tt) + 0.5 * np.sin(2 * np.pi * freq * 3 * tt)) * np.exp(-tt / 0.08)
    add(buf, x, at, gain, pan)

# 1. Optical soundtrack crackle & projector hum throughout
projector_hum = 0.025 * np.sin(2 * np.pi * 48 * t) + 0.012 * np.sin(2 * np.pi * 96 * t)
crackle = hp(noise(DUR), 1500) * 0.018
add(buf, projector_hum + crackle, 0.0, 1.0, 0.0)

# 2. Globe Ident Fanfare (0.0 - 2.8s)
brass_note(0.1, 220.0, 0.5, 0.22, -0.2)
brass_note(0.3, 277.18, 0.5, 0.22, 0.2)
brass_note(0.5, 329.63, 0.7, 0.25, 0.0)
brass_note(1.2, 440.0, 1.2, 0.3, 0.0)
drum_hit(0.1, 0.25, -0.3)
drum_hit(0.5, 0.3, 0.3)
drum_hit(1.2, 0.4, 0.0)

# 3. Spinning Newspaper whoosh & stinger (2.8 - 6.0s)
whoosh = hp(noise(0.8), 300) * env_exp(0.8, 0.1)
add(buf, whoosh, 2.8, 0.3, 0.0)
brass_note(3.2, 349.23, 0.6, 0.25, -0.1)
brass_note(3.8, 523.25, 0.8, 0.3, 0.1)
drum_hit(3.2, 0.25, -0.2)
drum_hit(3.8, 0.35, 0.2)

# 4. Charleston hot dance band beat for feature story (6.0 - 10.0s)
charleston_times = [6.0, 6.4, 6.7, 7.0, 7.4, 7.7, 8.0, 8.4, 8.7, 9.0, 9.4, 9.7]
charleston_freqs = [261.63, 329.63, 392.0, 523.25]
for i, time in enumerate(charleston_times):
    f = charleston_freqs[i % len(charleston_freqs)]
    pan_val = -0.2 if (i % 2 == 0) else 0.2
    banjo_strum(time, f, 0.18, pan_val)
    if i % 3 == 0:
        drum_hit(time, 0.2, 0.0)

# Final grand brass chord ending
brass_note(9.5, 261.63, 0.5, 0.3, 0.0)
brass_note(9.5, 329.63, 0.5, 0.3, -0.2)
brass_note(9.5, 392.0, 0.5, 0.3, 0.2)
brass_note(9.5, 523.25, 0.5, 0.35, 0.0)
drum_hit(9.5, 0.5, 0.0)

out = norm(limit(buf, 0.95))
sf.write(os.path.join(os.path.dirname(__file__), "audio.wav"), out, SR)
print("Saved audio.wav successfully.")
