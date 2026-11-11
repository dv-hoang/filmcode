// One Rectangle — camera, subtitles, and the page contract.
import { lerp, seg, ss } from '/core/lib.js';
import { W, H, SUMI, drawSeal } from './print.js';
import { prepareScene, paintScene, cardScreen, MORNING_CARD, EVENING_CARD } from './scene.js';

const KEYS = [
  [0, 3.62, 1348, 800],
  [4, 1.68, 1140, 710],
  [8, 1, 960, 540],
  [14, 1, 960, 540],
  [17.8, 0.88, 960, 730],
  [21.6, 1, 960, 540],
  [32, 1, 960, 540],
  [36.2, 1.32, 1210, 660],
  [40, 1.26, 1190, 650],
];

const LINES = [
  { t0: 1.55, t1: 5.7, text: 'One rectangle, called finished.' },
  { t0: 20.8, t1: 24.35, text: 'The paper kept the white.' },
  { t0: 27.0, t1: 30.35, text: 'She raked it again.' },
  { t0: 36.2, t1: 39.85, text: 'This one, the evening kept.' },
];

function camera(t) {
  let i = 0;
  while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
  const a = KEYS[i];
  const b = KEYS[Math.min(KEYS.length - 1, i + 1)];
  const u = ss(seg(t, a[0], b[0]));
  return {
    z: lerp(a[1], b[1], u),
    x: lerp(a[2], b[2], u),
    y: lerp(a[3], b[3], u),
  };
}

function inside(b) {
  return b.x0 >= 2 && b.y0 >= 2 && b.x1 <= W - 2 && b.y1 <= H - 2;
}

const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { alpha: false });

function drawSub(t) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const line of LINES) {
    const inn = seg(t, line.t0, line.t0 + 0.22);
    const out = 1 - seg(t, line.t1 - 0.28, line.t1);
    const a = Math.min(inn, out);
    if (a <= 0) continue;
    ctx.save();
    ctx.font = "500 42px 'Cormorant Garamond', serif";
    const tw = ctx.measureText(line.text).width;
    const w = Math.max(520, tw + 168);
    const h = 86;
    const x = (W - w) / 2;
    const y = H - 132;
    ctx.beginPath();
    ctx.rect(x - 12, y - 12, (w + 24) * Math.max(0.02, ss(inn)), h + 24);
    ctx.clip();
    ctx.globalAlpha = Math.min(1, a * 1.2);
    ctx.fillStyle = 'rgba(246,237,214,0.96)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = SUMI;
    ctx.lineWidth = 1.05;
    ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
    ctx.lineWidth = 2.6;
    ctx.strokeRect(x, y, w, h);
    drawSeal(ctx, x + 40, y + h / 2, 36);
    ctx.fillStyle = SUMI;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line.text, x + 58 + (w - 78) / 2, y + h / 2 + 1);
    ctx.restore();
  }
  ctx.restore();
}

function render(t) {
  const cam = camera(Math.max(0, Math.min(40, t)));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#cbb892';
  ctx.fillRect(0, 0, W, H);
  ctx.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z, H / 2 - cam.y * cam.z);
  paintScene(ctx, t, cam);
  drawSub(t);
}

window.DUR = 40;
window.render = render;
window.READY = false;
window.EV = [
  { t: 0.15, type: 'shamisen', note: 'D3' },
  { t: 1.2, type: 'shaku', note: 'G4' },
  { t: 4.0, type: 'shamisen', note: 'A3' },
  { t: 5.6, type: 'shaku', note: 'E4' },
  { t: 8.0, type: 'shamisen', note: 'D4' },
  { t: 8.25, type: 'rake' },
  { t: 9.125, type: 'rake' },
  { t: 9.6, type: 'gull' },
  { t: 10.0, type: 'rake' },
  { t: 12.0, type: 'ma' },
  { t: 13.4, type: 'tide' },
  { t: 16.0, type: 'koto' },
  { t: 16.0, type: 'slap' },
  { t: 20.8, type: 'line', id: 'v02' },
  { t: 22.4, type: 'shamisen', note: 'D3' },
  { t: 24.0, type: 'baren' },
  { t: 24.0, type: 'shamisen', note: 'D3' },
  { t: 26.4, type: 'baren' },
  { t: 27.0, type: 'line', id: 'v03' },
  { t: 27.2, type: 'rake' },
  { t: 28.0, type: 'shamisen', note: 'Eb3' },
  { t: 32.0, type: 'shamisen', note: 'G3' },
  { t: 32.2, type: 'set-down' },
  { t: 34.6, type: 'gull' },
  { t: 36.0, type: 'seal' },
  { t: 36.2, type: 'shaku', note: 'A4' },
];

window.TEXTS = (t) => {
  const cam = camera(t);
  const out = [];
  if (t >= 8.45 && t <= 13.25) {
    const b = cardScreen(MORNING_CARD, cam);
    if (inside(b)) {
      const mid = b.y0 + (b.y1 - b.y0) * 0.4;
      out.push({ id: 'series-morning', text: 'SHORE SHEETS', x0: b.x0, y0: b.y0, x1: b.x1, y1: mid });
      out.push({ id: 'view-morning', text: 'Morning Salt', x0: b.x0, y0: mid, x1: b.x1, y1: b.y1 });
    }
  }
  if (t >= 36.55 && t <= 40) {
    const b = cardScreen(EVENING_CARD, cam);
    if (inside(b)) {
      const mid = b.y0 + (b.y1 - b.y0) * 0.36;
      out.push({ id: 'series-evening', text: 'SHORE SHEETS', x0: b.x0, y0: b.y0, x1: b.x1, y1: mid });
      out.push({ id: 'view-evening', text: 'The Evening Kept', x0: b.x0, y0: mid, x1: b.x1, y1: b.y1 });
    }
  }
  return out;
};

prepareScene();
document.fonts.load("500 42px 'Cormorant Garamond'")
  .then(() => document.fonts.load("italic 500 28px 'Cormorant Garamond'"))
  .then(() => { window.READY = true; });
