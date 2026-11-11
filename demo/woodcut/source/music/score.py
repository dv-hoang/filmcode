"""One Ember — contrabass drone, cello spiccato, wood, one tam-tam, one metal strike.

72 BPM, then 108 (3:2), then a ritard. No bell. Times match timeline.json.
"""
import os
import sys

import numpy as np
import soundfile as sf

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)

from core.audio.sfx import SR, add, bp, norm

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 38.0
N = int(DUR * SR)
music = np.zeros((N, 2), np.float32)


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def env(n, attack, decay):
    t = np.arange(n) / SR
    att = np.clip(t / max(attack, 1e-4), 0, 1)
    dec = np.exp(-t / max(decay, 1e-3))
    return att * dec


def cello(f0, dur, seed, vel=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * f0 * t
    tone = np.sin(ph) + 0.38 * np.sin(2 * ph) + 0.14 * np.sin(3 * ph)
    rng = np.random.default_rng(seed)
    bow = bp(rng.standard_normal(n), 700, 3800)
    y = (tone * 0.82 + bow * 0.22) * env(n, 0.012, dur * 0.42)
    return norm(y, vel)


def drone(f0, dur, seed, third=0.0):
    """third is semitones above the minor third (0 = F, 1 = F#)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f_third = f0 * 2 ** ((3 + third) / 12)
    y = (
        0.22 * np.sin(2 * np.pi * (f0 / 2) * t)
        + 0.7 * np.sin(2 * np.pi * f0 * t)
        + 0.28 * np.sin(2 * np.pi * f0 * 2 * t)
        + 0.16 * np.sin(2 * np.pi * f_third * t)
    )
    rng = np.random.default_rng(seed)
    air = bp(rng.standard_normal(n), 200, 900) * 0.04
    att = np.clip(t / 0.4, 0, 1) * np.clip((dur - t) / 0.5, 0, 1)
    return norm((y + air) * att, 0.55)


def woodblock(pitch=1.0):
    d = 0.07
    t = np.arange(int(d * SR)) / SR
    y = np.sin(2 * np.pi * 780 * pitch * t) * np.exp(-t / 0.012)
    y += np.sin(2 * np.pi * 1490 * pitch * t) * np.exp(-t / 0.007) * 0.35
    rng = np.random.default_rng(int(pitch * 100))
    y += bp(rng.standard_normal(len(t)), 1800, 6000) * np.exp(-t / 0.008) * 0.2
    return norm(y, 0.62)


def frame_drum():
    d = 0.35
    t = np.arange(int(d * SR)) / SR
    y = np.sin(2 * np.pi * 118 * t) * np.exp(-t / 0.08)
    y += np.sin(2 * np.pi * 196 * t) * np.exp(-t / 0.05) * 0.4
    rng = np.random.default_rng(4)
    y += bp(rng.standard_normal(len(t)), 400, 2400) * np.exp(-t / 0.03) * 0.25
    return norm(y, 0.5)


def tam_tam():
    dur = 4.2
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n, np.float32)
    for f, amp, dec in ((52, 1.0, 1.7), (91, 0.55, 1.15), (138, 0.32, 0.8),
                        (207, 0.18, 0.55), (333, 0.1, 0.35)):
        y += np.float32(amp * np.sin(2 * np.pi * f * t) * np.exp(-t / dec))
    rng = np.random.default_rng(9)
    y += np.float32(bp(rng.standard_normal(n), 70, 1800) * np.exp(-t / 0.45) * 0.45)
    y *= np.float32(np.clip(t / 0.004, 0, 1))
    return norm(y, 0.95)


def metal():
    """Five inharmonic partials and a hammer transient. Not a bell."""
    dur = 2.4
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n, np.float32)
    for f, amp, dec in ((640, 0.7, 0.9), (1013, 1.0, 0.7), (1488, 0.45, 0.5),
                        (2210, 0.28, 0.32), (3075, 0.16, 0.22)):
        y += np.float32(amp * np.sin(2 * np.pi * f * t) * np.exp(-t / dec))
    rng = np.random.default_rng(15)
    y += np.float32(bp(rng.standard_normal(n), 2000, 8000) * np.exp(-t / 0.012) * 0.55)
    y *= np.float32(np.clip(t / 0.002, 0, 1))
    return norm(y, 0.7)


D3 = hz(50)
F3 = hz(53)
A3 = hz(57)
G3 = hz(55)
D4 = hz(62)

# Dorian drone. Quiet octave-down lives inside drone().
add(music, drone(D3, 10.6, 1, 0.0), 0.15, 0.85, 0.0)
add(music, drone(D3, 5.6, 2, 0.0), 12.55, 0.8, 0.0)
add(music, drone(D3, 3.5, 3, 0.0), 19.75, 0.9, 0.0)
# Modal shift inside the tam-tam's decay: F lifts toward F#.
add(music, drone(D3, 2.3, 4, 0.85), 23.15, 0.75, 0.05)
add(music, drone(D3, 10.4, 5, 0.0), 27.25, 0.7, 0.0)

add(music, cello(D3, 0.28, 11), 0.5, 0.7, -0.15)
add(music, cello(A3, 0.26, 12), 2.17, 0.62, 0.2)
add(music, cello(F3, 0.24, 13), 3.83, 0.58, -0.1)
add(music, cello(D3, 0.3, 14), 5.5, 0.6, 0.18)
add(music, cello(G3, 0.26, 15), 7.17, 0.55, -0.2)
add(music, cello(A3, 0.24, 16), 8.83, 0.5, 0.12)
add(music, cello(F3, 0.22, 17), 10.5, 0.45, -0.08)

add(music, cello(D3, 0.32, 18), 13.9, 0.4, 0.1)
add(music, cello(A3, 0.28, 19), 15.6, 0.42, -0.15)

# 108 BPM after the silence: a few bows, not a grid of them.
for i, (tt, note) in enumerate((
    (19.95, D3), (20.51, F3), (21.06, A3), (21.62, D4), (22.73, A3), (23.84, F3),
)):
    add(music, cello(note, 0.16, 30 + i, 0.42), tt, 0.55, -0.2 if i % 2 == 0 else 0.22)

add(music, cello(D3, 1.6, 40, 0.48), 24.15, 0.5, 0.0)
add(music, cello(D3, 2.8, 41, 0.4), 28.4, 0.55, -0.08)
add(music, cello(A3, 2.2, 42, 0.32), 32.4, 0.4, 0.12)
add(music, cello(D4, 3.2, 43, 0.28), 33.7, 0.35, 0.0)

for i, tt in enumerate((0.55, 2.15, 4.7, 12.4, 18.15, 30.3)):
    add(music, woodblock(0.96 + (i % 3) * 0.04), tt, 0.7, -0.35 if i % 2 == 0 else 0.3)

add(music, frame_drum(), 19.7, 0.65, -0.2)
add(music, frame_drum(), 20.82, 0.5, 0.18)
add(music, frame_drum(), 21.94, 0.42, -0.1)

add(music, tam_tam(), 19.7, 0.72, 0.0)
add(music, metal(), 27.05, 0.85, 0.28)

# Silences are cut in mix.py so the picture and the mix share one clock.
peak = float(np.abs(music).max())
if peak > 0:
    music *= np.float32(0.9 / peak)

out = os.path.join(HERE, 'music.wav')
sf.write(out, music, SR)
print('score', out, f'{DUR:.1f}s')
