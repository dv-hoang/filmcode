// First Orange — still-life kitchen built as knife-stroke plates.
import { hex, Strokes, KNIFE, DAB, fillRegion, strokePath } from './engine/impasto.js';

export const W = 1920, H = 1080, DUR = 42.0;

export const C = {
  wall: hex('#c9b39a'),
  wall2: hex('#b89a7e'),
  wood: hex('#8a5a3a'),
  wood2: hex('#6e4028'),
  cloth: hex('#d8cfc0'),
  cloth2: hex('#c4b8a4'),
  window: hex('#7aa0c4'),
  sky: hex('#34507e'),
  sky2: hex('#d99a78'),
  orange: hex('#ee7a2a'),
  orange2: hex('#f4bc2a'),
  peel: hex('#dc6a1e'),
  knife: hex('#9aa3ab'),
  knife2: hex('#dfe3e8'),
  bowl: hex('#3f7a6c'),
  bowl2: hex('#2a5a4e'),
  shadow: hex('#4a3a32'),
  cream: hex('#f0e6d4'),
};

/** Build static world strokes once (fixed seeds). */
export function buildWorld() {
  const s = new Strokes();
  // wall plane
  fillRegion(s, { x: 0, y: 0, w: W, h: 640, c: C.wall, c2: C.wall2, maxR: 52, detail: 0.5, dir: 0.12, seed: 11, group: 1 });
  fillRegion(s, { x: 1140, y: 60, w: 480, h: 380, c: C.window, c2: C.sky2, maxR: 36, detail: 0.55, dir: -0.25, seed: 22, group: 2 });
  strokePath(s._, [[1180, 80], [1600, 80], [1600, 420], [1180, 420], [1180, 80]], { wid: 18, c: C.wood, step: 22, seed: 30 });
  fillRegion(s, { x: 40, y: 500, w: 1840, h: 460, c: C.wood, c2: C.wood2, maxR: 54, detail: 0.45, dir: 0.04, seed: 40, group: 3 });
  fillRegion(s, { x: 380, y: 540, w: 980, h: 360, c: C.cloth, c2: C.cloth2, maxR: 40, detail: 0.6, dir: 0.35, seed: 55, group: 4 });
  fillRegion(s, { x: 500, y: 600, w: 240, h: 160, c: C.bowl, c2: C.bowl2, maxR: 24, detail: 0.7, dir: 0.45, seed: 70, group: 5 });
  fillRegion(s, { x: 680, y: 720, w: 460, h: 110, c: C.shadow, c2: C.wood2, maxR: 32, detail: 0.35, dir: 0.0, seed: 80, group: 6 });
  return s.data();
}

export function buildOrange(cx = 960, cy = 700) {
  const s = new Strokes();
  // body
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r = 78 + (i % 5) * 3;
    s.push({
      x: cx + Math.cos(a) * r * 0.55,
      y: cy + Math.sin(a) * r * 0.48,
      ang: a + 0.4,
      len: 70 + (i % 7) * 4,
      wid: 28,
      c: C.orange, c2: C.orange2,
      type: KNIFE, taper: 0.8, skew: 0.2,
      seed: 200 + i, hgt: 1.3,
      rev: cx * 0.001, app: cx * 0.001,
    });
  }
  // highlight dab
  s.push({ x: cx - 28, y: cy - 30, len: 36, wid: 36, c: hex('#f6d08a'), type: DAB, seed: 260, hgt: 1.5, rev: 0.9, app: 0.9 });
  // stem
  s.push({ x: cx + 6, y: cy - 70, ang: -1.2, len: 28, wid: 10, c: hex('#3a5a32'), type: KNIFE, seed: 270, hgt: 1.1 });
  return s.data();
}

export function buildKnife(t, tipX, tipY) {
  // knife enters from right; tip at tipX,tipY
  const s = new Strokes();
  const ang = -0.35 + Math.sin(t * 2) * 0.02;
  const cx = tipX + Math.cos(ang) * 160;
  const cy = tipY + Math.sin(ang) * 160;
  for (let i = 0; i < 14; i++) {
    const u = i / 13;
    s.push({
      x: tipX + Math.cos(ang) * (20 + u * 280),
      y: tipY + Math.sin(ang) * (20 + u * 280),
      ang,
      len: 42, wid: u < 0.2 ? 14 : 22,
      c: C.knife, c2: C.knife2,
      type: KNIFE, taper: 0.9, run: 0,
      seed: 400 + i, hgt: 1.4,
      grey: 0,
    });
  }
  // handle
  fillRegion(s, { x: cx + 40, y: cy - 20, w: 90, h: 36, c: C.wood, c2: C.wood2, maxR: 18, detail: 0.7, dir: ang, seed: 420, group: 9 });
  return s.data();
}

export function buildPeels(count, t0, t) {
  const s = new Strokes();
  const peels = [
    { x: 880, y: 760, ang: 0.6 },
    { x: 1020, y: 780, ang: -0.4 },
    { x: 940, y: 820, ang: 1.1 },
    { x: 1080, y: 750, ang: 0.2 },
  ];
  for (let i = 0; i < Math.min(count, peels.length); i++) {
    const appearAt = t0 + i * 1.2;
    if (t < appearAt) continue;
    const p = peels[i];
    for (let k = 0; k < 8; k++) {
      s.push({
        x: p.x + Math.cos(p.ang) * k * 12,
        y: p.y + Math.sin(p.ang) * k * 10 + k * 2,
        ang: p.ang + 0.3,
        len: 48, wid: 16,
        c: C.peel, c2: C.orange2,
        type: KNIFE, taper: 0.85,
        seed: 500 + i * 20 + k, hgt: 1.2,
        app: appearAt, rev: 0,
      });
    }
  }
  // juice dabs
  if (t > t0 + 0.8) {
    for (let i = 0; i < 10; i++) {
      s.push({
        x: 960 + (i - 5) * 18, y: 730 + (i % 3) * 12,
        len: 18, wid: 18, c: C.orange2, type: DAB,
        seed: 600 + i, hgt: 0.9, app: t0 + 0.8,
      });
    }
  }
  return s.data();
}

