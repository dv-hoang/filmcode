"""Generate the warm cotton paper the whole film sits on.

Base colour, three octaves of smooth noise, a few thousand short curved fibres,
fine grain, a light vignette.
"""
import numpy as np
from PIL import Image
from PIL import ImageFilter

W, H = 1920, 1080
BASE = np.array([243, 236, 222], dtype=np.float32)  # #f3ecde
rng = np.random.default_rng(11)


def smooth_noise(w, h, cells, rng):
    small = rng.normal(0, 1, (max(2, cells * h // w), cells)).astype(np.float32)
    img = Image.fromarray(((small - small.min()) / (np.ptp(small) + 1e-6) * 255).astype(np.uint8))
    img = img.resize((w, h), Image.BICUBIC)
    a = np.asarray(img, dtype=np.float32) / 255.0 - 0.5
    return a


# three octaves of paper mottling, +-3.5 %
n = (
    smooth_noise(W, H, 5, rng) * 0.020
    + smooth_noise(W, H, 17, rng) * 0.012
    + smooth_noise(W, H, 61, rng) * 0.007
)
n = np.clip(n, -0.035, 0.035)
img = BASE[None, None, :] * (1.0 + n[:, :, None])

# a warmer, very slightly darker edge (paper is never perfectly even)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
vign = 1.0 - 0.055 * np.clip(r / 1.35, 0, 1) ** 2
img *= vign[:, :, None]

# short curved fibres, lighter and darker than the paper
fib = np.zeros((H, W), dtype=np.float32)
for _ in range(2600):
    x0, y0 = rng.uniform(0, W), rng.uniform(0, H)
    ang = rng.uniform(0, 2 * np.pi)
    ln = rng.uniform(6, 34)
    bend = rng.uniform(-0.5, 0.5)
    steps = int(ln)
    for i in range(steps):
        u = i / max(1, steps - 1)
        x = x0 + np.cos(ang + bend * u) * ln * u
        y = y0 + np.sin(ang + bend * u) * ln * u
        xi, yi = int(x), int(y)
        if 0 <= xi < W and 0 <= yi < H:
            fib[yi, xi] += 1.0
fib_img = Image.fromarray(np.clip(fib / max(1e-6, fib.max()) * 255, 0, 255).astype(np.uint8))
fib_img = fib_img.filter(ImageFilter.GaussianBlur(0.7))
f = np.asarray(fib_img, dtype=np.float32) / 255.0
light = rng.uniform(0, 1, (H, W)) > 0.45
img += (f * 9.0)[:, :, None] * np.where(light, 1.0, -0.85)[:, :, None]

# fine grain
img += rng.normal(0, 1.6, (H, W, 1))

img = np.clip(img, 0, 255).astype(np.uint8)
Image.fromarray(img).save("paper.jpg", quality=94)
print("paper.jpg written", W, H)
