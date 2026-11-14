"""Precision hardware teardown sfx: servo hums, mechanical clicks, metallic snaps."""
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

def beep(at, freq, dur=0.08, gain=0.08, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.25))
    add(buf, x, at, gain, pan)

def mechanical_click(at, gain=0.12, pan=0.0):
    # Sharp mechanical actuation sound for layer lift / snap
    x = hp(noise(0.04), 3000) * env_exp(0.04, 0.002)
    add(buf, x, at, gain, pan)
    beep(at, 880, 0.03, gain * 0.5, pan)

def servo_whine(at, dur, start_f, end_f, gain=0.04, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    freqs = np.linspace(start_f, end_f, n)
    phase = np.cumsum(2 * np.pi * freqs / SR)
    x = np.sin(phase) * env_exp(dur, 0.05)
    add(buf, x, at, gain, pan)

# Subtle ambient studio hum
studio_amb = brown(DUR) * 0.015
studio_amb = lp(studio_amb, 400)
add(buf, studio_amb, 0.0, 1.0, 0.0)

# Sound cues matching the 10s timeline
# 1. Start-up servo and beep at 0.5s
servo_whine(0.2, 1.2, 120, 360, 0.05, 0.0)
beep(0.5, 1200, 0.08, 0.1, 0.0)

# 2. Explode layers lift at 2.0s
servo_whine(2.0, 3.0, 200, 520, 0.07, -0.2)
mechanical_click(2.0, 0.15, -0.2)
mechanical_click(2.2, 0.12, 0.2)
mechanical_click(2.5, 0.14, 0.0)
beep(2.1, 1500, 0.06, 0.08, 0.0)

# 3. Macro zoom and focus at 6.8s
servo_whine(6.8, 1.5, 400, 650, 0.06, 0.3)
mechanical_click(6.8, 0.1, 0.3)
beep(7.0, 2400, 0.05, 0.08, 0.3)

# 4. Re-assembly / closing at 7.0 - 8.5s
servo_whine(7.2, 1.5, 520, 200, 0.06, 0.2)
mechanical_click(8.3, 0.16, 0.0)
mechanical_click(8.5, 0.18, 0.0)
beep(8.5, 600, 0.1, 0.12, 0.0)

# 5. Final HUD lock beep at 9.2s
beep(9.2, 1760, 0.12, 0.1, 0.0)

# Master limit and export
out = limit(buf, 0.95)
sf.write(os.path.join(os.path.dirname(__file__), "audio.wav"), out, SR)
print("Saved audio.wav successfully.")
