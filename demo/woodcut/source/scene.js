// One Ember — plates, knife, figure. Story is not the library demo.
import { clamp, lerp, seg, ss, ei, mulberry, hash } from '/core/lib.js';
import { gouge, stab, prog } from './engine/woodcut.js';

export const DUR = 38;
const MOUTH = { x: 1020, y: 500 };
const JAR = { x: 1420, y: 660 };

const CUTS = [2.15, 12.4, 18.15, 26.15, 30.3];

export function archPoint(u) {
  const a = Math.PI * (1 - clamp(u));
  return {
    x: MOUTH.x + Math.cos(a) * 270,
    y: 560 - Math.sin(a) * 230,
  };
}

function uncut(x, y) {
  return x > 1588 || (x > 1490 && y < 340);
}

function pushLine(list, x0, y0, x1, y1, w, t0, dur, seed) {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  if (uncut(mx, my)) return;
  list.push({ kind: 'line', x0, y0, x1, y1, w, t0, dur, seed });
}

function inKiln(x, y) {
  return x > 800 && x < 1270 && y > 500 && y < 735;
}

function buildStrokes() {
  const S = [];
  const left = archPoint(0);
  const right = archPoint(1);
  pushLine(S, left.x, left.y + 8, left.x - 6, 758, 4.2, 5.6, 0.5, 41);
  pushLine(S, right.x, right.y + 8, right.x + 8, 756, 4.2, 6.0, 0.5, 42);
  pushLine(S, left.x - 8, 750, right.x + 8, 744, 5, 6.3, 0.4, 77);

  const rows = [678, 714, 750, 786];
  rows.forEach((y, ri) => {
    for (let x = 180; x < 1520; x += 128) {
      if (inKiln(x + 40, y)) continue;
      const d = Math.hypot(x - MOUTH.x, y - MOUTH.y);
      if (d > 420 && hash(x + y) > 0.62) continue;
      const w = d < 200 ? 10 : d < 380 ? 4.5 : 2.2;
      const t0 = 6.35 + clamp(d / 560, 0, 1) * 3.1;
      pushLine(S, x, y, x + 86, y + (hash(x * 0.2 + ri) - 0.5) * 7, w, t0, 0.22, 800 + x + ri);
    }
  });

  for (let i = 0; i < 6; i++) {
    const x = 150 + i * 42;
    pushLine(S, x, 180, x + 6, 640, i % 2 ? 2 : 2.6, 7.1 + i * 0.18, 0.35, 900 + i);
  }
  for (let i = 0; i < 8; i++) {
    const x = 140 + i * 150;
    pushLine(S, x, 168, x + 110, 164, 3.2, 6.9 + i * 0.08, 0.2, 940 + i);
  }

  for (let i = 0; i < 16; i++) {
    const u = (i + 0.5) / 16;
    const a = archPoint(u);
    const dx = MOUTH.x - a.x;
    const dy = 540 - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const x = a.x + (dx / len) * (18 + hash(i) * 24);
    const y = a.y + (dy / len) * (18 + hash(i + 4) * 24);
    if (uncut(x, y)) continue;
    S.push({
      kind: 'stab', x, y, r: 2.4 + hash(i + 8) * 2.2,
      t0: 1.2 + u * 4.2, dur: 0.12, seed: 1100 + i,
    });
  }

  for (let i = 0; i < 24; i++) {
    const a = -Math.PI * 0.92 + (i / 23) * Math.PI * 1.25;
    const len = 80 + hash(i * 3.7) * 300;
    const x1 = MOUTH.x + Math.cos(a) * len;
    const y1 = MOUTH.y + Math.sin(a) * len;
    if (uncut((MOUTH.x + x1) / 2, (MOUTH.y + y1) / 2)) continue;
    if (x1 < 780 && y1 > 300 && y1 < 760) continue;
    pushLine(S, MOUTH.x, MOUTH.y, x1, y1, 9 + hash(i + 2) * 8, 19.7 + (i % 6) * 0.045, 0.2, 1200 + i);
  }
  return S;
}

const STROKES = buildStrokes();

function drawStrokes(ctx, t) {
  ctx.fillStyle = '#fff';
  for (const s of STROKES) {
    const p = prog(t, s.t0, s.dur);
    if (p <= 0) continue;
    if (s.kind === 'stab') {
      if (p > 0.35) stab(ctx, s.x, s.y, s.r, s.seed);
    } else {
      gouge(ctx, s.x0, s.y0, s.x1, s.y1, s.w, s.seed, p);
    }
  }
}

