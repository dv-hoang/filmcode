// Alborada — one harvest morning on a family coffee farm.
// One painted sheet, read left to right: first light, the slope, the mill, the patio, the cup.
import {
  clamp, lerp, seg, ss, eio, eo, ei, monotone, TAU,
  rnd, pick, chance, withSeed,
  mixc, darken, lighten,
  mk, drawS, drawList, sprite, washPoly, edgeOf, qcurve, blob, circle,
} from './engine.js';

export const W = 1920, H = 1080;
export const DUR = 45;

// ---------- palette (paper is the white) ----------
export const INK = '#2b2520';
export const INK2 = '#3d3129';
export const ACCENT = '#c8442a';
export const ACCENT_D = '#93291a';
export const SKY_HI = '#9db4bd';
export const SKY_LO = '#e9dcbb';
export const HILL_FAR = '#a9b6ae';
export const HILL_MID = '#8b9c86';
export const FIELD = '#d3c09a';
export const FIELD_D = '#b99a6b';
export const LEAF_D = '#33502f';
export const LEAF_M = '#4f7038';
export const LEAF_L = '#7d9a52';
export const SAGE = '#9cab7c';
export const STEM = '#6b563c';
export const WOOD = '#7c5c3c';
export const STONE = '#a8a496';
export const ROOF = '#9c5f43';
export const CUP = '#efe8d6';
export const SHIRT = '#6f8494';
export const WATERCOL = '#7d98a5';

export const LAY = {
  far: { f: 0.26 },
  mid: { f: 0.52 },
  main: { f: 1.0 },
};

export const CAMX = monotone([[0, 430], [3, 430], [9, 520], [21, 4520], [30, 6180], [38.2, 7760], [40.2, 8350], [42.4, 8372], [45, 8400]]);
export const CAMY = monotone([[0, 470], [2.6, 470], [6.2, 610], [9, 618], [21, 622], [25.5, 668], [30, 600], [37.4, 676], [40.2, 742], [42.4, 752], [45, 760]]);
export const ZOOM = monotone([[0, 3.1], [2.7, 3.1], [5.2, 1.16], [6.6, 1.0], [38.6, 1.0], [40.6, 1.44], [42.4, 1.62], [44.9, 0.88]]);

export const camAt = t => ({ x: CAMX(t), y: CAMY(t), z: ZOOM(t) });
const sxOf = (wx, f, cam) => (wx - cam.x) * f * cam.z + W / 2;
const syOf = (wy, f, cam) => (wy - cam.y) * f * cam.z + H / 2;

// ---------- small drawing helpers ----------
function leaf(S, x, y, ang, len, wid, col, a = 0.8) {
  const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
  const bend = rnd(-len * 0.24, len * 0.24);
  // two overlapping ribbons, slightly different angles: a leaf built of pigment, not a shape
  const ang2 = ang + rnd(-0.09, 0.09);
  S.push(mk(qcurve(x, y, x + Math.cos(ang2) * len * rnd(0.9, 1.02), y + Math.sin(ang2) * len * rnd(0.9, 1.02), bend * 1.1, 5), wid, col, { prof: 'leaf', a: a * 0.78, nb: 3, rough: 0.4, phase: rnd(0, 900) }));
  S.push(mk(qcurve(x + rnd(-2, 2), y + rnd(-2, 2), x2, y2, bend * 0.7, 4), wid * 0.62, darken(col, 0.16), { prof: 'leaf', a: a * 0.52, nb: 2, rough: 0.45, phase: rnd(0, 900) }));
  // midrib, and a dry-brush tip
  S.push(mk(qcurve(x, y, x2, y2, bend * 0.9, 4), Math.max(0.8, wid * 0.08), darken(col, 0.42), { prof: 'even', a: a * 0.5, nb: 0, rough: 0.2 }));
  if (chance(0.5)) S.push(mk(qcurve(lerp(x, x2, 0.3), lerp(y, y2, 0.3), lerp(x, x2, 0.85), lerp(y, y2, 0.85), bend, 3), wid * 0.34, lighten(col, 0.3), { prof: 'leaf', a: a * 0.22, nb: 0 }));
}

function cherry(S, cx, cy, r, a = 0.92) {
  // a coffee cherry: a pooled red wash, a darker side, a glossy pip of paper
  S.push(blob(circle(cx, cy, r, 12, 0.94), ACCENT, a, 3, Math.max(0.7, r * 0.14)));
  S.push(blob(circle(cx + r * 0.22, cy + r * 0.2, r * 0.82, 10, 0.9), ACCENT_D, a * 0.34, 2, Math.max(0.6, r * 0.12)));
  S.push(blob(circle(cx - r * 0.3, cy - r * 0.32, r * 0.3, 8), lighten(ACCENT, 0.62), a * 0.5, 2, Math.max(0.4, r * 0.06)));
  // a short stem into the branch
  S.push(mk(qcurve(cx + r * 0.1, cy - r * 0.85, cx + r * 0.3, cy - r * 1.5, r * 0.2, 2), Math.max(0.8, r * 0.13), darken(STEM, 0.2), { prof: 'even', a: a * 0.6, nb: 0 }));
}

// ---------- generators (local coords, root 0,0, y down) ----------
export function coffeeShrub(sc = 1, o = {}) {
  const S = [];
  const h = rnd(150, 195) * sc;
  // shadow pooled at the root
  S.push(blob([[rnd(-30, -10) * sc, 2 * sc], [rnd(10, 30) * sc, 4 * sc], [rnd(20, 40) * sc, -6 * sc], [rnd(-40, -20) * sc, -4 * sc]], mixc(LEAF_D, INK, 0.25), 0.22, 2, 4 * sc));
  const stems = Math.round(rnd(3, 5));
  const stemPts = [];
  for (let i = 0; i < stems; i++) {
    const a = rnd(-0.45, 0.45);
    const len = h * rnd(0.8, 1.05);
    const pts = qcurve(rnd(-8, 8) * sc, 0, Math.sin(a) * len * 0.85, -Math.cos(a) * len, rnd(-12, 12) * sc, 5);
    S.push(mk(pts, rnd(3.0, 5.0) * sc, mixc(STEM, LEAF_D, rnd(0.3, 0.7)), { prof: 'trunk', a: 0.9, nb: 2, rough: 0.18 }));
    stemPts.push(pts);
  }
  for (const P of stemPts) {
    const nodes = Math.round(rnd(5, 7));
    for (let n = 0; n < nodes; n++) {
      const u = 0.12 + 0.88 * (n / Math.max(1, nodes - 1));
      const i = clamp(Math.round(u * (P.length - 1)), 0, P.length - 1);
      const x = P[i][0] + rnd(-2, 2) * sc, y = P[i][1] + rnd(-2, 2) * sc;
      const nl = 2 + (chance(0.45) ? 1 : 0);
      for (let k = 0; k < nl; k++) {
        const dir = rnd(-Math.PI, Math.PI) * 0.55 + (k === 0 ? 0.25 : Math.PI - 0.25) + rnd(-0.35, 0.35);
        leaf(S, x, y, dir, rnd(24, 40) * sc, rnd(6, 10) * sc,
          pick([LEAF_D, mixc(LEAF_D, LEAF_M, 0.5), LEAF_M, mixc(LEAF_M, SAGE, 0.35)]), rnd(0.62, 0.9));
      }
      if (chance(o.rich || 0.55)) {
        const cn = Math.round(rnd(3, 7));
        const bx = x + rnd(-4, 4) * sc, by = y + rnd(2, 12) * sc;
        for (let c = 0; c < cn; c++) cherry(S, bx + rnd(-7, 7) * sc, by + rnd(-6, 9) * sc, rnd(3.4, 4.8) * sc, rnd(0.85, 0.97));
      }
    }
  }
  // a few dabs behind the stems so the bush has mass
  for (let i = 0; i < Math.round(rnd(8, 14)); i++) {
    const x = rnd(-26, 26) * sc, y = -rnd(0.25, 0.95) * h;
    leaf(S, x, y, rnd(-Math.PI, Math.PI), rnd(18, 30) * sc, rnd(5, 8) * sc, pick([mixc(LEAF_D, LEAF_M, 0.3), LEAF_D]), rnd(0.35, 0.6));
  }
  return { S, h };
}

