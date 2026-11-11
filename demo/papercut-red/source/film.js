// Eighth Fold — picture. Every frame is a function of t.
import { clamp, eo, lerp, seg, ss } from '/core/lib.js';
import {
  INK, crescentPts, drawPiece, ellipsePts, fillPaper, initPaper, limbPts, wobble,
} from './paper.js';
import { DUR, EV, UNFOLD } from './timeline.js';

const SHEET = { x: 430, y: 530, w: 1160, h: 240 };
const PW = SHEET.w / 8;
const HIP = { x: 300, y: 748, s: 1.18 };

const CAM = [
  [0.00, 500, 610, 2.55],
  [1.30, 530, 630, 2.25],
  [4.40, 600, 650, 1.65],
  [7.00, 760, 680, 1.14],
  [9.90, 900, 660, 1.04],
  [13.60, 990, 650, 1.02],
  [18.20, 980, 640, 1.00],
  [26.40, 1040, 660, 1.02],
  [29.50, 1000, 620, 1.08],
  [33.20, 980, 590, 1.10],
  [36.40, 960, 570, 1.02],
  [40.00, 960, 590, 1.00],
];

const panelCache = [];
const holeCache = [];

function panelPts(i) {
  if (panelCache[i]) return panelCache[i];
  const x = SHEET.x + i * PW;
  const y = SHEET.y;
  const pts = [];
  const n = 7;
  for (let k = 0; k <= n; k++) {
    pts.push([x + (k / n) * PW, y + (k % 2 === 0 ? 0 : 11)]);
  }
  pts.push([x + PW - 1, y + SHEET.h]);
  pts.push([x + 1, y + SHEET.h]);
  panelCache[i] = wobble(pts, 30 + i, 1.15);
  return panelCache[i];
}

function holePts(i) {
  if (holeCache[i]) return holeCache[i];
  const cx = SHEET.x + i * PW + PW * 0.5;
  const cy = SHEET.y + SHEET.h * 0.46;
  holeCache[i] = crescentPts(cx, cy, 40, 17, Math.PI * 0.18, Math.PI * 0.82, 14);
  return holeCache[i];
}

function holeCenter(i) {
  return [SHEET.x + i * PW + PW * 0.5, SHEET.y + SHEET.h * 0.46];
}

function camera(t) {
  let i = 0;
  while (i < CAM.length - 2 && t >= CAM[i + 1][0]) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  const u = eo(seg(t, a[0], b[0]));
  return {
    x: lerp(a[1], b[1], u),
    y: lerp(a[2], b[2], u),
    s: lerp(a[3], b[3], u),
  };
}

function shake(t) {
  let x = 0;
  let y = 0;
  for (let i = 0; i < UNFOLD.length; i++) {
    const d = t - UNFOLD[i];
    if (d >= 0 && d < 0.09) {
      const k = d < 1 / 24 ? 1 : 0.45;
      const s = i % 2 === 0 ? 1 : -1;
      x += s * (i === 0 ? 7 : 4.5) * k;
      y += (i === 0 ? -5 : -3) * k;
    }
  }
  return [x, y];
}

function openAmt(i, t) {
  return eo(clamp((t - UNFOLD[i]) / 0.40));
}

function sheetXf(t) {
  if (t < 28.2) return { dx: 0, dy: 0, sc: 1 };
  const u = eo(seg(t, 28.2, 31.5));
  const cx = SHEET.x + SHEET.w * 0.5;
  return { dx: (980 - cx) * 0.22 * u, dy: -86 * u, sc: 1 - 0.14 * u };
}

function q12(t) {
  return Math.floor(t * 12) / 12;
}

function exprAt(t) {
  const q = q12(t);
  if (q < 9.92) return 'determined';
  if (q < 13.42) return 'surprise';
  return 'smile';
}

function leanAt(t) {
  const q = q12(t);
  if (q < 0.5) return 10;
  if (q < 4.6) return 16;
  if (q < 9.9) return 4;
  if (q < 10.08) return -6;
  if (q < 13.4) return -4;
  if (q < 28.2) return 3;
  return -2;
}

