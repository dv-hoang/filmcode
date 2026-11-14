const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Generate 4,000 deterministic LiDAR return points forming a ruined temple/citadel arch
const N_PTS = 3200;
const points = [];
for (let i = 0; i < N_PTS; i++) {
  // pseudo-random seed
  const s = i * 133.7;
  const nx = (Math.sin(s * 1.1) * 3.5);
  const nz = 1.0 + (Math.cos(s * 2.3) * 6.0) + (i / N_PTS) * 14.0; // depth
  const ny = (Math.sin(s * 3.7) * 2.2);
  
  // Arch geometry
  let x = nx * 1.8;
  let y = ny * 1.5;
  let z = nz + 4.0;
  
  // Create an arch structure in the center
  if (i < 2000) {
    const angle = (i / 2000) * Math.PI;
    x = Math.cos(angle) * 4.5;
    y = Math.sin(angle) * 4.5 - 1.0;
    z = 12.0 + (i % 5) * 0.4;
    if (y < -1.0) y = -1.0 + (Math.sin(i)*0.5);
  } else if (i < 2800) {
    // ground plane
    x = ((i % 40) - 20) * 0.4;
    y = -3.5 + (Math.sin(i * 0.5) * 0.2);
    z = 6.0 + ((i / 40) % 20) * 0.8;
  } else {
    // scattered canopy / debris
    x = (Math.sin(s) * 8.0);
    y = (Math.cos(s * 1.5) * 4.0);
    z = 5.0 + (Math.sin(s * 2.2) * 8.0);
  }
  
  points.push({
    x, y, z,
    baseY: y,
    intensity: 0.2 + 0.8 * Math.abs(Math.sin(i * 99.1))
  });
}

function draw(t) {
  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 0, W, H);

  // Camera fly-through z offset
  // 0 -> 10s: camera moves forward smoothly from z = 2 to z = 14
  const camZ = 2.0 + t * 1.1;
  const cutPlaneZ = 3.0 + t * 1.3; // Cutting plane advancing through space

  // Projection center
  const cx = W / 2;
  const cy = H / 2 + 50;
  const fov = 900;

  // Sort points by distance for painter's algorithm
  const renderList = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const dz = p.z - camZ;
    if (dz <= 0.2) continue; // behind camera

    const scale = fov / dz;
    const px = cx + p.x * scale;
    const py = cy - p.y * scale; // Y up

    if (px < -100 || px > W + 100 || py < -100 || py > H + 100) continue;

    // Height-based coloring (LiDAR palette: cyan/blue low, green mid, yellow/white high)
    const heightNorm = (p.y + 4.0) / 8.0; // 0 to 1
    
    // Cutting plane effect: points near cutPlaneZ glow bright cyan/white, others fade
    const distToCut = Math.abs(p.z - cutPlaneZ);
    const isCut = distToCut < 0.6;

    // Fade distance
    const alpha = Math.max(0.05, Math.min(1.0, 18.0 / dz));

    renderList.push({
      px, py, dz,
      intensity: p.intensity,
      heightNorm,
      isCut,
      distToCut,
      alpha
    });
  }

  // Sort back to front
  renderList.sort((a, b) => b.dz - a.dz);

  // Draw point cloud
  for (let i = 0; i < renderList.length; i++) {
    const pt = renderList[i];
    
    let color = '';
    let size = 1.5;

    if (pt.isCut) {
      // Cutting plane laser intersection line/glow
      color = `rgba(255, 255, 255, ${Math.min(1, pt.alpha * 1.5)})`;
      size = 3.2;
    } else {
      // Color map based on height
      const h = pt.heightNorm;
      if (h < 0.3) {
        // Deep returns (floor/base)
        color = `rgba(30, 144, 255, ${pt.alpha * 0.7})`;
      } else if (h < 0.7) {
        // Mid returns (structure)
        color = `rgba(0, 230, 138, ${pt.alpha * 0.8})`;
      } else {
        // High returns (arch vault)
        color = `rgba(255, 200, 60, ${pt.alpha * 0.9})`;
      }
    }

    ctx.fillStyle = color;
    ctx.fillRect(pt.px - size/2, pt.py - size/2, size, size);
  }

  // Draw cutting plane grid / scan line overlay in 3D perspective
  ctx.strokeStyle = 'rgba(0, 255, 200, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const cpScale = fov / (cutPlaneZ - camZ);
  if (cpScale > 0) {
    const cpScreenY = cy;
    ctx.arc(cx, cpScreenY, 6.0 * cpScale, 0, Math.PI * 2);
  }
  ctx.stroke();

  // HUD / UI Overlays (LiDAR Survey Instrumentation)
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(0, 255, 200, 0.7)';
  ctx.fillText(`SITE: SECTOR-9 RUIN // APEX ARCH`, 40, 50);
  ctx.fillText(`SCAN LINE: Z +${cutPlaneZ.toFixed(3)}m`, 40, 80);
  ctx.fillText(`RETURN COUNT: ${N_PTS} pts`, 40, 110);
  ctx.fillText(`ELEVATION RANGE: -4.2m / +4.8m`, 40, 140);
  ctx.fillText(`TIME: 00:0${t.toFixed(1)}s`, W - 220, 50);

  // Crosshairs / measurement markers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, 100); ctx.lineTo(cx, H - 100);
  ctx.moveTo(100, cy); ctx.lineTo(W - 100, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Title card fade in/out
  if (t > 1.0 && t < 4.0) {
    const alpha = Math.min(1, (t - 1.0) * 2, (4.0 - t) * 2);
    ctx.fillStyle = `rgba(5, 6, 8, ${alpha * 0.85})`;
    ctx.fillRect(W/2 - 350, H/2 - 70, 700, 140);
    ctx.strokeStyle = `rgba(0, 255, 200, ${alpha * 0.6})`;
    ctx.strokeRect(W/2 - 350, H/2 - 70, 700, 140);

    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.font = 'bold 28px monospace';
    ctx.fillText('AERIAL LiDAR SURVEY', W/2, H/2 - 15);
    ctx.font = '16px monospace';
    ctx.fillStyle = `rgba(0, 255, 200, ${alpha})`;
    ctx.fillText('POINT CLOUD DENSITY ANALYSIS // SECTOR 9', W/2, H/2 + 25);
  }

  // End card
  if (t > 8.0) {
    const alpha = Math.min(1, (t - 8.0) * 2);
    ctx.fillStyle = `rgba(5, 6, 8, ${alpha * 0.95})`;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.font = 'bold 36px monospace';
    ctx.fillText('SURVEY COMPLETE', W/2, H/2 - 20);
    ctx.font = '18px monospace';
    ctx.fillStyle = `rgba(0, 255, 200, ${alpha})`;
    ctx.fillText('3,200 RETURNS RECORDED. MESH RECONSTRUCTION READY.', W/2, H/2 + 30);
  }
}

window.DUR = 10;
window.render = draw;
window.READY = true;
