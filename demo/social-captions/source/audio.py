"""Sound-off social news punchy sound design."""
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

def thud(at, freq=80, dur=0.15, gain=0.3, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.25))
    x += hp(noise(dur), 400) * env_exp(dur, 0.01) * 0.3
    add(buf, x, at, gain, pan)

def pop(at, freq=440, dur=0.08, gain=0.2, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.2))
    add(buf, x, at, gain, pan)

def slide_whoosh(at, dur=0.4, gain=0.15, pan=0.0):
    n = int(dur * SR)
    x = lp(noise(dur), 1200) * env_exp(dur, 0.1)
    add(buf, x, at, gain, pan)

# --- Sound beat arrangement ---

# Scene 1: Hook beats (captions slamming in)
thud(0.3, 100, 0.2, 0.35, -0.1)
thud(0.7, 120, 0.2, 0.4, 0.1)
thud(1.1, 140, 0.2, 0.45, -0.2)
thud(1.5, 90, 0.25, 0.5, 0.0)

# Source tag slide
slide_whoosh(0.1, 0.3, 0.12, -0.3)

# Scene 2: Document slide & Rolling number ticks
slide_whoosh(2.8, 0.4, 0.2, 0.3)
thud(3.4, 110, 0.2, 0.35, -0.1)
thud(3.8, 130, 0.2, 0.4, 0.1)

# Rolling number electronic tick sounds (rapid pops)
for step_t in np.linspace(4.0, 5.2, 12):
    pop(step_t, 600 + (step_t * 200) % 400, 0.04, 0.08, 0.0)

thud(5.3, 100, 0.25, 0.4, 0.0)

# Scene 3: Final takeaway beats
slide_whoosh(6.4, 0.5, 0.25, 0.0)
thud(6.6, 90, 0.2, 0.35, -0.2)
thud(7.2, 150, 0.25, 0.5, 0.1)
thud(8.0, 110, 0.2, 0.3, 0.0)

# Final limiter and write
buf = limit(buf)
sf.write(os.path.join(os.path.dirname(__file__), "audio.wav"), buf, SR)
print("Wrote audio.wav successfully.")