function headTilt(t) {
  const q = q12(t);
  if (q >= 9.92 && q < 10.25) return -10;
  if (q >= 10.25 && q < 11.2) return 6;
  return 0;
}

function ikArm(shoulder, target, l1, l2) {
  const dx = target[0] - shoulder[0];
  const dy = target[1] - shoulder[1];
  const raw = Math.hypot(dx, dy) || 1;
  const dist = clamp(raw, Math.abs(l1 - l2) + 1, l1 + l2 - 1);
  const ux = dx / raw;
  const uy = dy / raw;
  const hand = [shoulder[0] + ux * dist, shoulder[1] + uy * dist];
  const a = Math.atan2(uy, ux);
  const cosb = clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
  const b = Math.acos(cosb);
  let best = null;
  for (const ang of [a + b, a - b]) {
    const elbow = [shoulder[0] + Math.cos(ang) * l1, shoulder[1] + Math.sin(ang) * l1];
    if (!best || elbow[1] > best.elbow[1]) best = { elbow, hand };
  }
  return best;
}

function faceHoles(expr) {
  const eyeU = crescentPts(12, -4, 12, 4.2, Math.PI * 1.08, Math.PI * 1.92, 10);
  const eyeL = crescentPts(12, -1, 11, 3.4, Math.PI * 0.08, Math.PI * 0.92, 10);
  const pupil = ellipsePts(15, -2, 3.1, 3.4, 8);
  const brow = [
    [2, -18],
    [22, expr === 'surprise' ? -24 : -16],
    [22, expr === 'surprise' ? -21 : -13],
    [2, -15],
  ];
  let mouth;
  if (expr === 'smile') mouth = crescentPts(14, 16, 12, 4.5, Math.PI * 0.12, Math.PI * 0.88, 10);
  else if (expr === 'surprise') mouth = ellipsePts(14, 18, 5.5, 7, 10);
  else mouth = [[6, 16], [22, 17], [22, 20], [6, 19]];
  const cheek = crescentPts(6, 10, 7, 2.6, Math.PI * 0.2, Math.PI * 0.8, 8);
  return [eyeU, eyeL, pupil, brow, mouth, cheek];
}

function coatPts() {
  const pts = [[-48, -168], [54, -162], [60, -36]];
  for (let i = 8; i >= 0; i--) {
    const x = 60 - i * (112 / 8);
    const y = -22 - (i % 2 === 0 ? 0 : 16);
    pts.push([x, y]);
  }
  pts.push([-52, -40]);
  return wobble(pts, 4, 1.15);
}

const COAT = coatPts();
const QUILT = [
  crescentPts(0, -110, 16, 6, 0.3, Math.PI - 0.3, 8),
  crescentPts(-16, -78, 14, 5.5, 0.35, Math.PI - 0.35, 8),
  crescentPts(16, -74, 14, 5.5, 0.35, Math.PI - 0.35, 8),
];
const HEAD = wobble(ellipsePts(0, 0, 46, 52, 24), 8, 1.05);
const BUN = wobble(ellipsePts(-28, -18, 22, 20, 14), 9, 1.3);

function handTarget(t) {
  const q = q12(t);
  if (q < 6.2) return [508, 648];
  if (q < 28.2) return [430, 700];
  return [520, 560];
}

