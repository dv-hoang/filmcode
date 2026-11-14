#!/usr/bin/env python3
import math, wave, struct

DUR = 10
SAMPLE_RATE = 44100
FREQ = 440.0

n_samples = int(SAMPLE_RATE * DUR)
with wave.open('audio.wav', 'w') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)  # 16-bit
    wf.setframerate(SAMPLE_RATE)
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        val = 0.5 * math.sin(2 * math.pi * FREQ * t)
        packed = struct.pack('<h', int(val * 32767))
        wf.writeframes(packed)
