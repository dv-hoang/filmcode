#!/usr/bin/env python3
import wave, struct, math

DUR = 10
RATE = 44100
FREQ = 440

with wave.open('audio.wav', 'w') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(RATE)
    frames = int(DUR * RATE)
    for i in range(frames):
        t = i / RATE
        val = int(32767 * 0.3 * math.sin(2 * math.pi * FREQ * t))
        wf.writeframes(struct.pack('<h', val))

print('audio.wav written')
