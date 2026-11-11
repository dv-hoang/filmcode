"""Foley, voice and score for The Night Lamp. Reads events.json."""
import json
import os
import sys

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
import soxr
from core.audio.sfx import SR, add, bp, brown, click, compress, hp, limit, lp, noise, norm, thump

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 38.0
N = int(DUR * SR)
foley = np.zeros((N, 2), np.float32)


def env(x, a, b, fade=0.04):
    t = np.arange(len(x)) / SR
    e = np.clip((t - a) / max(1e-6, fade), 0, 1) * np.clip((b - t) / max(1e-6, fade), 0, 1)
    return x * e


def room(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(brown(d) * 2.2, 70, 700)
    t = np.arange(len(n)) / SR
    n = n * (0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t + seed))
    # faint clock-room air, not a tone
    n = n + lp(rng.standard_normal(len(n)).astype(np.float32) * 0.02, 400) * 0.15
    return norm(env(n, 0.3, d - 0.3, 0.5), 0.22)


def burin(d, seed):
    rng = np.random.default_rng(seed)
    n = hp(rng.standard_normal(int(d * SR)).astype(np.float32), 2600)
    n = bp(n, 2800, 9000)
    t = np.arange(len(n)) / SR
    chatter = 0.55 + 0.45 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 28 * t)))
    ring = np.sin(2 * np.pi * 1180 * t) * np.exp(-t * 1.4) * 0.08
    e = np.minimum(1, t / 0.03) * np.clip((d - t) / 0.08, 0, 1)
    return norm((n * chatter + ring) * e, 0.45)


def peel(d=0.9):
    rng = np.random.default_rng(7)
    n = bp(rng.standard_normal(int(d * SR)).astype(np.float32), 500, 5000)
    t = np.arange(len(n)) / SR
    e = np.minimum(1, t / 0.05) * np.exp(-((t - 0.35) ** 2) / 0.08)
    return norm(n * e, 0.5)


