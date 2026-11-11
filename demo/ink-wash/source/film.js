const W = 1920, H = 1080;
const INK = '#1b1713', RED = '#b02e22', PAPER = '#f2ecde';
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const pr = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const hash = (a) => { const x = Math.sin(a * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function makePaper() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  const im = g.getImageData(0, 0, W, H);
  let s = 1234567;
  for (let i = 0; i < im.data.length; i += 4) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const v = ((s >>> 24) - 128) / 128 * 8;
    im.data[i] += v; im.data[i + 1] += v * 0.9; im.data[i + 2] += v * 0.7;
  }
  g.putImageData(im, 0, 0);
  g.globalAlpha = 0.18;
  for (let i = 0; i < 1100; i++) {
    const x = hash(i) * W, y = hash(i + 3) * H, len = 8 + hash(i + 9) * 54;
    g.strokeStyle = i % 2 ? '#a89778' : '#fffaf0';
    g.lineWidth = 0.5 + hash(i + 2) * 0.8;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (hash(i + 5) - 0.5) * 1.6); g.stroke();
  }
  return c;
}
const paper = makePaper();

function resample(pts, step = 5) {
  const out = []; let total = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) { out.push({ x: pts[0][0], y: pts[0][1], s: 0 }); continue; }
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const d = Math.hypot(bx - ax, by - ay); if (d < 0.001) continue;
    for (let p = 0; p <= d; p += step) {
      out.push({ x: ax + (bx - ax) * p / d, y: ay + (by - ay) * p / d, s: total + p });
    }
    total += d;
  }
  return { p: out, total };
}

