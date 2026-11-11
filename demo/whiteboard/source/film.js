// The Open Top — one board, one argument, no hands.
import {
  Timeline, Pen, Camera, Board, worldToScreen, boxToScreen,
  line, ellipse, arrow, circle, text, penPose, drawMarker, drawEraser,
  drawDiscMagnet, eraseHead, makeGhosts,
} from './engine/wb.js';

const NAVY = '#1f2a44';
const TEAL = '#1f8a8a';
const ORANGE = '#d97757';

const cues = await (await fetch('cues.json')).json();

const navy = new Pen('navy', NAVY, { park: { x: -460, y: 180 } });
const teal = new Pen('teal', TEAL, { park: { x: 2460, y: 160 } });
const orange = new Pen('orange', ORANGE, { park: { x: 2480, y: 640 } });
const tl = new Timeline();

const myth = text('cold cup', 3780, 1760, { h: 72, color: NAVY, seed: 4 });
tl.draw(navy, myth, -3.4, { by: -0.15 });

const title = text('THE OPEN TOP', 1560, 720, { h: 148, align: 'center', color: NAVY, seed: 9 });
tl.draw(navy, title, 2.35, { by: 5.35 });

tl.draw(navy, mug(1500, 1500, NAVY), 5.48, { by: 7.05 });
tl.draw(teal, [
  ellipse(1500, 1564, 300, 46, { w: 6, color: TEAL, a0: 0.2 }),
  arrow(1500, 1468, 1980, 1140, { w: 8, color: TEAL, bow: 0.22 }),
  arrow(1620, 1488, 2220, 1300, { w: 7, color: TEAL, bow: -0.1 }),
], 6.35, { by: 7.9 });

tl.draw(teal, [
  arrow(1910, 1840, 2280, 1810, { w: 7, color: TEAL, bow: 0.04 }),
  arrow(1900, 2060, 2160, 2100, { w: 6, color: TEAL, bow: -0.05 }),
], 10.32, { by: 11.2 });
const slow = text('slow door', 2340, 1960, { h: 54, color: TEAL, seed: 12 });
tl.draw(teal, slow, 11.05, { by: 11.9 });

const wipe = wipePath(myth.box);
tl.erase(wipe, 17.55, 2.05, { width: 168, strength: 0.9 });

tl.draw(navy, mug(5480, 1500, NAVY), 20.2, { by: 21.35 });
tl.draw(teal, ellipse(5480, 1518, 300, 46, { w: 6, color: TEAL, a0: -0.4 }), 21.05, { by: 21.45 });
tl.draw(navy, ellipse(5480, 1416, 430, 96, { w: 9, color: NAVY, a0: -0.9, lap: 0.7 }), 20.85, { by: 21.58 });

tl.draw(navy, [
  line(1120, 3760, 1120, 3280, { w: 6, color: NAVY, over: 12 }),
  line(1120, 3760, 1760, 3760, { w: 6, color: NAVY, over: 12 }),
  line(4920, 3760, 4920, 3280, { w: 6, color: NAVY, over: 12 }),
  line(4920, 3760, 5600, 3760, { w: 6, color: NAVY, over: 12 }),
], 25.05, { by: 26.35 });
tl.draw(teal, [
  line(1200, 3400, 1360, 3500, { w: 7, color: TEAL }),
  line(1360, 3500, 1540, 3660, { w: 7, color: TEAL }),
  line(1540, 3660, 1700, 3740, { w: 7, color: TEAL }),
], 25.4, { by: 27.15 });
tl.draw(orange, [
  line(5000, 3420, 5280, 3435, { w: 7, color: ORANGE }),
  line(5280, 3435, 5540, 3448, { w: 7, color: ORANGE }),
], 25.4, { by: 26.9 });

const lidWord = text('lid', 5480, 1660, { h: 84, align: 'center', color: ORANGE, seed: 18 });
tl.draw(orange, lidWord, 35.48, { by: 36.25 });
tl.draw(navy, circle(5480, 1605, 118, { w: 7, color: NAVY, a0: 0.4, lap: 0.5 }), 36.55, { by: 37.55 });
tl.draw(navy, circle(5480, 1605, 145, { w: 6, color: NAVY, a0: -1.1, lap: 0.55 }), 37.6, { by: 38.7 });

