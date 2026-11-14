"""Sci-Fi Hologram HUD sound design — telemetry hums, laser scans and relay beeps."""
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


def scan_sweep(at, gain=0.15):
    n = int(1.5 * SR)
    tt = np.arange(n) / SR
    freqs = np.linspace(400, 1800, n)
    x = np.sin(2 * np.pi * freqs * tt) * env_exp(1.5, 0.1)
    add(buf, x, at, gain, 0.0)


def glitch_burst(at, gain=0.08, pan=0.0):
    x = hp(noise(0.06), 3000) * env_exp(0.06, 0.01)
    add(buf, x, at, gain, pan)


# Deep holographic projector hum
hum = 0.04 * np.sin(2 * np.pi * 60 * t) + 0.02 * np.sin(2 * np.pi * 120 * t)
hum += 0.01 * np.sin(2 * np.pi * 240 * t)
hum *= np.minimum(1.0, t / 1.0)
add(buf, hum, 0, 0.8, 0.0)

# Initial scan sweep at t=0.0
scan_sweep(0.0, gain=0.18)

# Telemetry callout appearance beeps & clicks (t=1.4 to 2.2)
for i, time_pt in enumerate([1.4, 1.6, 1.8, 2.0]):
    beep(time_pt, 1200 + i * 250, dur=0.06, gain=0.1, pan=(i % 2 * 2 - 1) * 0.4)
    glitch_burst(time_pt + 0.02, gain=0.06, pan=(i % 2 * 2 - 1) * 0.4)

# Exploded view movement hum at t=2.0
exp_hum = brown(3.0) * env_exp(3.0, 0.5)
add(buf, exp_hum, 2.0, 0.1, 0.0)

# Final solid hologram synthesis chime at t=6.5
beep(6.5, 2093.0, dur=0.35, gain=0.2, pan=0.0)  # C7
beep(6.55, 3135.93, dur=0.3, gain=0.15, pan=0.0) # G7
glitch_burst(6.5, gain=0.1, pan=0.0)

# Output mastering
buf = norm(limit(buf, 0.95), 0.92)
out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out_path, buf, SR)
print(f"Wrote {out_path} successfully.")
