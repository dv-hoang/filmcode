// One continuous line: chapters → arc-length samples → curvature-weighted time.
import { clamp, lerp, hash, vnoise } from '/core/lib.js';

const DS = 2.4;

const VOICE = {
  steady: { base: 2.75, alpha: 0.97, tremble: 0.14, dry: 0, jerk: 0 },
  fatigue: { base: 2.45, alpha: 0.92, tremble: 0.72, dry: 0.48, jerk: 0.05 },
  young: { base: 1.95, alpha: 0.8, tremble: 0.5, dry: 0.04, jerk: 1 },
  sure: { base: 2.45, alpha: 0.95, tremble: 0.16, dry: 0, jerk: 0.15 },
};

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function resample(pts, ds) {
  if (!pts.length) return [];
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + dist(pts[i - 1], pts[i]));
  const len = s[s.length - 1];
  if (len < 1e-4) return [{ x: pts[0][0], y: pts[0][1], s: 0 }];
  const out = [];
  let i = 1;
  for (let d = 0; d < len - 1e-6; d += ds) {
    while (i < s.length && s[i] < d) i++;
    const i1 = Math.min(s.length - 1, Math.max(1, i));
    const i0 = i1 - 1;
    const u = (d - s[i0]) / Math.max(1e-9, s[i1] - s[i0]);
    out.push({
      x: lerp(pts[i0][0], pts[i1][0], u),
      y: lerp(pts[i0][1], pts[i1][1], u),
      s: d,
    });
  }
  const last = pts[pts.length - 1];
  out.push({ x: last[0], y: last[1], s: len });
  return out;
}

function turnAt(pts, i) {
  if (i <= 0 || i >= pts.length - 1) return 0;
  const ax = pts[i].x - pts[i - 1].x;
  const ay = pts[i].y - pts[i - 1].y;
  const bx = pts[i + 1].x - pts[i].x;
  const by = pts[i + 1].y - pts[i].y;
  const la = Math.hypot(ax, ay);
  const lb = Math.hypot(bx, by);
  if (la < 1e-6 || lb < 1e-6) return 0;
  return Math.acos(clamp((ax * bx + ay * by) / (la * lb), -1, 1));
}

function smooth(w, radius) {
  const o = new Array(w.length);
  for (let i = 0; i < w.length; i++) {
    let s = 0;
    let c = 0;
    const a = Math.max(0, i - radius);
    const b = Math.min(w.length - 1, i + radius);
    for (let j = a; j <= b; j++) { s += w[j]; c++; }
    o[i] = s / c;
  }
  return o;
}

function timeChapter(pts, t0, t1, easeIn, easeOut) {
  const n = pts.length;
  if (n === 1) { pts[0].t = t0; return; }
  const raw = new Array(n).fill(1);
  for (let i = 1; i < n - 1; i++) {
    const u = (pts[i].s - pts[0].s) / Math.max(1e-6, pts[n - 1].s - pts[0].s);
    let w = 1 + 2.5 * turnAt(pts, i);
    if (easeOut) w *= 1 + 3.4 * u * u;
    if (easeIn) w *= 1 + 2.6 * (1 - u) * (1 - u);
    raw[i] = w;
  }
  raw[0] = raw[1] || 1;
  raw[n - 1] = raw[n - 2] || 1;
  const sm = smooth(raw, 5);
  const acc = [0];
  for (let i = 1; i < n; i++) {
    const ds = Math.max(0, pts[i].s - pts[i - 1].s);
    acc.push(acc[i - 1] + sm[i] * ds);
  }
  const total = acc[n - 1] || 1;
  for (let i = 0; i < n; i++) pts[i].t = t0 + (t1 - t0) * (acc[i] / total);
}

function normals(pts) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    pts[i].tx = dx;
    pts[i].ty = dy;
    pts[i].nx = -dy;
    pts[i].ny = dx;
  }
}

