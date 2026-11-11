import { layer, clear, line, fill, dab, text, ellipse, CAM, BOIL, W, H } from './crayon.js';
import { clamp, lerp, eio } from '/core/lib.js';

const K = {
  ink: '#2d3263',
  brown: '#7a4b31',
  red: '#d4483c',
  pink: '#ee8ea4',
  peach: '#f4c7a4',
  yellow: '#f5c63c',
  orange: '#ec8a3c',
  ochre: '#e7b867',
  green: '#62a24c',
  olive: '#7d8f3f',
  sky: '#79acd9',
  cream: '#fffaf0',
};

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const ART = layer();
let paper = null;

const pr = (t, a, b) => clamp((t - a) / (b - a));
const rng = seed => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

function makePaper() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const r = rng(31);
  const im = g.createImageData(W, H);
  for (let i = 0; i < im.data.length; i += 4) {
    const v = 226 + Math.floor(r() * 22);
    im.data[i] = v; im.data[i + 1] = v - 3; im.data[i + 2] = v - 10; im.data[i + 3] = 44;
  }
  g.putImageData(im, 0, 0);
  g.globalAlpha = 0.22;
  for (let i = 0; i < 900; i++) {
    const y = r() * H, x = r() * W, len = 8 + r() * 42;
    g.strokeStyle = r() > 0.5 ? '#8d7f63' : '#ffffff';
    g.lineWidth = 0.6 + r() * 0.8;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (r() - 0.5) * 2); g.stroke();
  }
  return c;
}

const hillsBack = [[-50, 700], [180, 640], [420, 680], [700, 600], [980, 670], [1250, 620], [1550, 690], [1800, 650], [1970, 700], [1970, 990], [-50, 990]];
const hillsFront = [[-50, 820], [260, 760], [520, 800], [820, 760], [1120, 810], [1450, 770], [1750, 820], [1970, 800], [1970, 990], [-50, 990]];
const trunk = [[500, 910], [522, 610], [556, 606], [578, 910]];
const foliage = [
  [432, 508, 172, 134], [612, 492, 184, 142], [520, 392, 186, 132], [700, 570, 132, 102],
];
const apples = [[438, 478, K.red], [566, 404, K.orange], [646, 470, K.red], [520, 438, K.red], [610, 560, K.orange]];

function sun(t, a) {
  const cx = 1510, cy = 246;
  fill(ART, ellipse(cx, cy, 108, 108), { col: K.yellow, p: 0.78, gap: 10, w: 13, over: 8, seed: 41, draw: pr(t, 0.5, 1.6) });
  line(ART, ellipse(cx, cy, 108, 108), { col: K.ink, w: 4.5, p: 0.8, seed: 42, draw: pr(t, 0.6, 1.7) });
  const rays = pr(t, 1.0, 2.1);
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + t * 0.05;
    const r0 = 124, r1 = 124 + 64 * rays;
    line(ART, [[cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0], [cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1]],
      { col: i % 3 === 0 ? K.orange : K.yellow, w: 5, p: 0.7, seed: 50 + i });
  }
}

function landscape(t) {
  fill(ART, hillsBack, { col: K.olive, p: 0.5, gap: 14, w: 13, over: 7, seed: 61, ang: 0.2, draw: pr(t, 1.7, 3.1), cross: false });
  line(ART, hillsBack, { col: K.ink, w: 4.5, p: 0.75, seed: 62, draw: pr(t, 1.5, 2.8) });
  fill(ART, hillsFront, { col: K.green, p: 0.58, gap: 13, w: 13, over: 7, seed: 63, ang: -0.12, draw: pr(t, 2.3, 3.8) });
  line(ART, hillsFront, { col: K.ink, w: 5, p: 0.8, seed: 64, draw: pr(t, 2.2, 3.4) });
}

