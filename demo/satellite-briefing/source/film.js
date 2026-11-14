const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Offscreen terrain canvas for procedural satellite imagery plate
const terrainCanvas = document.createElement('canvas');
terrainCanvas.width = 1920; terrainCanvas.height = 1080;
const tCtx = terrainCanvas.getContext('2d');

// Generate procedural satellite terrain (orthographic relief + fields + coastline + grid)
function generateTerrain() {
  tCtx.fillStyle = '#111814';
  tCtx.fillRect(0, 0, W, H);

  // Landmasses (pseudo-random organic shapes)
  tCtx.fillStyle = '#223024';
  tCtx.beginPath();
  tCtx.moveTo(0, 300);
  tCtx.bezierCurveTo(400, 100, 800, 500, 1200, 200);
  tCtx.bezierCurveTo(1500, 50, 1700, 400, 1920, 350);
  tCtx.lineTo(1920, 1080);
  tCtx.lineTo(0, 1080);
  tCtx.fill();

  // Mountain ridges & elevation contours
  tCtx.strokeStyle = '#324838';
  tCtx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    tCtx.beginPath();
    let bx = 200 + i * 220, by = 400 + (i % 3) * 120;
    tCtx.moveTo(bx, by);
    for (let j = 0; j < 5; j++) {
      bx += 180 + (j * 33) % 70;
      by += ((j % 2 === 0) ? -1 : 1) * (60 + (j * 47) % 80);
      tCtx.lineTo(bx, by);
    }
    tCtx.stroke();
  }

  // Facility / installation footprint (target area)
  const cx = 1120, cy = 640;
  tCtx.fillStyle = '#18241c';
  tCtx.strokeStyle = '#385440';
  tCtx.lineWidth = 3;
  tCtx.beginPath();
  tCtx.rect(cx - 180, cy - 120, 360, 240);
  tCtx.fill();
  tCtx.stroke();

  // Access roads / runways
  tCtx.strokeStyle = '#486850';
  tCtx.lineWidth = 5;
  tCtx.beginPath();
  tCtx.moveTo(cx - 400, cy + 180);
  tCtx.lineTo(cx + 450, cy - 220);
  tCtx.stroke();

  // Structures inside facility
  tCtx.fillStyle = '#2c4032';
  tCtx.fillRect(cx - 120, cy - 60, 80, 50);
  tCtx.fillRect(cx + 40, cy - 60, 90, 70);
  tCtx.fillRect(cx - 40, cy + 20, 120, 60);

  // Radar dish / dome
  tCtx.fillStyle = '#5c7862';
  tCtx.beginPath();
  tCtx.arc(cx - 80, cy, 26, 0, Math.PI * 2);
  tCtx.fill();
  tCtx.strokeStyle = '#8ab094';
  tCtx.lineWidth = 2;
  tCtx.stroke();

  // Fine texture noise overlay (analyst grey grading)
  const imgData = tCtx.getImageData(0, 0, W, H);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.sin(i * 99.1) * 43758.5453) % 1;
    const val = (noise - 0.5) * 18;
    data[i] = Math.max(0, Math.min(255, data[i] + val));
    data[i+1] = Math.max(0, Math.min(255, data[i+1] + val));
    data[i+2] = Math.max(0, Math.min(255, data[i+2] + val));
  }
  tCtx.putImageData(imgData, 0, 0);

  // Geodetic grid overlay (faint cyan/white)
  tCtx.strokeStyle = 'rgba(180, 210, 200, 0.12)';
  tCtx.lineWidth = 1;
  for (let x = 0; x < W; x += 120) {
    tCtx.beginPath(); tCtx.moveTo(x, 0); tCtx.lineTo(x, H); tCtx.stroke();
  }
  for (let y = 0; y < H; y += 120) {
    tCtx.beginPath(); tCtx.moveTo(0, y); tCtx.lineTo(W, y); tCtx.stroke();
  }
}
generateTerrain();

