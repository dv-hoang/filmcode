// film.js – HD‑2D Diorama (10 s)
// Exports: window.DUR, window.render, window.READY

window.DUR = 10;
window.READY = true;

function draw(ctx, t) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // ----- Sky -----
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  const skyTop = `hsl(${200 - t * 5}, 70%, ${80 - t * 2}%)`;
  const skyBottom = `hsl(${200 - t * 5}, 50%, ${60 - t * 2}%)`;
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // ----- Sun (rising) -----
  const sunY = h * 0.6 - (Math.sin(t / 10 * Math.PI) * h * 0.3);
  const sunRadius = h * 0.12;
  const sunGrad = ctx.createRadialGradient(w * 0.5, sunY, 0, w * 0.5, sunY, sunRadius);
  sunGrad.addColorStop(0, 'rgba(255,220,120,0.9)');
  sunGrad.addColorStop(1, 'rgba(255,180,60,0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(w * 0.5, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // ----- Fog (soft overlay) -----
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 8; i++) {
    const y = (i / 8) * h + (t * 20 % h);
    ctx.fillRect(0, y, w, h / 8);
  }

  // ----- Platform (simple perspective) -----
  const platformY = h * 0.75;
  ctx.fillStyle = '#444';
  ctx.fillRect(0, platformY, w, h - platformY);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const x = (i / 10) * w;
    const py = platformY - (x / w) * h * 0.2; // vanishing lines
    ctx.moveTo(x, platformY);
    ctx.lineTo(x, py);
  }
  ctx.stroke();

  // ----- Train (paper‑cut silhouette) -----
  const trainSpeed = w / 12; // full width in 12 s
  const trainX = (w - (t * trainSpeed) % (w + 200)) - 200; // start off‑screen left
  const trainY = platformY - 30;
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.moveTo(trainX, trainY);
  ctx.lineTo(trainX + 180, trainY);
  ctx.lineTo(trainX + 180, trainY - 20);
  ctx.lineTo(trainX + 150, trainY - 40);
  ctx.lineTo(trainX + 120, trainY - 20);
  ctx.lineTo(trainX + 90, trainY - 40);
  ctx.lineTo(trainX + 60, trainY - 20);
  ctx.lineTo(trainX + 30, trainY - 40);
  ctx.lineTo(trainX, trainY - 20);
  ctx.closePath();
  ctx.fill();

  // ----- Tilt‑shift blur (focus strip) -----
  const focusY = h * 0.5 + Math.sin(t * 0.5) * h * 0.1;
  const focusH = h * 0.2;
  ctx.save();
  ctx.filter = `blur(${Math.max(0, 8 - (Math.abs((h/2)-focusY)/focusH)*8)}px)`;
  ctx.globalCompositeOperation = 'destination-over';
  ctx.drawImage(ctx.canvas, 0, 0);
  ctx.restore();

  // ----- Ground texture (simple noise) -----
  const imgData = ctx.getImageData(0, platformY, w, h - platformY);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = (Math.random() * 10) | 0;
    data[i] = data[i+1] = data[i+2] = 30 + v; // dark gray speckles
  }
  ctx.putImageData(imgData, 0, platformY);
}

window.render = draw;
