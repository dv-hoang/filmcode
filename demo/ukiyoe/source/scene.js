// One Rectangle — the shore sheet, two impressions, and the tide that leaves it.
import { clamp, lerp, seg, ss } from '/core/lib.js';
import {
  W, H, PAPER, SUMI, BLUE, BLUE_DEEP, BLUE_PALE, OCHRE, OCHRE_DEEP, GREEN, GREEN_PALE,
  INDIGO, BENI, MOUNT, CREAM, KEY_GREY, INNER,
  buildTextures, bake, bokashi, ribbon, drawFibres, drawSeal, drawPaper, inkBorder,
  clipInner, revealClip, writeVertical, textureDynamic, n1, canvas,
} from './print.js';

const RECT = { x: 860, y: 608, w: 720, h: 246 };
const BLUE_OFF = [2.1, -1.5];
const GREEN_OFF = [-2.0, 1.7];
const RED_OFF = [1.6, 2.2];

export const MORNING_CARD = { x: 1672, y: 156, w: 92, h: 520 };
export const EVENING_CARD = { x: 1490, y: 300, w: 94, h: 600 };
export const SEAL_AT = { x: 1296, y: 548, s: 64 };

const MORNING_STROKES = [
  { t0: 8.25, t1: 8.95, x0: 1488, x1: 1040, y: 692 },
  { t0: 9.125, t1: 9.85, x0: 1504, x1: 1010, y: 728 },
  { t0: 10.0, t1: 10.75, x0: 1472, x1: 990, y: 762 },
];

function eveningStrokes() {
  const gaps = [0.62, 0.5, 0.4, 0.36, 0.44, 0.58, 0.78];
  const out = [];
  let t = 27.2;
  for (let i = 0; i < gaps.length; i++) {
    const g = gaps[i];
    out.push({ t0: t, t1: t + g * 0.82, x0: 1510, x1: 1000, y: 676 + i * 18 });
    t += g;
  }
  return out;
}
const EVENING_STROKES = eveningStrokes();

let BLUE_M = null;
let GREEN_M = null;
let KEY = null;
let BLUE_E = null;
let GREEN_E = null;
let RED_E = null;
let SCRATCH = null;

export function prepareScene() {
  buildTextures();
  BLUE_M = bake((g) => {
    bokashi(g, BLUE, PAPER, 36, 478, 26, 1.2);
    sandbar(g, BLUE_PALE);
  }, 'sky');
  GREEN_M = bake((g) => {
    shore(g, OCHRE, '#b8944c');
    pine(g, 280, 560, 1.7, GREEN_PALE, null);
  }, 'land');
  KEY = bake((g) => {
    g.fillStyle = SUMI;
    g.strokeStyle = SUMI;
    horizon(g);
    rectBorder(g);
    grooves(g);
    pine(g, 280, 560, 1.7, null, KEY_GREY);
    sandbarLine(g);
  }, 'key');
  BLUE_E = bake((g) => {
    bokashi(g, BLUE_DEEP, BLUE, 36, 500, 24, 4.4);
  }, 'sky');
  GREEN_E = bake((g) => {
    shore(g, OCHRE_DEEP, '#8d6c38');
    pine(g, 280, 560, 1.7, GREEN, null);
  }, 'land');
  RED_E = bake((g) => {
    g.fillStyle = BENI;
    g.beginPath();
    g.arc(1596, 392, 40, 0, 6.2832);
    g.fill();
  }, 'red');
}

function sandbar(g, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(380, 470);
  g.lineTo(1120, 458);
  g.lineTo(1120, 492);
  g.lineTo(380, 498);
  g.closePath();
  g.fill();
}

function sandbarLine(g) {
  g.fillStyle = KEY_GREY;
  ribbon(g, wobble(380, 468, 1120, 456, 3), 1.15, 6, false);
}

