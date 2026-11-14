import os, sys
LIB = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'core')
sys.path.insert(0, LIB)

import numpy as np
import wave

from core.audio.sfx import SR, add, limit, noise, hp, lp, brown, env_exp

DUR = 10

# time array
samples = int(SR * DUR)
t = np.linspace(0, DUR, samples, endpoint=False)

# simple descending tone: 440Hz to 220Hz over 10s
freq_start = 440
freq_end = 220
freq = np.linspace(freq_start, freq_end, samples)

tone = np.sin(2 * np.pi * freq * t)
# envelope: quick fade in/out
env = env_exp(t, 0, DUR, 0.05, 0.95)

tone = tone * env

# background brown noise
bg = brown(DUR) * 0.05

# mix
mix = add(tone, bg)

# limit to [-1,1]
mix = limit(mix, -1, 1)

# convert to 16-bit PCM
mix_int16 = np.int16(mix * 32767)

# write wav
wav_path = os.path.join(os.path.dirname(__file__), 'audio.wav')
with wave.open(wav_path, 'wb') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(mix_int16.tobytes())

print('Audio written to', wav_path)
