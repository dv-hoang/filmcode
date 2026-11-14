const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Deterministic white massing model geometry (building extrusions in 3D projected to 2D)
// Each block: { x, y, w, h, baseH, topH }
const BUILDINGS = [
  { cx: -180, cy: -60, hw: 65, hh: 55, h: 220 },
  { cx: -80, cy: 40, hw: 45, hh: 85, h: 180 },
  { cx: 80, cy: -90, hw: 70, hh: 60, h: 320 },
  { cx: 190, cy: -20, hw: 55, hh: 95, h: 260 },
  { cx: 0, cy: -10, hw: 50, hh: 50, h: 380 }, // central tower
  { cx: -130, cy: 120, hw: 90, hh: 40, h: 140 },
  { cx: 120, cy: 110, hw: 80, hh: 55, h: 190 },
  { cx: -240, cy: 60, hw: 45, hh: 110, h: 120 },
  { cx: 230, cy: -130, hw: 60, hh: 60, h: 240 }
];

// Roads / canals network
const PATHS = [
  [[-320, 0], [320, 0]],
  [[0, -180], [0, 180]],
  [[-280, 150], [280, -150]],
  [[-200, -150], [250, 150]]
];

function project(x, y, z) {
  // Isometric / axonometric tilt at rooftop height
  // Camera rotated & pitched
  const cosA = 0.866, sinA = 0.5;
  const rx = x * cosA - y * sinA;
  const ry = (x * sinA + y * cosA) * 0.5 - z * 0.86;
  return {
    px: W / 2 + rx * 2.2,
    py: H / 2 + 120 + ry * 2.2
  };
}

