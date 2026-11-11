// Single-line chalk capitals. Unit box: x 0–1, y 0 at the top, y 1 on the baseline.
import { widthMul } from './chalk.js';

const EM = {
  A: 0.72, C: 0.66, D: 0.70, E: 0.62, H: 0.74, I: 0.34,
  L: 0.56, M: 0.88, N: 0.74, O: 0.70, S: 0.60, T: 0.64,
  U: 0.70, V: 0.72,
};

// Each stroke is [kind, ...points]. Kinds: arc, stem, bar, diag.
const GLYPH = {
  C: [['arc', [0.82, 0.24], [0.48, 0.02], [0.10, 0.16], [0.02, 0.50], [0.12, 0.84], [0.50, 0.98], [0.82, 0.76]]],
  O: [['arc', [0.50, 0.03], [0.90, 0.16], [0.98, 0.50], [0.88, 0.84], [0.50, 0.98], [0.10, 0.84], [0.02, 0.50], [0.12, 0.16], [0.50, 0.03]]],
  L: [['stem', [0.22, 0.02], [0.24, 0.92]], ['bar', [0.20, 0.94], [0.90, 0.84]]],
  D: [['stem', [0.20, 0.02], [0.22, 0.96]], ['arc', [0.22, 0.06], [0.58, 0.00], [0.98, 0.28], [1.00, 0.55], [0.72, 0.90], [0.22, 0.96]]],
  H: [['stem', [0.16, 0.02], [0.18, 0.98]], ['stem', [0.84, 0.02], [0.82, 0.98]], ['bar', [0.16, 0.52], [0.84, 0.46]]],
  E: [['stem', [0.18, 0.02], [0.20, 0.98]], ['bar', [0.16, 0.08], [0.88, 0.02]], ['bar', [0.18, 0.52], [0.72, 0.46]], ['bar', [0.16, 0.96], [0.90, 0.88]]],
  A: [['diag', [0.06, 0.98], [0.46, 0.02]], ['diag', [0.46, 0.02], [0.94, 0.98]], ['bar', [0.24, 0.62], [0.76, 0.56]]],
  T: [['bar', [0.04, 0.10], [0.96, 0.02]], ['stem', [0.52, 0.08], [0.48, 0.98]]],
  M: [['stem', [0.08, 0.04], [0.06, 0.98]], ['diag', [0.08, 0.06], [0.36, 0.96]], ['diag', [0.36, 0.96], [0.66, 0.06]], ['stem', [0.66, 0.04], [0.92, 0.98]]],
  S: [['arc', [0.86, 0.20], [0.52, 0.02], [0.12, 0.14], [0.08, 0.36], [0.48, 0.50], [0.90, 0.64], [0.88, 0.84], [0.48, 0.98], [0.10, 0.82]]],
  I: [['stem', [0.50, 0.02], [0.46, 0.98]]],
  N: [['stem', [0.10, 0.02], [0.12, 0.98]], ['diag', [0.14, 0.06], [0.84, 0.94]], ['stem', [0.78, 0.02], [0.82, 0.98]]],
  V: [['diag', [0.06, 0.02], [0.46, 0.98]], ['diag', [0.46, 0.98], [0.94, 0.02]]],
  U: [['arc', [0.14, 0.02], [0.10, 0.48], [0.20, 0.86], [0.50, 0.98], [0.82, 0.86], [0.90, 0.48], [0.86, 0.02]]],
};

function cr(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ];
}

function curve(pts) {
  if (pts.length < 3) return pts.map((p) => p.slice());
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  const out = [];
  const steps = 6;
  for (let i = 1; i < p.length - 2; i++) {
    for (let s = 0; s < steps; s++) out.push(cr(p[i - 1], p[i], p[i + 1], p[i + 2], s / steps));
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}

function withBow(a, b, amt) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const out = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const o = Math.sin(Math.PI * u) * amt;
    out.push([a[0] + dx * u + nx * o, a[1] + dy * u + ny * o]);
  }
  return out;
}

function glyphStrokes(ch) {
  const spec = GLYPH[ch];
  if (!spec) throw new Error(`no chalk letter for ${ch}`);
  return spec.map(([kind, ...pts]) => {
    let body;
    if (kind === 'arc') body = curve(pts);
    else body = withBow(pts[0], pts[pts.length - 1], kind === 'bar' ? 0.022 : 0.016);
    if (kind === 'stem' || kind === 'bar') {
      const a = body[0];
      body = [[a[0] - 0.028, a[1] - 0.02], ...body];
    }
    return { kind, pts: body };
  });
}

function mulberry(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function densify(pts, step) {
  if (pts.length < 2) return pts.map((p) => p.slice());
  const out = [pts[0].slice()];
  for (let i = 1; i < pts.length; i++) {
    const a = out[out.length - 1];
    const b = pts[i];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 1; k <= n; k++) {
      const u = k / n;
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
    }
  }
  return out;
}

/**
 * Lay out a word of capitals. Returns stroke point-lists in world units and the word box.
 * opt.wobble is extra pupil shake in world pixels. opt.seed keeps it stable.
 */
export function layoutWord(word, cx, baseline, h, opt = {}) {
  const wobble = opt.wobble || 0;
  const rnd = mulberry(opt.seed || 1);
  const parts = [...word].map((ch) => {
    if (ch === ' ') return { space: true, adv: h * 0.38 };
    const gw = h * EM[ch];
    return { ch, gw, adv: gw };
  });
  let width = 0;
  for (let i = 0; i < parts.length; i++) {
    width += parts[i].adv;
    if (i < parts.length - 1) width += parts[i].space || parts[i + 1].space ? h * 0.04 : h * 0.1;
  }
  let x = cx - width / 2;
  const strokes = [];
  let x0 = Infinity;
  let x1 = -Infinity;
  const heavy = h < 260 ? 0.115 : 0.084;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.space) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x + part.gw);
      for (const stroke of glyphStrokes(part.ch)) {
        const world = stroke.pts.map(([ux, uy]) => {
          const jx = wobble ? (rnd() - 0.5) * wobble : (rnd() - 0.5) * h * 0.008;
          const jy = wobble ? (rnd() - 0.5) * wobble : (rnd() - 0.5) * h * 0.008;
          return [x + ux * part.gw + jx, baseline - h + uy * h + jy];
        });
        const dense = densify(world, 8);
        const samples = dense.map((p, k) => ({
          x: p[0],
          y: p[1],
          w: Math.max(3.2, h * heavy * widthMul(dense.length === 1 ? 0 : k / (dense.length - 1), stroke.kind)),
        }));
        if (samples.length === 1) samples.push({ ...samples[0], x: samples[0].x + 1 });
        strokes.push({ samples, kind: stroke.kind });
      }
    }
    x += part.adv;
    if (i < parts.length - 1) x += part.space || parts[i + 1].space ? h * 0.04 : h * 0.1;
  }
  const pad = h * 0.08;
  return {
    strokes,
    box: { x0: x0 - pad, y0: baseline - h - pad, x1: x1 + pad, y1: baseline + pad },
  };
}

export function polyStroke(pts, width, kind = 'arc') {
  const dense = densify(pts, 8);
  const samples = dense.map((p, k) => ({
    x: p[0],
    y: p[1],
    w: Math.max(3.2, width * widthMul(dense.length === 1 ? 0 : k / (dense.length - 1), kind)),
  }));
  if (samples.length === 1) samples.push({ ...samples[0], x: samples[0].x + 1 });
  return samples;
}