function draw(t) {
  ctx.fillStyle = '#06080a';
  ctx.fillRect(0, 0, W, H);

  // Continuous zoom and pan mechanics
  // t: 0..10s
  // 0-3s: Wide orbit view zooming into sector
  // 3-7s: Target lock, telemetry readout, measurement vectors
  // 7-10s: Time lapse / temporal drift phase (shadows shift, clock ticks)

  let scale = 1.0;
  let tx = 0, ty = 0;
  const targetX = 1120, targetY = 640;

  if (t < 3.5) {
    const p = t / 3.5;
    const ease = p * p * (3 - 2 * p);
    scale = 1.0 + ease * 1.8;
    tx = (W/2 - targetX) * ease;
    ty = (H/2 - targetY) * ease;
  } else if (t < 7.5) {
    scale = 2.8;
    tx = W/2 - targetX;
    ty = H/2 - targetY;
  } else {
    const p = (t - 7.5) / 2.5;
    scale = 2.8 + p * 0.4;
    tx = (W/2 - targetX) + Math.sin(t * 3) * 4;
    ty = (H/2 - targetY) + Math.cos(t * 2) * 4;
  }

  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(scale, scale);
  ctx.translate(-W/2 + tx, -H/2 + ty);

  // Draw terrain
  ctx.drawImage(terrainCanvas, 0, 0);

  // Time-lapse shadow shift during 7-10s
  if (t > 7.5) {
    const tp = (t - 7.5) / 2.5;
    ctx.fillStyle = `rgba(0, 0, 20, ${tp * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();

  // --- ANALYST HUD & MEASUREMENT OVERLAYS ---

  // Vignette & Analyst grey grading
  const grad = ctx.createRadialGradient(W/2, H/2, 400, W/2, H/2, 1100);
  grad.addColorStop(0, 'rgba(10, 16, 14, 0.0)');
  grad.addColorStop(1, 'rgba(4, 6, 8, 0.85)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Top/Bottom UI framing
  ctx.fillStyle = 'rgba(8, 12, 10, 0.9)';
  ctx.fillRect(0, 0, W, 70);
  ctx.fillRect(0, 1010, W, 70);

  ctx.strokeStyle = '#4a7058';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 70); ctx.lineTo(W, 70);
  ctx.moveTo(0, 1010); ctx.lineTo(W, 1010);
  ctx.stroke();

  // Typography - System font, clean precision
  ctx.fillStyle = '#a0d0b0';
  ctx.font = '700 20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SAT-REC // SEC-49 // SRC: USGS-LANDSAT-8', 40, 42);

  ctx.textAlign = 'right';
  ctx.fillText('COORDS: 46.2218° N, 7.3521° E', W - 40, 42);

  ctx.textAlign = 'left';
  ctx.font = '16px monospace';
  ctx.fillStyle = '#609070';
  ctx.fillText('ELEVATION: 2,410M MSL   AZIMUTH: 184.2°   SUN ELEV: 42.8°', 40, 1048);

  const frameNum = Math.floor(t * 24);
  ctx.textAlign = 'right';
  ctx.fillText(`FRAME: #${String(frameNum).padStart(5, '0')}   TIME: 14:22:0${Math.floor(t)} UTC`, W - 40, 1048);

  // Measurement lines and target reticle (drawn when zoom settles t > 2.5)
  if (t > 2.0) {
    const alpha = Math.min(1, (t - 2.0) / 0.8);
    ctx.strokeStyle = `rgba(160, 240, 180, ${alpha * 0.85})`;
    ctx.lineWidth = 1.5;

    // Screen center corresponds to target in zoomed view
    const cx = W/2, cy = H/2;

    // Lock-on reticle brackets
    const sz = 80;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(cx - sz - 40, cy - sz); ctx.lineTo(cx - sz, cy - sz); ctx.lineTo(cx - sz, cy - sz - 40);
    // Top-right
    ctx.moveTo(cx + sz + 40, cy - sz); ctx.lineTo(cx + sz, cy - sz); ctx.lineTo(cx + sz, cy - sz - 40);
    // Bottom-left
    ctx.moveTo(cx - sz - 40, cy + sz); ctx.lineTo(cx - sz, cy + sz); ctx.lineTo(cx - sz, cy + sz + 40);
    // Bottom-right
    ctx.moveTo(cx + sz + 40, cy + sz); ctx.lineTo(cx + sz, cy + sz); ctx.lineTo(cx + sz, cy + sz + 40);
    ctx.stroke();

    // Crosshair ticks
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy); ctx.lineTo(cx - 5, cy);
    ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 15, cy);
    ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 15);
    ctx.stroke();

    // Range measurement line
    ctx.strokeStyle = `rgba(220, 180, 100, ${alpha * 0.9})`;
    ctx.beginPath();
    ctx.moveTo(cx - sz, cy + sz + 20);
    ctx.lineTo(cx + sz, cy + sz + 20);
    ctx.stroke();

    // Measurement ticks
    ctx.beginPath();
    ctx.moveTo(cx - sz, cy + sz + 15); ctx.lineTo(cx - sz, cy + sz + 25);
    ctx.moveTo(cx + sz, cy + sz + 15); ctx.lineTo(cx + sz, cy + sz + 25);
    ctx.moveTo(cx, cy + sz + 15); ctx.lineTo(cx, cy + sz + 25);
    ctx.stroke();

    // Dimension label
    ctx.fillStyle = `rgba(220, 180, 100, ${alpha})`;
    ctx.font = '15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPAN: 340.8m +/- 0.2m', cx, cy + sz + 45);

    // One claim / annotation per screen (Analyst note)
    ctx.fillStyle = `rgba(200, 230, 210, ${alpha})`;
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ANOMALY DETECTED: STRUCTURE REORIENTATION CONFIRMED', 120, 140);

    ctx.fillStyle = `rgba(120, 170, 140, ${alpha})`;
    ctx.font = '14px monospace';
    ctx.fillText('REF ID: #990-ALPHA   CONFIDENCE: 98.4%', 120, 166);
  }

  // Scanning line effect
  const scanY = (t * 220) % H;
  ctx.fillStyle = 'rgba(160, 240, 180, 0.03)';
  ctx.fillRect(0, scanY, W, 4);
}

window.DUR = 10;
window.render = draw;
window.READY = true;
