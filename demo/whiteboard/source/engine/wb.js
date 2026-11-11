// Whiteboard marker engine for The Open Top.
// Board-locked ink, screen-stable wobble in board space, floating pens, glossy sheen.
import { mulberry, hash, clamp, lerp } from '/core/lib.js';

export const BOARD_W = 8000;
export const BOARD_H = 4500;
const VW = 1920;
const VH = 1080;

export function easeHand(u) {
  u = clamp(u);
  return u - Math.sin(Math.PI * 2 * u) / (Math.PI * 2) * 0.8;
}

function lenOf(pts) {
  let n = 0;
  for (let i = 1; i < pts.length; i++) n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return n;
}

function resample(pts, step) {
  if (pts.length < 2) return pts.slice();
  const out = [pts[0].slice()];
  let prev = pts[0];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    let dx = p[0] - prev[0], dy = p[1] - prev[1];
    let seg = Math.hypot(dx, dy);
    if (seg < 1e-6) { prev = p; continue; }
    while (acc + seg >= step) {
      const t = (step - acc) / seg;
      const nx = prev[0] + dx * t, ny = prev[1] + dy * t;
      out.push([nx, ny]);
      prev = [nx, ny];
      dx = p[0] - prev[0]; dy = p[1] - prev[1];
      seg = Math.hypot(dx, dy);
      acc = 0;
    }
    acc += seg;
    prev = p;
  }
  const last = pts[pts.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > step * 0.35) out.push(last.slice());
  return out;
}

function wobblePts(pts, seed, amp, wave) {
  const out = [];
  let s = 0;
  const phase = hash(seed) * Math.PI * 2;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const L = Math.hypot(nx, ny) || 1;
    nx /= L; ny /= L;
    const tremor = (hash(seed * 13.1 + i * 2.7) - 0.5) * amp * 0.45;
    const w = Math.sin((s / wave) * Math.PI * 2 + phase) * amp + tremor;
    out.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
  }
  return out;
}

function pointAlong(pts, dist) {
  if (dist <= 0) return { p: pts[0], tang: tangent(pts, 0) };
  let left = dist;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
    const seg = Math.hypot(dx, dy);
    if (left <= seg) {
      const t = seg < 1e-6 ? 0 : left / seg;
      return {
        p: [pts[i - 1][0] + dx * t, pts[i - 1][1] + dy * t],
        tang: [dx / (seg || 1), dy / (seg || 1)],
      };
    }
    left -= seg;
  }
  return { p: pts[pts.length - 1], tang: tangent(pts, pts.length - 1) };
}

function tangent(pts, i) {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return [dx / L, dy / L];
}

function sliceTo(pts, dist) {
  if (pts.length < 2) return pts.slice();
  const out = [pts[0].slice()];
  let left = dist;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
    const seg = Math.hypot(dx, dy);
    if (left <= seg) {
      const t = seg < 1e-6 ? 0 : left / seg;
      out.push([pts[i - 1][0] + dx * t, pts[i - 1][1] + dy * t]);
      return out;
    }
    out.push(pts[i].slice());
    left -= seg;
  }
  return out;
}

export class Stroke {
  constructor(points, opts = {}) {
    this.pts = points.map(p => [p[0], p[1]]);
    this.w = opts.w ?? 8;
    this.color = opts.color ?? '#1f2a44';
    this.seed = opts.seed ?? Math.round(points[0][0] * 10 + points[0][1]);
    this.len = Math.max(1, lenOf(this.pts));
    this.dot = opts.dot !== false && this.len > 36;
  }
}

let seedSeq = 100;
function nextSeed() { seedSeq += 17; return seedSeq; }

export function line(x0, y0, x1, y1, opt = {}) {
  const over = opt.over ?? 0;
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  return new Stroke([
    [x0 - ux * over * 0.25, y0 - uy * over * 0.25],
    [x1 + ux * over, y1 + uy * over],
  ], { ...opt, seed: opt.seed ?? nextSeed() });
}

