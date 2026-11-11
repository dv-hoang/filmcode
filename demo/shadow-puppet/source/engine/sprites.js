import { mulberry } from '/core/lib.js';

export const DYE = {
  indigo: '#8ea4e4',
  jade: '#4ec890',
  ochre: '#f2b45a',
  vermilion: '#ee6844',
  raw: '#f6e2c0',
  ink: '#24180f',
};

let HIDE = null;

function makeHide() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const rng = mulberry(11);
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(70, 40, 18, 0.16)';
  g.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const y = rng() * 256;
    g.beginPath();
    g.moveTo(0, y);
    g.bezierCurveTo(80, y + (rng() - 0.5) * 16, 170, y + (rng() - 0.5) * 16, 256, y + (rng() - 0.5) * 8);
    g.stroke();
  }
  for (let i = 0; i < 1600; i++) {
    const x = rng() * 256;
    const y = rng() * 256;
    const a = 0.04 + rng() * 0.14;
    g.fillStyle = `rgba(55, 32, 16, ${a})`;
    g.fillRect(x, y, 1 + rng() * 2.2, 1 + rng() * 2.6);
  }
  return c;
}

function piece(w, h, dye, ax, ay, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.lineWidth = 2.4;
  g.strokeStyle = '#140e0a';
  g.fillStyle = dye;
  draw(g, w, h, dye);
  const snap = document.createElement('canvas');
  snap.width = w;
  snap.height = h;
  snap.getContext('2d').drawImage(c, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = g.createPattern(HIDE, 'repeat');
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(snap, 0, 0);
  return { canvas: c, ax, ay, w, h };
}

function crescents(g, x, y, n, gap, r, rot) {
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  for (let i = 0; i < n; i++) {
    g.beginPath();
    g.arc(x + i * gap, y, r, rot, rot + Math.PI);
    g.arc(x + i * gap, y, r * 0.46, rot + Math.PI, rot, true);
    g.fill();
  }
  g.restore();
}

function diamonds(g, x, y, cols, rows, s) {
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cx = x + i * s + (j % 2) * s * 0.5;
      const cy = y + j * s * 0.58;
      g.beginPath();
      g.moveTo(cx, cy - s * 0.26);
      g.lineTo(cx + s * 0.2, cy);
      g.lineTo(cx, cy + s * 0.26);
      g.lineTo(cx - s * 0.2, cy);
      g.closePath();
      g.fill();
    }
  }
  g.restore();
}

function slits(g, x, y, n, len, gap) {
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  for (let i = 0; i < n; i++) {
    const yy = y + i * gap;
    g.beginPath();
    g.moveTo(x, yy);
    g.lineTo(x + len, yy + 1.5);
    g.lineTo(x + len * 0.2, yy + 5);
    g.closePath();
    g.fill();
  }
  g.restore();
}

function coins(g, dye, pts, r) {
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  for (const [x, y] of pts) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  g.fillStyle = dye;
  for (const [x, y] of pts) g.fillRect(x - r * 0.36, y - r * 0.36, r * 0.72, r * 0.72);
}

function openFace(g, dye, cx, cy, rx, ry) {
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.save();
  g.strokeStyle = dye;
  g.fillStyle = dye;
  g.lineWidth = 3.2;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(cx + rx * 0.15, cy - ry * 0.08, Math.max(6, rx * 0.28), 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(cx - rx * 0.1, cy - ry * 0.55);
  g.quadraticCurveTo(cx + rx * 0.35, cy - ry * 0.85, cx + rx * 0.7, cy - ry * 0.35);
  g.stroke();
  g.lineWidth = 3.4;
  g.beginPath();
  g.moveTo(cx + rx * 0.15, cy - ry * 0.05);
  g.lineTo(cx + rx * 0.95, cy + ry * 0.18);
  g.lineTo(cx + rx * 0.2, cy + ry * 0.32);
  g.stroke();
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx + rx * 0.05, cy + ry * 0.48);
  g.quadraticCurveTo(cx + rx * 0.45, cy + ry * 0.68, cx + rx * 0.75, cy + ry * 0.42);
  g.stroke();
  g.restore();
}

