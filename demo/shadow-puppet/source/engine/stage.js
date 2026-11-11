import { lerp, seg, ss, vnoise } from '/core/lib.js';

export function toScreen(px, py, cam, clothW) {
  const x = cam.mirror ? clothW - px : px;
  return [960 + (x - cam.x) * cam.z, 540 + (py - cam.y) * cam.z];
}

function clothRect(cam, clothW, clothH) {
  const pts = [
    [0, 0],
    [clothW, 0],
    [clothW, clothH],
    [0, clothH],
  ].map(([x, y]) => toScreen(x, y, cam, clothW));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const x1 = Math.max(...xs);
  const y1 = Math.max(...ys);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function mitt(g, sc) {
  g.beginPath();
  g.ellipse(0, 10, 54 * sc, 36 * sc, -0.4, 0, Math.PI * 2);
  g.ellipse(46 * sc, -8, 16 * sc, 22 * sc, 0.4, 0, Math.PI * 2);
  g.ellipse(28 * sc, -30, 13 * sc, 20 * sc, 0.2, 0, Math.PI * 2);
  g.ellipse(8 * sc, -34, 12 * sc, 18 * sc, -0.2, 0, Math.PI * 2);
  g.ellipse(-14 * sc, -24, 12 * sc, 16 * sc, -0.5, 0, Math.PI * 2);
  g.fill();
}

let handLayer = null;

function handOutline(g) {
  g.beginPath();
  g.moveTo(-16, 52);
  g.lineTo(-26, 22);
  g.quadraticCurveTo(-70, 16, -64, -22);
  g.quadraticCurveTo(-46, -34, -34, -4);
  g.lineTo(-30, -8);
  g.quadraticCurveTo(-36, -48, -18, -56);
  g.quadraticCurveTo(-6, -46, -10, -16);
  g.quadraticCurveTo(-4, -58, 12, -64);
  g.quadraticCurveTo(24, -46, 14, -14);
  g.quadraticCurveTo(22, -52, 36, -50);
  g.quadraticCurveTo(48, -30, 32, -6);
  g.quadraticCurveTo(46, -16, 52, 2);
  g.quadraticCurveTo(56, 24, 32, 32);
  g.quadraticCurveTo(16, 44, 4, 52);
  g.closePath();
}

function rimHand(ctx, x, y, t) {
  if (!handLayer) {
    handLayer = document.createElement('canvas');
    handLayer.width = 520;
    handLayer.height = 520;
  }
  const g = handLayer.getContext('2d');
  g.clearRect(0, 0, 520, 520);
  g.save();
  g.translate(270, 220);
  g.rotate(-0.35 + (vnoise(t * 1.4) - 0.5) * 0.05);
  g.scale(1.55, 1.55);
  g.fillStyle = '#ffd7a4';
  handOutline(g);
  g.fill();
  g.save();
  g.translate(1, 2);
  g.scale(0.82, 0.82);
  g.fillStyle = '#120c09';
  handOutline(g);
  g.fill();
  g.restore();
  g.strokeStyle = '#120c09';
  g.lineWidth = 26;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-6, 48);
  g.lineTo(-28, 150);
  g.stroke();
  g.restore();
  ctx.drawImage(handLayer, x - 270, y - 220);
}

function drawRod(ctx, from, cam, clothW) {
  const a = toScreen(from.x, from.y, cam, clothW);
  const b = toScreen(from.x + 18, 28, cam, clothW);
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
}

