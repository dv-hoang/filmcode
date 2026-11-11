// Brine Stair: one full-bleed sheet. The stair is a knockout of bare paper.
import { TAU, mulberry } from '/core/lib.js';
import { ink, wipePath, wipeFrontX, squeegee, paperSheet, sheenOf } from './engine/silk.js';
import { INK, PULLS, DASHES, pullP, loose } from './timeline.js';

const SUN = { x: 360, y: 198, r: 104 };

const SKYLINE = [
  [0, 700], [100, 648], [170, 682], [250, 600], [330, 652],
  [420, 568], [510, 624], [600, 530], [700, 590], [800, 512],
  [900, 572], [1000, 508], [1100, 560], [1200, 490], [1310, 548],
  [1420, 516], [1540, 572], [1660, 500], [1780, 548], [1920, 572],
];

export const STAIR_LINE = [
  [1000, 960],
  [1160, 960],
  [1160, 900],
  [1020, 900],
  [1020, 840],
  [1160, 840],
  [1160, 780],
  [1040, 780],
  [1040, 720],
  [1160, 720],
  [1160, 660],
];

const DASH_RECTS = [
  [1040, 952, 70, 10],
  [1060, 892, 64, 10],
  [1060, 832, 70, 10],
  [1080, 772, 60, 10],
  [1080, 712, 64, 10],
  [1100, 652, 48, 10],
];

function ribbon(line, half) {
  const p = new Path2D();
  const left = [];
  const right = [];
  for (let i = 0; i < line.length; i++) {
    const prev = line[Math.max(0, i - 1)];
    const next = line[Math.min(line.length - 1, i + 1)];
    let dx = next[0] - prev[0];
    let dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    left.push([line[i][0] + -dy * half, line[i][1] + dx * half]);
    right.push([line[i][0] - -dy * half, line[i][1] - dx * half]);
  }
  p.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i++) p.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i--) p.lineTo(right[i][0], right[i][1]);
  p.closePath();
  return p;
}

function skyBands(which) {
  const p = new Path2D();
  let y = 0;
  let i = 0;
  while (y < 760) {
    const h = i % 2 === 0 ? 64 : 16;
    const inkName = i % 2 === 0 ? 'sky1' : 'sky2';
    if (inkName === which) p.rect(0, y, 1920, h);
    y += h;
    i++;
  }
  return p;
}

function disk(cx, cy, r) {
  const p = new Path2D();
  p.moveTo(cx + r, cy);
  p.arc(cx, cy, r, 0, Math.PI);
  p.arc(cx, cy, r, Math.PI, TAU);
  p.closePath();
  return p;
}

function sunHole() {
  return disk(SUN.x, SUN.y, SUN.r);
}

function sunPath() {
  const p = new Path2D();
  const rings = [[78, 94], [50, 66]];
  for (const [a, b] of rings) {
    p.addPath(disk(SUN.x, SUN.y, b));
    p.addPath(disk(SUN.x, SUN.y, a));
  }
  p.addPath(disk(SUN.x, SUN.y, 24));
  return p;
}

function ridgePath() {
  const p = new Path2D();
  p.moveTo(SKYLINE[0][0], SKYLINE[0][1]);
  for (let i = 1; i < SKYLINE.length; i++) p.lineTo(SKYLINE[i][0], SKYLINE[i][1]);
  p.lineTo(1920, 880);
  p.lineTo(0, 880);
  p.closePath();
  return p;
}

function litPath() {
  const p = new Path2D();
  for (let i = 0; i < SKYLINE.length - 1; i++) {
    const a = SKYLINE[i];
    const b = SKYLINE[i + 1];
    if (b[1] < a[1] - 12) {
      p.moveTo(a[0], a[1]);
      p.lineTo(b[0], b[1]);
      p.lineTo(a[0] + (b[0] - a[0]) * 0.35, a[1] + 78);
      p.closePath();
    }
  }
  return p;
}

function seaPath() {
  const p = new Path2D();
  p.rect(0, 790, 1920, 230);
  return p;
}

function glintPath() {
  const p = new Path2D();
  const bars = [
    [80, 824, 460, 11],
    [620, 852, 300, 9],
    [1280, 836, 380, 12],
    [180, 888, 220, 8],
    [1500, 878, 200, 8],
  ];
  for (const [x, y, w, h] of bars) p.rect(x, y, w, h);
  return p;
}