function shore(g, col, near) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(INNER.l, 466);
  g.lineTo(INNER.r, 484);
  g.lineTo(INNER.r, INNER.b);
  g.lineTo(INNER.l, INNER.b);
  g.closePath();
  g.fill();
  g.fillStyle = near;
  g.beginPath();
  g.moveTo(INNER.l, 868);
  g.lineTo(INNER.r, 884);
  g.lineTo(INNER.r, INNER.b);
  g.lineTo(INNER.l, INNER.b);
  g.closePath();
  g.fill();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  g.fillRect(RECT.x, RECT.y, RECT.w, RECT.h);
  g.globalCompositeOperation = 'source-over';
}

function horizon(g) {
  g.fillStyle = SUMI;
  ribbon(g, wobble(INNER.l + 8, 472, INNER.r - 8, 488, 2), 2.2, 4, false);
}

function wobble(x0, y0, x1, y1, seed) {
  const pts = [];
  for (let i = 0; i <= 7; i++) {
    const u = i / 7;
    pts.push([
      lerp(x0, x1, u) + (n1(seed + i * 0.7) - 0.5) * 3,
      lerp(y0, y1, u) + (n1(seed + 9 + i * 0.7) - 0.5) * 2.4,
    ]);
  }
  return pts;
}

function rectBorder(g) {
  const x = RECT.x;
  const y = RECT.y;
  const r = RECT.x + RECT.w;
  const b = RECT.y + RECT.h;
  g.fillStyle = SUMI;
  ribbon(g, wobble(x, y, r, y, 12), 2.5, 12, false);
  ribbon(g, wobble(r, y, r, b, 13), 2.5, 13, false);
  ribbon(g, wobble(r, b, x, b, 14), 2.5, 14, false);
  ribbon(g, wobble(x, b, x, y, 15), 2.5, 15, false);
}

function grooves(g) {
  g.save();
  g.beginPath();
  g.rect(RECT.x + 8, RECT.y + 8, RECT.w - 16, RECT.h - 16);
  g.clip();
  g.strokeStyle = '#3a342c';
  g.lineCap = 'round';
  const slant = 16;
  for (let i = 0; i < 11; i++) {
    const y = RECT.y + 20 + i * 20;
    g.lineWidth = 1.15 + n1(i * 1.7 + 2) * 0.7;
    const x0 = RECT.x + 18;
    const x1 = RECT.x + RECT.w - 18;
    for (let k = 0; k < 3; k++) {
      const a = x0 + (x1 - x0) * (k / 3) + 6;
      const b = x0 + (x1 - x0) * ((k + 0.82) / 3);
      const ya = y + (a - x0) / (x1 - x0) * slant;
      const yb = y + (b - x0) / (x1 - x0) * slant;
      g.beginPath();
      g.moveTo(a, ya);
      g.lineTo(b, yb);
      g.stroke();
    }
  }
  g.restore();
}

function drawPineFill(g, x, y, sc, col) {
  g.fillStyle = col;
  const tiers = [
    { dy: -30, w: 46, h: 20 },
    { dy: -52, w: 32, h: 16 },
    { dy: -70, w: 20, h: 13 },
  ];
  g.fillRect(x - 2.2 * sc, y - 34 * sc, 4.4 * sc, 36 * sc);
  for (const tier of tiers) {
    const py = y + tier.dy * sc;
    const ww = tier.w * sc;
    const hh = tier.h * sc;
    g.beginPath();
    g.moveTo(x - ww, py + hh * 0.45);
    g.lineTo(x - ww * 0.55, py);
    g.lineTo(x + ww * 0.55, py);
    g.lineTo(x + ww, py + hh * 0.5);
    g.lineTo(x + ww * 0.1, py + hh);
    g.lineTo(x - ww * 0.15, py + hh * 0.92);
    g.closePath();
    g.fill();
  }
}

