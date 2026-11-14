const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Deterministic random and noise generator
const hash = (x, y) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
};

// Procedural texture maps generated once
const boardCanvas = document.createElement('canvas');
boardCanvas.width = W; boardCanvas.height = H;
const bCtx = boardCanvas.getContext('2d');

function initBoard() {
  // Enamel base
  bCtx.fillStyle = '#f3f4f6';
  bCtx.fillRect(0, 0, W, H);
  
  // Subtle enamel grain & stains
  for (let y = 0; y < H; y += 4) {
    for (let x = 0; x < W; x += 4) {
      const h = hash(x, y);
      if (h > 0.82) {
        bCtx.fillStyle = h > 0.95 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.15)';
        bCtx.fillRect(x, y, 4, 4);
      }
    }
  }

  // Ghost marks of erased previous diagrams (subtle cyan/magenta smudges)
  bCtx.strokeStyle = 'rgba(200, 70, 60, 0.08)';
  bCtx.lineWidth = 3;
  bCtx.beginPath();
  bCtx.arc(500, 300, 180, 0, Math.PI * 2);
  bCtx.moveTo(800, 600); bCtx.lineTo(1200, 200);
  bCtx.stroke();

  bCtx.strokeStyle = 'rgba(40, 120, 180, 0.07)';
  bCtx.lineWidth = 2;
  bCtx.strokeRect(1000, 500, 350, 220);

  // Board frame (aluminum profile with soft shadow)
  const fw = 16;
  bCtx.fillStyle = '#d1d5db';
  bCtx.fillRect(0, 0, W, fw);
  bCtx.fillRect(0, H - fw, W, fw);
  bCtx.fillRect(0, 0, fw, H);
  bCtx.fillRect(W - fw, 0, fw, H);

  // Inner frame highlight & shadow
  bCtx.fillStyle = 'rgba(0,0,0,0.15)';
  bCtx.fillRect(fw, fw, W - fw*2, 6);
  bCtx.fillRect(fw, fw, 6, H - fw*2);
  bCtx.fillStyle = 'rgba(255,255,255,0.7)';
  bCtx.fillRect(fw, H - fw - 6, W - fw*2, 6);
  bCtx.fillRect(W - fw - 6, fw, 6, H - fw*2);

  // Marker tray at bottom
  bCtx.fillStyle = '#9ca3af';
  bCtx.fillRect(200, H - fw - 28, W - 400, 28);
  bCtx.fillStyle = '#4b5563';
  bCtx.fillRect(200, H - fw - 28, W - 400, 4);
}
initBoard();

