"""The Open Top — kalimba and nylon guitar on a 96 BPM grid. Original, no second tempo."""
import os, sys
import numpy as np
import soundfile as sf

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
from core.audio.sfx import SR, add
from core.audio.pluck import pluck

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 40.0
BPM = 96.0
BEAT = 60.0 / BPM
N = int(DUR * SR)
mix = np.zeros((N, 2), np.float32)

# Bars 7–8 (15.0–20.0) are silent. One cell, then a resolved cell after the wipe.
CELL_A = ['A4', 'C5', 'E5', 'G5']
CELL_B = ['A4', 'C5', 'E5', 'A5']


def bar_start(bar):
    return (bar - 1) * 4 * BEAT


def play(preset, pitch, t, dur, vel, pan):
    if t < 0 or t >= DUR - 0.05:
        return
    y = pluck(preset, pitch, dur, vel=vel)
    add(mix, y, t, 1.0, pan)


for bar in range(1, 17):
    if bar in (7, 8):
        continue
    cell = CELL_A if bar < 9 else CELL_B
    t0 = bar_start(bar)
    notes = 4 if bar < 15 else (2 if bar == 15 else 1)
    for i in range(notes):
        play('kalimba', cell[i], t0 + i * BEAT, 0.55 if notes == 4 else 0.9, 0.62 if bar < 15 else 0.5, -0.15)
    if bar >= 3:
        play('nylon_guitar', 'A3', t0, 1.3, 0.38, 0.22)
        if notes == 4:
            play('nylon_guitar', 'E3', t0 + 2 * BEAT, 1.1, 0.32, 0.05)

# One woodblock on the unison downbeat, bar 13.
def woodblock():
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    rng = np.random.default_rng(5)
    body = np.sin(2 * np.pi * 780 * tt) * np.exp(-tt / 0.018)
    tick = rng.standard_normal(n) * np.exp(-tt / 0.004) * 0.4
    y = (body * 0.7 + tick).astype(np.float32)
    peak = np.max(np.abs(y)) or 1
    return y / peak * 0.45


add(mix, woodblock(), bar_start(13), 0.85, 0.0)

peak = float(np.max(np.abs(mix)))
if peak > 0.9:
    mix *= 0.9 / peak
out = os.path.join(HERE, 'music.wav')
sf.write(out, mix, SR)
print('wrote', out, f'{DUR:.1f}s', 'peak', round(peak, 3))