function drawPineKey(g, x, y, sc, col) {
  g.strokeStyle = col;
  g.fillStyle = col;
  g.lineWidth = 1.4;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - 72 * sc);
  g.stroke();
  const tiers = [
    { dy: -30, w: 46, h: 20 },
    { dy: -52, w: 32, h: 16 },
    { dy: -70, w: 20, h: 13 },
  ];
  for (const tier of tiers) {
    const py = y + tier.dy * sc;
    const ww = tier.w * sc;
    const hh = tier.h * sc;
    g.beginPath();
    g.moveTo(x - ww * 0.7, py + 2);
    g.lineTo(x + ww * 0.7, py + 1);
    g.stroke();
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(x + i * ww * 0.18, py);
      g.lineTo(x + i * ww * 0.22, py + hh * (0.55 + (Math.abs(i) % 2) * 0.25));
      g.stroke();
    }
  }
}

function pine(g, x, y, sc, fill, key) {
  if (fill) drawPineFill(g, x, y, sc, fill);
  if (key) drawPineKey(g, x, y, sc, key);
}

function stepOf(t) {
  return Math.floor(Math.max(0, t) * 8) / 8;
}

function strokeAt(s, list) {
  for (const w of list) {
    if (s < w.t0 || s > w.t1) continue;
    const u = ss((s - w.t0) / (w.t1 - w.t0));
    return { x: lerp(w.x0, w.x1, u), y: w.y };
  }
  return null;
}

function poseAt(t) {
  const s = stepOf(t);
  const baseX = 528;
  const baseY = 812;
  if (s >= 18.35 && s < 26.15) return { show: false };
  if (s >= 32.4) return { show: true, baseX, baseY, bob: 0, lean: 0, mode: 'rest', restU: 1, bx: 0, by: 0 };
  if (s >= 31.05) {
    return { show: true, baseX, baseY, bob: 0, lean: lerp(8, 0, seg(s, 31.05, 32.4)), mode: 'rest', restU: seg(s, 31.05, 32.4), bx: 0, by: 0 };
  }
  if (s >= 27.15) {
    const hit = strokeAt(s, EVENING_STROKES);
    const bob = (Math.floor(s * 8) % 2) * 2;
    if (hit) return { show: true, baseX, baseY, bob, lean: 16, mode: 'work', restU: 0, bx: hit.x, by: hit.y };
    return { show: true, baseX, baseY, bob: 0, lean: 8, mode: 'work', restU: 0, bx: 1360, by: 724 };
  }
  if (s >= 26.15) {
    const u = seg(s, 26.15, 27.15);
    return { show: true, baseX, baseY, bob: 0, lean: lerp(0, 12, u), mode: 'work', restU: 0, bx: lerp(690, 1420, u), by: lerp(610, 700, u) };
  }
  if (s >= 11.5) return { show: true, baseX, baseY, bob: 0, lean: 0, mode: 'up', restU: 0, bx: 646, by: 546 };
  if (s >= 10.85) {
    const u = seg(s, 10.85, 11.5);
    return { show: true, baseX, baseY, bob: 0, lean: lerp(10, 0, u), mode: 'up', restU: 0, bx: lerp(1080, 646, u), by: lerp(760, 546, u) };
  }
  if (s >= 8.2) {
    const hit = strokeAt(s, MORNING_STROKES);
    const bob = hit ? (Math.floor(s * 8) % 2) * 2 : 0;
    if (hit) return { show: true, baseX, baseY, bob, lean: 16, mode: 'work', restU: 0, bx: hit.x, by: hit.y };
    return { show: true, baseX, baseY, bob: 0, lean: 10, mode: 'work', restU: 0, bx: 1320, by: 736 };
  }
  return { show: true, baseX, baseY, bob: 0, lean: 12, mode: 'work', restU: 0, bx: 1348, by: 744 };
}

function figureAlpha(t) {
  if (t < 17.15) return 1;
  if (t < 18.45) return 1 - ss(seg(t, 17.15, 18.45));
  if (t < 26.15) return 0;
  if (t < 26.7) return ss(seg(t, 26.15, 26.7));
  return 1;
}

