// Paper-cut pieces: flat dye, hand-cut wobble, grain, holes, inset slits, rims.
import { mulberry } from '/core/lib.js';

export const W = 1920;
export const H = 1080;

const RED = '#d2201f';
const NEAR = '#e23a32';
const FAR = '#a31a22';
const BACK = '#e4584c';

export const INK = {
  red: RED,
  near: NEAR,
  far: FAR,
  back: BACK,
  deep: '#8e1520',
  stack: '#b01820',
  banner: '#6e0e18',
  cream: '#f6ecd4',
  gold: '#d4a24a',
  foil: '#f0d48a',
  goldDeep: '#a67c32',
  blade: '#1a1e2c',
  sky: '#243656',
  farBank: '#31456f',
  water: '#1b2948',
  table: '#162033',
  nearBank: '#1e2c4a',
};

let grain = null;
let scratch = null;
let sctx = null;

export function initPaper() {
  grain = document.createElement('canvas');
  grain.width = 512;
  grain.height = 512;
  const g = grain.getContext('2d');
  const img = g.createImageData(512, 512);
  const rnd = mulberry(11);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 128 + (rnd() - 0.5) * 42;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);

  scratch = document.createElement('canvas');
  scratch.width = W;
  scratch.height = H;
  sctx = scratch.getContext('2d');
}

export function wobble(pts, seed, amp = 1.25) {
  const rnd = mulberry(seed);
  return pts.map((p) => {
    const a = rnd() * Math.PI * 2;
    const m = amp * (0.35 + rnd() * 0.65);
    return [p[0] + Math.cos(a) * m, p[1] + Math.sin(a) * m];
  });
}

export function ellipsePts(cx, cy, rx, ry, n = 22) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

export function crescentPts(cx, cy, r, thick, a0, a1, n = 16) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  const ri = Math.max(1, r - thick);
  for (let i = n; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + Math.cos(a) * ri, cy + Math.sin(a) * ri]);
  }
  return pts;
}

export function limbPts(x0, y0, x1, y1, w0, w1) {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);
  return [
    [x0 + px * w0 * 0.5, y0 + py * w0 * 0.5],
    [x1 + px * w1 * 0.5, y1 + py * w1 * 0.5],
    [x1 - px * w1 * 0.5, y1 - py * w1 * 0.5],
    [x0 - px * w0 * 0.5, y0 - py * w0 * 0.5],
  ];
}

export function insetPts(pts, d) {
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    cx += p[0];
    cy += p[1];
  }
  cx /= pts.length;
  cy /= pts.length;
  return pts.map(([x, y]) => {
    const dx = cx - x;
    const dy = cy - y;
    const len = Math.hypot(dx, dy) || 1;
    const m = Math.min(d, len * 0.45);
    return [x + (dx / len) * m, y + (dy / len) * m];
  });
}

function trace(ctx, pts, close = true) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
}

function tileGrain(ctx) {
  for (let y = -400; y < 1600; y += 512) {
    for (let x = -400; x < 2400; x += 512) ctx.drawImage(grain, x, y);
  }
}

// Draw one cut piece onto the main context. Holes are punched on a scratch
// canvas so they reveal whatever is already behind the piece, not the void.
export function drawPiece(ctx, spec) {
  const pts = spec.pts;
  if (!pts || pts.length < 3) return;
  const m = ctx.getTransform();
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.clearRect(0, 0, W, H);
  sctx.save();
  sctx.setTransform(m);
  if (spec.shadow !== false) {
    sctx.shadowColor = 'rgba(24,6,12,0.42)';
    sctx.shadowBlur = spec.blur ?? 7;
    sctx.shadowOffsetX = 3.2;
    sctx.shadowOffsetY = 4.4;
  }
  sctx.fillStyle = spec.fill || RED;
  trace(sctx, pts);
  sctx.fill();
  sctx.shadowColor = 'transparent';
  sctx.shadowBlur = 0;
  sctx.save();
  trace(sctx, pts);
  sctx.clip();
  sctx.globalCompositeOperation = 'soft-light';
  sctx.globalAlpha = 0.88;
  tileGrain(sctx);
  sctx.restore();
  sctx.save();
  trace(sctx, pts);
  sctx.clip();
  sctx.lineWidth = 1.15;
  sctx.lineJoin = 'round';
  sctx.strokeStyle = 'rgba(255,228,210,0.50)';
  sctx.translate(-0.75, -0.75);
  trace(sctx, pts);
  sctx.stroke();
  sctx.translate(1.55, 1.55);
  sctx.strokeStyle = 'rgba(50,6,10,0.55)';
  trace(sctx, pts);
  sctx.stroke();
  sctx.restore();
  sctx.globalCompositeOperation = 'destination-out';
  sctx.fillStyle = '#000';
  for (const h of spec.holes || []) {
    if (!h || h.length < 3) continue;
    trace(sctx, h);
    sctx.fill();
  }
  if (spec.inset !== false) {
    sctx.lineWidth = spec.slit ?? 2.15;
    sctx.lineCap = 'round';
    sctx.lineJoin = 'round';
    trace(sctx, insetPts(pts, spec.insetD ?? 5.5));
    sctx.stroke();
  }
  sctx.restore();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(scratch, 0, 0);
  ctx.restore();
}

export function fillPaper(ctx, pts, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  trace(ctx, pts);
  ctx.fill();
  ctx.save();
  trace(ctx, pts);
  ctx.clip();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.8;
  tileGrain(ctx);
  ctx.restore();
  ctx.restore();
}