export function heroCherry() {
  const S = [];
  // one branch, sampled so leaves and fruit can hang from it
  const B = qcurve(-430, 186, 150, -56, 30, 12);
  S.push(mk(B, 6.5, darken(STEM, 0.18), { prof: 'trunk', a: 0.95, nb: 3, rough: 0.14 }));
  // leaves: paired at nodes, each turned away from the branch
  const nodes = [2, 4, 6, 8, 10];
  for (let i = 0; i < nodes.length; i++) {
    const k = nodes[i];
    const a = B[k], b = B[Math.min(B.length - 1, k + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (const side of [-1, 1]) {
      if (i === 0 && side > 0) continue;
      const dir = ang + side * (1.15 + rnd(-0.18, 0.18));
      const len = (i === 2 || i === 3 ? 76 : 62) * rnd(0.92, 1.06);
      leaf(S, a[0] + side * 3, a[1] + side * 2, dir, len, i % 2 ? 21 : 18, i % 2 ? LEAF_D : mixc(LEAF_M, LEAF_L, 0.3), 0.82);
    }
  }
  // cherries hanging under the branch
  const fruit = [[1, 20], [3, 23], [5, 21], [7, 19], [8, 17], [10, 15]];
  for (const [k, r] of fruit) {
    const a = B[k];
    cherry(S, a[0] + rnd(-4, 4), a[1] + r * rnd(0.7, 1.05), r, 0.94);
  }
  return { S, h: 220 };
}

export function shadeTree(sc = 1) {
  const S = [];
  const h = rnd(420, 500) * sc;
  const trunk = mk(qcurve(0, 0, rnd(-30, 30) * sc, -h * 0.62, rnd(-14, 14) * sc, 6), 40 * sc, darken(WOOD, 0.34), { prof: 'trunk', a: 0.94, nb: 5, rough: 0.11 });
  S.push(trunk, edgeOf(trunk, 1, 3.6 * sc, INK2, 0.6));
  // a small root flare
  S.push(mk(qcurve(-26 * sc, 4 * sc, -6 * sc, -26 * sc, -6 * sc, 3), 14 * sc, darken(WOOD, 0.4), { prof: 'trunk', a: 0.5, nb: 2 }));
  S.push(mk(qcurve(26 * sc, 4 * sc, 6 * sc, -26 * sc, 6 * sc, 3), 14 * sc, darken(WOOD, 0.4), { prof: 'trunk', a: 0.5, nb: 2 }));
  for (let i = 0; i < 5; i++) {
    const y0 = -rnd(0.12, 0.55) * h;
    S.push(mk(qcurve(rnd(-12, 12) * sc, y0, rnd(-10, 10) * sc, y0 - rnd(40, 130) * sc, rnd(-6, 6), 4), rnd(1.4, 3.2) * sc, darken(WOOD, 0.45), { prof: 'even', a: 0.4, nb: 0 }));
  }
  const tips = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + rnd(-1.15, 1.15);
    const x0 = rnd(-12, 12) * sc, y0 = -h * rnd(0.45, 0.66);
    const len = rnd(150, 240) * sc;
    const ex = x0 + Math.cos(a) * len, ey = y0 + Math.sin(a) * len;
    S.push(mk(qcurve(x0, y0, ex, ey, rnd(-30, 30) * sc, 5), rnd(7, 11) * sc, darken(WOOD, 0.2), { prof: 'trunk', a: 0.9, nb: 2, rough: 0.16 }));
    tips.push([ex, ey]);
    // a second fork
    const a2 = a + rnd(-0.6, 0.6), l2 = rnd(45, 85) * sc;
    S.push(mk(qcurve(ex, ey, ex + Math.cos(a2) * l2, ey + Math.sin(a2) * l2, rnd(-16, 16) * sc, 4), rnd(4, 7) * sc, darken(WOOD, 0.24), { prof: 'trunk', a: 0.8, nb: 2 }));
    tips.push([ex + Math.cos(a2) * l2, ey + Math.sin(a2) * l2]);
  }
  const cy = -h * 0.84;
  // canopy: eight small irregular masses, all different
  for (let c = 0; c < 8; c++) {
    const a = rnd(0, TAU), rr = rnd(0, 100) * sc;
    const cx = Math.cos(a) * rr * 1.25, cyy = cy + 18 * sc + Math.sin(a) * rr * 0.7, R = rnd(58, 96) * sc;
    const pts = [];
    const n = 22;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU, r2 = R * rnd(0.6, 1.25);
      pts.push([cx + Math.cos(t) * r2 * 1.24, cyy + Math.sin(t) * r2 * 0.8]);
    }
    S.push({ poly: pts, col: mixc(LEAF_D, LEAF_M, rnd(0.1, 0.45)), a: rnd(0.2, 0.34), kind: 'wash' });
  }
  for (const [cxx, cyy, R] of [[0, cy + 20 * sc, 175], [-120 * sc, cy + 50 * sc, 130], [130 * sc, cy + 30 * sc, 125]]) {
    const r2 = R * sc;
    const n = Math.round(rnd(85, 120));
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), rr = Math.sqrt(rnd(0, 1)) * r2;
      const x = cxx + Math.cos(a) * rr * 1.35, y = cyy + Math.sin(a) * rr * 0.82;
      leaf(S, x, y, rnd(-Math.PI, Math.PI), rnd(12, 24) * sc, rnd(4.5, 8) * sc, pick([LEAF_D, mixc(LEAF_D, LEAF_M, 0.4), LEAF_M, mixc(LEAF_M, SAGE, 0.35), mixc(LEAF_M, LEAF_L, 0.5)]), rnd(0.38, 0.75));
    }
  }
  return { S, h, canopy: cy };
}