export function buildSecondFruit() {
  const s = new Strokes();
  const cx = 620, cy = 680;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    s.push({
      x: cx + Math.cos(a) * 42, y: cy + Math.sin(a) * 36,
      ang: a, len: 50, wid: 22,
      c: hex('#d2402f'), c2: hex('#ee7a2a'),
      type: KNIFE, taper: 0.75, seed: 700 + i, hgt: 1.15,
      app: 24.5, rev: 0.5,
    });
  }
  return s.data();
}

export function buildTitleStrokes() {
  // Approximate "FIRST ORANGE" as stacked knife bars forming letter blocks (readable as painted title area);
  // crisp DOM text overlays for legibility of small type — main title also drawn in main.js as DOM.
  const s = new Strokes();
  const baseX = 520, baseY = 220;
  for (let i = 0; i < 36; i++) {
    s.push({
      x: baseX + (i % 12) * 72,
      y: baseY + Math.floor(i / 12) * 48,
      ang: -0.1 + (i % 3) * 0.05,
      len: 64, wid: 26,
      c: hex('#f4efe3'), c2: hex('#d97757'),
      type: KNIFE, taper: 0.7, seed: 900 + i, hgt: 1.4,
      app: 32 + (i % 12) * 0.04,
    });
  }
  return s.data();
}

export function makeUnderpainting(world, orange) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#4a5a6e');
  grd.addColorStop(0.42, '#9a846c');
  grd.addColorStop(0.55, '#7a5a42');
  grd.addColorStop(1, '#5a3828');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  // soft window glow (no hard rect)
  const wg = g.createRadialGradient(1390, 250, 40, 1390, 250, 320);
  wg.addColorStop(0, 'rgba(180,210,235,0.55)');
  wg.addColorStop(1, 'rgba(180,210,235,0)');
  g.fillStyle = wg; g.fillRect(1000, 0, 700, 520);
  // table band
  const tg = g.createLinearGradient(0, 520, 0, H);
  tg.addColorStop(0, 'rgba(110,64,40,0.0)');
  tg.addColorStop(0.15, 'rgba(110,64,40,0.85)');
  tg.addColorStop(1, 'rgba(80,40,24,0.95)');
  g.fillStyle = tg; g.fillRect(0, 500, W, H - 500);
  // cloth oval
  g.fillStyle = 'rgba(210,200,185,0.55)';
  g.beginPath(); g.ellipse(870, 720, 420, 160, -0.05, 0, Math.PI * 2); g.fill();
  // orange
  g.fillStyle = 'rgba(238,122,42,0.9)';
  g.beginPath(); g.ellipse(960, 700, 95, 82, 0, 0, Math.PI * 2); g.fill();
  // heavy blur so canvas never peeks as outlines
  const c2 = document.createElement('canvas');
  c2.width = W / 6; c2.height = H / 6;
  const g2 = c2.getContext('2d');
  g2.drawImage(c, 0, 0, c2.width, c2.height);
  g.clearRect(0, 0, W, H);
  g.imageSmoothingEnabled = true;
  g.drawImage(c2, 0, 0, W, H);
  void world; void orange;
  return c;
}

export function camAt(t) {
  // Shot path from treatment
  if (t < 6) {
    const u = t / 6;
    return { x: 960 - 40 * u, y: 620, zoom: 0.92 + 0.06 * u, rot: 0 };
  }
  if (t < 11) {
    const u = (t - 6) / 5;
    return { x: 960, y: 680 - 20 * u, zoom: 0.98 + 0.35 * u, rot: 0 };
  }
  if (t < 14) {
    return { x: 1000, y: 690, zoom: 1.55, rot: -0.04 };
  }
  if (t < 18) {
    return { x: 960, y: 720, zoom: 1.25, rot: 0 };
  }
  if (t < 24) {
    const u = (t - 18) / 6;
    return { x: 920 + 40 * u, y: 600, zoom: 1.15 - 0.2 * u, rot: 0.02 * u };
  }
  if (t < 32) {
    const u = (t - 24) / 8;
    return { x: 960, y: 580, zoom: 0.95 - 0.08 * u, rot: -0.03 * u };
  }
  if (t < 38) {
    const u = (t - 32) / 6;
    return { x: 960, y: 560 + 20 * u, zoom: 0.87 - 0.05 * u, rot: 0 };
  }
  return { x: 960, y: 580, zoom: 0.82, rot: 0 };
}

export function revealX(t) {
  // colour re-lay wave in stroke `rev` units (≈ x * 0.001)
  if (t < 17.5) return -0.2;
  return ((t - 17.5) / 5.5) * 2.4 - 0.2;
}

export function lightPost(t) {
  const rake = t > 28 && t < 36 ? 0.35 + 0.25 * Math.sin((t - 28) * 0.8) : 0;
  return {
    light: [-0.55 - rake * 0.3, -0.5 - rake * 0.4, 0.7],
    norm: 3.0 + rake * 1.2,
    amb: 0.78 - rake * 0.08,
    dif: 0.3 + rake * 0.15,
    spec: 0.18 + rake * 0.2,
    ao: 1.15,
    expo: 1.02 + (t > 24 ? 0.06 : 0),
    sat: t < 17.5 ? 0.85 : 1.15,
    vig: 0.16,
  };
}
