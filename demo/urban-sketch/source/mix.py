"""Still Lit — pen, street, voice, guitar → out/mix.wav at 48 kHz."""
import json, os, sys
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
import soxr
from core.audio.sfx import SR, add, limit, compress, bp, hp, brown, norm, step

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 40.0
N = int(DUR * SR)


def env(x, a, b, fade=0.05):
    t = np.arange(len(x)) / SR
    e = np.clip((t - a) / max(1e-6, fade), 0, 1) * np.clip((b - t) / max(1e-6, fade), 0, 1)
    return x * e


def pen_burst(d, seed, bright=1.0):
    r = np.random.default_rng(seed)
    n = int(d * SR)
    x = bp(r.standard_normal(n), 1600, 7500)
    t = np.arange(n) / SR
    fibre = 0.55 + 0.45 * np.sin(2 * np.pi * (38 + r.random() * 18) * t)
    clicks = (r.random(n) > 0.992).astype(np.float32) * r.random(n)
    e = np.minimum(1, t / 0.012) * np.exp(-t / max(0.04, d * 0.55))
    return norm((x * fibre * e + clicks * 0.35).astype(np.float32), 0.4 * bright)


def brush(d, seed):
    r = np.random.default_rng(seed)
    n = int(d * SR)
    x = bp(r.standard_normal(n), 280, 2200)
    t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.15
    return norm((x * e).astype(np.float32), 0.45)


def cup_tick(seed):
    r = np.random.default_rng(seed)
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    f = 1400 + r.random() * 500
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.018)
    noise = bp(r.standard_normal(n), 1800, 6000) * np.exp(-t / 0.012) * 0.3
    return norm((x + noise).astype(np.float32), 0.32)


def chair_scrape(seed):
    r = np.random.default_rng(seed)
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    x = bp(r.standard_normal(n), 220, 2400)
    f = np.linspace(520, 160, n)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    e = np.minimum(1, t / 0.015) * np.exp(-t / 0.18)
    return norm((x * e * 0.7 + tone * 0.45).astype(np.float32), 0.55)


def lamp_tick():
    t = np.arange(int(0.07 * SR)) / SR
    x = np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.012)
    return norm(x.astype(np.float32), 0.28)


def room(d, seed, lo, hi, level):
    r = np.random.default_rng(seed)
    n = bp(brown(d), lo, hi)
    t = np.arange(len(n)) / SR
    n = n * (0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t + seed))
    return norm(env(n, 0.4, d - 0.3, 0.5), level)


def duck(buf, t, dur, depth):
    i0 = max(0, int((t - 0.04) * SR))
    i1 = min(len(buf), int((t + dur) * SR))
    n = i1 - i0
    if n <= 8:
        return
    e = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))
    buf[i0:i1] *= (1 - depth * e)[:, None]


ev_path = os.path.join(HERE, 'events.json')
if not os.path.isfile(ev_path):
    sys.exit('mix: missing events.json — run events.mjs first')
ev = json.load(open(ev_path))['ev']

foley = np.zeros((N, 2), np.float32)
add(foley, room(DUR, 1, 80, 700, 0.22), 0.0, 0.85, 0.0)
add(foley, room(24.0, 2, 140, 900, 0.16), 9.05, 0.7, 0.05)
add(foley, room(10.0, 3, 400, 1800, 0.08), 25.8, 0.45, -0.1)

for e in ev:
    kind = e['type']
    if kind == 'pen':
        add(foley, pen_burst(float(e.get('dur', 0.3)), int(e.get('seed', 1))), e['t'], 0.42, e.get('pan', 0))
    elif kind == 'brush':
        add(foley, brush(float(e.get('dur', 0.5)), int(e.get('seed', 1))), e['t'], 0.7, e.get('pan', 0))
    elif kind == 'cup':
        add(foley, cup_tick(int(e.get('seed', 1))), e['t'], 0.55, e.get('pan', 0))
    elif kind == 'chair':
        add(foley, chair_scrape(int(e.get('seed', 1))), e['t'], 0.85, e.get('pan', 0))
    elif kind == 'step':
        add(foley, step(0.7), e['t'], 0.45, e.get('pan', 0))
    elif kind == 'tick':
        add(foley, lamp_tick(), e['t'], 0.6, e.get('pan', 0))
    elif kind in ('silence', 'voice', 'air'):
        pass
    else:
        sys.exit(f'mix: unknown event {kind}')

for ch in range(2):
    foley[:, ch] = hp(foley[:, ch], 90)

voice = np.zeros((N, 2), np.float32)
vbox = np.zeros((N, 2), np.float32)
for e in ev:
    if e['type'] != 'voice':
        continue
    path = os.path.join(HERE, 'tts', 'voices', f"{e['id']}.wav")
    if not os.path.isfile(path):
        sys.exit(f'mix: missing {path}')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    x = compress(x, thr=0.22, ratio=3.2, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    rms = float(np.sqrt((x ** 2).mean()))
    x = x * (0.13 / max(rms, 1e-9))
    add(voice, x, e['t'], 1.0, 0.0)
    add(vbox, np.abs(x), e['t'], 1.0, 0.0)

music_path = os.path.join(HERE, 'music', 'music.wav')
if not os.path.isfile(music_path):
    sys.exit(f'mix: missing {music_path}')
music, msr = sf.read(music_path, dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
else:
    music = music[:N]
mrms = float(np.sqrt((music ** 2).mean()))
music = music * (0.04 / max(mrms, 1e-9))

for e in ev:
    if e['type'] == 'silence':
        i0 = int(e['t'] * SR)
        i1 = int((e['t'] + e['dur']) * SR)
        foley[i0:i1] *= 0.04
        music[i0:i1] *= 0.0

for e in ev:
    if e['type'] in ('brush', 'chair', 'tick'):
        duck(music, e['t'], 0.45 if e['type'] != 'chair' else 0.55, 0.5)

voice_env = vbox.mean(axis=1)
k = max(1, int(0.28 * SR))
c = np.cumsum(np.concatenate([np.zeros(1), voice_env]))
voice_env = (c[k:] - c[:-k]) / k
voice_env = np.pad(voice_env, (0, len(c) - 1 - len(voice_env)))
voice_env = np.clip(voice_env / (voice_env.max() + 1e-9) * 3.0, 0, 1)
music *= (1.0 - 0.5 * voice_env)[:, None]

mix = music + foley + voice
for ch in range(2):
    mix[:, ch] = limit(mix[:, ch], 0.94, 0.008)
peak = float(np.abs(mix).max())
if peak <= 0:
    sys.exit('mix: silent mix')
mix = mix * (0.82 / peak)

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = os.path.join(HERE, 'out', 'mix.wav')
sf.write(out, mix, SR)
print('wrote', out, f'{mix.shape[0] / SR:.2f}s', 'peak', round(float(np.abs(mix).max()), 3))
