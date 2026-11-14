// Case File Triptych — Halftone Dossier 10s (paper, dots, stamps).
const W = 1920;
const H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const pr = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

// Deterministic paper grit (no Math.random per frame).
const paperCanvas = document.createElement('canvas');
paperCanvas.width = W;
paperCanvas.height = H;
{
  const pctx = paperCanvas.getContext('2d');
  pctx.fillStyle = '#fdf6e9';
  pctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) {
    const r = Math.sin(i * 12.9898) * 43758.5453;
    const r2 = Math.sin(i * 78.233) * 43758.5453;
    const x = (r - Math.floor(r)) * W;
    const y = (r2 - Math.floor(r2)) * H;
    pctx.fillStyle = i % 3 ? 'rgba(210,190,150,0.35)' : 'rgba(255,255,255,0.25)';
    pctx.fillRect(x, y, 2, 1);
  }
  const v = pctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
  v.addColorStop(0, 'rgba(255,250,230,0)');
  v.addColorStop(1, 'rgba(180,150,100,0.18)');
  pctx.fillStyle = v;
  pctx.fillRect(0, 0, W, H);
}

const dotCanvas = document.createElement('canvas');
dotCanvas.width = 8;
dotCanvas.height = 8;
{
  const dctx = dotCanvas.getContext('2d');
  dctx.fillStyle = '#3a2210';
  for (let gx = 0; gx < 4; gx++) {
    for (let gy = 0; gy < 4; gy++) {
      if ((gx + gy) % 2 === 0) dctx.fillRect(gx * 2, gy * 2, 2, 2);
    }
  }
}
const dotPattern = ctx.createPattern(dotCanvas, 'repeat');

const cards = [
  { t0: 0, t1: 3.3, title: 'CASE FILE 01', exhibit: 'Evidence: rubber stamp', stamp: 'ARCHIVE-101' },
  { t0: 3.3, t1: 6.7, title: 'CASE FILE 02', exhibit: 'Height chart fragment', stamp: 'PRESS-77' },
  { t0: 6.7, t1: 10, title: 'CASE FILE 03', exhibit: 'Ink splotch plate', stamp: 'REVIEW-99' },
];

function draw(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(paperCanvas, 0, 0);

  let card = cards[0];
  for (const c of cards) {
    if (t >= c.t0 && t < c.t1) {
      card = c;
      break;
    }
  }
  const fade = pr(t, card.t0, card.t0 + 0.35) * (1 - pr(t, card.t1 - 0.25, card.t1));

  const pad = 80;
  ctx.globalAlpha = 0.92 * Math.max(0.35, fade);
  ctx.fillStyle = 'rgba(255,245,220,0.95)';
  ctx.fillRect(pad / 2, pad / 2, W - pad, H - pad);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = dotPattern;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(pad / 2, pad / 2, W - pad, H - pad);
  ctx.restore();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#502800';
  ctx.font = 'bold 88px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.title, W / 2, H / 2 - 70);

  ctx.fillStyle = '#785014';
  ctx.font = '42px Georgia, "Times New Roman", serif';
  ctx.fillText(card.exhibit, W / 2, H / 2 + 10);

  const stampIn = pr(t, card.t0 + 1.1, card.t0 + 1.6);
  if (stampIn > 0) {
    ctx.save();
    ctx.globalAlpha = stampIn;
    ctx.translate(W / 2 + 220, H / 2 + 120);
    ctx.rotate((-8 * Math.PI) / 180);
    ctx.strokeStyle = '#502800';
    ctx.fillStyle = 'rgba(200,160,120,0.85)';
    ctx.lineWidth = 5;
    ctx.font = 'bold 34px ui-monospace, Menlo, monospace';
    const tw = ctx.measureText(card.stamp).width + 36;
    const th = 52;
    const x0 = -tw / 2;
    const y0 = -th / 2;
    const rr = 8;
    ctx.beginPath();
    ctx.moveTo(x0 + rr, y0);
    ctx.arcTo(x0 + tw, y0, x0 + tw, y0 + th, rr);
    ctx.arcTo(x0 + tw, y0 + th, x0, y0 + th, rr);
    ctx.arcTo(x0, y0 + th, x0, y0, rr);
    ctx.arcTo(x0, y0, x0 + tw, y0, rr);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#502800';
    ctx.fillText(card.stamp, 0, 2);
    ctx.restore();
  }

  // Docket number
  ctx.font = '28px ui-monospace, Menlo, monospace';
  ctx.fillStyle = 'rgba(80,40,0,0.55)';
  ctx.textAlign = 'right';
  ctx.fillText('DOSSIER · HT-' + String(Math.floor(t * 10)).padStart(3, '0'), W - 100, H - 80);
}

window.DUR = 10;
window.render = draw;
window.READY = true;
