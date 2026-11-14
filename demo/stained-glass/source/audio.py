import os
import sys

LIB = os.environ.get("LIB") or os.path.expanduser("~/.filmcode/library")
sys.path.insert(0, LIB)

import numpy as np
import soundfile as sf
from core.audio.sfx import SR, add, limit, noise, hp, lp, brown, norm, env_exp

DUR = 10.0
N = int(DUR * SR)
buf = np.zeros((N, 2), np.float32)
t = np.arange(N) / SR

def bell(at, freq, dur=1.8, gain=0.2, pan=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    # Cathedral bronze bell overtone spectrum
    x = (0.7 * np.sin(2 * np.pi * freq * tt) +
         0.4 * np.sin(2 * np.pi * freq * 2.76 * tt + 0.5) +
         0.2 * np.sin(2 * np.pi * freq * 5.4 * tt + 1.2))
    x *= np.exp(-tt / (dur * 0.45))
    add(buf, x, at, gain, pan)

def glass_shard(at, freq, gain=0.15, pan=0.0):
    dur = 0.6
    n = int(dur * SR)
    tt = np.arange(n) / SR
    # High crystalline ring with metallic scrape
    x = np.sin(2 * np.pi * freq * tt) * np.exp(-tt / 0.15)
    x += hp(noise(dur), 3500) * env_exp(dur, 0.01) * 0.4
    add(buf, x, at, gain, pan)

def wind_whoosh(at, dur=4.0, gain=0.12):
    n = int(dur * SR)
    x = lp(brown(dur), 450) * env_exp(dur, 1.0)
    add(buf, x, at, gain, 0.0)

# --- Sound Design Timeline ---

# 1. Opening cathedral stillness and distant wind
wind_whoosh(0.0, 5.0, 0.10)
wind_whoosh(4.5, 5.5, 0.14)

# 2. Medieval clock / bronze bell striking as light breaks (t = 2.0s)
bell(2.0, 110.0, 2.5, 0.28, -0.2)
bell(2.15, 220.0, 2.0, 0.18, 0.2)

# 3. Glass fracturing and reassembling (t = 4.0s to 7.0s)
glass_shard(4.2, 2400, 0.18, -0.3)
glass_shard(4.6, 3100, 0.22, 0.3)
glass_shard(5.3, 2800, 0.20, -0.1)
glass_shard(6.1, 3500, 0.25, 0.2)
glass_shard(6.8, 4200, 0.28, 0.0)

# 4. Grand climax chord and resonant bell (t = 7.5s)
bell(7.5, 110.0, 3.5, 0.35, 0.0)
bell(7.55, 164.8, 3.0, 0.25, -0.25)
bell(7.6, 220.0, 3.0, 0.30, 0.25)

# Master limit and save
norm(buf, 0.92)
limit(buf, 0.95)

out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio.wav")
sf.write(out_path, buf, SR)
print(f"Wrote audio to {out_path}")
