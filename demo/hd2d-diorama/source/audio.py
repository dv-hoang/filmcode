import wave, struct, math, os, sys
# Simple ambient soundtrack for the HD‑2D Diorama demo (10 s)
DUR = 10
SAMPLE_RATE = 44100
MAX_AMPL = 32767

def sine(freq, t):
    return math.sin(2 * math.pi * freq * t)

def write_wav(path):
    with wave.open(path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        for i in range(int(DUR * SAMPLE_RATE)):
            t = i / SAMPLE_RATE
            # gentle wind: low‑frequency noise + occasional chime
            wind = 0.02 * (math.sin(0.1 * t) + math.sin(0.07 * t))
            chime = 0.0
            if 2 < t < 2.2:
                chime = 0.3 * sine(440, t)
            if 5 < t < 5.2:
                chime = 0.3 * sine(660, t)
            if 8 < t < 8.2:
                chime = 0.3 * sine(880, t)
            amp = wind + chime
            val = int(amp * MAX_AMPL)
            wf.writeframes(struct.pack('<h', val))

if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'audio.wav')
    write_wav(out)
    print('audio written to', out)