export function farTree(sc = 1) {
  const S = [];
  const h = rnd(90, 150) * sc;
  S.push(mk(qcurve(0, 0, rnd(-4, 4), -h, 0, 4), 7 * sc, mixc(SAGE, WOOD, 0.4), { prof: 'trunk', a: 0.55, nb: 1, rough: 0.15 }));
  const n = Math.round(rnd(26, 38));
  for (let i = 0; i < n; i++) {
    const a = rnd(0, TAU), rr = Math.sqrt(rnd(0, 1));
    leaf(S, Math.cos(a) * rr * 58 * sc, -h * 0.78 + Math.sin(a) * rr * 30 * sc, rnd(-Math.PI, Math.PI), rnd(8, 16) * sc, rnd(3.5, 6) * sc, pick([SAGE, mixc(SAGE, LEAF_M, 0.45), mixc(SAGE, HILL_FAR, 0.4)]), rnd(0.3, 0.6));
  }
  return { S, h };
}

export function pickHand(sc = 1, o = {}) {
  const S = [];
  const curl = o.curl !== undefined ? o.curl : 0.55;
  const skin = '#dcb391';
  S.push(mk(qcurve(-120, 56, -34, 10, 8, 5), 30 * sc, skin, { prof: 'brush', a: 0.6, nb: 3, rough: 0.3 }));
  for (let f = 0; f < 4; f++) {
    const fx = -26 + f * 12.5;
    const a = -0.62 + f * 0.17;
    const l = (32 - Math.abs(f - 1.4) * 3.5) * sc;
    const k = 0.45 + curl * 0.95;
    const p0 = [fx, -2 - f * 1.0];
    const p1 = [fx + Math.cos(a) * l * 0.62, p0[1] + Math.sin(a) * l * 0.62];
    const p2 = [p1[0] + Math.cos(a + k) * l * 0.55, p1[1] + Math.sin(a + k) * l * 0.55];
    const fg = mk([p0, p1, p2], 9 * sc, skin, { prof: 'brush', a: 0.66, nb: 2, rough: 0.28 });
    S.push(fg, edgeOf(fg, -1, 1.6 * sc, '#a97a55', 0.45));
  }
  S.push(mk(qcurve(-16, 18, 16 + 10 * curl, 32 * curl + 10, -10, 4), 11 * sc, '#d3a987', { prof: 'brush', a: 0.62, nb: 2, rough: 0.26 }));
  S.push(mk(qcurve(-180, 78, -120, 54, 10, 4), 34 * sc, SHIRT, { prof: 'brush', a: 0.5, nb: 3, rough: 0.34 }));
  S.push(mk(qcurve(-182, 96, -118, 72, 12, 4), 6 * sc, darken(SHIRT, 0.3), { prof: 'even', a: 0.4, nb: 0 }));
  return { S, h: 120 };
}

export function basket(sc = 1) {
  const S = [];
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI * (i / 18);
    pts.push([-Math.cos(a) * 62 * sc, Math.sin(a) * 55 * sc]);
  }
  S.push(mk(pts, 8 * sc, darken(WOOD, 0.12), { prof: 'even', a: 0.82, nb: 3, rough: 0.2 }));
  S.push(mk(qcurve(-66 * sc, -3 * sc, 66 * sc, -6 * sc, 8 * sc, 6), 7 * sc, WOOD, { prof: 'even', a: 0.7, nb: 3 }));
  for (let i = 0; i < 7; i++) {
    const x = -56 + i * 18.6;
    S.push(mk(qcurve(x * sc, -2 * sc, x * sc * 0.9, 48 * sc, 3 * sc, 3), 2.2 * sc, darken(WOOD, 0.35), { prof: 'even', a: 0.45, nb: 0 }));
  }
  for (let i = 0; i < 26; i++) {
    const a = rnd(-1, 1), r = Math.sqrt(rnd(0, 1));
    cherry(S, a * 52 * sc * r, -8 * sc - rnd(0, 22) * sc - r * 6 * sc, rnd(3.6, 5) * sc, rnd(0.8, 0.95));
  }
  return { S, h: 80 };
}

