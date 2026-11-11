"""First Orange — foley + voice + score → out/mix.wav @ 48 kHz stereo."""
import sys, os
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
import soxr
from core.audio.sfx import SR, add, limit, compress, bp, hp, brown, norm

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 42.0
N = int(DUR * SR)
foley = np.zeros((N, 2), np.float32)


def env(x, a, b, fade=0.05):
    t = np.arange(len(x)) / SR
    e = np.clip((t - a) / max(1e-6, fade), 0, 1) * np.clip((b - t) / max(1e-6, fade), 0, 1)
    return x * e


def room_hush(d=4.0, seed=1):
    r = np.random.default_rng(seed)
    n = bp(brown(d) * 2.5, 80, 900)
    t = np.arange(len(n)) / SR
    n *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t)
    return norm(env(n, 0.4, d - 0.4, 0.6), 0.28)


def birds_soft(d=0.2, seed=2):
    t = np.arange(int(d * SR)) / SR
    f = np.linspace(2100, 2800, len(t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / (d * 0.45))
    return norm(x * 0.35, 0.18)


def knife_scrape(d=0.35, seed=3):
    r = np.random.default_rng(seed)
    n = hp(r.standard_normal(int(d * SR)), 1800)
    t = np.arange(len(n)) / SR
    e = np.minimum(1, t / 0.02) * np.exp(-t / (d * 0.35))
    return norm(n * e, 0.55)


def wet_peel(d=0.45, seed=4):
    r = np.random.default_rng(seed)
    n = bp(r.standard_normal(int(d * SR)), 400, 3500)
    t = np.arange(len(n)) / SR
    e = np.minimum(1, t / 0.03) * np.exp(-t / (d * 0.4))
    click = np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.02) * 0.4
    return norm(n * e + click, 0.4)


def juice_drip(d=0.12, seed=5):
    t = np.arange(int(d * SR)) / SR
    x = np.sin(2 * np.pi * (600 + 400 * t) * t) * np.exp(-t / 0.03)
    return norm(x, 0.25)


add(foley, room_hush(10, 1), 0.0, 0.7, 0.0)
add(foley, room_hush(12, 2), 16.0, 0.55, 0.0)
for i, tt in enumerate([3.2, 6.1, 8.4, 22.0, 26.5, 34.0]):
    add(foley, birds_soft(0.18, 10 + i), tt, 0.35, -0.2 + (i % 3) * 0.15)

foley[int(9.0 * SR):int(11.0 * SR)] *= 0.12
add(foley, knife_scrape(0.4, 20), 11.0, 0.9, 0.1)
for i, tt in enumerate([13.5, 14.7, 15.9]):
    add(foley, wet_peel(0.5, 30 + i), tt, 0.85, -0.1 + i * 0.1)
    add(foley, juice_drip(0.12, 40 + i), tt + 0.15, 0.6, 0.2)
for i in range(8):
    add(foley, knife_scrape(0.28, 50 + i), 17.5 + i * 0.55, 0.55, -0.3 + i * 0.08)
foley[int(27.0 * SR):int(28.0 * SR)] *= 0.08
add(foley, knife_scrape(0.35, 90), 32.0, 0.7, 0.0)

# voice
voice = np.zeros((N, 2), np.float32)
vbox = np.zeros((N, 2), np.float32)
for vid, t0 in [('v01', 2.0), ('v02', 11.0), ('v03', 15.0), ('v04', 17.5), ('v05', 28.0)]:
    path = os.path.join(HERE, 'tts', 'voices', f'{vid}.wav')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    x = compress(x, thr=0.22, ratio=3.2, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    r = np.sqrt((x ** 2).mean())
    x = x * (0.135 / max(r, 1e-9))
    add(voice, x, t0, 1.0, 0.0)
    add(vbox, np.abs(x), t0, 1.0, 0.0)

# music
music, msr = sf.read(os.path.join(HERE, 'music', 'music.wav'), dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
else:
    music = music[:N]
mrms = np.sqrt((music ** 2).mean())
music *= (0.045 / max(mrms, 1e-9))

voice_env = vbox.mean(axis=1)
k = max(1, int(0.30 * SR))
c = np.cumsum(np.concatenate([np.zeros(1), voice_env]))
voice_env = (c[k:] - c[:-k]) / k
voice_env = np.pad(voice_env, (0, len(c) - 1 - len(voice_env)))
voice_env = np.clip(voice_env / (voice_env.max() + 1e-9) * 3.0, 0, 1)
music *= (1.0 - 0.45 * voice_env)[:, None]

mix = music + foley + voice
for ch in range(2):
    mix[:, ch] = limit(mix[:, ch], 0.94, 0.008)
peak = np.abs(mix).max()
mix = mix * (0.89 / peak)

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = os.path.join(HERE, 'out', 'mix.wav')
sf.write(out, mix, SR)
print('wrote', out, mix.shape, f'{mix.shape[0]/SR:.2f}s', 'peak', round(float(np.abs(mix).max()), 3))
