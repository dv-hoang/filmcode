const W = 1920, H = 1080;
const PAGE = '#f2f0ea', INK = '#141414', SIGNAL = '#e30613', GREY = '#b8b5ae', LIGHT = '#d8d6d0';
const M = 96, GUT = 24, COLW = 122;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const pr = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const snap = (t, arrive, dur = 0.28) => ease((t - arrive + dur) / dur);
const colX = i => M + i * (COLW + GUT);
const rowY = i => 96 + i * 96;

const bars = [
  { col: 6, h: 120 }, { col: 7, h: 260 }, { col: 8, h: 180 },
  { col: 9, h: 360 }, { col: 10, h: 240 }, { col: 11, h: 150 },
];

function font(size, weight) {
  ctx.font = `${weight} ${size}px Archivo, Arial, sans-serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = size >= 70 ? '-2px' : '0px';
}
function measure(str, size, weight) { font(size, weight); return ctx.measureText(str).width; }
function textAt(str, x, y, size, weight, color, reveal = 1, maxWidth) {
  font(size, weight);
  let w = ctx.measureText(str).width;
  if (maxWidth && w > maxWidth) { size *= maxWidth / w; font(size, weight); w = maxWidth; }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 4, y - size * 0.98, w * reveal + 8, size * 1.22);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}
function rule(x1, y1, x2, y2, color, width = 1, draw = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (x2 - x1) * draw, y1 + (y2 - y1) * draw); ctx.stroke();
}

function grid(t) {
  const dotX = 680, dotY = 456;
  for (let i = 0; i <= 12; i++) {
    const p = ease(pr(t, 0.6 + i * 0.025, 1.45 + i * 0.025));
    if (p <= 0) continue;
    const x = colX(i);
    rule(x, dotY - (dotY - 96) * p, x, dotY + (984 - dotY) * p, LIGHT, 1);
  }
  for (let j = 0; j < 10; j++) {
    const p = ease(pr(t, 0.65 + j * 0.03, 1.5 + j * 0.03));
    if (p <= 0) continue;
    const y = rowY(j);
    rule(dotX - (dotX - 96) * p, y, dotX + (1824 - dotX) * p, y, LIGHT, 1);
  }
}

function dot(t) {
  const p = ease(pr(t, 0.3, 0.7));
  const m = ease(pr(t, 4.8, 7.2));
  const x = 680 + (1400 - 680) * m;
  const y = 456 + (360 - 456) * m;
  const r = 17 * p;
  ctx.fillStyle = SIGNAL;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  if (t > 4.8) {
    font(15, 500);
    ctx.fillStyle = INK;
    ctx.fillText(`x ${Math.round(x)}  y ${Math.round(y)}`, x + 30, y + 32);
    if (t > 5.6) textAt('OFF GRID', x + 30, y + 56, 18, 700, INK, pr(t, 5.6, 5.9));
  }
}

function barsDraw(t) {
  bars.forEach((b, i) => {
    const arrive = 2.0 + i * 0.5;
    const p = snap(t, arrive);
    if (p <= 0) return;
    let h = b.h * p;
    if (i === 3 && t > 7.15) h *= 1 - ease(pr(t, 7.15, 7.6));
    if (h < 1) return;
    const dx = i >= 2 && i < 5 ? 24 * ease(pr(t, 5.5 + i * 0.06, 6.0 + i * 0.06)) : 0;
    const x = colX(b.col) + dx;
    ctx.fillStyle = i === 1 ? GREY : INK;
    ctx.fillRect(Math.round(x), Math.round(860 - h), COLW + 1, Math.ceil(h) + 1);
  });
  if (t > 6.9 && t < 7.65) {
    const b = bars[3], dx = 24, x = colX(b.col) + dx;
    const cut = ease(pr(t, 6.9, 7.05));
    rule(x - 18, 560, x + COLW + 18, 560, INK, 2, cut);
  }
}

function notes(t) {
  const a = pr(t, 2.0, 2.35);
  if (a <= 0) return;
  rule(1264, 170, 1824, 170, INK, 1, a);
  textAt('MODULE 122 × 24 PX', 1264, 208, 18, 500, INK, a);
  textAt('12 COLUMNS · 11 GUTTERS', 1264, 234, 18, 500, GREY, a);
  textAt('ONE SIGNAL ELEMENT', 1264, 260, 18, 500, GREY, a);
  textAt('SYSTEM / 01', 96, 132, 18, 500, INK, pr(t, 0.4, 0.7));
  rule(96, 148, 1824, 148, INK, 1, pr(t, 0.4, 0.8));
}

function draw(t) {
  ctx.fillStyle = PAGE; ctx.fillRect(0, 0, W, H);
  grid(t);
  notes(t);

  textAt('12', 96, 430, 360, 700, INK, ease(pr(t, 1.0, 1.8)), 620);
  textAt('COLUMNS', 100, 482, 18, 700, INK, pr(t, 1.4, 1.7));
  textAt('24 PX BASELINE', 100, 506, 18, 500, GREY, pr(t, 1.5, 1.8));

  textAt('THE GRID SYSTEM', 96, 880, 78, 700, INK, ease(pr(t, 1.7, 2.5)), 820);
  rule(96, 904, 760, 904, INK, 2, ease(pr(t, 1.6, 2.2)));
  if (t < 7.9) textAt('A SYSTEM APPLIED TO ONE PAGE', 96, 940, 19, 500, GREY, pr(t, 2.1, 2.4));
  else textAt('ONE SYSTEM. MANY PAGES.', 96, 940, 22, 700, INK, ease(pr(t, 8.0, 8.5)));
  if (t > 7.0 && t < 9.0) textAt('ONE RULE REMOVED', 96, 970, 17, 500, GREY, pr(t, 7.1, 7.4));

  barsDraw(t);
  dot(t);
}

window.DUR = 10;
window.render = draw;
document.fonts.ready.then(async () => {
  try {
    await Promise.all([
      document.fonts.load('400 20px Archivo'),
      document.fonts.load('500 20px Archivo'),
      document.fonts.load('700 20px Archivo'),
    ]);
  } catch (e) {}
  window.READY = true;
});
