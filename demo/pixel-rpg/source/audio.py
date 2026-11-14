"""16-bit RPG Chiptune Soundtrack & SFX Generator."""
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

def square_wave(freq, dur, duty=0.5):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    phase = (tt * freq) % 1.0
    x = np.where(phase < duty, 1.0, -1.0)
    return x

def arpeggio(at, freqs, note_dur=0.08, total_dur=1.0, gain=0.1, pan=0.0):
    num_notes = int(total_dur / note_dur)
    for i in range(num_notes):
        f = freqs[i % len(freqs)]
        n = int(note_dur * SR)
        tt = np.arange(n) / SR
        phase = (tt * f) % 1.0
        x = np.where(phase < 0.5, 1.0, -1.0) * np.exp(-tt / (note_dur * 0.7))
        add(buf, x, at + i * note_dur, gain, pan)

def pulse_note(at, freq, dur=0.2, gain=0.12, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    phase = (tt * freq) % 1.0
    x = np.where(phase < 0.3, 1.0, -1.0) * np.exp(-tt / (dur * 0.5))
    add(buf, x, at, gain, pan)

def noise_hit(at, dur=0.1, gain=0.1, pan=0.0):
    x = noise(dur) * env_exp(dur, 0.01)
    add(buf, x, at, gain, pan)

# --- 1. OVERWORLD INTRO (0.0 - 3.0s) ---
# Chiptune arpeggio intro (D minor chords: D3, F3, A3, C4)
d_minor = [146.83, 174.61, 220.0, 261.63, 293.66, 349.23, 440.0]
arpeggio(0.2, d_minor, 0.09, 2.6, 0.09, -0.2)
pulse_note(0.2, 293.66, 0.5, 0.14, -0.2)
pulse_note(0.8, 349.23, 0.5, 0.14, -0.1)
pulse_note(1.4, 440.0, 0.7, 0.15, 0.0)
noise_hit(2.8, 0.2, 0.15, 0.0)

# --- 2. BATTLE ENCOUNTER (3.0 - 7.0s) ---
# Fast battle rhythm and sword clash
battle_freqs = [220.0, 261.63, 329.63, 392.0]
for i in range(4):
    t_offset = 3.0 + i * 1.0
    arpeggio(t_offset, battle_freqs, 0.07, 0.9, 0.1, 0.2)
    pulse_note(t_offset, 110.0, 0.3, 0.15, 0.2)

# Sword slash hit sound at t = 5.2s
noise_hit(5.2, 0.15, 0.25, 0.3)
pulse_note(5.2, 880.0, 0.15, 0.18, 0.3)

# Monster roar / heavy hit at 5.5s
heavy_rumble = brown(0.5) * env_exp(0.5, 0.05)
add(buf, heavy_rumble, 5.3, 0.2, 0.0)

# --- 3. VICTORY FANFARE (7.0 - 10.0s) ---
# Triumphant fanfare arpeggio (C major: C4, E4, G4, C5)
victory_freqs = [261.63, 329.63, 392.0, 523.25]
arpeggio(7.1, victory_freqs, 0.12, 1.2, 0.15, 0.0)
pulse_note(7.1, 523.25, 0.4, 0.18, -0.1)
pulse_note(7.6, 659.25, 0.4, 0.18, 0.0)
pulse_note(8.2, 783.99, 0.8, 0.2, 0.1)

# Final chord ring out
pulse_note(9.0, 523.25, 0.9, 0.15, 0.0)
pulse_note(9.0, 659.25, 0.9, 0.15, -0.1)
pulse_note(9.0, 783.99, 0.9, 0.15, 0.1)

# Limit and normalize output
out = limit(buf, 0.98)
out = norm(out, 0.95)

out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out_path, out, SR)
print(f"Generated audio: {out_path} ({DUR}s)")