function landPath() {
  const p = new Path2D();
  p.moveTo(0, 1080);
  p.lineTo(0, 910);
  p.lineTo(200, 868);
  p.lineTo(460, 908);
  p.lineTo(720, 886);
  p.lineTo(900, 918);
  p.lineTo(1080, 892);
  p.lineTo(1260, 860);
  p.lineTo(1360, 730);
  p.lineTo(1500, 650);
  p.lineTo(1700, 700);
  p.lineTo(1920, 660);
  p.lineTo(1920, 1080);
  p.closePath();
  return p;
}

function pineOutline(cx, tip, h, w) {
  const p = new Path2D();
  const tiers = 4;
  p.moveTo(cx, tip);
  for (let i = 1; i <= tiers; i++) {
    const y = tip + (h * i) / tiers;
    const ww = w * (0.4 + 0.6 * (i / tiers));
    p.lineTo(cx + ww, y - h * 0.07);
    p.quadraticCurveTo(cx + ww * 0.5, y + h * 0.05, cx + ww * 0.16, y + h * 0.012);
  }
  p.lineTo(cx + w * 0.055, tip + h + h * 0.14);
  p.lineTo(cx - w * 0.055, tip + h + h * 0.14);
  for (let i = tiers; i >= 1; i--) {
    const y = tip + (h * i) / tiers;
    const ww = w * (0.4 + 0.6 * (i / tiers));
    p.lineTo(cx - ww * 0.16, y + h * 0.012);
    p.quadraticCurveTo(cx - ww * 0.5, y + h * 0.05, cx - ww, y - h * 0.07);
  }
  p.closePath();
  return p;
}

function pinesPath() {
  const p = new Path2D();
  p.addPath(pineOutline(1580, 560, 340, 150));
  p.addPath(pineOutline(1720, 500, 400, 180));
  p.addPath(pineOutline(1840, 590, 300, 130));
  return p;
}

const SUN_HOLE = sunHole();
const stair = ribbon(STAIR_LINE, 22);

const PATH = {
  sky1: skyBands('sky1'),
  sky2: skyBands('sky2'),
  sun: sunPath(),
  ridge: ridgePath(),
  lit: litPath(),
  sea: seaPath(),
  glint: glintPath(),
  land: landPath(),
  pines: pinesPath(),
};

function layerReg(base, slip, t) {
  const a = loose(t);
  return [base[0] + slip[0] * a, base[1] + slip[1] * a];
}

function gapOf(slip, t) {
  const a = loose(t);
  if (a < 0.18) return null;
  const len = Math.hypot(slip[0], slip[1]) || 1;
  return [(-slip[0] / len) * 11 * a, (-slip[1] / len) * 11 * a];
}

function thickOf(slip, t) {
  const a = loose(t);
  if (a < 0.18) return null;
  const len = Math.hypot(slip[0], slip[1]) || 1;
  return [(slip[0] / len) * 7 * a, (slip[1] / len) * 7 * a];
}

function paint(ctx, spec, opt) {
  ink(ctx, spec, opt);
}