function quadPoints(x0, y0, cx, cy, x1, y1, n = 16) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([
      u * u * x0 + 2 * u * t * cx + t * t * x1,
      u * u * y0 + 2 * u * t * cy + t * t * y1,
    ]);
  }
  return pts;
}

export function curve(x0, y0, cx, cy, x1, y1, opt = {}) {
  return new Stroke(quadPoints(x0, y0, cx, cy, x1, y1), { ...opt, seed: opt.seed ?? nextSeed() });
}

export function ellipse(cx, cy, rx, ry, opt = {}) {
  const a0 = opt.a0 ?? -0.55;
  const lap = opt.lap ?? 0.62;
  const n = 36;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (Math.PI * 2 + lap) * (i / n);
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return new Stroke(pts, { ...opt, seed: opt.seed ?? nextSeed() });
}

export function circle(cx, cy, r, opt = {}) {
  return ellipse(cx, cy, r, r, opt);
}

export function arrow(x0, y0, x1, y1, opt = {}) {
  const bow = opt.bow ?? 0;
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const mx = (x0 + x1) / 2 + nx * bow * L;
  const my = (y0 + y1) / 2 + ny * bow * L;
  const shaft = quadPoints(x0, y0, mx, my, x1, y1);
  const ang = Math.atan2(y1 - my, x1 - mx);
  const hl = Math.max(22, (opt.w ?? 8) * 3.4);
  const spread = 0.5;
  const h1 = [x1 - Math.cos(ang - spread) * hl, y1 - Math.sin(ang - spread) * hl];
  const h2 = [x1 - Math.cos(ang + spread) * hl, y1 - Math.sin(ang + spread) * hl];
  const o = { ...opt };
  return [
    new Stroke(shaft, { ...o, seed: nextSeed() }),
    new Stroke([h1, [x1, y1]], { ...o, seed: nextSeed(), dot: false }),
    new Stroke([h2, [x1, y1]], { ...o, seed: nextSeed(), dot: false }),
  ];
}

function oval(cx, cy, rx, ry, a0 = -0.9, lap = 0.55, n = 20) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (Math.PI * 2 + lap) * (i / n);
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

// Single-stroke hand. y grows up; 0 is the baseline, 1 is the cap line. x-height ≈ 0.62.
const G = {
  T: { w: 0.78, s: [[[0.06, 0.98], [0.92, 0.98]], [[0.5, 0.98], [0.5, 0.02]]] },
  H: { w: 0.82, s: [[[0.12, 0.98], [0.12, 0.02]], [[0.12, 0.5], [0.86, 0.5]], [[0.86, 0.98], [0.86, 0.02]]] },
  E: { w: 0.72, s: [[[0.78, 0.98], [0.14, 0.98], [0.14, 0.02], [0.78, 0.02]], [[0.14, 0.5], [0.64, 0.5]]] },
  O: { w: 0.86, s: [oval(0.42, 0.5, 0.34, 0.48)] },
  P: { w: 0.74, s: [[[0.16, 0.02], [0.16, 0.98]], oval(0.42, 0.74, 0.28, 0.24, 1.2, 0.4)] },
  N: { w: 0.82, s: [[[0.12, 0.02], [0.12, 0.98], [0.84, 0.02], [0.84, 0.98]]] },
  c: { w: 0.62, s: [[[0.52, 0.52], [0.36, 0.62], [0.16, 0.48], [0.12, 0.28], [0.22, 0.06], [0.44, 0.02], [0.56, 0.14]]] },
  d: { w: 0.7, s: [oval(0.32, 0.32, 0.22, 0.3, 0.4, 0.5), [[0.52, 0.02], [0.52, 0.98]]] },
  i: { w: 0.32, s: [[[0.16, 0.02], [0.16, 0.6]], [[0.16, 0.82], [0.16, 0.9]]] },
  l: { w: 0.36, s: [[[0.14, 0.02], [0.14, 1.0], [0.3, 0.86]]] },
  o: { w: 0.64, s: [oval(0.3, 0.32, 0.22, 0.3)] },
  p: { w: 0.68, s: [[[0.14, 0.62], [0.14, -0.22]], oval(0.36, 0.32, 0.22, 0.28, -1.1, 0.45)] },
  r: { w: 0.5, s: [[[0.12, 0.02], [0.12, 0.62], [0.28, 0.5], [0.44, 0.6]]] },
  s: { w: 0.58, s: [[[0.48, 0.54], [0.32, 0.64], [0.14, 0.52], [0.16, 0.36], [0.36, 0.28], [0.5, 0.16], [0.4, 0.02], [0.16, 0.06]]] },
  u: { w: 0.66, s: [[[0.1, 0.62], [0.1, 0.2], [0.22, 0.02], [0.44, 0.02], [0.54, 0.18], [0.54, 0.62]]] },
  w: { w: 0.9, s: [[[0.04, 0.62], [0.22, 0.02], [0.44, 0.5], [0.66, 0.02], [0.86, 0.62]]] },
};

