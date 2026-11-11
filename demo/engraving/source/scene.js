// The Night Lamp — one plate, three states, one wash.
import { clamp, lerp, mulberry, seg, ss } from '/core/lib.js';
import { drawPoly, drawQuad, ellipsePoly, hatch, INK, pathOf, progress, schedule, walk } from './engine/ink.js';
import {
  drawPlateMark,
  drawRoman,
  drawRules,
  drawScript,
  drawSheet,
  drawSlip,
  drawWash,
  measureRoman,
  roundelFrame,
} from './engine/plate.js';
import { drawBurin, drawCopper, rakeAmount } from './engine/copper.js';

export const DUR = 38;

const CX = 820;
const CY = 548;

export const LINES = [
  { id: 'v01', t0: 4.55, t1: 8.45, text: 'Before dawn, the shell is shut.' },
  { id: 'v02', t0: 10.0, t1: 13.9, text: 'Each cut gives it weight.' },
  { id: 'v03', t0: 18.5, t1: 22.4, text: 'A region is burnished clear.' },
  { id: 'v04', t0: 27.05, t1: 30.95, text: 'One wash finds the lamp.' },
  { id: 'v05', t0: 33.64, t1: 37.45, text: 'The seed is the true size.' },
];

const COPY = {
  plate: { text: 'PLATE IV', x: 196, y: 150, size: 18, track: 1.6, t0: 11.15, step: 0.09, align: 'left' },
  title: { text: 'THE NIGHT LAMP', x: 820, y: 162, size: 50, track: 7.5, t0: 10.7, step: 0.075, align: 'center' },
  name: { text: 'Lumenconcha vespera', x: 820, y: 206, size: 23, track: 0.4, t0: 12.4, step: 0.06, align: 'center', italic: true },
  hinge: { text: 'hinge', x: 1088, y: 252, size: 18, track: 0.3, t0: 14.2, step: 0.07, align: 'left', italic: true },
  valve: { text: 'valve', x: 468, y: 608, size: 18, track: 0.3, t0: 15.1, step: 0.07, align: 'right', italic: true },
  wick: { text: 'wick', x: 1568, y: 596, size: 18, track: 0.3, t0: 26.5, step: 0.07, align: 'center', italic: true },
  nat: { text: 'natural size', x: 292, y: 908, size: 17, track: 0.2, t0: 34.15, step: 0.06, align: 'left', italic: true },
  sign: { text: 'I. Marrow del. et sculp.', x: 1760, y: 934, size: 16, track: 0.35, t0: 35.05, step: 0.055, align: 'right' },
};

const KEYS = [
  [0.0, 1.86, 800, 310],
  [3.05, 1.4, 800, 430],
  [4.55, 1.08, 900, 545],
  [10.0, 1.02, 940, 548],
  [16.2, 1.0, 940, 550],
  [18.15, 1.015, 948, 552],
  [19.6, 1.28, 990, 675],
  [23.4, 1.14, 1120, 590],
  [26.4, 1.06, 1020, 545],
  [32.6, 1.0, 860, 562],
  [38.0, 1.02, 860, 554],
];

function shellPoly() {
  const pts = [];
  const N = 110;
  for (let i = 0; i < N; i++) {
    const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
    const s = Math.sin(a);
    const belly = s * 0.5 + 0.5;
    const rx = 148 + Math.pow(belly, 0.8) * 128;
    pts.push({ x: CX + Math.cos(a) * rx, y: CY + s * 286 });
  }
  return pts;
}

function scaleAbout(pts, f, ox, oy) {
  return pts.map((p) => ({ x: ox + (p.x - ox) * f, y: oy + (p.y - oy) * f }));
}

function runs(pts, n, w, t0, t1) {
  const out = [];
  const N = pts.length;
  for (let r = 0; r < n; r++) {
    const i0 = Math.floor((r * N) / n);
    const i1 = Math.floor(((r + 1) * N) / n) + 3;
    const slice = [];
    for (let i = i0; i <= i1; i++) slice.push(pts[i % N]);
    const a = t0 + ((t1 - t0) * r) / n * 0.72;
    const b = a + (t1 - t0) / n * 0.85;
    out.push({ pts: slice, w, t0: a, t1: b });
  }
  return out;
}