function drawKeeper(ctx, t) {
  const s = HIP.s;
  const lean = leanAt(t) * Math.PI / 180;
  ctx.save();
  ctx.translate(HIP.x, HIP.y);
  ctx.scale(s, s);
  ctx.rotate(lean);
  const shoulder = [58, -108];
  const target = handTarget(t);
  const localT = [
    (target[0] - HIP.x) / s,
    (target[1] - HIP.y) / s,
  ];
  // Undo lean so the hand still aims at the packet in world space.
  const c = Math.cos(-lean);
  const sn = Math.sin(-lean);
  const aimed = [localT[0] * c - localT[1] * sn, localT[0] * sn + localT[1] * c];
  const arm = ikArm(shoulder, aimed, 98, 90);
  const hipF = [8, -16];
  const kneeF = [24, 62];
  const footF = [30, 136];
  const hipB = [-12, -12];
  const kneeB = [-26, 60];
  const footB = [-16, 134];

  drawPiece(ctx, {
    pts: wobble(limbPts(hipB[0], hipB[1], kneeB[0], kneeB[1], 28, 22), 12, 1),
    fill: INK.far, insetD: 4,
  });
  drawPiece(ctx, {
    pts: wobble(limbPts(kneeB[0], kneeB[1], footB[0], footB[1], 20, 16), 13, 1),
    fill: INK.far, insetD: 3.5,
  });
  drawPiece(ctx, {
    pts: wobble(ellipsePts(footB[0] + 6, footB[1], 16, 9, 10), 14, 0.8),
    fill: INK.deep, inset: false,
  });

  drawPiece(ctx, { pts: COAT, holes: QUILT, fill: INK.red, insetD: 6 });

  ctx.save();
  ctx.translate(14, -178);
  ctx.rotate(headTilt(t) * Math.PI / 180);
  drawPiece(ctx, { pts: BUN, fill: INK.deep, insetD: 3.5 });
  drawPiece(ctx, { pts: HEAD, holes: faceHoles(exprAt(t)), fill: INK.red, insetD: 5 });
  ctx.restore();

  drawPiece(ctx, {
    pts: wobble(limbPts(hipF[0], hipF[1], kneeF[0], kneeF[1], 30, 24), 17, 1),
    fill: INK.near, insetD: 4,
  });
  drawPiece(ctx, {
    pts: wobble(limbPts(kneeF[0], kneeF[1], footF[0], footF[1], 22, 17), 18, 1),
    fill: INK.near, insetD: 3.5,
  });
  drawPiece(ctx, {
    pts: wobble(ellipsePts(footF[0] + 8, footF[1], 18, 10, 10), 19, 0.8),
    fill: INK.deep, inset: false,
  });

  drawPiece(ctx, {
    pts: wobble(limbPts(shoulder[0], shoulder[1], arm.elbow[0], arm.elbow[1], 24, 18), 20, 1),
    fill: INK.near, insetD: 4,
  });
  drawPiece(ctx, {
    pts: wobble(limbPts(arm.elbow[0], arm.elbow[1], arm.hand[0], arm.hand[1], 17, 14), 21, 1),
    fill: INK.near, insetD: 3,
  });
  const hx = arm.hand[0];
  const hy = arm.hand[1];
  const mitt = wobble([
    [hx - 8, hy - 10],
    [hx + 22, hy - 6],
    [hx + 26, hy + 4],
    [hx + 18, hy + 12],
    [hx + 10, hy + 8],
    [hx + 8, hy + 16],
    [hx, hy + 10],
    [hx - 4, hy + 16],
    [hx - 10, hy + 6],
  ], 22, 0.7);
  drawPiece(ctx, {
    pts: mitt,
    holes: [crescentPts(hx + 8, hy + 2, 7, 2.6, 0.2, Math.PI - 0.2, 8)],
    fill: INK.near,
    insetD: 3,
  });
  ctx.restore();
}

function drawGround(ctx, t, camX) {
  ctx.fillStyle = INK.sky;
  ctx.fillRect(-200, -200, 2400, 700);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#8a9098';
  ctx.fillRect(-200, -200, 2400, 1400);
  ctx.restore();

  const par = (camX - 960) * 0.25;
  const banks = eo(seg(t, 17.55, 19.05));
  const peel = eo(seg(t, 28.35, 30.1));
  const farY = -40 - (1 - banks) * 420 - peel * 520 + par * 0.3;
  const far = [];
  for (let i = 0; i <= 18; i++) {
    far.push([-180 + i * 130, farY + 210 + (i % 2 === 0 ? 0 : 36)]);
  }
  far.push([2300, farY + 420], [-180, farY + 420]);
  if (banks > 0.02 && peel < 0.98) fillPaper(ctx, far, INK.farBank);

  ctx.fillStyle = INK.water;
  ctx.fillRect(-200, 430, 2400, 700);

  const table = [
    [180, 860], [1760, 840], [1820, 1080], [120, 1080],
  ];
  fillPaper(ctx, wobble(table, 2, 0.8), INK.table);

  const nearY = 40 + (1 - banks) * 380 + peel * 480;
  const near = [];
  for (let i = 0; i <= 16; i++) {
    near.push([1700 - i * 120, 780 + nearY + (i % 2 === 0 ? 0 : 28) - par]);
  }
  near.push([-100, 1200], [1900, 1200]);
  if (banks > 0.02 && peel < 0.98) fillPaper(ctx, near, INK.nearBank);
}

