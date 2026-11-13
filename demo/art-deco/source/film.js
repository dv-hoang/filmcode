import { clamp, lerp, seg, ss, eio, eo, hash, TAU } from '/core/lib.js';

const W = 1920, H = 1080, CX = W / 2;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

window.DUR = 16;

const C = {
  black: '#0b090a',
  lacquer: '#120d0d',
  ivory: '#f3ead6',
  ivoryDim: 'rgba(243,234,214,0.62)',
  gold: '#c79a3e',
  goldHot: '#f6e2a8',
  coral: '#e2604a',
  coralHot: '#ff9d7e',
  coralDeep: '#8e2b22',
  emerald: '#123028',
};

let TEXTS = [];

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function goldGrad(x0, y0, x1, y1, sheen = 0) {
  if (Math.abs(x1 - x0) + Math.abs(y1 - y0) < 0.01) x1 = x0 + 1;
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const s = sheen * 0.18;
  const stops = [
    [0, '#6a4714'],
    [clamp(0.22 + s), '#c29238'],
    [clamp(0.46 + s), '#ffeec0'],
    [clamp(0.60 + s), '#e6bc63'],
    [1, '#7a5320'],
  ];
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function gline(x1, y1, x2, y2, w = 3, o = {}) {
  const { alpha = 1, sheen = 0, draw = 1, glow = 0, off = 0.9, dark = true } = o;
  if (draw <= 0 || alpha <= 0) return;
  const x2p = x1 + (x2 - x1) * draw, y2p = y1 + (y2 - y1) * draw;
  const dx = x2p - x1, dy = y2p - y1, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len * off, ny = dx / len * off;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'butt';
  if (dark) {
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = w + 3.2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2p, y2p); ctx.stroke();
  }
  if (glow) { ctx.shadowColor = 'rgba(246,226,168,0.6)'; ctx.shadowBlur = glow; }
  ctx.strokeStyle = goldGrad(x1, y1, x2p === x1 ? x1 + 1 : x2p, y2p === y1 ? y1 + 1 : y2p, sheen);
  ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2p, y2p); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,247,224,0.9)';
  ctx.lineWidth = Math.max(0.7, w * 0.26);
  ctx.beginPath(); ctx.moveTo(x1 + nx, y1 + ny); ctx.lineTo(x2p + nx, y2p + ny); ctx.stroke();
  ctx.restore();
}

