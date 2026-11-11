// Heat Leaves — compositor. The page contract is window.render / DUR / EV / TEXTS / READY.
import { drawPartial } from './chalk.js';
import { drawRoom, applyCamera } from './stage.js';
import { grade } from './post.js';
import { DUR, STROKES, WORDS, SUBS, EV, WIPE, camAt } from './film.js';

const view = document.getElementById('c');
const vctx = view.getContext('2d', { alpha: false });
const subEl = document.getElementById('sub');

const scene = document.createElement('canvas');
scene.width = 1920;
scene.height = 1080;
const sctx = scene.getContext('2d', { alpha: false });

const blurCv = document.createElement('canvas');
blurCv.width = 1920;
blurCv.height = 1080;
const bctx = blurCv.getContext('2d', { alpha: false });

const REGION = { x: 520, y: 20, w: 2600, h: 1600 };
const layer = document.createElement('canvas');
layer.width = REGION.w;
layer.height = REGION.h;
const lctx = layer.getContext('2d');

const wiped = STROKES.filter((s) => s.wipe);
const kept = STROKES.filter((s) => !s.wipe);

function prog(s, t) {
  if (t <= s.t0) return 0;
  if (t >= s.t1) return 1;
  return (t - s.t0) / (s.t1 - s.t0);
}

function stamp(ctx, stroke, u) {
  if (u <= 0) return;
  const sp = u >= 0.999 ? stroke.full : drawPartial(stroke.samples, u, stroke.color);
  if (!sp) return;
  ctx.drawImage(sp.canvas, sp.x, sp.y);
}

function erase(t) {
  if (t <= WIPE.t0) return;
  const u = t >= WIPE.t1 ? 1 : (t - WIPE.t0) / (WIPE.t1 - WIPE.t0);
  const e = u * u * (3 - 2 * u);
  const pts = WIPE.path;
  let total = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(L);
    total += L;
  }
  const goal = e * total;
  let walked = 0;
  lctx.save();
  lctx.globalCompositeOperation = 'destination-out';
  const r = WIPE.r;
  for (let i = 1; i < pts.length && walked < goal; i++) {
    const L = seg[i - 1];
    const a = pts[i - 1];
    const b = pts[i];
    const use = Math.min(L, goal - walked);
    const n = Math.max(1, Math.ceil(use / 28));
    for (let k = 0; k <= n; k++) {
      const d = (k / n) * use;
      const uu = L === 0 ? 0 : d / L;
      const x = a[0] + (b[0] - a[0]) * uu - REGION.x;
      const y = a[1] + (b[1] - a[1]) * uu - REGION.y;
      const g = lctx.createRadialGradient(x, y, r * 0.72, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(x, y, r, 0, Math.PI * 2);
      lctx.fill();
    }
    walked += L;
  }
  lctx.restore();
}

function drawScene(t, cam) {
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.fillStyle = '#f3eadc';
  sctx.fillRect(0, 0, 1920, 1080);
  drawRoom(sctx, cam, t);

  applyCamera(sctx, cam);
  for (const s of kept) stamp(sctx, s, prog(s, t));

  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.clearRect(0, 0, REGION.w, REGION.h);
  lctx.save();
  lctx.translate(-REGION.x, -REGION.y);
  for (const s of wiped) stamp(lctx, s, prog(s, t));
  lctx.restore();
  erase(t);
  sctx.drawImage(layer, REGION.x, REGION.y);
  sctx.setTransform(1, 0, 0, 1, 0, 0);
}

function screenBox(box, cam) {
  const x0 = 960 + (box.x0 - cam.cx) * cam.s;
  const x1 = 960 + (box.x1 - cam.cx) * cam.s;
  const y0 = 540 + (box.y0 - cam.cy) * cam.s;
  const y1 = 540 + (box.y1 - cam.cy) * cam.s;
  return { x0: Math.min(x0, x1), y0: Math.min(y0, y1), x1: Math.max(x0, x1), y1: Math.max(y0, y1) };
}

function setSub(t) {
  let text = '';
  for (const s of SUBS) {
    if (t >= s.t0 && t < s.t1) text = s.text;
  }
  if (text) {
    subEl.textContent = text;
    subEl.style.opacity = '1';
  } else {
    subEl.textContent = '';
    subEl.style.opacity = '0';
  }
}

function render(t) {
  const cam = camAt(Math.max(0, Math.min(DUR, t)));
  if (cam.blur) {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, 1920, 1080);
    for (const dt of [-0.028, -0.014, 0]) {
      const t2 = Math.max(cam.shotT0, t + dt);
      drawScene(t2, camAt(t2));
      bctx.globalAlpha = 0.34;
      bctx.drawImage(scene, 0, 0);
    }
    bctx.globalAlpha = 1;
    grade(blurCv, vctx, 0.28);
  } else {
    drawScene(t, cam);
    grade(scene, vctx, cam.s < 0.35 ? 0.22 : 0.32);
  }
  setSub(t);
}

window.render = render;
window.DUR = DUR;
window.EV = EV;
window.TEXTS = (t) => {
  const cam = camAt(t);
  const out = [];
  for (const w of WORDS) {
    if (t < w.t0 || t >= w.t1) continue;
    out.push({ id: w.id, text: w.text, ...screenBox(w.box, cam) });
  }
  return out;
};

document.fonts.load('italic 400 42px "Cormorant Garamond"').then(() => {
  render(0);
  window.READY = true;
}).catch((err) => {
  console.error(err);
});