function rim(ctx, x, y, rx, ry, t, t0) {
  const p = prog(t, t0, 0.65);
  if (p <= 0) return;
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, -Math.PI / 2, 0, Math.PI * 2 * p);
  ctx.stroke();
  if (p > 0.7) {
    ctx.fillStyle = '#fff';
    for (let k = 0; k < 3; k++) {
      const yy = y - ry * 0.35 + k * ry * 0.32;
      gouge(ctx, x + rx * 0.2, yy, x + rx * 0.75, yy + 5, 2, 500 + k + x, 1);
    }
  }
  ctx.restore();
}

function drawArch(ctx, t) {
  const reveal = prog(t, 0.45, 5.4);
  if (reveal <= 0) return;
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.4;
  const steps = 42;
  const n = Math.max(1, Math.round(steps * reveal));
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const u = i / steps;
    const p = archPoint(u);
    const jx = (hash(i * 2.7) - 0.5) * 4;
    const jy = (hash(i * 4.1) - 0.5) * 3;
    if (i === 0) ctx.moveTo(p.x + jx, p.y + jy);
    else ctx.lineTo(p.x + jx, p.y + jy);
  }
  ctx.stroke();
  for (let i = 0; i < 13; i++) {
    const u = (i + 0.35) / 13;
    const a = archPoint(u);
    const b = archPoint(Math.min(0.98, u + 0.07));
    gouge(ctx, a.x, a.y, b.x, b.y, 7 + (i % 3) * 1.4, 120 + i, prog(t, 0.35 + u * 4.8, 0.26));
  }
  ctx.restore();
}

function drawPots(ctx, t) {
  rim(ctx, 230, 730, 36, 28, t, 7.4);
  rim(ctx, 340, 742, 28, 22, t, 7.9);
  rim(ctx, 450, 726, 32, 26, t, 8.3);
  const p = prog(t, 8.6, 0.8);
  if (p <= 0) return;
  rim(ctx, JAR.x, JAR.y, 58, 46, t, 8.6);
  if (p > 0.7) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(JAR.x, JAR.y - 18, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (t >= 27) {
    const reveal = prog(t, 27, 0.55);
    ctx.save();
    ctx.beginPath();
    ctx.rect(JAR.x - 46, JAR.y - 8, 92 * reveal, 48);
    ctx.clip();
    ctx.font = '600 34px "Cormorant Garamond", serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ASH', JAR.x, JAR.y + 16);
    ctx.restore();
  }
}

function drawKnife(ctx, t) {
  if (t < 0.2 || t > 6.65) return;
  const u = clamp(t / 6.25);
  const p = archPoint(u);
  const q = archPoint(Math.min(1, u + 0.02));
  const ang = Math.atan2(q.y - p.y, q.x - p.x);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(ang);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(-10, 7);
  ctx.lineTo(-10, -7);
  ctx.closePath();
  ctx.fill();
  gouge(ctx, -10, 0, -78, 10, 2.3, 17, 1);
  ctx.restore();
}

function drawEmber(ctx, t) {
  if (t < 8.15) return;
  const seed = Math.floor(t * 12);
  const rnd = mulberry(1000 + seed);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(MOUTH.x, MOUTH.y, 16, 11, 0.4, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2;
    const len = 12 + rnd() * 22;
    gouge(
      ctx, MOUTH.x, MOUTH.y,
      MOUTH.x + Math.cos(a) * len, MOUTH.y + Math.sin(a) * len,
      2.4 + rnd() * 2, seed * 13 + i, 1,
    );
  }
}

const SIL = [
  [700, 250], [656, 236], [614, 262], [596, 318], [604, 372],
  [572, 414], [548, 490], [542, 620], [558, 762], [772, 766],
  [754, 640], [736, 520], [748, 440], [724, 388], [748, 332], [730, 278],
];

function faceAt(t) {
  return { x: 662 + leanX(t), y: 322 };
}

function leanX(t) {
  const tt = Math.floor(t * 12) / 12;
  if (tt < 18.5 || tt > 20.6) return 0;
  if (tt < 19.55) return lerp(0, -16, seg(tt, 18.5, 19.55));
  if (tt < 19.72) return lerp(-16, 10, seg(tt, 19.55, 19.72));
  return lerp(10, 0, Math.min(1, (tt - 19.72) / 0.55));
}