function drawText(str, x, y, family, size, color, o = {}) {
  const {
    align = 'left', ls = 0, reveal = 1, alpha = 1, maxW = 0,
    pass = false, id = str, revealFrom = 'left',
  } = o;
  if (alpha <= 0.004 || reveal <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  let fs = size;
  ctx.font = `400 ${fs}px "${family}", serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${ls}px`;
  let w = ctx.measureText(str).width;
  if (maxW && w > maxW) {
    fs *= maxW / w;
    ctx.font = `400 ${fs}px "${family}", serif`;
    w = ctx.measureText(str).width;
  }
  const x0 = align === 'center' ? x - w / 2 : x;
  if (reveal < 1) {
    const rw = (w + 6) * reveal;
    const cx = revealFrom === 'center' ? x0 + w / 2 : x0;
    ctx.beginPath();
    ctx.rect(cx - rw / 2, y - fs * 0.95, rw, fs * 1.9);
    ctx.clip();
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  TEXTS.push({
    id, text: str, pass,
    x0: x0 - 2, y0: y - fs * 0.62, x1: x0 + w + 2, y1: y + fs * 0.62,
  });
}

function bg(glowY = 430, glowAmt = 0.18) {
  ctx.fillStyle = '#140c0c';
  ctx.fillRect(0, 0, W, H);
  const top = ctx.createRadialGradient(CX, 120, 40, CX, 120, 900);
  top.addColorStop(0, 'rgba(120,66,26,0.16)');
  top.addColorStop(1, 'rgba(120,66,26,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, H);
  const warm = ctx.createRadialGradient(CX, glowY, 20, CX, glowY, 1000);
  warm.addColorStop(0, `rgba(150,86,34,${glowAmt})`);
  warm.addColorStop(0.55, `rgba(110,58,24,${glowAmt * 0.5})`);
  warm.addColorStop(1, 'rgba(70,36,16,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, H, 0, H - 620);
  g.addColorStop(0, 'rgba(22,58,48,0.38)');
  g.addColorStop(1, 'rgba(22,58,48,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, H - 620, W, 620);
}

function vignette(strength = 0.55) {
  const g = ctx.createRadialGradient(CX, 540, 280, CX, 540, 1200);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function sunburst(cx, cy, r0, r1, n, p, alpha = 1, rot = 0) {
  if (p <= 0 || alpha <= 0) return;
  const R0 = r0, R1 = r0 + (r1 - r0) * p;
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(cx, cy, R0, cx, cy, Math.max(R1, R0 + 1));
  g.addColorStop(0, 'rgba(246,226,168,0.24)');
  g.addColorStop(1, 'rgba(246,226,168,0.025)');
  ctx.fillStyle = g;
  for (let i = 0; i < n; i++) {
    const a0 = rot + i * TAU / n, a1 = a0 + Math.PI / n;
    ctx.beginPath();
    ctx.arc(cx, cy, R1, a0, a1);
    ctx.arc(cx, cy, R0, a1, a0, true);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(226,188,110,0.22)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < n; i++) {
    const a = rot + i * TAU / n;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0);
    ctx.lineTo(cx + Math.cos(a) * R1, cy + Math.sin(a) * R1);
    ctx.stroke();
  }
  ctx.restore();
}

function plaque(cx, cy, w, h, o = {}) {
  const { fill = 'rgba(14,10,10,0.94)', sheen = 0, glow = 0, step = 20, lw = 2.6 } = o;
  if (w <= 2) return;
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const s = Math.min(step, h / 3);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0 + s); ctx.lineTo(x0 + s, y0 + s); ctx.lineTo(x0 + s, y0);
  ctx.lineTo(x1 - s, y0); ctx.lineTo(x1 - s, y0 + s); ctx.lineTo(x1, y0 + s);
  ctx.lineTo(x1, y1 - s); ctx.lineTo(x1 - s, y1 - s); ctx.lineTo(x1 - s, y1);
  ctx.lineTo(x0 + s, y1); ctx.lineTo(x0 + s, y1 - s); ctx.lineTo(x0, y1 - s);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (glow) { ctx.shadowColor = 'rgba(246,226,168,0.5)'; ctx.shadowBlur = glow; }
  ctx.strokeStyle = goldGrad(x0, y0, x1, y1, sheen);
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(x0 + 5, y0 + s + 3); ctx.lineTo(x0 + s + 3, y0 + 5);
  ctx.moveTo(x1 - 5, y0 + s + 3); ctx.lineTo(x1 - s - 3, y0 + 5);
  ctx.moveTo(x0 + 5, y1 - s - 3); ctx.lineTo(x0 + s + 3, y1 - 5);
  ctx.moveTo(x1 - 5, y1 - s - 3); ctx.lineTo(x1 - s - 3, y1 - 5);
  ctx.strokeStyle = 'rgba(255,247,224,0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function sheenSweep(x, y, w, h, p) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const sx = x - w * 0.4 + (w * 1.8) * p;
  const g = ctx.createLinearGradient(sx - 120, y, sx + 120, y);
  g.addColorStop(0, 'rgba(255,250,235,0)');
  g.addColorStop(0.5, 'rgba(255,250,235,0.55)');
  g.addColorStop(1, 'rgba(255,250,235,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/* ——— S1: title ——————————————————————————————————————— */

function sceneTitle(t) {
  bg();
  const hz = ctx.createLinearGradient(0, H, 0, H - 520);
  hz.addColorStop(0, 'rgba(18,48,40,0.6)');
  hz.addColorStop(1, 'rgba(18,48,40,0)');
  ctx.fillStyle = hz;
  ctx.fillRect(0, H - 520, W, 520);

  const burst = eio(seg(t, 0.6, 1.85));
  sunburst(CX, 520, 34, 560, 36, burst, 0.95, t * 0.012);
  sunburst(CX, 520, 20, 300, 18, burst, 0.7, -t * 0.01 + 0.08);

  gline(CX, 0, CX, H, 2.6, { draw: eio(seg(t, 0.15, 1.05)), glow: 9 });

  const dia = eio(seg(t, 0.9, 1.3));
  if (dia > 0) {
    ctx.save();
    ctx.translate(CX, 520);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = goldGrad(-18, -18, 18, 18);
    ctx.lineWidth = 2;
    ctx.strokeRect(-18 * dia, -18 * dia, 36 * dia, 36 * dia);
    ctx.restore();
  }

  const barP = eio(seg(t, 1.1, 1.72));
  if (barP > 0) {
    const glow = ctx.createRadialGradient(CX, 545, 40, CX, 545, 760);
    glow.addColorStop(0, 'rgba(255,214,140,0.16)');
    glow.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 100, W, 900);

    for (let i = 3; i >= 1; i--) {
      const w = (1200 + i * 90) * barP;
      const h = 176 - i * 34;
      plaque(CX, 545, w, h, { step: 14, lw: 1.2, fill: 'rgba(10,7,8,0.7)' });
    }
    plaque(CX, 545, 1200 * barP, 176, { glow: 14, sheen: (t - 2.2) * 0.4 });
    sheenSweep(CX - 600, 457, 1200, 176, seg(t, 2.2, 2.7));
  }

  drawText('NIGHT ELEVATOR', CX, 550, 'Limelight', 96, C.ivory, {
    align: 'center', reveal: eio(seg(t, 0.88, 1.55)), revealFrom: 'center',
    maxW: 1080, id: 'title-open',
  });
  drawText('ART DECO', CX, 430, 'Poiret One', 30, C.goldHot, {
    align: 'center', ls: 14, alpha: 0.9,
    reveal: eio(seg(t, 1.28, 1.6)), revealFrom: 'center', id: 'kicker-open',
  });
  drawText('·', CX, 672, 'Poiret One', 40, C.gold, {
    align: 'center', alpha: eio(seg(t, 1.6, 1.9)), id: 'dot-open',
  });

  vignette(0.6);
}

/* ——— S2: lobby ——————————————————————————————————————— */

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function cabInterior(x0, y0, w, h, t) {
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, '#2a0f0c');
  g.addColorStop(0.4, '#8c3423');
  g.addColorStop(0.66, '#d05a3c');
  g.addColorStop(1, '#38130f');
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, w, h);

  const ax = CX, ay = y0 + h * 0.5, aw = w * 0.5, ah = h * 0.6;
  ctx.beginPath();
  ctx.moveTo(ax - aw / 2, ay + ah / 2);
  ctx.lineTo(ax - aw / 2, ay - ah * 0.12);
  ctx.quadraticCurveTo(ax, ay - ah * 0.66, ax + aw / 2, ay - ah * 0.12);
  ctx.lineTo(ax + aw / 2, ay + ah / 2);
  ctx.closePath();
  const mg = ctx.createLinearGradient(0, ay - ah / 2, 0, ay + ah / 2);
  mg.addColorStop(0, 'rgba(255,196,156,0.35)');
  mg.addColorStop(1, 'rgba(90,20,15,0.28)');
  ctx.fillStyle = mg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(246,226,168,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  gline(x0 + 34, y0 + h * 0.74, x0 + w - 34, y0 + h * 0.74, 4, { alpha: 0.85, glow: 5 });
  gline(x0 + 34, y0 + h * 0.8, x0 + w - 34, y0 + h * 0.8, 1.4, { alpha: 0.5 });

  const glow = ctx.createRadialGradient(CX, y0 + h * 0.52, 12, CX, y0 + h * 0.52, w * 0.85);
  glow.addColorStop(0, 'rgba(255,150,110,0.55)');
  glow.addColorStop(1, 'rgba(255,150,110,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x0, y0, w, h);

  const pulse = 0.9 + 0.1 * Math.sin(t * 3.1);
  ctx.globalAlpha = 0.5 * pulse;
  ctx.fillStyle = C.coralHot;
  ctx.beginPath();
  ctx.arc(CX, y0 + 46, 8, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function doorLeaf(x, y, w, h, side, sheen) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#241816');
  g.addColorStop(0.32, '#170f0e');
  g.addColorStop(0.62, '#1e1311');
  g.addColorStop(1, '#0c0808');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();

  const px = x + 26, py = y + 30, pw = w - 52, ph = h - 62;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(226,188,110,0.62)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(255,247,224,0.28)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(px + 5, py + 5, pw - 10, ph - 10);

  const ax = x + w / 2, ay = py + ph * 0.1, aw = pw * 0.52, ah = ph * 0.34;
  for (let i = 0; i < 3; i++) {
    const s = 1 - i * 0.16;
    ctx.strokeStyle = i === 0 ? 'rgba(255,247,224,0.55)' : 'rgba(226,188,110,0.4)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(ax - aw * s / 2, ay + ah);
    ctx.lineTo(ax - aw * s / 2, ay + ah * 0.42);
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax + aw * s / 2, ay + ah * 0.42);
    ctx.lineTo(ax + aw * s / 2, ay + ah);
    ctx.stroke();
  }

  gline(px + 12, py + ph * 0.54, px + pw - 12, py + ph * 0.54, 1.4, { alpha: 0.6, sheen, off: 0.4 });
  gline(px + 12, py + ph * 0.585, px + pw - 12, py + ph * 0.585, 1, { alpha: 0.4, off: 0.3 });

  const seam = side < 0 ? x + w - 16 : x + 16;
  for (let i = 0; i < 4; i++) {
    const sx = seam + (side < 0 ? -i * 10 : i * 10);
    gline(sx, py + ph * 0.66, sx, py + ph * 0.92, 1, { alpha: 0.34, off: 0.3 });
  }

  const hx = side < 0 ? x + w - 34 : x + 34;
  const hg = ctx.createLinearGradient(hx - 5, 0, hx + 5, 0);
  hg.addColorStop(0, '#8a5a1a');
  hg.addColorStop(0.5, '#ffe9ae');
  hg.addColorStop(1, '#8a5a1a');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.roundRect(hx - 5, y + h * 0.46, 10, 132, 5);
  ctx.fill();
  ctx.restore();

  const ex = side < 0 ? x + w : x;
  gline(ex, y, ex, y + h, 3.2, { sheen, glow: 10 });
  gline(ex - side * 10, y + 10, ex - side * 10, y + h - 10, 1, { alpha: 0.5, off: 0.4 });
  ctx.strokeStyle = 'rgba(255,247,224,0.42)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 9, y + 9, w - 18, h - 18);
}

function floorBadge(t) {
  const x = CX, y = 282;
  plaque(x, y, 86, 44, { sheen: 0.1 });
  drawText('1', x, y + 1, 'Poiret One', 30, C.ivory, {
    align: 'center', pass: true, id: 'floor-lobby',
  });
}

function buttonPanel(t) {
  const x = 1375, y = 505, w = 120, h = 300;
  plaque(x + w / 2, y + h / 2, w, h, { step: 14, sheen: 0.05 });
  for (let i = 0; i < 3; i++) {
    const by = y + 68 + i * 76;
    const lit = i === 0 && t >= 4.0 ? 1 : 0;
    ctx.save();
    if (lit) {
      ctx.shadowColor = 'rgba(255,157,126,0.9)';
      ctx.shadowBlur = 24;
    }
    ctx.fillStyle = lit ? C.coralHot : '#241a16';
    ctx.beginPath();
    ctx.arc(x + w / 2, by, 17, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = lit ? 'rgba(255,230,200,0.95)' : 'rgba(246,226,168,0.6)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }
  gline(x + 18, y + 20, x + w - 18, y + 20, 1.2, { alpha: 0.5 });
}

function glove(t) {
  const enter = eio(seg(t, 3.68, 4.02));
  const leave = eio(seg(t, 5.02, 5.34));
  if (enter <= 0 || leave >= 1) return;
  const hx = lerp(1950, 1548, enter) + 420 * leave;
  const press = Math.sin(Math.PI * clamp(seg(t, 4.0, 4.26))) * 9;
  const x = hx - press, y = 600;

  ctx.save();
  const sleeve = ctx.createLinearGradient(0, y - 46, 0, y + 46);
  sleeve.addColorStop(0, '#1e1413');
  sleeve.addColorStop(0.5, '#120c0c');
  sleeve.addColorStop(1, '#080505');
  ctx.fillStyle = sleeve;
  ctx.beginPath();
  ctx.roundRect(x + 78, y - 46, 500, 92, 26);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    gline(x + 120 + i * 22, y - 34, x + 120 + i * 22, y + 34, 1, { alpha: 0.35, off: 0.3 });
  }

  const cuff = ctx.createLinearGradient(0, y - 46, 0, y + 46);
  cuff.addColorStop(0, '#8a5a1a');
  cuff.addColorStop(0.5, '#ffe9ae');
  cuff.addColorStop(1, '#7a4d16');
  ctx.fillStyle = cuff;
  ctx.beginPath();
  ctx.roundRect(x + 62, y - 50, 20, 100, 6);
  ctx.fill();

  const g = ctx.createLinearGradient(0, y - 70, 0, y + 70);
  g.addColorStop(0, '#ffb18f');
  g.addColorStop(0.42, C.coral);
  g.addColorStop(1, '#7d241c');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(255,232,190,0.85)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(x - 24, y - 58, 104, 116, 30);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(x - 116, y - 44, 122, 26, 13);
  ctx.fill(); ctx.stroke();

  for (let i = 0; i < 3; i++) {
    const fy = y + 2 + i * 20;
    ctx.beginPath();
    ctx.roundRect(x - 62 + i * 3, fy, 76 - i * 6, 17, 8.5);
    ctx.fill(); ctx.stroke();
  }

  ctx.save();
  ctx.translate(x + 36, y + 46);
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.roundRect(-8, -13, 74, 26, 13);
  ctx.fill(); ctx.stroke();
  ctx.restore();

  gline(x - 30, y - 50, x - 30, y + 46, 1, { alpha: 0.35, off: 0.3 });
  gline(x + 16, y - 56, x + 16, y + 52, 1, { alpha: 0.3, off: 0.3 });
  ctx.restore();
}

function sceneLobby(t) {
  bg(520, 0.14);

  const archX = CX, archTop = 120, archW = 1360, archBot = 1010;
  ctx.save();
  const wall = ctx.createLinearGradient(0, archTop, 0, archBot);
  wall.addColorStop(0, 'rgba(58,36,24,0.24)');
  wall.addColorStop(0.55, 'rgba(24,16,14,0.2)');
  wall.addColorStop(1, 'rgba(12,9,9,0.1)');
  ctx.fillStyle = wall;
  ctx.beginPath();
  ctx.moveTo(archX - archW / 2, archBot);
  ctx.lineTo(archX - archW / 2, archTop + 180);
  ctx.quadraticCurveTo(archX, archTop - 120, archX + archW / 2, archTop + 180);
  ctx.lineTo(archX + archW / 2, archBot);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(226,188,110,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  for (let x = 180; x < W; x += 48) {
    if (x > 560 && x < 1360) continue;
    gline(x, 180, x, 1000, 1, { alpha: 0.08, off: 0.3, dark: false });
  }

  for (const sx of [230, 1690]) {
    ctx.save();
    ctx.strokeStyle = 'rgba(226,188,110,0.5)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.11;
      ctx.beginPath();
      ctx.moveTo(sx, 470);
      ctx.lineTo(sx + Math.cos(a) * 115, 470 + Math.sin(a) * 115);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(sx, 470, 20, 0, TAU);
    ctx.strokeStyle = goldGrad(sx - 20, 450, sx + 20, 490);
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,236,190,0.75)';
    ctx.beginPath(); ctx.arc(sx, 470, 5, 0, TAU); ctx.fill();
    gline(sx, 490, sx, 640, 3, { glow: 5 });
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(10,8,8,0.85)';
  ctx.fillRect(0, 980, W, 100);
  for (let x = -40; x < W + 80; x += 120) {
    ctx.strokeStyle = 'rgba(226,188,110,0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, 980); ctx.lineTo(x + 60, 1040); ctx.lineTo(x + 120, 980);
    ctx.stroke();
  }
  gline(0, 980, W, 980, 2.2, { alpha: 0.7 });

  ctx.fillStyle = 'rgba(120,90,40,0.06)';
  for (let x = 40; x < W; x += 96) ctx.fillRect(x, 0, 1, H);
  for (let y = 120; y < H; y += 160) {
    ctx.strokeStyle = 'rgba(199,154,62,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y); ctx.lineTo(40 + 26, y - 22); ctx.lineTo(40 + 52, y);
    ctx.stroke();
  }

  const push = 1 + 0.07 * eio(seg(t, 3.4, 6.4));
  ctx.save();
  ctx.translate(CX, 540);
  ctx.scale(push, push);
  ctx.translate(-CX, -540);

  const fx = 600, fy = 300, fw = 720, fh = 680;
  cabInterior(fx + 40, fy, fw - 80, fh);

  const open = eio(seg(t, 4.4, 5.2));
  ctx.save();
  ctx.beginPath();
  ctx.rect(fx + 40, fy, fw - 80, fh);
  ctx.clip();
  const dx = open * (fw / 2 - 40) * 0.92;
  doorLeaf(fx + 40 - dx, fy, (fw - 80) / 2, fh, -1, 0.1);
  doorLeaf(CX + dx, fy, (fw - 80) / 2, fh, 1, 0.1);
  ctx.restore();

  const spill = 0.18 + 0.82 * open;
  const sg = ctx.createRadialGradient(CX, fy + 400, 20, CX, fy + 400, 620);
  sg.addColorStop(0, `rgba(255,140,100,${0.30 * spill})`);
  sg.addColorStop(1, 'rgba(255,140,100,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#100c0c';
  ctx.fillRect(fx - 40, 205, fw + 80, 30);
  ctx.fillRect(fx - 20, 235, fw + 40, 30);
  ctx.fillStyle = '#0d0a0a';
  ctx.fillRect(fx, 265, fw, 40);
  gline(fx - 40, 205, fx + fw + 40, 205, 3, { glow: 8 });
  gline(fx - 20, 235, fx + fw + 20, 235, 2, { glow: 5 });
  gline(fx, 265, fx + fw, 265, 2.4, { glow: 5 });
  gline(fx, 305, fx + fw, 305, 2.4, { glow: 5 });

  gline(fx, fy, fx, fy + fh, 4, { glow: 8 });
  gline(fx + fw, fy, fx + fw, fy + fh, 4, { glow: 8 });
  gline(fx, fy + fh, fx + fw, fy + fh, 4, { glow: 8 });

  for (const px of [fx - 70, fx + fw + 70]) {
    ctx.fillStyle = '#0d0a0a';
    ctx.fillRect(px - 34, 340, 68, 640);
    gline(px - 34, 340, px - 34, 980, 2, { glow: 4 });
    gline(px + 34, 340, px + 34, 980, 2, { glow: 4 });
    for (let i = 0; i < 3; i++) {
      const y = 420 + i * 200;
      ctx.strokeStyle = 'rgba(226,188,110,0.5)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px - 24, y + 30); ctx.lineTo(px, y); ctx.lineTo(px + 24, y + 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 16, y + 54); ctx.lineTo(px, y + 34); ctx.lineTo(px + 16, y + 54);
      ctx.stroke();
    }
  }
  for (let i = 0; i < 3; i++) {
    const w = fw + 180 - i * 60;
    const y = 195 - i * 10;
    ctx.fillStyle = '#0d0a0a';
    ctx.fillRect(CX - w / 2, y, w, 10);
    gline(CX - w / 2, y, CX + w / 2, y, 1.6, { alpha: 0.8 });
  }

  floorBadge(t);
  buttonPanel(t);
  glove(t);
  ctx.restore();

  clockFace(CX, 120, 54, clockMinutes(t), 1);

  vignette(0.55);
}

/* ——— clock + dial ————————————————————————————————————— */

function clockMinutes(t) {
  if (t < 5.0) return 11 * 60 + 52;
  if (t < 9.3) return 11 * 60 + 52 + (t - 5.0) / 4.3 * 7;
  if (t < 11.7) return 11 * 60 + 59;
  return 12 * 60;
}

function clockFace(cx, cy, r, minutes, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.2);
  glow.addColorStop(0, 'rgba(246,226,168,0.10)');
  glow.addColorStop(1, 'rgba(246,226,168,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, r * 2.2, 0, TAU); ctx.fill();

  ctx.fillStyle = '#0d0a0b';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = goldGrad(cx - r, cy - r, cx + r, cy + r);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r - 9, 0, TAU);
  ctx.strokeStyle = 'rgba(246,226,168,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12 - Math.PI / 2;
    const r0 = r - (i % 3 === 0 ? 18 : 12);
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(243,234,214,0.9)' : 'rgba(243,234,214,0.35)';
    ctx.lineWidth = i % 3 === 0 ? 2.4 : 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
    ctx.stroke();
  }

  const ma = (minutes % 60) / 60 * TAU - Math.PI / 2;
  const ha = ((minutes / 60) % 12) / 12 * TAU - Math.PI / 2;
  gline(cx, cy, cx + Math.cos(ha) * r * 0.48, cy + Math.sin(ha) * r * 0.48, 4, { glow: 4, off: 0.6 });
  gline(cx, cy, cx + Math.cos(ma) * r * 0.76, cy + Math.sin(ma) * r * 0.76, 2.4, { glow: 4, off: 0.5 });
  ctx.fillStyle = C.goldHot;
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, TAU); ctx.fill();
  ctx.restore();
}

function dial(cx, cy, r, floor, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2);
  glow.addColorStop(0, 'rgba(226,96,74,0.12)');
  glow.addColorStop(1, 'rgba(226,96,74,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, r * 2, 0, TAU); ctx.fill();

  ctx.fillStyle = '#0d0a0b';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = goldGrad(cx - r, cy - r, cx + r, cy + r);
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r - 22, 0, TAU);
  ctx.strokeStyle = 'rgba(246,226,168,0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  for (let i = 0; i < 40; i++) {
    const a = i * TAU / 40 - Math.PI / 2;
    const major = i % 5 === 0;
    const r0 = r - (major ? 26 : 14);
    ctx.strokeStyle = major ? 'rgba(243,234,214,0.85)' : 'rgba(243,234,214,0.28)';
    ctx.lineWidth = major ? 2.2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8));
    ctx.stroke();
  }

  const a = floor / 40 * TAU - Math.PI / 2;
  gline(cx, cy, cx + Math.cos(a) * (r - 30), cy + Math.sin(a) * (r - 30), 3, { glow: 6 });
  ctx.fillStyle = C.goldHot;
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill();

  drawText(String(Math.round(floor)), cx, cy + 4, 'Poiret One', 132, C.ivory, {
    align: 'center', alpha: 0.94, pass: true, id: 'dial-floor',
  });
  drawText('FLOOR', cx, cy + 86, 'Poiret One', 18, C.gold, {
    align: 'center', ls: 6, alpha: 0.8, pass: true, id: 'dial-label',
  });
  ctx.restore();
}

/* ——— S3: the climb ————————————————————————————————————— */

const FLOOR_1 = 1000, FLOOR_STEP = 28;
const floorY = f => FLOOR_1 - (f - 1) * FLOOR_STEP;

function drawTower(t, floor) {
  const x0 = 720, x1 = 1200;

  const body = ctx.createLinearGradient(0, -420, 0, 1080);
  body.addColorStop(0, '#1b1211');
  body.addColorStop(0.45, '#150f0f');
  body.addColorStop(1, '#0c0909');
  ctx.fillStyle = body;
  ctx.fillRect(x0 - 80, -420, (x1 - x0) + 160, 1520);

  ctx.fillStyle = 'rgba(8,6,7,0.55)';
  ctx.fillRect(x0 + 44, -420, (x1 - x0) - 88, 1520);

  for (let f = 1; f <= 40; f++) {
    const y = floorY(f);
    if (f % 2 === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(x0 - 60, y + 2, (x1 - x0) + 120, 4);
      gline(x0 - 60, y, x1 + 60, y, 1.8, { alpha: 0.55, off: 0.5 });
    }

    const major = f % 10 === 0;
    if (major) {
      gline(x0 - 76, y, x0 - 60, y, 2, { alpha: 0.9 });
      gline(x1 + 60, y, x1 + 76, y, 2, { alpha: 0.9 });
      ctx.fillStyle = 'rgba(226,188,110,0.16)';
      ctx.beginPath();
      ctx.moveTo(x0 - 76, y); ctx.lineTo(x0 - 66, y - 12); ctx.lineTo(x0 - 56, y);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x1 + 56, y); ctx.lineTo(x1 + 66, y - 12); ctx.lineTo(x1 + 76, y);
      ctx.fill();
    }

    if (f % 2 === 0) for (let w = 0; w < 2; w++) {
      const wx = w === 0 ? x0 + 76 : x1 - 112;
      const lit = hash(f * 7 + w) > 0.55;
      ctx.fillStyle = lit ? 'rgba(255,176,120,0.26)' : 'rgba(226,188,110,0.10)';
      ctx.fillRect(wx, y + 8, 36, 12);
      ctx.strokeStyle = 'rgba(226,188,110,0.3)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(wx, y + 8, 36, 12);
    }
  }

  gline(x0, -360, x0, 1040, 3.6, { alpha: 0.95, glow: 8 });
  gline(x1, -360, x1, 1040, 3.6, { alpha: 0.95, glow: 8 });
  gline(x0 + 26, -300, x0 + 26, 1040, 1.2, { alpha: 0.4, off: 0.4 });
  gline(x1 - 26, -300, x1 - 26, 1040, 1.2, { alpha: 0.4, off: 0.4 });

  ctx.fillStyle = '#100c0c';
  ctx.fillRect(x0 - 130, 1000, (x1 - x0) + 260, 80);
  gline(x0 - 130, 1000, x1 + 130, 1000, 3, { glow: 8 });
  gline(x0 - 90, 1030, x1 + 90, 1030, 1.2, { alpha: 0.5 });
  for (let i = 0; i < 5; i++) {
    const bx = x0 - 90 + i * 100;
    ctx.strokeStyle = 'rgba(226,188,110,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, 1000); ctx.lineTo(bx + 18, 1016); ctx.lineTo(bx + 36, 1000);
    ctx.stroke();
  }

  const crownTop = floorY(40) - 92;
  const widths = [600, 520, 440, 360, 280, 210];
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i], y = crownTop - i * 28;
    ctx.fillStyle = '#0e0a0b';
    ctx.fillRect(CX - w / 2, y - 28, w, 28);
    gline(CX - w / 2, y - 28, CX + w / 2, y - 28, 2.2, { glow: 5 });
    gline(CX - w / 2, y - 28, CX - w / 2, y, 1.2, { alpha: 0.6, off: 0.4 });
    gline(CX + w / 2, y - 28, CX + w / 2, y, 1.2, { alpha: 0.6, off: 0.4 });
  }
  const sy = crownTop - widths.length * 28 - 96;
  gline(CX, sy, CX, crownTop - widths.length * 28 + 10, 3.4, { glow: 10 });
  ctx.fillStyle = C.goldHot;
  ctx.beginPath(); ctx.arc(CX, sy, 6, 0, TAU); ctx.fill();

  const cabTop = floorY(floor) - 96;
  const cw = 250, ch = 96;
  const spill = ctx.createRadialGradient(CX, cabTop + ch, 20, CX, cabTop + ch, 300);
  spill.addColorStop(0, 'rgba(255,140,100,0.34)');
  spill.addColorStop(1, 'rgba(255,140,100,0)');
  ctx.fillStyle = spill;
  ctx.fillRect(CX - 300, cabTop - 100, 600, 420);

  const cg = ctx.createLinearGradient(0, cabTop, 0, cabTop + ch);
  cg.addColorStop(0, '#ffbe9c');
  cg.addColorStop(0.38, C.coral);
  cg.addColorStop(1, '#7d241c');
  ctx.save();
  ctx.shadowColor = 'rgba(255,120,80,0.9)';
  ctx.shadowBlur = 54;
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.roundRect(CX - cw / 2, cabTop, cw, ch, 22);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = goldGrad(CX - cw / 2, cabTop, CX + cw / 2, cabTop + ch);
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.roundRect(CX - cw / 2, cabTop, cw, ch, 22);
  ctx.stroke();
  ctx.fillStyle = 'rgba(80,18,14,0.5)';
  ctx.fillRect(CX - cw / 2 + 26, cabTop + 22, cw - 52, 4);
  ctx.fillRect(CX - cw / 2 + 26, cabTop + ch - 26, cw - 52, 4);
  gline(CX - cw / 2 + 18, cabTop + 26, CX - cw / 2 + 18, cabTop + ch - 26, 1.2, { alpha: 0.8, off: 0.4 });
  gline(CX + cw / 2 - 18, cabTop + 26, CX + cw / 2 - 18, cabTop + ch - 26, 1.2, { alpha: 0.8, off: 0.4 });
  ctx.fillStyle = 'rgba(255,220,190,0.95)';
  ctx.beginPath(); ctx.arc(CX, cabTop + 14, 4, 0, TAU); ctx.fill();
}

