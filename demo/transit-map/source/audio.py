import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)


import numpy as np
import soundfile as sf
from core.audio.sfx import SR, add, limit, noise, hp, lp, brown, env_exp
import os, sys
LIB = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'core')
sys.path.insert(0, LIB)


# Simple 10s silent audio
DUR = 10
samples = int(SR * DUR)
# 2 channels, 16-bit
import wave, struct
with wave.open(os.path.join(os.path.dirname(__file__), 'audio.wav'), 'w') as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    for _ in range(samples):
        wf.writeframes(struct.pack('hh', 0, 0))

print('audio.wav generated')
