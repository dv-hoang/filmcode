// Still Lit — one café corner. Ink first, afternoon wash, then a single lit window.
import { clamp, lerp, seg, ss, spring, mulberry } from '/core/lib.js';
import {
  INK, rgba, mixc, darken, v2, penStroke, drawPen, handwrite, arcPts, ellipsePts,
} from './engine.js';

export const PW = 2800;
export const PH = 1620;
export const DUR = 40;

const STONE = [228, 210, 180];
const VIOLET = [122, 115, 150];
const SHADOW = mixc(STONE, VIOLET, 0.45);
const AWNING = [156, 58, 74];
const LEAF = [95, 138, 69];
const LEAF_LIT = [168, 176, 96];
const HAZE = [197, 205, 212];
const DIST = mixc(STONE, HAZE, 0.5);
const SKY = [232, 186, 150];
const WALK = [214, 204, 186];
const WOOD = [186, 142, 96];
const LAMP = [228, 177, 78];
const COAT = [94, 106, 120];
const APRON = [214, 196, 170];

const FX = 760, FY = 470, FW = 1000, FH = 590;
const WIN = { x: 1480, y: 555, w: 200, h: 230 };
const WCX = WIN.x + WIN.w / 2;
const WCY = WIN.y + WIN.h / 2;

const CAM = [
  [0.0, 1080, 760, 0.88],
  [5.6, 1240, 780, 0.90],
  [7.45, 1500, 900, 1.04],
  [9.05, 1500, 880, 1.02],
  [13.0, 1260, 640, 0.76],
  [16.2, 1260, 1108, 1.58],
  [19.5, 1260, 1108, 1.58],
  [23.4, 1140, 1120, 1.16],
  [27.2, 1360, 980, 0.94],
  [30.4, 1580, 670, 2.2],
  [33.95, 1580, 676, 2.05],
  [35.4, 1400, 1020, 0.86],
  [40.0, 1400, 1020, 0.86],
];

export const LINES = [
  { id: 'v01', t: 1.30, end: 4.30, text: 'Thursday. The corner was only a line.' },
  { id: 'v02', t: 9.60, end: 12.00, text: 'Then the afternoon sat down.' },
  { id: 'v03', t: 21.30, end: 23.70, text: 'The chairs are empty.' },
  { id: 'v04', t: 31.15, end: 33.60, text: 'One window kept the light.' },
];

function sunIn(x, y) {
  return 9.0 + Math.hypot(x - 220, y - 140) / 640;
}

function tOutOf(x, y) {
  return 26.4 + Math.hypot(x - WCX, y - WCY) / 230;
}

function insideWin(x, y) {
  return x > WIN.x + 8 && x < WIN.x + WIN.w - 8 && y > WIN.y + 8 && y < WIN.y + WIN.h - 8;
}

function life(t, tIn, tOut) {
  const inn = ss(seg(t, tIn, tIn + 0.42));
  const out = 1 - ss(seg(t, tOut, tOut + 0.75));
  const a = inn * out;
  const wet = t >= tIn && t - tIn < 0.2 && t < tOut;
  return { a, wet };
}

export function camAt(t) {
  if (t <= CAM[0][0]) return { x: CAM[0][1], y: CAM[0][2], z: CAM[0][3] };
  const last = CAM[CAM.length - 1];
  if (t >= last[0]) return { x: last[1], y: last[2], z: last[3] };
  let i = 0;
  while (CAM[i + 1][0] < t) i++;
  const a = CAM[i], b = CAM[i + 1];
  const u = ss((t - a[0]) / (b[0] - a[0]));
  return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), z: lerp(a[3], b[3], u) };
}

export function worldToScreen(x, y, cam) {
  return [960 + (x - cam.x) * cam.z, 540 + (y - cam.y) * cam.z];
}

