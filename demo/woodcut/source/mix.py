"""One Ember — knife, ember, tam-tam bed, peel. Loudness is finished in mux.sh.

Voice and silence windows come from timeline.json. Music ducks under voice and
under the feed strike. Foley ducks under voice.
"""
import json
import os
import sys

import numpy as np
import soundfile as sf
import soxr

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)

from core.audio.sfx import SR, add, bp, hp, lp, brown, norm, thump, compress, limit

HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, 'timeline.json'), encoding='utf-8') as f:
    TL = json.load(f)

DUR = float(TL['dur'])
N = int(round(DUR * SR))
foley = np.zeros((N, 2), np.float32)


def knife(d, seed):
    rng = np.random.default_rng(seed)
    n = int(d * SR)
    t = np.arange(n) / SR
    tear = bp(rng.standard_normal(n), 350, 3400)
    tick = np.sin(2 * np.pi * 160 * t) * np.exp(-t / 0.012)
    e = np.clip(t / 0.006, 0, 1) * np.exp(-t / (d * 0.5))
    return norm(tear * e + tick * 0.45, 0.55)


def crackle(d, seed, rate=14):
    rng = np.random.default_rng(seed)
    n = int(d * SR)
    y = np.zeros(n, np.float32)
    t = 0.05
    k = 0
    while t < d - 0.02:
        start = int(t * SR)
        pop_n = int(0.025 * SR)
        tt = np.arange(pop_n) / SR
        pop = hp(rng.standard_normal(pop_n), 1800) * np.exp(-tt / 0.006)
        end = min(n, start + pop_n)
        y[start:end] += pop[:end - start] * np.float32(0.4 + 0.6 * rng.random())
        t += (0.4 + rng.random()) / rate
        k += 1
        if k > 400:
            break
    return norm(y, 0.35) if np.abs(y).max() > 0 else y


def room(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(brown(d), 80, 700)
    t = np.arange(len(n)) / SR
    gust = 0.8 + 0.2 * np.sin(2 * np.pi * 0.05 * t)
    return norm(n * gust + rng.standard_normal(len(n)) * 0.01, 0.18)


def paper_air(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(rng.standard_normal(int(d * SR)), 400, 5000)
    t = np.arange(len(n)) / SR
    sweep = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.4
    return norm(n * sweep, 0.4)


def brayer(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(rng.standard_normal(int(d * SR)), 200, 2200)
    t = np.arange(len(n)) / SR
    tack = np.exp(-t / 0.03)
    roll = 0.45 + 0.55 * np.sin(2 * np.pi * 7 * t) ** 2
    return norm(n * (tack * 0.8 + roll) * np.sin(np.pi * t / d), 0.48)


def baren(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(rng.standard_normal(int(d * SR)), 180, 2400)
    t = np.arange(len(n)) / SR
    circ = 0.3 + 0.7 * (0.5 + 0.5 * np.sin(2 * np.pi * 8 * t))
    return norm(n * circ * np.sin(np.pi * np.clip(t / d, 0, 1)), 0.42)


def peel_wet(d, seed):
    rng = np.random.default_rng(seed)
    n = lp(rng.standard_normal(int(d * SR)), 1600)
    t = np.arange(len(n)) / SR
    e = np.clip(t / 0.05, 0, 1) * np.exp(-((t - d * 0.35) ** 2) / (d * d * 0.08))
    return norm(n * e, 0.4)


def strike():
    body = thump(0.85, 58)
    d = 0.5
    rng = np.random.default_rng(21)
    n = bp(rng.standard_normal(int(d * SR)), 500, 4000)
    t = np.arange(len(n)) / SR
    n = n * np.exp(-t / 0.08)
    out = body.copy()
    m = min(len(out), len(n))
    out[:m] += n[:m] * 0.35
    return norm(out, 0.75)


def chip(seed):
    return knife(0.06, seed)


def mute(buf, a, b, digital=True):
    i0 = int(a * SR)
    i1 = min(len(buf), int(b * SR))
    fade = int(0.03 * SR)
    if i0 - fade > 0:
        buf[i0 - fade:i0] *= np.linspace(1, 0, fade, dtype=np.float32)[:, None]
    if digital:
        buf[i0:i1] = 0
    else:
        buf[i0:i1] *= np.float32(0.04)
    if i1 + fade < len(buf):
        buf[i1:i1 + fade] *= np.linspace(0, 1, fade, dtype=np.float32)[:, None]


add(foley, room(DUR, 1), 0.0, 0.55, 0.0)

for hit in TL['hits']:
    tt = float(hit['t'])
    kind = hit['type']
    pan = float(hit.get('pan', 0))
    if kind == 'knife':
        add(foley, knife(0.18, int(tt * 10) + 3), tt, 0.8, pan)
        add(foley, chip(int(tt * 20)), tt + 0.04, 0.35, -pan)
    elif kind == 'strike':
        add(foley, strike(), tt, 0.95, pan)
        add(foley, knife(0.22, 44), tt, 0.55, -0.2)
    elif kind == 'paper':
        add(foley, paper_air(1.5, 5), tt, 0.7, pan)
    elif kind == 'brayer':
        add(foley, brayer(0.7, 6), tt, 0.75, pan)
    elif kind == 'baren':
        add(foley, baren(0.55, 7), tt, 0.65, pan)
    elif kind == 'peel':
        add(foley, peel_wet(0.95, 8), tt, 0.7, pan)

# Ember withheld until it is cut, then an L-cut across the plate change at 18.15.
add(foley, crackle(2.6, 30, 9), 8.35, 0.35, 0.1)
add(foley, crackle(5.0, 31, 11), 13.5, 0.4, -0.05)
add(foley, crackle(5.4, 32, 16), 19.7, 0.55, 0.12)
add(foley, crackle(0.4, 33, 6), 34.1, 0.22, 0.05)

# Breath: music and most foley fall, room remains.
foley[int(11.20 * SR):int(12.50 * SR)] *= np.float32(0.28)

for sil in TL['silences']:
    mute(foley, sil['t0'], sil['t1'], digital=bool(sil['digital']))

voice = np.zeros((N, 2), np.float32)
vbox = np.zeros((N, 2), np.float32)
for cue in TL['cues']:
    if not cue.get('voice'):
        continue
    path = os.path.join(HERE, 'tts', 'voices', f"{cue['id']}.wav")
    if not os.path.isfile(path):
        sys.exit(f'mix.py: missing {path}')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    x = compress(x, thr=0.22, ratio=3.2, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    rms = float(np.sqrt((x ** 2).mean()))
    x = x * (0.13 / max(rms, 1e-9))
    add(voice, x, float(cue['t0']), 1.0, 0.0)
    add(vbox, np.abs(x), float(cue['t0']), 1.0, 0.0)

music, msr = sf.read(os.path.join(HERE, 'music', 'music.wav'), dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
else:
    music = music[:N]

mute(music, TL['breath']['t0'], TL['breath']['t1'], digital=True)
for sil in TL['silences']:
    mute(music, sil['t0'], sil['t1'], digital=True)

# A little under the feed strike (key foley).
i0, i1 = int(13.35 * SR), int(14.15 * SR)
music[i0:i1] *= np.float32(0.63)

mrms = float(np.sqrt((music ** 2).mean()))
music *= np.float32(0.045 / max(mrms, 1e-9))

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
foley *= (1.0 - 0.45 * voice_env)[:, None]

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
print('mix', out, f'peak {peak:.3f}')
