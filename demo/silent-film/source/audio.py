import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio.sfx import SR, add, limit, noise, hp, lp, brown, env_exp

DUR = 10.0
N = int(DUR * SR)
buf = np.zeros((N, 2), np.float32)
t = np.arange(N) / SR

def piano_note(at, freq, dur=0.4, gain=0.18, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    # Rich harmonics + exponential decay for honky-tonk photoplay piano
    x = (np.sin(2 * np.pi * freq * tt) + 
         0.5 * np.sin(2 * np.pi * freq * 2 * tt) + 
         0.25 * np.sin(2 * np.pi * freq * 3 * tt))
    x *= np.exp(-tt / (dur * 0.45))
    add(buf, x, at, gain, pan)

def projector_clatter(at, dur, gain=0.06):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    # Mechanical 24fps projector click rhythm
    for i in range(int(dur * 24)):
        t_click = i / 24.0
        click_signal = hp(noise(0.015), 3500) * env_exp(0.015, 0.002)
        add(buf, click_signal, at + t_click, gain, 0.0)

# Continuous projector clatter underneath the whole 10 seconds
projector_clatter(0.0, 10.0, 0.08)

# Photoplay Piano Rag / Chase melody (1920s silent film cue sheet style)
# Notes: D minor / G major ragtime feel
notes = [
    # Scene 1: Intertitle (Suspenseful chord setup)
    (0.0, 220.0, 0.5), (0.3, 261.63, 0.5), (0.6, 329.63, 0.8),
    (1.2, 392.00, 0.8), (1.8, 440.00, 0.8),
    
    # Scene 2: Workshop / Clockwork ticking piano melody
    (2.2, 440.00, 0.25), (2.5, 493.88, 0.25), (2.8, 523.25, 0.25), (3.1, 587.33, 0.25),
    (3.5, 523.25, 0.25), (3.8, 493.88, 0.25), (4.2, 440.00, 0.5),
    (4.8, 349.23, 0.25), (5.1, 392.00, 0.25), (5.4, 440.00, 0.5),
    (6.0, 523.25, 0.4),

    # Scene 3: Intertitle sting ("THE GREAT PURSUIT!")
    (6.5, 220.0, 0.3), (6.7, 440.0, 0.3), (6.9, 880.0, 0.5),

    # Scene 4: Fast chase music (Staccato ragtime up tempo)
    (7.5, 587.33, 0.2), (7.7, 659.25, 0.2), (7.9, 698.46, 0.2), (8.1, 783.99, 0.2),
    (8.3, 880.00, 0.2), (8.5, 783.99, 0.2), (8.7, 698.46, 0.2), (8.9, 659.25, 0.2),
    (9.1, 587.33, 0.3), (9.5, 440.00, 0.6)
]

for at, freq, dur in notes:
    piano_note(at, freq, dur=dur, gain=0.22, pan=0.0)

# Sound effect: Spring release / mechanical winding (duck escape)
spring_noise = hp(brown(0.8), 1200) * env_exp(0.8, 0.1)
add(buf, spring_noise, 4.5, 0.15, -0.2)

# Final chord / curtain close sound
piano_note(9.5, 220.0, 1.0, gain=0.3, pan=0.0)
piano_note(9.5, 329.63, 1.0, gain=0.25, pan=0.0)
piano_note(9.5, 440.0, 1.0, gain=0.25, pan=0.0)

out = limit(buf)
sf.write("audio.wav", out, SR)
print("Generated silent film photoplay piano soundtrack successfully.")
