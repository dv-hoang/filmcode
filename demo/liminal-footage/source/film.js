// LIMINAL FOOTAGE: 1990s VHS Camcorder in Endless Office Corridor
const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const smoothstep = (a, b, t) => {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const noise = (x, y) => {
  return Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1;
};

function draw(time) {
  ctx.fillStyle = '#050705';
  ctx.fillRect(0, 0, W, H);

  // VHS jitter & tracking distortion
  const shakeX = (Math.sin(time * 35) * 2 + (Math.random() - 0.5) * 3) * (time > 0.5 ? 1 : 0);
  const shakeY = (Math.cos(time * 28) * 2 + (Math.random() - 0.5) * 2);
  
  ctx.save();
  ctx.translate(shakeX, shakeY);

  // 1. Perspective Corridor (Endless yellow-tinted commercial carpet & acoustic tile ceiling)
  // Vanishing point
  const vpX = W / 2 + Math.sin(time * 0.4) * 40;
  const vpY = H * 0.44 + Math.cos(time * 0.3) * 20;

  // Floor (carpeting pattern / tiles)
  const gradFloor = ctx.createLinearGradient(0, vpY, 0, H);
  gradFloor.addColorStop(0, '#2b2416');
  gradFloor.addColorStop(1, '#18120a');
  ctx.fillStyle = gradFloor;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(W, H);
  ctx.lineTo(vpX + 40, vpY);
  ctx.lineTo(vpX - 40, vpY);
  ctx.closePath();
  ctx.fill();

  // Floor tile lines rushing toward camera
  ctx.strokeStyle = '#3a301e';
  ctx.lineWidth = 2;
  const offset = (time * 3.5) % 1;
  for (let i = -15; i <= 15; i++) {
    const depthFrac = ((i + offset + 15) % 15) / 15;
    const y = vpY + (H - vpY) * Math.pow(depthFrac, 1.8);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Ceiling
  const gradCeil = ctx.createLinearGradient(0, 0, 0, vpY);
  gradCeil.addColorStop(0, '#101112');
  gradCeil.addColorStop(1, '#242522');
  ctx.fillStyle = gradCeil;
  ctx.fillRect(0, 0, W, vpY);

  // Fluorescent lights flickering overhead
  for (let i = 0; i < 5; i++) {
    const lightZ = (i * 250 - (time * 180) % 250);
    if (lightZ > 0 && lightZ < 1000) {
      const scale = 300 / lightZ;
      const lx = vpX + (0) * scale;
      const ly = vpY * 0.3 * scale;
      const lw = 300 * scale;
      const lh = 20 * scale;
      
      const flicker = Math.sin(time * 60 + i * 13) > -0.6 ? 1 : 0.2;
      ctx.fillStyle = `rgba(255, 255, 220, ${flicker * Math.min(1, scale * 0.5)})`;
      ctx.fillRect(lx - lw/2, ly - lh/2, lw, lh);

      // Light glow beam down corridor
      ctx.fillStyle = `rgba(255, 255, 200, ${0.04 * flicker})`;
      ctx.beginPath();
      ctx.moveTo(lx - lw*0.5, ly);
      ctx.lineTo(lx + lw*0.5, ly);
      ctx.lineTo(W * 0.8, H);
      ctx.lineTo(W * 0.2, H);
      ctx.fill();
    }
  }

  // Walls (repetitive wallpaper / partitions)
  const wallGradL = ctx.createLinearGradient(0, 0, vpX, 0);
  wallGradL.addColorStop(0, '#594928');
  wallGradL.addColorStop(1, '#3b311a');
  ctx.fillStyle = wallGradL;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(vpX - 40, vpY);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  const wallGradR = ctx.createLinearGradient(W, 0, vpX, 0);
  wallGradR.addColorStop(0, '#4a3d20');
  wallGradR.addColorStop(1, '#3b311a');
  ctx.fillStyle = wallGradR;
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(vpX + 40, vpY);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Vertical wall pillars / door frames flashing past
  ctx.strokeStyle = '#221b0e';
  ctx.lineWidth = 12;
  const pOffset = (time * 2.5) % 2;
  for (let p = -5; p <= 5; p++) {
    const pZ = p - pOffset;
    if (pZ > 0 && pZ < 4) {
      const xLeft = vpX - (vpX + 200) / pZ;
      const xRight = vpX + (W - vpX + 200) / pZ;
      const topY = vpY - (vpY - 0) / pZ;
      
      ctx.beginPath();
      ctx.moveTo(xLeft, topY);
      ctx.lineTo(xLeft, H);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xRight, topY);
      ctx.lineTo(xRight, H);
      ctx.stroke();
    }
  }

  // Ambient green/yellow vignette & fog
  const fog = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.9);
  fog.addColorStop(0, 'rgba(30, 35, 15, 0)');
  fog.addColorStop(1, 'rgba(10, 15, 5, 0.75)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();

  // --- 1990s CAMCORDER OSD (On-Screen Display) ---
  ctx.save();
  const fontMain = "36px 'Courier New', monospace";
  ctx.font = fontMain;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;

  // REC indicator blinking
  if (Math.floor(time * 2) % 2 === 0) {
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.arc(100, 90, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('REC', 130, 102);
  }

  // Timecode & Date
  const hours = Math.floor(time / 3600).toString().padStart(2, '0');
  const mins = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
  const secs = Math.floor(time % 60).toString().padStart(2, '0');
  const frames = Math.floor((time % 1) * 30).toString().padStart(2, '0');
  ctx.fillText(`SP  ${hours}:${mins}:${secs}:${frames}`, 100, 170);

  ctx.fillText('OCT 14 1998', W - 380, 102);
  ctx.fillText('SECTOR 4-G', W - 380, 170);

  // Battery indicator icon top-right
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(W - 160, 210, 80, 36);
  ctx.fillRect(W - 74, 220, 10, 16);
  ctx.fillStyle = time > 5 ? '#ff4444' : '#44ff44';
  ctx.fillRect(W - 154, 216, 50 * (1 - time/10), 24);

  // --- VHS SCANLINES & NOISE ---
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 2);
  }

  // Random horizontal tracking glitch bar
  if (Math.sin(time * 11) > 0.82) {
    const gy = (Math.sin(time * 43) * 0.5 + 0.5) * H;
    const gh = 20 + Math.sin(time * 19) * 15;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, gy, W, gh);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, gy + 5, W, gh - 10);
  }

  // Subtle vignette edge darkening
  const vignette = ctx.createRadialGradient(W/2, H/2, H*0.4, W/2, H/2, H*0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}

window.DUR = 10;
window.render = draw;
window.READY = true;