const labels = [
  { id: 'title', text: 'THE OPEN TOP', box: title.box, t0: 2.35, t1: 40 },
  { id: 'myth', text: 'cold cup', box: myth.box, t0: 0, t1: 17.5 },
  { id: 'slow', text: 'slow door', box: slow.box, t0: 11.05, t1: 40 },
  { id: 'lid', text: 'lid', box: lidWord.box, t0: 35.48, t1: 40 },
];

const cam = new Camera([
  [0.00, 1500, 1680, 1.48, 0, 'io'],
  [2.15, 1560, 1580, 0.50, 0, 'io'],
  [8.05, 1560, 1580, 0.50, 0, 'o'],
  [8.85, 1860, 1340, 0.96, -0.012, 'i'],
  [10.10, 2100, 1920, 0.68, 0, 'io'],
  [13.85, 2100, 1920, 0.68, 0, 'o'],
  [14.65, 4020, 1740, 0.82, 0.01, 'io'],
  [19.85, 4020, 1740, 0.82, 0, 'o'],
  [20.42, 5480, 1720, 0.62, -0.01, 'i'],
  [24.50, 5480, 1760, 0.58, 0, 'o'],
  [25.45, 3400, 3680, 0.40, 0, 'io'],
  [29.30, 3400, 3680, 0.40, 0, 'o'],
  [30.15, 3720, 2200, 0.234, 0, 'i'],
  [34.55, 3720, 2200, 0.234, 0, 'o'],
  [35.45, 5480, 1605, 1.55, 0, 'i'],
  [40.00, 5480, 1605, 1.72, 0, 'o'],
]);

const MAG = [
  [0.00, 1500, 1280, 240, 0],
  [0.28, 1500, 1320, 200, 0],
  [0.625, 1500, 1860, 0, 0],
  [6.50, 1500, 1860, 0, 0],
  [7.15, 1680, 1580, 28, 0],
  [7.95, 1960, 1240, 22, 0],
  [10.2, 2140, 1680, 10, 0],
  [14.5, 4000, 1480, 18, 0],
  [17.35, 4000, 1460, 14, 0],
  [18.4, 4680, 1400, 36, 0],
  [20.15, 5000, 1360, 42, 0],
  [21.15, 5480, 1280, 36, 0],
  [21.65, 5480, 1388, 8, 0],
  [22.15, 5480, 1360, 14, -0.15],
  [24.05, 5480, 2100, 0, 0.5],
  [40.0, 5480, 2100, 0, 0.2],
];

function mug(cx, rimY, color) {
  const rx = 400, bot = rimY + 760;
  const x0 = cx - rx, x1 = cx + rx;
  return [
    line(x0, rimY + 28, x0 - 8, bot, { w: 9, color, over: 16 }),
    line(x0 - 8, bot, x1 + 8, bot, { w: 9, color, over: 16 }),
    line(x1 + 8, bot, x1, rimY + 28, { w: 9, color, over: 18 }),
    ellipse(cx, rimY, rx, 84, { w: 8, color }),
  ];
}

function wipePath(box) {
  const y0 = box.y0 - 18, y1 = box.y1 + 22;
  const xL = box.x0 - 36, xR = box.x1 + 36;
  const rows = 5;
  const pts = [];
  for (let i = rows - 1; i >= 0; i--) {
    const y = y0 + ((y1 - y0) * i) / (rows - 1);
    const rtl = (rows - 1 - i) % 2 === 0;
    pts.push(rtl ? [xR, y] : [xL, y], rtl ? [xL, y] : [xR, y]);
  }
  return pts;
}

function magnetAt(t) {
  if (t <= MAG[0][0]) return MAG[0];
  if (t >= MAG[MAG.length - 1][0]) return MAG[MAG.length - 1];
  let i = 0;
  while (MAG[i + 1][0] < t) i++;
  const a = MAG[i], b = MAG[i + 1];
  let u = (t - a[0]) / (b[0] - a[0]);
  const drop = i === 1;
  u = drop ? u * u : u * u * (3 - 2 * u);
  return [
    t,
    a[1] + (b[1] - a[1]) * u,
    a[2] + (b[2] - a[2]) * u,
    a[3] + (b[3] - a[3]) * u,
    a[4] + (b[4] - a[4]) * u,
  ];
}

