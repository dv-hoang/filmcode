"""The Dry Stair — nylon guitar, pizzicato bass, brushes, harmonica. 96 BPM."""
import json, os, sys
LIB = os.environ.get('LIB') or os.path.expanduser('~/.filmcode/library')
sys.path.insert(0, LIB)
import numpy as np
import soundfile as sf
from core.audio import pluck as P
from core.audio.sfx import SR, add, limit, hp, norm

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ev = json.load(open(os.path.join(ROOT, 'events.json'), encoding='utf-8'))
events = ev['ev'] if isinstance(ev, dict) else ev
DUR = float(ev['dur']) if isinstance(ev, dict) else 40.0
buf = np.zeros((int(DUR * SR), 2), np.float32)


def brush(dur=0.11, seed=1):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = hp(rng.standard_normal(n).astype(np.float32), 700)
    env = np.sin(np.pi * np.arange(n) / max(n, 1)) ** 0.55
    return norm(x * env.astype(np.float32), 0.22)


def harmonica(hz, dur, vel):
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n, np.float32)
    for k, amp in ((1, 1.0), (2, 0.28), (3, 0.48), (4, 0.12), (5, 0.22)):
        y += np.float32(amp) * np.sin(2 * np.pi * hz * k * t + k * 0.4)
    trem = 0.84 + 0.16 * np.sin(2 * np.pi * 5.2 * t)
    env = (1 - np.exp(-t / 0.018)) * np.exp(-t / max(dur, 0.2))
    return norm((y * trem * env).astype(np.float32), 0.16 * vel)


for i, e in enumerate(events):
    if e.get('type') != 'note':
        continue
    kind = e.get('kind')
    t = float(e['t'])
    if kind == 'strum':
        pitches = e['pitches']
        for k, pitch in enumerate(pitches):
            x = P.pluck('nylon_guitar', pitch, float(e['dur']), vel=float(e['vel']) * 0.9)
            add(buf, x, t + k * 0.018, 0.9, float(e.get('pan', 0)))
    elif kind == 'pluck':
        x = P.pluck('nylon_guitar', e['pitch'], float(e['dur']), vel=float(e['vel']))
        add(buf, x, t, 0.85, float(e.get('pan', 0)))
    elif kind == 'bass':
        x = P.pluck('upright_bass_pizz', e['pitch'], float(e['dur']), vel=float(e['vel']))
        add(buf, x, t, 0.75, float(e.get('pan', 0)))
    elif kind == 'harm':
        x = harmonica(float(e['hz']), float(e['dur']), float(e['vel']))
        add(buf, x, t, 0.9, float(e.get('pan', 0)))
    elif kind == 'slide':
        x = P.pluck('nylon_guitar', e['pitch'], float(e['dur']), vel=float(e['vel']), bend=[(0, 0), (0.12, 0), (0.92, 5)])
        add(buf, x, t, 1.0, float(e.get('pan', 0)))
    elif kind == 'brush':
        add(buf, brush(seed=20 + i), t, 0.55, float(e.get('pan', 0)))
    else:
        sys.exit(f'score.py: unknown note kind {kind}')

buf = limit(buf, 0.9)
out = os.path.join(HERE, 'music.wav')
sf.write(out, buf, SR)
print('wrote', out, f'{DUR:.2f}s')