function toneShell(x, y) {
  const rx = 250;
  const ry = 286;
  const dx = (x - CX) / rx;
  const dy = (y - CY) / ry;
  const r = Math.hypot(dx, dy);
  const gx = (x - CX) / (rx * rx);
  const gy = (y - CY) / (ry * ry);
  const gl = Math.hypot(gx, gy) || 1;
  const nd = (gx / gl) * -0.62 + (gy / gl) * -0.78;
  const nlen = Math.hypot(0.62, 0.78);
  let tone = clamp(0.48 - 0.9 * (nd / nlen), 0, 1);
  const rim = clamp((r - 0.58) / 0.42, 0, 1);
  tone = Math.max(tone * 0.82, rim * 0.92);
  const sut = Math.exp(-((x - CX) ** 2) / (2 * 15 * 15));
  return clamp(tone + sut * 0.22, 0, 1);
}

function build() {
  const raw = shellPoly();
  const start = Math.floor(raw.length * 0.86);
  const shell = raw.slice(start).concat(raw.slice(0, start));
  const origin = { x: CX, y: CY };
  const w1 = (tone) => 0.45 + tone * 1.65;
  const lines1 = hatch(shell, 0.55, 3.7, origin, toneShell, 0.14, w1, []);
  const lines2 = hatch(shell, 0.55 + 1.25, 4.8, origin, toneShell, 0.5, (tone) => (0.4 + tone * 1.5) * 0.8, []);
  const lines3 = hatch(shell, 0.55 + 0.62, 6.2, origin, toneShell, 0.75, (tone) => (0.35 + tone * 1.3) * 0.6, []);
  const mouthC = { x: 978, y: 692, rx: 86, ry: 64 };
  const wickC = { x: 986, y: 688, rx: 40, ry: 30 };
  const mouth = ellipsePoly(mouthC.x, mouthC.y, mouthC.rx, mouthC.ry, 56);
  const wick = ellipsePoly(wickC.x, wickC.y, wickC.rx, wickC.ry, 40);
  const mouthTone = (x, y) => {
    const u = (x - mouthC.x) / mouthC.rx;
    const v = (y - mouthC.y) / mouthC.ry;
    return clamp(Math.hypot(u, v) * 0.95, 0, 1);
  };
  const wickTone = (x, y) => {
    const u = (x - wickC.x) / wickC.rx;
    const v = (y - wickC.y) / wickC.ry;
    return clamp((Math.hypot(u, v) - 0.35) / 0.65, 0, 1) * 0.7;
  };
  const mouthH = hatch(mouth, 0.9, 3.4, mouthC, mouthTone, 0.22, (tone) => 0.4 + tone * 1.5, [ { x: wickC.x, y: wickC.y, r: 34 } ]);
  const wickH = hatch(wick, 1.2, 3.2, wickC, wickTone, 0.18, (tone) => 0.35 + tone * 1.1, []);
  const hinge = ellipsePoly(CX, 268, 40, 20, 32);
  const rnd = mulberry(11);
  const dots = [];
  let guard = 0;
  while (dots.length < 28 && guard < 800) {
    guard += 1;
    const x = CX + (rnd() * 2 - 1) * 32;
    const y = 268 + (rnd() * 2 - 1) * 14;
    const u = (x - CX) / 40;
    const v = (y - 268) / 20;
    if (u * u + v * v < 0.75) dots.push({ x, y, r: 0.45 + rnd() * 0.5, t0: 13.7 + dots.length * 0.06 });
  }
  const suture = [];
  for (let i = 0; i <= 28; i++) {
    const u = i / 28;
    const y = 300 + u * 500;
    suture.push({ x: CX + Math.sin(u * 9.5) * 5.5, y });
  }
  const growth = [0.78, 0.52].map((f) => scaleAbout(shell, f, CX, 280));
  const seed = ellipsePoly(236, 900, 15, 23, 28);
  const seedSeam = [
    { x: 236, y: 880 },
    { x: 238, y: 900 },
    { x: 234, y: 922 },
  ];
  return {
    shell,
    mouth,
    wick,
    mouthC,
    wickC,
    outlines: runs(shell, 4, 4.6, -0.85, 6.3),
    growth: growth.map((pts, i) => ({ pts, w: 1.7 - i * 0.35, t0: 6.4 + i * 1.1, t1: 8.6 + i * 1.1 })),
    suture: { pts: suture, w: 2.1, t0: 5.4, t1: 8.8 },
    hinge: { pts: hinge, w: 2.4, t0: 6.8, t1: 8.2 },
    hatch1: schedule(lines1, 6.05, 11.4, 980),
    hatch2: schedule(lines2, 10.5, 14.8, 1500),
    hatch3: schedule(lines3, 13.5, 16.15, 1750),
    mouthH: schedule(mouthH, 21.15, 23.5, 1100),
    wickH: schedule(wickH, 22.3, 23.9, 900),
    mouthLine: { pts: mouth, w: 3.1, t0: 21.05, t1: 23.15 },
    wickLine: { pts: wick, w: 2.2, t0: 22.15, t1: 23.55 },
    dots,
    seed,
    seedSeam,
  };
}