export function text(str, x, y, opt = {}) {
  const h = opt.h ?? 64;
  const color = opt.color ?? '#1f2a44';
  const gap = h * 0.16;
  const adv = [];
  for (const ch of str) adv.push(ch === ' ' ? h * 0.42 : (G[ch] ? G[ch].w * h : h * 0.4));
  let total = adv.reduce((a, b) => a + b, 0) + gap * Math.max(0, str.length - 1);
  let cx = x;
  if (opt.align === 'center') cx -= total / 2;
  if (opt.align === 'right') cx -= total;
  const x0 = cx;
  const strokes = [];
  let i = 0;
  for (const ch of str) {
    const g = G[ch];
    const jR = (hash(opt.seed ?? x) + hash(i * 19.7 + y) - 1) * (2 * Math.PI / 180);
    const jB = (hash(i * 3.1 + 4 + (opt.seed ?? 0)) - 0.5) * 2 * 0.035 * h;
    const jS = 1 + (hash(i * 9.3 + 8) - 0.5) * 2 * 0.035;
    if (g) {
      const c = Math.cos(jR), sn = Math.sin(jR);
      g.s.forEach((src, k) => {
        const pts = src.map(([px, py]) => {
          const lx = px * h * jS;
          const ly = -py * h * jS;
          return [cx + lx * c - ly * sn, y + jB + lx * sn + ly * c];
        });
        strokes.push(new Stroke(pts, {
          w: h * 0.13,
          color,
          seed: Math.round((opt.seed ?? 1) * 100 + i * 23 + k * 5),
          dot: lenOf(pts) > h * 0.45,
        }));
      });
    }
    cx += adv[i] + gap;
    i++;
  }
  strokes.box = { x0: x0 - h * 0.08, y0: y - h * 1.12, x1: x0 + total + h * 0.12, y1: y + h * 0.28 };
  return strokes;
}

export class Pen {
  constructor(id, color, opt = {}) {
    this.id = id;
    this.color = color;
    this.park = opt.park || { x: -180, y: 220 };
  }
}

export class Timeline {
  constructor() {
    this.spans = [];
    this.erases = [];
    this.cues = [];
  }

  draw(pen, shapes, t, opt = {}) {
    const list = (Array.isArray(shapes) ? shapes : [shapes]).flat();
    const by = opt.by ?? (t + list.length * 0.35);
    const minGap = opt.minGap ?? 0.04;
    const gaps = Math.max(0, list.length - 1) * minGap;
    const budget = Math.max(0.04 * list.length, by - t - gaps);
    const lens = list.map(s => Math.max(8, s.len));
    const total = lens.reduce((a, b) => a + b, 0);
    let durs = lens.map(L => budget * L / total);
    let cursor = t;
    list.forEach((stroke, i) => {
      const dur = Math.max(0.03, durs[i]);
      this.spans.push({ pen, stroke, t0: cursor, t1: cursor + dur });
      cursor += dur;
      if (i < list.length - 1) cursor += minGap;
    });
  }

