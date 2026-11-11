// The Mend — one thread, one blanket. SVG polylines joined into a single path.
import { vnoise } from '/core/lib.js';
import { compile, audit } from './engine/geom.js';

export const DUR = 40;

const Y1 = -220;
const Y2 = -20;
const Y3 = 170;
const STOP = [420, Y3];
const BORDER = { L: -800, T: -460, R: 800, B: 460, rad: 100, y: 250 };

function wave(x0, x1, y, amp, cycles, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = x0 + (x1 - x0) * u;
    const env = Math.sin(u * Math.PI);
    const wob = (vnoise(x * 0.012 + y * 0.02) - 0.5) * 8 * env;
    const yy = y + Math.sin(u * cycles * Math.PI * 2) * amp + wob;
    pts.push([x, yy]);
  }
  return pts;
}

function semiDown(x, y0, y1, dir, n) {
  const cy = (y0 + y1) / 2;
  const r = Math.abs(y1 - y0) / 2;
  const start = -Math.PI / 2;
  const sweep = dir > 0 ? Math.PI : -Math.PI;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = start + sweep * (i / n);
    pts.push([x + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function sag(x0, y0, x1, y1, drop, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts.push([
      x0 + (x1 - x0) * u,
      y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * drop,
    ]);
  }
  return pts;
}

function spiral(cx, cy, r0, r1, turns, n) {
  const endA = -Math.PI / 2;
  const a0 = endA - turns * Math.PI * 2;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = a0 + u * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * u;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function roundedFromRight(box, nCorner) {
  const { L, T, R, B, rad, y } = box;
  const pts = [];
  const line = (x0, y0, x1, y1, n) => {
    const start = pts.length ? 1 : 0;
    for (let i = start; i <= n; i++) {
      const u = i / n;
      pts.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u]);
    }
  };
  const corner = (cx, cy, a0, a1) => {
    const start = pts.length ? 1 : 0;
    for (let i = start; i <= nCorner; i++) {
      const u = i / nCorner;
      const a = a0 + (a1 - a0) * u;
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
  };
  line(R, y, R, B - rad, 8);
  corner(R - rad, B - rad, 0, Math.PI / 2);
  line(R - rad, B, L + rad, B, 28);
  corner(L + rad, B - rad, Math.PI / 2, Math.PI);
  line(L, B - rad, L, T + rad, 18);
  corner(L + rad, T + rad, Math.PI, Math.PI * 1.5);
  line(L + rad, T, R - rad, T, 28);
  corner(R - rad, T + rad, -Math.PI / 2, 0);
  line(R, T + rad, R, y, 16);
  return pts;
}

function toD(pts) {
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    d += `${i ? 'L' : 'M'}${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`;
  }
  return d;
}

function chapter(id, pts, t0, t1, voice, extra = {}) {
  return { id, pts, d: toD(pts), t0, t1, voice, ...extra };
}

export function buildFilm() {
  const cx = -430;
  const r1 = 58;
  const cy = Y1 + r1;
  const spool = spiral(cx, cy, 7, r1, 2.2, 90);
  const row1 = wave(cx, 560, Y1, 16, 3, 80);
  const u1 = semiDown(560, Y1, Y2, 1, 36);
  const row2 = wave(560, -560, Y2, 16, 3, 90);
  const u2 = semiDown(-560, Y2, Y3, -1, 36);
  const row3a = wave(-560, 230, Y3, 14, 2, 70);
  const row3b = wave(230, STOP[0], Y3, 12, 1, 28);
  const mend = sag(STOP[0], STOP[1], BORDER.R, BORDER.y, 72, 36);
  const split = 10;
  const bridge = mend.slice(0, split + 1);
  const gold = mend.slice(split);
  const border = roundedFromRight(BORDER, 10);
  const exit = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    exit.push([BORDER.R + u * 1280, BORDER.y]);
  }

  const chapters = [
    chapter('spool', spool, -0.9, 2.4, 'steady'),
    chapter('row1', row1, 2.4, 4.55, 'steady'),
    chapter('u1', u1, 4.55, 5.75, 'steady'),
    chapter('row2', row2, 5.75, 8.35, 'steady'),
    chapter('u2', u2, 8.35, 9.55, 'fatigue'),
    chapter('row3a', row3a, 9.55, 12.15, 'fatigue'),
    chapter('row3b', row3b, 12.15, 14, 'fatigue', { easeOut: true }),
    chapter('hold', [STOP], 14, 16, 'fatigue', { hold: true }),
    chapter('bridge', bridge, 16, 18.25, 'young', { easeIn: true }),
    chapter('gold', gold, 18.25, 23.15, 'young', { accent: true }),
    chapter('border', border, 23.15, 33.05, 'sure'),
    chapter('exit', exit, 33.05, 36.4, 'sure'),
  ];

  const path = compile(chapters);
  const close = audit(path);
  if (close.length) console.warn('one-line proximity', JSON.stringify(close));
  const speeds = path.chapters.map((c) => {
    const v = c.hold ? 0 : c.len / Math.max(0.01, c.t1 - c.t0);
    return `${c.id} ${c.t0.toFixed(2)}-${c.t1.toFixed(2)} ${c.len.toFixed(0)}u ${v.toFixed(0)}/s`;
  });
  console.warn(speeds.join(' | '));

  const hold = path.pts.find((p) => p.ch === 'hold') || { x: STOP[0], y: STOP[1] };
  return {
    path,
    hold: { t0: 14, t1: 16, x: hold.x, y: hold.y },
    camKeys: [
      { t: -0.9, zoom: 3.2, roll: -0.06, follow: 0.9, ax: cx, ay: cy },
      { t: 2.4, zoom: 2.35, roll: -0.025, follow: 0.84, ax: -80, ay: Y1 },
      { t: 4.55, zoom: 1.85, roll: 0, follow: 0.76, ax: 300, ay: Y1 },
      { t: 6.5, zoom: 1.5, roll: 0.02, follow: 0.46, ax: -40, ay: Y2 },
      { t: 9.4, zoom: 1.62, roll: 0.008, follow: 0.5, ax: -200, ay: Y3 },
      { t: 12.15, zoom: 1.95, roll: 0, follow: 0.3, ax: STOP[0], ay: STOP[1] },
      { t: 14, zoom: 2.28, roll: 0, follow: 0.14, ax: STOP[0], ay: STOP[1] },
      { t: 16, zoom: 2.05, roll: -0.05, follow: 0.58, ax: STOP[0], ay: STOP[1] },
      { t: 18.25, zoom: 1.78, roll: -0.02, follow: 0.48, ax: 620, ay: 230 },
      { t: 23.15, zoom: 1.22, roll: 0, follow: 0.26, ax: 0, ay: 40 },
      { t: 27.6, zoom: 0.8, roll: 0, follow: 0.12, ax: 8, ay: 72 },
      { t: 32.4, zoom: 0.58, roll: 0, follow: 0.04, ax: 12, ay: 78 },
      { t: 40, zoom: 0.56, roll: 0, follow: 0, ax: 12, ay: 78 },
    ],
  };
}

export const LINES = [
  { id: 'v01', t: 2.0, text: 'One thread held the night.' },
  { id: 'v02', t: 16.3, text: 'A smaller hand caught the end.' },
  { id: 'v03', t: 20.75, text: 'Only the mend was gold.' },
  { id: 'v04', t: 27.85, text: 'The whole night was a blanket.' },
];

export const TITLE_AT = 33.25;