function buildStrokes() {
  const S = [];
  const add = (pts, t0, t1, o) => S.push({ s: penStroke(pts, o), t0, t1, seed: o.seed || 1 });
  const yLine = (y, x0, x1, seed, w) => {
    const pts = [];
    for (let x = x0; x <= x1; x += 80) pts.push([x, y + Math.sin(x * 0.01 + seed) * 3]);
    pts.push([x1, y]);
    return pts;
  };
  add(yLine(1048, 160, 2680, 2, 2), 0.35, 2.05, { seed: 3, w: 2.15 });
  add([[430, 560], [430, 1060], [730, 1048]], 1.7, 3.3, { seed: 4, w: 1.7 });
  add([[430, 560], [620, 500], [740, 548]], 1.9, 3.1, { seed: 5, w: 1.6 });
  add([[760, 500], [1100, 462], [1500, 488], [1760, 470]], 0.95, 2.55, { seed: 6, w: 2.3 });
  add([[760, 500], [748, 780], [770, 1064]], 1.35, 3.05, { seed: 7, w: 2.2 });
  add([[1760, 470], [1772, 760], [1750, 1060]], 1.55, 3.25, { seed: 8, w: 2.15 });
  add(yLine(830, 770, 1740, 5, 2), 2.7, 4.15, { seed: 9, w: 1.7 });
  add([[900, 900], [900, 1062]], 3.15, 4.2, { seed: 10, w: 2 });
  add([[1020, 900], [1024, 1060]], 3.3, 4.3, { seed: 11, w: 2 });
  add([[900, 900], [960, 888], [1020, 902]], 3.45, 4.25, { seed: 12, w: 1.8 });
  add([[1480, 555], [1680, 548], [1688, 785], [1476, 790], [1482, 560]], 3.55, 5.15, { seed: 13, w: 2.05 });
  add([[1546, 568], [1548, 772]], 4.15, 4.7, { seed: 14, w: 1.45, gap: false });
  add([[1494, 668], [1670, 662]], 4.3, 4.85, { seed: 15, w: 1.4, gap: false });
  add([[960, 590], [1048, 586], [1052, 700], [956, 704], [962, 592]], 4.0, 4.9, { seed: 16, w: 1.45, gap: false, over: 2 });
  const scallop = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const x = 840 + u * 560;
    const y = 830 + (i % 2 === 0 ? 0 : 28);
    scallop.push([x, y]);
  }
  add(scallop, 4.45, 5.7, { seed: 18, w: 2 });
  add(yLine(1088, 200, 2600, 8, 2), 4.9, 6.4, { seed: 19, w: 1.8 });
  add(yLine(1288, 240, 2500, 3, 2), 5.15, 6.55, { seed: 20, w: 2.4 });
  add([[1960, 520], [2140, 490], [2480, 530]], 5.2, 6.3, { seed: 21, w: 1.55 });
  add([[1960, 520], [1952, 1060]], 5.4, 6.5, { seed: 22, w: 1.5 });
  add([[2480, 530], [2472, 1055]], 5.55, 6.6, { seed: 23, w: 1.45 });
  add([[1160, 1188], [1420, 1176]], 5.7, 6.35, { seed: 24, w: 2.3 });
  add([[1184, 1188], [1190, 1296]], 5.9, 6.45, { seed: 25, w: 2, gap: false });
  add([[1396, 1178], [1404, 1292]], 6.0, 6.5, { seed: 26, w: 2, gap: false });
  add([[1688, 1210], [1660, 1290], [1780, 1294], [1764, 1206]], 6.15, 6.9, { seed: 27, w: 1.9 });
  add(arcPts(1722, 1196, 34, 16, Math.PI * 1.05, Math.PI * 1.85, 5), 6.3, 6.85, { seed: 28, w: 1.6, gap: false, over: 2 });
  add(arcPts(1696, 1204, 22, 14, Math.PI * 0.15, Math.PI * 0.9, 4), 6.45, 6.95, { seed: 29, w: 1.5, gap: false, over: 2 });
  add(arcPts(1754, 1202, 20, 13, Math.PI * 1.15, Math.PI * 1.95, 4), 6.55, 7.05, { seed: 30, w: 1.5, gap: false, over: 2 });
  add([[868, 1060], [900, 1088]], 6.4, 6.8, { seed: 31, w: 1.7, gap: false, over: 3 });
  return S;
}

export const STROKES = buildStrokes();

