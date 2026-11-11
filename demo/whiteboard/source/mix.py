"""The Open Top — stroke foley, props, voice, score → out/mix.wav at 48 kHz."""
import json, os, sys
import numpy as np
import soundfile as sf
import soxr

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
from core.audio.sfx import SR, add, bp, hp, brown, norm, compress, limit, thump

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 40.0
N = int(DUR * SR)
foley = np.zeros((N, 2), np.float32)


def hand_env(n):
    u = np.linspace(0, 1, n)
    speed = 1 - 0.8 * np.cos(2 * np.pi * u)
    speed = np.clip(speed, 0.15, None)
    return (speed / speed.max()).astype(np.float32)


def marker(dur, seed, color, squeak):
    rng = np.random.default_rng(seed)
    n = max(8, int(dur * SR))
    white = rng.standard_normal(n).astype(np.float32)
    hiss = bp(white, 2200, 7500)
    body = bp(rng.standard_normal(n).astype(np.float32), 500, 1500) * 0.65
    if color == '#1f2a44':
        body *= 1.25
        hiss *= 0.75
    elif color == '#d97757':
        hiss *= 1.2
        body *= 0.7
    env = hand_env(n)
    tick_n = min(n, int(0.004 * SR))
    tick = np.zeros(n, np.float32)
    tick[:tick_n] = hp(rng.standard_normal(tick_n).astype(np.float32), 3000) * np.linspace(1, 0, tick_n)
    y = (hiss * 0.55 + body * 0.45) * env + tick * 0.8
    grains = rng.random(n) > 0.985
    y = y + grains.astype(np.float32) * rng.standard_normal(n).astype(np.float32) * 0.15 * env
    if squeak and dur > 0.18:
        tt = np.arange(n) / SR
        f = 1500 + (seed % 1100)
        vib = 1 + 0.04 * np.sin(2 * np.pi * (7 + seed % 6) * tt)
        sq = np.sin(2 * np.pi * f * np.cumsum(vib) / SR) * env * 0.22
        y = y + sq.astype(np.float32)
    fade = min(n, int(0.012 * SR))
    y[:fade] *= np.linspace(0, 1, fade)
    return norm(y, 0.55)


def eraser(dur, seed=3):
    rng = np.random.default_rng(seed)
    n = max(8, int(dur * SR))
    tt = np.arange(n) / SR
    rub = bp(rng.standard_normal(n).astype(np.float32), 250, 2600)
    zig = 0.65 + 0.35 * np.abs(np.sin(2 * np.pi * 3.2 * tt))
    y = rub * zig
    fade = min(n, int(0.03 * SR))
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    return norm(y, 0.5)


def squeak_only(dur=0.45, seed=9):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.2
    vib = 1 + 0.05 * np.sin(2 * np.pi * 9 * tt)
    y = np.sin(2 * np.pi * 2100 * np.cumsum(vib) / SR) * env
    return norm(y.astype(np.float32), 0.35)


def clock_tick():
    n = int(0.025 * SR)
    tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * 1900 * tt) * np.exp(-tt / 0.004)
    y = y + np.sin(2 * np.pi * 3200 * tt) * np.exp(-tt / 0.002) * 0.4
    return norm(y.astype(np.float32), 0.25)


def cap(kind):
    n = int(0.07 * SR)
    tt = np.arange(n) / SR
    f = 1400 if kind == 'on' else 1800
    y = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.012)
    y = y + hp(np.random.default_rng(2).standard_normal(n).astype(np.float32), 2000) * np.exp(-tt / 0.006) * 0.5
    return norm(y.astype(np.float32), 0.4)


def magnet_hit(kind):
    if kind == 'sink':
        return thump(0.7, 140) * 0.8
    modes = [830, 1370, 2210, 3120]
    n = int(0.18 * SR)
    tt = np.arange(n) / SR
    y = np.zeros(n, np.float32)
    for i, f in enumerate(modes):
        y += np.sin(2 * np.pi * f * tt) * np.exp(-tt / (0.05 - i * 0.008)) * (0.5 - i * 0.08)
    y += np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / 0.06) * 0.45
    return norm(y, 0.7)