function sceneClimb(t) {
  bg(520, 0.16);

  const halo = ctx.createRadialGradient(CX, 560, 60, CX, 560, 760);
  halo.addColorStop(0, 'rgba(150,84,32,0.34)');
  halo.addColorStop(1, 'rgba(150,84,32,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  const climb = eio(seg(t, 6.7, 9.38));
  const floor = 1 + 39 * climb;
  const camY = floorY(floor) - 620;

  ctx.save();
  ctx.translate(0, -camY);
  drawTower(t, floor);
  ctx.restore();

  const ground = ctx.createLinearGradient(0, 860, 0, H);
  ground.addColorStop(0, 'rgba(9,7,8,0)');
  ground.addColorStop(0.4, 'rgba(9,7,8,0.85)');
  ground.addColorStop(1, '#070506');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 860, W, H - 860);
  for (let x = -60; x < W + 120; x += 140) {
    gline(x, 1030, x + 70, 960, 1, { alpha: 0.18, off: 0.4, dark: false });
    gline(x + 70, 960, x + 140, 1030, 1, { alpha: 0.18, off: 0.4, dark: false });
  }

  const speed = ss(seg(t, 6.72, 7.05)) * (1 - ss(seg(t, 9.1, 9.36)));
  if (speed > 0.01) {
    for (let i = 0; i < 18; i++) {
      const x = 745 + ((i * 149) % 436);
      const y = ((i * 173 + t * 1520) % 1300) - 120;
      const len = 60 + hash(i) * 90;
      gline(x, y, x, y + len, 1.2, { alpha: 0.2 * speed, off: 0.3, dark: false });
    }
  }

  dial(320, 470, 176, floor, 1);
  clockFace(1598, 300, 84, clockMinutes(t), 1);

  drawText('THE LAST LIFT OF THE NIGHT', CX, 990, 'Josefin Sans', 22, C.ivoryDim, {
    align: 'center', ls: 3, alpha: 0.55 * (1 - seg(t, 9.1, 9.4)), pass: true, id: 'climb-caption',
  });

  const dip = Math.min(seg(t, 9.42, 9.56), 1 - seg(t, 9.66, 9.78));
  if (dip > 0) {
    ctx.fillStyle = `rgba(0,0,0,${0.6 * dip})`;
    ctx.fillRect(0, 0, W, H);
  }

  vignette(0.6);
}

