import os, sys
LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio.sfx import SR, add, limit, noise, hp, lp, brown, norm, env_exp

DUR = 10.0
N = int(DUR * SR)
buf = np.zeros((N, 2), np.float32)
t = np.arange(N) / SR

# Mechanical stage zoom hum and objective lens servo clicks
def servo_tone(at, dur, freq_start, freq_end, gain=0.08):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    # Frequency sweep for optical focus motor
    freqs = np.linspace(freq_start, freq_end, n)
    phase = np.cumsum(2 * np.pi * freqs / SR)
    x = np.sin(phase) * env_exp(dur, 0.05)
    add(buf, x, at, gain, 0.0)

# Stepper motor sound for fine focus
def click(at, gain=0.04, pan=0.0):
    x = hp(noise(0.015), 3000) * env_exp(0.015, 0.002)
    add(buf, x, at, gain, pan)

# Optical cooling fan hum (low rumble)
fan = brown(DUR) * 0.018
fan = lp(fan, 180)
add(buf, fan, 0.0, 1.0, 0.0)

# High magnification lens whines and focus shifts
servo_tone(0.2, 2.5, 120, 240, 0.06)
servo_tone(3.0, 3.5, 240, 480, 0.08)
servo_tone(7.0, 2.8, 480, 320, 0.07)

# Focus lock relay clicks
click(0.5, 0.05, -0.2)
click(0.53, 0.05, 0.2)
click(3.2, 0.06, 0.1)
click(6.8, 0.05, -0.1)
click(9.5, 0.08, 0.0)

# Digital instrumentation beeps
def beep(at, freq, dur=0.08, gain=0.05):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.25))
    add(buf, x, at, gain, 0.0)

beep(0.2, 1200, 0.06, 0.04)
beep(0.28, 1800, 0.06, 0.04)
beep(5.0, 2400, 0.05, 0.03)

buf = limit(norm(buf, 0.92))
out_path = os.path.join(os.path.dirname(__file__), "audio.wav")
sf.write(out_path, buf, SR)