export function drawOverlay(ctx, o) {
  const { cam, W, H, t, cue, points, title } = o;
  const rect = clothRect(cam, W, H);

  if (rect.x > 8 || rect.y > 8) {
    ctx.save();
    ctx.strokeStyle = '#3a1a10';
    ctx.lineWidth = 34;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = '#c6a15a';
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x + 14, rect.y + 14, rect.w - 28, rect.h - 28);
    ctx.restore();
  }

  if (!cam.mirror && rect.y + rect.h < 1040) {
    ctx.save();
    ctx.fillStyle = '#120c09';
    for (let i = 0; i < 8; i++) {
      const x = 140 + i * 220 + (i % 2) * 16;
      const ry = 30 + (i % 3) * 6;
      ctx.beginPath();
      ctx.ellipse(x, 1064, 38, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (!cam.mirror && points) {
    ctx.save();
    ctx.strokeStyle = 'rgba(48, 42, 36, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (const p of points) drawRod(ctx, p, cam, W);
    ctx.restore();
  }

  if (title) {
    ctx.save();
    ctx.strokeStyle = 'rgba(48, 42, 36, 0.45)';
    ctx.lineWidth = 2.5;
    const a = toScreen(title.x + 40, title.y, cam, W);
    const b = toScreen(title.x + 40, 20, cam, W);
    const c = toScreen(title.x + title.w - 40, title.y, cam, W);
    const d = toScreen(title.x + title.w - 40, 24, cam, W);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.moveTo(c[0], c[1]);
    ctx.lineTo(d[0], d[1]);
    ctx.stroke();
    ctx.restore();
  }

  const sub = cue.subs.find((s) => t >= s.t0 && t <= s.t1 + 0.28);
  if (sub && !cam.mirror) drawPlacard(ctx, sub.text, t, sub.t0, sub.t1);

  if (cam.mirror && o.hand) {
    const p = toScreen(o.hand.x, o.hand.y, cam, W);
    rimHand(ctx, p[0] - 36, p[1] - 48, t);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const x = p[0];
    const y = p[1];
    const rad = ctx.createRadialGradient(x, y, 4, x, y, 72);
    const flick = 0.75 + 0.25 * Math.sin(t * 40);
    rad.addColorStop(0, `rgba(255, 214, 150, ${0.7 * flick})`);
    rad.addColorStop(1, 'rgba(255, 140, 50, 0)');
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(x, y, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const wipe = seg(t, cue.t.wipe[0], cue.t.wipe[1]);
  if (wipe > 0 && wipe < 1) {
    ctx.save();
    ctx.filter = 'blur(18px)';
    ctx.fillStyle = '#1a0c08';
    ctx.fillRect(lerp(-280, 2100, ss(wipe)), -40, 300, 1160);
    ctx.restore();
  }

  const flash = seg(t, cue.t.catch, cue.t.catch + 0.32);
  if (flash > 0 && flash < 1) {
    const a = flash < 0.35 ? flash / 0.35 : 1 - (flash - 0.35) / 0.65;
    ctx.save();
    ctx.globalAlpha = a * 0.55;
    ctx.fillStyle = '#fff1d2';
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.restore();
  }
}

function drawPlacard(ctx, text, t, t0, t1) {
  ctx.save();
  ctx.font = "600 46px 'Cormorant Garamond'";
  const tw = ctx.measureText(text).width;
  const w = Math.min(1500, tw + 84);
  const h = 78;
  const x = (1920 - w) / 2;
  const y = 1080 - 36 - h;
  const inn = ss(seg(t, t0, t0 + 0.32));
  const out = ss(seg(t, t1, t1 + 0.28));
  const yy = lerp(y + 42, y, inn) + lerp(0, 36, out);
  ctx.globalAlpha = inn * (1 - out);
  ctx.fillStyle = '#140c08';
  ctx.fillRect(x, yy, w, h);
  ctx.strokeStyle = '#c6a15a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 8, yy + 8, w - 16, h - 16);
  ctx.fillStyle = '#c23a2e';
  ctx.fillRect(x + w - 48, yy + 18, 22, 22);
  ctx.strokeRect(x + w - 48, yy + 18, 22, 22);
  ctx.fillStyle = '#f3e6c8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + (w - 36) / 2, yy + h / 2 + 2);
  ctx.restore();
}
