// Swelling burin strokes, hatches clipped to a figure, tone from one light.
import { clamp } from '/core/lib.js';

export const INK = '#1c1510';

export function swellK(u) {
  const x = clamp(u);
  const s = Math.sin(Math.PI * x);
  let k = 0.2 + 0.8 * Math.pow(Math.max(0, s), 0.7);
  const tap = 0.22;
  if (x < tap) k *= x / tap;
  else if (x > 1 - tap) k *= (1 - x) / tap;
  return k;
}

function ribbon(ctx, samples, w, u1) {
  if (samples.length < 2) return;
  const left = [];
  const right = [];
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i];
    const q = samples[Math.min(samples.length - 1, i + 1)];
    const r = samples[Math.max(0, i - 1)];
    let tx = q.x - r.x;
    let ty = q.y - r.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    let k = swellK(p.u);
    const tip = 0.05;
    if (u1 < 0.999 && p.u > u1 - tip) k *= clamp((u1 - p.u) / tip);
    const hw = Math.max(0.05, w * k * 0.5);
    left.push(p.x - ty * hw, p.y + tx * hw);
    right.push(p.x + ty * hw, p.y - tx * hw);
  }
  ctx.beginPath();
  ctx.moveTo(left[0], left[1]);
  for (let i = 2; i < left.length; i += 2) ctx.lineTo(left[i], left[i + 1]);
  for (let i = right.length - 2; i >= 0; i -= 2) ctx.lineTo(right[i], right[i + 1]);
  ctx.closePath();
  ctx.fill();
}

export function drawPoly(ctx, pts, w, u1) {
  if (u1 <= 0.002 || pts.length < 2) return;
  const lens = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    lens.push(L);
    total += L;
  }
  if (total < 1) return;
  const goal = total * Math.min(1, u1);
  const samples = [{ x: pts[0].x, y: pts[0].y, u: 0 }];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const L = lens[i - 1];
    if (acc + L >= goal || i === pts.length - 1) {
      const f = L < 1e-4 ? 0 : clamp((goal - acc) / L);
      samples.push({
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
        u: u1,
      });
      break;
    }
    acc += L;
    samples.push({ x: pts[i].x, y: pts[i].y, u: acc / total });
  }
  ribbon(ctx, samples, w, u1);
}

export function drawQuad(ctx, x0, y0, x1, y1, cx, cy, w, u1) {
  if (u1 <= 0.002) return;
  const n = 6;
  const samples = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * u1;
    const it = 1 - u;
    samples.push({
      x: it * it * x0 + 2 * it * u * cx + u * u * x1,
      y: it * it * y0 + 2 * it * u * cy + u * u * y1,
      u,
    });
  }
  ribbon(ctx, samples, w, u1);
}

export function walk(pts, u) {
  let total = 0;
  const lens = [];
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    lens.push(L);
    total += L;
  }
  let goal = clamp(u) * total;
  for (let i = 1; i < pts.length; i++) {
    const L = lens[i - 1];
    if (L >= goal || i === pts.length - 1) {
      const f = L < 1e-4 ? 0 : clamp(goal / L);
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
        ang: Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x),
      };
    }
    goal -= L;
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y, ang: 0 };
}

export function ellipsePoly(cx, cy, rx, ry, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

export function pathOf(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

function rot(x, y, c, s, ox, oy) {
  const dx = x - ox;
  const dy = y - oy;
  return { x: ox + dx * c - dy * s, y: oy + dx * s + dy * c };
}

function spansAt(poly, y) {
  const xs = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
      const t = (y - a.y) / (b.y - a.y);
      xs.push(a.x + (b.x - a.x) * t);
    }
  }
  xs.sort((p, q) => p - q);
  const spans = [];
  for (let i = 0; i + 1 < xs.length; i += 2) {
    if (xs[i + 1] - xs[i] > 2) spans.push([xs[i], xs[i + 1]]);
  }
  return spans;
}

