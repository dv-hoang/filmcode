const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const C = {
  sky: '#0f1722',
  skyGradTop: '#152238',
  skyGradBot: '#0f1722',
  soil: '#251c14',
  soilFace: '#1e1610',
  soilSide: '#15100a',
  soilDeep: '#100c07',
  grass: '#3b7a57',
  grassTop: '#4e9a68',
  grassSide: '#2e5f43',
  concrete: '#737a85',
  concreteSide: '#585e68',
  concreteFace: '#878f9c',
  steel: '#a0aab8',
  steelSide: '#788290',
  glass: '#63b3ed',
  glassSide: '#3182ce',
  amber: '#f6ad55',
  yellow: '#ecc94b',
  red: '#fc8181',
  green: '#68d391',
  white: '#f7fafc',
  dimWhite: '#a0aec0',
  orange: '#dd6b20',
  blue: '#4299e1',
  grid: 'rgba(255,255,255,0.08)'
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const smooth = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;

// Isometric projection helper: iso(gx, gy, gz) -> {x, y}
// Center origin at cx, cy
const CX = 960, CY = 420;
const TW = 64, TH = 32; // tile width and height in iso

function iso(gx, gy, gz = 0) {
  const x = CX + (gx - gy) * (TW / 2);
  const y = CY + (gx + gy) * (TH / 2) - gz * TH;
  return { x, y };
}

// Draw polygon with stroke
function poly(pts, fill, stroke = null, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

// Draw an isometric block from grid bounds
function isoBlock(x, y, z, w, d, h, topColor, leftColor, rightColor) {
  const p0 = iso(x, y, z + h);
  const p1 = iso(x + w, y, z + h);
  const p2 = iso(x + w, y + d, z + h);
  const p3 = iso(x, y + d, z + h);

  const pb0 = iso(x, y, z);
  const pb1 = iso(x + w, y, z);
  const pb2 = iso(x + w, y + d, z);
  const pb3 = iso(x, y + d, z);

  // Right face (y+d edge)
  if (rightColor) {
    poly([p3, p2, pb2, pb3], rightColor);
  }
  // Left face (x+w edge)
  if (leftColor) {
    poly([p1, p2, pb2, pb1], leftColor);
  }
  // Top face
  if (topColor) {
    poly([p0, p1, p2, p3], topColor);
  }
}

// Draw floating isometric cylinder / tree crown
function isoTree(gx, gy, gz, scale = 1, progress = 1) {
  const h = 2.5 * scale * progress;
  const r = 0.8 * scale * progress;
  const base = iso(gx, gy, gz);
  const top = iso(gx, gy, gz + h);

  // Trunk
  isoBlock(gx - 0.15, gy - 0.15, gz, 0.3, 0.3, h * 0.5, '#7b341e', '#5a2514', '#9c4221');

  // Foliage blob (isometric sphere approximation)
  ctx.save();
  ctx.beginPath();
  const cp = iso(gx, gy, gz + h * 0.75);
  ctx.ellipse(cp.x, cp.y, r * TW * 0.8, r * TH * 1.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = C.green;
  ctx.fill();
  ctx.strokeStyle = '#276749';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function draw(t) {
  ctx.clearRect(0, 0, W, H);

  // Background gradient sky
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, C.skyGradTop);
  bgGrad.addColorStop(1, C.skyGradBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle background grid lines (isometric grid in sky)
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = -10; i <= 10; i += 2) {
    const p1 = iso(i, -10, 0);
    const p2 = iso(i, 10, 0);
    // only draw if near screen
    if (p1.y > -200 && p1.y < H + 200) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y - 300);
      ctx.lineTo(p2.x, p2.y - 300);
      ctx.stroke();
    }
  }

  // --- SCENE PHASES ---
  // t: 0 -> 10 seconds
  // Phase 1 (0 - 2.5s): Title & Earth System Diorama appears from soil up
  // Phase 2 (2.5 - 5.5s): Carbon flux zoom & industrial emission flow
  // Phase 3 (5.5 - 8.0s): Ecosystem absorption & Isotype counts
  // Phase 4 (8.0 - 10.0s): Conclusion & Balance indicator

  const p1 = smooth(clamp(t / 2.0, 0, 1));
  const p2 = smooth(clamp((t - 2.2) / 2.0, 0, 1));
  const p3 = smooth(clamp((t - 5.0) / 2.0, 0, 1));
  const p4 = smooth(clamp((t - 7.8) / 2.0, 0, 1));

  // Camera shift / zoom over time
  ctx.save();
  let zoom = lerp(0.9, 1.05, t / 10);
  let panY = lerp(0, -40, t / 10);
  if (t > 2.2 && t <= 5.5) {
    zoom = lerp(1.05, 1.25, easeOut((t - 2.2) / 3.3));
    panY = lerp(-40, -80, easeOut((t - 2.2) / 3.3));
  } else if (t > 5.5) {
    zoom = lerp(1.25, 1.1, easeOut((t - 5.5) / 4.5));
    panY = lerp(-80, -30, easeOut((t - 5.5) / 4.5));
  }

  ctx.translate(CX, CY + panY);
  ctx.scale(zoom, zoom);
  ctx.translate(-CX, -(CY + panY));

  // --- DRAW SOIL STRATA (Cutaway Diorama) ---
  const soilDepth = p1 * 5; // grows from 0 to 5 depth
  
  // Soil bottom block / strata layers
  for (let sz = -soilDepth; sz <= 0; sz += 1) {
    const layerColorTop = sz === 0 ? C.soil : (sz > -3 ? '#1e1610' : '#140f0a');
    const layerColorLeft = sz > -3 ? '#16100b' : '#0d0a06';
    const layerColorRight = sz > -3 ? '#19120c' : '#0f0b07';
    
    // 8x8 base plate
    // We only render if within current build depth
    if (-sz <= soilDepth) {
      isoBlock(-4, -4, sz, 8, 8, 1, layerColorTop, layerColorLeft, layerColorRight);
    }
  }

  // --- SURFACE TILE GRID & GRASS ---
  if (p1 > 0.5) {
    for (let gx = -4; gx < 4; gx++) {
      for (let gy = -4; gy < 4; gy++) {
        // Check if inside island radius
        if (Math.abs(gx) + Math.abs(gy) < 6) {
          const isRoad = (gx === 0 || gy === 0);
          const topC = isRoad ? C.concrete : C.grassTop;
          const leftC = isRoad ? C.concreteSide : C.grassSide;
          const rightC = isRoad ? '#4a5568' : '#274b37';
          
          isoBlock(gx, gy, 0, 1, 1, 0.2, topC, leftC, rightC);
        }
      }
    }
  }

  // --- BUILDINGS & NATURE ---
  // Forest on left quadrant
  if (p1 > 0.8) {
    isoTree(-2, -2, 0.2, 1.2, p1);
    isoTree(-3, -1, 0.2, 1.0, p1);
    isoTree(-2, -3, 0.2, 0.9, p1);
    isoTree(-1, -2, 0.2, 1.1, p1);
  }

  // Industrial factory on right quadrant (Emitting carbon)
  if (p1 > 0.8) {
    // Factory base
    isoBlock(1, 1, 0.2, 2, 2, 1.2, C.concrete, C.concreteSide, '#4a5568');
    // Smokestacks
    isoBlock(1.5, 1.5, 1.4, 0.4, 0.4, 2.0 * p2, C.steel, C.steelSide, '#5a6578');
    isoBlock(2.3, 1.8, 1.4, 0.3, 0.3, 1.5 * p2, C.steel, C.steelSide, '#5a6578');
  }

  // City buildings center-front
  if (p1 > 0.8) {
    isoBlock(-1, 1, 0.2, 1, 1, 1.8, C.blue, '#2b6cb0', '#3182ce');
    isoBlock(0, 2, 0.2, 1, 1, 2.4, '#ed8936', '#c05621', '#dd6b20');
  }

  // --- ANIMATED PARTICLES: CARBON FLUX (CO2 Emissions & Absorption) ---
  if (t > 2.0) {
    const flowT = (t - 2.0);
    const particleCount = 14;
    
    for (let i = 0; i < particleCount; i++) {
      const pt = (flowT * 0.8 + i * 0.15) % 2.0; // loop 0 to 2
      const alpha = Math.sin(pt * Math.PI);
      
      // Emission from smokestack (1.7, 1.7, 3.4) drifting left-upward into sky
      const startX = 1.7, startY = 1.7, startZ = 3.4;
      const endX = lerp(startX, -3.0, pt * 0.5);
      const endY = lerp(startY, -3.0, pt * 0.5);
      const endZ = lerp(startZ, startZ + 4.0 + (i % 3), pt * 0.5);
      
      const pos = iso(endX, endY, endZ);
      
      ctx.save();
      ctx.globalAlpha = clamp(alpha * 1.2, 0, 0.8);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lerp(4, 12, pt * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? C.amber : C.red;
      ctx.fill();
      ctx.restore();
    }

    // Absorption green arrows/particles flowing down into forest (-2, -2)
    for (let i = 0; i < 8; i++) {
      const at = ((flowT * 1.2 + i * 0.25) % 1.5);
      const pos = iso(-2, -2, lerp(3.0, 0.5, at));
      ctx.save();
      ctx.globalAlpha = clamp(Math.sin(at * Math.PI) * 0.9, 0, 1);
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore(); // Restore camera transform for UI overlay

  // --- INFOGRAPHIC UI & ISOTYPE LABELS (Fixed Screen Space) ---

  // Title Banner (Top Left)
  if (t > 0.5) {
    const alpha = smooth(clamp((t - 0.5) / 0.8, 0, 1));
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Category tag
    ctx.fillStyle = C.amber;
    ctx.font = 'bold 14px monospace';
    ctx.letterSpacing = '3px';
    ctx.fillText('GLOBAL CARBON CYCLE // DIORAMA V.04', 80, 80);

    // Main Title
    ctx.fillStyle = C.white;
    ctx.font = 'bold 42px sans-serif';
    ctx.letterSpacing = '0px';
    ctx.fillText('Atmospheric Flux & Sink', 80, 130);

    // Subtitle rule
    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 155);
    ctx.lineTo(380, 155);
    ctx.stroke();

    ctx.restore();
  }

  // Step 1 callout: Industrial Source (t: 2.5 - 5.0)
  if (t > 2.5 && t < 5.8) {
    const alpha = smooth(clamp((t - 2.5) / 0.5, 0, 1)) * (t > 5.2 ? smooth(clamp((5.8 - t) / 0.6, 0, 1)) : 1);
    ctx.save();
    ctx.globalAlpha = alpha;

    // Callout box right side
    const bx = W - 480, by = 200, bw = 400, bh = 140;
    ctx.fillStyle = 'rgba(15, 23, 34, 0.85)';
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = C.red;
    ctx.font = 'bold 16px monospace';
    ctx.fillText('01 // ANTHROPOGENIC EMISSION', bx + 24, by + 35);

    ctx.fillStyle = C.white;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('+37.4 Gigatons / yr', bx + 24, by + 75);

    ctx.fillStyle = C.dimWhite;
    ctx.font = '16px monospace';
    ctx.fillText('Fossil combustion & industrial output', bx + 24, by + 108);

    ctx.restore();
  }

  // Step 2 callout: Forest Sink (t: 5.5 - 8.2)
  if (t > 5.5 && t < 8.5) {
    const alpha = smooth(clamp((t - 5.5) / 0.5, 0, 1)) * (t > 8.0 ? smooth(clamp((8.5 - t) / 0.5, 0, 1)) : 1);
    ctx.save();
    ctx.globalAlpha = alpha;

    const bx = 80, by = 750, bw = 420, bh = 140;
    ctx.fillStyle = 'rgba(15, 23, 34, 0.85)';
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = C.green;
    ctx.font = 'bold 16px monospace';
    ctx.fillText('02 // BIOSPHERIC SINK', bx + 24, by + 35);

    ctx.fillStyle = C.white;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('-12.5 Gigatons / yr', bx + 24, by + 75);

    ctx.fillStyle = C.dimWhite;
    ctx.font = '16px monospace';
    ctx.fillText('Forest biomass & soil sequestration', bx + 24, by + 108);

    ctx.restore();
  }

  // Bottom Conclusion / Isotype Stat Bar (t: 8.0 - 10.0)
  if (t > 8.0) {
    const alpha = smooth(clamp((t - 8.0) / 0.6, 0, 1));
    ctx.save();
    ctx.globalAlpha = alpha;

    // Bottom banner
    ctx.fillStyle = 'rgba(15, 23, 34, 0.92)';
    ctx.fillRect(0, H - 120, W, 120);

    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, H - 120);
    ctx.lineTo(W, H - 120);
    ctx.stroke();

    ctx.fillStyle = C.amber;
    ctx.font = 'bold 16px monospace';
    ctx.fillText('SYSTEM NET BALANCE', 100, H - 75);

    ctx.fillStyle = C.white;
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('+24.9 GT NET ACCUMULATION', 100, H - 32);

    // Isotype icons (little square blocks representing gigatons)
    for (let i = 0; i < 12; i++) {
      const ix = 720 + i * 36;
      const iy = H - 70;
      ctx.fillStyle = i < 8 ? C.red : C.green;
      ctx.fillRect(ix, iy, 26, 36);
    }

    ctx.fillStyle = C.dimWhite;
    ctx.font = '14px monospace';
    ctx.fillText('Each block = 3.1 GT CO₂ equivalent', 720, H - 22);

    ctx.restore();
  }
}

window.DUR = 10;
window.render = draw;
window.READY = true;
