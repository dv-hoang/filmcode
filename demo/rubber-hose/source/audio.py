"""Hot jazz big-band ragtime soundtrack with snappy percussion and trumpet stabs for rubber-hose cartoon."""
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

def kick(at, pan=0.0):
    n = int(0.15 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (110 - tt * 600) * tt) * np.exp(-tt * 25)
    add(buf, x, at, 0.35, pan)

def snare(at, pan=0.0):
    x = hp(noise(0.08), 1200) * env_exp(0.08, 0.02)
    add(buf, x, at, 0.25, pan)

def hihat(at, pan=0.0):
    x = hp(noise(0.04), 5000) * env_exp(0.04, 0.005)
    add(buf, x, at, 0.15, pan)

def jazz_note(at, freq, dur=0.2, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    # Brass-like harmonic stack with growl
    x = (np.sin(2 * np.pi * freq * tt) + 
         0.5 * np.sin(2 * np.pi * freq * 2 * tt) + 
         0.3 * np.sin(2 * np.pi * freq * 3 * tt))
    x *= np.exp(-tt / (dur * 0.4))
    x = lp(x, 2800)
    add(buf, x, at, 0.22, pan)

# Ragtime swing tempo (approx 160 bpm, 4 beats per second = 2.4s per measure approx)
# Beat timing over 10 seconds
beats = np.arange(0, DUR, 0.375)
for i, b in enumerate(beats):
    # Swing drum pattern
    kick(b, pan=-0.2)
    if i % 2 == 1:
        snare(b, pan=0.2)
    hihat(b, pan=0.0)
    hihat(b + 0.1875, pan=0.1)

    # Jazzy upbeat brass stabs
    if i % 4 == 0:
        jazz_note(b, 220, dur=0.25, pan=-0.3)
    elif i % 4 == 2:
        jazz_note(b, 330, dur=0.25, pan=0.3)
    elif i % 4 == 3:
        jazz_note(b, 440, dur=0.3, pan=0.0)

# Intro whistle / slide
slide_t = 0.5
n_slide = int(0.5 * SR)
tt_s = np.arange(n_slide) / SR
slide_x = np.sin(2 * np.pi * (300 + tt_s * 600) * tt_s) * np.exp(-tt_s * 3)
add(buf, slide_x, slide_t, 0.2, 0.0)

out = norm(limit(buf))
sf.write(os.path.join(os.path.dirname(__file__), "audio.wav"), out, SR)
print("Saved audio.wav successfully.")