function morningAlpha(t) {
  if (t < 17.35) return 1;
  if (t > 20.15) return 0;
  return 1 - ss(seg(t, 17.35, 20.15));
}

function blit(ctx, img, alpha, zoom, off, slide) {
  if (!img || alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, off[0] / zoom + slide / zoom, off[1] / zoom + (slide * 0.22) / zoom);
  ctx.restore();
}

function roller(ctx) {
  ctx.save();
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(1904, 36, 58, 1036);
  ctx.fillStyle = '#5e3d22';
  ctx.fillRect(1904, 36, 9, 1036);
  ctx.fillStyle = '#c4a15a';
  ctx.fillRect(1952, 36, 7, 1036);
  ctx.fillStyle = '#4e321c';
  ctx.fillRect(1896, 24, 74, 18);
  ctx.fillRect(1896, 1064, 74, 18);
  ctx.restore();
}

function post(ctx) {
  ctx.save();
  ctx.fillStyle = OCHRE_DEEP;
  ctx.beginPath();
  ctx.moveTo(132, 790);
  ctx.lineTo(176, 776);
  ctx.lineTo(198, 1140);
  ctx.lineTo(146, 1152);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SUMI;
  ribbon(ctx, [[154, 800], [168, 1136]], 2.4, 30, true);
  ribbon(ctx, [[176, 786], [190, 1124]], 2.2, 31, true);
  ctx.restore();
}

function viewCard(ctx, rect, title, alpha, slide) {
  if (alpha <= 0.001) return;
  const x = rect.x;
  const y = rect.y + (1 - alpha) * 12 + slide;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha * 1.15);
  ctx.fillStyle = CREAM;
  ctx.fillRect(x, y, rect.w, rect.h);
  ctx.fillStyle = '#efd2c2';
  ctx.fillRect(x + 7, y + 8, rect.w - 14, 188);
  ctx.strokeStyle = SUMI;
  ctx.lineWidth = 1.05;
  ctx.strokeRect(x - 5, y - 5, rect.w + 10, rect.h + 10);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, rect.w, rect.h);
  writeVertical(ctx, 'SHORE SHEETS', x + rect.w / 2, y + 18, 18, false);
  writeVertical(ctx, title, x + rect.w / 2, y + 214, title.length > 12 ? 23 : 28, true);
  drawSeal(ctx, x + rect.w + 24, y + rect.h - 40, 32);
  ctx.restore();
}

function mist(ctx, y, h, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(160, 0, 1760, 0);
  g.addColorStop(0, 'rgba(243,230,200,0)');
  g.addColorStop(0.14, 'rgba(243,230,200,0.94)');
  g.addColorStop(0.86, 'rgba(243,230,200,0.94)');
  g.addColorStop(1, 'rgba(243,230,200,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(960, y, 780, h, 0, 0, 6.2832);
  ctx.fill();
  ctx.restore();
}

function waterPoly(t) {
  const tw = Math.floor(t * 12) / 12;
  const spread = ss(seg(t, 14, 16.3));
  const rise = ss(seg(t, 14.4, 18.4));
  const left = lerp(1788, INNER.l + 12, spread);
  const base = lerp(1080, 448, rise);
  const pts = [];
  for (let x = left; x <= INNER.r - 10; x += 18) {
    const n = (n1(x * 0.018 + tw * 2.5) - 0.5) * 16;
    pts.push([x, base + n]);
  }
  return pts;
}

function traceWater(ctx, pts) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], 1340);
  ctx.lineTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineTo(pts[pts.length - 1][0], 1340);
  ctx.closePath();
}

