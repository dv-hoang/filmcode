"""First Orange — original score, 72 BPM → 96 BPM peel climb → resolve."""
import sys, os
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, limit

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 42.0
BPM = 72.0
BEAT = 60.0 / BPM
buf = np.zeros((int(DUR * SR), 2), np.float32)


def n(t, inst, pitch, dur, vel, pan=0.0, **kw):
    x = S.note(inst, pitch, dur, vel=vel, **kw)
    add(buf, x, t, 1.0, pan)


def pl(preset, t, pitch, dur, vel, pan=0.0, **kw):
    x = P.pluck(preset, pitch, dur, vel=vel, **kw)
    add(buf, x, t, 1.0, pan)


# A — waiting, unresolved cello (0–11)
n(0.4, 'cellos', 'D3', 5.0, .38, -.2, attack=.8)
n(1.0, 'violins', 'A4', 4.0, .12, .25, attack=1.2)
n(5.0, 'cellos', 'E3', 4.5, .34, -.18, attack=.6)
n(5.2, 'harp', 'A5', 2.2, .14, .3)
n(8.5, 'cellos', 'E3', 2.2, .28, -.15)  # hangs unresolved

# silence pocket ~9–11 (near digital quiet under beds)

# B — knife / peel climb 96 BPM feel via pizz (11–18)
for i, pitch in enumerate(['G4', 'A4', 'B4', 'D5', 'E5']):
    t = 11.0 + i * 0.625
    n(t, 'violins_pizz', pitch, 0.5, .32 + i * 0.04, -.1 + i * 0.05)
pl('acoustic_guitar', 13.5, 'D3', 1.4, .28, -.25)
pl('acoustic_guitar', 14.7, 'A3', 1.2, .26, -.2)
pl('acoustic_guitar', 15.9, 'D4', 1.2, .24, -.15)

# C — colour flood swell (17.5–28)
n(17.5, 'cellos', 'D3', 6.0, .42, -.22, attack=.4)
n(17.8, 'violins', 'F#4', 5.5, .22, .2, attack=.7)
n(18.0, 'harp', 'D5', 2.0, .2, .28)
n(19.5, 'harp', 'A5', 2.0, .18, .32)
n(21.0, 'violins', 'A4', 5.0, .2, .15, attack=.5)
n(22.0, 'cellos', 'A2', 5.0, .3, -.28, attack=.5)
for i, pitch in enumerate(['D5', 'F#5', 'A5', 'D6']):
    n(24.0 + i * 0.7, 'glockenspiel', pitch, 1.4, .12, .3)

# D — breakfast resolve (28–42)
n(28.0, 'cellos', 'D3', 4.0, .36, -.2, attack=.3)
n(28.1, 'violins', 'D5', 3.5, .18, .22, attack=.4)
n(28.2, 'harp', 'F#5', 2.5, .16, .25)
n(32.0, 'cellos', 'D3', 5.0, .3, -.18, attack=.5)
n(32.2, 'violins', 'A4', 4.5, .14, .2, attack=.6)
n(36.0, 'cellos_pizz', 'D4', 0.8, .22, 0.0)
# soft settle — leave last 1.5s sparse

buf = limit(buf, 0.95)
buf = S.room(buf, size=.4, mix=.16)
out = os.path.join(HERE, 'music.wav')
sf.write(out, buf, SR)
print('wrote', out)
