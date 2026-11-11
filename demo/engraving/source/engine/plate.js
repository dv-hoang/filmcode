// Laid sheet, plate mark, cut lettering, deckled subtitle slip, wash.
import { clamp, hash, seg, ss } from '/core/lib.js';
import { INK } from './ink.js';

export const PAPER = '#f1e8d2';
export const W = 1920;
export const H = 1080;

const FOX = [];
for (let i = 0; i < 36; i++) {
  FOX.push({
    x: hash(i * 3.1) * W,
    y: hash(i * 5.7 + 2) * H,
    r: 1.2 + hash(i * 9.3) * 4.5,
    a: 0.03 + hash(i * 1.7) * 0.05,
  });
}

export function drawSheet(ctx) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(-400, -400, W + 800, H + 800);
  ctx.strokeStyle = 'rgba(176, 154, 118, 0.28)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let y = -20; y < H + 40; y += 7) {
    ctx.moveTo(-40, y);
    ctx.lineTo(W + 40, y);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(166, 144, 108, 0.12)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let x = 70; x < W; x += 92) {
    ctx.moveTo(x, -20);
    ctx.lineTo(x, H + 20);
  }
  ctx.stroke();
  for (const f of FOX) {
    ctx.fillStyle = `rgba(150, 96, 48, ${f.a})`;
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, f.r, f.r * 0.72, hash(f.x) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPlateMark(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(120, 96, 62, 0.35)';
  ctx.lineWidth = 14;
  ctx.strokeRect(92, 58, 1736, 960);
  ctx.strokeStyle = 'rgba(255, 250, 236, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 1008);
  ctx.lineTo(100, 66);
  ctx.lineTo(1818, 66);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90, 70, 44, 0.45)';
  ctx.beginPath();
  ctx.moveTo(1816, 70);
  ctx.lineTo(1816, 1010);
  ctx.lineTo(104, 1010);
  ctx.stroke();
  ctx.restore();
}

function ruleProgress(ctx, x, y, w, h, p, width) {
  if (p <= 0) return;
  const per = 2 * (w + h);
  let L = per * clamp(p);
  const sides = [
    [x, y, x + w, y],
    [x + w, y, x + w, y + h],
    [x + w, y + h, x, y + h],
    [x, y + h, x, y],
  ];
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  for (const [x0, y0, x1, y1] of sides) {
    const sl = Math.hypot(x1 - x0, y1 - y0);
    if (L <= 0) break;
    const f = Math.min(1, L / sl);
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
    L -= sl;
  }
  ctx.stroke();
}

export function drawRules(ctx, t) {
  const p = seg(t, 7.6, 10.4);
  ruleProgress(ctx, 148, 104, 1624, 860, p, 1.35);
  ruleProgress(ctx, 156, 112, 1608, 844, seg(t, 8.3, 11.0), 0.55);
}

export function measureRoman(ctx, text, size, tracking, italic) {
  ctx.font = `${italic ? 'italic ' : ''}600 ${size}px "Cormorant Garamond", serif`;
  let w = 0;
  for (let i = 0; i < text.length; i++) w += ctx.measureText(text[i]).width + (i ? tracking : 0);
  return w;
}

export function drawRoman(ctx, text, x, y, size, tracking, t, t0, step, align, italic) {
  ctx.font = `${italic ? 'italic ' : ''}600 ${size}px "Cormorant Garamond", serif`;
  ctx.fillStyle = INK;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const widths = [];
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const w = ctx.measureText(text[i]).width;
    widths.push(w);
    total += w;
  }
  total += tracking * Math.max(0, text.length - 1);
  let cursor = x - (align === 'center' ? total / 2 : align === 'right' ? total : 0);
  for (let i = 0; i < text.length; i++) {
    if (t >= t0 + i * step && text[i] !== ' ') ctx.fillText(text[i], cursor, y);
    cursor += widths[i] + tracking;
  }
  return { w: total, h: size * 1.15 };
}

