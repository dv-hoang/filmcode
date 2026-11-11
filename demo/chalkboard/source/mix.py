"""Heat Leaves — room, chalk, wipe, voice, score → out/mix.wav at 48 kHz."""
import json, os, sys
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
import soxr
from core.audio.sfx import SR, add, limit, compress, bp, lp, hp, brown, norm, thump, click

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 39.0
N = int(DUR * SR)
ev = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8'))
events = ev['ev'] if isinstance(ev, dict) else ev


def env(x, a, b, fade=0.05):
    t = np.arange(len(x)) / SR
    e = np.clip((t - a) / max(1e-6, fade), 0, 1) * np.clip((b - t) / max(1e-6, fade), 0, 1)
    return x * e


def room(d, seed):
    rng = np.random.default_rng(seed)
    n = bp(brown(d) * 2.2, 70, 700)
    t = np.arange(len(n)) / SR
    n *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t + seed)
    air = lp(rng.standard_normal(len(n)).astype(np.float32), 400) * 0.15
    return norm(env(n + air, 0.4, d - 0.5, 0.8), 0.22)


def chalk(d, hand, big, seed):
    rng = np.random.default_rng(seed)
    n = max(16, int(round(d * SR)))
    x = rng.standard_normal(n).astype(np.float32)
    bursts = max(4, int(d * 42))
    am = np.zeros(n, np.float32)
    for i in range(bursts):
        c = int(rng.integers(0, n))
        w = int(rng.integers(40, 160))
        sl = min(w, n - c)
        am[c:c + sl] += np.hanning(sl).astype(np.float32)
    x *= am
    t = np.arange(n) / SR
    x *= np.minimum(1.0, t / 0.01)
    if hand == 'accent':
        x = lp(x, 1900)
    elif hand == 'pupil':
        x = lp(x, 2600)
    else:
        x = bp(x, 650, 6200)
    if big:
        x = lp(x, 4000)
    peak = 0.62 if big else 0.42
    if hand == 'accent':
        peak *= 0.72
    return norm(x, peak)


def felt(d, seed=4):
    rng = np.random.default_rng(seed)
    n = int(round(d * SR))
    x = lp(rng.standard_normal(n).astype(np.float32), 800)
    t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / max(d, 1e-3), 0, 1)) ** 0.7
    return norm(x * e, 0.5)


def bell(d=1.8, seed=2):
    t = np.arange(int(d * SR)) / SR
    y = (np.sin(2 * np.pi * 740 * t) * np.exp(-t / 0.5)
         + 0.35 * np.sin(2 * np.pi * 1110 * t) * np.exp(-t / 0.32)
         + 0.22 * np.sin(2 * np.pi * 494 * t) * np.exp(-t / 0.7))
    return norm(lp(y.astype(np.float32), 2400), 0.4)


def whoosh(d=0.42, seed=6):
    rng = np.random.default_rng(seed)
    n = int(d * SR)
    x = hp(rng.standard_normal(n).astype(np.float32), 500)
    t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2
    return norm(x * e, 0.35)


foley = np.zeros((N, 2), np.float32)
add(foley, room(DUR, 1), 0.0, 0.55, 0.0)

for i, e in enumerate(events):
    kind = e.get('type')
    if kind == 'chalk':
        x = chalk(float(e['d']), e.get('hand', 'teacher'), bool(e.get('big')), 100 + i)
        gain = 0.18 + min(0.12, float(e.get('len', 20)) / 140)
        if e.get('hand') == 'accent':
            gain *= 0.75
        add(foley, x, float(e['t']), gain, float(e.get('pan', 0)))
    elif kind == 'wipe':
        add(foley, felt(float(e['d'])), float(e['t']), 0.7, 0.05)
    elif kind == 'bell':
        add(foley, bell(), float(e['t']), 0.28, -0.35)
    elif kind == 'whip':
        add(foley, whoosh(float(e.get('d', 0.45))), float(e['t']), 0.45, 0.2)
    elif kind == 'knock':
        add(foley, thump(0.6, 90), float(e['t']), 0.35, 0.1)
    elif kind == 'tick':
        add(foley, click(1.4, 0.4), float(e['t']), 0.18, 0.4)

# Near-silences: the wipe's felt stays, the room thins, music is handled below.
foley[int(11.4 * SR):int(13.4 * SR)] *= 0.55

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
    rms = np.sqrt((x ** 2).mean())
    x = x * (0.22 / max(float(rms), 1e-9))
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
music *= (0.028 / max(mrms, 1e-9))

voice_env = vbox.mean(axis=1)
k = max(1, int(0.25 * SR))
c = np.cumsum(np.concatenate([np.zeros(1, np.float32), voice_env]))
voice_env = (c[k:] - c[:-k]) / k
voice_env = np.pad(voice_env, (0, len(c) - 1 - len(voice_env)))
voice_env = np.clip(voice_env / (float(voice_env.max()) + 1e-9) * 3.0, 0, 1)
music *= (1.0 - 0.78 * voice_env)[:, None]

# Score stays out while the mistake is wiped and the verdict is said, and before the last line.
music[int(7.75 * SR):int(13.55 * SR)] *= 0.0
music[int(30.15 * SR):int(31.25 * SR)] *= 0.0

mix = music + foley + voice
for ch in range(2):
    mix[:, ch] = compress(mix[:, ch], thr=0.22, ratio=1.6, att=0.005, rel=0.12)
    mix[:, ch] = limit(mix[:, ch], 0.7, 0.004)
peak = float(np.abs(mix).max())
mix *= 0.55 / max(peak, 1e-9)

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = os.path.join(HERE, 'out', 'mix.wav')
sf.write(out, mix, SR)
print(out)