export function mill(sc = 1) {
  const S = [];
  const Wd = 720 * sc, Ht = 300 * sc;
  // stone wall, sharp
  S.push({ poly: [[-Wd / 2, 0], [Wd / 2, 0], [Wd / 2, -Ht], [-Wd / 2, -Ht]], col: mixc(STONE, '#efe6d0', 0.55), a: 0.86, kind: 'wash', sharp: true });
  // shadow under the eaves
  S.push({ poly: [[-Wd / 2, -Ht], [Wd / 2, -Ht], [Wd / 2, -Ht + 46 * sc], [-Wd / 2, -Ht + 46 * sc]], col: darken(STONE, 0.25), a: 0.22, kind: 'wash', sharp: true });
  // gable roof
  S.push({ poly: [[-Wd / 2 - 46 * sc, -Ht], [0, -Ht - 118 * sc], [Wd / 2 + 46 * sc, -Ht]], col: ROOF, a: 0.62, kind: 'wash', sharp: true });
  S.push(mk(qcurve(-Wd / 2 - 46 * sc, -Ht, 0, -Ht - 118 * sc, 4, 4), 9 * sc, darken(ROOF, 0.3), { prof: 'even', a: 0.85, nb: 3 }));
  S.push(mk(qcurve(0, -Ht - 118 * sc, Wd / 2 + 46 * sc, -Ht, 4, 4), 9 * sc, darken(ROOF, 0.3), { prof: 'even', a: 0.85, nb: 3 }));
  for (let i = 1; i < 8; i++) {
    const u = i / 8;
    S.push(mk(qcurve(lerp(-Wd / 2 - 46 * sc, 0, u), lerp(-Ht, -Ht - 118 * sc, u), lerp(Wd / 2 + 46 * sc, 0, u), lerp(-Ht - 118 * sc, -Ht, u), -6 * sc, 3), 2.2 * sc, darken(ROOF, 0.42), { prof: 'even', a: 0.3, nb: 0 }));
  }
  // door
  S.push({ poly: [[-70 * sc, 0], [30 * sc, 0], [30 * sc, -168 * sc], [-70 * sc, -168 * sc]], col: mixc(INK, '#4a3a2a', 0.4), a: 0.55, kind: 'wash', sharp: true });
  S.push(mk(qcurve(-76 * sc, -170 * sc, 36 * sc, -170 * sc, 3, 4), 8 * sc, darken(WOOD, 0.25), { prof: 'even', a: 0.8, nb: 2 }));
  // little window with bars
  S.push({ poly: [[130 * sc, -86 * sc], [206 * sc, -86 * sc], [206 * sc, -160 * sc], [130 * sc, -160 * sc]], col: mixc(INK, '#3a4a52', 0.35), a: 0.45, kind: 'wash', sharp: true });
  S.push(mk(qcurve(130 * sc, -123 * sc, 206 * sc, -123 * sc, 0, 3), 2.6 * sc, darken(WOOD, 0.3), { prof: 'even', a: 0.7, nb: 0 }));
  S.push(mk(qcurve(168 * sc, -86 * sc, 168 * sc, -160 * sc, 0, 3), 2.6 * sc, darken(WOOD, 0.3), { prof: 'even', a: 0.7, nb: 0 }));
  // stone courses
  for (let i = 0; i < 6; i++) {
    const y = -8 * sc - i * 44 * sc;
    S.push(mk(qcurve(-Wd / 2 + 14 * sc, y, Wd / 2 - 14 * sc, y + rnd(-3, 3) * sc, rnd(-2, 2), 4), rnd(1.2, 2.2) * sc, darken(STONE, 0.3), { prof: 'even', a: rnd(0.12, 0.24), nb: 1 }));
  }
  // the pulper on the left: drum, funnel, pipe into the mill
  const hx = -250 * sc, hy = 8 * sc;
  S.push({ poly: [[hx - 74 * sc, hy], [hx + 46 * sc, hy - 6 * sc], [hx + 46 * sc, hy - 96 * sc], [hx - 74 * sc, hy - 90 * sc]], col: mixc('#8c7a5e', STONE, 0.35), a: 0.5, kind: 'wash', sharp: true });
  S.push(mk(qcurve(hx - 74 * sc, hy - 94 * sc, hx + 46 * sc, hy - 100 * sc, 4, 4), 9 * sc, darken(WOOD, 0.3), { prof: 'even', a: 0.85, nb: 3 }));
  S.push(mk(qcurve(hx - 74 * sc, hy, hx + 46 * sc, hy - 6 * sc, 4, 4), 9 * sc, darken(WOOD, 0.35), { prof: 'even', a: 0.8, nb: 2 }));
  for (let i = 0; i < 5; i++) {
    S.push(mk(qcurve(hx - 70 * sc, hy - 14 * sc - i * 16 * sc, hx + 42 * sc, hy - 20 * sc - i * 16 * sc, 2, 3), 1.6 * sc, darken(WOOD, 0.45), { prof: 'even', a: 0.28, nb: 0 }));
  }
  // funnel above the drum
  S.push({ poly: [[hx - 60 * sc, hy - 104 * sc], [hx + 34 * sc, hy - 110 * sc], [hx + 8 * sc, hy - 168 * sc], [hx - 34 * sc, hy - 164 * sc]], col: darken(WOOD, 0.15), a: 0.6, kind: 'wash', sharp: true });
  S.push(mk(qcurve(hx - 60 * sc, hy - 104 * sc, hx + 34 * sc, hy - 110 * sc, 2, 3), 5 * sc, darken(WOOD, 0.4), { prof: 'even', a: 0.8, nb: 2 }));
  // chute from the drum into the mill wall
  S.push(mk(qcurve(hx + 44 * sc, hy - 40 * sc, -Wd / 2 + 10 * sc, hy - 70 * sc, -14 * sc, 4), 16 * sc, mixc(STONE, WOOD, 0.4), { prof: 'trunk', a: 0.5, nb: 2 }));
  // water channel in front, in perspective
  S.push({ poly: [[-Wd / 2 - 120 * sc, 34 * sc], [Wd / 2 + 240 * sc, 6 * sc], [Wd / 2 + 300 * sc, 84 * sc], [-Wd / 2 - 140 * sc, 96 * sc]], col: WATERCOL, a: 0.3, kind: 'wash', sharp: true });
  for (let i = 0; i < 18; i++) {
    const x = -Wd / 2 - 90 * sc + i * 58 * sc;
    S.push(mk(qcurve(x, 48 * sc + rnd(-2, 6), x + rnd(40, 90) * sc, 46 * sc + rnd(-2, 8), rnd(-4, 4), 3), rnd(1.2, 2.6) * sc, lighten(WATERCOL, 0.45), { prof: 'even', a: rnd(0.3, 0.55), nb: 1 }));
  }
  // stone lip of the channel
  S.push(mk(qcurve(-Wd / 2 - 120 * sc, 32 * sc, Wd / 2 + 240 * sc, 4 * sc, 3, 5), 5 * sc, darken(STONE, 0.2), { prof: 'even', a: 0.5, nb: 2 }));
  return { S, h: Ht * 1.2 };
}

export function dryingBed(sc = 1, o = {}) {
  const S = [];
  const L = 560 * sc, D = 92 * sc;
  // the frame: a trapezoid, so the beds read as receding
  const near = 1, far = 0.78;
  const fr = [
    [-L / 2 * far, -D * far - 6 * sc], [L / 2 * far, -D * far - 10 * sc],
    [L / 2, -8 * sc], [-L / 2, -4 * sc],
  ];
  S.push({ poly: fr, col: '#caa87a', a: 0.4, kind: 'wash', sharp: true });
  // the coffee layer inside
  S.push({ poly: [[-L / 2 * far + 10 * sc, -D * far - 12 * sc], [L / 2 * far - 10 * sc, -D * far - 16 * sc], [L / 2 - 12 * sc, -14 * sc], [-L / 2 + 12 * sc, -10 * sc]], col: mixc(ACCENT, '#6b4432', 0.55), a: 0.12, kind: 'wash', sharp: true });
  S.push(mk(qcurve(-L / 2 * far, -D * far - 6 * sc, L / 2 * far, -D * far - 10 * sc, 3, 4), 6 * sc, darken(WOOD, 0.15), { prof: 'even', a: 0.6, nb: 3 }));
  S.push(mk(qcurve(-L / 2, -4 * sc, L / 2, -8 * sc, 4, 4), 8 * sc, darken(WOOD, 0.08), { prof: 'even', a: 0.62, nb: 3 }));
  // beans, denser toward the near edge
  const n = Math.round(rnd(230, 300) * (o.dense || 1));
  for (let i = 0; i < n; i++) {
    const u = Math.sqrt(rnd(0, 1));
    const x = rnd(-L / 2 * lerp(far, 1, u), L / 2 * lerp(far, 1, u));
    const y = lerp(-D * far - 12 * sc, -12 * sc, u) + rnd(-8, 8) * sc;
    const r = rnd(1.8, 3.0) * sc;
    S.push(mk(qcurve(x - r, y, x + r, y - r * 0.4, -r * 0.4, 3), r * 2.0, pick([ACCENT, ACCENT_D, mixc(ACCENT, '#7a3a26', 0.5), mixc(ACCENT_D, '#8a6a4a', 0.5)]), { prof: 'even', a: rnd(0.35, 0.7), nb: 1, rough: 0.25 }));
  }
  return { S, h: 90 * sc };
}

export function patioFloor(sc = 1, o = {}) {
  const S = [];
  const L = 820 * sc;
  // packed earth and stone, laid across the terrace
  S.push({ poly: [[-L, 60 * sc], [L, 20 * sc], [L, -150 * sc], [-L, -110 * sc]], col: mixc(STONE, '#d8c8a4', 0.55), a: 0.4, kind: 'wash', sharp: true });
  S.push({ poly: [[-L, 30 * sc], [L, -10 * sc], [L, -60 * sc], [-L, -20 * sc]], col: mixc(WOOD, '#c0a883', 0.5), a: 0.14, kind: 'wash' });
  // stone joints
  for (let i = 0; i < 26; i++) {
    const x = rnd(-L, L), y = rnd(-140, 40) * sc;
    S.push(mk(qcurve(x, y, x + rnd(28, 90) * sc, y + rnd(-6, 6) * sc, rnd(-3, 3), 3), rnd(1.2, 2.4) * sc, darken(STONE, 0.3), { prof: 'even', a: rnd(0.1, 0.24), nb: 1 }));
  }
  return { S, h: 200 };
}