function tree(t) {
  fill(ART, trunk, { col: K.brown, p: 0.68, gap: 9, w: 11, over: 4, seed: 71, ang: 0.9, draw: pr(t, 1.8, 3.0) });
  line(ART, trunk, { col: K.ink, w: 5.5, p: 0.85, seed: 72, draw: pr(t, 1.7, 2.8) });
  const branches = [
    [[538, 664], [430, 574]], [[540, 690], [654, 606]], [[538, 626], [476, 524]], [[542, 720], [626, 742]],
  ];
  branches.forEach((b, i) => line(ART, b, { col: K.ink, w: 4.5 - i * 0.3, p: 0.75, seed: 80 + i, draw: pr(t, 2.0 + i * 0.2, 3.2 + i * 0.2) }));
  foliage.forEach((f, i) => {
    const p = ellipse(f[0], f[1], f[2], f[3]);
    fill(ART, p, { col: i % 2 ? K.olive : K.green, p: 0.55, gap: 12, w: 12, over: 8, seed: 90 + i, ang: 0.35 + i * 0.4, draw: pr(t, 2.8 + i * 0.25, 4.4 + i * 0.25) });
    line(ART, p, { col: K.ink, w: 4, p: 0.7, seed: 100 + i, draw: pr(t, 3.0 + i * 0.25, 4.5 + i * 0.25) });
  });
  apples.forEach((a, i) => {
    const d = pr(t, 4.2 + i * 0.18, 4.7 + i * 0.18);
    if (d > 0) {
      dab(ART, a[0], a[1], 22, { col: a[2], p: d * 0.9, gap: 4.5, w: 6, over: 1, seed: 110 + i });
      line(ART, [[a[0], a[1] - 18], [a[0] + 2, a[1] - 30]], { col: K.ink, w: 2.5, p: 0.7, seed: 120 + i, draw: d });
    }
  });
}

function child(t) {
  const walking = pr(t, 4.7, 7.0);
  if (walking <= 0) return;
  const x = lerp(820, 1180, walking);
  const moving = walking < 0.98;
  const bob = moving ? -Math.abs(Math.sin(t * 5.2)) * 9 : 0;
  const y = 900 + bob;
  const hip = y - 74, shoulder = y - 170, headY = y - 244;
  const step = Math.sin(t * 5.2) * 16;
  // legs
  line(ART, [[x - 28, hip], [x - 34 + step, y]], { col: K.ink, w: 5, p: 0.8, seed: 141 });
  line(ART, [[x + 28, hip], [x + 34 - step, y]], { col: K.ink, w: 5, p: 0.8, seed: 142 });
  line(ART, [[x - 34 + step, y], [x - 48 + step, y]], { col: K.ink, w: 5, p: 0.8, seed: 143 });
  line(ART, [[x + 34 - step, y], [x + 48 - step, y]], { col: K.ink, w: 5, p: 0.8, seed: 144 });
  // body
  const body = [[x - 42, shoulder], [x + 42, shoulder], [x + 54, hip], [x - 54, hip]];
  fill(ART, body, { col: K.sky, p: 0.6, gap: 9, w: 12, over: 6, seed: 145, ang: 0.4 });
  line(ART, body, { col: K.ink, w: 5, p: 0.85, seed: 146 });
  // arms
  line(ART, [[x - 42, shoulder + 8], [x - 82, shoulder + 52]], { col: K.ink, w: 5, p: 0.8, seed: 147 });
  line(ART, [[x + 42, shoulder + 8], [x + 84 + step * 0.4, shoulder + 46]], { col: K.ink, w: 5, p: 0.8, seed: 148 });
  // head
  fill(ART, ellipse(x, headY, 58, 58), { col: K.peach, p: 0.55, gap: 7, w: 10, over: 5, seed: 149, ang: 0.5 });
  line(ART, ellipse(x, headY, 58, 58), { col: K.ink, w: 5, p: 0.85, seed: 150 });
  // hair
  const hair = ellipse(x, headY - 18, 61, 45, 40, Math.PI, Math.PI * 2);
  fill(ART, hair, { col: K.brown, p: 0.7, gap: 6, w: 9, over: 3, seed: 151, ang: 0.2 });
  line(ART, hair, { col: K.ink, w: 5, p: 0.8, seed: 152 });
  // face
  dab(ART, x - 19, headY + 2, 5, { col: K.ink, p: 0.9, gap: 2.5, w: 4, seed: 153 });
  dab(ART, x + 19, headY + 2, 5, { col: K.ink, p: 0.9, gap: 2.5, w: 4, seed: 154 });
  dab(ART, x - 34, headY + 24, 9, { col: K.pink, p: 0.45, gap: 3, w: 5, seed: 155 });
  dab(ART, x + 34, headY + 24, 9, { col: K.pink, p: 0.45, gap: 3, w: 5, seed: 156 });
  line(ART, [[x - 11, headY + 31], [x, headY + 37], [x + 11, headY + 31]], { col: K.ink, w: 3, p: 0.7, seed: 157 });
  // basket and apple
  const bx = x + 96, by = shoulder + 70;
  const basket = [[bx - 26, by], [bx + 26, by], [bx + 19, by + 38], [bx - 19, by + 38]];
  fill(ART, basket, { col: K.ochre, p: 0.6, gap: 5, w: 8, over: 3, seed: 158, ang: 0.7 });
  line(ART, basket, { col: K.ink, w: 4, p: 0.8, seed: 159 });
  line(ART, [[bx - 22, by], [bx, by - 25], [bx + 22, by]], { col: K.ink, w: 4, p: 0.8, seed: 160 });
  dab(ART, bx, by - 8, 12, { col: K.red, p: 0.9, gap: 3, w: 5, seed: 161 });
}

