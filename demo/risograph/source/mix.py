"""The Crossing — water, motors, the duplicator, voice, score → out/mix.wav."""
import sys, os, json
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
import soxr
from core.audio.sfx import SR, add, limit, compress, bp, hp, lp, brown, norm, click, thump, clack

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json'), encoding='utf-8'))
DUR = float(TL['dur'])
N = int(DUR * SR)
HIT = TL['hit']
VOICE = TL['voice']

measured = {}
dur_path = os.path.join(HERE, 'tts', 'voices', 'dur.json')
if os.path.exists(dur_path):
    measured = json.load(open(dur_path, encoding='utf-8'))


def hold(v):
    d = float(measured.get(v['id'], 2.2))
    chars = sum(1 for ch in v['text'] if not ch.isspace())
    return max(1.8, d + 0.6, chars / 15 + 1.5) + 0.08


def pocket(x, a, b, gain, fade=0.04):
    i0 = max(0, int(a * SR))
    i1 = min(len(x), int(b * SR))
    if i1 <= i0:
        return x
    f = int(fade * SR)
    env = np.full(i1 - i0, gain, np.float32)
    ramp = min(f, (i1 - i0) // 2)
    if ramp > 0:
        env[:ramp] = np.linspace(1, gain, ramp, dtype=np.float32)
        env[-ramp:] = np.linspace(gain, 1, ramp, dtype=np.float32)
    x[i0:i1] *= env[:, None]
    return x


def water(d, seed, bright=900):
    rng = np.random.default_rng(seed)
    n = bp(brown(d) * 1.8, 180, bright)
    t = np.arange(len(n)) / SR
    n *= (0.72 + 0.28 * np.sin(2 * np.pi * 0.17 * t + seed)).astype(np.float32)
    lap = np.zeros_like(n)
    for k in range(int(d / 1.3)):
        at = int((0.2 + k * 1.3 + rng.random() * 0.25) * SR)
        L = int(0.35 * SR)
        if at + L >= len(n):
            break
        tt = np.arange(L) / SR
        lap[at:at + L] += np.sin(2 * np.pi * (180 + rng.random() * 40) * tt) * np.exp(-tt / 0.16) * 0.25
    return norm(n + lap, 0.32)


def motor(d, seed, rate=36):
    rng = np.random.default_rng(seed)
    n = lp(rng.standard_normal(int(d * SR)).astype(np.float32), 220)
    t = np.arange(len(n)) / SR
    n *= (0.65 + 0.35 * np.sin(2 * np.pi * rate * t)).astype(np.float32)
    return norm(n, 0.4)


def shhk(seed=1):
    d = 0.32
    rng = np.random.default_rng(seed)
    n = hp(rng.standard_normal(int(d * SR)).astype(np.float32), 1400)
    t = np.arange(len(n)) / SR
    f = np.linspace(3200, 900, len(n))
    sweep = np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32)
    e = np.minimum(1, t / 0.02) * np.exp(-t / 0.08)
    return norm(n * e * 0.7 + sweep * e * 0.3, 0.55)


def chunk():
    a = thump(1.0, 78)
    b = clack(0.85, 1.0)
    n = max(len(a), len(b) + int(0.045 * SR))
    y = np.zeros(n, np.float32)
    y[:len(a)] += a
    s = int(0.045 * SR)
    y[s:s + len(b)] += b * 0.8
    return norm(y, 0.7)


def buoy():
    t = np.arange(int(1.1 * SR)) / SR
    y = np.sin(2 * np.pi * 196 * t) * np.exp(-t / 0.45)
    y += np.sin(2 * np.pi * 392 * t) * np.exp(-t / 0.2) * 0.25
    return norm(y.astype(np.float32), 0.35)


foley = np.zeros((N, 2), np.float32)
add(foley, water(34.4, 2, 800), 0.0, 0.62, 0.0)
add(foley, motor(16.0, 4, 34), 0.15, 0.38, -0.25)
add(foley, motor(18.6, 5, 41), HIT['motorMail'], 0.42, 0.3)
add(foley, shhk(1), HIT['feed'], 0.7, 0.0)
add(foley, shhk(2), HIT['pink'], 0.55, 0.05)
add(foley, chunk(), HIT['pink'], 0.85, 0.0)
add(foley, buoy(), HIT['buoy'], 0.45, -0.4)
add(foley, chunk(), HIT['cross'], 0.8, 0.08)
add(foley, shhk(3), HIT['sheet'], 0.6, -0.05)
add(foley, thump(0.7, 60), HIT['land'], 0.55, 0.0)
add(foley, click(1.6, 0.9), HIT['pin'], 0.65, 0.15)
add(foley, chunk(), HIT['title'], 0.4, 0.0)

# Two near-silences: tails cut, a little water remains. Mail motor is allowed to J-cut into the first.
foley = pocket(foley, HIT['silence1'], HIT['silence1End'], 0.16, 0.03)
foley = pocket(foley, HIT['silence2'], HIT['silence2End'], 0.12, 0.025)

voice = np.zeros((N, 2), np.float32)
vbox = np.zeros(N, np.float32)
cues = []
for v in VOICE:
    path = os.path.join(HERE, 'tts', 'voices', f"{v['id']}.wav")
    if not os.path.exists(path):
        sys.exit(f'mix.py: missing {path}')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR).astype(np.float32)
    x = compress(x, thr=0.22, ratio=3.4, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    rms = float(np.sqrt(np.mean(x ** 2)))
    x = x * (0.12 / max(rms, 1e-9))
    add(voice, x, v['t0'], 1.0, 0.0)
    i0 = int(v['t0'] * SR)
    i1 = min(N, i0 + len(x))
    vbox[i0:i1] += np.abs(x[:i1 - i0])
    d = float(measured.get(v['id'], 2.2))
    cues.append({'t0': v['t0'], 't1': v['t0'] + hold(v), 'text': v['text'], 'dur': d})

music, msr = sf.read(os.path.join(HERE, 'music', 'music.wav'), dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR).astype(np.float32)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
else:
    music = music[:N]
mrms = float(np.sqrt(np.mean(music ** 2)))
music *= (0.038 / max(mrms, 1e-9))
music = pocket(music, HIT['silence1'], HIT['silence1End'], 0.0, 0.02)
music = pocket(music, HIT['silence2'], HIT['silence2End'], 0.0, 0.02)

k = max(1, int(0.06 * SR))
c = np.cumsum(np.concatenate([np.zeros(1, np.float32), vbox]))
env = (c[k:] - c[:-k]) / k
env = np.pad(env, (0, max(0, N - len(env))))[:N]
env = np.clip(env / (np.max(env) + 1e-9), 0, 1)
music *= (1.0 - 0.6 * env)[:, None]

mix = music + foley * 0.9 + voice
for ch in range(2):
    mix[:, ch] = limit(mix[:, ch], 0.92, 0.008)

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = os.path.join(HERE, 'out', 'mix.wav')
sf.write(out, mix, SR)
json.dump(cues, open(os.path.join(HERE, 'cues.json'), 'w', encoding='utf-8'), indent=1)
print('wrote', out, f'{mix.shape[0] / SR:.2f}s', 'peak', round(float(np.abs(mix).max()), 3))