function subtractCircle(span, y, circle) {
  const [a, b] = span;
  const dy = y - circle.y;
  if (Math.abs(dy) >= circle.r) return [span];
  const dx = Math.sqrt(circle.r * circle.r - dy * dy);
  const c0 = circle.x - dx;
  const c1 = circle.x + dx;
  if (c1 <= a || c0 >= b) return [span];
  const out = [];
  if (c0 > a + 1) out.push([a, Math.min(b, c0)]);
  if (c1 < b - 1) out.push([Math.max(a, c1), b]);
  return out;
}

/** Parallel swelling hatches. angle in radians. toneAt returns 0 (paper) to 1 (dark). */
export function hatch(poly, angle, spacing, origin, toneAt, threshold, wAt, excl) {
  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  const ci = Math.cos(angle);
  const si = Math.sin(angle);
  const ox = origin.x;
  const oy = origin.y;
  const rp = poly.map((p) => rot(p.x, p.y, c, s, ox, oy));
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of rp) {
    if (p.y < y0) y0 = p.y;
    if (p.y > y1) y1 = p.y;
  }
  const circles = (excl || []).map((e) => rot(e.x, e.y, c, s, ox, oy)).map((p, i) => ({
    x: p.x,
    y: p.y,
    r: excl[i].r,
  }));
  const lines = [];
  for (let y = y0 + spacing * 0.5; y < y1; y += spacing) {
    let pieces = spansAt(rp, y);
    for (const circle of circles) {
      const next = [];
      for (const span of pieces) next.push(...subtractCircle(span, y, circle));
      pieces = next;
    }
    for (const [a, b] of pieces) {
      const step = Math.max(5, spacing * 0.85);
      let run = null;
      const flush = () => {
        if (!run || run.x1 - run.x0 < 5) {
          run = null;
          return;
        }
        const p0 = rot(run.x0, y, ci, si, ox, oy);
        const p1 = rot(run.x1, y, ci, si, ox, oy);
        const mid = rot((run.x0 + run.x1) / 2, y, ci, si, ox, oy);
        const dx = origin.x - mid.x;
        const dy = origin.y - mid.y;
        const dl = Math.hypot(dx, dy) || 1;
        const bow = 7 + (run.tone > 0.7 ? 4 : 0);
        lines.push({
          x0: p0.x,
          y0: p0.y,
          x1: p1.x,
          y1: p1.y,
          cx: mid.x + (dx / dl) * bow,
          cy: mid.y + (dy / dl) * bow,
          w: wAt(run.tone),
        });
        run = null;
      };
      for (let x = a; x <= b + 0.1; x += step) {
        const xx = Math.min(x, b);
        const wp = rot(xx, y, ci, si, ox, oy);
        const tone = toneAt(wp.x, wp.y);
        if (tone >= threshold) {
          if (!run) run = { x0: xx, x1: xx, tone };
          run.x1 = xx;
          if (tone > run.tone) run.tone = tone;
        } else flush();
      }
      flush();
    }
  }
  return lines;
}

export function schedule(lines, t0, t1, speed) {
  const sorted = lines.slice().sort((a, b) => (a.x0 + a.x1) * 0.55 + (a.y0 + a.y1) * 0.85 - ((b.x0 + b.x1) * 0.55 + (b.y0 + b.y1) * 0.85));
  const group = 22;
  const waves = Math.max(1, Math.ceil(sorted.length / group));
  const span = Math.max(0.3, t1 - t0);
  return sorted.map((ln, i) => {
    const wave = Math.floor(i / group);
    const start = t0 + (wave / waves) * span * 0.84;
    const len = Math.hypot(ln.x1 - ln.x0, ln.y1 - ln.y0);
    const dur = clamp(len / speed, 0.18, 1.15);
    return { ...ln, t0: start, t1: start + dur };
  });
}

export function progress(stroke, t) {
  return clamp((t - stroke.t0) / (stroke.t1 - stroke.t0));
}
