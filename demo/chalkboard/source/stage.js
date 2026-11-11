// Classroom: wall, slate, frame, tray, clock. Drawn in world units inside a camera transform.

export function applyCamera(ctx, cam) {
  ctx.setTransform(cam.s, 0, 0, cam.s, 960 - cam.cx * cam.s, 540 - cam.cy * cam.s);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

let grainPat = null;
function slateGrain() {
  if (grainPat) return grainPat;
  const s = 96;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  let n = 7;
  const rnd = () => {
    n = (n * 16807) % 2147483647;
    return (n & 0xffff) / 0xffff;
  };
  for (let i = 0; i < s * s; i++) {
    const v = 18 + Math.floor(rnd() * 28);
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v + 6;
    img.data[i * 4 + 2] = v + 4;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainPat = g.createPattern(c, 'repeat');
  return grainPat;
}

function clockHand(ctx, ang, len, width) {
  ctx.save();
  ctx.rotate(ang);
  ctx.fillStyle = '#2c241c';
  roundRect(ctx, -width / 2, -len, width, len, width / 2);
  ctx.fill();
  ctx.restore();
}

export function drawRoom(ctx, cam, t) {
  applyCamera(ctx, cam);

  // Wall and dado. The slate is painted over the middle of this.
  ctx.fillStyle = '#f3eadc';
  ctx.fillRect(-1200, -1400, 9000, 4600);
  ctx.fillStyle = '#748068';
  ctx.fillRect(-1200, 2220, 9000, 980);
  ctx.fillStyle = '#c9b79a';
  ctx.fillRect(-1200, 2160, 9000, 28);

  // Warm window patch, left wall only — the slate covers anything that would cross the writing.
  const light = ctx.createRadialGradient(-280, 280, 40, -180, 360, 920);
  light.addColorStop(0, 'rgba(255, 236, 206, 0.85)');
  light.addColorStop(1, 'rgba(255, 236, 206, 0)');
  ctx.fillStyle = light;
  ctx.fillRect(-1200, -800, 1600, 2200);

  // Slate
  ctx.fillStyle = '#1a3c32';
  ctx.fillRect(0, 0, 6400, 1700);

  if (cam.s > 0.5) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = slateGrain();
    ctx.fillRect(0, 0, 6400, 1700);
    ctx.restore();
  }

  drawWet(ctx, t);

  // Inner lip, then the wooden frame and the centre stile.
  ctx.fillStyle = '#10241e';
  ctx.fillRect(0, 0, 6400, 16);
  ctx.fillRect(0, 1684, 6400, 16);
  ctx.fillRect(0, 0, 16, 1700);
  ctx.fillRect(6384, 0, 16, 1700);

  ctx.fillStyle = '#6e4324';
  ctx.fillRect(-78, -78, 6556, 78);
  ctx.fillRect(-78, 1700, 6556, 86);
  ctx.fillRect(-78, -78, 78, 1864);
  ctx.fillRect(6400, -78, 86, 1864);
  ctx.fillStyle = '#8d5a34';
  ctx.fillRect(-78, -78, 6556, 16);
  ctx.fillStyle = '#3e2616';
  ctx.fillRect(3164, 0, 72, 1700);

  drawTray(ctx);
  drawClock(ctx, t);

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Gentle falloff away from the window. Very light in a close shot so it never draws a shape on the words.
  const shade = cam.s > 0.9 ? 0.07 : 0.2;
  const g = ctx.createLinearGradient(0, 0, 1920, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${shade})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1920, 1080);
}

function drawWet(ctx, t) {
  if (t > 4.2) return;
  const k = 1 - Math.min(1, t / 3.6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 6400, 1700);
  ctx.clip();
  ctx.globalCompositeOperation = 'multiply';
  ctx.translate(420 + 700 * k, 860);
  ctx.scale(1.55 + 0.85 * k, 0.92);
  const g = ctx.createRadialGradient(0, 0, 30, 0, 0, 780);
  g.addColorStop(0, `rgba(6, 18, 14, ${0.10 + 0.16 * k})`);
  g.addColorStop(0.62, `rgba(6, 18, 14, ${0.05 + 0.08 * k})`);
  g.addColorStop(1, 'rgba(6, 18, 14, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 780, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTray(ctx) {
  ctx.fillStyle = '#5c3a22';
  roundRect(ctx, 420, 1860, 5600, 250, 18);
  ctx.fill();
  ctx.fillStyle = '#3a2416';
  roundRect(ctx, 520, 1920, 5400, 120, 12);
  ctx.fill();
  const sticks = [
    [1680, '#f3efe2'],
    [1960, '#e07a32'],
    [2220, '#e6d07a'],
  ];
  for (const [x, color] of sticks) {
    ctx.save();
    ctx.translate(x, 1975);
    ctx.rotate(-0.08);
    ctx.fillStyle = color;
    roundRect(ctx, 0, -18, 280, 36, 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(230, -18, 50, 36);
    ctx.restore();
  }
}

function drawClock(ctx, t) {
  const cx = 6980;
  const cy = -300;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#6e4324';
  ctx.beginPath();
  ctx.arc(0, 0, 188, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4efe4';
  ctx.beginPath();
  ctx.arc(0, 0, 158, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2c241c';
  for (let i = 0; i < 12; i++) {
    ctx.save();
    ctx.rotate((i / 12) * Math.PI * 2);
    ctx.fillRect(-3, -146, 6, i % 3 === 0 ? 22 : 12);
    ctx.restore();
  }
  // 8:40, and a second hand that moves with the film.
  clockHand(ctx, ((8 + 40 / 60) / 12) * Math.PI * 2, 78, 10);
  clockHand(ctx, (40 / 60) * Math.PI * 2, 118, 6);
  const sec = (t * 1) % 60;
  clockHand(ctx, (sec / 60) * Math.PI * 2, 132, 2.5);
  ctx.fillStyle = '#e07a32';
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
