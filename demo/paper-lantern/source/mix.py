"""First Bloom — beds, paper foley, voice, score → out/mix.wav at 48 kHz."""
import sys, os, json
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
import soxr
from core.audio.sfx import SR, add, limit, compress, bp, hp, brown, norm, click, ding, whoosh

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json'), encoding='utf-8'))
DUR = float(TL['dur'])
N = int(DUR * SR)
HIT = TL['hit']

dur_path = os.path.join(HERE, 'tts', 'voices', 'dur.json')
measured = json.load(open(dur_path, encoding='utf-8')) if os.path.exists(dur_path) else {}


def hold(v):
    d = float(measured.get(v['id'], v['dur']))
    return max(1.8, d + 0.6)


def pocket(x, a, b, gain, fade=0.08):
    i0 = int(a * SR)
    i1 = int(b * SR)
    f = int(fade * SR)
    if i1 <= i0:
        return x
    env = np.ones(i1 - i0, np.float32)
    if f > 0:
        r = np.linspace(1, gain, f, dtype=np.float32)
        env[:f] = r
        env[f:-f] = gain
        env[-f:] = np.linspace(gain, 1, f, dtype=np.float32)
    else:
        env[:] = gain
    x[i0:i1] *= env[:, None]
    return x


def air(d, seed, bright=900):
    rng = np.random.default_rng(seed)
    n = bp(brown(d) * 2.2, 70, bright)
    t = np.arange(len(n)) / SR
    n *= 0.65 + 0.35 * np.sin(2 * np.pi * 0.11 * t + seed)
    chirp = np.zeros_like(n)
    for k in range(int(d / 1.7)):
        at = int((0.4 + k * 1.7 + rng.random() * 0.4) * SR)
        L = int(0.09 * SR)
        if at + L >= len(n):
            break
        tt = np.arange(L) / SR
        f = 3200 + rng.random() * 800
        chirp[at:at + L] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.04) * 0.15
    return norm(n * 0.8 + chirp, 0.3)


def shimmer(d=0.7):
    t = np.arange(int(d * SR)) / SR
    f = np.linspace(400, 1800, len(t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / 0.35)
    x += hp(np.random.default_rng(3).standard_normal(len(t)), 1200) * np.exp(-t / 0.2) * 0.25
    return norm(x, 0.45)


def rustle(d=0.45, seed=4):
    rng = np.random.default_rng(seed)
    n = hp(rng.standard_normal(int(d * SR)), 700)
    t = np.arange(len(n)) / SR
    e = np.minimum(1, t / 0.03) * np.exp(-t / (d * 0.45))
    return norm(n * e, 0.4)


foley = np.zeros((N, 2), np.float32)
add(foley, air(DUR, 1, 800), 0.0, 0.55, 0.0)
add(foley, air(10, 2, 1400), HIT['pull'] - 1.4, 0.7, 0.05)

foley = pocket(foley, 3.7, HIT['strike'], 0.12)
foley = pocket(foley, 16.05, HIT['flower'] - 0.7, 0.18)

add(foley, click(1.4, 0.9), HIT['strike'], 0.7, 0.05)
add(foley, shimmer(0.85), HIT['strike'], 0.55, 0.1)
for i, dt in enumerate((0.4, 0.8, 1.2, 1.6)):
    add(foley, rustle(0.28, 10 + i), HIT['strike'] + dt, 0.35, -0.2 + i * 0.12)
add(foley, ding(0.45), HIT['glass'], 0.4, 0.15)
add(foley, rustle(0.9, 30), HIT['flower'] - 0.7, 0.5, 0.05)
add(foley, whoosh(0.55, 0.5), HIT['pull'], 0.45, 0.0)
add(foley, rustle(0.4, 40), HIT['title'], 0.4, -0.05)

voice = np.zeros((N, 2), np.float32)
vbox = np.zeros(N, np.float32)
cues = []
for v in TL['voice']:
    path = os.path.join(HERE, 'tts', 'voices', f"{v['id']}.wav")
    if not os.path.exists(path):
        sys.exit(f'mix.py: missing {path}')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    x = compress(x, thr=0.22, ratio=3.4, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    rms = float(np.sqrt(np.mean(x ** 2)))
    x = x * (0.126 / max(rms, 1e-9))
    add(voice, x, v['t0'], 1.0, 0.0)
    i0 = int(v['t0'] * SR)
    i1 = min(N, i0 + len(x))
    vbox[i0:i1] += np.abs(x[:i1 - i0])
    d = float(measured.get(v['id'], v['dur']))
    cues.append({'t0': v['t0'], 't1': v['t0'] + hold(v), 'text': v['text'], 'dur': d})

music_path = os.path.join(HERE, 'music', 'music.wav')
music, msr = sf.read(music_path, dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
else:
    music = music[:N]
mrms = float(np.sqrt(np.mean(music ** 2)))
music *= (0.052 / max(mrms, 1e-9))
music = pocket(music, 3.7, HIT['strike'], 0.05)
music = pocket(music, 16.05, HIT['flower'] - 0.15, 0.08)

k = max(1, int(0.08 * SR))
c = np.cumsum(np.concatenate([np.zeros(1, np.float32), vbox]))
env = (c[k:] - c[:-k]) / k
env = np.pad(env, (0, N - len(env)))
env = np.clip(env / (np.max(env) + 1e-9), 0, 1)
music *= (1.0 - 0.5 * env)[:, None]

mix = music + foley + voice
for ch in range(2):
    mix[:, ch] = limit(mix[:, ch], 0.95, 0.008)

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = os.path.join(HERE, 'out', 'mix.wav')
sf.write(out, mix, SR)
json.dump(cues, open(os.path.join(HERE, 'cues.json'), 'w', encoding='utf-8'), indent=1)
print('wrote', out, f'{mix.shape[0] / SR:.2f}s', 'peak', round(float(np.abs(mix).max()), 3))
