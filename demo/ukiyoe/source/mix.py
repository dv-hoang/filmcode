"""One Rectangle — wind, rake, tide, baren, voice, score. Loudness is finished in mux.sh."""
import os
import sys

import numpy as np
import soundfile as sf
import soxr

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)

from core.audio.sfx import SR, add, bp, hp, lp, brown, norm, thump, compress, limit

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 40.0
N = int(DUR * SR)
foley = np.zeros((N, 2), np.float32)


def env_span(x, a, b, fade=0.04):
    t = np.arange(len(x)) / SR
    e = np.clip((t - a) / max(1e-6, fade), 0, 1) * np.clip((b - t) / max(1e-6, fade), 0, 1)
    return x * e


def wind(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(brown(d), 140, 1400)
    t = np.arange(len(n)) / SR
    gust = 0.65 + 0.35 * np.sin(2 * np.pi * 0.07 * t + seed)
    n = n * gust + rng.standard_normal(len(n)) * 0.02
    return norm(env_span(n, 0.3, d - 0.4, 0.5), 0.22)


def rake(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(rng.standard_normal(int(d * SR)), 700, 4200)
    t = np.arange(len(n)) / SR
    grit = (0.45 + 0.55 * np.abs(np.sin(2 * np.pi * 18 * t)))
    e = np.clip(t / 0.02, 0, 1) * np.exp(-t / (d * 0.55))
    return norm(n * grit * e, 0.5)


def baren(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(rng.standard_normal(int(d * SR)), 180, 2200)
    t = np.arange(len(n)) / SR
    circ = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t))
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2
    return norm(n * circ * e, 0.4)


def tide(d, seed):
    rng = np.random.default_rng(seed)
    n = lp(rng.standard_normal(int(d * SR)), 900)
    t = np.arange(len(n)) / SR
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * 0.22 * t)
    return norm(n * swell * np.sin(np.pi * t / d), 0.35)


def gull(seed):
    d = 0.42
    t = np.arange(int(d * SR)) / SR
    f = np.linspace(1800, 1100, len(t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / 0.16)
    y += np.sin(ph * 2.01) * np.exp(-t / 0.1) * 0.25
    return norm(y, 0.3)


def seal_tack():
    body = thump(0.9, 62)
    d = 0.08
    t = np.arange(int(d * SR)) / SR
    rng = np.random.default_rng(8)
    tick = hp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.012)
    tick = norm(tick, 0.8)
    out = body.copy()
    out[:len(tick)] += tick * 0.45
    return norm(out, 0.7)


def hyoshigi():
    d = 0.12
    t = np.arange(int(d * SR)) / SR
    a = np.sin(2 * np.pi * 980 * t) * np.exp(-t / 0.018)
    b = np.sin(2 * np.pi * 740 * (t - 0.045).clip(0)) * np.exp(-(t - 0.045).clip(0) / 0.02)
    n = hp(np.random.default_rng(12).standard_normal(len(t)), 1500) * np.exp(-t / 0.01)
    return norm(a + b * 0.8 + n * 0.25, 0.65)


def insects(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(rng.standard_normal(int(d * SR)), 3000, 7000)
    t = np.arange(len(n)) / SR
    pulse = 0.4 + 0.6 * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t))
    return norm(n * pulse * 0.15, 0.08)


add(foley, wind(14, 1), 0.0, 0.55, 0.0)
add(foley, wind(10, 2), 14.0, 0.28, 0.05)
add(foley, wind(12, 3), 24.2, 0.36, -0.04)
add(foley, wind(8, 4), 34.0, 0.4, 0.0)

for i, tt in enumerate((8.25, 9.125, 10.0)):
    add(foley, rake(0.42, 20 + i), tt, 0.85, -0.05 + i * 0.05)
add(foley, gull(1), 9.6, 0.45, 0.35)

add(foley, tide(7.2, 5), 13.4, 0.95, 0.0)
add(foley, thump(0.55, 48), 16.0, 0.55, 0.1)

add(foley, baren(0.55, 6), 24.0, 0.8, -0.1)
add(foley, baren(0.5, 7), 26.4, 0.7, 0.12)
add(foley, insects(9.0, 9), 24.3, 0.55, 0.2)

for i, tt in enumerate((27.2, 27.82, 28.32, 28.72, 29.08, 29.52, 30.10)):
    add(foley, rake(0.28 + (i % 3) * 0.04, 40 + i), tt, 0.7, -0.2 + (i % 5) * 0.08)
add(foley, thump(0.4, 70), 32.2, 0.45, 0.0)
add(foley, gull(2), 34.6, 0.4, -0.25)
add(foley, hyoshigi(), 36.0, 0.9, 0.0)
add(foley, seal_tack(), 36.02, 0.85, 0.05)

# Ma: wind only, then almost no wind on the blank sheet. Cut tails.
foley[int(12.0 * SR):int(13.4 * SR)] *= np.float32(0.35)
foley[int(20.0 * SR):int(22.35 * SR)] *= np.float32(0.12)

voice = np.zeros((N, 2), np.float32)
vbox = np.zeros((N, 2), np.float32)
voice_at = [('v01', 1.55), ('v02', 20.8), ('v03', 27.0), ('v04', 36.2)]
for vid, t0 in voice_at:
    path = os.path.join(HERE, 'tts', 'voices', f'{vid}.wav')
    if not os.path.isfile(path):
        sys.exit(f'mix.py: missing {path}')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    x = compress(x, thr=0.22, ratio=3.2, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    rms = np.sqrt((x ** 2).mean())
    x = x * (0.14 / max(float(rms), 1e-9))
    add(voice, x, t0, 1.0, 0.0)
    add(vbox, np.abs(x), t0, 1.0, 0.0)

music, msr = sf.read(os.path.join(HERE, 'music', 'music.wav'), dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
else:
    music = music[:N]

def mute(buf, a, b):
    i0 = int(a * SR)
    i1 = int(b * SR)
    fade = int(0.04 * SR)
    if fade > 0 and i0 - fade > 0:
        buf[i0 - fade:i0] *= np.linspace(1, 0, fade)[:, None]
    buf[i0:i1] = 0
    if i1 + fade < len(buf):
        buf[i1:i1 + fade] *= np.linspace(0, 1, fade)[:, None]


mute(music, 12.0, 13.4)
mute(music, 20.0, 22.35)

mrms = float(np.sqrt((music ** 2).mean()))
music *= np.float32(0.042 / max(mrms, 1e-9))

voice_env = vbox.mean(axis=1)
k = max(1, int(0.28 * SR))
csum = np.cumsum(np.concatenate([np.zeros(1, np.float32), voice_env]))
voice_env = (csum[k:] - csum[:-k]) / k
if len(voice_env) < N:
    voice_env = np.pad(voice_env, (0, N - len(voice_env)))
voice_env = voice_env[:N]
peak_v = float(voice_env.max())
voice_env = np.clip(voice_env / (peak_v + 1e-9), 0, 1)
music *= (1.0 - 0.60 * voice_env)[:, None]
foley *= (1.0 - 0.37 * voice_env)[:, None]

mix = music + foley + voice
for ch in range(2):
    mix[:, ch] = limit(mix[:, ch], 0.92, 0.008)
peak = float(np.abs(mix).max())
if peak > 0:
    mix *= np.float32(0.9 / peak)

out_dir = os.path.join(HERE, 'out')
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, 'mix.wav')
sf.write(out, mix, SR)
print('mix', out)
