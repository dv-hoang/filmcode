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

def kick(at, pan=0.0):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 90 * np.exp(-tt * 12) * tt) * np.exp(-tt * 8)
    add(buf, x, at, 0.35, pan)

def snare_brush(at, pan=0.0):
    x = hp(noise(0.12), 1800) * env_exp(0.12, 0.03)
    add(buf, x, at, 0.12, pan)

def jazz_chord(at, freqs, dur=0.8, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    for f in freqs:
        x += np.sin(2 * np.pi * f * tt) * 0.1
    x *= np.exp(-tt / (dur * 0.5))
    add(buf, x, at, 0.2, pan)

def pop_beep(at, freq=1200, pan=0.0):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / 0.02)
    add(buf, x, at, 0.25, pan)

# Cool jazz bassline groove + kitchen sound effects
beats = [0.0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6, 6.4, 7.2, 8.0, 8.8, 9.6]
for i, b in enumerate(beats):
    kick(b, -0.2 if i % 2 == 0 else 0.2)
    if i % 2 == 1:
        snare_brush(b + 0.4, 0.3)

# Chords at bar starts
jazz_chord(0.0, [220.0, 261.63, 329.63, 392.00], 1.5, -0.1) # Am9
jazz_chord(3.2, [174.61, 220.0, 261.63, 329.63], 1.5, 0.1)  # Fmaj7
jazz_chord(6.4, [196.00, 246.94, 293.66, 349.23], 1.5, 0.0)  # G7

# Toaster pop sound at t=3.5
pop_beep(3.5, 1400, 0.4)
snare_brush(3.55, 0.4)

# Clock ticks every second
for s in range(10):
    pop_beep(float(s), 800, 0.0)

# Room tone (warm vinyl/air)
room = brown(DUR) * 0.015
add(buf, room, 0.0, 1.0, 0.0)

# Limit and normalize
limit(buf, 0.95)
norm(buf)

out_path = os.path.join(os.path.dirname(__file__), "audio.wav")
sf.write(out_path, buf, SR)
print(f"Wrote {out_path}, duration {DUR}s")