function speeds(pts) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const ds = Math.hypot(b.x - a.x, b.y - a.y);
    const dt = Math.max(1e-4, b.t - a.t);
    pts[i].v = (b.t === a.t) ? 0 : ds / dt;
  }
  if (pts.length >= 2 && pts[pts.length - 1].t > pts[pts.length - 2].t) {
    const a = pts[pts.length - 2];
    const b = pts[pts.length - 1];
    const ds = Math.hypot(b.x - a.x, b.y - a.y);
    b.v = ds / Math.max(1e-4, b.t - a.t);
    if (ds < 1e-3) b.v = 0;
  }
}

function blendVoice(pts) {
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const self = VOICE[p.voice] || VOICE.steady;
    let base = self.base;
    let alpha = self.alpha;
    let tremble = self.tremble;
    let dry = self.dry;
    let jerk = self.jerk;
    const reach = 60;
    for (const j of [i - 1, i + 1]) {
      if (j < 0 || j >= pts.length) continue;
      const o = pts[j];
      if (o.voice === p.voice) continue;
      const d = Math.abs(o.s - p.s);
      if (d > reach) continue;
      const u = 0.5 * (1 - d / reach);
      const ov = VOICE[o.voice] || VOICE.steady;
      base = lerp(base, ov.base, u);
      alpha = lerp(alpha, ov.alpha, u);
      tremble = lerp(tremble, ov.tremble, u);
      dry = lerp(dry, ov.dry, u);
      jerk = lerp(jerk, ov.jerk, u);
    }
    const pressure = 0.66 + 0.8 * Math.exp(-p.v / 300);
    const fine = 1 + (hash(p.s * 1.7 + 2.2) - 0.5) * 0.16;
    p.w = base * pressure * fine;
    p.alpha = alpha;
    p.accent = p.accent || 0;
    const wob = (vnoise(p.s * 0.07) - 0.5) * 2 * tremble
      + (vnoise(p.s * 0.23 + 4.2) - 0.5) * tremble
      + (vnoise(p.s * 0.9 + 1.7) - 0.5) * 0.55 * jerk;
    p.ix = p.x + p.nx * wob;
    p.iy = p.y + p.ny * wob;
    const band = vnoise(p.s * 0.014 + 8);
    p.gap = dry > 0.25 && band > 1 - dry * 0.48 ? 1 : 0;
    p.young = (p.voice === 'young' || p.voice === 'sure') ? 1 : 0;
  }
}

function accentRamp(pts, gold) {
  if (!gold) return;
  const edge = 48;
  for (const p of pts) {
    if (p.s < gold.s0 || p.s > gold.s1) { p.accent = 0; continue; }
    const inn = clamp((p.s - gold.s0) / edge);
    const out = clamp((gold.s1 - p.s) / edge);
    p.accent = Math.min(1, inn, out);
  }
}

/**
 * chapters: { id, pts:[[x,y]...], t0, t1, voice, accent, easeIn, easeOut, hold }
 * A hold chapter is one point, held from t0 to t1. The pen does not lift.
 */
