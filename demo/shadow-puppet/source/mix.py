"""Foley, voice and score → out/mix.wav. Beds hard-cut in the two silences."""
import json
import os
import sys

import numpy as np
import soundfile as sf
import soxr

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
from core.audio.sfx import SR, add, bp, compress, hp, limit, lp, norm  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
CUE = json.load(open(os.path.join(HERE, 'cue.json'), encoding='utf-8'))
DUR = float(CUE['dur'])
T = CUE['t']
N = int(round(DUR * SR))
rng = np.random.default_rng(23)


def env(x, a, b, fade=0.04):
    t = np.arange(len(x)) / SR
    e = np.clip((t - a) / max(1e-6, fade), 0, 1) * np.clip((b - t) / max(1e-6, fade), 0, 1)
    return x * e


def room(d, seed):
    r = np.random.default_rng(seed)
    n = bp(np.cumsum(r.standard_normal(int(d * SR)).astype(np.float32)), 70, 700)
    n = hp(n, 40)
    t = np.arange(len(n)) / SR
    n *= 0.65 + 0.35 * np.sin(2 * np.pi * 0.07 * t)
    return norm(n, 0.22).astype(np.float32)


def water(d, seed):
    r = np.random.default_rng(seed)
    n = bp(r.standard_normal(int(d * SR)).astype(np.float32), 180, 1400)
    t = np.arange(len(n)) / SR
    n *= 0.55 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t + seed))
    return norm(n, 0.2).astype(np.float32)


def clapper():
    d = 0.09
    t = np.arange(int(d * SR)) / SR
    y = np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.01)
    y += hp(rng.standard_normal(len(t)).astype(np.float32), 1800) * np.exp(-t / 0.008)
    hit = norm(y, 0.7)
    gap = int(0.028 * SR)
    out = np.zeros(len(hit) + gap, np.float32)
    out[: len(hit)] += hit
    out[gap:gap + len(hit)] += hit * 0.85
    return out


def tap():
    d = 0.05
    t = np.arange(int(d * SR)) / SR
    y = np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.008)
    y += hp(rng.standard_normal(len(t)).astype(np.float32), 2500) * np.exp(-t / 0.006) * 0.5
    return norm(y, 0.35).astype(np.float32)


def flap():
    d = 0.16
    t = np.arange(int(d * SR)) / SR
    y = lp(rng.standard_normal(len(t)).astype(np.float32), 700) * np.exp(-t / 0.035)
    y += np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.03) * 0.45
    return norm(y, 0.4).astype(np.float32)


def pole():
    d = 0.14
    t = np.arange(int(d * SR)) / SR
    f = 90 + 40 * t
    saw = 2 * ((t * f) % 1) - 1
    y = bp(saw.astype(np.float32), 300, 2400) * np.sin(np.pi * np.clip(t / d, 0, 1))
    y += lp(rng.standard_normal(len(t)).astype(np.float32), 500) * np.exp(-t / 0.02) * 0.3
    return norm(y, 0.32).astype(np.float32)


def step():
    d = 0.09
    t = np.arange(int(d * SR)) / SR
    y = lp(rng.standard_normal(len(t)).astype(np.float32), 450) * np.exp(-t / 0.02)
    y += np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.018) * 0.5
    return norm(y, 0.34).astype(np.float32)


def sizzle(d=0.85):
    n = int(d * SR)
    t = np.arange(n) / SR
    y = hp(rng.standard_normal(n).astype(np.float32), 5000)
    y *= (0.45 + 0.55 * np.sin(2 * np.pi * 28 * t) ** 2) * np.exp(-t / (d * 0.55))
    return norm(y, 0.28).astype(np.float32)


def fwoomp():
    d = 0.32
    t = np.arange(int(d * SR)) / SR
    f = 220 * np.exp(-t * 6) + 70
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07)
    y += lp(rng.standard_normal(len(t)).astype(np.float32), 500) * np.exp(-t / 0.04) * 0.45
    return norm(y, 0.55).astype(np.float32)


def one(kind):
    if kind == 'clapper':
        return clapper()
    if kind == 'tap':
        return tap()
    if kind == 'flap':
        return flap()
    if kind == 'pole':
        return pole()
    if kind == 'step':
        return step()
    if kind == 'sizzle':
        return sizzle()
    if kind == 'fwoomp':
        return fwoomp()
    raise SystemExit(f'unknown foley {kind}')