const MODEL = build();

function camera(t) {
  let i = 0;
  while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i += 1;
  const a = KEYS[i];
  const b = KEYS[Math.min(KEYS.length - 1, i + 1)];
  const u = ss(seg(t, a[0], b[0]));
  return { z: lerp(a[1], b[1], u), x: lerp(a[2], b[2], u), y: lerp(a[3], b[3], u) };
}

function applyCam(ctx, cam, flip, rake) {
  const z = cam.z;
  const squash = lerp(1, 0.78, rake);
  const shear = 0.28 * z * rake;
  const sx = z * flip;
  ctx.setTransform(sx, shear * 0.15, shear, z * squash, 960 - cam.x * sx, 540 - cam.y * z * squash);
}

function uOf(stroke, t) {
  return progress(stroke, t);
}

function drawHatches(ctx, list, t) {
  for (const s of list) {
    const u = uOf(s, t);
    if (u <= 0) continue;
    drawQuad(ctx, s.x0, s.y0, s.x1, s.y1, s.cx, s.cy, s.w, u);
  }
}

function drawOutline(ctx, stroke, t) {
  const u = uOf(stroke, t);
  if (u <= 0) return;
  drawPoly(ctx, stroke.pts, stroke.w, u);
}

function burnish(t) {
  return ss(seg(t, 18.18, 20.35));
}

function leader(ctx, t) {
  const p = ss(seg(t, 24.6, 26.3));
  if (p <= 0) return;
  const a = { x: 1064, y: 692 };
  const b = { x: 1288, y: 640 };
  const c = roundelXY(Math.max(t, 26.36));
  const rim = { x: c.x - 132 * c.grow, y: c.y };
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.85;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  const m = { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) };
  ctx.lineTo(m.x, m.y);
  if (p > 0.45) {
    const q = clamp((p - 0.45) / 0.55);
    ctx.lineTo(lerp(b.x, rim.x, q), lerp(b.y, rim.y, q));
  }
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(a.x, a.y, 2.1, 0, Math.PI * 2);
  ctx.fill();
  if (t > 24.7) {
    ctx.font = 'italic 600 16px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('3', a.x, a.y - 14);
  }
}

function roundelXY(t) {
  const p = ss(seg(t, 23.55, 26.36));
  let x;
  let y;
  if (p < 0.48) {
    const u = p / 0.48;
    x = lerp(1048, 1360, ss(u));
    y = lerp(692, 650, u);
  } else {
    const u = (p - 0.48) / 0.52;
    x = lerp(1360, 1568, ss(u));
    y = lerp(650, 430, ss(u));
  }
  y -= Math.sin(p * Math.PI) * 42;
  const grow = Math.exp(lerp(Math.log(0.4), Math.log(1), p));
  return { x, y, grow: t < 23.55 ? 0.4 : grow, p };
}