export function rake(sc = 1) {
  const S = [];
  S.push(mk(qcurve(-40, 0, -250, 70, 10, 5), 9 * sc, WOOD, { prof: 'trunk', a: 0.8, nb: 3 }));
  S.push(mk(qcurve(-250, 70, -330, 84, 2, 3), 9 * sc, darken(WOOD, 0.2), { prof: 'even', a: 0.8, nb: 2 }));
  for (let i = 0; i < 7; i++) S.push(mk(qcurve(-316 + i * 9, 82, -320 + i * 10, 96, 1, 2), 2.6 * sc, darken(WOOD, 0.35), { prof: 'even', a: 0.6, nb: 0 }));
  return { S, h: 60 };
}

// the porch: a wall with a window, and the table under it
export function porch(sc = 1) {
  const S = [];
  const L = 330 * sc;
  // wall
  S.push({ poly: [[-1600 * sc, 460], [1600 * sc, 460], [1600 * sc, -900 * sc], [-1600 * sc, -900 * sc]], col: '#e8d9b8', a: 0.98, kind: 'wash', sharp: true });
  // floor, painted after the wall so nothing shows through below the table
  S.push({ poly: [[-1600 * sc, 520 * sc], [1600 * sc, 520 * sc], [1600 * sc, 14 * sc], [-1600 * sc, 14 * sc]], col: '#c9ab7f', a: 0.9, kind: 'wash', sharp: true });
  S.push({ poly: [[-1600 * sc, 14 * sc], [1600 * sc, 14 * sc], [1600 * sc, -60 * sc], [-1600 * sc, -60 * sc]], col: mixc(WOOD, '#b99a6b', 0.4), a: 0.14, kind: 'wash', sharp: true });
  // plaster texture on the wall
  for (let i = 0; i < 7; i++) {
    const y = -40 * sc - i * 62 * sc;
    S.push(mk(qcurve(-1500 * sc, y, 1500 * sc, y + rnd(-14, 14) * sc, rnd(-10, 10), 5), rnd(16, 30) * sc, mixc('#e8d9b8', WOOD, rnd(0.05, 0.16)), { prof: 'brush', a: rnd(0.04, 0.09), nb: 4, rough: 0.4 }));
  }
  // dado
  S.push(mk(qcurve(-1600 * sc, -128 * sc, 1600 * sc, -136 * sc, 4, 6), 5 * sc, mixc(WOOD, '#8a6b48', 0.35), { prof: 'even', a: 0.35, nb: 2 }));
  // the window's light falling across the wall
  S.push({ poly: [[-320 * sc, -470 * sc], [-40 * sc, -470 * sc], [420 * sc, 10 * sc], [40 * sc, 10 * sc]], col: '#fbeec9', a: 0.3, kind: 'wash', sharp: true });
  // shadow under the table on the floor
  S.push({ poly: [[-330 * sc, 26 * sc], [330 * sc, 20 * sc], [300 * sc, 66 * sc], [-300 * sc, 70 * sc]], col: mixc(WOOD, INK, 0.35), a: 0.2, kind: 'wash' });
  // window, morning light in it
  S.push({ poly: [[-330 * sc, -250 * sc], [-60 * sc, -250 * sc], [-60 * sc, -470 * sc], [-330 * sc, -470 * sc]], col: '#f6e6bc', a: 0.85, kind: 'wash', sharp: true });
  S.push(mk(qcurve(-330 * sc, -250 * sc, -330 * sc, -470 * sc, 3, 3), 7 * sc, mixc(WOOD, '#7a6040', 0.4), { prof: 'even', a: 0.8, nb: 2 }));
  S.push(mk(qcurve(-60 * sc, -250 * sc, -60 * sc, -470 * sc, -3, 3), 7 * sc, mixc(WOOD, '#7a6040', 0.4), { prof: 'even', a: 0.8, nb: 2 }));
  S.push(mk(qcurve(-330 * sc, -250 * sc, -60 * sc, -250 * sc, 3, 3), 8 * sc, mixc(WOOD, '#7a6040', 0.35), { prof: 'even', a: 0.82, nb: 2 }));
  S.push(mk(qcurve(-330 * sc, -470 * sc, -60 * sc, -470 * sc, 3, 3), 8 * sc, mixc(WOOD, '#7a6040', 0.35), { prof: 'even', a: 0.82, nb: 2 }));
  S.push(mk(qcurve(-196 * sc, -250 * sc, -196 * sc, -470 * sc, 0, 3), 4 * sc, mixc(WOOD, '#7a6040', 0.4), { prof: 'even', a: 0.7, nb: 0 }));
  S.push(mk(qcurve(-330 * sc, -360 * sc, -60 * sc, -360 * sc, 0, 3), 4 * sc, mixc(WOOD, '#7a6040', 0.4), { prof: 'even', a: 0.7, nb: 0 }));
  // a shelf with two small cups
  S.push(mk(qcurve(120 * sc, -300 * sc, 430 * sc, -306 * sc, 3, 4), 9 * sc, WOOD, { prof: 'even', a: 0.75, nb: 3 }));
  for (let i = 0; i < 2; i++) {
    const cx = 200 * sc + i * 110 * sc;
    S.push({ poly: [[cx - 20 * sc, -302 * sc], [cx + 20 * sc, -302 * sc], [cx + 14 * sc, -342 * sc], [cx - 14 * sc, -342 * sc]], col: CUP, a: 0.6, kind: 'wash', sharp: true });
    S.push(mk(qcurve(cx - 20 * sc, -342 * sc, cx + 20 * sc, -342 * sc, -2 * sc, 3), 4 * sc, darken(CUP, 0.3), { prof: 'even', a: 0.7, nb: 1 }));
  }
  // a bunch of red cherries hung up to dry
  S.push(mk(qcurve(560 * sc, -470 * sc, 566 * sc, -392 * sc, 2, 4), 2.4 * sc, darken(STEM, 0.2), { prof: 'even', a: 0.8, nb: 1 }));
  for (let i = 0; i < 13; i++) {
    const a = rnd(-1.1, 1.1), r = Math.sqrt(rnd(0, 1));
    cherry(S, 566 * sc + a * 26 * sc * r, -392 * sc + rnd(0, 46) * sc + r * 12 * sc, rnd(5.5, 8) * sc, rnd(0.85, 0.95));
  }
  // hanging cloth
  S.push({ poly: [[430 * sc, -330 * sc], [560 * sc, -338 * sc], [572 * sc, -120 * sc], [446 * sc, -110 * sc]], col: mixc('#b8a077', SHIRT, 0.35), a: 0.5, kind: 'wash', sharp: true });
  for (let i = 1; i < 4; i++) {
    const x = 430 * sc + i * 34 * sc;
    S.push(mk(qcurve(x, -326 * sc, x + 4 * sc, -114 * sc, rnd(-4, 4), 4), rnd(1.4, 2.6) * sc, mixc('#8a7250', INK, 0.2), { prof: 'even', a: 0.3, nb: 1 }));
  }
  S.push(mk(qcurve(430 * sc, -332 * sc, 560 * sc, -340 * sc, 3, 4), 3 * sc, darken(WOOD, 0.3), { prof: 'even', a: 0.6, nb: 1 }));
  // table
  S.push({ poly: [[-L, -10 * sc], [L, -18 * sc], [L - 10 * sc, -34 * sc], [-L + 10 * sc, -26 * sc]], col: WOOD, a: 0.6, kind: 'wash', sharp: true });
  S.push(mk(qcurve(-L, -12 * sc, L, -20 * sc, 5 * sc, 6), 14 * sc, darken(WOOD, 0.18), { prof: 'even', a: 0.88, nb: 4, rough: 0.14 }));
  S.push(mk(qcurve(-L + 40 * sc, 6 * sc, -L + 36 * sc, 150 * sc, 2 * sc, 3), 14 * sc, darken(WOOD, 0.3), { prof: 'trunk', a: 0.78, nb: 2 }));
  S.push(mk(qcurve(L - 40 * sc, 0, L - 36 * sc, 146 * sc, 2 * sc, 3), 14 * sc, darken(WOOD, 0.3), { prof: 'trunk', a: 0.78, nb: 2 }));
  for (let i = 0; i < 7; i++) {
    S.push(mk(qcurve(-L + 20 * sc + i * 40 * sc, -16 * sc, -L + 180 * sc + i * 40 * sc, -22 * sc, 2, 3), 1.6 * sc, darken(WOOD, 0.45), { prof: 'even', a: 0.2, nb: 0 }));
  }
  return { S, h: 200 };
}