  erase(path, t, dur, opt = {}) {
    this.erases.push({
      path, t0: t, t1: t + dur,
      width: opt.width ?? 160,
      strength: opt.strength ?? 0.9,
    });
  }

  cue(t, type, extra = {}) {
    this.cues.push({ t, type, ...extra });
  }

  progress(stroke, t) {
    const s = this.spans.find(sp => sp.stroke === stroke);
    if (!s) return t >= 0 ? 1 : 0;
    if (t <= s.t0) return 0;
    if (t >= s.t1) return 1;
    return easeHand((t - s.t0) / (s.t1 - s.t0));
  }

  spanProgress(sp, t) {
    if (t <= sp.t0) return 0;
    if (t >= sp.t1) return 1;
    return easeHand((t - sp.t0) / (sp.t1 - sp.t0));
  }
}

export function worldToScreen(cam, x, y) {
  const dx = x - cam.x, dy = y - cam.y;
  const c = Math.cos(cam.roll || 0), s = Math.sin(cam.roll || 0);
  const rx = dx * c - dy * s;
  const ry = dx * s + dy * c;
  return [VW / 2 + rx * cam.zoom, VH / 2 + ry * cam.zoom];
}

export class Camera {
  constructor(keys) { this.keys = keys; }
  at(t) {
    const ks = this.keys;
    if (t <= ks[0][0]) return pack(ks[0]);
    if (t >= ks[ks.length - 1][0]) return pack(ks[ks.length - 1]);
    let i = 0;
    while (ks[i + 1][0] < t) i++;
    const a = ks[i], b = ks[i + 1];
    const u = clamp((t - a[0]) / (b[0] - a[0]));
    const e = easeName(b[5] || 'io', u);
    const z0 = 1 / a[3], z1 = 1 / b[3];
    const z = 1 / (z0 + (z1 - z0) * e);
    return {
      t,
      x: a[1] + (b[1] - a[1]) * e,
      y: a[2] + (b[2] - a[2]) * e,
      zoom: z,
      roll: (a[4] || 0) + ((b[4] || 0) - (a[4] || 0)) * e,
    };
  }
}

function pack(k) {
  return { t: k[0], x: k[1], y: k[2], zoom: k[3], roll: k[4] || 0 };
}

function easeName(name, u) {
  if (name === 'l') return u;
  if (name === 'i') return u * u * u;
  if (name === 'o') return 1 - Math.pow(1 - u, 3);
  const t = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  return t;
}

function penSpans(tl, pen) {
  return tl.spans.filter(s => s.pen === pen);
}

export function penPose(pen, t, cam, tl) {
  const spans = penSpans(tl, pen);
  if (!spans.length) return null;
  for (const s of spans) {
    if (t >= s.t0 && t <= s.t1 + 0.0001) {
      const pr = tl.spanProgress(s, t);
      const baked = bakedStroke(s.stroke);
      const at = pointAlong(baked, pr * lenOf(baked));
      const [sx, sy] = worldToScreen(cam, at.p[0], at.p[1]);
      return { x: sx, y: sy, ang: Math.atan2(at.tang[1], at.tang[0]), lift: 0, show: true };
    }
  }
  let prev = null, next = null;
  for (const s of spans) {
    if (s.t1 < t) prev = s;
    if (s.t0 > t && !next) next = s;
  }
  const tip = (sp, u) => {
    const baked = bakedStroke(sp.stroke);
    const at = pointAlong(baked, u * lenOf(baked));
    return worldToScreen(cam, at.p[0], at.p[1]);
  };
  if (!prev && next) {
    const [sx, sy] = tip(next, 0);
    return fly(pen.park, { x: sx, y: sy }, next.t0 - 0.42, next.t0, t);
  }
  if (prev && !next) {
    const [sx, sy] = tip(prev, 1);
    return fly({ x: sx, y: sy }, pen.park, prev.t1, prev.t1 + 0.38, t);
  }
  if (prev && next) {
    const gap = next.t0 - prev.t1;
    const [x0, y0] = tip(prev, 1);
    const [x1, y1] = tip(next, 0);
    if (gap > 0.75) {
      const awayEnd = prev.t1 + 0.32;
      const backStart = next.t0 - 0.42;
      if (t < awayEnd) return fly({ x: x0, y: y0 }, pen.park, prev.t1, awayEnd, t);
      if (t < backStart) return { x: pen.park.x, y: pen.park.y, ang: 0.4, lift: 10, show: false };
      return fly(pen.park, { x: x1, y: y1 }, backStart, next.t0, t);
    }
    const u = clamp((t - prev.t1) / Math.max(0.001, gap));
    const sm = u * u * (3 - 2 * u);
    const dist = Math.hypot(x1 - x0, y1 - y0);
    return {
      x: lerp(x0, x1, sm),
      y: lerp(y0, y1, sm),
      ang: Math.atan2(y1 - y0, x1 - x0),
      lift: Math.sin(sm * Math.PI) * clamp(dist * 0.35, 8, 90),
      show: true,
    };
  }
  return null;
}

