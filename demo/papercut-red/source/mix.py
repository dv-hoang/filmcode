"""Eighth Fold — foley, voice, score. Voice ~10 dB over music. −14 LUFS is the mux."""
import json
import os
import sys

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
import soxr
from core.audio.sfx import SR, add, bp, brown, click, compress, hp, limit, norm, pop, thump, whoosh

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 40.0
N = int(DUR * SR)


def env_of(x, a, b, fade=0.02):
    t = np.arange(len(x)) / SR
    e = np.clip((t - a) / max(1e-6, fade), 0, 1) * np.clip((b - t) / max(1e-6, fade), 0, 1)
    return x * e


def scissors(seed):
    rng = np.random.default_rng(seed)
    d = 0.16
    n = int(d * SR)
    noise = rng.standard_normal(n)
    shear = bp(noise.astype(np.float32), 2500, 9000)
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.006) * np.exp(-t / 0.045)
    crack_n = int(0.03 * SR)
    crack = hp(rng.standard_normal(crack_n).astype(np.float32), 3200)
    crack *= np.exp(-np.arange(crack_n) / (0.007 * SR))
    ring_n = int(0.42 * SR)
    rt = np.arange(ring_n) / SR
    ring = np.sin(2 * np.pi * 2460 * rt) * np.exp(-rt / 0.085) * 0.35
    y = np.zeros(ring_n, np.float32)
    y[:n] += shear * e
    y[:crack_n] += crack * 0.55
    y += ring.astype(np.float32)
    return norm(y, 0.72)


def crease():
    tap = click(2.4, 0.9)
    body = thump(0.55, 160)
    n = max(len(tap), len(body))
    y = np.zeros(n, np.float32)
    y[:len(body)] += body * 0.8
    y[:len(tap)] += tap
    return norm(y, 0.6)


def snap():
    a = pop(0.9)
    b = click(3.2, 0.7)
    n = max(len(a), len(b))
    y = np.zeros(n, np.float32)
    y[:len(a)] += a
    y[:len(b)] += b * 0.6
    return norm(y, 0.66)


def palm():
    body = thump(0.7, 110)
    tick = click(1.2, 0.3)
    n = max(len(body), len(tick))
    y = np.zeros(n, np.float32)
    y[:len(body)] += body
    y[:len(tick)] += tick * 0.35
    return norm(y, 0.5)


def scrap_drop():
    y = thump(0.45, 180)
    return norm(y, 0.4)


def slide(d=0.55, seed=3):
    rng = np.random.default_rng(seed)
    n = int(d * SR)
    x = bp(rng.standard_normal(n).astype(np.float32), 400, 2800)
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.03) * np.exp(-t / (d * 0.7))
    return norm(x * e, 0.28)


def peel():
    w = whoosh(0.55, 0.8)
    rng = np.random.default_rng(9)
    n = len(w)
    crack = hp(rng.standard_normal(n).astype(np.float32), 1800) * np.exp(-np.arange(n) / (0.12 * SR))
    return norm(w * 0.7 + crack * 0.25, 0.45)


def lamp():
    n = int(0.7 * SR)
    x = bp(brown(0.7) * 2.0, 180, 1600)
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.08) * np.exp(-t / 0.45)
    return norm(env_of(x * e, 0, 0.7, 0.02), 0.22)


def hush(d, seed):
    rng = np.random.default_rng(seed)
    x = bp(brown(d) * 2.2, 90, 700)
    t = np.arange(len(x)) / SR
    x = x * (0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t))
    # A little paper air, not a tone.
    x += rng.standard_normal(len(x)).astype(np.float32) * 0.02
    return norm(x, 0.18)


events = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8'))
if abs(events['dur'] - DUR) > 0.01:
    sys.exit(f"events dur {events['dur']} != {DUR}")

foley = np.zeros((N, 2), np.float32)
add(foley, hush(DUR, 1), 0.0, 0.55, 0.0)

# Near-silences: keep a little air, drop the bed.
for a, b in ((8.65, 9.98), (26.55, 28.45)):
    foley[int(a * SR):int(b * SR)] *= 0.22

