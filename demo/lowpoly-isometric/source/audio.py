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

def beep(at, freq, dur=0.15, gain=0.12, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / (dur * 0.4))
    x += 0.3 * np.sin(2 * np.pi * freq * 2.0 * tt) * np.exp(-tt / (dur * 0.3))
    add(buf, x, at, gain, pan)

def pop(at, freq=440, gain=0.15, pan=0.0):
    n = int(0.1 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * (1 + tt * 5)) * np.exp(-tt / 0.03)
    add(buf, x, at, gain, pan)

wind = brown(DUR) * 0.05
wind = lp(wind, 800)
add(buf, wind, 0.0, 1.0, 0.0)

notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51]
for i in range(35):
    at = i * 0.08
    freq = notes[i % len(notes)]
    pan = ((i % 7) - 3) / 4.0
    pop(at, freq=freq + (i * 12), gain=0.08, pan=pan)

chord_times = [3.5, 4.2, 5.0, 6.2, 7.5, 8.5]
chord_freqs = [
    [523.25, 659.25, 783.99],
    [587.33, 698.46, 880.00],
    [440.00, 554.37, 659.25],
    [349.23, 440.00, 523.25],
    [392.00, 493.88, 587.33],
    [523.25, 659.25, 783.99]
]

for idx, time in enumerate(chord_times):
    freqs = chord_freqs[idx % len(chord_freqs)]
    for f_idx, f in enumerate(freqs):
        pan = (f_idx - 1) * 0.3
        beep(time + f_idx * 0.06, f * 1.5, dur=0.6, gain=0.1, pan=pan)

limit(buf, 0.95)
out_path = os.path.join(os.path.dirname(__file__), "audio.wav")
sf.write(out_path, buf, SR)
print(f"Wrote audio to {out_path}, duration {DUR}s")