function fly(a, b, t0, t1, t) {
  if (t <= t0) return { x: a.x, y: a.y, ang: 0.3, lift: 16, show: t0 - t < 0.05 };
  if (t >= t1) return { x: b.x, y: b.y, ang: 0.2, lift: 0, show: true };
  const u = (t - t0) / Math.max(0.001, t1 - t0);
  const sm = u * u * (3 - 2 * u);
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const onScreen = (x, y) => x > -40 && x < VW + 40 && y > -40 && y < VH + 40;
  const x = lerp(a.x, b.x, sm), y = lerp(a.y, b.y, sm);
  return {
    x, y,
    ang: Math.atan2(b.y - a.y, b.x - a.x),
    lift: Math.sin(sm * Math.PI) * clamp(dist * 0.22, 12, 110),
    show: onScreen(x, y),
  };
}

const bakedCache = new WeakMap();
function bakedStroke(stroke) {
  let b = bakedCache.get(stroke);
  if (b) return b;
  const step = Math.max(3.2, stroke.w * 0.6);
  const rs = resample(stroke.pts, step);
  b = wobblePts(rs, stroke.seed, 2.6, 220);
  bakedCache.set(stroke, b);
  return b;
}

function makeTile() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const rnd = mulberry(11);
  g.strokeStyle = '#fff';
  g.fillStyle = '#fff';
  for (let i = 0; i < 700; i++) {
    g.globalAlpha = 0.25 + rnd() * 0.55;
    const x = rnd() * 512, y = rnd() * 512;
    g.fillRect(x, y, 1 + rnd() * 1.4, 1);
  }
  for (let i = 0; i < 70; i++) {
    g.globalAlpha = 0.18 + rnd() * 0.35;
    g.lineWidth = 1;
    const x = rnd() * 512, y = rnd() * 512;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 10 + rnd() * 22, y + (rnd() - 0.5) * 2.5);
    g.stroke();
  }
  return c;
}

function makeScratch() {
  const c = document.createElement('canvas');
  c.width = VW; c.height = VH;
  return c;
}

export class Board {
  constructor(tl, opt = {}) {
    this.tl = tl;
    this.ghosts = opt.ghosts || [];
    this.objs = [];
    this.ink = document.createElement('canvas');
    this.ink.width = VW; this.ink.height = VH;
    this.scratch = makeScratch();
    this.tile = makeTile();
  }