export function drawWorld(ctx, t, report) {
  const sunP = pullP(t, PULLS.sun);
  const skyP = pullP(t, PULLS.sky);
  const farP = pullP(t, PULLS.far);
  const litP = pullP(t, PULLS.lit);
  const seaP = pullP(t, PULLS.sea);
  const landP = pullP(t, PULLS.land);
  const pineP = pullP(t, PULLS.pines);
  const wrongP = pullP(t, PULLS.wrong);
  const hourP = pullP(t, PULLS.hour);
  const titleP = pullP(t, PULLS.title);
  const bandP = pullP(t, PULLS.band);

  paperSheet(ctx);

  const sunReg = layerReg([2, -1], [10, -8], t);
  if (sunP > 0) {
    paint(ctx, { path: PATH.sun, even: true }, {
      color: INK.accent,
      reg: sunReg,
      clip: wipePath(sunP, 1),
      sheen: sheenOf(t, PULLS.sun),
      front: wipeFrontX(sunP),
      paper: INK.paper,
    });
  }

  const skyReg = layerReg([1, 1], [0, 0], t);
  if (skyP > 0) {
    const clip = wipePath(skyP, 2);
    const opt = {
      reg: skyReg,
      clip,
      sheen: sheenOf(t, PULLS.sky),
      front: wipeFrontX(skyP),
      paper: INK.paper,
    };
    paint(ctx, { path: PATH.sky1, knock: SUN_HOLE }, { ...opt, color: INK.sky1 });
    paint(ctx, { path: PATH.sky2, knock: SUN_HOLE }, { ...opt, color: INK.sky2, reg: [skyReg[0] - 2, skyReg[1] + 1] });
    if (sunP > 0) {
      paint(ctx, { path: PATH.sun, even: true }, {
        color: INK.accent,
        reg: sunReg,
        clip: wipePath(Math.max(sunP, skyP), 1),
        sheen: 0,
        paper: INK.paper,
        trap: false,
      });
    }
  }

  const farSlip = [26, -14];
  const farReg = layerReg([-2, 1], farSlip, t);
  if (farP > 0) {
    paint(ctx, { path: PATH.ridge, knock: stair }, {
      color: INK.far,
      reg: farReg,
      clip: wipePath(farP, 3),
      sheen: sheenOf(t, PULLS.far),
      front: wipeFrontX(farP),
      gap: gapOf(farSlip, t),
      thick: thickOf(farSlip, t),
      paper: INK.paper,
    });
  }
  if (litP > 0) {
    paint(ctx, { path: PATH.lit }, {
      color: INK.sky1,
      reg: layerReg([1, -2], [18, -10], t),
      clip: wipePath(litP, 4),
      sheen: sheenOf(t, PULLS.lit),
      front: wipeFrontX(litP),
      paper: INK.paper,
    });
  }

  const seaSlip = [-20, 16];
  if (seaP > 0) {
    paint(ctx, { path: PATH.sea, knock: join(PATH.glint, stair) }, {
      color: INK.mid,
      reg: layerReg([1, 2], seaSlip, t),
      clip: wipePath(seaP, 5),
      sheen: sheenOf(t, PULLS.sea),
      front: wipeFrontX(seaP),
      gap: gapOf(seaSlip, t),
      thick: thickOf(seaSlip, t),
      paper: INK.paper,
    });
  }

  const landSlip = [36, 20];
  if (landP > 0) {
    paint(ctx, { path: PATH.land, knock: stair }, {
      color: INK.near,
      reg: layerReg([-1, -2], landSlip, t),
      clip: wipePath(landP, 6),
      sheen: sheenOf(t, PULLS.land),
      front: wipeFrontX(landP),
      gap: gapOf(landSlip, t),
      thick: thickOf(landSlip, t),
      paper: INK.paper,
    });
  }

  const pineSlip = [48, 28];
  if (pineP > 0) {
    paint(ctx, { path: PATH.pines, knock: stair }, {
      color: INK.near,
      reg: layerReg([2, 1], pineSlip, t),
      clip: wipePath(pineP, 7),
      sheen: sheenOf(t, PULLS.pines),
      front: wipeFrontX(pineP),
      gap: gapOf(pineSlip, t),
      thick: thickOf(pineSlip, t),
      paper: INK.paper,
    });
  }

  drawHour(ctx, t, wrongP, hourP, report);
  drawTitle(ctx, t, titleP, report);
  drawDashes(ctx, t);
  drawBand(ctx, t, bandP, report);
  drawBlade(ctx, t);
}

function join(a, b) {
  const p = new Path2D();
  p.addPath(a);
  p.addPath(b);
  return p;
}

function drawHour(ctx, t, wrongP, hourP, report) {
  if (wrongP <= 0 && hourP <= 0) return;
  const x = 1340;
  const y = 392;
  const reg = layerReg([-2, 1], [42, -24], t);
  ctx.save();
  if (wrongP > 0 && hourP < 1) {
    ctx.save();
    if (hourP > 0) {
      const cover = new Path2D();
      cover.rect(-200, -200, 2400, 1600);
      cover.addPath(wipePath(hourP, 8));
      ctx.clip(cover, 'evenodd');
    } else {
      ctx.clip(wipePath(wrongP, 9));
    }
    ctx.translate(reg[0], reg[1]);
    setType(ctx, 132, '0.02em');
    ctx.fillStyle = INK.mid;
    fillCondensed(ctx, '3:40', x, y, 0.78, 'center');
    ctx.restore();
  }
  if (hourP > 0) {
    ctx.save();
    ctx.clip(wipePath(hourP, 8));
    ctx.translate(reg[0], reg[1]);
    setType(ctx, 132, '0.02em');
    ctx.fillStyle = 'rgba(18,12,8,0.45)';
    fillCondensed(ctx, '4:10', x + 2, y + 2, 0.78, 'center');
    ctx.fillStyle = INK.accent;
    fillCondensed(ctx, '4:10', x, y, 0.78, 'center');
    ctx.restore();
  }
  ctx.restore();
  if (report && wrongP >= 1 && hourP <= 0 && loose(t) > 0.85) {
    report('wrong', '3:40', x + reg[0], y + reg[1], 132, 'center', 0.78, '0.02em');
  }
  if (report && hourP >= 1) report('hour-sky', '4:10', x + reg[0], y + reg[1], 132, 'center', 0.78, '0.02em');
}

