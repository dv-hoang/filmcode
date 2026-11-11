"""Alborada — foley, voice and score into one mix at 48 kHz stereo.

Everything is synthesised from the scene's own matter: paper, brush, pencil,
cherries, water, stone, wood, kettle. Voice is compressed and limited before it
is matched to the music.
"""
import sys, os, json
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
import soxr
from core.audio.sfx import SR, add, limit, compress, bp, hp, lp, noise, brown, thump, click, clack, ding, whoosh, norm

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 45.0
N = int(DUR * SR)
mix = np.zeros((N, 2), np.float32)
rng = np.random.default_rng(5)


def smooth(x, a, b, fade=0.05):
    """fade in/out envelope over [a,b] seconds"""
    t = np.arange(len(x)) / SR
    e = np.clip((t - a) / max(1e-6, fade), 0, 1) * np.clip((b - t) / max(1e-6, fade), 0, 1)
    return x * e


# ---------------- foley generators ----------------
def brush_rustle(d=0.5, bright=1.0, seed=0):
    r = np.random.default_rng(seed)
    n = bp(r.standard_normal(int(d * SR)), 900 * bright, 5200 * bright)
    t = np.arange(len(n)) / SR
    trem = 0.65 + 0.35 * np.sin(2 * np.pi * (7 + 3 * r.random()) * t)
    n *= trem
    e = np.minimum(1, t / 0.06) * np.exp(-t / (d * 0.45))
    return norm(n * e, 0.5)


def pencil(d=0.9, seed=1):
    r = np.random.default_rng(seed)
    n = hp(r.standard_normal(int(d * SR)), 2600)
    t = np.arange(len(n)) / SR
    strokes = np.zeros_like(n)
    for _ in range(int(d * 11)):
        a = r.uniform(0, d * 0.9), r.uniform(0.04, 0.14)
        seg = (t >= a[0]) & (t < a[0] + a[1])
        strokes[seg] += np.hanning(seg.sum())
    e = np.minimum(1, t / 0.02) * np.exp(-t / (d * 2.2))
    return norm(n * strokes * e, 0.32)


def bird(f0=2400, f1=3100, d=0.16, seed=0):
    r = np.random.default_rng(seed)
    t = np.arange(int(d * SR)) / SR
    f = np.linspace(f0, f1, len(t)) * (1 + 0.02 * np.sin(2 * np.pi * 40 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / (d * 0.5)) * np.minimum(1, t / 0.01)
    x += 0.3 * np.sin(2 * ph) * np.exp(-t / (d * 0.35))
    return norm(x * 0.5, 0.25)


def breeze(d=3.0, seed=2):
    r = np.random.default_rng(seed)
    n = bp(brown(d) * 3, 120, 1400)
    t = np.arange(len(n)) / SR
    n *= 0.55 + 0.45 * np.sin(2 * np.pi * 0.21 * t + 1.2)
    return norm(smooth(n, 0.55, d - 0.6, 0.7), 0.42)


def insects(d=4.0, seed=3):
    r = np.random.default_rng(seed)
    n = bp(r.standard_normal(int(d * SR)), 3800, 7200)
    t = np.arange(len(n)) / SR
    am = (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t)) ** 3
    return norm(smooth(n * am, 0.7, d - 0.6, 0.8), 0.16)


def water(d=2.0, seed=4, low=600, high=4200):
    r = np.random.default_rng(seed)
    n = bp(r.standard_normal(int(d * SR)), low, high)
    t = np.arange(len(n)) / SR
    n *= 0.7 + 0.3 * np.sin(2 * np.pi * 1.7 * t)
    return norm(smooth(n, 0.25, d - 0.25, 0.2), 0.4)


def bubbles(d=1.5, seed=5, n=14):
    r = np.random.default_rng(seed)
    out = np.zeros(int(d * SR))
    for _ in range(n):
        at = r.uniform(0, d - 0.1)
        f = r.uniform(320, 900)
        ln = int(0.05 * SR)
        t = np.arange(ln) / SR
        b = np.sin(2 * np.pi * (f * (1 + 3 * t / 0.05)) * t) * np.exp(-t / 0.012)
        i = int(at * SR)
        out[i:i + ln] += b[:max(0, min(ln, len(out) - i))]
    return norm(out, 0.3)


