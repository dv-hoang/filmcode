"""The Dry Stair — room, mesh, surf, voice, score → out/mix.wav at 48 kHz."""
import json, os, sys
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
import soxr
from core.audio.sfx import SR, add, limit, compress, bp, lp, hp, brown, norm, thump, click, clack, creak

HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8'))
DUR = float(ev['dur'])
events = ev['ev']
N = int(DUR * SR)


def mesh_pull(d, speed, seed):
    rng = np.random.default_rng(seed)
    n = max(8, int(round(d * SR)))
    white = rng.standard_normal(n).astype(np.float32)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 255 * t).astype(np.float32)
    bright = 1400 + min(speed, 1.4) * 900
    x = bp(white * (0.75 + 0.25 * tone), 160, bright)
    env = np.minimum(1, t / 0.015) * np.minimum(1, (d - t) / 0.04)
    return norm(x * env.astype(np.float32), 0.42)


def squelch(seed):
    rng = np.random.default_rng(seed)
    n = int(0.085 * SR)
    x = lp(rng.standard_normal(n).astype(np.float32), 480)
    t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / 0.085, 0, 1)) ** 1.3
    return norm(x * env.astype(np.float32), 0.48)


def room(d, seed=1):
    rng = np.random.default_rng(seed)
    x = bp(brown(d), 70, 520)
    air = lp(rng.standard_normal(len(x)).astype(np.float32), 280) * 0.18
    return norm(x + air, 0.16)


def surf(d, seed=2):
    rng = np.random.default_rng(seed)
    n = int(round(d * SR))
    x = bp(rng.standard_normal(n).astype(np.float32), 200, 1200)
    t = np.arange(n) / SR
    swell = 0.62 + 0.38 * np.sin(2 * np.pi * 0.11 * t)
    fade = np.minimum(1, t / 1.15) * np.minimum(1, (d - t) / 2.4)
    return norm((x * swell * fade).astype(np.float32), 0.32)


def hiss(d, seed=6):
    rng = np.random.default_rng(seed)
    x = hp(rng.standard_normal(int(round(d * SR))).astype(np.float32), 2800)
    return norm(x, 0.05)


foley = np.zeros((N, 2), np.float32)

for i, e in enumerate(events):
    kind = e.get('type')
    t = float(e.get('t', 0))
    if kind == 'room':
        add(foley, room(float(e['d'])), t, 0.62, 0.0)
    elif kind == 'hiss':
        add(foley, hiss(float(e['d'])), t, 0.22, 0.05)
    elif kind == 'surf':
        add(foley, surf(float(e['d']), 8 + i), t, 0.2, 0.15)
    elif kind == 'pull':
        add(foley, mesh_pull(float(e['d']), float(e.get('speed', 0.6)), 30 + i), t, 0.34, float(e.get('pan', 0)))
    elif kind == 'squelch':
        add(foley, squelch(40 + int(e.get('seed', i))), t, 0.22, float(e.get('pan', 0)))
    elif kind == 'clack':
        add(foley, clack(1.1), t, 0.45, float(e.get('pan', 0)))
    elif kind == 'creak':
        add(foley, creak(0.7), t, 0.28, float(e.get('pan', 0)))
    elif kind == 'clamp':
        add(foley, thump(1.0, 95), t, 0.7, 0.0)
        add(foley, click(0.7, 0.8), t, 0.35, 0.1)
    elif kind == 'clip':
        add(foley, click(1.3, 0.55), t, 0.32, float(e.get('pan', 0)))
    elif kind == 'stamp':
        add(foley, click(1.8, 0.35), t, 0.2, float(e.get('pan', 0)))

voice = np.zeros((N, 2), np.float32)
vbox = np.zeros((N, 2), np.float32)
for e in events:
    if e.get('type') != 'vo':
        continue
    path = os.path.join(HERE, 'tts', 'voices', f"{e['id']}.wav")
    if not os.path.isfile(path):
        sys.exit(f'mix.py: missing voice {path}')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    x = compress(x, thr=0.22, ratio=3.0, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    rms = float(np.sqrt((x ** 2).mean()))
    x = x * (0.2 / max(rms, 1e-9))
    add(voice, x, float(e['t']), 1.0, 0.0)
    add(vbox, np.abs(x), float(e['t']), 1.0, 0.0)

music, msr = sf.read(os.path.join(HERE, 'music', 'music.wav'), dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
else:
    music = music[:N]
mrms = float(np.sqrt((music ** 2).mean()))
music *= (0.055 / max(mrms, 1e-9))

for e in events:
    if e.get('type') == 'silence':
        a = int(float(e['t']) * SR)
        b = int((float(e['t']) + float(e['d'])) * SR)
        music[a:b] *= 0

voice_env = vbox.mean(axis=1)
k = max(1, int(0.22 * SR))
c = np.cumsum(np.concatenate([np.zeros(1, np.float32), voice_env]))
voice_env = (c[k:] - c[:-k]) / k
voice_env = np.pad(voice_env, (0, len(c) - 1 - len(voice_env)))
voice_env = np.clip(voice_env / (float(voice_env.max()) + 1e-9) * 3.0, 0, 1)
music *= (1.0 - 0.62 * voice_env)[:, None]

mix = music + foley * 0.9 + voice
for ch in range(2):
    mix[:, ch] = compress(mix[:, ch], thr=0.28, ratio=1.5, att=0.006, rel=0.12)
    mix[:, ch] = limit(mix[:, ch], 0.72, 0.004)
peak = float(np.abs(mix).max())
mix *= 0.62 / max(peak, 1e-9)

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = os.path.join(HERE, 'out', 'mix.wav')
sf.write(out, mix, SR)
print(out)