def room(dur, seed):
    rng_n = brown(dur)
    bed = bp(rng_n, 70, 700)
    return norm(bed, 0.22)


events = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8'))['ev']
for i, ev in enumerate(events):
    kind = ev.get('type')
    if kind == 'stroke':
        y = marker(max(0.04, ev['dur']), 100 + i * 13, ev.get('color', '#1f2a44'), ev.get('squeak', 0))
        gain = 0.34 + min(0.16, ev['dur'] * 0.08)
        add(foley, y, ev['t'], gain, ev.get('pan', 0))
    elif kind == 'erase':
        add(foley, eraser(ev['dur']), ev['t'], 0.85, ev.get('pan', 0))
        add(foley, squeak_only(0.55, 9), ev['t'] + ev['dur'] * 0.42, 0.55, ev.get('pan', 0))
    elif kind == 'magnet':
        add(foley, magnet_hit(ev.get('kind', 'drop')), ev['t'], 0.9, ev.get('pan', 0))
    elif kind == 'cap':
        add(foley, cap(ev.get('kind', 'on')), ev['t'], 0.55, ev.get('pan', 0))

add(foley, room(DUR, 1), 0.0, 0.55, 0.0)
beat = 60 / 96
t = beat
while t < DUR:
    if not (15.0 <= t < 20.0):
        add(foley, clock_tick(), t, 0.22, -0.35)
    t += beat

# Near-silences: end of bar 7, and the beat before the eraser squeak.
foley[int(16.15 * SR):int(17.45 * SR)] *= 0.18
foley[int(17.45 * SR):int(17.7 * SR)] *= 0.35

voice = np.zeros((N, 2), np.float32)
vbox = np.zeros((N, 2), np.float32)
cues = json.load(open(os.path.join(HERE, 'cues.json'), encoding='utf-8'))
for cue in cues:
    path = os.path.join(HERE, 'tts', 'voices', f"{cue['id']}.wav")
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    x = compress(x, thr=0.2, ratio=3.0, att=0.004, rel=0.08)
    x = limit(x, 0.85, 0.005)
    rms = float(np.sqrt(np.mean(x ** 2)))
    x = x * (0.13 / max(rms, 1e-9))
    add(voice, x, cue['t0'], 1.0, 0.0)
    add(vbox, np.abs(x), cue['t0'], 1.0, 0.0)

music, msr = sf.read(os.path.join(HERE, 'music', 'music.wav'), dtype='float32')
if music.ndim == 1:
    music = np.stack([music, music], axis=1)
if msr != SR:
    music = soxr.resample(music, msr, SR)
if len(music) < N:
    music = np.pad(music, ((0, N - len(music)), (0, 0)))
else:
    music = music[:N]
# Hard silence where the treatment stops the score.
music[int(15.0 * SR):int(20.0 * SR)] = 0
mrms = float(np.sqrt(np.mean(music ** 2)))
music *= 0.04 / max(mrms, 1e-9)

voice_env = vbox.mean(axis=1)
k = max(1, int(0.28 * SR))
csum = np.cumsum(np.concatenate([np.zeros(1), voice_env]))
voice_env = (csum[k:] - csum[:-k]) / k
if len(voice_env) < N:
    voice_env = np.pad(voice_env, (0, N - len(voice_env)))
voice_env = voice_env[:N]
voice_env = np.clip(voice_env / (voice_env.max() + 1e-9) * 3.0, 0, 1)
music *= (1.0 - 0.62 * voice_env)[:, None]

# Foley sits under the voice. A light duck keeps the pen from fighting the line.
foley *= (1.0 - 0.25 * voice_env)[:, None]
mix = music + foley * 0.55 + voice
for ch in range(2):
    mix[:, ch] = limit(mix[:, ch], 0.92, 0.008)
peak = float(np.max(np.abs(mix)))
if peak > 0:
    mix *= 0.86 / peak

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = os.path.join(HERE, 'out', 'mix.wav')
sf.write(out, mix, SR)
print('wrote', out, f'{mix.shape[0] / SR:.2f}s', 'peak', round(float(np.max(np.abs(mix))), 3))
