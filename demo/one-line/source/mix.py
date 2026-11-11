"""The Mend — pen, blot, rub, voice, solo violin. −14 LUFS is applied at mux."""
import json
import os
import sys

LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
import soxr
from core.audio.sfx import SR, add, limit, compress, bp, hp

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 40.0
N = int(DUR * SR)
rng = np.random.default_rng(19)


def env_mul(x, a, b, fade):
    n = len(x)
    if n == 0:
        return x
    fade_n = max(1, int(fade * SR))
    g = np.ones(n, np.float32)
    g[:fade_n] = np.linspace(0, 1, fade_n)
    g[-fade_n:] = np.linspace(1, 0, fade_n)
    return x * g


def room_bed(dur, seed):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    w = np.cumsum(r.standard_normal(n).astype(np.float32))
    w -= np.linspace(w[0], w[-1], n)
    x = hp(w, 30)
    x = bp(x, 70, 700)
    t = np.arange(n) / SR
    x *= (0.65 + 0.35 * np.sin(2 * np.pi * 0.07 * t)).astype(np.float32)
    m = np.max(np.abs(x)) or 1
    return (x / m * 0.22).astype(np.float32)


def wet_blot():
    d = 0.42
    n = int(d * SR)
    tt = np.arange(n) / SR
    x = bp(rng.standard_normal(n).astype(np.float32), 280, 1800)
    x *= np.exp(-tt / 0.11).astype(np.float32)
    x += (np.sin(2 * np.pi * 160 * tt) * np.exp(-tt / 0.07) * 0.35).astype(np.float32)
    m = np.max(np.abs(x)) or 1
    return (x / m * 0.55).astype(np.float32)


def rub():
    d = 0.07
    n = int(d * SR)
    tt = np.arange(n) / SR
    x = hp(rng.standard_normal(n).astype(np.float32), 700)
    x *= np.sin(np.pi * tt / d).astype(np.float32)
    m = np.max(np.abs(x)) or 1
    return (x / m * 0.35).astype(np.float32)


def pen_from(samples):
    out = np.zeros((N, 2), np.float32)
    if len(samples) < 2:
        return out
    for i, s in enumerate(samples):
        v = float(s['v'])
        if v < 12:
            continue
        t0 = float(s['t'])
        t1 = float(samples[i + 1]['t']) if i + 1 < len(samples) else t0 + 0.02
        if t0 >= DUR:
            break
        step = max(0.005, min(0.05, t1 - t0))
        n = max(8, int(step * SR))
        u = float(np.clip(v / 520.0, 0, 1))
        lo = 700 + 1500 * u
        hi = min(14000, 2400 + 5100 * u)
        if hi <= lo + 200:
            hi = lo + 400
        noise = rng.standard_normal(n).astype(np.float32)
        band = bp(noise, lo, hi)
        amp = np.sqrt(v / 520.0) * (0.62 if s.get('young') else 0.9)
        if s.get('dry'):
            if rng.random() < 0.72:
                continue
            amp *= 0.35
        if s.get('young'):
            amp *= 0.72 + 0.28 * rng.random()
        band = env_mul(band, 0, step, 0.004) * amp
        add(out, band, t0, 0.2, float(s.get('pan') or 0))
        ticks = (v / 70.0) * step
        made = 0
        while made < ticks and made < 4:
            if rng.random() > min(1, ticks - made):
                break
            tn = int(0.006 * SR)
            tick = bp(rng.standard_normal(tn).astype(np.float32), 2800, 9000)
            tick *= np.linspace(1, 0, tn).astype(np.float32)
            tick *= np.sqrt(v / 520.0) * (1.15 if s.get('young') else 0.8)
            add(out, tick, t0 + rng.random() * step, 0.16, float(s.get('pan') or 0))
            made += 1
    return out


def load_voice(vid):
    path = os.path.join(HERE, 'tts', 'voices', f'{vid}.wav')
    if not os.path.isfile(path):
        raise SystemExit(f'mix.py: missing voice {path}. Run tts first.')
    x, sr = sf.read(path, dtype='float32')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR).astype(np.float32)
    x = compress(x, thr=0.22, ratio=3.2, att=0.004, rel=0.09)
    x = limit(x, 0.85, 0.005)
    rms = float(np.sqrt(np.mean(x ** 2)))
    return x * (0.12 / max(rms, 1e-9))


def main():
    ev_path = os.path.join(HERE, 'events.json')
    if not os.path.isfile(ev_path):
        raise SystemExit('mix.py: events.json missing. Run events.mjs first.')
    ev = json.load(open(ev_path, encoding='utf-8'))
    pen_ev = next((e for e in ev['ev'] if e.get('type') == 'pen'), None)
    if not pen_ev:
        raise SystemExit('mix.py: pen track missing from events.json')
    subs = [e for e in ev['ev'] if e.get('type') == 'sub']

    room = np.zeros((N, 2), np.float32)
    add(room, room_bed(11.5, 3), 0.0, 0.55, 0.0)
    add(room, room_bed(14.0, 4), 16.0, 0.4, 0.0)
    room[int(11.2 * SR):int(14.0 * SR)] *= np.linspace(1, 0, int(2.8 * SR))[:, None]
    room[int(14.0 * SR):int(16.0 * SR)] = 0
    fade_n = int(1.6 * SR)
    start = int(36.6 * SR)
    if start + fade_n < N:
        room[start:start + fade_n] *= np.linspace(1, 0, fade_n)[:, None]
        room[start + fade_n:] = 0

    pen = pen_from(pen_ev['samples'])
    pen[int(14.0 * SR):int(16.0 * SR)] = 0
    add(pen, wet_blot(), 14.0, 0.85, 0.05)
    add(pen, rub(), 16.0, 0.9, 0.15)

    voice = np.zeros((N, 2), np.float32)
    vbox = np.zeros(N, np.float32)
    for cue in subs:
        x = load_voice(cue['id'])
        # Speech starts just after the write-on, matching LINES.t in scene.js.
        at = float(cue['t0']) + 0.22
        add(voice, x, at, 1.0, 0.0)
        add_env = np.zeros(N, np.float32)
        s = int(at * SR)
        e = min(N, s + len(x))
        if e > s:
            add_env[s:e] = np.abs(x[:e - s])
        vbox += add_env

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
    music *= 0.04 / max(mrms, 1e-9)
    music[int(14.0 * SR):int(16.0 * SR)] = 0

    k = max(1, int(0.28 * SR))
    csum = np.cumsum(np.concatenate([np.zeros(1, np.float32), vbox]))
    env = (csum[k:] - csum[:-k]) / k
    if len(env) < N:
        env = np.pad(env, (0, N - len(env)))
    env = env[:N]
    peak = float(env.max()) or 1
    env = np.clip(env / peak, 0, 1)
    music *= (1.0 - 0.44 * env)[:, None]
    pen *= (1.0 - 0.37 * env)[:, None]

    mix = music + pen + room * 0.35 + voice
    for ch in range(2):
        mix[:, ch] = limit(mix[:, ch], 0.92, 0.008)
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    out = os.path.join(HERE, 'out', 'mix.wav')
    sf.write(out, mix.astype(np.float32), SR)
    cues = [{'t0': s['t0'], 't1': s['t1'], 'text': s['text']} for s in subs]
    json.dump(cues, open(os.path.join(HERE, 'cues.json'), 'w', encoding='utf-8'), indent=1)
    print('wrote', out, 'cues', len(cues))


if __name__ == '__main__':
    main()
