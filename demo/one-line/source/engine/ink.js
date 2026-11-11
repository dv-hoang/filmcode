// Filled ink ribbon: pressure, bleed, pooling, dry brush, one gold stretch, teardrop blot.
import { hash } from '/core/lib.js';
import { prefix } from './geom.js';
import { worldToScreen } from './cam.js';

const PAPER = [244, 239, 228];
const INK = [29, 26, 23];
const GOLD = [169, 120, 44];
const Z_MIN = 1.3;

function mix(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function rgb(c) {
  const q = (v) => Math.round(v / 10) * 10;
  return `rgb(${q(c[0])},${q(c[1])},${q(c[2])})`;
}

function tone(p) {
  const ink = mix(INK, GOLD, p.accent || 0);
  const t = (p.alpha || 0.95) * (0.94 + 0.06 * hash((p.s || 0) * 2.3));
  return mix(PAPER, ink, t);
}

function screenW(p, zoom) {
  return Math.max(1.6, (p.w || 2.4) * Math.max(zoom, Z_MIN));
}

let bleedCanvas = null;
let bleedCtx = null;

function bleedLayer() {
  if (!bleedCanvas) {
    bleedCanvas = document.createElement('canvas');
    bleedCanvas.width = 1920;
    bleedCanvas.height = 1080;
    bleedCtx = bleedCanvas.getContext('2d');
  }
  bleedCtx.setTransform(1, 0, 0, 1, 0, 0);
  bleedCtx.clearRect(0, 0, 1920, 1080);
  return bleedCtx;
}

function quad(ctx, ax, ay, bx, by, cx, cy, dx, dy) {
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.lineTo(dx, dy);
  ctx.closePath();
}

function side(p, cam, zoom, sign, extra) {
  const w = screenW(p, zoom) * extra;
  const [sx, sy] = worldToScreen(p.ix, p.iy, cam);
  const c = Math.cos(cam.roll);
  const s = Math.sin(cam.roll);
  const nx = c * p.nx - s * p.ny;
  const ny = s * p.nx + c * p.ny;
  return [sx + nx * sign * w * 0.5, sy + ny * sign * w * 0.5];
}

function addSeg(ctx, a, b, cam, zoom, extra) {
  const [lx0, ly0] = side(a, cam, zoom, 1, extra);
  const [rx0, ry0] = side(a, cam, zoom, -1, extra);
  const [lx1, ly1] = side(b, cam, zoom, 1, extra);
  const [rx1, ry1] = side(b, cam, zoom, -1, extra);
  quad(ctx, lx0, ly0, lx1, ly1, rx1, ry1, rx0, ry0);
}

function bristles(ctx, a, b, cam, zoom) {
  for (const k of [-0.32, 0, 0.32]) {
    if (hash((a.s || 0) * 5.1 + k * 9) < 0.12) continue;
    const shift = (p, sign) => {
      const w = screenW(p, zoom);
      const [sx, sy] = worldToScreen(p.ix, p.iy, cam);
      const c = Math.cos(cam.roll);
      const s = Math.sin(cam.roll);
      const nx = c * p.nx - s * p.ny;
      const ny = s * p.nx + c * p.ny;
      const o = k * w;
      return [sx + nx * (o + sign * w * 0.13), sy + ny * (o + sign * w * 0.13)];
    };
    const [ax, ay] = shift(a, 1);
    const [bx, by] = shift(a, -1);
    const [cx, cy] = shift(b, -1);
    const [dx, dy] = shift(b, 1);
    quad(ctx, ax, ay, dx, dy, cx, cy, bx, by);
  }
}

function drawRuns(ctx, pts, cam, zoom, extra, bleed) {
  const groups = new Map();
  const order = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (Math.hypot((b.ix ?? b.x) - (a.ix ?? a.x), (b.iy ?? b.y) - (a.iy ?? a.y)) < 0.05) continue;
    const gap = !bleed && a.gap && b.gap;
    const col = bleed
      ? (a.accent > 0.45 ? 'rgb(150,100,40)' : 'rgb(40,34,28)')
      : rgb(tone(a));
    const key = (gap ? 'g:' : 's:') + col;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key).push([a, b, gap]);
  }
  for (const key of order) {
    ctx.beginPath();
    ctx.fillStyle = key.slice(2);
    for (const [a, b, gap] of groups.get(key)) {
      if (gap) bristles(ctx, a, b, cam, zoom);
      else addSeg(ctx, a, b, cam, zoom, extra);
    }
    ctx.fill();
  }
  if (pts.length) {
    const tip = pts[pts.length - 1];
    const [sx, sy] = worldToScreen(tip.ix ?? tip.x, tip.iy ?? tip.y, cam);
    ctx.beginPath();
    ctx.fillStyle = bleed ? 'rgb(40,34,28)' : rgb(tone(tip));
    ctx.arc(sx, sy, screenW(tip, zoom) * extra * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function pooling(ctx, pts, cam, zoom) {
  let lastS = -100;
  for (let i = 2; i < pts.length - 2; i++) {
    const p = pts[i];
    if (p.v > 42) continue;
    if (p.s - lastS < 16) continue;
    if (p.v > pts[i - 1].v || p.v > pts[i + 1].v) continue;
    if (Math.hypot(p.x - 420, p.y - 170) < 18 && p.t >= 13.5) continue;
    lastS = p.s;
    const [sx, sy] = worldToScreen(p.ix, p.iy, cam);
    ctx.beginPath();
    ctx.fillStyle = rgb(tone(p));
    ctx.arc(sx, sy, screenW(p, zoom) * 0.62, 0, Math.PI * 2);
    ctx.fill();
  }
}

function blot(ctx, cam, zoom, t, hold) {
  if (t < hold.t0) return;
  const grow = Math.min(1, (t - hold.t0) / 0.5);
  const [sx, sy] = worldToScreen(hold.x, hold.y, cam);
  const sc = Math.max(zoom, Z_MIN);
  const rx = 5.2 * grow * sc;
  const drop = 11 * grow * sc;
  const ry = 8.5 * grow * sc;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx - rx, sy + drop * 0.25, sx - rx * 1.2, sy + drop + ry * 0.15, sx, sy + drop + ry);
    ctx.bezierCurveTo(sx + rx * 1.2, sy + drop + ry * 0.15, sx + rx, sy + drop * 0.25, sx, sy);
    ctx.closePath();
  };
  ctx.save();
  path();
  ctx.fillStyle = 'rgb(18,15,12)';
  ctx.fill();
  ctx.translate(0, -1.4 * sc);
  path();
  ctx.fillStyle = 'rgb(29,26,23)';
  ctx.fill();
  ctx.restore();
}

export function drawInk(main, path, t, cam, hold) {
  const pts = prefix(path, t);
  const zoom = cam.zoom;
  const b = bleedLayer();
  drawRuns(b, pts, cam, zoom, 1.58, true);
  main.save();
  main.filter = `blur(${Math.max(0.5, 0.9 * Math.min(zoom, 2.4))}px)`;
  main.globalAlpha = 0.2;
  main.drawImage(bleedCanvas, 0, 0);
  main.filter = 'none';
  main.restore();
  drawRuns(main, pts, cam, zoom, 1, false);
  pooling(main, pts, cam, zoom);
  if (hold) blot(main, cam, zoom, t, hold);
}
