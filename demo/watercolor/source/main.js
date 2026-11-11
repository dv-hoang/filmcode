// Alborada — frame composition, annotations, subtitles.
import {
  W, H, DUR, INK, ACCENT, camAt, build, drawSky, drawHills, drawGround, drawObjects, OBJECTS, screenOf,
} from './scene.js';
import { clamp, lerp, seg, ss, eio, eo, ei, rnd, withSeed, rgba, mk, drawS, qcurve, washPoly } from './engine.js';

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let PAPER = null;

// ---------------- hand lettering ----------------
function hand(txt, x, y, p, o = {}) {
  if (p <= 0) return;
  const size = o.size || 34;
  ctx.save();
  ctx.font = `${o.weight || 500} ${size}px Caveat`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = 'alphabetic';
  const tw = ctx.measureText(txt).width;
  const left = o.align === 'right' ? x - tw : o.align === 'center' ? x - tw / 2 : x;
  const clipW = (tw + 10) * p;
  ctx.beginPath();
  ctx.rect(left - 8, y - size * 1.3, clipW + 16, size * 1.8);
  ctx.clip();
  ctx.lineJoin = 'round';
  const al = (o.a || 0.85) * (o.fade === undefined ? 1 : o.fade);
  ctx.lineWidth = 9;
  ctx.strokeStyle = rgba('#f3ecde', 0.85 * al);
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = rgba(o.col || INK, al);
  ctx.fillText(txt, x, y);
  ctx.fillStyle = rgba(o.col || INK, al * 0.3);
  ctx.fillText(txt, x + 0.7, y + 0.5);
  ctx.restore();
}

