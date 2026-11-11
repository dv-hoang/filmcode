// Watercolor stroke engine: a variable-width ribbon of thin wash plus dashed
// bristle tracks (dry-brush "flying white"). Everything is a pure function of
// its seed; any stroke built inside render() must sit in withSeed().
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry, hash, vnoise, monotone, TAU } from '/core/lib.js';

export { clamp, lerp, seg, ss, eio, eo, ei, back, monotone, TAU };

let _r = mulberry(1);
export const seed = n => { _r = mulberry(n); };
export const withSeed = (n, fn) => { const p = _r; _r = mulberry(n); try { return fn(); } finally { _r = p; } };
export const rnd = (a = 0, b = 1) => a + (b - a) * _r();
export const pick = arr => arr[Math.floor(_r() * arr.length) % arr.length];
export const chance = p => _r() < p;
export const gauss = () => {
  let u = 0, v = 0; while (u === 0) u = _r(); while (v === 0) v = _r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
};

// ---------- colour ----------
export const hex2rgb = h => {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
export const rgba = (h, a = 1) => { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; };
export const mixc = (h1, h2, t) => {
  const a = hex2rgb(h1), b = hex2rgb(h2), m = a.map((v, i) => Math.round(lerp(v, b[i], clamp(t))));
  return '#' + m.map(v => v.toString(16).padStart(2, '0')).join('');
};
export const darken = (h, f) => mixc(h, '#241d16', f);
export const lighten = (h, f) => mixc(h, '#fbf6ea', f);

// ---------- centre-line helpers ----------
export function sample(pts, step = 2.2) {
  // Catmull-Rom through the control points, resampled at roughly `step` px
  const P = pts.length < 3 ? pts.slice() : pts;
  const out = [];
  const at = i => P[clamp(i, 0, P.length - 1)];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(2, Math.ceil(d / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      out.push([x, y]);
    }
  }
  out.push(P[P.length - 1].slice());
  return out;
}

export function qcurve(x0, y0, x1, y1, bend = 0, n = 7) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const cx = (x0 + x1) / 2 + nx * bend, cy = (y0 + y1) / 2 + ny * bend;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, mt = 1 - t;
    pts.push([mt * mt * x0 + 2 * mt * t * cx + t * t * x1, mt * mt * y0 + 2 * mt * t * cy + t * t * y1]);
  }
  return pts;
}

export function polar(x, y, ang, len, bend = 0, n = 6) {
  return qcurve(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len, bend, n);
}

const PROF = {
  brush: u => Math.min(1, 0.55 + 0.9 * Math.sin(Math.PI * Math.min(1, u * 1.18)) ** 0.5) * (1 - 0.15 * u),
  leaf: u => Math.sin(Math.PI * clamp(u)) ** 0.72,
  even: u => Math.min(1, Math.min(u, 1 - u) * 7 + 0.18),
  tip: u => 1 - 0.88 * clamp(u) ** 1.3,
  trunk: u => 0.62 + 0.38 * (1 - clamp(u)) ** 0.8,
};

// ---------- build a stroke ----------
// o: { prof, nb, a, rib, rough, phase, tracks? }
export function mk(pts, w, col, o = {}) {
  const S = sample(pts, Math.max(1.6, Math.min(3, w / 5)));
  const n = S.length;
  const prof = PROF[o.prof || 'brush'] || PROF.brush;
  const nbset = o.nb !== undefined ? o.nb : (w >= 6 ? clamp(Math.round(w / 3.2), 3, 9) : 0);
  const rough = o.rough !== undefined ? o.rough : 0.22;
  const ph = o.phase !== undefined ? o.phase : rnd(0, 500);
  const wd = new Float32Array(n);
  let len = 0;
  for (let i = 1; i < n; i++) len += Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]);
  const cum = new Float32Array(n);
  for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const nz = vnoise(u * len * 0.05 + ph) * 2 - 1;
    wd[i] = Math.max(0.25, w * prof(u) * (1 + rough * nz));
  }
  const tracks = [];
  for (let b = 0; b < nbset; b++) {
    const off = rnd(-0.46, 0.46);
    const a = rnd(0.3, 0.82);
    const lw = clamp(w * rnd(0.05, 0.11), 0.5, 3.4);
    const endU = rnd(0.55, 1);
    // dashes in arc-length units
    const segs = [];
    let u = rnd(0, 0.2);
    while (u < endU) {
      const runPx = rnd(14, 90) * (0.6 + Math.min(1.4, w / 26));
      const gapPx = rnd(2, 12) * (0.6 + Math.min(1.4, w / 26));
      const u0 = u, u1 = Math.min(endU, u + runPx / Math.max(1, len));
      if (u1 > u0 + 0.004) segs.push([u0, u1]);
      u = u1 + gapPx / Math.max(1, len);
    }
    if (!segs.length) segs.push([0, endU]);
    tracks.push({ off, a, lw, segs });
  }
  return { S, wd, w, col, o, len, cum, tracks, n };
}