export function cup(sc = 1) {
  const S = [];
  const w = 62 * sc, h = 70 * sc;
  // saucer
  S.push({ poly: [[-w * 1.45, -2 * sc], [w * 1.45, -6 * sc], [w * 1.2, 9 * sc], [-w * 1.2, 13 * sc]], col: mixc(CUP, STONE, 0.35), a: 0.3, kind: 'wash' });
  // body
  const body = [];
  for (let i = 0; i <= 10; i++) { const u = i / 10; body.push([lerp(-w / 2, -w * 0.4, u) - Math.sin(u * Math.PI) * w * 0.05, lerp(-h, -6 * sc, u)]); }
  for (let i = 0; i <= 10; i++) { const u = i / 10; body.push([lerp(w * 0.4, w / 2, u) + Math.sin(u * Math.PI) * w * 0.05, lerp(-6 * sc, -h, u)]); }
  S.push({ poly: body, col: CUP, a: 0.85, kind: 'wash' });
  S.push({ poly: [[w * 0.1, -h + 4 * sc], [w * 0.44, -h + 2 * sc], [w * 0.34, -8 * sc], [w * 0.06, -8 * sc]], col: mixc(CUP, STONE, 0.55), a: 0.35, kind: 'wash' });
  S.push(mk(qcurve(-w / 2, -h, -w * 0.42, -6 * sc, -5 * sc, 4), 6 * sc, mixc(CUP, STONE, 0.55), { prof: 'trunk', a: 0.85, nb: 2 }));
  S.push(mk(qcurve(w / 2, -h, w * 0.42, -6 * sc, 5 * sc, 4), 6 * sc, mixc(CUP, STONE, 0.55), { prof: 'trunk', a: 0.85, nb: 2 }));
  // rim ellipse + coffee
  S.push(mk(qcurve(-w / 2, -h, w / 2, -h, -5 * sc, 5), 5 * sc, darken(CUP, 0.35), { prof: 'even', a: 0.85, nb: 2 }));
  S.push({ poly: [[-w * 0.42, -h + 3 * sc], [w * 0.42, -h - 2 * sc], [w * 0.38, -h + 9 * sc], [-w * 0.38, -h + 13 * sc]], col: '#5b3a26', a: 0.9, kind: 'wash', sharp: true });
  S.push(mk(qcurve(-w * 0.3, -h + 6 * sc, w * 0.2, -h + 3 * sc, -2, 3), 1.8 * sc, '#a37a52', { prof: 'even', a: 0.35, nb: 0 }));
  // handle
  S.push(mk(qcurve(w * 0.46, -h * 0.72, w * 0.4, -h * 0.26, w * 0.52, 6), 7 * sc, mixc(CUP, STONE, 0.45), { prof: 'even', a: 0.8, nb: 2 }));
  return { S, h: 90 };
}

export function kettle(sc = 1) {
  const S = [];
  S.push({ poly: [[-46 * sc, -18 * sc], [42 * sc, -18 * sc], [30 * sc, -104 * sc], [-30 * sc, -104 * sc]], col: '#8f9aa0', a: 0.36, kind: 'wash' });
  S.push(mk(qcurve(-46 * sc, -18 * sc, -30 * sc, -104 * sc, -6 * sc, 4), 6 * sc, '#6f7a80', { prof: 'trunk', a: 0.7, nb: 2 }));
  S.push(mk(qcurve(42 * sc, -18 * sc, 30 * sc, -104 * sc, 6 * sc, 4), 6 * sc, '#6f7a80', { prof: 'trunk', a: 0.7, nb: 2 }));
  S.push(mk(qcurve(-30 * sc, -102 * sc, 32 * sc, -104 * sc, -4 * sc, 4), 6 * sc, '#5f6a70', { prof: 'even', a: 0.8, nb: 2 }));
  S.push(mk(qcurve(30 * sc, -96 * sc, 78 * sc, -128 * sc, 8 * sc, 5), 7 * sc, '#6f7a80', { prof: 'trunk', a: 0.7, nb: 2 }));
  S.push(mk(qcurve(-26 * sc, -104 * sc, 6 * sc, -150 * sc, -22 * sc, 6), 7 * sc, '#6f7a80', { prof: 'even', a: 0.6, nb: 2 }));
  return { S, h: 150 };
}

// ---------- world ----------
export const OBJECTS = [];

function addObj(wx, wy, gen, seedN, o = {}) {
  const built = withSeed(seedN, () => gen(o.sc || 1, o));
  const S = built.S || [];
  const polys = S.filter(s => s && s.kind === 'wash');
  const strokes = S.filter(s => s && !s.kind);
  const spr = sprite(strokes);
  OBJECTS.push({
    wx, wy, S: strokes, polys, spr, h: built.h || 100,
    f: o.f !== undefined ? o.f : 1,
    sway: o.sway || 0, tIn: o.tIn, tDur: o.tDur || 0.9,
    live: o.live || false, kind: o.kind || '', extra: o.extra || null,
    order: o.order !== undefined ? o.order : wx,
  });
}

// first moment an object can be seen, from the camera track
function entry(wx, f) {
  for (let t = 0; t <= DUR; t += 0.05) {
    const c = camAt(t);
    const sx = sxOf(wx, f, c);
    if (sx > -320 && sx < W + 320) return t;
  }
  return 0;
}