function drawTitle(ctx, t, p, report) {
  if (p <= 0) return;
  const reg = layerReg([1, -1], [6, -4], t);
  ctx.save();
  ctx.clip(wipePath(p, 10));
  ctx.translate(reg[0], reg[1]);
  setType(ctx, 104, '0.16em');
  ctx.save();
  ctx.translate(2, 2);
  ctx.fillStyle = 'rgba(18,12,8,0.4)';
  fillCondensed(ctx, 'BRINE STAIR', 960, 196, 0.7, 'center');
  ctx.restore();
  ctx.fillStyle = INK.near;
  fillCondensed(ctx, 'BRINE STAIR', 960, 196, 0.7, 'center');
  ctx.restore();
  if (report && p >= 1) report('title', 'BRINE STAIR', 960 + reg[0], 196 + reg[1], 104, 'center', 0.7, '0.16em');
}

function drawDashes(ctx, t) {
  let n = 0;
  for (let i = 0; i < DASHES.length; i++) if (t >= DASHES[i]) n = i + 1;
  if (!n) return;
  ctx.save();
  ctx.fillStyle = INK.accent;
  for (let i = 0; i < n; i++) {
    const [x, y, w, h] = DASH_RECTS[i];
    const u = Math.min(1, (t - DASHES[i]) / 0.09);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y - 8, w * u + 2, h + 16);
    ctx.clip();
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  ctx.restore();
}

function drawBand(ctx, t, p, report) {
  if (p <= 0) return;
  const clip = wipePath(p, 11);
  const reg = [0, 2];
  paint(ctx, { path: bandPath() }, {
    color: INK.near,
    reg,
    clip,
    sheen: sheenOf(t, PULLS.band),
    front: wipeFrontX(p),
    paper: INK.paper,
    trap: true,
  });
  const accentP = pullP(t, [PULLS.band[0] + 0.3125, PULLS.band[1]]);
  ctx.save();
  ctx.clip(clip);
  ctx.translate(reg[0], reg[1]);
  ctx.fillStyle = INK.paper;
  ctx.fillRect(760, 918, 120, 5);
  setType(ctx, 52, '0.06em');
  ctx.fillStyle = INK.paper;
  fillCondensed(ctx, 'BRINE STAIR', 250, 956, 0.74, 'left');
  setType(ctx, 34, '0.2em');
  ctx.fillStyle = INK.paper;
  fillCondensed(ctx, 'ONE WINDOW', 1280, 948, 0.8, 'left');
  setType(ctx, 34, '0.18em');
  ctx.fillStyle = INK.paper;
  fillCondensed(ctx, 'LOW TIDE', 1620, 948, 0.8, 'left');
  ctx.restore();

  if (accentP > 0) {
    ctx.save();
    ctx.clip(wipePath(accentP, 12));
    ctx.translate(reg[0], reg[1]);
    setType(ctx, 78, '0.02em');
    ctx.fillStyle = INK.accent;
    fillCondensed(ctx, '01', 188, 966, 0.72, 'left');
    setType(ctx, 84, '0.03em');
    ctx.fillStyle = INK.accent;
    fillCondensed(ctx, '4:10', 980, 972, 0.7, 'left');
    ctx.restore();
  }

  if (report && p >= 1) {
    report('name-band', 'BRINE STAIR', 250, 956, 52, 'left', 0.74, '0.06em');
    report('one-window', 'ONE WINDOW', 1280, 948, 34, 'left', 0.8, '0.2em');
    report('low-tide', 'LOW TIDE', 1620, 948, 34, 'left', 0.8, '0.18em');
  }
  if (report && accentP >= 1) {
    report('num', '01', 188, 966, 78, 'left', 0.72, '0.02em');
    report('hour-band', '4:10', 980, 972, 84, 'left', 0.7, '0.03em');
  }
}