function stroke(pts, o = {}) {
  const R = resample(pts, o.step || 5); if (R.p.length < 2) return;
  const lim = R.total * (o.draw ?? 1); if (lim <= 0) return;
  const w = o.w ?? 20, alpha = o.alpha ?? 0.7, seed = o.seed ?? 1;
  const k = o.bristles ?? 7, dry = o.dry ?? 0;
  const L = [], Rt = [];
  for (let i = 0; i < R.p.length; i++) {
    const q = R.p[i]; if (q.s > lim) break;
    const a = R.p[Math.max(0, i - 1)], b = R.p[Math.min(R.p.length - 1, i + 1)];
    let nx = -(b.y - a.y), ny = b.x - a.x; const nn = Math.hypot(nx, ny) || 1; nx /= nn; ny /= nn;
    const u = q.s / R.total;
    const taper = Math.min(1, q.s / 16, Math.max(0, (lim - q.s) / 16));
    const wd = w * (0.6 + 0.4 * Math.pow(Math.sin(Math.PI * u), 0.35)) * (0.82 + 0.3 * hash(seed + i * 0.13)) * (0.25 + 0.75 * taper);
    L.push([q.x + nx * wd * 0.5, q.y + ny * wd * 0.5]);
    Rt.push([q.x - nx * wd * 0.5, q.y - ny * wd * 0.5]);
  }
  if (L.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha; ctx.fillStyle = INK;
  ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
  for (const q of L) ctx.lineTo(q[0], q[1]);
  for (let i = Rt.length - 1; i >= 0; i--) ctx.lineTo(Rt[i][0], Rt[i][1]);
  ctx.closePath(); ctx.fill();
  // loaded edge
  ctx.globalAlpha = alpha * 0.55; ctx.lineWidth = 1.4; ctx.strokeStyle = INK;
  ctx.beginPath(); for (const q of Rt) ctx.lineTo(q[0], q[1]); ctx.stroke();
  // bristle tracks
  for (let b = 0; b < k; b++) {
    ctx.beginPath(); let open = false;
    for (let i = 0; i < L.length; i++) {
      if (hash(seed * 7 + b * 13.7 + i * 0.21) < dry * 0.42) { open = false; continue; }
      const t = (b / Math.max(1, k - 1) - 0.5) * 0.9;
      const x = L[i][0] + (Rt[i][0] - L[i][0]) * (0.5 + t), y = L[i][1] + (Rt[i][1] - L[i][1]) * (0.5 + t);
      if (!open) { ctx.moveTo(x, y); open = true; } else ctx.lineTo(x, y);
    }
    ctx.globalAlpha = alpha * (0.18 + 0.22 * hash(seed + b)); ctx.lineWidth = 0.8 + hash(seed + b * 2) * 1.2; ctx.stroke();
  }
  ctx.restore();
}

function wash(poly, alpha, blur = 8) {
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.globalAlpha = alpha; ctx.fillStyle = INK;
  ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function mark(x1, y1, x2, y2, w = 1, alpha = 0.2) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = INK; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

const far = [[-40, 568], [160, 480], [330, 522], [500, 458], [700, 522], [900, 470], [1120, 532], [1350, 480], [1600, 542], [1800, 490], [1960, 552], [1960, 780], [-40, 780]];
const near = [[-20, 724], [100, 642], [260, 664], [400, 602], [540, 674], [460, 786], [180, 824], [-20, 784]];

function landscape(t) {
  wash(far, 0.075 * pr(t, 0.3, 1.8), 10);
  stroke(far.slice(0, 11), { w: 11, alpha: 0.25 * pr(t, 0.5, 1.8), seed: 2, dry: 0.25, bristles: 5 });
  wash(near, 0.16 * pr(t, 1.0, 2.6), 8);
  stroke(near.slice(0, 8), { w: 17, alpha: 0.48 * pr(t, 1.2, 2.8), seed: 3, dry: 0.1, bristles: 9 });
  // axe-cut texture on the near rock
  for (let i = 0; i < 18; i++) {
    const x = 60 + i * 23, y = 690 + hash(i) * 70;
    stroke([[x, y], [x + 26, y + 32]], { w: 3.5, alpha: 0.2 * pr(t, 1.8, 3.0), seed: 10 + i, dry: 0.55, bristles: 2 });
  }
  // house: roof, posts, wall, door
  const roof = ease(pr(t, 2.0, 3.1));
  stroke([[470, 560], [600, 512], [742, 514], [882, 560]], { w: 16, alpha: 0.82, seed: 21, draw: roof, dry: 0.05, bristles: 9 });
  stroke([[486, 578], [606, 542], [738, 544], [858, 578]], { w: 7, alpha: 0.5, seed: 22, draw: roof, dry: 0.3, bristles: 5 });
  stroke([[566, 548], [566, 704]], { w: 7, alpha: 0.65, seed: 23, draw: ease(pr(t, 2.5, 3.5)) });
  stroke([[784, 548], [784, 704]], { w: 7, alpha: 0.65, seed: 24, draw: ease(pr(t, 2.5, 3.5)) });
  const wall = [[580, 566], [772, 566], [772, 704], [580, 704]];
  wash(wall, 0.10 * pr(t, 2.7, 3.8), 6);
  stroke([[610, 610], [610, 704], [744, 704], [744, 610]], { w: 5, alpha: 0.45 * pr(t, 3.0, 4.0), seed: 25 });
  // water: dry horizontal streaks on blank paper
  for (let i = 0; i < 8; i++) {
    const y = 770 + i * 24, x = 80 + hash(i + 2) * 300, len = 180 + hash(i + 4) * 420;
    mark(x, y, x + len, y, 2 + hash(i) * 2, 0.13 * pr(t, 3.0, 4.4));
  }
}

function rain(t) {
  const a = pr(t, 3.1, 4.2); if (a <= 0) return;
  for (let i = 0; i < 90; i++) {
    const x = hash(i) * W;
    const y = (hash(i + 7) * H + t * 190) % 900;
    const len = 26 + hash(i + 11) * 46;
    mark(x, y, x - 12, y + len, 0.7 + hash(i + 3) * 1.1, (0.10 + 0.16 * hash(i + 5)) * a);
  }
}

function figure(t) {
  const walk = ease(pr(t, 4.4, 7.0)); if (walk <= 0) return;
  const t12 = Math.floor(t * 12) / 12;
  const x = 1500 + (1000 - 1500) * walk;
  const y = 790 - Math.abs(Math.sin(t12 * Math.PI * 2.2)) * 6;
  const step = Math.sin(t12 * Math.PI * 2.2) * 10;
  // robe mass
  const robe = [[x - 28, y - 126], [x + 28, y - 126], [x + 38, y], [x - 38, y]];
  wash(robe, 0.22, 5);
  stroke([[x - 28, y - 126], [x - 38, y]], { w: 5, alpha: 0.55, seed: 31, dry: 0.3 });
  stroke([[x + 28, y - 126], [x + 38, y]], { w: 5, alpha: 0.55, seed: 32, dry: 0.3 });
  // legs and arms
  stroke([[x - 10, y], [x - 18 + step, y + 24]], { w: 4, alpha: 0.7, seed: 33 });
  stroke([[x + 10, y], [x + 18 - step, y + 24]], { w: 4, alpha: 0.7, seed: 34 });
  stroke([[x + 24, y - 116], [x + 52, y - 82]], { w: 4, alpha: 0.65, seed: 35 });
  // head
  ctx.save(); ctx.fillStyle = INK; ctx.globalAlpha = 0.12;
  ctx.beginPath(); ctx.arc(x, y - 148, 20, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  stroke([[x - 16, y - 148], [x + 16, y - 148]], { w: 4, alpha: 0.7, seed: 36 });
  // red umbrella
  const ux = x + 58, uy = y - 186, ur = 58;
  ctx.save(); ctx.globalAlpha = 0.92; ctx.fillStyle = RED;
  ctx.beginPath(); ctx.arc(ux, uy, ur, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.55; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux, uy + 56); ctx.stroke();
  ctx.restore();
  // puddle rings
  for (let i = 0; i < 4; i++) {
    const age = t - (5.2 + i * 0.65); if (age < 0) continue;
    const r = 12 + age * 24;
    ctx.save(); ctx.globalAlpha = Math.max(0, 0.22 - age * 0.025);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(x, 796, r, r * 0.28, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

function vertical(str, x, y, size, lead, upTo) {
  ctx.save(); ctx.font = `italic 600 ${size}px Cormorant, Georgia, serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.globalAlpha = 0.86;
  for (let i = 0; i < Math.min(str.length, upTo); i++) ctx.fillText(str[i], x, y + i * lead);
  ctx.restore();
}

function title(t) {
  const n = Math.floor(pr(t, 7.0, 8.7) * 19);
  if (n <= 0) return;
  vertical('A HOUSE', 1552, 202, 42, 47, n);
  vertical('MADE OF RAIN', 1638, 202, 42, 47, Math.max(0, n - 7));
  if (t > 8.7) {
    ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = RED;
    ctx.fillRect(1706, 796, 62, 62);
    ctx.globalAlpha = 0.75; ctx.fillStyle = PAPER;
    ctx.fillRect(1718, 808, 10, 34); ctx.fillRect(1734, 808, 10, 20); ctx.fillRect(1750, 808, 8, 38);
    ctx.fillRect(1718, 848, 40, 4);
    ctx.restore();
  }
  const ins = pr(t, 2.4, 2.8);
  if (ins > 0) {
    ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = RED; ctx.fillRect(96, 956, 9, 9);
    ctx.font = 'italic 500 22px Cormorant, Georgia, serif'; ctx.fillStyle = INK;
    ctx.fillText('a xieyi study in five tones', 116, 967); ctx.restore();
  }
}

function draw(t) {
  ctx.drawImage(paper, 0, 0);
  landscape(t);
  rain(t);
  figure(t);
  title(t);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.9);
  v.addColorStop(0, 'rgba(255,250,240,0)'); v.addColorStop(1, 'rgba(80,58,38,0.12)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

window.DUR = 10;
window.render = draw;
document.fonts.ready.then(async () => {
  try { await document.fonts.load('italic 600 42px Cormorant'); } catch (e) {}
  window.READY = true;
});