export function build() {
  OBJECTS.length = 0;
  for (let i = 0; i < 34; i++) {
    const wx = -700 + i * 340 + rnd(-70, 70);
    addObj(wx, 566, farTree, 100 + i, { f: LAY.far.f, sc: 1, sway: 0.002, tIn: entry(wx, LAY.far.f) + 0.2, tDur: 0.8 });
  }
  for (let i = 0; i < 14; i++) {
    const wx = -300 + i * 700 + rnd(-80, 80);
    addObj(wx, 604, shadeTree, 300 + i, { f: LAY.mid.f, sc: 1, sway: 0.006, tIn: entry(wx, LAY.mid.f) + 0.3, tDur: 1.0 });
  }
  // region A: first light, the hero branch
  addObj(800, 750, shadeTree, 41, { sc: 1.2, sway: 0.006, tIn: 3.8 });
  addObj(-140, 736, shadeTree, 46, { sc: 1.1, sway: 0.006, tIn: 3.2 });
  addObj(250, 742, coffeeShrub, 42, { sc: 1.25, tIn: 3.4, tDur: 1.4 });
  addObj(330, 748, coffeeShrub, 43, { sc: 1.3, tIn: 3.6, tDur: 1.6 });
  addObj(455, 750, coffeeShrub, 44, { sc: 1.28, tIn: 3.9, tDur: 1.6 });
  addObj(560, 744, coffeeShrub, 45, { sc: 1.22, tIn: 4.3, tDur: 1.4 });
  addObj(430, 706, coffeeShrub, 7001, { sc: 1.55, tIn: 2.7, tDur: 1.7, rich: 0.8, order: 420 });
  addObj(430, 470, heroCherry, 7, { sc: 1, tIn: 0.15, tDur: 1.9, live: true, kind: 'hero', order: 430 });

  // region B: three rows across the slope
  for (let r = 0; r < 3; r++) {
    const wy = [806, 748, 694][r];
    const sc = [1.1, 0.92, 0.74][r];
    const f = [1.0, 0.84, 0.7][r];
    const step = [132, 122, 112][r];
    const n = Math.round(3900 / step);
    for (let i = 0; i < n; i++) {
      const wx = 700 + i * step + r * 40 + rnd(-16, 16);
      addObj(wx, wy + rnd(-4, 4), coffeeShrub, 1000 + r * 500 + i, {
        sc, f, sway: 0.003, tIn: entry(wx, f) + 0.15, tDur: 0.7, rich: 0.45,
      });
    }
  }
  for (let i = 0; i < 5; i++) {
    const wx = 1050 + i * 780 + rnd(-60, 60);
    addObj(wx, 702, shadeTree, 520 + i, { sc: 1.22, sway: 0.006, tIn: entry(wx, 1) + 0.2 });
  }
  // the row we are walking beside: big, near, passing quickly
  for (let i = 0; i < 34; i++) {
    const wx = 640 + i * 128 + rnd(-14, 14);
    addObj(wx, 986 + rnd(-10, 12), coffeeShrub, 3000 + i, {
      sc: 1.75, f: 1.22, sway: 0.003, tIn: entry(wx, 1.22) + 0.1, tDur: 0.55, rich: 0.5,
    });
  }
  addObj(1560, 742, basket, 61, { sc: 1.1, tIn: 11.9, tDur: 0.7, kind: 'basket' });
  addObj(1612, 636, pickHand, 62, { sc: 1.0, tIn: 11.3, tDur: 1.0, extra: { curl: 0.62 } });
  addObj(2196, 748, basket, 63, { sc: 0.92, tIn: 15.9, tDur: 0.7 });
  addObj(2242, 664, pickHand, 64, { sc: 0.82, tIn: 15.4, tDur: 1.0, extra: { curl: 0.8 } });
  addObj(2920, 700, coffeeShrub, 65, { sc: 1.5, tIn: 17.9, tDur: 0.8 });

  // region C: the mill
  addObj(5100, 742, mill, 700, { sc: 1.05, tIn: 19.8, tDur: 1.2, kind: 'mill' });
  addObj(4720, 764, basket, 701, { sc: 1.0, tIn: 22.2, tDur: 0.7 });
  addObj(4806, 692, pickHand, 702, { sc: 0.9, tIn: 21.7, tDur: 0.9, extra: { curl: 0.9 } });

  // region D: the drying patio
  for (let r = 0; r < 4; r++) {
    const wy = [700, 744, 792, 848][r];
    const sc = [0.86, 1.0, 1.14, 1.3][r];
    const f = [0.78, 0.9, 1.0, 1.12][r];
    for (let i = 0; i < 2; i++) {
      addObj(6380 + i * 430 + r * 26, wy, dryingBed, 800 + r * 10 + i, { sc, f, tIn: 30.4 + i * 0.05 + r * 0.04, tDur: 0.55, kind: 'bed' });
    }
  }
  addObj(7180, 792, rake, 860, { sc: 1.0, tIn: 33.0, tDur: 0.8 });
  addObj(7262, 744, pickHand, 861, { sc: 1.05, tIn: 32.6, tDur: 0.9, extra: { curl: 0.5 } });

  // region E: the porch and the cup
  addObj(8420, 800, porch, 900, { sc: 1.15, tIn: 38.6, tDur: 1.0, kind: 'porch', order: 8420 });
  addObj(8358, 790, cup, 901, { sc: 1.35, tIn: 40.4, tDur: 0.8, kind: 'cup', order: 8480 });
  addObj(8568, 792, kettle, 902, { sc: 0.86, tIn: 39.2, tDur: 0.8, order: 8460 });

  OBJECTS.sort((a, b) => (a.f - b.f) || (a.order - b.order) || (a.wy - b.wy));
  return OBJECTS;
}

// ------------- background -------------
const skyBand = (ctx, y0, y1, col, a, sN) => {
  withSeed(sN, () => washPoly(ctx, [[-2800, y0], [W + 2800, y0], [W + 2800, y1], [-2800, y1]], col, a, 2, 6));
};

export function drawSky(ctx, t, cam) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const z = cam.z;
  const hy = syOf(560, 1, cam);
  const top = -2600;
  const bands = 40;
  for (let i = 0; i < bands; i++) {
    const u0 = i / bands, u1 = (i + 1) / bands;
    const y0 = lerp(top, hy, u0), y1 = lerp(top, hy, Math.min(1, u1 + 0.09));
    skyBand(ctx, y0, y1, mixc(SKY_HI, SKY_LO, Math.pow(i / (bands - 1), 1.45)), 0.115, 900 + i);
  }
  withSeed(907, () => {
    washPoly(ctx, [[-2600, hy - 190 * z], [W + 2600, hy - 210 * z], [W + 2600, hy + 24], [-2600, hy + 24]], '#f7e2b6', 0.48, 3, 10);
  });
  const cA = ss(seg(t, 2.5, 14));
  for (let i = 0; i < 4; i++) {
    withSeed(920 + i, () => {
      const span = 3600;
      const bx = (((i * 900 + 200 - cam.x * 0.1) % span) + span) % span - 700;
      const y = hy - (420 - i * 110) * z + Math.sin(t * 0.07 + i) * 4;
      washPoly(ctx, [[bx, y], [bx + 420 + i * 80, y - 30 * z], [bx + 860 + i * 60, y + 4], [bx + 430, y + 30 * z]], '#fbf4e3', 0.28 * cA, 3, 18);
    });
  }
  ctx.restore();
}

