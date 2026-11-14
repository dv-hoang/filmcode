import wave, math, struct
DUR=10
RATE=44100
freq=440
with wave.open('audio.wav','w') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(RATE)
    frames=[]
    for i in range(int(RATE*DUR)):
        t=i/RATE
        val=0.5*math.sin(2*math.pi*freq*t)
        frames.append(struct.pack('<h',int(val*32767)))
    wf.writeframes(b''.join(frames))