function drawPacket(ctx, t) {
  let closed = 0;
  for (let i = 0; i < 8; i++) if (openAmt(i, t) < 0.08) closed++;
  if (closed <= 0 || t >= UNFOLD[7] + 0.45) return;
  const layers = Math.min(6, closed);
  const x = SHEET.x + 6;
  const y = SHEET.y + 8;
  for (let i = 0; i < layers; i++) {
    const tone = i === layers - 1 ? INK.red : (i % 2 ? INK.stack : INK.deep);
    const pts = wobble([
      [x + i * 4, y + i * 3],
      [x + 168 + i * 4, y + i * 3],
      [x + 168 + i * 4, y + SHEET.h - 16 + i * 3],
      [x + i * 4, y + SHEET.h - 16 + i * 3],
    ], 40 + i, 0.7);
    const holes = [];
    if (i === layers - 1 && t >= 4.55) holes.push(crescentPts(x + 84, y + 100, 36, 15, Math.PI * 0.18, Math.PI * 0.82, 12));
    else if (i === layers - 1 && t >= 4.15) holes.push(crescentPts(x + 70, y + 96, 16, 8, Math.PI * 0.25, Math.PI * 0.7, 8));
    drawPiece(ctx, { pts, holes, fill: tone, insetD: 4 });
  }
}