function makeBlots(x, y, w, h, n, seed, colorAt, rx, ry) {
  const rnd = mulberry(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const px = x + rnd() * w;
    const py = y + rnd() * h;
    if (insideWin(px, py)) continue;
    out.push({
      x: px + 4,
      y: py - 3,
      rx: rx * (0.55 + rnd() * 0.7),
      ry: ry * (0.55 + rnd() * 0.65),
      rot: (rnd() - 0.5) * 0.8,
      tint: colorAt(px, py),
      tIn: sunIn(px, py) + rnd() * 0.22,
      tOut: tOutOf(px, py),
      grain: 0.82 + 0.36 * v2(px * 0.021, py * 0.021),
      a: 0.34 + rnd() * 0.22,
    });
  }
  return out;
}

const BLOTS = [
  ...makeBlots(FX + 8, FY + 10, FW - 20, FH - 20, 70, 41, (x) => (x > FX + FW * 0.62 ? SHADOW : STONE), 46, 34),
  ...makeBlots(FX + 20, FY + 24, FW - 40, FH - 40, 28, 46, (x) => (x > FX + FW * 0.62 ? SHADOW : STONE), 70, 48),
  ...makeBlots(430, 560, 300, 500, 22, 42, () => DIST, 40, 30),
  ...makeBlots(1960, 530, 500, 520, 26, 43, () => DIST, 44, 32),
  ...makeBlots(830, 828, 580, 70, 16, 44, () => AWNING, 36, 16),
  ...makeBlots(180, 1100, 2440, 170, 36, 45, () => WALK, 64, 18),
];

function makeSky() {
  const rnd = mulberry(50);
  const blobs = [];
  const spots = [[520, 280, 420, 180], [1100, 220, 520, 200], [1750, 260, 380, 160], [2300, 240, 300, 140], [900, 360, 260, 90]];
  for (const [x, y, rx, ry] of spots) {
    blobs.push({
      x: x + (rnd() - 0.5) * 30,
      y: y + (rnd() - 0.5) * 20,
      rx, ry,
      rot: (rnd() - 0.5) * 0.4,
      tIn: sunIn(x, y),
      tOut: tOutOf(x, y),
      a: 0.14 + rnd() * 0.06,
    });
  }
  return blobs;
}
const SKY_BLOBS = makeSky();

function makeLeaves() {
  const rnd = mulberry(60);
  const out = [];
  for (let i = 0; i < 18; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 10 + rnd() * 62;
    const x = 1722 + Math.cos(a) * rad * 0.7;
    const y = 1172 + Math.sin(a) * rad * 0.45;
    const light = clamp(1 - (x * 0.15 + y) / 2200);
    out.push({
      x, y,
      rx: 7 + rnd() * 13,
      ry: 4 + rnd() * 8,
      rot: rnd() * 3,
      hole: rad > 48 && rnd() > 0.55,
      tint: mixc(LEAF, LEAF_LIT, light * 0.7),
      tIn: sunIn(x, y) + 0.25,
      tOut: tOutOf(x, y),
    });
  }
  return out;
}
const LEAVES = makeLeaves();

function lampDabs() {
  const rnd = mulberry(70);
  const out = [];
  for (let i = 0; i < 26; i++) {
    const u = rnd(), v = rnd();
    const x = WIN.x + 16 + u * (WIN.w - 32);
    const y = WIN.y + 16 + v * (WIN.h - 32);
    const edge = Math.min(u, v, 1 - u, 1 - v);
    out.push({
      x, y,
      rx: 10 + rnd() * 16,
      ry: 8 + rnd() * 12,
      a: edge < 0.22 ? 0.62 : 0.2,
      tIn: 30.42 + rnd() * 0.22,
    });
  }
  return out;
}
const LAMP_DABS = lampDabs();

const EDGE = penStroke(
  [[766, 478], [1766, 464], [1770, 1066], [756, 1072], [760, 490]],
  { seed: 80, w: 7, wob: 1.4, over: 2 },
);

