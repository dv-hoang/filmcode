"""Audio generation for Satellite Briefing — analog CRT hum, telemetry beeps, relay clicks."""
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
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.3))
    add(buf, x, at, gain, pan)

def click(at, gain=0.04, pan=0.0):
    x = hp(noise(0.02), 2500) * env_exp(0.02, 0.003)
    add(buf, x, at, gain, pan)

# Low satellite telemetry drone & hum
hum = 0.03 * np.sin(2 * np.pi * 60 * t) + 0.015 * np.sin(2 * np.pi * 120 * t)
hum += 0.008 * np.sin(2 * np.pi * 240 * t)
hum *= 1 + 0.05 * np.sin(2 * np.pi * 0.5 * t)
add(buf, hum, 0.0, 1.0, 0.0)

# Broadband noise floor (analyst console static)
static_noise = hp(noise(DUR), 800) * 0.012
add(buf, static_noise, 0.0, 1.0, 0.0)

# Telemetry locking beeps & interface clicks
click(0.2, 0.06, -0.2)
click(0.4, 0.06, 0.2)
beep(1.0, 1200, 0.08, 0.1, -0.1)
beep(1.5, 1400, 0.08, 0.1, 0.1)

# Zoom stabilization click
click(3.5, 0.08, 0.0)
beep(3.5, 880, 0.15, 0.14, 0.0)
beep(3.7, 1760, 0.12, 0.12, 0.0)

# Time-lapse shifting clicks (7.5s onwards)
for i in range(5):
    at = 7.5 + i * 0.5
    click(at, 0.05, (i % 2) * 0.4 - 0.2)
    beep(at, 2200 + i * 150, 0.05, 0.08, 0.0)

# Final lock confirmation tone
beep(9.5, 2400, 0.3, 0.18, 0.0)

# Master limit and export
out = limit(buf, 0.98)
sf.write(os.path.join(os.path.dirname(__file__), "audio.wav"), out, SR, subtype="PCM_16")
print("audio.py complete: audio.wav generated successfully.")