export function compile(chapters) {
  const all = [];
  let sBase = 0;
  const meta = [];
  for (const ch of chapters) {
    if (ch.hold) {
      const p = ch.pts[ch.pts.length - 1];
      const a = { x: p[0], y: p[1], s: sBase, voice: ch.voice, accent: 0, ch: ch.id };
      const b = { ...a };
      a.t = ch.t0;
      b.t = ch.t1;
      all.push(a, b);
      meta.push({ id: ch.id, t0: ch.t0, t1: ch.t1, len: 0, s0: sBase, s1: sBase, hold: true });
      continue;
    }
    const samples = resample(ch.pts, DS);
    const len = samples[samples.length - 1].s;
    timeChapter(samples, ch.t0, ch.t1, ch.easeIn, ch.easeOut);
    const s0 = sBase;
    for (const p of samples) {
      p.s = sBase + p.s;
      p.voice = ch.voice;
      p.accent = ch.accent ? 1 : 0;
      p.ch = ch.id;
    }
    if (all.length && samples.length) {
      const prev = all[all.length - 1];
      const next = samples[0];
      const gap = Math.hypot(next.x - prev.x, next.y - prev.y);
      if (gap > 0.75) {
        const n = Math.max(2, Math.round(gap / DS));
        for (let k = 1; k < n; k++) {
          const u = k / n;
          all.push({
            x: lerp(prev.x, next.x, u),
            y: lerp(prev.y, next.y, u),
            s: lerp(prev.s, sBase, u),
            t: lerp(prev.t, samples[0].t, u),
            voice: ch.voice,
            accent: ch.accent ? 1 : 0,
            ch: ch.id + '-join',
          });
        }
      }
    }
    if (all.length && samples.length) {
      const prev = all[all.length - 1];
      const next = samples[0];
      if (Math.hypot(next.x - prev.x, next.y - prev.y) < 0.4) samples.shift();
    }
    all.push(...samples);
    sBase += len;
    meta.push({
      id: ch.id, t0: ch.t0, t1: ch.t1, len, s0, s1: sBase,
      hold: false, accent: !!ch.accent,
    });
  }
  normals(all);
  speeds(all);
  for (const p of all) if (p.hold || (p.v !== p.v)) p.v = 0;
  // Hold samples sit on the same point: force their speed to zero.
  for (let i = 0; i < all.length; i++) {
    if (all[i].t != null && i + 1 < all.length && all[i + 1].t - all[i].t > 0.2
      && Math.hypot(all[i + 1].x - all[i].x, all[i + 1].y - all[i].y) < 0.2) {
      all[i].v = 0;
      all[i + 1].v = 0;
    }
  }
  blendVoice(all);
  const gold = meta.find((m) => m.accent);
  accentRamp(all, gold);
  const marks = [];
  for (let i = 2; i < all.length - 2; i++) {
    const turn = turnAt(all, i);
    if (turn > 0.55 && all[i].v <= all[i - 1].v && all[i].v <= all[i + 1].v) {
      marks.push({ t: +all[i].t.toFixed(3), turn: +turn.toFixed(3), ch: all[i].ch });
    }
  }
  return { pts: all, chapters: meta, marks, sEnd: sBase };
}

export function sample(path, t) {
  const pts = path.pts;
  if (t <= pts[0].t) return pts[0];
  if (t >= pts[pts.length - 1].t) return pts[pts.length - 1];
  let lo = 0;
  let hi = pts.length - 1;
  while (lo < hi - 1) {
    const m = (lo + hi) >> 1;
    if (pts[m].t <= t) lo = m;
    else hi = m;
  }
  const a = pts[lo];
  const b = pts[hi];
  const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
  return {
    x: lerp(a.x, b.x, u),
    y: lerp(a.y, b.y, u),
    ix: lerp(a.ix, b.ix, u),
    iy: lerp(a.iy, b.iy, u),
    nx: a.nx, ny: a.ny,
    v: lerp(a.v, b.v, u),
    w: lerp(a.w, b.w, u),
    alpha: lerp(a.alpha, b.alpha, u),
    accent: lerp(a.accent, b.accent, u),
    gap: u < 0.5 ? a.gap : b.gap,
    young: a.young,
    s: lerp(a.s, b.s, u),
    t,
    ch: a.ch,
  };
}

/** Points from the start through time t, with an interpolated nib. */
export function prefix(path, t) {
  const pts = path.pts;
  if (t <= pts[0].t) return [pts[0]];
  let hi = 1;
  while (hi < pts.length && pts[hi].t < t) hi++;
  const out = pts.slice(0, hi);
  const tip = sample(path, t);
  const last = out[out.length - 1];
  if (!last || Math.hypot(tip.ix - last.ix, tip.iy - last.iy) > 0.15) out.push(tip);
  return out;
}

export function audit(path) {
  const pts = path.pts;
  const hits = [];
  const step = 3;
  for (let i = 0; i < pts.length; i += step) {
    for (let j = i + 18; j < pts.length; j += step) {
      if (pts[j].s - pts[i].s < 70) continue;
      const d = Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y);
      if (d < 13) {
        const nearJoin = Math.hypot(pts[i].x - 800, pts[i].y - 250) < 24
          && Math.hypot(pts[j].x - 800, pts[j].y - 250) < 24;
        if (nearJoin) continue;
        hits.push({ a: pts[i].ch, b: pts[j].ch, d: +d.toFixed(1), t: +pts[j].t.toFixed(2) });
        if (hits.length > 8) return hits;
      }
    }
  }
  return hits;
}