def mechanism(d=6.0, seed=6):
    r = np.random.default_rng(seed)
    n = bp(r.standard_normal(int(d * SR)), 180, 900)
    t = np.arange(len(n)) / SR
    pulse = (0.55 + 0.45 * np.sin(2 * np.pi * 3.2 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))
    return norm(smooth(n * pulse, 0.2, d - 0.4, 0.2), 0.3)


def rake(d=1.1, seed=7):
    r = np.random.default_rng(seed)
    n = bp(r.standard_normal(int(d * SR)), 1400, 6000)
    t = np.arange(len(n)) / SR
    grains = (r.random(len(n)) > 0.985).astype(float)
    grains = np.convolve(grains, np.hanning(30), 'same')
    e = np.minimum(1, t / 0.12) * np.exp(-t / (d * 0.8))
    return norm(n * (0.5 + grains) * e, 0.34)


def bees(d=5.0, seed=8):
    r = np.random.default_rng(seed)
    n = bp(r.standard_normal(int(d * SR)), 170, 420)
    t = np.arange(len(n)) / SR
    am = 0.35 + 0.65 * np.abs(np.sin(2 * np.pi * 7.5 * t + 0.5 * np.sin(2 * np.pi * 0.9 * t)))
    return norm(smooth(n * am, 0.7, d - 0.7, 0.8), 0.18)


def cup_set(seed=9):
    r = np.random.default_rng(seed)
    d = 0.45
    t = np.arange(int(d * SR)) / SR
    x = np.zeros(len(t))
    for f, a, tau in [(1250, .5, .05), (1870, .35, .04), (2900, .2, .02), (420, .3, .09)]:
        x += a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
    x[:200] += r.standard_normal(200) * 0.2
    return norm(x, 0.4)


def pour(d=1.3, seed=10):
    r = np.random.default_rng(seed)
    n = bp(r.standard_normal(int(d * SR)), 700, 5200)
    t = np.arange(len(n)) / SR
    e = np.minimum(1, t / 0.15) * np.clip((d - t) / 0.35, 0, 1)
    return norm(n * e, 0.36)


def kettle(seed=11):
    r = np.random.default_rng(seed)
    d = 1.6
    t = np.arange(int(d * SR)) / SR
    f = 900 + 260 * np.clip(t / 1.2, 0, 1)
    wh = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.18
    n = bp(r.standard_normal(len(t)), 900, 4000) * 0.4
    e = np.minimum(1, t / 0.3) * np.clip((d - t) / 0.5, 0, 1)
    return norm((wh + n) * e, 0.3)


def page(seed=12):
    r = np.random.default_rng(seed)
    d = 0.5
    t = np.arange(int(d * SR)) / SR
    n = bp(r.standard_normal(len(t)), 700, 5200)
    return norm(n * np.minimum(1, t / 0.03) * np.exp(-t / 0.16), 0.35)


# ---------------- the sound design table ----------------
def f(x, at, lvl_db, pan=0.0):
    """place a foley sound at a target RMS (dBFS)"""
    r = np.sqrt((x ** 2).mean())
    add(mix, x, at, (10 ** (lvl_db / 20)) / max(r, 1e-9), pan)


f(bp(brown(DUR) * 2.2, 60, 700) * np.linspace(0.6, 1.0, N) * 0.0 + bp(brown(DUR) * 2.2, 60, 700), 0.0, -46)  # room tone
f(brush_rustle(0.6, 1.0, 21), 0.55, -30, -0.2)
f(brush_rustle(0.9, 0.9, 22), 1.35, -29, 0.1)
f(brush_rustle(0.7, 1.1, 23), 2.35, -31, -0.35)
f(pencil(1.1, 24), 1.35, -33, 0.25)
# the world arrives
f(brush_rustle(1.1, 0.8, 25), 3.0, -31, 0.3)
f(brush_rustle(0.9, 0.85, 26), 4.1, -31, -0.3)
f(breeze(4.5, 27), 4.2, -39)
for i, t in enumerate([4.6, 6.2, 8.4, 10.1, 12.6, 14.2, 16.8, 18.4]):
    f(bird(2100 + 260 * (i % 4), 2900 + 300 * (i % 3), 0.14, 30 + i), t, -40, -0.5 + 0.12 * i)
