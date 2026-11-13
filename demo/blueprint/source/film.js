// Project Signal — Blueprint 10s demo (cyanotype sheet, drafting order).
const W = 1920, H = 1080;
const PAPER0 = '#0f2350', PAPER1 = '#1d3f80', LINE = '#e7f0f9', TABLE = '#0d1116', STAMP = '#c62828';
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const pr = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const eio = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

function paper() {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, PAPER0);
  g.addColorStop(1, PAPER1);
  ctx.fillStyle = TABLE;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = g;
  ctx.fillRect(120, 70, W - 240, H - 140);
  ctx.restore();
  // fibres / grit (deterministic — no Math.random per frame)
  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 900; i++) {
    const h = Math.sin(i * 12.9898) * 43758.5453;
    const r = h - Math.floor(h);
    const h2 = Math.sin(i * 78.233) * 43758.5453;
    const r2 = h2 - Math.floor(h2);
    const x = 120 + r * (W - 240);
    const y = 70 + r2 * (H - 140);
    ctx.fillStyle = i % 3 ? '#0a1a3a' : '#8eb6e8';
    ctx.fillRect(x, y, 2, 1);
  }
  ctx.restore();
}

function strokePath(fn, progress, width = 2) {
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([2400]);
  ctx.lineDashOffset = 2400 * (1 - progress);
  ctx.beginPath();
  fn(ctx);
  ctx.stroke();
  ctx.restore();
}

function gear(cx, cy, r, teeth, rot) {
  const steps = teeth * 4;
  ctx.moveTo(cx + r, cy);
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 + rot;
    const tooth = (i % 4 < 2) ? 1.12 : 0.92;
    const rr = r * tooth;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function titleBlock(a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1280, 820, 480, 140);
  ctx.beginPath();
  ctx.moveTo(1280, 870);
  ctx.lineTo(1760, 870);
  ctx.moveTo(1520, 820);
  ctx.lineTo(1520, 960);
  ctx.stroke();
  ctx.fillStyle = LINE;
  ctx.font = '500 18px ui-monospace, Menlo, monospace';
  ctx.fillText('DWG  —  PROJECT SIGNAL', 1296, 852);
  ctx.font = '400 15px ui-monospace, Menlo, monospace';
  ctx.fillText('SCALE 1:1', 1296, 900);
  ctx.fillText('REV A', 1540, 900);
  ctx.fillText('STATUS', 1296, 940);
  ctx.fillText('FIG. 1', 1540, 940);
  ctx.restore();
}

function stamp(a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(1480, 300);
  ctx.rotate(-0.18);
  ctx.strokeStyle = STAMP;
  ctx.fillStyle = STAMP;
  ctx.lineWidth = 4;
  ctx.strokeRect(-110, -36, 220, 72);
  ctx.font = '700 28px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('APPROVED', 0, 2);
  ctx.restore();
}

function draw(t) {
  paper();
  const cx = W / 2, cy = H / 2 - 20;

  // centre lines
  const c1 = eio(pr(t, 0.4, 1.3));
  strokePath((c) => { c.moveTo(220, cy); c.lineTo(1700, cy); }, c1, 1.2);
  strokePath((c) => { c.moveTo(cx, 140); c.lineTo(cx, 900); }, c1, 1.2);

  // machine outline / gear
  const g1 = eio(pr(t, 1.3, 3.2));
  strokePath((c) => gear(cx, cy, 210, 14, 0), g1, 3);
  strokePath((c) => { c.arc(cx, cy, 70, 0, Math.PI * 2); }, g1, 2);

  // second gear + shaft
  const g2 = eio(pr(t, 3.0, 4.8));
  strokePath((c) => gear(cx + 310, cy + 40, 120, 10, 0.2), g2, 2.5);
  strokePath((c) => {
    c.moveTo(cx + 70, cy);
    c.lineTo(cx + 190, cy + 40);
  }, g2, 2);

  // dimension / balloon
  const d1 = eio(pr(t, 4.6, 6.0));
  strokePath((c) => {
    c.moveTo(cx - 210, cy + 260);
    c.lineTo(cx + 210, cy + 260);
    c.moveTo(cx - 210, cy + 250);
    c.lineTo(cx - 210, cy + 270);
    c.moveTo(cx + 210, cy + 250);
    c.lineTo(cx + 210, cy + 270);
  }, d1, 1.4);
  ctx.save();
  ctx.globalAlpha = d1;
  ctx.fillStyle = LINE;
  ctx.font = '400 20px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Ø 420', cx, cy + 290);
  ctx.beginPath();
  ctx.arc(cx - 280, cy - 160, 18, 0, Math.PI * 2);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillText('1', cx - 280, cy - 154);
  ctx.restore();

  // header + notes
  const h1 = eio(pr(t, 5.8, 7.2));
  ctx.save();
  ctx.globalAlpha = h1;
  ctx.fillStyle = LINE;
  ctx.font = '600 42px "Iowan Old Style", Palatino, serif';
  ctx.textAlign = 'left';
  ctx.fillText('PROJECT SIGNAL', 180, 150);
  ctx.font = '400 20px ui-monospace, Menlo, monospace';
  ctx.fillText('GENERAL NOTES', 180, 720);
  ctx.fillText('1. ONE SHEET. ONE MACHINE.', 180, 760);
  ctx.fillText('2. DRAWING ORDER IS THE PLOT.', 180, 794);
  ctx.fillText('3. THE STAMP IS THE VERDICT.', 180, 828);
  ctx.restore();

  titleBlock(eio(pr(t, 6.8, 8.0)));
  stamp(eio(pr(t, 8.0, 8.8)));

  // soft end hold
  if (t > 9.5) {
    ctx.fillStyle = `rgba(13,17,22,${pr(t, 9.5, 10)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

window.DUR = 10;
window.render = draw;
window.READY = true;