  render(ctx, t, cam) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, VW, VH);
    ctx.fillStyle = '#d8d3ca';
    ctx.fillRect(0, 0, VW, VH);

    ctx.save();
    ctx.translate(VW / 2, VH / 2);
    ctx.rotate(cam.roll || 0);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
    const grd = ctx.createLinearGradient(0, 0, 0, BOARD_H);
    grd.addColorStop(0, '#fbfbf9');
    grd.addColorStop(1, '#eeede9');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);
    drawScuffs(ctx);
    ctx.lineWidth = 26 / cam.zoom;
    ctx.strokeStyle = '#c5c9d0';
    ctx.strokeRect(14, 14, BOARD_W - 28, BOARD_H - 28);
    ctx.lineWidth = 6 / cam.zoom;
    ctx.strokeStyle = '#9aa3ad';
    ctx.strokeRect(34, 34, BOARD_W - 68, BOARD_H - 68);
    ctx.globalAlpha = 0.075;
    ctx.strokeStyle = '#8aa0c8';
    ctx.fillStyle = '#9aa0a8';
    ctx.lineWidth = 5 / cam.zoom;
    ctx.lineCap = 'round';
    for (const g of this.ghosts) {
      ctx.beginPath();
      g.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.stroke();
    }
    ctx.restore();

    paintInk(this, t, cam);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this.ink, 0, 0);
    ctx.restore();

    drawSheen(ctx, cam);
    for (const o of this.objs) o.draw(ctx, t, cam);
  }
}

function drawScuffs(ctx) {
  const rnd = mulberry(3);
  ctx.save();
  ctx.globalAlpha = 0.045;
  ctx.strokeStyle = '#b7b1a6';
  ctx.lineWidth = 2;
  for (let i = 0; i < 28; i++) {
    const x = rnd() * BOARD_W, y = rnd() * BOARD_H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40 + rnd() * 120, y + (rnd() - 0.5) * 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSheen(ctx, cam) {
  ctx.save();
  const ox = -(cam.x * cam.zoom) * 0.35;
  const oy = -(cam.y * cam.zoom) * 0.35;
  ctx.translate(ox % 2400, oy % 1400);
  const g = ctx.createLinearGradient(-200, -100, 1700, 1300);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.42, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.14)');
  g.addColorStop(0.58, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-1500, -1500, 5000, 4000);
  ctx.restore();
}

function paintInk(board, t, cam) {
  const g = board.ink.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, VW, VH);
  for (const sp of board.tl.spans) {
    const pr = board.tl.spanProgress(sp, t);
    if (pr <= 0) continue;
    stampStroke(g, board.scratch, sp.stroke, pr, cam);
  }
  const fade = clamp((cam.zoom - 0.28) / 0.45);
  if (fade > 0.02) {
    g.save();
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 0.55 * fade;
    g.translate(VW / 2, VH / 2);
    g.rotate(cam.roll || 0);
    g.scale(cam.zoom, cam.zoom);
    g.translate(-cam.x, -cam.y);
    for (let y = 0; y < BOARD_H; y += 512) {
      for (let x = 0; x < BOARD_W; x += 512) g.drawImage(board.tile, x, y);
    }
    g.restore();
  }
  for (const er of board.tl.erases) {
    if (t <= er.t0) continue;
    const u = clamp((t - er.t0) / (er.t1 - er.t0));
    stampErase(g, er, u, cam);
  }
}