function leader(x0, y0, x1, y1, p, bend = 0, col = INK) {
  if (p <= 0) return;
  const pts = qcurve(x0, y0, x1, y1, bend, 8);
  const s = withSeed(Math.round(x0 * 7 + y0 * 13), () => mk(pts, 1.6, col, { prof: 'even', nb: 0, a: 0.6, rough: 0.2 }));
  drawS(ctx, s, p);
  if (p > 0.9) {
    ctx.save();
    ctx.fillStyle = rgba(col, 0.62);
    ctx.beginPath(); ctx.arc(x0, y0, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function mono(txt, x, y, a = 1, size = 18, col = INK, align = 'left') {
  if (a <= 0) return;
  ctx.save();
  ctx.font = `400 ${size}px "IBM Plex Mono"`;
  ctx.letterSpacing = '4px';
  ctx.textAlign = align;
  ctx.fillStyle = rgba(col, a * 0.78);
  ctx.fillText(txt, x, y);
  ctx.restore();
}

// ---------------- annotations ----------------
function drawNotes(t) {
  // 1. the specimen: the cherry that opens the film
  if (t > 1.2 && t < 3.9) {
    const p = ss(seg(t, 1.2, 2.1)), fo = 1 - ss(seg(t, 3.2, 3.9));
    const o = OBJECTS.find(o => o.kind === 'hero');
    const cam = camAt(t);
    if (o) {
      const s = screenOf(o, cam);
      const tx = 1790, ty = 210;
      const ax = Math.min(s.x + 150 * s.s, 1250), ay = s.y + 40 * s.s;
      leader(ax, ay, tx - 250, ty + 44, p, 40);
      hand('coffea arabica', tx, ty, p, { size: 40, align: 'right', fade: fo });
      mono('ripe · hand-picked', tx, ty + 38, p * 0.9 * fo, 15, undefined, 'right');
    }
  }
  // 2. altitude, left margin on the slope
  if (t > 12.2 && t < 15.6) {
    const p = ss(seg(t, 12.2, 13.2)), fo = 1 - ss(seg(t, 15.0, 15.6));
    leader(268, 476, 372, 520, p, 10);
    mono('1,720 m', 148, 470, p * fo, 30);
    hand('above the valley', 150, 506, p, { size: 28, fade: fo });
  }
  // 3. shade canopy
  if (t > 16.3 && t < 19.4) {
    const p = ss(seg(t, 16.3, 17.2)), fo = 1 - ss(seg(t, 18.8, 19.4));
    leader(1620, 300, 1530, 380, p, -18);
    hand('shade-grown', 1628, 296, p, { size: 34, fade: fo });
    mono('40 % canopy', 1630, 326, p * 0.9 * fo, 15);
  }
  // 4. the patio
  if (t > 33.0 && t < 36.4) {
    const p = ss(seg(t, 33.0, 33.9)), fo = 1 - ss(seg(t, 35.8, 36.4));
    leader(1460, 356, 1372, 430, p, -14);
    hand('drying beds', 1468, 350, p, { size: 34, fade: fo });
    mono('east-facing · 9 days', 1470, 380, p * 0.9 * fo, 15);
  }
  // 5. the cup
  if (t > 42.6) {
    const p = ss(seg(t, 42.6, 43.4));
    const cam = camAt(t);
    const o = OBJECTS.find(o => o.kind === 'cup');
    if (o) {
      const s = screenOf(o, cam);
      const ax = s.x + 30 * s.s, ay = s.y - 40 * s.s;
      leader(ax, ay, ax + 150, ay - 120, p, 26);
      hand('picked before six', ax + 162, ay - 118, p, { size: 36 });
    }
  }
}

// ---------------- voice and subtitles ----------------
export const VO = [
  { id: 'v01', t0: 0.90, text: 'Before the light reaches the hill, the cherries are already red.' },
  { id: 'v02', t0: 5.20, text: 'My grandmother planted these rows in nineteen seventy-one.' },
  { id: 'v03', t0: 9.80, text: 'At seventeen hundred metres, coffee ripens slowly. That is the whole secret.' },
  { id: 'v04', t0: 15.60, text: 'We pick only what is red. The rest waits for another morning.' },
  { id: 'v05', t0: 21.20, text: 'By seven, four baskets. By noon, the mill will have all of it.' },
  { id: 'v06', t0: 25.50, text: 'Water, then skins, then the beans. The cherry gives up everything.' },
  { id: 'v07', t0: 31.20, text: 'The beds face east, so the sun works first.' },
  { id: 'v08', t0: 35.00, text: 'By afternoon the patio smells like bread and wet stone.' },
  { id: 'v09', t0: 39.80, text: 'And then, one cup. This one is ours.' },
];
export const VO_DUR = { v01: 3.381, v02: 3.571, v03: 4.844, v04: 3.581, v05: 3.879, v06: 4.077, v07: 2.601, v08: 3.418, v09: 2.441 };

function wrap(text, font, maxW) {
  ctx.save(); ctx.font = font;
  const words = text.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  ctx.restore();
  return lines;
}

function drawSubtitles(t) {
  for (const v of VO) {
    const d = VO_DUR[v.id] || 3.2;
    const a = Math.min(seg(t, v.t0 - 0.12, v.t0 + 0.08), 1 - seg(t, v.t0 + d + 0.15, v.t0 + d + 0.5));
    if (a <= 0.02) continue;
    const font = 'italic 400 38px "Cormorant Garamond"';
    const lines = wrap(v.text, font, 1340);
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    const base = 992 - (lines.length - 1) * 44;
    for (let i = 0; i < lines.length; i++) {
      const y = base + i * 44;
      ctx.lineWidth = 11;
      ctx.strokeStyle = rgba('#f3ecde', 0.62 * a);
      ctx.strokeText(lines[i], 960, y);
      ctx.fillStyle = rgba(INK, 0.8 * a);
      ctx.fillText(lines[i], 960, y);
    }
    ctx.restore();
  }
}

function drawTitle(t) {
  const a = ss(seg(t, 0.35, 1.5)) * (1 - ss(seg(t, 4.0, 5.0)));
  if (a <= 0.01) return;
  ctx.save();
  ctx.font = 'italic 400 96px "Cormorant Garamond"';
  ctx.fillStyle = rgba(INK, 0.85 * a);
  ctx.fillText('Alborada', 132, 196);
  ctx.restore();
  hand('a morning on the farm', 138, 240, ss(seg(t, 0.8, 2.2)), { size: 30, fade: 1 - ss(seg(t, 4.0, 5.0)) });
}

// ---------------- frame ----------------
export function render(t) {
  const cam = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(PAPER, 0, 0, W, H);
  const wA = ss(seg(t, 3.0, 6.4));      // the place appears as we pull back
  ctx.globalAlpha = wA;
  drawSky(ctx, t, cam);
  drawHills(ctx, t, cam);
  drawGround(ctx, t, cam);
  ctx.globalAlpha = 1;
  drawObjects(ctx, t, cam, wA);
  drawLight(t);
  drawSteam(t);
  drawNotes(t);
  drawTitle(t);
  drawSubtitles(t);
}

// palette as data: cool dawn, warm afternoon
function drawLight(t) {
  const cool = (1 - ss(seg(t, 4, 16))) * 0.14;
  const warm = ss(seg(t, 26, 38)) * 0.2;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  if (cool > 0.005) { ctx.fillStyle = rgba('#9fb6c4', cool); ctx.fillRect(0, 0, W, H); }
  if (warm > 0.005) { ctx.fillStyle = rgba('#f0c98f', warm); ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

// steam over the cup: a soft wash rising and thinning
function drawSteam(t) {
  const p = ss(seg(t, 41.0, 42.2));
  if (p <= 0.01) return;
  const cam = camAt(t);
  const cup = OBJECTS.find(o => o.kind === 'cup');
  if (!cup) return;
  const s = screenOf(cup, cam);
  const bx = s.x - 6 * s.s, by = s.y - 78 * s.s;
  for (let i = 0; i < 5; i++) {
    withSeed(4100 + i, () => {
      const rise = (t - 41.0) * 26 + i * 22;
      const y = by - rise * s.s;
      const x = bx + Math.sin(t * 0.7 + i * 1.9) * 12 * s.s + (i - 2) * 9 * s.s;
      const r = (16 + i * 5) * s.s * (0.7 + 0.3 * Math.sin(t * 0.5 + i));
      const pts = [];
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        pts.push([x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 0.9]);
      }
      ctx.save();
      ctx.globalAlpha = p * 0.14 * (1 - i / 6);
      washPoly(ctx, pts, '#fdf8ec', 1, 3, 5);
      ctx.restore();
    });
  }
}

window.render = render;
window.DUR = DUR;

// subtitles are checked by the .srt, not here
window.TEXTS = (t) => {
  const out = [];
  if (t > 0.4 && t < 5.0) out.push({ id: 'title', text: 'Alborada', x0: 120, y0: 110, x1: 620, y1: 260 });
  return out;
};

(async () => {
  PAPER = new Image();
  PAPER.src = 'paper.jpg';
  await PAPER.decode();
  await Promise.all([
    document.fonts.load('400 96px "Cormorant Garamond"'),
    document.fonts.load('italic 400 96px "Cormorant Garamond"'),
    document.fonts.load('italic 400 38px "Cormorant Garamond"'),
    document.fonts.load('500 34px Caveat'),
    document.fonts.load('400 18px "IBM Plex Mono"'),
  ]);
  build();
  window.READY = true;
})();

window.EV = [];