/* ——— S4: the roof ————————————————————————————————————— */

let SIGN = null;
let BULB = null;

function buildBulbSprite() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,250,230,1)');
  gr.addColorStop(0.18, 'rgba(255,232,170,0.95)');
  gr.addColorStop(0.5, 'rgba(255,200,110,0.28)');
  gr.addColorStop(1, 'rgba(255,190,90,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  BULB = c;
}

function buildSign() {
  const text = 'THE TOP';
  const off = document.createElement('canvas');
  off.width = 1700; off.height = 460;
  const c = off.getContext('2d');
  c.fillStyle = '#fff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = '400 240px Limelight, serif';
  c.fillText(text, 850, 230);
  const img = c.getImageData(0, 0, 1700, 460).data;
  const A = (x, y) => (x < 0 || y < 0 || x >= 1700 || y >= 460) ? 0 : img[(y * 1700 + x) * 4 + 3];

  const widths = [];
  let total = 0;
  for (const ch of text) { const w = c.measureText(ch).width; widths.push(w); total += w; }
  const bounds = [];
  let acc = 850 - total / 2;
  for (const w of widths) { bounds.push([acc, acc + w]); acc += w; }

  const bulbs = [];
  const step = 13;
  for (let y = 0; y < 460; y += step) {
    for (let x = 0; x < 1700; x += step) {
      if (A(x, y) < 128) continue;
      const edge = !(A(x - step, y) >= 128 && A(x + step, y) >= 128 && A(x, y - step) >= 128 && A(x, y + step) >= 128);
      let g = 0;
      for (let i = 0; i < bounds.length; i++) if (x >= bounds[i][0] && x < bounds[i][1]) { g = i; break; }
      bulbs.push({ x: x - 850, y: y - 230, g, edge });
    }
  }
  SIGN = { bulbs, total };
}