for e in events['ev']:
    kind = e['type']
    tt = float(e['t'])
    if kind == 'fold':
        add(foley, whoosh(0.34, 0.7), tt - 0.28, 0.7, -0.1)
    elif kind == 'crease':
        add(foley, crease(), tt, 0.85, 0.0)
    elif kind == 'snip':
        add(foley, scissors(int(tt * 10)), tt, 0.8, 0.12)
    elif kind == 'drop':
        add(foley, scrap_drop(), tt, 0.7, 0.2)
    elif kind == 'pat':
        add(foley, palm(), tt, 0.65, -0.05)
    elif kind == 'snap':
        add(foley, snap(), tt, 0.55 if tt > 10.2 else 0.35, 0.0)
    elif kind == 'lift':
        add(foley, whoosh(0.28, 0.45), tt, 0.4, 0.15)
    elif kind == 'slide':
        add(foley, slide(0.7, 4), tt, 0.55, 0.1)
        add(foley, slide(0.4, 5), tt + 2.2, 0.28, -0.1)
    elif kind == 'peel':
        add(foley, peel(), tt, 0.85, 0.0)
    elif kind == 'step':
        add(foley, norm(thump(0.85, 78), 0.7), tt, 0.6, -0.15)
    elif kind == 'lamp':
        add(foley, lamp(), tt, 0.8, 0.05)
    else:
        sys.exit(f'unknown event {kind}')

# First gong snap is in the score; keep the paper snap, but the big gong
# owns that instant, so the paper hit on the downbeat stays small (above).

voice = np.zeros((N, 2), np.float32)
vbox = np.zeros((N, 2), np.float32)
cues = json.load(open(os.path.join(HERE, 'cues.json'), encoding='utf-8'))
for cue in cues:
    path = os.path.join(HERE, 'tts', 'voices', f"{cue['id']}.wav")
    if not os.path.isfile(path):
        sys.exit(f'missing voice {path}')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    x = compress(x, thr=0.22, ratio=3.2, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    rms = float(np.sqrt(np.mean(x ** 2)))
    x = x * (0.12 / max(rms, 1e-9))
    add(voice, x, cue['t0'], 1.0, 0.0)
    add(vbox, np.abs(x), cue['t0'], 1.0, 0.0)

music, msr = sf.read(os.path.join(HERE, 'music', 'music.wav'), dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
music = music[:N]
mrms = float(np.sqrt(np.mean(music ** 2)))
music = music * (0.038 / max(mrms, 1e-9))

voice_env = vbox.mean(axis=1)
k = max(1, int(0.20 * SR))
csum = np.cumsum(np.concatenate([np.zeros(1), voice_env]))
voice_env = (csum[k:] - csum[:-k]) / k
voice_env = np.pad(voice_env, (0, len(csum) - 1 - len(voice_env)))
voice_env = np.clip(voice_env / (voice_env.max() + 1e-9) * 3.0, 0, 1)
# 9 dB under the voice → about 0.645 down. Foley 3 dB → about 0.29 down.
music *= (1.0 - 0.645 * voice_env)[:, None]
foley *= (1.0 - 0.29 * voice_env)[:, None]

mix = (music + foley + voice).astype(np.float32)
# Gentle bus compression so the two silences don't leave the integrated
# level too low for the −14 LUFS mux, while the peaks stay under the limiter.
mix = np.stack([
    compress(mix[:, 0], thr=0.12, ratio=2.4, att=0.005, rel=0.12),
    compress(mix[:, 1], thr=0.12, ratio=2.4, att=0.005, rel=0.12),
], 1)
mix = np.stack([limit(mix[:, 0], 0.8), limit(mix[:, 1], 0.8)], 1).astype(np.float32)
rms = float(np.sqrt(np.mean(mix ** 2)))
mix *= min(1.8, 0.22 / max(rms, 1e-9))
peak = float(np.abs(mix).max())
if peak > 0.9:
    mix *= 0.9 / peak
out = os.path.join(HERE, 'out', 'mix.wav')
os.makedirs(os.path.dirname(out), exist_ok=True)
sf.write(out, mix, SR)
print('mix', out, 'peak', round(float(np.abs(mix).max()), 3))
