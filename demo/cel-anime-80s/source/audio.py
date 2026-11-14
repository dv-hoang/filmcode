import wave, struct, math

DUR=10
RATE=44100
freq=440
with wave.open('audio.wav','w') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(RATE)
    frames = int(RATE*DUR)
    for i in range(frames):
        t=i/RATE
        val=0.5*math.sin(2*math.pi*freq*t)
        wf.writeframes(struct.pack('h',int(val*32767)))