function drawSign(t, cx, cy, targetW) {
  if (!SIGN) return;
  const s = targetW / SIGN.total;

  const litGroups = clamp((t - 11.0) / 0.26, 0, 7);
  const glowAmt = litGroups / 7;
  const glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 760);
  glow.addColorStop(0, `rgba(255,214,140,${0.06 + 0.16 * glowAmt})`);
  glow.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 900, cy - 640, 1800, 1280);

  ctx.save();
  ctx.globalAlpha = 0.10 + 0.10 * glowAmt;
  for (const dir of [-1, 1]) {
    const bg2 = ctx.createLinearGradient(cx, cy, cx + dir * 560, cy - 600);
    bg2.addColorStop(0, 'rgba(255,226,168,0.5)');
    bg2.addColorStop(1, 'rgba(255,226,168,0)');
    ctx.fillStyle = bg2;
    ctx.beginPath();
    ctx.moveTo(cx + dir * 40, cy + 60);
    ctx.lineTo(cx + dir * 520, cy - 620);
    ctx.lineTo(cx + dir * 250, cy - 620);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  for (let i = 3; i >= 1; i--) {
    plaque(cx, cy, targetW + 150 + i * 64, 360 - i * 38, {
      step: 18, lw: 1.2, fill: 'rgba(11,8,9,0.72)',
    });
  }
  plaque(cx, cy, targetW + 150, 360, { sheen: 0.1, glow: 10, step: 26 });

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

  for (const b of SIGN.bulbs) {
    const litAt = 11.0 + b.g * 0.26;
    let bri = 0;
    if (t >= litAt) {
      const u = (t - litAt) / 0.18;
      bri = u < 1 ? 1 + 0.8 * (1 - u) : 1;
    }
    if (t > 12.85) {
      const ph = (t * 5.2 - b.x * 0.0045) % 1;
      bri += 0.45 * Math.max(0, Math.sin(ph * TAU));
    }
    if (bri <= 0) {
      ctx.fillStyle = b.edge ? 'rgba(178,136,62,0.62)' : 'rgba(150,112,52,0.34)';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.edge ? 3.4 : 2.2, 0, TAU); ctx.fill();
      continue;
    }
    ctx.globalAlpha = Math.min(1, bri);
    const d = (b.edge ? 20 : 13) * Math.min(1.5, bri);
    ctx.drawImage(BULB, b.x - d / 2, b.y - d / 2, d, d);
    ctx.globalAlpha = 1;
    ctx.fillStyle = b.edge ? 'rgba(255,250,232,0.98)' : 'rgba(255,242,208,0.8)';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.edge ? 2.8 : 1.9, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function drawSkyline(alpha = 0.5) {
  const base = 856;
  for (let i = 0; i < 18; i++) {
    const w = 70 + hash(i + 3) * 120;
    const x = -40 + i * 112;
    const h = 70 + hash(i + 11) * 240;
    const y = base - h;
    ctx.fillStyle = `rgba(9,10,10,${alpha})`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = `rgba(199,154,62,${alpha})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    if (hash(i + 31) > 0.55) {
      ctx.beginPath(); ctx.moveTo(x + w * 0.3, y); ctx.lineTo(x + w * 0.3, y - 24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w * 0.7, y); ctx.lineTo(x + w * 0.7, y - 18); ctx.stroke();
    }
    for (let j = 0; j < 5; j++) {
      if (hash(i * 13 + j) > 0.5) continue;
      ctx.fillStyle = `rgba(243,222,170,${0.28 * alpha})`;
      ctx.fillRect(x + 12 + (j % 3) * 24, y + 18 + Math.floor(j / 3) * 26, 5, 8);
    }
  }
}

function roofDoors(t) {
  const fx = 720, fy = 790, fw = 480, fh = 290;
  const open = eio(seg(t, 10.42, 11.08));

  const glow = ctx.createRadialGradient(CX, fy + 40, 8, CX, fy + 40, 360);
  glow.addColorStop(0, `rgba(255,150,110,${0.35 + 0.4 * open})`);
  glow.addColorStop(1, 'rgba(255,150,110,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, H - 460, W, 460);

  cabInterior(fx + 30, fy, fw - 60, fh);

  ctx.save();
  ctx.beginPath(); ctx.rect(fx + 30, fy, fw - 60, fh); ctx.clip();
  const dx = open * (fw / 2 - 30) * 0.9;
  doorLeaf(fx + 30 - dx, fy, (fw - 60) / 2, fh, -1, 0);
  doorLeaf(CX + dx, fy, (fw - 60) / 2, fh, 1, 0);
  ctx.restore();

  gline(fx, fy, fx, fy + fh, 3.4, { glow: 7 });
  gline(fx + fw, fy, fx + fw, fy + fh, 3.4, { glow: 7 });
  gline(fx, fy, fx + fw, fy, 3.4, { glow: 7 });
}

function drawRoof(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 900);
  sky.addColorStop(0, '#08070a');
  sky.addColorStop(0.52, '#0c1113');
  sky.addColorStop(0.82, '#123028');
  sky.addColorStop(1, '#0a1211');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const off = 84 * (1 - eio(seg(t, 10.2, 11.15)));
  ctx.save();
  ctx.translate(0, off);

  for (let i = 0; i < 54; i++) {
    const x = hash(i + 7) * W;
    const y = hash(i + 71) * 690;
    const r = 0.9 + hash(i + 131) * 1.7;
    ctx.globalAlpha = 0.22 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.6 + i));
    ctx.fillStyle = C.ivory;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;

  const moon = ctx.createRadialGradient(CX, 330, 20, CX, 330, 330);
  moon.addColorStop(0, 'rgba(246,226,168,0.16)');
  moon.addColorStop(1, 'rgba(246,226,168,0)');
  ctx.fillStyle = moon;
  ctx.beginPath(); ctx.arc(CX, 330, 330, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(246,226,168,0.2)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(CX, 330, 268, 0, TAU); ctx.stroke();

  sunburst(CX, 430, 30, 720, 40, 1, 0.5, t * 0.01);

  drawSkyline(0.55);
  ctx.restore();

  ctx.save();
  ctx.translate(0, off * 0.32);

  ctx.fillStyle = '#0b0d0d';
  ctx.fillRect(0, 846, W, 70);
  gline(0, 846, W, 846, 3, { glow: 7 });
  gline(0, 862, W, 862, 1.2, { alpha: 0.5 });
  for (let x = 30; x < W; x += 64) {
    ctx.strokeStyle = 'rgba(199,154,62,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, 900); ctx.lineTo(x + 18, 878); ctx.lineTo(x + 36, 900);
    ctx.stroke();
  }

  drawSign(t, CX, 368, 980);
  ctx.restore();

  clockFace(1560, 782, 56, clockMinutes(t), 1);

  roofDoors(t);
}

/* ——— S5: the poster ——————————————————————————————————— */

function posterFrame(x, y, w, h, p, t) {
  const m = 30 * p;
  ctx.save();
  ctx.strokeStyle = goldGrad(x, y, x + w, y + h, (t - 13.3) * 0.3);
  ctx.lineWidth = 3.4 * p;
  ctx.strokeRect(x - m, y - m, w + 2 * m, h + 2 * m);
  ctx.lineWidth = 1.2 * p;
  ctx.strokeStyle = 'rgba(255,247,224,0.5)';
  ctx.strokeRect(x - m + 8, y - m + 8, w + 2 * m - 16, h + 2 * m - 16);

  const s = 44 * p;
  for (const [cx, cy, sx, sy] of [
    [x - m, y - m, 1, 1], [x + w + m, y - m, -1, 1],
    [x - m, y + h + m, 1, -1], [x + w + m, y + h + m, -1, -1],
  ]) {
    ctx.strokeStyle = goldGrad(x, y, x + w, y + h);
    ctx.lineWidth = 2.4 * p;
    ctx.beginPath();
    ctx.moveTo(cx + sx * s, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + sx * s * 0.6, cy + sy * 10);
    ctx.lineTo(cx + sx * 10, cy + sy * 10);
    ctx.lineTo(cx + sx * 10, cy + sy * s * 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

function scenePoster(t) {
  ctx.fillStyle = '#070607';
  ctx.fillRect(0, 0, W, H);

  const p = eio(seg(t, 12.6, 13.35));
  const rx = lerp(0, 360, p), ry = lerp(0, 108, p);
  const rw = lerp(W, 1200, p), rh = lerp(H, 675, p);

  ctx.save();
  ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
  ctx.translate(rx, ry);
  ctx.scale(rw / W, rh / H);
  drawRoof(12.55);
  ctx.restore();

  posterFrame(rx, ry, rw, rh, p, t);

  if (p > 0.25) {
    const pulse = 0.8 + 0.2 * Math.sin((t - 14.4) * 4);
    ctx.save();
    ctx.globalAlpha = clamp((t - 14.3) / 0.6) * pulse;
    ctx.drawImage(BULB, CX - 26, 30, 52, 52);
    ctx.restore();
    if (t > 14.3) {
      ctx.fillStyle = 'rgba(255,250,232,0.95)';
      ctx.beginPath(); ctx.arc(CX, 56, 3.6, 0, TAU); ctx.fill();
    }
  }

  sunburst(CX, 900, 20, 460, 30, eio(seg(t, 13.0, 13.8)), 0.35, 0.02);

  const ruleP = eio(seg(t, 12.95, 13.4));
  gline(CX - 520 * ruleP, 830, CX + 520 * ruleP, 830, 2, { glow: 6 });
  ctx.fillStyle = C.gold;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(CX + sx * (530 * ruleP), 830);
    ctx.lineTo(CX + sx * (548 * ruleP), 821);
    ctx.lineTo(CX + sx * (566 * ruleP), 830);
    ctx.lineTo(CX + sx * (548 * ruleP), 839);
    ctx.closePath();
    ctx.fill();
  }

  drawText('NIGHT ELEVATOR', CX, 884, 'Limelight', 104, C.ivory, {
    align: 'center', maxW: 1180, reveal: eio(seg(t, 12.98, 13.55)),
    revealFrom: 'center', id: 'title-end',
  });
  drawText('ART DECO', CX, 962, 'Poiret One', 30, C.goldHot, {
    align: 'center', ls: 16, alpha: 0.95, reveal: eio(seg(t, 13.1, 13.6)),
    revealFrom: 'center', id: 'kicker-end',
  });
  drawText('A FILMCODE STYLE DEMO', CX, 1020, 'Josefin Sans', 22, C.ivoryDim, {
    align: 'center', ls: 3, alpha: 0.7, reveal: eio(seg(t, 13.12, 13.62)),
    revealFrom: 'center', id: 'credit-end',
  });

  vignette(0.5);
}

/* ——— frame ——————————————————————————————————————————— */

function draw(t) {
  TEXTS = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  if (t < 3.4) sceneTitle(t);
  else if (t < 6.4) sceneLobby(t);
  else if (t < 10.2) sceneClimb(t);
  else if (t < 12.6) drawRoof(t);
  else scenePoster(t);
}

window.render = draw;
window.TEXTS = t => { draw(t); return TEXTS.slice(); };

document.fonts.ready.then(async () => {
  try {
    await Promise.all([
      document.fonts.load('400 96px Limelight'),
      document.fonts.load('400 30px "Poiret One"'),
      document.fonts.load('400 22px "Josefin Sans"'),
      document.fonts.load('600 22px "Josefin Sans"'),
    ]);
  } catch (e) { /* fonts still render with fallbacks */ }
  buildBulbSprite();
  buildSign();
  window.READY = true;
});