function polyline(c, S, i0, i1) {
  c.beginPath();
  c.moveTo(S[i0][0], S[i0][1]);
  for (let i = i0 + 1; i <= i1; i++) c.lineTo(S[i][0], S[i][1]);
}

// paint stroke s on context c up to fraction p of its length
export function drawS(c, s, p = 1, col, am = 1) {
  if (!s || p <= 0) return;
  p = clamp(p);
  const { S, wd, n } = s;
  const k = Math.max(1, Math.round(p * (n - 1)));
  const a = (s.o.a !== undefined ? s.o.a : 0.92) * am;
  const rib = s.o.rib !== undefined ? s.o.rib : (s.tracks.length ? 0.6 : 0.92);
  const colour = col || s.col;

  // body: thin wash ribbon
  c.save();
  c.fillStyle = rgba(colour, a * rib);
  c.beginPath();
  for (let i = 0; i <= k; i++) {
    const i2 = Math.min(n - 1, i + 1), i0 = Math.max(0, i - 1);
    let tx = S[i2][0] - S[i0][0], ty = S[i2][1] - S[i0][1];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    let wv = wd[i];
    if (p < 1) wv *= Math.min(1, (k - i) / 7 + 0.06);   // moving brush tip
    const hw = wv / 2;
    const x = S[i][0] - ty * hw, y = S[i][1] + tx * hw;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  for (let i = k; i >= 0; i--) {
    const i2 = Math.min(n - 1, i + 1), i0 = Math.max(0, i - 1);
    let tx = S[i2][0] - S[i0][0], ty = S[i2][1] - S[i0][1];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    let wv = wd[i];
    if (p < 1) wv *= Math.min(1, (k - i) / 7 + 0.06);
    const hw = wv / 2;
    c.lineTo(S[i][0] + ty * hw, S[i][1] - tx * hw);
  }
  c.closePath();
  c.fill();

  // bristle tracks: dashed, offset across the ribbon, each ending early
  c.lineCap = 'round';
  for (const tr of s.tracks) {
    c.strokeStyle = rgba(colour, a * tr.a);
    c.lineWidth = tr.lw;
    for (const [u0, u1] of tr.segs) {
      const a0 = u0 * (n - 1), a1 = Math.min(p * (n - 1), u1 * (n - 1));
      if (a1 <= a0) continue;
      const i0 = Math.floor(a0), i1 = Math.ceil(a1);
      c.beginPath();
      for (let i = i0; i <= i1; i++) {
        const i2 = Math.min(n - 1, i + 1), im = Math.max(0, i - 1);
        let tx = S[i2][0] - S[im][0], ty = S[i2][1] - S[im][1];
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const hw = wd[i] * 0.5 * tr.off;
        const x = S[i][0] - ty * hw, y = S[i][1] + tx * hw;
        if (i === i0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    }
  }
  c.restore();
}

// a pooled wash of a closed shape: fruit, canopy masses, shadows
export function blob(pts, col, a = 0.6, passes = 3, jitter = 1.6, sharp = false) {
  return { blob: pts, col, a, passes, jitter, sharp, seed: Math.floor(rnd(0, 1e6)) };
}
export function circle(cx, cy, r, n = 14, sy = 1) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r * sy]);
  }
  return pts;
}

