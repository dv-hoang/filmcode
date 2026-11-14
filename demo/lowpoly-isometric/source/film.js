const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Color palette
const SKY_TOP = '#1c2838';
const SKY_BOT = '#3a506b';
const WATER_COLOR = '#264653';
const WATER_SHINE = '#2a9d8f';
const GRASS_TOP = '#52b788';
const GRASS_SIDE = '#2d6a4f';
const STONE_TOP = '#adb5bd';
const STONE_SIDE = '#6c757d';
const ROOF_RED = '#e76f51';
const ROOF_ORANGE = '#f4a261';
const GOLD = '#e9c46a';
const WOOD = '#b08968';
const WINDOW = '#e9c46a';

// Isometric projection: world (wx, wy, wz) -> screen (sx, sy)
const ISO_OX = W / 2;
const ISO_OY = 450;
const SCALE = 24;

function iso(x, y, z) {
  return {
    x: ISO_OX + (x - y) * SCALE * Math.SQRT1_2,
    y: ISO_OY + (x + y) * SCALE * 0.5 * Math.SQRT1_2 - z * SCALE
  };
}

// Helper: draw a low-poly quad or triangle with shading
function poly(pts, fillColor, strokeColor = null) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Draw a prism block (box or pillar)
function drawBlock(x, y, z, rx, ry, rz, topColor, side1Color, side2Color) {
  const p0 = iso(x, y, z);
  const p1 = iso(x + rx, y, z);
  const p2 = iso(x + rx, y + ry, z);
  const p3 = iso(x, y + ry, z);

  const t0 = iso(x, y, z + rz);
  const t1 = iso(x + rx, y, z + rz);
  const t2 = iso(x + rx, y + ry, z + rz);
  const t3 = iso(x, y + ry, z + rz);

  // Side 1 (Right)
  poly([p1, p2, t2, t1], side1Color, 'rgba(0,0,0,0.15)');
  // Side 2 (Left)
  poly([p3, p2, t2, t3], side2Color, 'rgba(0,0,0,0.2)');
  // Top
  poly([t0, t1, t2, t3], topColor, 'rgba(255,255,255,0.1)');
}

// Draw a slanted roof (pyramid or wedge)
function drawRoof(x, y, z, rx, ry, rz, color1, color2) {
  const t0 = iso(x, y, z);
  const t1 = iso(x + rx, y, z);
  const t2 = iso(x + rx, y + ry, z);
  const t3 = iso(x, y + ry, z);
  const peak = iso(x + rx / 2, y + ry / 2, z + rz);

  poly([t0, t1, peak], color1, 'rgba(0,0,0,0.15)');
  poly([t1, t2, peak], color2, 'rgba(0,0,0,0.2)');
  poly([t2, t3, peak], color1, 'rgba(0,0,0,0.15)');
  poly([t3, t0, peak], color2, 'rgba(0,0,0,0.15)');
}

// Draw a stylized low-poly tree
function drawTree(x, y, z, scale = 1, t = 0, index = 0) {
  const bounce = Math.sin(t * 4 + index * 1.5) * 0.05 * scale;
  const sz = scale;
  // Trunk
  drawBlock(x - 0.1, y - 0.1, z, 0.2, 0.2, 1.2 * sz, WOOD, '#8b5a2b', '#654321');
  // Foliage layers (cones approximated by blocks/octahedrons or stacked boxes)
  const fz = z + 1.2 * sz + bounce;
  drawBlock(x - 0.5 * sz, y - 0.5 * sz, fz, sz, sz, 1.2 * sz, '#2d6a4f', '#1b4332', '#081c15');
  drawBlock(x - 0.35 * sz, y - 0.35 * sz, fz + 1.0 * sz, sz * 0.7, sz * 0.7, sz * 1.0, '#40916c', '#2d6a4f', '#1b4332');
}

// Generate the island tiles configuration (deterministic)
const tiles = [];
for (let gx = -3; gx <= 3; gx++) {
  for (let gy = -3; gy <= 3; gy++) {
    const dist = Math.sqrt(gx * gx + gy * gy);
    if (dist <= 3.4) {
      // height based on distance and angle
      const baseH = Math.max(0, 3 - Math.floor(dist * 0.8));
      tiles.push({ x: gx, y: gy, z: baseH });
    }
  }
}