// Helper: draw a photograph with drop shadow, white border, and pin/magnet
function drawPhoto(ctx, x, y, w, h, angle, imgDrawFn, label, pinColor = '#dc2626') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 12;

  // White polaroid / photo paper border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-w/2 - 12, -h/2 - 12, w + 24, h + 36);

  // Reset shadow for inner photo
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Inner photo area background
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(-w/2, -h/2, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(-w/2, -h/2, w, h);
  ctx.clip();
  imgDrawFn(ctx, w, h);
  ctx.restore();

  // Caption label
  if (label) {
    ctx.fillStyle = '#1f2937';
    ctx.font = '14px Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, h/2 + 18);
  }

  // Pin / magnet at top center
  ctx.fillStyle = pinColor;
  ctx.beginPath();
  ctx.arc(0, -h/2 - 16, 7, 0, Math.PI * 2);
  ctx.fill();
  // Pin highlight
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(-2, -h/2 - 18, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Photo contents generators
function drawVesselPhoto(ctx, w, h) {
  // Hull profile / submersible hull diagram
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(w*0.5, h*0.5, w*0.35, h*0.22, 0, 0, Math.PI*2);
  ctx.stroke();
  // Interior compartment lines
  ctx.beginPath();
  ctx.moveTo(w*0.2, h*0.5); ctx.lineTo(w*0.8, h*0.5);
  ctx.moveTo(w*0.4, h*0.28); ctx.lineTo(w*0.4, h*0.72);
  ctx.moveTo(w*0.6, h*0.28); ctx.lineTo(w*0.6, h*0.72);
  ctx.stroke();
}

function drawSeafloorPhoto(ctx, w, h) {
  // Sonar / bathymetric scan lines
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    let y0 = h * (0.2 + i * 0.08);
    ctx.moveTo(0, y0);
    for (let x = 0; x < w; x += 10) {
      let dy = y0 + Math.sin(x * 0.04 + i) * 12 + Math.cos(x * 0.02) * 8;
      ctx.lineTo(x, dy);
    }
    ctx.stroke();
  }
}

function drawAnomalyPhoto(ctx, w, h) {
  // High contrast thermal anomaly / wreckage fragment
  ctx.fillStyle = '#311010';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(w*0.5, h*0.5, w*0.25, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Crosshairs
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w*0.5, 0); ctx.lineTo(w*0.5, h);
  ctx.moveTo(0, h*0.5); ctx.lineTo(w, h*0.5);
  ctx.stroke();
}

// Draw animated marker stroke (progress 0..1)
function drawStroke(ctx, points, color, width, progress) {
  if (points.length < 2 || progress <= 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let totalDist = 0;
  const dists = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i-1].x;
    const dy = points[i].y - points[i-1].y;
    const d = Math.hypot(dx, dy);
    totalDist += d;
    dists.push(totalDist);
  }

  const targetDist = totalDist * Math.min(1, Math.max(0, progress));
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  let currentD = 0;
  for (let i = 1; i < points.length; i++) {
    const dPrev = dists[i-1];
    const dCurr = dists[i];
    if (targetDist >= dCurr) {
      ctx.lineTo(points[i].x, points[i].y);
    } else {
      const surplus = targetDist - dPrev;
      const segLen = dCurr - dPrev;
      if (segLen > 0) {
        const t = surplus / segLen;
        const lx = points[i-1].x + (points[i].x - points[i-1].x) * t;
        const ly = points[i-1].y + (points[i].y - points[i-1].y) * t;
        ctx.lineTo(lx, ly);
      }
      break;
    }
  }
  ctx.stroke();
  ctx.restore();
}