// each stroke takes a slice of the list's progress, structure first
export function drawList(c, L, p = 1) {
  if (!L || !L.length) return;
  const N = L.length;
  const sl = clamp(4 / N, 0.12, 0.5);
  for (let i = 0; i < N; i++) {
    const t = (p - i / N) / sl;
    if (t <= 0) break;
    const it = L[i];
    if (!it) continue;
    if (it.blob) {
      withSeed(it.seed, () => {
        c.save();
        c.globalAlpha = it.a * Math.min(1, t * 1.6);
        washPoly(c, it.blob, it.col, 1, it.passes, it.jitter, it.sharp);
        c.restore();
      });
      continue;
    }
    drawS(c, it, Math.min(1, t));
  }
}

// rasterise a finished stroke list to an offscreen canvas (sprite cache)
export function sprite(L, col) {
  if (!L.length) return null;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const add = (x, y) => {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  };
  for (const s of L) {
    if (!s) continue;
    if (s.blob) { for (const [x, y] of s.blob) add(x, y); continue; }
    for (const [x, y] of s.S) add(x, y);
  }
  const pad = 10;
  const w = Math.ceil(x1 - x0 + pad * 2), h = Math.ceil(y1 - y0 + pad * 2);
  if (w <= 0 || h <= 0 || w > 8000 || h > 8000) return null;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.translate(-x0 + pad, -y0 + pad);
  drawList(c, L, 1, col);
  return { cv, x0: x0 - pad, y0: y0 - pad, w, h };
}

// three jittered passes: pooled watercolour edge
export function washPoly(c, pts, fill, alpha = 0.5, passes = 3, jitter = 2.4, sharp = false) {
  if (!pts.length) return;
  for (let k = 0; k < passes; k++) {
    c.beginPath();
    const j = () => rnd(-jitter, jitter);
    if (sharp) {
      c.moveTo(pts[0][0] + j(), pts[0][1] + j());
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0] + j(), pts[i][1] + j());
    } else {
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[(i + 1) % pts.length];
        const mx = (p[0] + q[0]) / 2 + j(), my = (p[1] + q[1]) / 2 + j();
        if (i === 0) { c.moveTo((p[0] + pts[pts.length - 1][0]) / 2 + j(), (p[1] + pts[pts.length - 1][1]) / 2 + j()); }
        c.quadraticCurveTo(p[0] + j(), p[1] + j(), mx, my);
      }
    }
    c.closePath();
    c.fillStyle = rgba(fill, alpha * 1.55 / passes);
    c.fill();
  }
}

// n leaf dabs inside an ellipse
export function clump(S, cx, cy, r, n, cols, o = {}) {
  const sx = o.sx || 1, sy = o.sy || 1;
  for (let i = 0; i < n; i++) {
    const ang = o.dir !== undefined ? o.dir + rnd(-(o.spread || 0.8), o.spread || 0.8) : rnd(0, TAU);
    const rr = Math.sqrt(_r()) * r;
    const x = cx + Math.cos(ang) * rr * sx, y = cy + Math.sin(ang) * rr * sy;
    const l = rnd(o.l0 || 8, o.l1 || 16);
    const w = rnd(o.w0 || 3, o.w1 || 6);
    const col = pick(cols);
    const a = rnd(o.a0 || 0.5, o.a1 || 0.9);
    const bend = rnd(-l * 0.25, l * 0.25);
    S.push(mk(qcurve(x, y, x + Math.cos(ang) * l, y + Math.sin(ang) * l, bend, 3), w, col, { prof: 'leaf', a, nb: 0, rough: 0.3 }));
  }
}

// darker edge along one side of an existing stroke
export function edgeOf(s, side = 1, w = 2.6, col, a = 0.8) {
  const S = s.S, n = S.length, pts = [];
  const k = Math.max(2, Math.round(n * 0.94));
  for (let i = 0; i < k; i++) {
    const i2 = Math.min(n - 1, i + 1), i0 = Math.max(0, i - 1);
    let tx = S[i2][0] - S[i0][0], ty = S[i2][1] - S[i0][1];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const hw = s.wd[i] * 0.46;
    pts.push([S[i][0] - ty * hw * side, S[i][1] + tx * hw * side]);
  }
  return mk(pts, w, col || s.col, { prof: 'even', nb: 2, a, rough: 0.3 });
}
