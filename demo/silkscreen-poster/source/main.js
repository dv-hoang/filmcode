import { lerp, ss } from '/core/lib.js';
import { makeTextures, screenFrame } from './engine/silk.js';
import { drawWorld, drawWall, drawWindow, foregroundPine, measurePosterText } from './scene.js';
import { DUR, LINES, INK, buildEV } from './timeline.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });

const CAM = [
  { t: 0, x: 780, y: 440, z: 1.32, rot: -0.04 },
  { t: 1.875, x: 900, y: 470, z: 1.2, rot: -0.02 },
  { t: 2.95, x: 960, y: 490, z: 1.1, rot: -0.006 },
  { t: 5, x: 960, y: 510, z: 1.06, rot: 0 },
  { t: 10, x: 1020, y: 570, z: 1.08, rot: 0 },
  { t: 12.4, x: 1000, y: 580, z: 1.1, rot: 0.008 },
  { t: 15.6, x: 1040, y: 520, z: 1.12, rot: 0.008 },
  { t: 17.5, x: 1060, y: 470, z: 1.1, rot: 0 },
  { t: 20.9, x: 1100, y: 470, z: 1.06, rot: 0 },
  { t: 23.8, x: 960, y: 620, z: 1.08, rot: 0 },
  { t: 26.2, x: 960, y: 702, z: 1.15, rot: 0 },
  { t: 31, x: 980, y: 680, z: 1.1, rot: 0 },
  { t: 33.15, x: 1080, y: 620, z: 1.12, rot: 0.004 },
  { t: 34.2, x: 1080, y: 560, z: 1.02, rot: 0 },
  { t: 36.6, x: 960, y: 540, z: 0.7, rot: 0, log: true },
  { t: 40, x: 960, y: 540, z: 0.7, rot: 0 },
];

let meshCanvas = null;
let boxes = [];

function cameraAt(t) {
  if (t <= CAM[0].t) return CAM[0];
  const last = CAM[CAM.length - 1];
  if (t >= last.t) return last;
  let i = 0;
  while (CAM[i + 1].t < t) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  const u = ss((t - a.t) / (b.t - a.t));
  const z = b.log ? Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)) : lerp(a.z, b.z, u);
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z, rot: lerp(a.rot, b.rot, u) };
}

function applyCam(cam) {
  ctx.translate(960, 540);
  ctx.rotate(cam.rot);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.x, -cam.y);
}

function worldToScreen(x, y, cam) {
  const dx = (x - cam.x) * cam.z;
  const dy = (y - cam.y) * cam.z;
  const c = Math.cos(cam.rot);
  const s = Math.sin(cam.rot);
  return [960 + dx * c - dy * s, 540 + dx * s + dy * c];
}

function worldBox(b, cam) {
  const pts = [[b.x0, b.y0], [b.x1, b.y0], [b.x0, b.y1], [b.x1, b.y1]].map(([x, y]) => worldToScreen(x, y, cam));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

function hinge(t) {
  if (t < 2.5) return 0;
  if (t > 2.9) return 1;
  return (t - 2.5) / 0.4;
}

function render(t) {
  boxes = [];
  const cam = cameraAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#5c4a3c';
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.save();
  applyCam(cam);
  drawWall(ctx);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1920, 1080);
  ctx.clip();
  drawWorld(ctx, t, (id, text, x, y, size, align, condensed, tracking) => {
    const b = measurePosterText(ctx, text, x, y, size, align, condensed, tracking);
    const s = worldBox(b, cam);
    if (s.x0 >= 1 && s.y0 >= 1 && s.x1 <= 1919 && s.y1 <= 1079) {
      boxes.push({ id, text, x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1 });
    }
  });
  ctx.restore();
  drawWindow(ctx);
  ctx.restore();
  screenFrame(ctx, hinge(t), meshCanvas);
  if (t >= 33.15 && t <= 33.74) {
    const u = (t - 33.15) / 0.59;
    foregroundPine(ctx, lerp(2100, -2300, u));
  }
  drawStrip(t);
}

function drawStrip(t) {
  const shown = LINES.filter((line) => t >= line.t);
  if (!shown.length) return;
  const cur = shown[shown.length - 1];
  const prev = shown.length > 1 ? shown[shown.length - 2] : null;
  const p = Math.max(0, Math.min(1, (t - cur.t) / 0.42));
  const y = 956;
  const h = 124;
  const front = -20 + p * 1980;

  ctx.save();
  roundBand(y, h);
  if (prev && p < 1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(front, y, 1920 - front, h);
    ctx.clip();
    bandInk(y, h);
    bandLabel(prev.show, y, h);
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, Math.max(0, front), h);
  ctx.clip();
  bandInk(y, h);
  bandLabel(cur.show, y, h);
  const age = Math.max(0, 1 - (t - cur.t - 0.42));
  if (age > 0) {
    ctx.globalAlpha = 0.28 * age;
    ctx.fillStyle = '#fffaf2';
    ctx.fillRect(front - 28, y, 16, h);
  }
  ctx.restore();
  ctx.restore();
}

function roundBand(y, h) {
  ctx.beginPath();
  ctx.rect(0, y, 1920, h);
}

function bandInk(y, h) {
  ctx.fillStyle = 'rgba(12,8,6,0.45)';
  ctx.fillRect(2, y + 2, 1920, h);
  ctx.fillStyle = INK.near;
  ctx.fillRect(0, y, 1920, h);
  ctx.fillStyle = 'rgba(255,248,236,0.16)';
  ctx.fillRect(0, y, 1920, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, y + h - 4, 1920, 4);
}

function bandLabel(text, y, h) {
  ctx.save();
  ctx.font = '600 46px "Cormorant Garamond"';
  ctx.letterSpacing = '0.01em';
  ctx.fillStyle = INK.paper;
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width;
  ctx.translate(64, y + h / 2 + 2);
  ctx.scale(0.86, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  void w;
}

const faces = [
  new FontFace('Cormorant Garamond', 'url("fonts/CormorantGaramond[wght].ttf")', { weight: '200 700', style: 'normal' }),
  new FontFace('Cormorant Garamond', 'url("fonts/CormorantGaramond-Italic[wght].ttf")', { weight: '200 700', style: 'italic' }),
];

Promise.all(faces.map((face) => face.load().then((loaded) => document.fonts.add(loaded))))
  .then(() => {
    const tex = makeTextures(INK.paper);
    meshCanvas = tex.mesh;
    window.DUR = DUR;
    window.EV = buildEV();
    window.render = render;
    window.TEXTS = () => boxes;
    window.READY = true;
  })
  .catch((err) => {
    console.error(err);
  });