function waterSheet(t) {
  const a = waterAlpha(t);
  if (a <= 0.001) return null;
  const pts = waterPoly(t);
  if (pts.length < 2) return null;
  const tall = 1500;
  if (!SCRATCH) SCRATCH = canvas(W, tall);
  const g = SCRATCH.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, W, tall);
  traceWater(g, pts);
  g.fillStyle = BLUE;
  g.fill();
  g.save();
  traceWater(g, pts);
  g.clip();
  g.fillStyle = BLUE_DEEP;
  g.beginPath();
  g.moveTo(pts[0][0], 1500);
  for (const p of pts) g.lineTo(p[0], p[1] + 78);
  g.lineTo(pts[pts.length - 1][0], 1500);
  g.closePath();
  g.fill();
  g.fillStyle = BLUE_PALE;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1] + 42);
  for (const p of pts) g.lineTo(p[0], p[1] + 42);
  for (let i = pts.length - 1; i >= 0; i--) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fill();
  textureDynamic(g);
  g.restore();
  g.fillStyle = PAPER;
  for (let i = 0; i < pts.length; i += 2) {
    const p = pts[i];
    const rw = 7 + n1(i * 0.4 + 2) * 9;
    g.beginPath();
    g.ellipse(p[0], p[1], rw, 4.5 + (i % 3), 0, 0, 6.2832);
    g.fill();
  }
  return { canvas: SCRATCH, alpha: a };
}

function waterAlpha(t) {
  if (t < 13.95 || t > 21.05) return 0;
  const inn = ss(seg(t, 13.95, 14.45));
  const out = 1 - ss(seg(t, 19.25, 21.0));
  return clamp(inn * out);
}

function drawRake(ctx, pose, zoom) {
  const y = pose.baseY + pose.bob;
  const hands = { x: pose.baseX + 86 + pose.lean, y: y - 82 };
  let ax;
  let ay;
  let bx;
  let by;
  let teethDown = true;
  if (pose.mode === 'rest') {
    const u = pose.restU;
    ax = lerp(hands.x, 930, u);
    ay = lerp(hands.y, 846, u);
    bx = lerp(pose.bx || 1100, 1260, u);
    by = lerp(pose.by || 790, 874, u);
    if (u > 0.35) {
      ax = lerp(hands.x, 948, u);
      ay = lerp(hands.y, 848, u);
    }
    teethDown = true;
  } else if (pose.mode === 'up') {
    ax = hands.x;
    ay = hands.y;
    bx = pose.bx;
    by = pose.by;
    teethDown = false;
  } else {
    ax = hands.x;
    ay = hands.y;
    bx = pose.bx;
    by = pose.by;
    teethDown = true;
  }
  const span = (x0, y0, x1, y1) => {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const u = i / 6;
      pts.push([lerp(x0, x1, u), lerp(y0, y1, u)]);
    }
    return pts;
  };
  const bar = 76;
  const tooth = teethDown ? 64 : -58;
  ctx.save();
  ctx.translate(GREEN_OFF[0] / zoom, GREEN_OFF[1] / zoom);
  ctx.strokeStyle = OCHRE_DEEP;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.moveTo(bx - bar, by);
  ctx.lineTo(bx + bar, by);
  ctx.stroke();
  ctx.lineWidth = 3.5;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(bx + i * 20, by);
    ctx.lineTo(bx + i * 20, by + tooth);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = SUMI;
  ribbon(ctx, span(ax, ay, bx, by), 2.5, 40, true);
  ribbon(ctx, span(bx - bar, by, bx + bar, by), 2.3, 41, true);
  for (let i = -3; i <= 3; i++) {
    ribbon(ctx, span(bx + i * 20, by, bx + i * 20, by + tooth), 1.7, 50 + i, true);
  }
}