function drawModelFace(p1, p2, p3, p4, color) {
  ctx.beginPath();
  ctx.moveTo(p1.px, p1.py);
  ctx.lineTo(p2.px, p2.py);
  ctx.lineTo(p3.px, p3.py);
  ctx.lineTo(p4.px, p4.py);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawBuilding(b, tintColor, highlightRoof) {
  const z0 = 0;
  const z1 = b.h;
  
  // 4 corners of base and top
  const x1 = b.cx - b.hw, y1 = b.cy - b.hh;
  const x2 = b.cx + b.hw, y2 = b.cy - b.hh;
  const x3 = b.cx + b.hw, y3 = b.cy + b.hh;
  const x4 = b.cx - b.hw, y4 = b.cy + b.hh;

  const b1 = project(x1, y1, z0), b2 = project(x2, y1, z0);
  const b3 = project(x3, y3, z0), b4 = project(x4, y4, z0);

  const t1 = project(x1, y1, z1), t2 = project(x2, y1, z1);
  const t3 = project(x3, y3, z1), t4 = project(x4, y4, z1);

  // Side faces with distinct shading for 3D form
  // Front-left face (1-4-3-2 in 3D, or similar)
  drawModelFace(b4, b3, t3, t4, tintColor ? '#c0cbde' : '#eaf0f6');
  drawModelFace(b3, b2, t2, t3, tintColor ? '#9ab0d4' : '#d2dcea');

  // Roof
  ctx.beginPath();
  ctx.moveTo(t1.px, t1.py);
  ctx.lineTo(t2.px, t2.py);
  ctx.lineTo(t3.px, t3.py);
  ctx.lineTo(t4.px, t4.py);
  ctx.closePath();
  ctx.fillStyle = highlightRoof ? '#ffffff' : '#f4f7fb';
  ctx.fill();
  ctx.strokeStyle = highlightRoof ? 'rgba(120, 200, 255, 0.9)' : 'rgba(200, 210, 225, 0.6)';
  ctx.lineWidth = highlightRoof ? 2 : 1;
  ctx.stroke();
}

export function draw(t) {
  // 1. Dark room background with soft ambient vignette
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createRadialGradient(W/2, H/2 + 50, 100, W/2, H/2, 900);
  grad.addColorStop(0, '#151b28');
  grad.addColorStop(1, '#06080c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 2. Plinth / Wooden table base
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 80;
  ctx.beginPath();
  const pc1 = project(-420, -320, -20);
  const pc2 = project(420, -320, -20);
  const pc3 = project(420, 320, -20);
  const pc4 = project(-420, 320, -20);
  ctx.moveTo(pc1.px, pc1.py);
  ctx.lineTo(pc2.px, pc2.py);
  ctx.lineTo(pc3.px, pc3.py);
  ctx.lineTo(pc4.px, pc4.py);
  ctx.closePath();
  ctx.fillStyle = '#10141c';
  ctx.fill();
  ctx.strokeStyle = '#222b3c';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Draw Plinth Sides (depth)
  const pb1 = project(-420, 320, -20);
  const pb2 = project(420, 320, -20);
  const pb3 = project(420, 320, -120);
  const pb4 = project(-420, 320, -120);
  ctx.beginPath();
  ctx.moveTo(pb1.px, pb1.py);
  ctx.lineTo(pb2.px, pb2.py);
  ctx.lineTo(pb3.px, pb3.py);
  ctx.lineTo(pb4.px, pb4.py);
  ctx.closePath();
  ctx.fillStyle = '#080b10';
  ctx.fill();

  // 3. Base White Model (pure white massing model, matte gypsum look)
  BUILDINGS.forEach(b => {
    drawBuilding(b, false, false);
  });

  // 4. Projector light layers (timed progression across the 10s film)
  // Layer 1 (t: 1.5 - 4.0): Zoning / Density Heatmap Projection
  if (t > 1.5 && t < 9.5) {
    ctx.save();
    const layerAlpha = Math.min(1, (t - 1.5) * 1.5, (9.5 - t) * 1.5);
    ctx.globalAlpha = layerAlpha * 0.75;
    ctx.globalCompositeOperation = 'screen';

    // Projected soft beam wash over model area
    const beamGrad = ctx.createRadialGradient(W/2, H/2 - 50, 50, W/2, H/2, 600);
    beamGrad.addColorStop(0, 'rgba(50, 180, 255, 0.25)');
    beamGrad.addColorStop(0.5, 'rgba(255, 140, 60, 0.15)');
    beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(0, 0, W, H);

    // If t between 3.5 and 7.0: Sunlight / Shadow Analysis Layer (Solar simulation)
    if (t > 3.5 && t < 7.5) {
      const sunAngle = (t - 3.5) * 0.5;
      ctx.fillStyle = 'rgba(255, 230, 120, 0.45)';
      BUILDINGS.forEach(b => {
        const t2 = project(b.cx + Math.cos(sunAngle)*40, b.cy + Math.sin(sunAngle)*40, b.h);
        const b2 = project(b.cx, b.cy, b.h);
        ctx.beginPath();
        ctx.moveTo(b2.px, b2.py);
        ctx.lineTo(t2.px, t2.py);
        ctx.lineTo(t2.px + 60, t2.py + 30);
        ctx.lineTo(b2.px + 60, b2.py + 30);
        ctx.closePath();
        ctx.fill();
      });
    }

    // If t > 6.0: Data contours and floorplate layers
    if (t > 6.0) {
      ctx.strokeStyle = 'rgba(80, 255, 160, 0.8)';
      ctx.lineWidth = 1.5;
      BUILDINGS.forEach((b, idx) => {
        const pz = (Math.sin(t * 3 + idx) * 0.5 + 0.5) * b.h;
        const pt = project(b.cx, b.cy, pz);
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, b.hw * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    ctx.restore();
  }

  // 5. Editorial Data Graphics & Typography (Macro model photography overlay style)
  ctx.save();
  ctx.font = '14px monospace';
  ctx.letterSpacing = '2px';

  // Scale marker & Title in corner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('SCALE 1 : 1000 — SECTOR 4 URBAN MASSING', 80, 80);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '12px monospace';
  ctx.fillText('PROJECTION SOURCE: GIS_MODEL_v2.4 // 51.5074° N, 0.1278° W', 80, 105);

  // Active layer indicator (changes with time)
  let layerName = '01 // BASE TOPOGRAPHY';
  if (t > 3.0) layerName = '02 // SOLAR IRRADIANCE SIMULATION';
  if (t > 6.0) layerName = '03 // FLOORPLATE DENSITY MAPPING';
  if (t > 8.5) layerName = '04 // FINAL SYNTHESIS';

  ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
  ctx.fillText(`ACTIVE LAYER: ${layerName}`, 80, 980);

  // Projector spill framing lines (subtle cyan registration marks)
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, W - 120, H - 120);

  // Crosshairs
  const cx = W / 2, cy = H / 2 - 20;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy);
  ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15);
  ctx.stroke();

  // Fade in / out global envelope
  let fade = 1;
  if (t < 0.8) fade = t / 0.8;
  if (t > 9.2) fade = (10 - t) / 0.8;
  if (fade < 1) {
    ctx.fillStyle = `rgba(5, 7, 10, ${1 - fade})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

window.DUR = 10;
window.render = draw;
window.READY = true;
