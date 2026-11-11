// Warm paper: mottling, long fibres, tooth, vignette. Anchored to the paper.
import { hash } from '/core/lib.js';
import { applyCam, worldToScreen } from './cam.js';

export const PAPER = '#F4EFE4';
export const PAPER_RGB = [244, 239, 228];

const ORIGIN_X = -1800;
const ORIGIN_Y = -1000;
const TW = 3600;
const TH = 2100;

function noise2(x, y) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const u = x - i;
  const v = y - j;
  const su = u * u * (3 - 2 * u);
  const sv = v * v * (3 - 2 * v);
  const h = (a, b) => hash(a * 131.17 + b * 17.13 + 4.4);
  const n00 = h(i, j);
  const n10 = h(i + 1, j);
  const n01 = h(i, j + 1);
  const n11 = h(i + 1, j + 1);
  return n00 + (n10 - n00) * su + (n01 - n00) * sv + (n00 - n10 - n01 + n11) * su * sv;
}

function softLight(base, blend) {
  if (blend < 0.5) return base - (1 - 2 * blend) * base * (1 - base);
  const d = base <= 0.25
    ? ((16 * base - 12) * base + 4) * base
    : Math.sqrt(base);
  return base + (2 * blend - 1) * (d - base);
}

function paintBase(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const scale = TW / w;
  for (let y = 0; y < h; y += 2) {
    const wy = ORIGIN_Y + y * scale;
    for (let x = 0; x < w; x += 2) {
      const wx = ORIGIN_X + x * scale;
      const n = noise2(wx / 220, wy / 220);
      const n2 = noise2(wx / 90 + 3.1, wy / 90);
      const m = softLight(0.97, 0.5 + (n - 0.5) * 0.07 + (n2 - 0.5) * 0.035);
      const dx = wx / 1500;
      const dy = wy / 1100;
      const vig = Math.min(1, Math.hypot(dx, dy));
      const v = m * (1 - 0.13 * vig * vig);
      const r = Math.round(244 * v + 18 * (1 - v));
      const g = Math.round(239 * v + 14 * (1 - v));
      const b = Math.round(228 * v + 10 * (1 - v));
      const i0 = (y * w + x) * 4;
      d[i0] = r; d[i0 + 1] = g; d[i0 + 2] = b; d[i0 + 3] = 255;
      if (x + 1 < w) {
        d[i0 + 4] = r; d[i0 + 5] = g; d[i0 + 6] = b; d[i0 + 7] = 255;
      }
      if (y + 1 < h) {
        const i1 = i0 + w * 4;
        d[i1] = r; d[i1 + 1] = g; d[i1 + 2] = b; d[i1 + 3] = 255;
        if (x + 1 < w) {
          d[i1 + 4] = r; d[i1 + 5] = g; d[i1 + 6] = b; d[i1 + 7] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function paintFibres(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(90, 74, 52, 0.28)';
  let seed = 19;
  const rnd = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 2400; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const len = 10 + rnd() * 26;
    const ang = (rnd() - 0.5) * 0.55;
    ctx.globalAlpha = 0.25 + rnd() * 0.45;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}

let base = null;
let fibre = null;

export function preparePaper() {
  const w = 1800;
  const h = 1050;
  base = paintBase(w, h);
  fibre = paintFibres(w, h);
}

export function drawPaper(ctx, cam) {
  ctx.save();
  applyCam(ctx, cam);
  ctx.drawImage(base, ORIGIN_X, ORIGIN_Y, TW, TH);
  const fa = Math.max(0, Math.min(0.55, (cam.zoom - 1.15) / 2.2));
  if (fa > 0.02) {
    ctx.globalAlpha = fa;
    ctx.drawImage(fibre, ORIGIN_X, ORIGIN_Y, TW, TH);
  }
  ctx.restore();
}

export function drawTooth(ctx, cam) {
  if (cam.zoom < 1.75) return;
  const step = 18;
  ctx.save();
  ctx.fillStyle = 'rgba(29,26,23,0.28)';
  const x0 = cam.x - 1100 / cam.zoom;
  const y0 = cam.y - 700 / cam.zoom;
  const x1 = cam.x + 1100 / cam.zoom;
  const y1 = cam.y + 700 / cam.zoom;
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const h = hash(Math.floor(x) * 13.1 + Math.floor(y) * 7.7);
      if (h < 0.985) continue;
      const [sx, sy] = worldToScreen(x, y, cam);
      if (sx < -2 || sy < -2 || sx > 1922 || sy > 1082) continue;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }
  }
  ctx.restore();
}