function stampStroke(ink, scratch, stroke, pr, cam) {
  const baked = bakedStroke(stroke);
  const total = lenOf(baked);
  const shown = sliceTo(baked, pr * total);
  if (shown.length < 2 && pr < 1) {
    if (shown.length === 1 && stroke.len < stroke.w) {
      // fall through to dot
    } else if (shown.length < 2) return;
  }
  const sg = scratch.getContext('2d');
  sg.setTransform(1, 0, 0, 1, 0, 0);
  sg.clearRect(0, 0, VW, VH);
  sg.lineCap = 'round';
  sg.lineJoin = 'round';
  sg.strokeStyle = stroke.color;
  sg.fillStyle = stroke.color;
  const screen = shown.map(p => worldToScreen(cam, p[0], p[1]));
  const lw = Math.max(1.25, stroke.w * cam.zoom);
  if (stroke.len < stroke.w * 0.85) {
    const p = screen[0];
    sg.beginPath();
    sg.arc(p[0], p[1], Math.max(1.4, lw * 0.55), 0, Math.PI * 2);
    sg.fill();
  } else {
    const chunks = 4;
    for (let c = 0; c < chunks; c++) {
      const a = Math.floor(screen.length * c / chunks);
      const b = Math.max(a + 1, Math.ceil(screen.length * (c + 1) / chunks));
      const part = screen.slice(a, b + 1);
      if (part.length < 2) continue;
      const u = (c + 0.5) / chunks;
      let pressure = 1;
      if (u < 0.12) pressure = lerp(0.72, 1, u / 0.12);
      else if (u > 0.86) pressure = lerp(1, 0.22, (u - 0.86) / 0.14);
      const ang = Math.atan2(part[1][1] - part[0][1], part[1][0] - part[0][0]);
      const chisel = 0.82 + 0.18 * Math.abs(Math.cos(ang - Math.PI / 4));
      sg.lineWidth = lw * pressure * chisel;
      sg.beginPath();
      sg.moveTo(part[0][0], part[0][1]);
      for (let i = 1; i < part.length; i++) sg.lineTo(part[i][0], part[i][1]);
      sg.stroke();
    }
    if (stroke.dot && pr > 0.04) {
      const p = screen[0];
      sg.beginPath();
      sg.arc(p[0], p[1], lw * 0.28, 0, Math.PI * 2);
      sg.fill();
    }
  }
  ink.save();
  ink.globalCompositeOperation = 'multiply';
  ink.globalAlpha = 0.94;
  ink.drawImage(scratch, 0, 0);
  ink.restore();
}

function stampErase(ink, er, u, cam) {
  const shown = sliceTo(er.path, u * lenOf(er.path));
  if (shown.length < 2) return;
  ink.save();
  ink.globalCompositeOperation = 'source-over';
  ink.strokeStyle = `rgba(255,255,255,${er.strength})`;
  ink.lineCap = 'round';
  ink.lineJoin = 'round';
  ink.lineWidth = er.width * cam.zoom;
  ink.beginPath();
  const p0 = worldToScreen(cam, shown[0][0], shown[0][1]);
  ink.moveTo(p0[0], p0[1]);
  for (let i = 1; i < shown.length; i++) {
    const p = worldToScreen(cam, shown[i][0], shown[i][1]);
    ink.lineTo(p[0], p[1]);
  }
  ink.stroke();
  ink.restore();
}

