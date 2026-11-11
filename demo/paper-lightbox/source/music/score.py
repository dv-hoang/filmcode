"""First Bloom — music box, koto, kalimba. 60 BPM. Original motif."""
import sys, os, json
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
from core.audio import pluck as P
from core.audio.sfx import SR, add, limit

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TL = json.load(open(os.path.join(ROOT, 'timeline.json'), encoding='utf-8'))
DUR = float(TL['dur'])
buf = np.zeros((int(DUR * SR), 2), np.float32)


def pl(preset, t, pitch, dur, vel, pan=0.0):
    if t >= DUR:
        return
    x = P.pluck(preset, pitch, dur, vel=vel)
    add(buf, x, t, 1.0, pan)


# A — box alone, then a pocket of quiet before the match
pl('music_box', 0.0, 'D5', 1.8, 0.34, 0.15)
pl('music_box', 2.0, 'F5', 1.6, 0.28, 0.2)
pl('music_box', 3.0, 'A5', 1.4, 0.24, 0.12)
# 4.2–5.0 silence

# B — match, koto under the box
pl('music_box', 5.0, 'G5', 1.5, 0.4, 0.18)
pl('koto', 5.0, 'D4', 2.2, 0.3, -0.25)
pl('koto', 7.0, 'A4', 1.8, 0.26, -0.15)
pl('koto', 9.0, 'F4', 1.8, 0.24, -0.2)
pl('music_box', 11.0, 'D6', 1.4, 0.32, 0.22)
pl('koto', 11.0, 'A4', 2.0, 0.28, -0.1)
pl('koto', 13.0, 'D4', 1.6, 0.22, -0.22)
pl('music_box', 14.0, 'A5', 1.3, 0.2, 0.16)
pl('koto', 15.0, 'F4', 1.5, 0.18, -0.12)
# 16–17.2 silence (ring only)

# C — kalimba arrives with the flower
pl('kalimba', 18.0, 'D5', 2.2, 0.4, 0.28)
pl('kalimba', 18.15, 'F5', 2.0, 0.34, 0.18)
pl('kalimba', 18.32, 'A5', 2.2, 0.3, 0.08)
pl('koto', 18.0, 'D4', 2.4, 0.26, -0.22)
pl('kalimba', 20.0, 'G5', 1.6, 0.26, 0.2)
pl('koto', 21.0, 'A4', 1.8, 0.22, -0.16)
pl('kalimba', 22.5, 'F5', 1.8, 0.24, 0.14)
pl('koto', 24.0, 'D4', 2.0, 0.2, -0.2)
pl('music_box', 25.0, 'D5', 1.6, 0.18, 0.12)

# D — thin, then the opening motif again as the camera leaves the box
pl('music_box', 27.0, 'F5', 1.5, 0.16, 0.14)
pl('koto', 29.0, 'A4', 1.6, 0.14, -0.1)
pl('music_box', 32.0, 'D5', 2.0, 0.3, 0.16)
pl('music_box', 34.0, 'F5', 1.8, 0.26, 0.18)
pl('music_box', 36.0, 'A5', 1.8, 0.24, 0.12)
pl('music_box', 37.2, 'D5', 2.4, 0.28, 0.08)

buf = limit(buf, 0.9)
out = os.path.join(HERE, 'music.wav')
sf.write(out, buf, SR)
print('wrote', out, f'{DUR:.1f}s')