function bandPath() {
  const p = new Path2D();
  p.rect(0, 888, 1920, 192);
  return p;
}

function drawBlade(ctx, t) {
  const active = activePull(t);
  if (!active) return;
  const p = pullP(t, PULLS[active.id]);
  const x = wipeFrontX(p);
  const tilt = active.id === 'sun' ? -0.22 : -0.06;
  const colors = {
    sun: [INK.accent],
    sky: [INK.sky1, INK.sky2],
    far: [INK.far],
    sea: [INK.mid],
    land: [INK.near],
    wrong: [INK.mid],
    hour: [INK.accent],
    title: [INK.near],
    band: [INK.near],
  }[active.id];
  squeegee(ctx, x, tilt, colors);
}

function activePull(t) {
  const ids = ['sun', 'sky', 'far', 'sea', 'land', 'wrong', 'hour', 'title', 'band'];
  let best = null;
  for (const id of ids) {
    const [a, b] = PULLS[id];
    if (t >= a - 0.02 && t <= b + 0.02 && (!best || a >= best.a)) best = { id, a };
  }
  return best;
}

function setType(ctx, size, tracking) {
  ctx.font = `650 ${size}px "Cormorant Garamond"`;
  ctx.letterSpacing = tracking;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function fillCondensed(ctx, text, x, y, sx, align) {
  ctx.save();
  const w = ctx.measureText(text).width;
  let ox = 0;
  if (align === 'center') ox = -w / 2;
  if (align === 'right') ox = -w;
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  ctx.fillText(text, ox, 0);
  ctx.restore();
}

export function measurePosterText(ctx, text, x, y, size, align, condensed, tracking) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `650 ${size}px "Cormorant Garamond"`;
  ctx.letterSpacing = tracking || '0px';
  const w = ctx.measureText(text).width * (condensed || 1);
  const h = size * 0.92;
  let x0 = x;
  if (align === 'center') x0 = x - w / 2;
  if (align === 'right') x0 = x - w;
  const y0 = y - size * 0.78;
  ctx.restore();
  return { x0, y0, x1: x0 + w, y1: y0 + h };
}

export function drawWall(ctx) {
  const rng = mulberry(4);
  ctx.fillStyle = '#6a5646';
  ctx.fillRect(-700, -500, 3400, 2200);
  for (let y = -500; y < 1700; y += 92) {
    ctx.fillStyle = ((y / 92) | 0) % 2 === 0 ? '#74604e' : '#5c4a3c';
    ctx.fillRect(-700, y, 3400, 88);
    ctx.fillStyle = 'rgba(36, 26, 18, 0.18)';
    for (let k = 0; k < 5; k++) ctx.fillRect(-700, y + rng() * 80, 3400, 1.5);
  }
  ctx.fillStyle = 'rgba(48, 36, 26, 0.28)';
  ctx.beginPath();
  ctx.ellipse(260, 1180, 200, 36, -0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(90, 70, 48, 0.35)';
  ctx.fillRect(1680, 1188, 140, 22);
}

export function drawWindow(ctx) {
  ctx.fillStyle = '#8b7158';
  ctx.beginPath();
  ctx.rect(-48, -48, 2016, 1176);
  ctx.rect(0, 0, 1920, 1080);
  ctx.fill('evenodd');
  ctx.fillStyle = '#5b4638';
  ctx.beginPath();
  ctx.rect(-18, -18, 1956, 1116);
  ctx.rect(0, 0, 1920, 1080);
  ctx.fill('evenodd');
  ctx.fillStyle = '#6e6254';
  ctx.fillRect(860, -78, 200, 36);
  ctx.fillStyle = '#3e3c38';
  ctx.beginPath();
  ctx.arc(960, -60, 9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c8b396';
  ctx.fillRect(948, -72, 24, 16);
}

export function foregroundPine(ctx, left) {
  ctx.save();
  ctx.translate(left, 80);
  ctx.fillStyle = INK.paper;
  ctx.translate(-12, 10);
  ctx.fill(pineOutline(0, 0, 980, 520));
  ctx.translate(12, -10);
  ctx.fillStyle = INK.near;
  ctx.fill(pineOutline(0, 0, 980, 520));
  ctx.restore();
}
