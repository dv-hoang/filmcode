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

def marker_stroke_sfx(at, dur=0.6, gain=0.08, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    # Frictional scrape sound for marker drawing
    x = hp(brown(dur), 800) * env_exp(dur, 0.05) * 0.4
    x += lp(noise(dur), 1500) * np.sin(2 * np.pi * 120 * tt) * env_exp(dur, 0.08) * 0.3
    add(buf, x, at, gain, pan)

def pin_snap(at, gain=0.15, pan=0.0):
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    x = hp(noise(0.05), 3000) * env_exp(0.05, 0.005)
    add(buf, x, at, gain, pan)

# Pin placement clicks at start of photos
pin_snap(0.1, 0.12, -0.3)
pin_snap(1.5, 0.12, 0.0)
pin_snap(2.2, 0.12, 0.3)
pin_snap(0.05, 0.1, 0.0) # Title pin

# Marker drawing strokes corresponding to animated marker lines
marker_stroke_sfx(3.2, 1.2, 0.07, -0.2)
marker_stroke_sfx(5.0, 1.2, 0.07, 0.0)
marker_stroke_sfx(7.0, 1.5, 0.09, 0.25)

# Subtle room air conditioning hum
room_hum = 0.015 * np.sin(2 * np.pi * 60 * t) + 0.008 * np.sin(2 * np.pi * 120 * t)
room_hum += 0.005 * brown(DUR) * 0.2
add(buf, room_hum, 0.0, 1.0, 0.0)

# Final briefing confirmation beep
beep(8.5, 880, 0.12, 0.08, 0.0)
beep(8.7, 1320, 0.15, 0.1, 0.0)

# Limit and normalize
limit(buf)
out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out_path, buf, SR)
print(f"Generated audio.wav: {out_path}")