export function drawMarker(ctx, pen, pose, cam) {
  if (!pose || !pose.show) return;
  const zoom = clamp(cam.zoom, 0.42, 1.45);
  const L = 168 * zoom;
  const thick = 22 * zoom;
  ctx.save();
  ctx.translate(pose.x, pose.y - pose.lift);
  ctx.rotate(pose.ang);
  const sh = 10 + pose.lift * 0.45;
  ctx.save();
  ctx.translate(6, pose.lift + 16);
  ctx.rotate(-pose.ang);
  ctx.fillStyle = `rgba(40, 44, 52, ${0.18 + Math.min(0.16, pose.lift / 400)})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, thick * 1.3 + pose.lift * 0.25, thick * 0.55 + pose.lift * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#f7f8fa';
  ctx.strokeStyle = '#7d868f';
  ctx.lineWidth = Math.max(1.6, 2.4 * zoom);
  roundRect(ctx, -L, -thick / 2, L * 0.78, thick, thick * 0.4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = pen.color;
  roundRect(ctx, -L * 0.72, -thick / 2, thick * 0.7, thick, 2);
  ctx.fill();
  ctx.fillStyle = pen.color;
  roundRect(ctx, -L, -thick / 2, thick * 0.85, thick, thick * 0.35);
  ctx.fill();
  ctx.fillStyle = '#f7f4ef';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-thick * 0.55, thick * 0.42);
  ctx.lineTo(-thick * 1.15, 0);
  ctx.lineTo(-thick * 0.55, -thick * 0.42);
  ctx.fill();
  ctx.fillStyle = pen.color;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(2.2, thick * 0.16), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  void sh;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawEraser(ctx, x, y, ang, cam, lift = 0) {
  const z = clamp(cam.zoom, 0.55, 1.35) * 1.65;
  ctx.save();
  ctx.translate(x, y - lift);
  ctx.rotate(ang);
  ctx.fillStyle = 'rgba(40,44,52,0.2)';
  ctx.beginPath();
  ctx.ellipse(10, lift + 22, 54 * z, 16 * z, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3d42';
  roundRect(ctx, -62 * z, -22 * z, 124 * z, 44 * z, 8 * z);
  ctx.fill();
  ctx.fillStyle = '#d97757';
  roundRect(ctx, -20 * z, -12 * z, 34 * z, 14 * z, 3 * z);
  ctx.fill();
  ctx.fillStyle = '#2a2d31';
  roundRect(ctx, -62 * z, 8 * z, 124 * z, 14 * z, 3 * z);
  ctx.fill();
  ctx.restore();
}

export function drawDiscMagnet(ctx, x, y, lift, tilt, cam) {
  const z = cam.zoom;
  const r = 108 * z;
  ctx.save();
  ctx.fillStyle = `rgba(40, 44, 52, ${0.22 * clamp(1 - lift / 280, 0.25, 1)})`;
  ctx.beginPath();
  ctx.ellipse(x + 10 * z, y + (14 + lift * 0.35) * z, r * (0.85 + lift / 400), r * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(x, y - lift * z);
  ctx.rotate(tilt);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#ffe6dc');
  g.addColorStop(0.45, '#e48868');
  g.addColorStop(1, '#b85a40');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1.5, 4 * z);
  ctx.beginPath();
  ctx.arc(-r * 0.15, -r * 0.2, r * 0.42, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();
}

export function eraseHead(tl, t, cam) {
  for (const er of tl.erases) {
    if (t < er.t0 - 0.45 || t > er.t1 + 0.45) continue;
    const u = clamp((t - er.t0) / (er.t1 - er.t0));
    const baked = er.path;
    const at = pointAlong(baked, clamp(u) * lenOf(baked));
    const [x, y] = worldToScreen(cam, at.p[0], at.p[1]);
    let lift = 0;
    let show = true;
    if (t < er.t0) {
      const k = (t - (er.t0 - 0.45)) / 0.45;
      lift = (1 - clamp(k)) * 70;
      show = k > 0;
    } else if (t > er.t1) {
      const k = (t - er.t1) / 0.45;
      lift = clamp(k) * 80;
      show = k < 1;
    }
    return { x, y, ang: Math.atan2(at.tang[1], at.tang[0]), lift, show };
  }
  return null;
}

export function boxToScreen(cam, box) {
  const corners = [
    [box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1],
  ].map(([x, y]) => worldToScreen(cam, x, y));
  const xs = corners.map(p => p[0]), ys = corners.map(p => p[1]);
  return {
    x0: Math.min(...xs), y0: Math.min(...ys),
    x1: Math.max(...xs), y1: Math.max(...ys),
  };
}

export function makeGhosts() {
  const rnd = mulberry(21);
  const out = [];
  const blocks = [
    [900, 480, 2300, 820],
    [1000, 1300, 2100, 2400],
    [4900, 1300, 6000, 2400],
    [3600, 1550, 4600, 1980],
  ];
  const inside = (x, y) => blocks.some(b => x > b[0] && x < b[2] && y > b[1] && y < b[3]);
  let guard = 0;
  while (out.length < 42 && guard < 400) {
    guard++;
    const x = 180 + rnd() * 7600;
    const y = 180 + rnd() * 4000;
    if (inside(x, y)) continue;
    const k = rnd();
    if (k < 0.45) {
      const x2 = x + (rnd() - 0.5) * 280, y2 = y + (rnd() - 0.5) * 90;
      out.push([[x, y], [x2, y2]]);
    } else if (k < 0.75) {
      out.push(oval(x, y, 30 + rnd() * 50, 18 + rnd() * 24, rnd() * 2, 0.4, 12));
    } else {
      out.push([[x, y], [x + 40 + rnd() * 70, y - 20 - rnd() * 40]]);
    }
  }
  return out;
}