export function drawHills(ctx, t, cam) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const ridge = (yBase, amp, freq, par, col, a, sN) => {
    withSeed(sN, () => {
      const z = cam.z, f = par;
      const pts = [];
      for (let x = -600; x <= W + 600; x += 50) {
        const wx = cam.x * f + (x - W / 2) / z;
        pts.push([x, yBase * z + 540 + Math.sin(wx * freq) * amp * z + Math.sin(wx * freq * 2.6 + 1.3) * amp * 0.45 * z]);
      }
      washPoly(ctx, [[-600, 1500], ...pts, [W + 600, 1500]], col, a, 3, 5);
      for (let i = 0; i < 55; i++) {
        const k = Math.floor(rnd(2, pts.length - 4));
        const p = pts[k], q = pts[k + 1];
        const len = rnd(20, 90) * z;
        const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        const s = mk(qcurve(p[0], p[1] + rnd(0, 10) * z, p[0] + (q[0] - p[0]) / L * len, p[1] + (q[1] - p[1]) / L * len + rnd(-4, 4) * z, rnd(-4, 4), 3), rnd(1.2, 3.2) * z, darken(col, 0.22), { prof: 'even', a: 0.45, nb: 0 });
        drawS(ctx, s, 1);
      }
    });
  };
  ridge(318, 40, 0.0012, 0.1, mixc(HILL_FAR, SKY_LO, 0.3), 0.5, 301);
  ridge(384, 26, 0.0022, 0.2, HILL_FAR, 0.5, 302);
  ridge(470, 16, 0.0034, 0.36, HILL_MID, 0.48, 303);
  ctx.restore();
}

export function drawGround(ctx, t, cam) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const z = cam.z;
  const gy = syOf(596, 1, cam);
  withSeed(311, () => {
    const pts = [];
    for (let x = -700; x <= W + 700; x += 40) {
      const wx = cam.x + (x - W / 2) / z;
      pts.push([x, gy + Math.sin(wx * 0.0016) * 10 * z + Math.sin(wx * 0.006) * 4 * z]);
    }
    washPoly(ctx, [[-700, 1500], ...pts, [W + 700, 1500]], FIELD, 0.55, 3, 9);
  });
  for (let i = 0; i < 12; i++) {
    withSeed(320 + i, () => {
      const yy = gy + (10 + i * i * 2.4 + i * 32) * z;
      const pts = [];
      for (let x = -500; x <= W + 500; x += 70) {
        const wx = cam.x + (x - W / 2) / z;
        pts.push([x, yy + Math.sin(wx * 0.003 + i * 1.7) * (3 + i) * z]);
      }
      washPoly(ctx, [[-500, yy + (12 + i * 3) * z], ...pts, [W + 500, yy + (12 + i * 3) * z]], i % 2 ? FIELD_D : mixc(FIELD, FIELD_D, 0.55), Math.max(0.05, 0.19 - i * 0.012), 2, 7);
    });
  }
  // a footpath crossing the slope
  withSeed(361, () => {
    const pts = [];
    for (let x = -400; x <= W + 400; x += 60) {
      const wx = cam.x + (x - W / 2) / z;
      const yy = gy + 300 * z + Math.sin(wx * 0.0021) * 12 * z;
      pts.push([x, yy]);
    }
    washPoly(ctx, [[-400, gy + 292 * z], ...pts.map(p => [p[0], p[1] - 16 * z]), [W + 400, gy + 320 * z], [-400, gy + 336 * z]], '#e3d2ae', 0.5, 3, 7);
  });
  // undergrowth: short green dabs along the terrace lips
  withSeed(352, () => {
    for (let i = 0; i < 90; i++) {
      const x = rnd(-150, W + 150);
      const yy = gy + rnd(0, 220) * z;
      const len = rnd(6, 20) * z;
      const s = mk(qcurve(x, yy, x + len, yy - rnd(2, 8) * z, rnd(-2, 2), 3), rnd(1.6, 3.6) * z, pick([SAGE, mixc(SAGE, LEAF_M, 0.4), mixc(FIELD_D, LEAF_D, 0.35)]), { prof: 'leaf', a: rnd(0.18, 0.4), nb: 1 });
      drawS(ctx, s, 1);
    }
  });
  withSeed(340, () => {
    for (let i = 0; i < 120; i++) {
      const x = rnd(-200, W + 200);
      const yy = gy + Math.pow(rnd(0, 1), 0.7) * 460 * z;
      const len = rnd(30, 120) * z;
      const s = mk(qcurve(x, yy, x + len, yy + rnd(-4, 4) * z, rnd(-3, 3), 3), rnd(1.2, 3.4) * z, pick([FIELD_D, darken(FIELD_D, 0.2), mixc(FIELD, FIELD_D, 0.6)]), { prof: 'even', a: rnd(0.12, 0.32), nb: 2 });
      drawS(ctx, s, 1);
    }
  });
  ctx.restore();
}

export function drawObjects(ctx, t, cam, wA = 1) {
  for (const o of OBJECTS) {
    const sx = sxOf(o.wx, o.f, cam), sy = syOf(o.wy, o.f, cam);
    const sc = o.f * cam.z;
    if (sx < -1600 * sc || sx > W + 1600 * sc) continue;
    const p = o.tIn === undefined ? 1 : ss(seg(t, o.tIn, o.tIn + o.tDur));
    if (p <= 0.001) continue;
    ctx.save();
    const skew = o.sway ? o.sway * (Math.sin(1.15 * t + o.wx * 0.01) + 0.4 * Math.sin(2.7 * t + 2 * o.wx * 0.01)) : 0;
    ctx.translate(sx, sy);
    if (o.polys && o.polys.length) {
      withSeed(8000 + Math.round(o.wx), () => {
        const pp = p < 1 ? ss(clamp(p * 1.6)) : 1;
        for (const poly of o.polys) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, pp) * (o.f < 1 ? o.f + 0.25 : 1) * (o.kind === 'hero' ? 1 : ss(seg(t, 3.1, 4.5)));
          washPoly(ctx, poly.poly.map(pt => [pt[0] * sc, pt[1] * sc]), poly.col, poly.a, 3, poly.sharp ? 2.2 : 3, poly.sharp);
          ctx.restore();
        }
      });
    }
    if (skew) ctx.transform(1, 0, skew, 1, 0, 0);
    ctx.scale(sc, sc);
    const baseA = o.f < 1 ? 0.45 + o.f * 0.55 : 1;
    const heroFade = o.kind === 'hero' ? 1 - ss(seg(t, 4.4, 5.4)) : 1;
    const worldGate = o.kind === 'hero' ? 1 : ss(seg(t, 3.1, 4.5));
    ctx.globalAlpha = (o.kind === 'hero' ? 1 : baseA * worldGate) * heroFade;
    if (heroFade <= 0.005) { ctx.restore(); continue; }
    const live = p < 1 || (o.live && cam.z > 1.18);
    if (live) withSeed(7000 + Math.round(o.wx), () => drawList(ctx, o.S, p));
    else if (o.spr) ctx.drawImage(o.spr.cv, o.spr.x0, o.spr.y0);
    else withSeed(7000 + Math.round(o.wx), () => drawList(ctx, o.S, p));
    ctx.restore();
    o._sx = sx; o._sy = sy; o._sc = sc;
  }
}

export function screenOf(o, cam) {
  return { x: sxOf(o.wx, o.f, cam), y: syOf(o.wy, o.f, cam), s: o.f * cam.z };
}