function drawFlap(ctx, t) {
  if (t > 1.32) return;
  const u = ss(seg(t, 0.0, 1.25));
  const theta = (1 - u) * 2.25;
  const hingeY = SHEET.y + 8;
  const x0 = SHEET.x + 10;
  const w = 160;
  const flapH = 190;
  const n = 16;
  const back = theta > Math.PI / 2;
  for (let k = 0; k < n; k++) {
    const dist = (1 - (k + 0.5) / n) * flapH;
    const c = Math.cos(theta);
    const grow = 1 + 0.28 * Math.abs(Math.sin(theta));
    const hh = (flapH / n) * Math.max(0.04, Math.abs(c));
    const ww = w * grow;
    const x = x0 - (ww - w) / 2;
    const y = hingeY - dist * c - hh;
    ctx.fillStyle = back ? INK.back : (Math.sin(theta) > 0.65 ? INK.stack : INK.red);
    ctx.fillRect(x, y, ww, hh + 0.8);
  }
  ctx.save();
  ctx.globalAlpha = 0.28 * Math.sin(Math.min(theta, Math.PI / 2));
  ctx.fillStyle = '#14060a';
  ctx.beginPath();
  ctx.ellipse(x0 + 80, hingeY + 8, 70, 10 + 16 * Math.sin(theta), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPanels(ctx, t) {
  for (let i = 0; i < 8; i++) {
    const o = openAmt(i, t);
    if (o <= 0.04) continue;
    const popT = UNFOLD[i] + 0.40;
    const pop = t >= popT && t < popT + 1 / 12;
    const cx = SHEET.x + i * PW + PW * 0.5;
    const cy = SHEET.y + SHEET.h * 0.5;
    if (o >= 0.97) {
      ctx.save();
      if (pop) {
        ctx.translate(cx, cy);
        ctx.scale(1.15, 1.15);
        ctx.translate(-cx, -cy);
      }
      drawPiece(ctx, { pts: panelPts(i), holes: [holePts(i)], fill: INK.red, insetD: 5 });
      ctx.restore();
      if (pop) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ffb080';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 48, 36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (i > 0 && openAmt(i - 1, t) > 0.95) {
        ctx.fillStyle = 'rgba(90,10,16,0.55)';
        ctx.fillRect(SHEET.x + i * PW - 1.2, SHEET.y + 8, 2.4, SHEET.h - 16);
      }
      continue;
    }
    const theta = (1 - o) * Math.PI;
    const hinge = SHEET.x + i * PW;
    const n = 12;
    const back = theta > Math.PI / 2;
    for (let k = 0; k < n; k++) {
      const uMid = (k + 0.5) / n;
      const c = Math.cos(theta);
      const d = uMid * PW;
      const xMid = hinge + d * c;
      const stripW = (PW / n) * Math.max(0.05, Math.abs(c));
      const grow = 1 + 0.28 * Math.abs(Math.sin(theta));
      const h = SHEET.h * grow;
      const y = SHEET.y - (h - SHEET.h) / 2;
      ctx.fillStyle = back ? INK.back : (Math.sin(theta) > 0.55 ? INK.stack : INK.red);
      ctx.fillRect(xMid - stripW * 0.5, y, stripW + 0.7, h);
    }
  }
}

function scrapState(i, t) {
  const t0 = 4.62 + i * 0.07;
  const land = [760 + i * 48, 812 + (i % 2) * 18];
  const star = [280 + i * 340, 70];
  if (t < t0) return null;
  const fall = 0.85 + i * 0.04;
  if (t < t0 + fall) {
    const u = (t - t0) / fall;
    return {
      x: lerp(560, land[0], u) + Math.sin(u * 9 + i) * 10,
      y: lerp(600, land[1], u) + Math.sin(u * Math.PI) * -70,
      rot: u * (2 + i),
      mode: 'fall',
    };
  }
  if (i === 0) {
    if (t < 18.9) return { x: land[0], y: land[1], rot: 0.4, mode: 'wait' };
    return null;
  }
  if (t < 18.2) return { x: land[0], y: land[1], rot: 0.3 * i, mode: 'wait' };
  const u = eo(seg(t, 18.2, 21.2));
  return {
    x: lerp(land[0], star[0], u),
    y: lerp(land[1], star[1], u),
    rot: lerp(0.3 * i, 0, u),
    mode: 'star',
  };
}

function drawScrapShape(ctx, i, x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (i === 0) {
    drawPiece(ctx, {
      pts: crescentPts(0, 0, 34, 16, Math.PI * 0.15, Math.PI * 0.85, 12),
      fill: INK.red, inset: false, shadow: true,
    });
  } else {
    const tri = wobble([[0, -22], [18, 16], [-16, 14]], 50 + i, 0.8);
    drawPiece(ctx, { pts: tri, fill: i === 2 ? INK.near : INK.stack, inset: false });
  }
  ctx.restore();
}

function drawScraps(ctx, t) {
  for (let i = 0; i < 4; i++) {
    if (i === 0 && t >= 18.9) continue;
    const s = scrapState(i, t);
    if (!s) continue;
    drawScrapShape(ctx, i, s.x, s.y, s.rot);
  }
}

function boatPose(t) {
  if (t < 18.2) return null;
  const join = eo(seg(t, 18.2, 18.9));
  const hull0 = scrapState(0, Math.min(t, 18.19));
  const start = hull0 ? [hull0.x, hull0.y] : [760, 812];
  let x;
  let y;
  if (t < 26.15) {
    const u = eo(seg(t, 18.9, 26.0));
    const f = u * 7;
    const i = Math.min(6, Math.floor(f));
    const g = f - i;
    const a = holeCenter(i);
    const b = holeCenter(i + 1);
    x = lerp(start[0], lerp(a[0], b[0], g), Math.max(join, u));
    y = lerp(start[1], lerp(a[1], b[1], g) + 28, Math.max(join, u));
    if (t < 18.9) {
      x = lerp(start[0], holeCenter(0)[0], join * 0.35);
      y = lerp(start[1], holeCenter(0)[1] + 28, join * 0.35);
    }
  } else if (t < 34.6) {
    const last = holeCenter(7);
    x = last[0];
    y = last[1] + 28;
  } else {
    const u = eo(seg(t, 34.8, 39.1));
    const f = u * 7;
    const i = Math.min(6, Math.floor(f));
    const g = f - i;
    const a = poolPos(i, t);
    const b = poolPos(i + 1, t);
    x = lerp(a[0], b[0], g);
    y = lerp(a[1], b[1], g);
  }
  return { x, y, sail: join };
}

function drawBoat(ctx, t) {
  const b = boatPose(t);
  if (!b) return;
  ctx.save();
  ctx.translate(b.x, b.y);
  drawPiece(ctx, {
    pts: wobble([[-46, 4], [48, 2], [40, 22], [-40, 24]], 59, 0.7),
    fill: INK.deep, inset: false,
  });
  drawPiece(ctx, {
    pts: crescentPts(0, 0, 40, 16, Math.PI * 0.12, Math.PI * 0.88, 12),
    fill: INK.red, inset: false,
  });
  if (b.sail > 0.02) {
    const mast = wobble([[-2, 6], [2, 6], [2, -36], [-2, -36]], 60, 0.4);
    drawPiece(ctx, { pts: mast, fill: INK.deep, inset: false, shadow: false });
    const sail = wobble([[3, -34], [3 + 28 * b.sail, -6], [3, 4]], 61, 0.6);
    drawPiece(ctx, { pts: sail, fill: INK.near, inset: false });
  }
  ctx.restore();
}

function bladeOpen(t) {
  const q = q12(t);
  if (q >= 4.15 && q < 4.28) return 0.02;
  if (q >= 4.55 && q < 4.68) return 0.02;
  if (q < 2.2) return 0.15;
  if (q > 5.6) return 0.06;
  return 0.46;
}

function scissorXf(t) {
  if (t < 5.9) {
    const h = handTarget(t);
    const u = ss(seg(t, 2.05, 4.55));
    return { x: h[0] + 28 + u * 36, y: h[1] - 6, rot: -0.08 };
  }
  const u = eo(seg(t, 5.9, 6.8));
  return { x: lerp(560, 720, u), y: lerp(650, 820, u), rot: lerp(-0.08, 0.55, u) };
}

function drawScissors(ctx, t) {
  if (t > 29) return;
  const p = scissorXf(t);
  const open = bladeOpen(t);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  for (const side of [-1, 1]) {
    const a = side * (0.06 + open * 0.55);
    ctx.save();
    ctx.rotate(a);
    const pts = wobble([
      [-8, -5],
      [78, -3.5],
      [86, 0],
      [78, 3.5],
      [-8, 5],
    ], 70 + side, 0.45);
    drawPiece(ctx, {
      pts,
      holes: [ellipsePts(-2, 0, 3.2, 3.2, 8)],
      fill: INK.blade,
      inset: false,
    });
    ctx.restore();
  }
  ctx.restore();
}

function drawLamp(ctx, t) {
  if (t < 29.4) return;
  const pop = t < 29.4 + 1 / 12 ? 1.15 : 1;
  const xf = sheetXf(t);
  const cx = SHEET.x + SHEET.w * 0.5 + xf.dx;
  const cy = SHEET.y + SHEET.h * 0.42 + xf.dy;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pop, pop);
  drawPiece(ctx, { pts: ellipsePts(0, 92, 18, 36, 10), fill: INK.goldDeep, inset: false });
  drawPiece(ctx, { pts: ellipsePts(0, 0, 150, 150, 32), fill: INK.gold, insetD: 8 });
  drawPiece(ctx, {
    pts: crescentPts(-16, -18, 34, 12, Math.PI * 1.15, Math.PI * 1.85, 10),
    fill: INK.foil, inset: false, shadow: false,
  });
  ctx.restore();
}