function drawFigure(ctx, pose, zoom, alpha) {
  if (!pose.show || alpha <= 0.001) return;
  const y = pose.baseY + pose.bob;
  const x = pose.baseX;
  const lean = pose.lean;
  const head = { x: x + 24 + lean * 0.45, y: y - 118 };
  const hands = { x: x + 86 + lean, y: y - 82 };
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.ellipse(head.x, head.y, 16, 18, 0, 0, 6.2832);
  ctx.fill();
  if (pose.mode !== 'rest' || pose.restU < 0.85) {
    ctx.beginPath();
    ctx.ellipse(hands.x, hands.y, 7, 6, 0, 0, 6.2832);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(BLUE_OFF[0] / zoom, BLUE_OFF[1] / zoom);
  ctx.fillStyle = INDIGO;
  ctx.beginPath();
  ctx.moveTo(x + 4 + lean * 0.35, y - 100);
  ctx.lineTo(x + 36 + lean, y - 96);
  ctx.lineTo(x + 54 + lean * 0.45, y - 68);
  ctx.lineTo(x + 32 + lean * 0.2, y - 60);
  ctx.lineTo(x + 42, y - 28);
  ctx.lineTo(x - 10, y - 34);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(RED_OFF[0] / zoom, RED_OFF[1] / zoom);
  ctx.fillStyle = BENI;
  ctx.fillRect(x - 4, y - 58, 48 + lean * 0.3, 9);
  ctx.restore();

  ctx.fillStyle = SUMI;
  ctx.strokeStyle = SUMI;
  ctx.lineWidth = 2.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.ellipse(head.x - 12, head.y - 6, 8, 10, -0.4, 0, 6.2832);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(head.x, head.y, 16, 18, 0, 0, 6.2832);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(head.x + 4, head.y - 4);
  ctx.lineTo(head.x + 12, head.y - 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(head.x + 5, head.y + 6);
  ctx.lineTo(head.x + 11, head.y + 7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 8 + lean * 0.3, y - 100);
  ctx.lineTo(x + 38 + lean, y - 96);
  ctx.lineTo(x + 52 + lean * 0.4, y - 70);
  ctx.lineTo(x + 30, y - 62);
  ctx.lineTo(x + 40, y - 30);
  ctx.lineTo(x - 8, y - 34);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 32);
  ctx.lineTo(x + 2, y - 4);
  ctx.moveTo(x + 28, y - 30);
  ctx.lineTo(x + 34, y - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 2, y);
  ctx.lineTo(x + 16, y);
  ctx.moveTo(x + 24, y);
  ctx.lineTo(x + 42, y + 1);
  ctx.stroke();
  if (pose.mode === 'rest' && pose.restU > 0.7) {
    ctx.beginPath();
    ctx.moveTo(x + 34, y - 78);
    ctx.lineTo(x + 58, y - 36);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + 40 + lean * 0.3, y - 78);
    ctx.lineTo(hands.x, hands.y);
    ctx.stroke();
  }
  drawRake(ctx, pose, zoom);
  ctx.restore();
}

function bird(ctx, t) {
  const s = stepOf(t);
  let x = 0;
  let y = 0;
  let show = false;
  if (s >= 8.6 && s <= 11.3) {
    show = true;
    x = 1540 - (s - 8.6) * 36;
    y = 188 + Math.sin(s * 6) * 6;
  } else if (s >= 33.6 && s <= 36.3) {
    show = true;
    x = 980 - (s - 33.6) * 28;
    y = 210 + Math.sin(s * 5) * 5;
  }
  if (!show) return;
  ctx.save();
  ctx.strokeStyle = SUMI;
  ctx.lineWidth = 1.7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 14, y + 2);
  ctx.quadraticCurveTo(x - 4, y + 8, x, y);
  ctx.quadraticCurveTo(x + 8, y - 8, x + 18, y - 2);
  ctx.stroke();
  ctx.restore();
}

function mount(ctx) {
  ctx.fillStyle = MOUNT;
  ctx.fillRect(-200, -80, 2400, 1600);
  ctx.fillStyle = '#c2ad86';
  ctx.fillRect(-200, 1080, 2400, 360);
  roller(ctx);
}