def gate(buf, spans):
    fade = int(0.01 * SR)
    ramp = np.linspace(1, 0, fade, dtype=np.float32)
    for a, b in spans:
        ia = max(0, min(len(buf), int(round(a * SR))))
        ib = max(0, min(len(buf), int(round(b * SR))))
        if ia >= fade:
            buf[ia - fade:ia] *= ramp[:, None]
        buf[ia:ib] = 0


bed = np.zeros((N, 2), np.float32)
fx = np.zeros((N, 2), np.float32)

for a, b in ((0.0, T['silence'][0][0]), (T['catch'], T['silence'][1][0]), (T['gongEnd'], DUR)):
    add(bed, room(max(0.2, b - a + 0.05), 3 + int(a)), a, 0.55, 0.0)
water_in = T['push'][0] - 0.75
add(bed, water(T['silence'][0][0] - water_in, 8), water_in, 0.7, 0.05)
add(bed, water(T['waterLift'][0] - T['catch'], 9), T['catch'], 0.62, -0.05)
gate(bed, T['silence'])

events = [
    (0.06, 'clapper'),
    (CUE['title']['in'], 'tap'),
    (CUE['title']['in'] + 0.08, 'flap'),
    (T['silence'][0][0] + 0.05, 'sizzle'),
    (T['catch'], 'fwoomp'),
    (T['lamp2'] - 0.2, 'sizzle'),
    (T['lamp2'], 'fwoomp'),
    (T['waterLift'][0] - 0.12, 'flap'),
    (36.9, 'flap'),
]
events += [(t, 'pole') for t in CUE['poles']]
events += [(t, 'step') for t in CUE['steps']]
for t, kind in events:
    add(fx, one(kind), t, 0.9, 0.0)

music, msr = sf.read(os.path.join(HERE, 'music', 'music.wav'), dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
music = music[:N]

voice = np.zeros((N, 2), np.float32)
vbox = np.zeros(N, np.float32)


def small_room(x):
    y = np.array(x, dtype=np.float32)
    for dt, g in ((0.031, 0.22), (0.053, 0.12), (0.079, 0.06)):
        s = int(dt * SR)
        if s < len(y):
            y[s:] += lp(x, 4500)[: len(y) - s] * g
    return y


for line in CUE['voices']:
    path = os.path.join(HERE, 'tts', 'voices', f"{line['id']}.wav")
    if not os.path.isfile(path):
        raise SystemExit(f'missing voice {path}')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    x = compress(x, thr=0.2, ratio=3.0, att=0.004, rel=0.08)
    x = small_room(x)
    rms = float(np.sqrt(np.mean(x ** 2)) + 1e-9)
    x = x * (0.12 / rms)
    add(voice, x, line['t'], 1.0, 0.0)
    s = int(line['t'] * SR)
    e = min(N, s + len(x))
    if s < N:
        vbox[s:e] += np.abs(x[: e - s])

mrms = float(np.sqrt(np.mean(music ** 2)) + 1e-9)
music *= 0.028 / mrms
brms = float(np.sqrt(np.mean(bed ** 2)) + 1e-9)
bed *= 0.012 / max(brms, 1e-9)

k = max(1, int(0.08 * SR))
csum = np.cumsum(np.concatenate([[0], vbox]))
env_v = (csum[k:] - csum[:-k]) / k
env_v = np.pad(env_v, (0, N - len(env_v)))
env_v = np.clip(env_v / (np.max(env_v) + 1e-9), 0, 1)
music *= (1 - 0.75 * env_v)[:, None]
bed *= (1 - 0.37 * env_v)[:, None]
fx *= (1 - 0.37 * env_v)[:, None]

mix = music + bed + fx + voice
for ch in range(2):
    mix[:, ch] = limit(mix[:, ch], 0.9, 0.006)

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = os.path.join(HERE, 'out', 'mix.wav')
sf.write(out, mix, SR)
print('wrote', out, f'{mix.shape[0] / SR:.2f}s', 'peak', round(float(np.abs(mix).max()), 3))