// Helper easing
const easeOutQuad = t => t * (2 - t);
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function draw(t) {
  ctx.clearRect(0, 0, W, H);

  // Camera animation / zoom & pan states across 10 seconds
  // 0-3s: Wide board overview & Title
  // 3-6.5s: Zoom into Photo 1 (Vessel) & Blue marker lines
  // 6.5-10s: Pull back & pan right to Anomaly & Red marker lines, final overview
  
  let camZoom = 1.0;
  let camX = 0;
  let camY = 0;

  if (t >= 3.0 && t < 6.5) {
    const p = easeInOutCubic((t - 3.0) / 3.5);
    camZoom = 1.0 + p * 0.55; // zoom in 1.55x
    camX = p * 380;
    camY = p * 120;
  } else if (t >= 6.5) {
    const p = easeInOutCubic((t - 6.5) / 3.5);
    camZoom = 1.55 - p * 0.55; // pull back to 1.0
    camX = 380 - p * 380;
    camY = 120 - p * 120;
  }

  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(camZoom, camZoom);
  ctx.translate(-W/2 - camX, -H/2 - camY);

  // Draw background board texture
  ctx.drawImage(boardCanvas, 0, 0);

  // Header Title plate pinned at top center
  ctx.save();
  ctx.translate(W/2, 60);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillRect(-280, -28, 560, 56);
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1;
  ctx.strokeRect(-280, -28, 560, 56);
  
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 22px Courier, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OPERATION DEEPSEEK // BRIEFING 04', 0, 0);
  
  // Pin
  ctx.fillStyle = '#2563eb';
  ctx.beginPath(); ctx.arc(0, -28, 6, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // --- PHOTOS ---
  // Photo 1: Vessel (Left)
  const p1Appear = Math.min(1, t / 1.2);
  if (p1Appear > 0) {
    drawPhoto(ctx, 420, 360, 320, 220, -0.03, drawVesselPhoto, 'FIG 1. SUBMERSIBLE HULL', '#2563eb');
  }

  // Photo 2: Seafloor (Center)
  const p2Appear = Math.min(1, Math.max(0, (t - 1.5) / 1.2));
  if (p2Appear > 0) {
    drawPhoto(ctx, 960, 340, 340, 220, 0.02, drawSeafloorPhoto, 'FIG 2. BATHYMETRIC SCAN', '#16a34a');
  }

  // Photo 3: Anomaly (Right)
  const p3Appear = Math.min(1, Math.max(0, (t - 2.2) / 1.2));
  if (p3Appear > 0) {
    drawPhoto(ctx, 1500, 380, 300, 200, -0.01, drawAnomalyPhoto, 'FIG 3. SECTOR 7 ANOMALY', '#dc2626');
  }

  // --- HAND-DRAWN MARKER ANNOTATIONS ---
  // Blue marker lines connecting Vessel to Seafloor
  const line1Progress = Math.min(1, Math.max(0, (t - 3.2) / 1.5));
  const bluePoints = [
    {x: 590, y: 360},
    {x: 650, y: 220},
    {x: 800, y: 200},
    {x: 880, y: 280}
  ];
  drawStroke(ctx, bluePoints, '#1d4ed8', 4, line1Progress);

  // Dimension / annotation text in blue ink
  if (line1Progress > 0.5) {
    ctx.save();
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'italic 18px Courier, monospace';
    ctx.fillText('max depth 4,200m', 680, 190);
    ctx.restore();
  }

  // Green marker underline and notes on Bathymetric scan
  const line2Progress = Math.min(1, Math.max(0, (t - 5.0) / 1.5));
  const greenPoints = [
    {x: 800, y: 480},
    {x: 960, y: 520},
    {x: 1120, y: 480}
  ];
  drawStroke(ctx, greenPoints, '#15803d', 4, line2Progress);

  if (line2Progress > 0.5) {
    ctx.save();
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 18px Courier, monospace';
    ctx.fillText('TARGET CORRIDOR VERIFIED', 880, 550);
    ctx.restore();
  }

  // Red marker circle & arrow on Anomaly
  const line3Progress = Math.min(1, Math.max(0, (t - 7.0) / 1.8));
  const redPoints = [
    {x: 1380, y: 320},
    {x: 1440, y: 280},
    {x: 1500, y: 320},
    {x: 1440, y: 360},
    {x: 1380, y: 320},
    {x: 1350, y: 240}
  ];
  drawStroke(ctx, redPoints, '#b91c1c', 5, line3Progress);

  if (line3Progress > 0.6) {
    ctx.save();
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 20px Courier, monospace';
    ctx.fillText('!! PRIORITY OBJECT', 1250, 220);
    ctx.restore();
  }

  // Ruler graphic pinned diagonally across lower board
  ctx.save();
  ctx.translate(350, 800);
  ctx.rotate(0.05);
  ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 8;
  ctx.fillRect(-200, -18, 400, 36);
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1;
  ctx.strokeRect(-200, -18, 400, 36);
  // Ruler ticks
  ctx.fillStyle = '#713f12';
  for (let x = -180; x <= 180; x += 20) {
    ctx.fillRect(x, -18, 2, 10);
  }
  ctx.restore();

  // Sticky yellow note in corner
  ctx.save();
  ctx.translate(1600, 820);
  ctx.rotate(0.08);
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 6;
  ctx.fillRect(-120, -100, 240, 200);
  ctx.fillStyle = '#713f12';
  ctx.font = '16px Courier, monospace';
  ctx.fillText('CONFIDENTIAL', -100, -60);
  ctx.font = '14px Courier, monospace';
  ctx.fillText('Clearance: Lvl 4', -100, -20);
  ctx.fillText('Team Alpha ready', -100, 10);
  ctx.fillText('for deployment.', -100, 35);
  ctx.restore();

  ctx.restore(); // restore camera zoom/pan

  // Vignette / physical room falloff overlay
  const grad = ctx.createRadialGradient(W/2, H/2, H*0.4, W/2, H/2, H*0.9);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

window.DUR = 10;
window.render = draw;
window.READY = true;