const board = new Board(tl, { ghosts: makeGhosts() });
const pens = [navy, teal, orange];
board.objs.push({
  draw(ctx, t, c) {
    const m = magnetAt(t);
    const [sx, sy] = worldToScreen(c, m[1], m[2]);
    drawDiscMagnet(ctx, sx, sy, m[3], m[4], c);
    const er = eraseHead(tl, t, c);
    if (er && er.show) drawEraser(ctx, er.x, er.y, er.ang, c, er.lift);
    for (const pen of pens) drawMarker(ctx, pen, penPose(pen, t, c, tl), c);
  },
});

function buildEvents() {
  const ev = [];
  for (const sp of tl.spans) {
    if (sp.t0 < 0) continue;
    const midT = (sp.t0 + sp.t1) / 2;
    const c = cam.at(midT);
    const p = sp.stroke.pts[Math.floor(sp.stroke.pts.length / 2)];
    const sx = worldToScreen(c, p[0], p[1])[0];
    const pan = Math.max(-0.9, Math.min(0.9, sx / 960 - 1));
    const squeak = sp.stroke.len > 260 && ((sp.stroke.seed * 17) % 100) < 28;
    ev.push({
      t: round3(sp.t0), dur: round3(sp.t1 - sp.t0), type: 'stroke',
      color: sp.stroke.color, pan: round3(pan), squeak: squeak ? 1 : 0,
    });
  }
  ev.push({ t: 17.55, dur: 2.05, type: 'erase', pan: 0.15 });
  ev.push({ t: 0.625, type: 'magnet', kind: 'drop', pan: 0 });
  ev.push({ t: 21.62, type: 'magnet', kind: 'block', pan: 0.35 });
  ev.push({ t: 23.85, type: 'magnet', kind: 'sink', pan: 0.3 });
  ev.push({ t: 2.15, type: 'cap', kind: 'off', pan: -0.6 });
  ev.push({ t: 39.06, type: 'cap', kind: 'on', pan: 0.45 });
  ev.sort((a, b) => a.t - b.t);
  return ev;
}

function round3(n) { return Math.round(n * 1000) / 1000; }

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const sub = document.getElementById('sub');
const subtext = document.getElementById('subtext');
const frame = ctx.createImageData(1920, 1080);
const acc = new Float32Array(frame.data.length);

function blurCount(t) {
  if (t < 1 / 24) return 1;
  const a = cam.at(t - 1 / 24), b = cam.at(t);
  const dx = (b.x - a.x) * b.zoom, dy = (b.y - a.y) * b.zoom;
  const delta = Math.hypot(dx, dy);
  if (delta < 14) return 1;
  return Math.min(6, Math.ceil(delta / 4));
}

function drawFrame(t) {
  board.render(ctx, t, cam.at(t));
}

function setSub(t) {
  const cue = cues.find(c => t >= c.t0 && t < c.t1);
  if (!cue) { sub.style.opacity = '0'; return; }
  subtext.textContent = cue.text;
  sub.style.opacity = '1';
}

function render(t) {
  const n = blurCount(t);
  if (n === 1) drawFrame(t);
  else {
    acc.fill(0);
    for (let i = 0; i < n; i++) {
      drawFrame(t - (1 / 24) * ((n - 1 - i) / n));
      const im = ctx.getImageData(0, 0, 1920, 1080);
      for (let p = 0; p < im.data.length; p++) acc[p] += im.data[p];
    }
    const d = frame.data;
    for (let p = 0; p < d.length; p++) d[p] = acc[p] / n;
    ctx.putImageData(frame, 0, 0);
  }
  setSub(t);
}

window.DUR = 40;
window.EV = buildEvents();
window.render = render;
window.TEXTS = (t) => {
  const c = cam.at(t);
  const out = [];
  for (const lab of labels) {
    if (t < lab.t0 || t > lab.t1) continue;
    const b = boxToScreen(c, lab.box);
    out.push({ id: lab.id, text: lab.text, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 });
  }
  return out;
};

await document.fonts.ready;
window.READY = true;