export function paintScene(ctx, t, cam) {
  const zoom = cam.z;
  mount(ctx);
  drawPaper(ctx);
  ctx.save();
  clipInner(ctx);

  const mA = morningAlpha(t);
  blit(ctx, BLUE_M, mA, zoom, BLUE_OFF, 0);
  blit(ctx, GREEN_M, mA, zoom, GREEN_OFF, 0);
  if (t < 24) {
    const k = t < 17.6 ? 1 : lerp(1, 0.18, ss(seg(t, 17.6, 20.3)));
    blit(ctx, KEY, Math.min(k, t < 17.6 ? 1 : k), zoom, [0, 0], 0);
  } else if (t < 24.36) {
    blit(ctx, KEY, 0.18, zoom, [0, 0], 0);
    const u = seg(t, 24, 24.34);
    ctx.save();
    revealClip(ctx, u);
    blit(ctx, KEY, 1, zoom, [0, 0], (1 - ss(u)) * 6);
    ctx.restore();
  } else {
    blit(ctx, KEY, 1, zoom, [0, 0], 0);
  }

  if (t >= 24) {
    const blocks = [
      [BLUE_E, 24.0, BLUE_OFF],
      [GREEN_E, 26.4, GREEN_OFF],
      [RED_E, 26.45, RED_OFF],
    ];
    for (const [img, t0, off] of blocks) {
      if (t < t0) continue;
      const u = ss(seg(t, t0, t0 + 0.32));
      ctx.save();
      revealClip(ctx, u);
      blit(ctx, img, 1, zoom, off, (1 - u) * 6);
      ctx.restore();
    }
  }

  if (mA > 0.05) mist(ctx, 512, 18, 0.45 * mA);
  if (t > 26.5) mist(ctx, 508, 26, ss(seg(t, 26.5, 27.1)) * 0.85);

  const pose = poseAt(t);
  drawFigure(ctx, pose, zoom, figureAlpha(t));
  bird(ctx, t);

  ctx.restore();

  const wet = waterSheet(t);
  if (wet) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(INNER.l, INNER.t, INNER.r - INNER.l, INNER.b - INNER.t);
    ctx.clip();
    ctx.globalAlpha = wet.alpha;
    ctx.drawImage(wet.canvas, 0, 0);
    ctx.restore();
  }

  ctx.save();
  clipInner(ctx);
  drawFibres(ctx, 0.09);
  ctx.restore();

  inkBorder(ctx);

  if (wet) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(INNER.l, INNER.b - 8, INNER.r - INNER.l, 430);
    ctx.clip();
    ctx.globalAlpha = wet.alpha;
    ctx.drawImage(wet.canvas, 0, 0);
    ctx.restore();
  }

  post(ctx);

  const mCard = t < 14.2 ? clamp(Math.min(seg(t, 8.0, 8.32), 1 - seg(t, 13.35, 13.95))) : 0;
  viewCard(ctx, MORNING_CARD, 'Morning Salt', mCard, 0);
  const eCard = t >= 36.15 ? seg(t, 36.15, 36.5) : 0;
  viewCard(ctx, EVENING_CARD, 'The Evening Kept', eCard, 0);

  if (t >= 36) {
    const u = ss(seg(t, 36, 36.2));
    const sc = lerp(1.35, 1, u);
    ctx.save();
    ctx.translate(SEAL_AT.x, SEAL_AT.y);
    ctx.scale(sc, sc);
    drawSeal(ctx, 0, 0, SEAL_AT.s);
    ctx.restore();
  }
}

export function cardScreen(rect, cam) {
  const p = (wx, wy) => [W / 2 + (wx - cam.x) * cam.z, H / 2 + (wy - cam.y) * cam.z];
  const corners = [p(rect.x, rect.y), p(rect.x + rect.w, rect.y + rect.h)];
  const x0 = Math.min(corners[0][0], corners[1][0]);
  const y0 = Math.min(corners[0][1], corners[1][1]);
  const x1 = Math.max(corners[0][0], corners[1][0]);
  const y1 = Math.max(corners[0][1], corners[1][1]);
  return { x0, y0, x1, y1 };
}