function fillPoly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function drawWashes(ctx, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (const b of SKY_BLOBS) {
    const { a, wet } = life(t, b.tIn, b.tOut);
    if (a < 0.02) continue;
    ctx.fillStyle = rgba(wet ? darken(SKY, 0.18) : SKY, b.a * a);
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.rx, b.ry, b.rot, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const b of BLOTS) {
    const { a, wet } = life(t, b.tIn, b.tOut);
    if (a < 0.02) continue;
    const col = wet ? darken(b.tint, 0.22) : b.tint;
    ctx.fillStyle = rgba(col, b.a * a * b.grain);
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.rx, b.ry, b.rot, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const d of LEAVES) {
    if (d.hole) continue;
    const { a, wet } = life(t, d.tIn, d.tOut);
    if (a < 0.02) continue;
    ctx.fillStyle = rgba(wet ? darken(d.tint, 0.2) : d.tint, 0.55 * a);
    ctx.beginPath();
    ctx.ellipse(d.x + 3, d.y - 2, d.rx, d.ry, d.rot, 0, Math.PI * 2);
    ctx.fill();
  }
  const facadeIn = sunIn(WCX, WCY);
  const { a: edgeA } = life(t, facadeIn + 0.3, tOutOf(FX, FY));
  if (edgeA > 0.05) drawPen(ctx, EDGE, 1, darken(STONE, 0.35), 0.38 * edgeA);
  const lamp = ss(seg(t, 30.42, 30.9));
  if (lamp > 0.02) {
    ctx.fillStyle = rgba(LAMP, 0.16 * lamp);
    ctx.beginPath();
    ctx.ellipse(WCX, WCY, 78, 90, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const d of LAMP_DABS) {
    const a = ss(seg(t, d.tIn, d.tIn + 0.35));
    if (a < 0.02) continue;
    ctx.fillStyle = rgba(LAMP, d.a * a);
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.rx, d.ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // leaf holes back to paper happen by simply not drawing those dabs; a few
  // cream reserves sit on top so the crown is not a solid blob
  const rnd = mulberry(61);
  ctx.save();
  for (const d of LEAVES) {
    if (!d.hole) continue;
    const { a } = life(t, d.tIn, d.tOut);
    if (a < 0.2) continue;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#f4ecdf';
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.rx * 0.45, d.ry * 0.4, rnd(), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawInk(ctx, t) {
  for (const s of STROKES) {
    const p = seg(t, s.t0, s.t1);
    if (p <= 0) continue;
    const y = s.s.pts[0][1];
    const wScale = lerp(0.85, 1.25, clamp((y - 400) / 1000));
    drawPen(ctx, { ...s.s, w: s.s.w * wScale }, p);
  }
}

function jitter(seed, amp) {
  const rnd = mulberry(seed);
  return [(rnd() - 0.5) * 2 * amp, (rnd() - 0.5) * 2 * amp];
}

function add(p, j) {
  return [p[0] + j[0], p[1] + j[1]];
}

const SIT = {
  head: [1342, 1008], nose: [1316, 1022],
  neck: [1348, 1052], shL: [1310, 1072], shR: [1384, 1076],
  hip: [1352, 1168], hipL: [1320, 1174], hipR: [1386, 1172],
  elL: [1288, 1138], elR: [1318, 1110],
  hdL: [1264, 1188], hdR: [1292, 1152],
  knL: [1294, 1242], knR: [1418, 1236],
  ftL: [1272, 1304], ftR: [1452, 1300],
};
const SIT_DRINK = {
  ...SIT,
  elR: [1328, 1068],
  hdR: [1324, 1036],
};
const SIT_LEAN = {
  ...SIT,
  head: [1304, 1030], nose: [1280, 1042], neck: [1316, 1070],
  shL: [1284, 1088], shR: [1356, 1092],
};
const STAND = {
  head: [1288, 918], nose: [1264, 932],
  neck: [1294, 968], shL: [1256, 990], shR: [1330, 994],
  hip: [1298, 1128], hipL: [1272, 1134], hipR: [1330, 1132],
  elL: [1240, 1088], elR: [1348, 1084],
  hdL: [1224, 1168], hdR: [1364, 1164],
  knL: [1260, 1224], knR: [1340, 1220],
  ftL: [1248, 1306], ftR: [1356, 1304],
};

const WAIT = {
  head: [1148, 948], nose: [1172, 962],
  neck: [1144, 996], shL: [1108, 1016], shR: [1182, 1018],
  hip: [1140, 1148], hipL: [1114, 1154], hipR: [1170, 1152],
  elL: [1092, 1100], elR: [1204, 1092],
  hdL: [1084, 1180], hdR: [1226, 1164],
  knL: [1108, 1230], knR: [1176, 1228],
  ftL: [1096, 1306], ftR: [1192, 1304],
};
const WAIT_POUR = {
  ...WAIT,
  elR: [1236, 1048],
  hdR: [1268, 1124],
};
const WAIT_REACH = {
  ...WAIT,
  elR: [1240, 1088],
  hdR: [1272, 1148],
};

function blendPose(a, b, u) {
  const o = {};
  for (const k in a) o[k] = [lerp(a[k][0], b[k][0], u), lerp(a[k][1], b[k][1], u)];
  return o;
}

function shiftPose(pose, dx, step) {
  const o = {};
  const s = Math.sin(step * Math.PI * 2);
  for (const k in pose) o[k] = [pose[k][0] + dx, pose[k][1]];
  o.ftL = [o.ftL[0] + s * 18, o.ftL[1] - Math.max(0, s) * 10];
  o.ftR = [o.ftR[0] - s * 18, o.ftR[1] - Math.max(0, -s) * 10];
  o.knL = [o.knL[0] + s * 8, o.knL[1] - Math.max(0, s) * 14];
  o.knR = [o.knR[0] - s * 8, o.knR[1] - Math.max(0, -s) * 14];
  o.hdL = [o.hdL[0] + Math.sin(step * Math.PI * 2 + 1) * 8, o.hdL[1]];
  o.hdR = [o.hdR[0] + Math.sin(step * Math.PI * 2) * 8, o.hdR[1]];
  return o;
}

function sitterPose(t) {
  if (t < 5.9 || t > 24.2) return null;
  let pose = SIT;
  if (t >= 15.35 && t < 17.55) {
    const u = Math.sin(ss(seg(t, 15.35, 17.55)) * Math.PI);
    pose = blendPose(SIT, SIT_DRINK, u);
  } else if (t >= 19.35 && t < 19.75) {
    pose = blendPose(SIT, SIT_LEAN, ss(seg(t, 19.35, 19.75)));
  } else if (t >= 19.75 && t < 20.6) {
    pose = blendPose(SIT_LEAN, STAND, ss(seg(t, 19.75, 20.6)));
  } else if (t >= 20.6) {
    const phase = seg(t, 20.6, 24.2);
    pose = shiftPose(STAND, -520 * phase, (t - 20.6) / 0.75);
  }
  return pose;
}

function waiterPose(t) {
  if (t < 5.5 || t > 27.15) return null;
  let pose = WAIT;
  if (t >= 13.05 && t < 13.45) pose = blendPose(WAIT, WAIT_POUR, ss(seg(t, 13.05, 13.45)));
  else if (t >= 13.45 && t < 14.7) pose = WAIT_POUR;
  else if (t >= 14.7 && t < 15.25) pose = blendPose(WAIT_POUR, WAIT, ss(seg(t, 14.7, 15.25)));
  else if (t >= 23.35 && t < 24.05) pose = blendPose(WAIT, WAIT_REACH, ss(seg(t, 23.35, 24.05)));
  else if (t >= 24.05 && t < 24.35) pose = WAIT_REACH;
  else if (t >= 24.35) {
    const phase = seg(t, 24.35, 27.1);
    pose = shiftPose(WAIT_REACH, -220 * ss(phase), (t - 24.35) / 0.75);
    if (pose.hip[0] < 960) return null;
  }
  return pose;
}

function boilPose(pose, t, alive) {
  if (!pose) return null;
  const seed = alive ? Math.floor(t * 12) * 13 + 4 : 2;
  const j = jitter(seed, alive ? 1.15 : 0);
  const o = {};
  let n = 0;
  for (const k in pose) {
    const jj = alive ? jitter(seed + (++n) * 17, 0.55) : [0, 0];
    o[k] = add(pose[k], [j[0] + jj[0], j[1] + jj[1]]);
  }
  return o;
}

function limb(ctx, a, b, w, seed, p) {
  if (p <= 0) return;
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const rnd = mulberry(seed);
  mid[0] += (rnd() - 0.5) * 3;
  mid[1] += (rnd() - 0.5) * 3;
  drawPen(ctx, penStroke([a, mid, b], { seed, w, wob: 0.9, over: 3, gap: false, step: 10 }), p);
}

function washLimb(ctx, a, b, color, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a[0] + 3, a[1] - 2);
  ctx.quadraticCurveTo((a[0] + b[0]) / 2 + 4, (a[1] + b[1]) / 2 - 3, b[0] + 3, b[1] - 2);
  ctx.stroke();
  ctx.restore();
}

function drawFigure(ctx, pose, t0ink, colorT, t, coat, seed, paper) {
  const appear = seg(t, t0ink, t0ink + 0.9);
  if (!pose || appear <= 0) return;
  const colored = t > colorT;
  const col = ss(seg(t, colorT, colorT + 0.5));
  const P = boilPose(pose, t, colored);
  const facing = P.nose[0] < P.head[0] ? -1 : 1;
  if (col > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = rgba(coat, 0.4 * col);
    ctx.beginPath();
    ctx.moveTo(P.shL[0] + 3, P.shL[1] - 2);
    ctx.lineTo(P.shR[0] + 5, P.shR[1] - 1);
    ctx.lineTo(P.hipR[0] + 4, P.hipR[1] + 6);
    ctx.lineTo(P.hipL[0] + 2, P.hipL[1] + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    washLimb(ctx, P.shR, P.hdR, coat, 0.32 * col);
    washLimb(ctx, P.hipR, P.ftR, coat, 0.28 * col);
  }
  const coatPts = [P.shL, P.hipL, P.hip, P.hipR, P.shR];
  drawPen(ctx, penStroke(coatPts, { seed: seed + 7, w: 2.15, wob: 0.8, over: 3, gap: false, step: 12 }), clamp(appear * 1.4));
  limb(ctx, P.shR, P.elR, 1.9, seed + 11, clamp(appear * 2 - 0.3));
  limb(ctx, P.elR, P.hdR, 1.65, seed + 12, clamp(appear * 2 - 0.5));
  limb(ctx, P.hipL, P.knL, 2.05, seed + 13, clamp(appear * 2 - 0.2));
  limb(ctx, P.knL, P.ftL, 1.8, seed + 14, clamp(appear * 2 - 0.45));
  limb(ctx, P.hipR, P.knR, 2.05, seed + 15, clamp(appear * 2 - 0.15));
  limb(ctx, P.knR, P.ftR, 1.8, seed + 16, clamp(appear * 2 - 0.4));
  if (appear > 0.45) {
    const hp = seg(appear, 0.45, 0.95);
    const hx = P.head[0], hy = P.head[1];
    if (col > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = rgba(INK, 0.5 * col);
      ctx.beginPath();
      ctx.ellipse(hx - facing * 2, hy - 10, 20, 18, facing * -0.2, Math.PI * 0.15, Math.PI * 1.15);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(hx + facing * 2, hy + 2, 13, 14, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(paper, 0, 0);
      ctx.restore();
    }
    drawPen(ctx, penStroke(
      arcPts(hx - facing * 1, hy - 8, 18, 16, Math.PI * 0.15, Math.PI * 1.05, 5),
      { seed: seed + 40, w: 1.7, over: 2, gap: false, wob: 0.7 },
    ), hp);
    const noseP = seg(hp, 0.35, 1);
    if (noseP > 0) {
      const from = [hx + facing * 6, hy + 2];
      drawPen(ctx, penStroke([from, P.nose], { seed: seed + 42, w: 1.35, over: 1.5, gap: false, wob: 0.3 }), noseP);
    }
  }
}

function drawChair(ctx, x, y, t, shift, rot, t0) {
  const p = seg(t, t0, t0 + 0.7);
  if (p <= 0) return;
  ctx.save();
  ctx.translate(x + shift, y);
  ctx.rotate(rot);
  const lines = [
    [[-28, 0], [28, 2]],
    [[-24, 0], [-28, 112]],
    [[24, 2], [30, 114]],
    [[-30, -52], [-8, -2]],
    [[-34, -54], [8, -56]],
  ];
  lines.forEach((ln, i) => {
    drawPen(ctx, penStroke(ln, { seed: 90 + i + Math.round(x), w: 1.9, over: 3, gap: false }), p);
  });
  ctx.restore();
}

function drawCup(ctx, x, y, p) {
  if (p <= 0) return;
  drawPen(ctx, penStroke(ellipsePts(x, y, 15, 11, 12), { seed: 100, w: 1.7, over: 2, gap: false, wob: 0.7 }), p);
  drawPen(ctx, penStroke(arcPts(x + 15, y, 7, 6, -1.1, 1.1, 5), { seed: 101, w: 1.5, over: 2, gap: false }), p);
  drawPen(ctx, penStroke(ellipsePts(x, y - 12, 12, 4, 10), { seed: 102, w: 1.3, over: 1, gap: false, wob: 0.5 }), p);
}

function cupWhere(t, sitter, waiter) {
  if (t < 6.2 || t > 26.9) return null;
  if (t >= 15.35 && t < 17.55 && sitter) {
    const u = Math.sin(ss(seg(t, 15.35, 17.55)) * Math.PI);
    return [lerp(1264, sitter.hdR[0], u), lerp(1164, sitter.hdR[1], u)];
  }
  if (t >= 24.0) return waiter ? waiter.hdR : null;
  return [1264, 1164];
}

function drawCarrots(ctx, t) {
  const specs = [
    { x: 2140, leave: 22.6, seed: 11 },
    { x: 2310, leave: 23.5, seed: 12 },
    { x: 2460, leave: 24.4, seed: 13 },
  ];
  for (const s of specs) {
    const appear = seg(t, 6.3, 7.1);
    if (appear <= 0) continue;
    const leave = ss(seg(t, s.leave, s.leave + 3.4));
    const x = s.x + leave * 320;
    const alive = t > 14;
    const j = jitter(alive ? Math.floor(t * 12) + s.seed : s.seed, alive ? 1 : 0);
    const y = 1264 + j[1];
    const xx = x + j[0];
    const col = ss(seg(t, 14.2, 14.8));
    if (col > 0.05 && leave < 0.95) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = rgba(COAT, 0.35 * col);
      ctx.beginPath();
      ctx.ellipse(xx, y - 28, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawPen(ctx, penStroke([[xx - 4, y - 8], [xx - 6, y + 18]], { seed: s.seed, w: 1.4, gap: false, over: 2 }), appear);
    drawPen(ctx, penStroke([[xx + 4, y - 8], [xx + 6, y + 18]], { seed: s.seed + 3, w: 1.4, gap: false, over: 2 }), appear);
    drawPen(ctx, penStroke(ellipsePts(xx, y - 36, 5, 5, 8), { seed: s.seed + 5, w: 1.3, gap: false, over: 1 }), appear);
  }
}

function drawNotes(ctx, t) {
  const dateP = ss(seg(t, 1.15, 2.45));
  if (t < 8.2 && dateP > 0) handwrite(ctx, 'Thursday, 4:10', 470, 300, 54, dateP);
  if (t >= 35.4) {
    handwrite(ctx, 'Still Lit', 620, 1324, 64, ss(seg(t, 35.45, 35.95)));
    handwrite(ctx, 'Thursday, 7:40', 620, 1396, 46, ss(seg(t, 36.05, 36.9)));
    handwrite(ctx, 'Pigeon & Third', 620, 1460, 42, ss(seg(t, 36.7, 37.55)));
  }
}

export function drawWorld(ctx, t, paper, tooth) {
  ctx.save();
  ctx.drawImage(paper, 0, 0);
  drawWashes(ctx, t);
  const woodIn = sunIn(1280, 1200);
  const wood = life(t, woodIn, tOutOf(1280, 1200));
  if (wood.a > 0.03) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = rgba(WOOD, 0.35 * wood.a);
    ctx.beginPath();
    ctx.ellipse(1290, 1196, 140, 18, -0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawInk(ctx, t);
  const chairShift = t < 19.75 ? 0 : 22 * spring(Math.min(1.4, t - 19.75), 7, 0.42);
  const chairRot = t < 19.75 ? 0 : 0.08 * spring(Math.min(1.4, t - 19.75), 7, 0.42);
  drawChair(ctx, 1336, 1188, t, chairShift, chairRot, 6.0);
  drawChair(ctx, 1168, 1196, t, 0, -0.04, 6.2);
  const sitter = sitterPose(t);
  const waiter = waiterPose(t);
  drawFigure(ctx, waiter, 5.55, 11.5, t, APRON, 200, paper);
  drawFigure(ctx, sitter, 6.05, 12.35, t, COAT, 300, paper);
  const cup = cupWhere(t, sitter, waiter);
  if (cup) drawCup(ctx, cup[0], cup[1], seg(t, 6.15, 6.8));
  drawCarrots(ctx, t);
  if (tooth) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.55;
    const pat = ctx.createPattern(tooth, 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, PW, PH);
    ctx.restore();
  }
  drawNotes(ctx, t);
  ctx.restore();
}

export function subtitleAt(t) {
  for (const line of LINES) {
    if (t < line.t || t > line.end) continue;
    return { text: line.text, p: ss(seg(t, line.t, line.t + 0.42)) };
  }
  return null;
}

function noteBox(ctx, text, x, y, size, cam) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `560 ${size}px Caveat, cursive`;
  const w = ctx.measureText(text).width;
  ctx.restore();
  const [sx, sy] = worldToScreen(x, y, cam);
  const top = size * cam.z * 1.02;
  const bot = size * cam.z * 0.28;
  return { x0: sx - 4, y0: sy - top, x1: sx + w * cam.z + 6, y1: sy + bot };
}

export function textsAt(ctx, t) {
  const cam = camAt(t);
  const out = [];
  if (t >= 1.12 && t <= 6.0) {
    out.push({ id: 'date', text: 'Thursday, 4:10', ...noteBox(ctx, 'Thursday, 4:10', 470, 300, 54, cam) });
  }
  if (t >= 35.5) {
    out.push({ id: 'title', text: 'Still Lit', ...noteBox(ctx, 'Still Lit', 620, 1324, 64, cam) });
  }
  if (t >= 36.0) {
    out.push({ id: 'evening', text: 'Thursday, 7:40', ...noteBox(ctx, 'Thursday, 7:40', 620, 1396, 46, cam) });
  }
  if (t >= 36.65) {
    out.push({ id: 'place', text: 'Pigeon & Third', ...noteBox(ctx, 'Pigeon & Third', 620, 1460, 42, cam) });
  }
  return out;
}

export function events() {
  const ev = STROKES.map((s, i) => ({
    t: s.t0,
    type: 'pen',
    dur: Math.min(0.42, Math.max(0.12, s.t1 - s.t0)),
    pan: clamp((s.s.pts[0][0] / PW - 0.5) * 1.6, -0.8, 0.8),
    seed: 100 + i,
  }));
  ev.push(
    { t: 7.55, type: 'silence', dur: 1.5 },
    { t: 9.05, type: 'brush', dur: 0.7, pan: -0.35, seed: 3 },
    { t: 11.4, type: 'brush', dur: 0.45, pan: 0.1, seed: 4 },
    { t: 13.5, type: 'cup', pan: 0.15, seed: 5 },
    { t: 15.45, type: 'cup', pan: -0.05, seed: 6 },
    { t: 17.65, type: 'silence', dur: 1.7 },
    { t: 19.55, type: 'chair', pan: 0.2, seed: 7 },
    { t: 21.0, type: 'step', pan: -0.05 },
    { t: 21.75, type: 'step', pan: -0.16 },
    { t: 22.5, type: 'step', pan: -0.28 },
    { t: 23.25, type: 'step', pan: -0.4 },
    { t: 23.9, type: 'cup', pan: 0.0, seed: 8 },
    { t: 24.6, type: 'step', pan: -0.15 },
    { t: 25.35, type: 'step', pan: -0.28 },
    { t: 26.1, type: 'step', pan: -0.4 },
    { t: 25.8, type: 'air' },
    { t: 30.45, type: 'tick', pan: 0.25 },
    { t: 35.55, type: 'pen', dur: 0.55, pan: -0.2, seed: 80 },
    { t: 36.25, type: 'pen', dur: 0.7, pan: -0.15, seed: 81 },
    { t: 37.2, type: 'pen', dur: 0.75, pan: -0.1, seed: 82 },
  );
  for (const line of LINES) ev.push({ t: line.t, type: 'voice', id: line.id });
  ev.sort((a, b) => a.t - b.t);
  return ev;
}
