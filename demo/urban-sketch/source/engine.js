// Pen-and-wash primitives for Still Lit. Deterministic: same seed, same marks.
import { clamp, lerp, mulberry } from '/core/lib.js';

export const INK = [63, 51, 44];

export function rgba(c, a = 1) {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

export function v2(x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const sx = (x - x0), sy = (y - y0);
  const u = sx * sx * (3 - 2 * sx), v = sy * sy * (3 - 2 * sy);
  const h = (ix, iy) => {
    const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  return lerp(lerp(h(x0, y0), h(x0 + 1, y0), u), lerp(h(x0, y0 + 1), h(x0 + 1, y0 + 1), u), v);
}

export function mixc(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

export function darken(c, t) {
  return c.map(v => Math.round(v * (1 - t)));
}

function dist(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

export function resample(pts, step = 8) {
  if (pts.length < 2) return pts.map(p => p.slice());
  const out = [pts[0].slice()];
  let x0 = pts[0][0], y0 = pts[0][1], acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const x1 = pts[i][0], y1 = pts[i][1];
    let left = dist([x0, y0], [x1, y1]);
    if (left === 0) continue;
    while (acc + left >= step) {
      const t = (step - acc) / left;
      x0 += (x1 - x0) * t;
      y0 += (y1 - y0) * t;
      out.push([x0, y0]);
      left = dist([x0, y0], [x1, y1]);
      acc = 0;
    }
    acc += left;
  }
  const last = pts[pts.length - 1];
  const prev = out[out.length - 1];
  if (dist(prev, last) > 0.5) out.push(last.slice());
  return out;
}

function extend(pts, over) {
  if (pts.length < 2 || over <= 0) return pts.map(p => p.slice());
  const a = pts[0], b = pts[1], c = pts[pts.length - 2], d = pts[pts.length - 1];
  const ab = dist(a, b) || 1, cd = dist(c, d) || 1;
  return [
    [a[0] - ((b[0] - a[0]) / ab) * over, a[1] - ((b[1] - a[1]) / ab) * over],
    ...pts.map(p => p.slice()),
    [d[0] + ((d[0] - c[0]) / cd) * over, d[1] + ((d[1] - c[1]) / cd) * over],
  ];
}

/** Fineliner along a polyline: wobble, overshoot, one gap on long strokes. */
export function penStroke(pts, opt = {}) {
  const rnd = mulberry(opt.seed || 1);
  const wob = opt.wob ?? 1.05;
  const over = opt.over ?? (4 + rnd() * 3.5);
  const sampled = resample(pts, opt.step || 8);
  const ext = extend(sampled, over);
  const out = ext.map((p, i) => {
    const prev = ext[Math.max(0, i - 1)];
    const next = ext[Math.min(ext.length - 1, i + 1)];
    const dx = next[0] - prev[0], dy = next[1] - prev[1];
    const L = Math.hypot(dx, dy) || 1;
    const mag = (rnd() - 0.5) * 2 * wob;
    return [p[0] + (-dy / L) * mag, p[1] + (dx / L) * mag];
  });
  let len = 0;
  for (let i = 1; i < out.length; i++) len += dist(out[i - 1], out[i]);
  const gap = opt.gap !== false && len > 96 && rnd() < 0.5;
  return {
    pts: out,
    w: opt.w || 2,
    gap,
    gapAt: 0.32 + rnd() * 0.28,
    gapW: 0.018 + rnd() * 0.028,
  };
}

/** Draw a prepared stroke up to fraction p (0–1). */
export function drawPen(ctx, stroke, p = 1, color = INK, alpha = 0.96) {
  if (!(p > 0) || !stroke || stroke.pts.length < 2) return;
  const pts = stroke.pts;
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + dist(pts[i - 1], pts[i]));
  const total = lens[lens.length - 1] || 1;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = stroke.w;
  ctx.beginPath();
  let on = false;
  for (let i = 1; i < pts.length; i++) {
    const u0 = lens[i - 1] / total;
    if (u0 >= p) break;
    let u1 = lens[i] / total;
    let b = pts[i];
    const a = pts[i - 1];
    if (u1 > p) {
      const f = (p - u0) / (u1 - u0 || 1);
      b = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      u1 = p;
    }
    const mid = (u0 + u1) / 2;
    const inGap = stroke.gap && mid > stroke.gapAt && mid < stroke.gapAt + stroke.gapW;
    if (inGap) { on = false; continue; }
    if (!on) { ctx.moveTo(a[0], a[1]); on = true; }
    ctx.lineTo(b[0], b[1]);
  }
  ctx.stroke();
  ctx.restore();
}

export function arcPts(cx, cy, rx, ry, a0, a1, n = 7) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

export function ellipsePts(cx, cy, rx, ry, n = 14) {
  return arcPts(cx, cy, rx, ry, 0, Math.PI * 2, n);
}

/** Left-to-right handwriting. Returns the unclipped width in user units. */
export function handwrite(ctx, text, x, y, size, p, color = INK) {
  if (!(p > 0)) return 0;
  ctx.save();
  ctx.font = `560 ${size}px Caveat, cursive`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText(text).width;
  ctx.beginPath();
  ctx.rect(x - 8, y - size * 1.15, (w + 16) * clamp(p), size * 1.55);
  ctx.clip();
  ctx.fillStyle = rgba(color, 0.92);
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 0.28;
  ctx.fillText(text, x + 0.7, y + 0.45);
  ctx.restore();
  return w;
}

export function textWidth(ctx, text, size) {
  ctx.save();
  ctx.font = `560 ${size}px Caveat, cursive`;
  const w = ctx.measureText(text).width;
  ctx.restore();
  return w;
}

export function makeTooth() {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const g = c.getContext('2d');
  const img = g.createImageData(96, 96);
  const rnd = mulberry(21);
  for (let i = 0; i < 96 * 96; i++) {
    const speck = rnd() > 0.8;
    const v = speck ? 140 + rnd() * 50 : 246 + rnd() * 9;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = Math.max(0, v - 6);
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function paperPath(w, h) {
  const p = new Path2D();
  const rnd = mulberry(4);
  const edge = (x0, y0, x1, y1, n) => {
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      p.lineTo(lerp(x0, x1, u) + (rnd() - 0.5) * 36, lerp(y0, y1, u) + (rnd() - 0.5) * 30);
    }
  };
  p.moveTo(70, 90);
  edge(70, 90, w - 80, 70, 16);
  edge(w - 80, 70, w - 60, h - 70, 14);
  edge(w - 60, h - 70, 80, h - 60, 16);
  edge(80, h - 60, 70, 90, 12);
  p.closePath();
  return p;
}

/** Cream sheet, two octaves of mottling, frayed edge. */
export function bakePaper(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const path = paperPath(w, h);
  g.save();
  g.clip(path);
  g.fillStyle = '#f4ecdf';
  g.fillRect(0, 0, w, h);
  const sw = 180, sh = 104;
  const small = document.createElement('canvas');
  small.width = sw;
  small.height = sh;
  const sg = small.getContext('2d');
  const im = sg.createImageData(sw, sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const n = v2(x * 0.04, y * 0.04) * 0.62 + v2(x * 0.11 + 4, y * 0.11) * 0.38;
      const d = (n - 0.5) * 26;
      const i = (y * sw + x) * 4;
      im.data[i] = clamp(244 + d, 0, 255);
      im.data[i + 1] = clamp(236 + d * 0.95, 0, 255);
      im.data[i + 2] = clamp(223 + d * 0.75, 0, 255);
      im.data[i + 3] = 255;
    }
  }
  sg.putImageData(im, 0, 0);
  g.imageSmoothingEnabled = true;
  g.drawImage(small, 0, 0, w, h);
  g.globalCompositeOperation = 'destination-out';
  const rnd = mulberry(8);
  for (let i = 0; i < 110; i++) {
    const which = rnd();
    const x = which < 0.55 ? rnd() * w : (which < 0.78 ? rnd() * 110 : w - rnd() * 120);
    const y = which < 0.55 ? (h - 30 - rnd() * 130) : rnd() * h;
    g.fillStyle = `rgba(0,0,0,${0.55 + rnd() * 0.4})`;
    g.beginPath();
    g.ellipse(x, y, 5 + rnd() * 18, 4 + rnd() * 12, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  const rnd2 = mulberry(9);
  const spray = [[156, 58, 74], [228, 210, 180], [95, 138, 69], [232, 186, 150]];
  for (let i = 0; i < 60; i++) {
    const x = rnd2() < 0.5 ? rnd2() * 64 : w - rnd2() * 64;
    const y = rnd2() * h;
    const col = spray[i % spray.length];
    g.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.28 + rnd2() * 0.25})`;
    g.beginPath();
    g.ellipse(x, y, 4 + rnd2() * 11, 3 + rnd2() * 8, rnd2() * 2, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}