for i, t in enumerate([9.2, 11.4, 13.0, 15.2, 17.4]):
    f(brush_rustle(0.5, 0.8, 40 + i), t, -33, 0.5)
f(insects(8.0, 50), 12.5, -42, 0.35)
f(breeze(7.0, 51), 10.0, -41)
f(thump(1.0, 90), 12.05, -30, -0.15)
f(bubbles(1.0, 52, 8), 12.3, -36, -0.1)
f(thump(0.9, 100), 16.0, -31, 0.1)
f(bubbles(1.2, 53, 10), 16.2, -36, 0.15)
f(click(1.2, 0.7), 15.6, -36, 0.2)
# the mill: water arrives just before the cut (J-cut)
f(water(3.0, 60), 21.0, -33, -0.1)
f(mechanism(6.5, 61), 21.8, -33, 0.15)
f(water(4.0, 62, 500, 3600), 22.2, -30, -0.25)
f(bubbles(2.0, 63, 22), 22.4, -35, 0.1)
f(thump(0.8, 80), 24.2, -32, 0.05)
f(bubbles(1.6, 64, 12), 26.0, -37, -0.2)
for i, t in enumerate([26.6, 27.4, 28.1, 28.7]):
    f(ding(0.5), t, -38, 0.3)
# near-silence 29.6–30.8: nothing is added here
# the patio
f(rake(1.2, 70), 30.95, -31, -0.2)
f(rake(1.0, 71), 32.2, -34, 0.2)
f(bees(6.0, 72), 31.0, -40, 0.25)
f(insects(6.0, 73), 33.5, -42, -0.3)
f(breeze(5.0, 74), 35.0, -42)
f(rake(0.9, 75), 36.6, -36, 0.1)
# the cup
f(kettle(80), 39.15, -34, 0.25)
f(cup_set(81), 40.45, -31, -0.1)
f(pour(1.4, 82), 41.15, -29, -0.05)
f(cup_set(83), 42.35, -33, -0.05)
f(pencil(0.9, 84), 43.05, -35, 0.2)
f(page(85), 44.4, -34, 0.1)

foley = mix.copy()

# ---------------- voice ----------------
lines = [('v01', 0.90), ('v02', 5.20), ('v03', 9.80), ('v04', 15.60), ('v05', 21.20),
         ('v06', 25.50), ('v07', 31.20), ('v08', 35.00), ('v09', 39.80)]
voice = np.zeros((N, 2), np.float32)
vbox = np.zeros((N, 2), np.float32)
for vid, t0 in lines:
    path = os.path.join(HERE, 'tts', 'voices', vid + '.wav')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    x = compress(x, thr=0.22, ratio=3.2, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    r = np.sqrt((x ** 2).mean())
    x = x * (0.135 / max(r, 1e-9))          # one level for the whole narration
    add(voice, x, t0, 1.0, 0.0)
    add(vbox, np.abs(x), t0, 1.0, 0.0)

# voice level: RMS of its active part


# ---------------- music ----------------
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
music *= (0.040 / max(mrms, 1e-9))

# duck the music under the voice with a smoothed envelope
voice_env = vbox.mean(axis=1)
k = max(1, int(0.30 * SR))
c = np.cumsum(np.concatenate([np.zeros(1), voice_env]))
voice_env = (c[k:] - c[:-k]) / k
voice_env = np.pad(voice_env, (0, len(c) - 1 - len(voice_env)))
voice_env = np.clip(voice_env / (voice_env.max() + 1e-9) * 3.0, 0, 1)
music *= (1.0 - 0.38 * voice_env)[:, None]

foley = foley * 1.0
mix = music + foley + voice
for ch in range(2):
    mix[:, ch] = limit(mix[:, ch], 0.94, 0.008)
peak = np.abs(mix).max()
mix = mix * (0.89 / peak)
# true-ish silence at the mill: enforce the gap
a, b = int(29.55 * SR), int(30.75 * SR)
ramp = np.ones(N, np.float32)
ramp[a:b] = np.linspace(1, 0.06, b - a)
ramp[b:b + int(0.15 * SR)] = 0.06
mix *= ramp[:, None]

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR)
print('mix.wav', mix.shape, f'{mix.shape[0]/SR:.2f}s', 'peak', round(float(np.abs(mix).max()), 3))