function reachK(t) {
  const tt = Math.floor(t * 12) / 12;
  if (tt < 18.5) return 0.32;
  if (tt < 19.55) return lerp(0.32, 0.04, seg(tt, 18.5, 19.55));
  if (tt < 19.72) return lerp(0.04, 0.94, seg(tt, 19.55, 19.72));
  return lerp(0.94, 0.72, Math.min(1, (tt - 19.72) / 0.5));
}

function showFigure(t) {
  return (t >= 9.4 && t < 12.4) || t >= 18.15;
}

function drawFigure(ctx, t) {
  if (!showFigure(t)) return;
  const carve = t >= 18.15 ? 1 : prog(t, 9.4, 1.45);
  const lean = leanX(t);
  ctx.save();
  ctx.translate(lean, 0);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const n = SIL.length;
  for (let i = 0; i < n; i++) {
    const a = SIL[i];
    const b = SIL[(i + 1) % n];
    const p = carve >= 1 ? 1 : clamp(carve * n - i);
    if (p <= 0) continue;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p);
    ctx.stroke();
  }
  if (carve > 0.42) {
    const f = { x: 662, y: 322 };
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, 36, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(f.x - 2, f.y - 16, 24, 3.2);
    ctx.beginPath();
    ctx.ellipse(f.x + 10, f.y - 1, 7.5, 4.2, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(f.x + 30, f.y - 2);
    ctx.lineTo(f.x + 40, f.y + 8);
    ctx.lineTo(f.x + 26, f.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(f.x + 4, f.y + 16, 18, 2.6);
    ctx.globalCompositeOperation = 'source-over';
    if (carve > 0.75) {
      for (let k = 0; k < 4; k++) {
        const y = 500 + k * 52;
        gouge(ctx, 690, y, 742, y + 40, 2.1, 1600 + k, 1);
      }
    }
  }
  const k = reachK(t);
  const ang = lerp(0.55, 0.16, k);
  const len = lerp(120, 250, k);
  const sx = 730;
  const sy = 430;
  const hx = sx + Math.cos(ang) * len;
  const hy = sy + Math.sin(ang) * len;
  const nx = -Math.sin(ang) * 8;
  const ny = Math.cos(ang) * 8;
  ctx.beginPath();
  ctx.moveTo(sx + nx, sy + ny);
  ctx.lineTo(hx + nx * 0.4, hy + ny * 0.4);
  ctx.moveTo(sx - nx, sy - ny);
  ctx.lineTo(hx - nx * 0.4, hy - ny * 0.4);
  ctx.stroke();
  if (carve > 0.5) {
    ctx.beginPath();
    ctx.ellipse(hx, hy, 12, 9, ang, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function feedK(t) {
  const tt = Math.floor(t * 12) / 12;
  if (tt < 12.65) return 0;
  if (tt < 13.25) return lerp(0, -0.2, seg(tt, 12.65, 13.25));
  if (tt < 13.42) return lerp(-0.2, 0.58, seg(tt, 13.25, 13.42));
  return lerp(0.58, 0.46, Math.min(1, (tt - 13.42) / 0.4));
}

function drawHands(ctx, t) {
  if (t < 12.4 || t >= 18.15) return;
  const k = feedK(t);
  const ox = 700 + k * 240;
  const oy = 530;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-170, -24);
  ctx.lineTo(-36, -16);
  ctx.lineTo(-28, 42);
  ctx.lineTo(-160, 52);
  ctx.stroke();
  const fingers = [
    { a: -0.42, len: 78, w: 11, y: -18 },
    { a: -0.12, len: 92, w: 11, y: -6 },
    { a: 0.14, len: 86, w: 10, y: 8 },
    { a: 0.40, len: 70, w: 10, y: 18 },
  ];
  for (let i = 0; i < fingers.length; i++) {
    const f = fingers[i];
    const x0 = 8;
    const y0 = f.y;
    const x1 = x0 + Math.cos(f.a) * f.len;
    const y1 = y0 + Math.sin(f.a) * f.len;
    ctx.beginPath();
    ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, f.len / 2, f.w / 2, f.a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(-4, 18, 32, 22, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(-18, 8, 24, 2.2);
  ctx.fillRect(-12, 18, 22, 2.2);
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(36, -2);
  ctx.lineTo(200, -20);
  ctx.moveTo(36, 12);
  ctx.lineTo(204, -4);
  ctx.stroke();
  ctx.restore();
}

export function protectSkin(ctx, t) {
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#fff';
  if (showFigure(t)) {
    const f = faceAt(t);
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, 40, 48, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (t >= 12.4 && t < 18.15) {
    const k = feedK(t);
    const ox = 700 + k * 240;
    const oy = 530;
    ctx.beginPath();
    ctx.ellipse(ox - 4, oy + 18, 30, 20, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

export function drawCuts(ctx, t) {
  drawStrokes(ctx, t);
  drawArch(ctx, t);
  drawPots(ctx, t);
  drawKnife(ctx, t);
  drawEmber(ctx, t);
  drawFigure(ctx, t);
  drawHands(ctx, t);
}

export function drawHeat(ctx, t) {
  const h = heatAt(t);
  if (h.r < 3) return;
  const g = ctx.createRadialGradient(h.x, h.y, 6, h.x, h.y, h.r);
  g.addColorStop(0, 'rgba(200,80,42,1)');
  g.addColorStop(0.5, 'rgba(200,80,42,0.92)');
  g.addColorStop(1, 'rgba(200,80,42,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
  ctx.fill();
}

export function heatAt(t) {
  if (t < 8.15) return { x: MOUTH.x, y: MOUTH.y, r: 0 };
  if (t < 13.4) return { x: MOUTH.x, y: MOUTH.y, r: lerp(20, 58, ss(seg(t, 8.15, 11))) };
  if (t < 19.7) return { x: MOUTH.x, y: MOUTH.y, r: lerp(58, 84, ss(seg(t, 13.4, 16.5))) };
  if (t < 22.8) return { x: MOUTH.x, y: MOUTH.y, r: lerp(84, 640, ss(seg(t, 19.7, 21.9))) };
  const u = ss(seg(t, 22.8, 26.7));
  return {
    x: lerp(MOUTH.x, JAR.x, u),
    y: lerp(MOUTH.y, JAR.y - 18, u),
    r: lerp(640, 44, u),
  };
}

function jolt(t) {
  for (const c of CUTS) {
    const d = t - c;
    if (d >= 0 && d < 2 / 24) return d < 1 / 24 ? { x: 4, y: -2 } : { x: -3, y: 1 };
  }
  return { x: 0, y: 0 };
}

function shake(t) {
  let x = 0;
  let y = 0;
  for (const t0 of [13.42, 19.7]) {
    const d = t - t0;
    if (d >= 0 && d < 0.32) {
      const a = Math.exp(-d * 12);
      x += Math.sin(d * 86) * 5.5 * a;
      y += Math.cos(d * 64) * 3.2 * a;
    }
  }
  return { x, y };
}

export function camAt(t) {
  const j = jolt(t);
  const sh = shake(t);
  let cx;
  let cy;
  let s;
  if (t < 6.6) {
    const u = ss(clamp(t / 6.2));
    const p = archPoint(u);
    cx = p.x;
    cy = p.y;
    s = lerp(2.2, 1.48, ss(seg(t, 4.6, 6.6)));
  } else if (t < 12.4) {
    const u = ss(seg(t, 6.6, 11.2));
    const p = archPoint(1);
    cx = lerp(p.x, 1000, u);
    cy = lerp(p.y, 490, u);
    s = lerp(1.48, 1, u);
  } else if (t < 18.15) {
    const u = ss(seg(t, 12.4, 13.5));
    cx = lerp(1000, 880, u);
    cy = lerp(490, 520, u);
    s = lerp(1, 2.05, u);
  } else if (t < 26.15) {
    cx = 1000;
    cy = 490;
    s = 1;
  } else if (t < 28.7) {
    const u = 1 - Math.pow(1 - clamp((t - 26.15) / 0.16), 3);
    cx = lerp(1000, JAR.x, u);
    cy = lerp(490, JAR.y - 10, u);
    s = lerp(1, 2.35, u);
  } else if (t < 30.3) {
    const u = ss(seg(t, 28.7, 30.2));
    cx = lerp(JAR.x, 1040, u);
    cy = lerp(JAR.y - 10, 500, u);
    s = lerp(2.35, 1, u);
  } else {
    cx = 1040;
    cy = 500;
    s = 1;
  }
  return { cx: cx + j.x + sh.x, cy: cy + j.y + sh.y, s };
}

export function peelP(t) {
  if (t < 30.3) return -1;
  if (t < 31.5) return 0;
  if (t >= 33.25) return 1;
  return ei(seg(t, 31.5, 33.25));
}

export function captionAlpha(t, cue) {
  if (t < cue.t0 || t >= cue.t1) return 0;
  const inn = Math.min(1, (t - cue.t0) / 0.1);
  const out = cue.id === 'title' ? 1 : Math.min(1, (cue.t1 - t) / 0.15);
  return Math.min(inn, out);
}

void hash;