function poolPos(i, t) {
  const [x] = holeCenter(i);
  const xf = sheetXf(t);
  const cx = SHEET.x + SHEET.w * 0.5;
  return [cx + (x - cx) * xf.sc + xf.dx, SHEET.y + SHEET.h + 86 + xf.dy * 0.12];
}

function drawProjection(ctx, t) {
  if (t < 33.4) return;
  const a = eo(seg(t, 33.4, 34.5));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) {
    const [px, py] = poolPos(i, t);
    ctx.globalAlpha = 0.5 * a;
    ctx.fillStyle = '#ffd7a1';
    ctx.beginPath();
    ctx.ellipse(px, py, 36, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function bannerPts(x, y, w, h) {
  const pts = [];
  const tail = 22;
  pts.push([x + tail, y]);
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const px = x + tail + ((w - tail * 2) * i) / n;
    pts.push([px, y + (i % 2 === 0 ? 0 : 8)]);
  }
  pts.push([x + w, y + h * 0.5]);
  pts.push([x + w - tail, y + h]);
  for (let i = n; i >= 0; i--) {
    const px = x + tail + ((w - tail * 2) * i) / n;
    pts.push([px, y + h - (i % 2 === 0 ? 0 : 8)]);
  }
  pts.push([x, y + h * 0.5]);
  return pts;
}

function drawBanner(ctx, cue, t) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = '600 44px "Cormorant Garamond", serif';
  const tw = ctx.measureText(cue.text).width;
  const w = Math.min(1480, tw + 120);
  const h = 78;
  const x = (1920 - w) / 2;
  const y = 968;
  const steps = Math.floor((t - cue.t0) * 12);
  const sy = steps <= 0 ? 0.62 : 1;
  ctx.translate(960, y + h / 2);
  ctx.scale(1, sy);
  ctx.translate(-960, -(y + h / 2));
  drawPiece(ctx, { pts: bannerPts(x, y, w, h), fill: INK.banner, inset: false, blur: 8 });
  ctx.fillStyle = INK.cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cue.text, 960, y + h / 2 + 2);
  ctx.restore();
}