function drawRoundel(ctx, t) {
  if (t < 22.35) return;
  const scribe = seg(t, 22.4, 23.45);
  const fly = t >= 23.55;
  const pos = fly ? roundelXY(t) : { x: 986, y: 688, grow: 0.34 + scribe * 0.06, p: scribe };
  if (!fly && scribe <= 0) return;
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.scale(pos.grow, pos.grow);
  ctx.rotate(0);
  if (!fly) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 118, -Math.PI / 2, -Math.PI / 2 + scribe * Math.PI * 2);
    ctx.stroke();
  } else {
    roundelFrame(ctx, 132);
    const wp = ss(seg(t, 27.35, 30.4));
    if (wp > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(4, 0, 46, 36, 0, 0, Math.PI * 2);
      ctx.clip();
      drawWash(ctx, 4, -1, 34, wp, 2.2);
      ctx.restore();
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = INK;
    const shown = ss(seg(t, 23.7, 25.4));
    for (let i = 0; i < 16; i++) {
      if (i / 16 > shown) break;
      const y = -36 + i * 5;
      drawQuad(ctx, -34, y, 34, y + 2, 0, y - 3, 1.1, 1);
    }
    ctx.restore();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.ellipse(4, 0, 40, 30, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawInterior(ctx, t) {
  const bp = burnish(t);
  ctx.save();
  pathOf(ctx, MODEL.shell);
  ctx.clip();
  if (bp > 0.002) {
    ctx.beginPath();
    ctx.rect(-2000, -2000, 8000, 8000);
    ctx.ellipse(MODEL.mouthC.x, MODEL.mouthC.y, MODEL.mouthC.rx * bp, MODEL.mouthC.ry * bp, 0, 0, Math.PI * 2);
    ctx.clip('evenodd');
  }
  ctx.fillStyle = INK;
  drawOutline(ctx, MODEL.suture, t);
  drawHatches(ctx, MODEL.hatch1, t);
  drawHatches(ctx, MODEL.hatch2, t);
  drawHatches(ctx, MODEL.hatch3, t);
  for (const d of MODEL.dots) {
    if (t < d.t0) continue;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawOpening(ctx, t) {
  if (t < 21.0) return;
  ctx.save();
  pathOf(ctx, MODEL.mouth);
  ctx.clip();
  ctx.fillStyle = INK;
  drawHatches(ctx, MODEL.mouthH, t);
  drawHatches(ctx, MODEL.wickH, t);
  ctx.restore();
  ctx.fillStyle = INK;
  drawOutline(ctx, MODEL.mouthLine, t);
  drawOutline(ctx, MODEL.wickLine, t);
}

function drawSeed(ctx, t) {
  if (t < 33.2) return;
  const u = ss(seg(t, 33.2, 34.25));
  ctx.fillStyle = INK;
  drawPoly(ctx, MODEL.seed, 1.8, u);
  drawPoly(ctx, MODEL.seedSeam, 1.1, ss(seg(t, 33.7, 34.35)));
}

function drawProof(ctx, t) {
  drawSheet(ctx);
  drawPlateMark(ctx);
  drawRules(ctx, t);
  const washP = ss(seg(t, 26.55, 30.2));
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(MODEL.wickC.x, MODEL.wickC.y, MODEL.wickC.rx + 6, MODEL.wickC.ry + 5, 0, 0, Math.PI * 2);
  ctx.clip();
  drawWash(ctx, MODEL.wickC.x + 2, MODEL.wickC.y - 1, 36, washP, 1);
  ctx.restore();
  ctx.fillStyle = INK;
  drawInterior(ctx, t);
  for (const stroke of MODEL.outlines) drawOutline(ctx, stroke, t);
  drawOutline(ctx, MODEL.hinge, t);
  drawOpening(ctx, t);
  drawRoundel(ctx, t);
  leader(ctx, t);
  labelLeader(ctx, t);
  drawSeed(ctx, t);
  for (const key of ['plate', 'title', 'name', 'hinge', 'valve', 'wick', 'nat', 'sign']) {
    const c = COPY[key];
    drawRoman(ctx, c.text, c.x, c.y, c.size, c.track, t, c.t0, c.step, c.align, c.italic);
  }
  drawScript(ctx, 'kept by the night tide', 760, 888, 26, t, 30.9, 1.7);
}

function labelLeader(ctx, t) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.8;
  ctx.fillStyle = INK;
  if (t >= 14.35) {
    const p = ss(seg(t, 14.35, 15.15));
    ctx.beginPath();
    ctx.moveTo(862, 274);
    ctx.lineTo(lerp(862, 1072, p), 262);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(862, 274, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'italic 600 15px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', 1004, 246);
  }
  if (t >= 15.25) {
    const p = ss(seg(t, 15.25, 16.05));
    ctx.beginPath();
    ctx.moveTo(575, 608);
    ctx.lineTo(lerp(575, 478, p), 608);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(575, 608, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'italic 600 15px "Cormorant Garamond", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('2', 548, 590);
  }
}

function burinTip(t) {
  const runs = MODEL.outlines;
  for (const stroke of runs) {
    const u = uOf(stroke, t);
    if (u > 0 && u < 1) return walk(stroke.pts, u);
  }
  const last = runs[0];
  return walk(last.pts, uOf(last, t));
}

function worldBox(cam, x, y, w, h) {
  const sx = (x - cam.x) * cam.z + 960;
  const sy = (y - cam.y) * cam.z + 540;
  return { x0: sx - (w * cam.z) / 2, y0: sy - (h * cam.z) / 2, x1: sx + (w * cam.z) / 2, y1: sy + (h * cam.z) / 2 };
}

export function textsAt(ctx, t) {
  const cam = camera(Math.max(0, Math.min(DUR, t)));
  const items = [];
  const add = (id, text, x, y, w, h, t0) => {
    if (t < t0 || w < 2) return;
    const box = worldBox(cam, x, y, w, h);
    if (box.x0 < 1 || box.y0 < 1 || box.x1 > 1919 || box.y1 > 1079) return;
    items.push({ id, text, x0: box.x0, y0: box.y0, x1: box.x1, y1: box.y1 });
  };
  for (const [id, c] of Object.entries(COPY)) {
    const w = measureRoman(ctx, c.text, c.size, c.track, c.italic);
    const ax = c.align === 'center' ? c.x : c.align === 'right' ? c.x - w / 2 : c.x + w / 2;
    add(id, c.text, ax, c.y, w, c.size * 1.25, c.t0);
  }
  if (t >= 30.9) {
    ctx.font = 'italic 500 26px "Cormorant Garamond", serif';
    const w = ctx.measureText('kept by the night tide').width;
    add('note', 'kept by the night tide', 760 + w / 2, 888, w, 34, 30.9);
  }
  if (t >= 24.7) add('n3', '3', 1064, 678, 16, 18, 24.7);
  if (t >= 14.35) add('n1', '1', 1004, 246, 14, 18, 14.35);
  if (t >= 15.25) add('n2', '2', 548, 590, 14, 18, 15.25);
  return items;
}

function peelEdge(t) {
  return ss(seg(t, 3.2, 4.55));
}

export function renderFrame(ctx, t) {
  const cam = camera(Math.max(0, Math.min(DUR, t)));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#5c331c';
  ctx.fillRect(0, 0, 1920, 1080);
  const peel = peelEdge(t);
  if (t < 4.58) {
    const rake = rakeAmount(t);
    const flip = -1;
    applyCam(ctx, cam, flip, rake);
    drawCopper(ctx);
    ctx.save();
    ctx.translate(-1.1, -1.0);
    ctx.fillStyle = '#f3e2c8';
    for (const stroke of MODEL.outlines) drawOutline(ctx, stroke, t);
    ctx.restore();
    ctx.fillStyle = '#140e0c';
    for (const stroke of MODEL.outlines) drawOutline(ctx, stroke, t);
    if (t < 3.15) {
      const tip = burinTip(Math.max(0.05, t));
      drawBurin(ctx, tip.x, tip.y, tip.ang, t);
    }
  }
  if (t > 3.18) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (peel < 0.999) {
      const edge = lerp(-80, 2200, peel);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(edge, 0);
      ctx.lineTo(edge - 240, 1080);
      ctx.lineTo(0, 1080);
      ctx.closePath();
      ctx.clip();
    }
    applyCam(ctx, cam, 1, 0);
    drawProof(ctx, t);
    ctx.restore();
    if (peel < 0.999 && peel > 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const edge = lerp(-80, 2200, peel);
      const grd = ctx.createLinearGradient(edge - 240, 0, edge + 30, 0);
      grd.addColorStop(0, 'rgba(60, 40, 24, 0)');
      grd.addColorStop(0.7, 'rgba(70, 48, 28, 0.18)');
      grd.addColorStop(1, 'rgba(255, 248, 230, 0.55)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(edge, -10);
      ctx.lineTo(edge - 240, 1090);
      ctx.stroke();
      ctx.restore();
    }
  }
  for (const line of LINES) drawSlip(ctx, line.text, line.t0, line.t1, t);
}

function romanTicks(spec) {
  const ev = [];
  for (let i = 0; i < spec.text.length; i++) {
    if (spec.text[i] === ' ') continue;
    ev.push({ t: +(spec.t0 + i * spec.step).toFixed(3), type: 'tick' });
  }
  return ev;
}

export function makeEvents() {
  const ev = [
    { t: 0.05, type: 'burin', dur: 3.15 },
    { t: 0.55, type: 'clock' },
    { t: 3.2, type: 'peel' },
    { t: 4.55, type: 'thump' },
    { t: 6.2, type: 'hatch', n: 4 },
    { t: 8.7, type: 'clock' },
    { t: 10.6, type: 'hatch', n: 7 },
    { t: 13.6, type: 'hatch', n: 5 },
    { t: 18.18, type: 'burnish', dur: 2.05 },
    { t: 21.1, type: 'hatch', n: 4 },
    { t: 22.45, type: 'scribe' },
    { t: 23.55, type: 'whoosh' },
    { t: 26.36, type: 'land' },
    { t: 26.36, type: 'plip' },
    { t: 27.05, type: 'brush', dur: 2.6 },
    { t: 30.9, type: 'scratch' },
    { t: 33.2, type: 'tick' },
    { t: 35.4, type: 'clock' },
  ];
  for (const line of LINES) ev.push({ t: line.t0, type: 'line', id: line.id });
  for (const line of LINES) ev.push({ t: line.t0, type: 'tap' });
  for (const key of Object.keys(COPY)) ev.push(...romanTicks(COPY[key]));
  ev.sort((a, b) => a.t - b.t);
  return ev;
}
