"""The Crossing — original score. 96 BPM. Bass is the teal plate; marimba arrives with the pink plate."""
import sys, os
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
from core.audio import pluck as P
from core.audio.sfx import SR, add, limit, hp, noise

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DUR = 40.0
buf = np.zeros((int(DUR * SR), 2), np.float32)


def place(x, t, vel, pan):
    if t >= DUR or vel <= 0:
        return
    add(buf, x, t, vel, pan)


def bass(t, note, dur=0.42, vel=0.72, pan=-0.15):
    place(P.pluck('upright_bass_pizz', note, dur, vel=0.8), t, vel, pan)


def nylon(t, note, dur=1.1, vel=0.55, pan=0.2):
    place(P.pluck('nylon_guitar', note, dur, vel=0.75), t, vel, pan)


def toy(t, note, dur=0.7, vel=0.4, pan=0.05):
    place(P.pluck('music_box', note, dur, vel=0.7), t, vel, pan)


def marimba(pitch, dur, vel):
    f = 440.0 * 2 ** ((P.midi(pitch) - 69) / 12)
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = np.zeros(n, np.float32)
    for ratio, amp, tau in ((1.0, 1.0, 0.28), (4.0, 0.38, 0.09), (9.2, 0.16, 0.05)):
        y += np.sin(2 * np.pi * f * ratio * tt).astype(np.float32) * np.exp(-tt / tau) * amp
    click = hp(noise(dur), 1800)[:n] * np.exp(-tt / 0.012) * 0.35
    y = (y + click) * vel
    peak = float(np.max(np.abs(y))) or 1.0
    return (y / peak * 0.45).astype(np.float32)


def mallet(t, note, dur=0.55, vel=0.7, pan=0.18):
    place(marimba(note, dur, vel), t, 1.0, pan)


def shaker(t, vel=0.18, pan=0.35):
    n = int(0.07 * SR)
    tt = np.arange(n) / SR
    rng = np.random.default_rng(int(t * 1000) + 3)
    y = hp(rng.standard_normal(n).astype(np.float32), 2500) * np.exp(-tt / 0.02)
    peak = float(np.max(np.abs(y))) or 1.0
    place((y / peak).astype(np.float32), t, vel, pan)


# Teal plate: bass on 1 and 3 until the first silence.
for bar in range(4):
    bass(bar * 2.5, 'E2', 0.5, 0.62)
    bass(bar * 2.5 + 1.25, 'A2', 0.36, 0.48)
bass(9.375, 'E2', 0.28, 0.4)

# One note under the wait, then the pink plate.
bass(12.5, 'E2', 0.7, 0.55)
for i, note in enumerate(['E4', 'G4', 'A4', 'B4', 'A4', 'G4', 'E4', 'D4', 'E4', 'G4', 'A4', 'G4']):
    mallet(15.0 + i * 0.625, note, 0.5, 0.62 if i % 2 == 0 else 0.45, 0.22 if i % 2 == 0 else -0.05)
for bar in range(4):
    t0 = 15.0 + bar * 2.5
    bass(t0, 'E2' if bar % 2 == 0 else 'A2', 0.48, 0.58)
    bass(t0 + 1.25, 'B2' if bar % 2 == 0 else 'G2', 0.32, 0.42)
    for k in range(8):
        shaker(t0 + k * 0.3125, 0.12 + (k % 2) * 0.04, 0.3 if k % 2 == 0 else -0.25)

# Crossing: both plates, toy piano and nylon only here.
for i, note in enumerate(['E4', 'G4', 'B4', 'D5', 'B4', 'A4', 'G4', 'E4']):
    mallet(27.5 + i * 0.625, note, 0.48, 0.7, 0.12)
bass(27.5, 'E2', 0.6, 0.66)
bass(28.75, 'B2', 0.4, 0.5)
bass(30.0, 'A2', 0.45, 0.55)
bass(31.25, 'E2', 0.35, 0.4)
toy(27.5, 'B5', 0.9, 0.42, 0.08)
toy(28.75, 'D6', 0.7, 0.34, 0.16)
toy(30.0, 'E5', 1.0, 0.3, -0.04)
nylon(27.5, 'E3', 1.4, 0.5, -0.22)
nylon(29.5, 'G3', 1.2, 0.42, -0.12)
nylon(31.25, 'A3', 1.0, 0.36, -0.18)
for k in range(16):
    shaker(27.5 + k * 0.3125, 0.14, 0.2 if k % 2 == 0 else -0.2)

# Instruments leave. One nylon note under the title.
nylon(32.5, 'E3', 1.6, 0.4, -0.1)
nylon(34.5, 'B3', 1.3, 0.28, 0.05)
nylon(36.25, 'E4', 2.2, 0.34, 0.0)
nylon(38.125, 'E3', 1.8, 0.22, -0.05)

# Hard-cut the two silences so tails do not ring through them.
def mute(a, b):
    i0, i1 = int(a * SR), int(b * SR)
    fade = int(0.03 * SR)
    if fade > 0 and i0 > fade:
        buf[i0 - fade:i0] *= np.linspace(1, 0, fade, dtype=np.float32)[:, None]
    buf[i0:i1] = 0

mute(10.0, 12.5)
mute(26.15, 27.5)

buf = limit(buf, 0.9)
out = os.path.join(HERE, 'music.wav')
sf.write(out, buf, SR)
print('wrote', out, f'{DUR:.1f}s')