function bird(t) {
  const a = pr(t, 5.8, 7.9);
  if (a <= 0 || a >= 1) return;
  const x = lerp(180, 1780, a), y = 286 + Math.sin(t * 2.4) * 18;
  const flap = Math.sin(t * 9) * 12;
  line(ART, [[x - 34, y + flap], [x, y], [x + 34, y + flap]], { col: K.ink, w: 4, p: 0.75, seed: 171 });
}

function title(t) {
  const a = pr(t, 7.0, 8.6);
  if (a <= 0) return;
  text(ART, 'The Orchard at First Light', 960, 1012, {
    size: 64, font: 'Gaegu', weight: 700, col: K.ink, align: 'center', reveal: a, p: 0.95, track: 1.2, seed: 181,
  });
  text(ART, 'a crayon picture book', 960, 1054, {
    size: 26, font: 'Patrick Hand', weight: 400, col: K.brown, align: 'center', reveal: pr(t, 7.8, 9.0), p: 0.8, track: 2, seed: 182,
  });
}

function backdrop(t) {
  ctx.fillStyle = '#f4efe3';
  ctx.fillRect(0, 0, W, H);
  const wash = pr(t, 0.1, 3.0);
  if (wash > 0) {
    const g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, `rgba(232, 154, 164, ${0.18 * wash})`);
    g.addColorStop(0.55, `rgba(232, 154, 164, ${0.09 * wash})`);
    g.addColorStop(1, 'rgba(232, 154, 164, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 720);
  }
  if (paper) ctx.drawImage(paper, 0, 0);
}

function vignette() {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.85);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(98, 76, 48, 0.16)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function draw(t) {
  const ta = Math.round(t * 12) / 12;
  CAM.x = 960; CAM.y = 540; CAM.s = 1 + 0.025 * eio(t / 10);
  BOIL.step = Math.floor(t * 12); BOIL.amp = 0.95;
  clear(ART);
  sun(ta, 0);
  landscape(ta);
  tree(ta);
  bird(ta);
  child(ta);
  title(ta);
  backdrop(t);
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(ART.c, 2, 2);
  ctx.restore();
  ctx.drawImage(ART.c, 0, 0);
  vignette();
  const end = clamp((10 - t) / 0.15);
  if (end < 1) {
    ctx.fillStyle = `rgba(244,239,227,${1 - end})`;
    ctx.fillRect(0, 0, W, H);
  }
}

window.DUR = 10;
window.render = draw;
paper = makePaper();
document.fonts.ready.then(async () => {
  try {
    await Promise.all([
      document.fonts.load('700 58px Gaegu'),
      document.fonts.load('400 26px "Patrick Hand"'),
    ]);
  } catch (e) {}
  window.READY = true;
});