function drawFerrymanHead(g, w, h, dye) {
  g.beginPath();
  g.moveTo(74, 186);
  g.lineTo(114, 186);
  g.lineTo(108, 162);
  g.lineTo(80, 162);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(80, 162);
  g.quadraticCurveTo(46, 156, 44, 122);
  g.quadraticCurveTo(42, 78, 88, 64);
  g.quadraticCurveTo(122, 52, 136, 74);
  g.lineTo(142, 90);
  g.quadraticCurveTo(148, 102, 174, 112);
  g.quadraticCurveTo(156, 118, 150, 126);
  g.lineTo(162, 132);
  g.quadraticCurveTo(150, 140, 140, 150);
  g.quadraticCurveTo(122, 166, 108, 162);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(18, 108);
  g.quadraticCurveTo(96, 78, 186, 100);
  g.lineTo(176, 116);
  g.quadraticCurveTo(96, 96, 28, 126);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(52, 104);
  g.quadraticCurveTo(78, 30, 118, 38);
  g.quadraticCurveTo(158, 48, 164, 96);
  g.quadraticCurveTo(118, 80, 52, 104);
  g.closePath();
  g.fill();
  g.stroke();
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  g.beginPath();
  g.ellipse(128, 108, 7, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.strokeStyle = dye;
  g.fillStyle = dye;
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(128, 108, 8, 9, 0, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(114, 92);
  g.quadraticCurveTo(128, 82, 148, 94);
  g.stroke();
  g.beginPath();
  g.moveTo(148, 124);
  g.quadraticCurveTo(160, 130, 168, 124);
  g.stroke();
  slits(g, 72, 52, 3, 30, 9);
  crescents(g, 36, 100, 3, 18, 5, 0.2);
  void w;
  void h;
}

function drawChildHead(g, w, h, dye) {
  g.beginPath();
  g.moveTo(56, 154);
  g.lineTo(90, 154);
  g.lineTo(86, 136);
  g.lineTo(60, 136);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(60, 136);
  g.quadraticCurveTo(32, 130, 32, 104);
  g.quadraticCurveTo(30, 74, 66, 64);
  g.quadraticCurveTo(96, 54, 112, 72);
  g.lineTo(118, 88);
  g.quadraticCurveTo(122, 98, 140, 104);
  g.quadraticCurveTo(126, 110, 120, 118);
  g.lineTo(128, 124);
  g.quadraticCurveTo(112, 136, 96, 136);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(38, 100);
  g.quadraticCurveTo(74, 40, 122, 76);
  g.quadraticCurveTo(100, 96, 46, 110);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(112, 46, 10, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  g.beginPath();
  g.ellipse(104, 98, 6.5, 7.5, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.strokeStyle = dye;
  g.lineWidth = 2.6;
  g.beginPath();
  g.ellipse(104, 98, 6.5, 7.5, 0, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(92, 84);
  g.quadraticCurveTo(104, 76, 120, 88);
  g.stroke();
  slits(g, 52, 58, 2, 20, 8);
  void w;
  void h;
  void dye;
}

function drawTorso(g, w, h) {
  g.beginPath();
  g.moveTo(34, 6);
  g.quadraticCurveTo(10, 36, 20, h - 4);
  g.lineTo(w - 20, h - 4);
  g.quadraticCurveTo(w - 10, 36, w - 34, 6);
  g.closePath();
  g.fill();
  g.stroke();
  crescents(g, 32, 28, 3, 22, 6, Math.PI);
  diamonds(g, 36, 52, 3, 2, 24);
}

function drawRobe(g, w, h) {
  g.beginPath();
  g.moveTo(74, 4);
  g.quadraticCurveTo(12, 36, 16, h - 4);
  g.lineTo(w - 16, h - 4);
  g.quadraticCurveTo(w - 12, 36, w - 74, 4);
  g.closePath();
  g.fill();
  g.stroke();
  diamonds(g, 34, 28, 5, 2, 26);
  crescents(g, 30, h - 40, 6, 26, 7, 0.25);
  g.beginPath();
  g.moveTo(24, h - 16);
  g.quadraticCurveTo(w / 2, h - 4, w - 24, h - 16);
  g.stroke();
}

function drawCollar(g, w, h) {
  g.beginPath();
  g.moveTo(8, h - 6);
  g.quadraticCurveTo(w * 0.5, 0, w - 8, h - 6);
  g.quadraticCurveTo(w * 0.5, h * 0.55, 8, h - 6);
  g.closePath();
  g.fill();
  g.stroke();
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.arc(22 + i * 26, 20, 7, Math.PI, 0, true);
    g.closePath();
    g.fill();
  }
  g.restore();
}

function drawArm(g, w, h) {
  const cx = w / 2;
  g.beginPath();
  g.moveTo(cx - 9, 10);
  g.quadraticCurveTo(cx - 13, h * 0.5, cx - 7, h - 6);
  g.lineTo(cx + 7, h - 6);
  g.quadraticCurveTo(cx + 13, h * 0.5, cx + 9, 10);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(cx, 9, 8, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  crescents(g, cx - 8, 28, 2, 14, 4, 0.6);
}

function drawTassel(g, w, h, dye) {
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(w / 2, 4);
  g.lineTo(w / 2, h - 28);
  g.stroke();
  g.beginPath();
  g.moveTo(w / 2, h - 30);
  g.quadraticCurveTo(4, h - 8, w / 2, h - 2);
  g.quadraticCurveTo(w - 4, h - 8, w / 2, h - 30);
  g.fill();
  g.stroke();
  diamonds(g, 8, 18, 1, 4, 16);
  void dye;
}

function drawLantern(g, w, h, dye) {
  const cx = w / 2;
  g.fillRect(cx - 3, 0, 6, 16);
  g.strokeRect(cx - 3, 0, 6, 16);
  g.beginPath();
  g.moveTo(cx - 16, 18);
  g.lineTo(cx + 16, 18);
  g.lineTo(cx + 12, 26);
  g.lineTo(cx - 12, 26);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(cx, 50, 22, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(cx - 14, 70);
  g.lineTo(cx + 14, 70);
  g.lineTo(cx + 8, h - 4);
  g.lineTo(cx - 8, h - 4);
  g.closePath();
  g.fill();
  g.stroke();
  const pts = [];
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) pts.push([cx - 12 + i * 12, 38 + j * 12]);
  }
  coins(g, dye, pts, 4.5);
}

function drawPole(g, w, h) {
  g.beginPath();
  g.moveTo(w / 2 - 5, 8);
  g.lineTo(w / 2 + 5, 8);
  g.lineTo(w / 2 + 3, h - 4);
  g.lineTo(w / 2 - 3, h - 4);
  g.closePath();
  g.fill();
  g.stroke();
  slits(g, 4, 30, 8, w - 8, 28);
}

function drawJoint(g, w, h) {
  g.beginPath();
  g.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
  g.fill();
  g.stroke();
}

function drawWater(g, w, h, dye, phase) {
  g.beginPath();
  g.moveTo(0, 46);
  for (let x = 0; x <= w; x += 16) {
    g.lineTo(x, 46 + Math.sin(x * 0.02 + phase) * 12);
  }
  g.lineTo(w, h);
  g.lineTo(0, h);
  g.closePath();
  g.fill();
  g.stroke();
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  const n = 12;
  for (let i = 0; i < n; i++) {
    const x = 36 + i * ((w - 72) / n);
    const y = 100 + Math.sin(phase + i * 0.7) * 10;
    g.beginPath();
    g.arc(x, y, 18, phase * 0.3, phase * 0.3 + Math.PI);
    g.arc(x, y, 8, phase * 0.3 + Math.PI, phase * 0.3, true);
    g.fill();
  }
  g.restore();
  void dye;
}

function drawBank(g, w, h) {
  g.beginPath();
  g.moveTo(0, 40);
  g.lineTo(w, 26);
  g.lineTo(w, h);
  g.lineTo(0, h);
  g.closePath();
  g.fill();
  g.stroke();
  slits(g, 30, 58, 4, w - 70, 16);
  diamonds(g, 40, 120, 12, 1, 36);
}

function drawReed(g, w, h) {
  for (let i = 0; i < 6; i++) {
    const x = 16 + i * 24;
    const lean = (i % 2 ? 10 : -8);
    g.beginPath();
    g.moveTo(x, h);
    g.quadraticCurveTo(x + lean, h * 0.45, x + lean * 0.4, 18 + (i % 3) * 14);
    g.quadraticCurveTo(x + lean * 0.2 + 8, h * 0.5, x + 12, h);
    g.closePath();
    g.fill();
    g.stroke();
  }
  slits(g, 20, 40, 5, 28, 22);
}

function drawWillow(g, w, h) {
  g.beginPath();
  g.moveTo(w * 0.46, h - 2);
  g.quadraticCurveTo(w * 0.4, h * 0.62, w * 0.48, h * 0.46);
  g.lineTo(w * 0.56, h * 0.46);
  g.quadraticCurveTo(w * 0.64, h * 0.62, w * 0.54, h - 2);
  g.closePath();
  g.fill();
  g.stroke();
  for (let i = 0; i < 9; i++) {
    const x0 = w * (0.16 + i * 0.085);
    const drop = h * (0.72 + (i % 3) * 0.07);
    const lean = i % 2 ? 16 : -12;
    g.beginPath();
    g.moveTo(x0, h * 0.4);
    g.quadraticCurveTo(x0 + lean * 0.4, h * 0.58, x0 + lean, drop);
    g.lineTo(x0 + lean + 8, drop);
    g.quadraticCurveTo(x0 + lean * 0.4 + 10, h * 0.56, x0 + 10, h * 0.4);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  for (let i = 0; i < 9; i++) {
    const x = w * (0.2 + (i % 9) * 0.08);
    const y = h * (0.5 + (i % 4) * 0.08);
    g.beginPath();
    g.ellipse(x, y, 7, 14, (i - 4) * 0.18, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

function drawBoat(g, w, h, dye) {
  g.beginPath();
  g.moveTo(16, 36);
  g.quadraticCurveTo(40, h - 6, w / 2, h - 2);
  g.quadraticCurveTo(w - 40, h - 6, w - 16, 36);
  g.quadraticCurveTo(w / 2, 8, 16, 36);
  g.closePath();
  g.fill();
  g.stroke();
  const pts = [];
  for (let i = 0; i < 6; i++) pts.push([48 + i * 42, 58]);
  coins(g, dye, pts, 8);
  crescents(g, 40, 78, 7, 36, 7, 0.4);
}

function drawFlame(g, w, h, variant) {
  const lean = variant === 1 ? -8 : variant === 2 ? 7 : 0;
  g.beginPath();
  g.moveTo(w * 0.5, h - 8);
  g.bezierCurveTo(w * 0.18, h * 0.62, w * 0.22 + lean, h * 0.28, w * 0.5 + lean * 0.4, 16);
  g.bezierCurveTo(w * 0.78 + lean, h * 0.28, w * 0.82, h * 0.62, w * 0.5, h - 8);
  g.closePath();
  g.fill();
  g.stroke();
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  g.beginPath();
  g.moveTo(w * 0.5, h * 0.72);
  g.bezierCurveTo(w * 0.34, h * 0.5, w * 0.4 + lean * 0.3, h * 0.3, w * 0.5 + lean * 0.15, h * 0.22);
  g.bezierCurveTo(w * 0.62, h * 0.32, w * 0.64, h * 0.52, w * 0.5, h * 0.72);
  g.fill();
  g.restore();
}

function drawSmoke(g, w, h) {
  const rad = g.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
  rad.addColorStop(0, 'rgba(28, 16, 12, 0.72)');
  rad.addColorStop(1, 'rgba(28, 16, 12, 0)');
  g.fillStyle = rad;
  g.beginPath();
  g.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
  g.fill();
}

function drawTitle(g, w, h, dye) {
  g.fillRect(0, 0, w, h);
  g.strokeRect(8, 8, w - 16, h - 16);
  diamonds(g, 18, 18, 8, 1, 22);
  diamonds(g, 18, h - 36, 8, 1, 22);
  g.fillStyle = '#000';
  g.globalCompositeOperation = 'destination-out';
  g.font = "600 72px 'Cormorant Garamond'";
  g.letterSpacing = '0.14em';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 72;
  while (g.measureText('ONE LAMP').width > w - 90 && size > 48) {
    size -= 2;
    g.font = `600 ${size}px 'Cormorant Garamond'`;
  }
  g.fillText('ONE LAMP', w / 2, h / 2 + 4);
  void dye;
}

export function blit(ctx, spr, x, y, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.drawImage(spr.canvas, -spr.ax, -spr.ay);
  ctx.restore();
}

export function buildSprites() {
  HIDE = makeHide();
  const armU = piece(34, 64, DYE.ochre, 17, 8, drawArm);
  const armF = piece(30, 58, DYE.ochre, 15, 8, drawArm);
  return {
    headA: piece(200, 200, DYE.raw, 96, 186, drawFerrymanHead),
    headB: piece(156, 170, DYE.raw, 74, 154, drawChildHead),
    torsoA: piece(140, 124, DYE.indigo, 70, 6, drawTorso),
    torsoB: piece(140, 124, DYE.jade, 70, 6, drawTorso),
    robeA: piece(210, 158, DYE.indigo, 105, 4, drawRobe),
    robeB: piece(210, 158, DYE.jade, 105, 4, drawRobe),
    collar: piece(160, 52, DYE.ochre, 80, 40, drawCollar),
    armU,
    armF,
    tassel: piece(22, 78, DYE.vermilion, 11, 4, drawTassel),
    lantern: piece(64, 96, DYE.ochre, 32, 2, drawLantern),
    pole: piece(22, 360, DYE.ink, 11, 8, drawPole),
    joint: piece(36, 36, DYE.ochre, 18, 18, drawJoint),
    water: [0, 1, 2].map((i) => piece(980, 240, DYE.indigo, 0, 0, (g, w, h, dye) => drawWater(g, w, h, dye, i * 1.3))),
    bank: piece(860, 200, DYE.ochre, 0, 0, drawBank),
    reed: piece(170, 240, DYE.jade, 85, 230, drawReed),
    willow: piece(300, 460, DYE.indigo, 160, 440, drawWillow),
    boat: piece(360, 110, DYE.raw, 180, 70, drawBoat),
    flame: [0, 1, 2].map((i) => piece(120, 160, DYE.vermilion, 60, 150, (g, w, h) => drawFlame(g, w, h, i))),
    smoke: (() => {
      const c = document.createElement('canvas');
      c.width = 180;
      c.height = 180;
      drawSmoke(c.getContext('2d'), 180, 180);
      return { canvas: c, ax: 90, ay: 90, w: 180, h: 180 };
    })(),
    title: piece(560, 148, DYE.ink, 280, 74, drawTitle),
  };
}