function drawTitle(ctx, t) {
  if (t < 34.7) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (t >= 34.7) {
    const strip = (y) => {
      const pts = [];
      for (let i = 0; i <= 28; i++) pts.push([300 + i * 47, y + (i % 2 === 0 ? 0 : 12)]);
      pts.push([1616, y + 22], [300, y + 22]);
      return pts;
    };
    drawPiece(ctx, { pts: strip(86), fill: INK.red, inset: false, shadow: false });
    drawPiece(ctx, { pts: strip(214), fill: INK.red, inset: false, shadow: false });
  }
  ctx.font = '500 108px "Cormorant Garamond", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const word = 'EIGHTH FOLD';
  let pen = 430;
  let li = 0;
  for (const ch of word) {
    const w = ctx.measureText(ch).width;
    if (ch !== ' ') {
      const appear = 34.90 + li * (1 / 12);
      if (t >= appear) {
        const pop = t < appear + 1 / 12 ? 1.15 : 1;
        ctx.save();
        ctx.translate(pen + w / 2, 168);
        ctx.scale(pop, pop);
        ctx.translate(-(pen + w / 2), -168);
        ctx.fillStyle = INK.red;
        ctx.fillText(ch, pen, 112);
        ctx.restore();
      }
      li++;
    }
    pen += w + 6;
  }
  if (t >= 35.75) {
    const pop = t < 35.75 + 1 / 12 ? 1.15 : 1;
    ctx.save();
    ctx.translate(1560, 150);
    ctx.scale(pop, pop);
    const seal = wobble([[-28, -32], [30, -30], [32, 30], [-30, 32]], 80, 0.8);
    const plum = [];
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k / 5) * Math.PI * 2;
      plum.push(crescentPts(Math.cos(a) * 12, Math.sin(a) * 12, 7, 3, a - 1.1, a + 1.1, 6));
    }
    plum.push(ellipsePts(0, 0, 3.2, 3.2, 8));
    drawPiece(ctx, { pts: seal, holes: plum, fill: INK.deep, inset: false });
    ctx.restore();
  }
  ctx.restore();
}

let bloomCanvas = null;