def rub(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(rng.standard_normal(int(d * SR)).astype(np.float32), 280, 2200)
    t = np.arange(len(n)) / SR
    e = np.minimum(1, t / 0.08) * np.clip((d - t) / 0.15, 0, 1)
    return norm(n * e, 0.4)


def scratches(count, seed):
    rng = np.random.default_rng(seed)
    d = 0.045
    out = np.zeros(int(0.5 * SR), np.float32)
    for i in range(count):
        at = int(rng.random() * 0.32 * SR)
        bit = hp(rng.standard_normal(int(d * SR)).astype(np.float32), 3500) * np.exp(-np.arange(int(d * SR)) / (SR * 0.012))
        end = min(len(out), at + len(bit))
        out[at:end] += bit[: end - at]
    return norm(out, 0.35)


def plip():
    t = np.arange(int(0.16 * SR)) / SR
    x = np.sin(2 * np.pi * (740 - 380 * t) * t) * np.exp(-t / 0.028)
    return norm(x.astype(np.float32), 0.4)


def brush(d):
    rng = np.random.default_rng(19)
    n = bp(rng.standard_normal(int(d * SR)).astype(np.float32), 600, 4000)
    t = np.arange(len(n)) / SR
    e = (0.4 + 0.6 * np.sin(2 * np.pi * 3.5 * t) ** 2) * np.minimum(1, t / 0.05)
    e *= np.clip((d - t) / 0.2, 0, 1)
    return norm(n * e, 0.32)


def whoosh(d=0.55):
    n = bp(noise(d), 400, 2800)
    t = np.arange(len(n)) / SR
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.3
    return norm(n * e, 0.35)


def dip(buf, a, b):
    i0 = int(a * SR)
    i1 = int(b * SR)
    fade = int(0.12 * SR)
    ramp = np.ones(i1 - i0, np.float32)
    ramp[:fade] = np.linspace(1, 0.05, fade)
    ramp[-fade:] = np.linspace(0.05, 1, fade)
    ramp[fade:-fade] = 0.05
    buf[i0:i1] *= ramp[:, None]


add(foley, room(10.5, 1), 0.0, 0.55, 0.0)
add(foley, room(22.0, 2), 18.2, 0.4, 0.0)
add(foley, burin(3.2, 3), 0.0, 0.85, 0.05)
add(foley, peel(1.15), 3.15, 0.7, 0.0)
add(foley, thump(0.9, 90), 4.55, 0.8, 0.0)

ev = json.load(open(os.path.join(HERE, 'events.json')))['ev']
for e in ev:
    kind = e['type']
    tt = float(e['t'])
    if kind == 'tick':
        add(foley, click(1.6, 0.25), tt, 0.22, 0.05)
    elif kind == 'tap':
        add(foley, click(0.7, 0.5), tt, 0.35, 0.0)
    elif kind == 'clock':
        add(foley, click(0.45, 0.35), tt, 0.12, -0.2)
    elif kind == 'hatch':
        add(foley, scratches(int(e.get('n', 4)), int(tt * 10)), tt, 0.4, 0.1)
    elif kind == 'burnish':
        add(foley, rub(float(e.get('dur', 1.6)), 8), tt, 0.75, 0.0)
    elif kind == 'scribe':
        add(foley, rub(0.85, 12), tt, 0.45, 0.15)
        add(foley, click(2.4, 0.4), tt, 0.3, 0.2)
    elif kind == 'whoosh':
        add(foley, whoosh(0.7), tt, 0.45, 0.15)
    elif kind == 'land':
        add(foley, thump(0.45, 140), tt, 0.35, 0.1)
    elif kind == 'plip':
        add(foley, plip(), tt, 0.7, 0.05)
    elif kind == 'brush':
        add(foley, brush(float(e.get('dur', 2.0))), tt, 0.55, 0.0)
    elif kind == 'scratch':
        add(foley, scratches(6, 21), tt, 0.28, -0.05)
    elif kind in ('burin', 'peel', 'thump', 'line'):
        pass
    else:
        raise SystemExit(f'unknown event {kind}')

dip(foley, 8.5, 9.9)
dip(foley, 16.4, 18.12)

voice = np.zeros((N, 2), np.float32)
vbox = np.zeros((N, 2), np.float32)
for e in ev:
    if e['type'] != 'line':
        continue
    path = os.path.join(HERE, 'tts', 'voices', f"{e['id']}.wav")
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR).astype(np.float32)
    x = compress(x, thr=0.22, ratio=3.2, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    rms = float(np.sqrt((x ** 2).mean()))
    x = x * (0.13 / max(rms, 1e-9))
    add(voice, x, float(e['t']), 1.0, 0.0)
    add(vbox, np.abs(x), float(e['t']), 1.0, 0.0)

music, msr = sf.read(os.path.join(HERE, 'music', 'music.wav'), dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR).astype(np.float32)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
else:
    music = music[:N]
mrms = float(np.sqrt((music ** 2).mean()))
music *= 0.04 / max(mrms, 1e-9)

voice_env = vbox.mean(axis=1)
k = max(1, int(0.28 * SR))
csum = np.cumsum(np.concatenate([np.zeros(1, np.float32), voice_env]))
voice_env = (csum[k:] - csum[:-k]) / k
voice_env = np.pad(voice_env, (0, len(csum) - 1 - len(voice_env)))
peak = float(voice_env.max())
voice_env = np.clip(voice_env / (peak + 1e-9), 0, 1)
music *= (1.0 - 0.5 * voice_env)[:, None]

mix = music + foley + voice
for ch in range(2):
    mix[:, ch] = limit(mix[:, ch], 0.92, 0.008)
peak = float(np.abs(mix).max())
mix *= 0.86 / max(peak, 1e-9)

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = os.path.join(HERE, 'out', 'mix.wav')
sf.write(out, mix, SR)
print('wrote', out)
