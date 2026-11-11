// Polished copper, a low burin, and one uneven swarf curl.
import { hash, seg } from '/core/lib.js';

export function drawCopper(ctx) {
  const g = ctx.createLinearGradient(200, 80, 1600, 980);
  g.addColorStop(0, '#e7b184');
  g.addColorStop(0.45, '#c4844e');
  g.addColorStop(1, '#7a4328');
  ctx.fillStyle = g;
  ctx.fillRect(-600, -600, 3200, 2400);
  ctx.strokeStyle = 'rgba(255, 236, 210, 0.16)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let i = -40; i < 80; i++) {
    const y = i * 14;
    ctx.moveTo(-200, y);
    ctx.lineTo(2200, y + 180);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 244, 220, 0.16)';
  ctx.beginPath();
  ctx.moveTo(180, 60);
  ctx.lineTo(620, 40);
  ctx.lineTo(540, 280);
  ctx.lineTo(140, 250);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(70, 36, 18, ${0.03 + hash(i + 4) * 0.04})`;
    ctx.beginPath();
    ctx.ellipse(300 + hash(i) * 1400, 160 + hash(i + 2) * 760, 18 + hash(i + 3) * 30, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawBurin(ctx, x, y, ang, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang + 0.12);
  ctx.fillStyle = '#e7ebef';
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-62, 4.2);
  ctx.lineTo(-78, 0);
  ctx.lineTo(-62, -4.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2c3136';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = '#f7fafc';
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(-8, 3.6);
  ctx.lineTo(-8, -2.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6d4030';
  ctx.beginPath();
  ctx.ellipse(-96, 0, 15, 10.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d5a40';
  ctx.beginPath();
  ctx.ellipse(-92, -3, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const curl = 0.65 + 0.35 * Math.sin(t * 9.0);
  ctx.beginPath();
  for (let i = 0; i <= 26; i++) {
    const u = i / 26;
    const a = u * (4.2 + curl) + Math.sin(u * 7.5 + 0.6) * 0.7;
    const rad = (3 + u * 15) * (1.05 - u * 0.25);
    const px = 8 + u * 8 + Math.cos(a) * rad * 0.28;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = 'rgba(255, 236, 206, 0.95)';
  ctx.lineWidth = 1.35;
  ctx.stroke();
  ctx.strokeStyle = '#3a2418';
  ctx.lineWidth = 0.55;
  ctx.translate(0.6, 0.8);
  ctx.stroke();
  ctx.restore();
}

export function rakeAmount(t) {
  return 1 - seg(t, 1.6, 3.05);
}
