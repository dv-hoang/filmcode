// Ukiyo-e sheet: paper, blocks, bokashi, carved lines, cartouche, seal.
import { clamp, lerp, hash, mulberry } from '/core/lib.js';

export const W = 1920;
export const H = 1080;
export const PAPER = '#f3e6c8';
export const PAPER_RGB = [243, 230, 200];
export const SUMI = '#1c1915';
export const BLUE = '#1f4e79';
export const BLUE_DEEP = '#16324d';
export const BLUE_PALE = '#7ea0b8';
export const OCHRE = '#c4a15a';
export const OCHRE_DEEP = '#a68448';
export const GREEN = '#6e7d62';
export const GREEN_PALE = '#8d947c';
export const INDIGO = '#24344a';
export const BENI = '#9c2b2b';
export const MOUNT = '#cbb892';
export const CREAM = '#f6edd6';
export const KEY_GREY = '#6d675f';

export const SHEET = { l: 40, t: 30, r: 1880, b: 1050 };
export const INNER = { l: 68, t: 58, r: 1852, b: 1022 };

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function n1(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i * 1.37 + 2.2), hash((i + 1) * 1.37 + 2.2), u);
}

function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}

export function buildGrain() {
  const w = 960;
  const h = 540;
  const c = canvas(w, h);
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const warp = (n1(x * 0.018 + 1.7) - 0.5) * 0.45;
      const u = y * 0.075 + warp;
      const frac = u - Math.floor(u);
      const line = Math.abs(frac - 0.5) > 0.455;
      const band = Math.floor(u * 2) % 8 === 0;
      if (!line && !band) continue;
      const i = (y * w + x) * 4;
      d[i] = 40;
      d[i + 1] = 32;
      d[i + 2] = 22;
      d[i + 3] = line ? 110 : 22;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function buildBaren() {
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const rng = mulberry(11);
  g.strokeStyle = '#000';
  g.lineCap = 'round';
  g.filter = 'blur(1.6px)';
  for (let i = 0; i < 240; i++) {
    g.globalAlpha = 0.35 + rng() * 0.4;
    g.lineWidth = 1.2 + rng() * 2.2;
    g.beginPath();
    const cx = rng() * W;
    const cy = rng() * H;
    const rad = 24 + rng() * 200;
    const a0 = rng() * 6.2;
    g.arc(cx, cy, rad, a0, a0 + 0.35 + rng() * 1.3);
    g.stroke();
  }
  g.lineWidth = 1.1;
  for (let i = 0; i < 36; i++) {
    let x = rng() * W;
    let y = rng() * H;
    g.globalAlpha = 0.45;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      x += 12 + rng() * 18;
      y += (k % 2 === 0 ? -1 : 1) * (4 + rng() * 7);
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.filter = 'none';
  g.globalAlpha = 1;
  return c;
}

export function buildSpecks() {
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const rng = mulberry(19);
  g.fillStyle = '#000';
  for (let i = 0; i < 3200; i++) {
    g.globalAlpha = 0.45 + rng() * 0.55;
    const s = rng() < 0.92 ? 1.1 : 2;
    g.fillRect(rng() * W, rng() * H, s, s);
  }
  g.globalAlpha = 1;
  return c;
}

export function buildFibres() {
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const rng = mulberry(23);
  g.strokeStyle = '#f7f1e2';
  g.lineWidth = 0.7;
  for (let i = 0; i < 160; i++) {
    const x = rng() * W;
    const y = rng() * H;
    g.globalAlpha = 0.35 + rng() * 0.4;
    g.beginPath();
    g.moveTo(x, y);
    g.bezierCurveTo(x + 50, y + (rng() - 0.5) * 10, x + 110, y + (rng() - 0.5) * 8, x + 170, y + (rng() - 0.5) * 6);
    g.stroke();
  }
  g.globalAlpha = 1;
  return c;
}

let GRAIN = null;
let BAREN = null;
let SPECKS = null;
let FIBRES = null;
let PAPER_CANVAS = null;

export function buildTextures() {
  GRAIN = buildGrain();
  BAREN = buildBaren();
  SPECKS = buildSpecks();
  FIBRES = buildFibres();
  PAPER_CANVAS = canvas(W, H);
  paperSheet(PAPER_CANVAS.getContext('2d'));
}

export function drawPaper(ctx) {
  ctx.drawImage(PAPER_CANVAS, 0, 0);
}

export function textureDynamic(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.1;
  ctx.drawImage(GRAIN, 0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 0.16;
  ctx.drawImage(BAREN, 0, 0);
  ctx.globalAlpha = 0.16;
  ctx.drawImage(SPECKS, 0, 0);
  ctx.restore();
}

export function bake(draw, kind) {
  const c = canvas(W, H);
  const g = c.getContext('2d');
  draw(g);
  if (kind === 'key') {
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = 0.12;
    g.drawImage(SPECKS, 0, 0);
  } else {
    const sky = kind === 'sky' || kind === 'water';
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = sky ? 0.1 : 0.08;
    g.drawImage(GRAIN, 0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = sky ? 0.2 : 0.14;
    g.drawImage(BAREN, 0, 0);
    g.globalAlpha = 0.22;
    g.drawImage(SPECKS, 0, 0);
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  return c;
}

export function bokashi(g, top, bot, y0, y1, amp, seed) {
  const img = g.getImageData(0, 0, W, H);
  const d = img.data;
  const a = hex(top);
  const b = hex(bot);
  for (let x = 0; x < W; x++) {
    const wob = (n1(x * 0.011 + seed) - 0.5) * 2 * amp;
    const edge = y1 + wob;
    const yStart = Math.max(0, y0 | 0);
    const yEnd = Math.min(H, Math.ceil(edge));
    for (let y = yStart; y < yEnd; y++) {
      const u = clamp((y - y0) / (edge - y0));
      const i = (y * W + x) * 4;
      d[i] = lerp(a[0], b[0], u);
      d[i + 1] = lerp(a[1], b[1], u);
      d[i + 2] = lerp(a[2], b[2], u);
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

export function ribbon(ctx, pts, width, seed, taperEnds = true) {
  if (pts.length < 2) return;
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const r = pts[Math.max(0, i - 1)];
    let dx = q[0] - r[0];
    let dy = q[1] - r[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const nx = -dy;
    const ny = dx;
    let taper = 1;
    if (taperEnds) taper = Math.min(1, i / 2.2, (pts.length - 1 - i) / 2.2);
    const j = 1 + (n1(i * 0.33 + seed) - 0.5) * 0.62;
    const hw = width * 0.5 * Math.max(0, taper) * j;
    left.push([p[0] + nx * hw, p[1] + ny * hw]);
    right.push([p[0] - nx * hw, p[1] - ny * hw]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
}

export function drawFibres(ctx, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(FIBRES, 0, 0);
  ctx.restore();
}

export function drawSeal(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = BENI;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  const rng = mulberry(41);
  for (let i = 0; i < 9; i++) {
    const cx = (rng() - 0.5) * s * 0.95;
    const cy = (rng() < 0.5 ? -1 : 1) * (s * 0.46 - rng() * 3);
    ctx.fillRect(cx, cy, 2.5 + rng() * 5, 1.6 + rng() * 2.4);
  }
  ctx.fillRect(-s * 0.28, -s * 0.18, s * 0.56, s * 0.075);
  ctx.fillRect(-s * 0.28, s * 0.07, s * 0.56, s * 0.075);
  ctx.restore();
}

export function paperSheet(ctx) {
  const rng = mulberry(3);
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.fillRect(SHEET.l, SHEET.t, SHEET.r - SHEET.l, SHEET.b - SHEET.t);
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.045;
    ctx.fillStyle = rng() > 0.5 ? '#fbf6e9' : '#e6d5b4';
    ctx.beginPath();
    ctx.ellipse(SHEET.l + rng() * 1800, SHEET.t + rng() * 980, 70 + rng() * 200, 28 + rng() * 70, rng() * 3, 0, 6.3);
    ctx.fill();
  }
  ctx.globalAlpha = 0.18;
  const edge = ctx.createLinearGradient(SHEET.l, 0, SHEET.l + 28, 0);
  edge.addColorStop(0, 'rgba(150,110,60,0.45)');
  edge.addColorStop(1, 'rgba(150,110,60,0)');
  ctx.fillStyle = edge;
  ctx.fillRect(SHEET.l, SHEET.t, 28, SHEET.b - SHEET.t);
  const edgeR = ctx.createLinearGradient(SHEET.r - 26, 0, SHEET.r, 0);
  edgeR.addColorStop(0, 'rgba(150,110,60,0)');
  edgeR.addColorStop(1, 'rgba(150,110,60,0.4)');
  ctx.fillStyle = edgeR;
  ctx.fillRect(SHEET.r - 26, SHEET.t, 26, SHEET.b - SHEET.t);
  ctx.restore();
}

export function inkBorder(ctx) {
  const o = 14;
  ctx.save();
  ctx.strokeStyle = SUMI;
  ctx.lineWidth = 1.15;
  ctx.strokeRect(SHEET.l + o, SHEET.t + o, SHEET.r - SHEET.l - o * 2, SHEET.b - SHEET.t - o * 2);
  ctx.lineWidth = 3.3;
  ctx.strokeRect(INNER.l, INNER.t, INNER.r - INNER.l, INNER.b - INNER.t);
  ctx.restore();
}

export function clipInner(ctx) {
  ctx.beginPath();
  ctx.rect(INNER.l, INNER.t, INNER.r - INNER.l, INNER.b - INNER.t);
  ctx.clip();
}

export function revealClip(ctx, u) {
  const edge = -360 + clamp(u) * 2700;
  ctx.beginPath();
  ctx.moveTo(-40, -40);
  for (let y = -40; y <= H + 40; y += 14) {
    const n = (n1(y * 0.05 + 3) - 0.5) * 36;
    ctx.lineTo(edge + y * 0.22 + n, y);
  }
  ctx.lineTo(-40, H + 40);
  ctx.closePath();
  ctx.clip();
}

export function writeVertical(ctx, text, x, y, size, italic) {
  ctx.save();
  ctx.font = `${italic ? 'italic ' : ''}500 ${size}px 'Cormorant Garamond', serif`;
  ctx.fillStyle = SUMI;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let yy = y;
  for (const ch of text) {
    if (ch === ' ') {
      yy += size * 0.42;
      continue;
    }
    ctx.fillText(ch, x, yy);
    yy += size * 0.9;
  }
  ctx.restore();
  return yy;
}