export function drawScript(ctx, text, x, y, size, t, t0, dur) {
  const p = ss(seg(t, t0, t0 + dur));
  if (p <= 0) return { w: 0, h: size };
  ctx.font = `italic 500 ${size}px "Cormorant Garamond", serif`;
  ctx.fillStyle = INK;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const w = ctx.measureText(text).width;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y - size, Math.max(1, w * p), size * 2);
  ctx.clip();
  ctx.fillText(text, x, y);
  ctx.restore();
  return { w, h: size * 1.2 };
}

export function drawSlip(ctx, text, t0, t1, t) {
  if (t < t0 || t > t1 + 0.28) return;
  const peel = seg(t, t1, t1 + 0.26);
  const press = 1 - seg(t, t0, t0 + 0.12) * 0.5;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = 'italic 500 32px "Cormorant Garamond", serif';
  const tw = ctx.measureText(text).width;
  const w = Math.max(420, tw + 96);
  const h = 64;
  const x = (W - w) / 2;
  const y = 1006 + (1 - ss(seg(t, t0, t0 + 0.14))) * 10 * press;
  ctx.beginPath();
  ctx.rect(x - 8, y - 8, (w + 16) * (1 - peel), h + 16);
  ctx.clip();
  deckle(ctx, x, y, w, h, 4);
  ctx.fillStyle = '#f7f1e2';
  ctx.fill();
  ctx.strokeStyle = 'rgba(80, 60, 36, 0.35)';
  ctx.lineWidth = 1;
  deckle(ctx, x, y, w, h, 4);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function deckle(ctx, x, y, w, h, seed) {
  const n = 26;
  const j = (i) => (hash(seed * 17 + i * 2.3) - 0.5) * 7;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) ctx.lineTo(x + (w * i) / n, y + j(i));
  for (let i = 0; i <= 10; i++) ctx.lineTo(x + w + j(100 + i), y + (h * i) / 10);
  for (let i = n; i >= 0; i--) ctx.lineTo(x + (w * i) / n, y + h + j(200 + i));
  for (let i = 10; i >= 0; i--) ctx.lineTo(x + j(300 + i), y + (h * i) / 10);
  ctx.closePath();
}

export function bloomPath(ctx, cx, cy, R, seed) {
  const n = 40;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const jag = 0.9 + 0.07 * Math.sin(a * 5 + seed) + 0.04 * Math.sin(a * 11 + seed * 1.7);
    const x = cx + Math.cos(a) * R * jag;
    const y = cy + Math.sin(a) * R * jag;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawWash(ctx, cx, cy, R, p, seed) {
  if (p <= 0.01) return;
  const radius = R * (0.15 + 0.85 * ss(p)) + 3.5;
  ctx.save();
  ctx.translate(3.2, 2.4);
  bloomPath(ctx, cx, cy, radius, seed);
  ctx.clip();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(176, 86, 32, 0.62)';
  ctx.fillRect(cx - radius - 8, cy - radius - 8, radius * 2 + 16, radius * 2 + 16);
  ctx.fillStyle = 'rgba(140, 62, 22, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy + 2, radius * 0.45, radius * 0.38, 0.2, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 10; i++) {
    const a = hash(seed + i) * Math.PI * 2;
    const rr = hash(seed + i + 4) * radius * 0.8;
    ctx.fillStyle = 'rgba(110, 48, 16, 0.22)';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.6 + hash(i + 8) * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.translate(3.2, 2.4);
  ctx.globalCompositeOperation = 'multiply';
  bloomPath(ctx, cx, cy, radius, seed);
  ctx.strokeStyle = 'rgba(92, 36, 14, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();
}

export function roundelFrame(ctx, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(28, 21, 16, 0.55)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let y = -r; y <= r; y += 4.2) {
    ctx.moveTo(-r, y);
    ctx.lineTo(r, y);
  }
  ctx.stroke();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, r - 7, 0, Math.PI * 2);
  ctx.stroke();
}