function draw(t) {
  ctx.clearRect(0, 0, W, H);

  // 1. Background gradient (sky)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, SKY_TOP);
  grad.addColorStop(1, SKY_BOT);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 2. Sun / Ambient Glow
  const sunPos = iso(0, 0, 8);
  const sunGrad = ctx.createRadialGradient(sunPos.x, sunPos.y - 100, 10, sunPos.x, sunPos.y - 100, 500);
  sunGrad.addColorStop(0, 'rgba(244, 162, 97, 0.35)');
  sunGrad.addColorStop(1, 'rgba(28, 40, 56, 0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, W, H);

  // 3. Water plane around island
  ctx.fillStyle = WATER_COLOR;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 600, H / 2 + 150);
  ctx.lineTo(W / 2 + 600, H / 2 + 150);
  ctx.lineTo(W / 2 + 800, H - 50);
  ctx.lineTo(W / 2 - 800, H - 50);
  ctx.closePath();
  ctx.fill();

  // Water shine waves moving
  ctx.strokeStyle = WATER_SHINE;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const wy = H / 2 + 200 + i * 50;
    const offset = Math.sin(t * 2 + i) * 30;
    ctx.moveTo(W / 2 - 400 + offset, wy);
    ctx.lineTo(W / 2 + 400 + offset, wy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // Camera subtle rotation / floating sway
  ctx.save();
  const swayX = Math.sin(t * 0.5) * 10;
  const swayZ = Math.cos(t * 0.4) * 0.05;
  ctx.translate(swayX, 0);

  // 4. Render Island Base Tiles (Sorted by isometric depth: x + y)
  // Animation: tiles rise up sequentially based on distance or time
  const sortedTiles = [...tiles].sort((a, b) => (a.x + a.y) - (b.x + b.y));

  sortedTiles.forEach((tile, idx) => {
    // Arrival pop-up animation in first 3 seconds
    const appearTime = idx * 0.05;
    const progress = Math.max(0, Math.min(1, (t - appearTime) / 0.5));
    // Bounce effect
    const bounce = Math.sin(progress * Math.PI * 1.5) * (1 - progress) * 1.5;
    const currentZ = (tile.z + bounce) * progress;

    if (progress > 0) {
      // Draw island column
      drawBlock(tile.x, tile.y, -2, 1, 1, currentZ + 2, GRASS_TOP, GRASS_SIDE, '#1b4332');

      // Add decorations (houses, trees, rocks) based on tile coordinates
      const seed = Math.sin(tile.x * 12.9898 + tile.y * 78.233);
      const isCenter = Math.abs(tile.x) <= 1 && Math.abs(tile.y) <= 1;

      if (isCenter && progress >= 1) {
        // Central Town Hall / Tower
        const bz = currentZ;
        drawBlock(tile.x + 0.1, tile.y + 0.1, bz, 0.8, 0.8, 1.8, STONE_TOP, STONE_SIDE, '#495057');
        // Roof
        drawRoof(tile.x + 0.1, tile.y + 0.1, bz + 1.8, 0.8, 0.8, 1.0, ROOF_RED, ROOF_ORANGE);
        // Golden spire / flag
        drawBlock(tile.x + 0.45, tile.y + 0.45, bz + 2.8, 0.1, 0.1, 0.8, GOLD, WOOD, WOOD);
      } else if (seed > 0.4 && progress >= 1 && !(tile.x === 0 && tile.y === 0)) {
        // Small House
        const bz = currentZ;
        const hColor = seed > 0.7 ? '#f4a261' : '#e9c46a';
        drawBlock(tile.x + 0.2, tile.y + 0.2, bz, 0.6, 0.6, 1.0, hColor, WOOD, '#8b5a2b');
        drawRoof(tile.x + 0.2, tile.y + 0.2, bz + 1.0, 0.6, 0.6, 0.8, ROOF_RED, ROOF_ORANGE);
      } else if (seed < -0.3 && progress >= 1) {
        // Tree
        drawTree(tile.x + 0.5, tile.y + 0.5, currentZ, 0.8, t, idx);
      }
    }
  });

  // 5. Floating Low-Poly Clouds
  const cloudOffset = t * 15;
  const cloudPositions = [
    { x: -5, y: -5, z: 7, s: 1.2 },
    { x: 4, y: -6, z: 8, s: 0.9 },
    { x: -3, y: 5, z: 9, s: 1.5 }
  ];

  cloudPositions.forEach((cl, i) => {
    const cx = cl.x + Math.sin(t * 0.3 + i) * 0.5;
    const cy = cl.y + (t * 0.2 + i * 2) % 10 - 5;
    const cp = iso(cx, cy, cl.z);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, 40 * cl.s, 0, Math.PI * 2);
    ctx.arc(cp.x + 30 * cl.s, cp.y - 10 * cl.s, 30 * cl.s, 0, Math.PI * 2);
    ctx.arc(cp.x - 35 * cl.s, cp.y - 5 * cl.s, 25 * cl.s, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();

  // 6. Title Overlay (Subtle, elegant typography matching isometric calm)
  if (t > 2.5 && t < 9.0) {
    const fade = Math.min(1, (t - 2.5) * 1.5, (9.0 - t) * 1.5);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#fefae0';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText('ISLANDIA', W / 2, H - 90);

    ctx.fillStyle = '#a3b18a';
    ctx.font = '18px sans-serif';
    ctx.fillText('A tiny faceted world in isometric space', W / 2, H - 50);
    ctx.restore();
  }
}

window.DUR = 10;
window.render = draw;
window.READY = true;