function drawBloom(ctx, t) {
  if (t < 32.6) return;
  if (!bloomCanvas) {
    bloomCanvas = document.createElement('canvas');
    bloomCanvas.width = 960;
    bloomCanvas.height = 540;
  }
  const a = 0.20 * eo(seg(t, 32.6, 34.2));
  const bx = bloomCanvas.getContext('2d');
  bx.setTransform(1, 0, 0, 1, 0, 0);
  bx.clearRect(0, 0, 960, 540);
  bx.filter = 'blur(8px)';
  bx.drawImage(ctx.canvas, 0, 0, 960, 540);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a;
  ctx.drawImage(bloomCanvas, 0, 0, 1920, 1080);
  bx.clearRect(0, 0, 960, 540);
  bx.filter = 'blur(20px)';
  bx.drawImage(ctx.canvas, 0, 0, 960, 540);
  ctx.globalAlpha = a * 0.55;
  ctx.drawImage(bloomCanvas, 0, 0, 1920, 1080);
  ctx.restore();
}

function renderFilm(ctx, t, cues) {
  const cam = camera(t);
  const [sx, sy] = shake(t);
  const xf = sheetXf(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, 1920, 1080);
  ctx.fillStyle = INK.water;
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.setTransform(cam.s, 0, 0, cam.s, 960 - cam.x * cam.s + sx, 540 - cam.y * cam.s + sy);
  drawGround(ctx, t, cam.x);
  if (t >= 29.4) drawLamp(ctx, t);
  ctx.save();
  const cx = SHEET.x + SHEET.w * 0.5;
  const cy = SHEET.y + SHEET.h * 0.5;
  ctx.translate(cx + xf.dx, cy + xf.dy);
  ctx.scale(xf.sc, xf.sc);
  ctx.translate(-cx, -cy);
  drawPacket(ctx, t);
  drawFlap(ctx, t);
  if (t >= UNFOLD[0] - 0.02) drawPanels(ctx, t);
  ctx.restore();
  drawScraps(ctx, t);
  drawBoat(ctx, t);
  drawKeeper(ctx, t);
  if (t < 17.8 || t > 28) drawScissors(ctx, t);
  drawProjection(ctx, t);
  drawBloom(ctx, t);
  for (const cue of cues) {
    if (t >= cue.t0 && t < cue.t1) drawBanner(ctx, cue, t);
  }
  drawTitle(ctx, t);
}

function renderSheet(ctx) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = INK.water;
  ctx.fillRect(0, 0, 1920, 1080);
  const poses = [
    { t: 3.2, x: 280 },
    { t: 10.4, x: 760 },
    { t: 20, x: 1240 },
  ];
  for (const p of poses) {
    ctx.save();
    ctx.translate(p.x - HIP.x, 180);
    drawKeeper(ctx, p.t);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(200, 620);
  drawPacket(ctx, 5);
  ctx.restore();
  ctx.font = '600 28px "Cormorant Garamond", serif';
  ctx.fillStyle = INK.cream;
  ctx.fillText('determined', 180, 80);
  ctx.fillText('surprise', 660, 80);
  ctx.fillText('smile', 1180, 80);
}

export async function boot(canvas) {
  initPaper();
  const cues = await fetch('./cues.json').then((r) => {
    if (!r.ok) throw new Error('cues.json missing');
    return r.json();
  });
  await document.fonts.load('600 44px "Cormorant Garamond"');
  await document.fonts.load('500 108px "Cormorant Garamond"');
  const test = new URLSearchParams(location.search).get('test');
  const ctx = canvas.getContext('2d');
  window.DUR = DUR;
  window.EV = EV;
  window.TEXTS = (t) => {
    if (test === 'sheet') return [];
    const out = [];
    for (const c of cues) {
      if (t >= c.t0 && t < c.t1) {
        out.push({ id: c.id, text: c.text, x0: 280, y0: 960, x1: 1640, y1: 1055 });
      }
    }
    if (t >= 35.60 && t <= 40) {
      out.push({ id: 'title', text: 'EIGHTH FOLD', x0: 400, y0: 100, x1: 1520, y1: 250 });
    }
    return out;
  };
  window.render = (t) => {
    if (test === 'sheet') renderSheet(ctx);
    else renderFilm(ctx, t, cues);
  };
  window.READY = true;
}
