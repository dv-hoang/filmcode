const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Color palette for precision CAD / Teardown
const BG = '#0b0e14';
const GRID_COL = 'rgba(74, 110, 160, 0.12)';
const AXIS_COL = 'rgba(74, 110, 160, 0.35)';
const TITANIUM = '#8b9bb4';
const COPPER = '#d48837';
const SILICON = '#1c2230';
const GOLD = '#e5b64f';
const PCB_GREEN = '#133322';
const PCB_TRACE = '#286345';
const TEXT_DIM = '#526d8c';
const TEXT_BRIGHT = '#e2ecff';
const ACCENT = '#38bdf8'; // Cyan lead lines

// EASE UTILS
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => t * t * (3 - 2 * t);
const pr = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

export function draw(time) {
  const t = clamp(time, 0, 10);
  
  // Background & Grid
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  
  ctx.strokeStyle = GRID_COL;
  ctx.lineWidth = 1;
  for(let x = 0; x < W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for(let y = 0; y < H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  
  // Center crosshairs & origin
  ctx.strokeStyle = AXIS_COL;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H);
  ctx.moveTo(0, H/2); ctx.lineTo(W, H/2);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // --- CAMERA & EXPLODED LIFT ANIMATION ---
  let pExplode = 0;
  if (t > 2 && t <= 7) {
    pExplode = smooth(pr(t, 2, 5));
  } else if (t > 7 && t <= 8.5) {
    pExplode = 1 - smooth(pr(t, 7, 8.5));
  } else if (t > 8.5) {
    pExplode = 0;
  }
  
  // Macro zoom on PCB during 6.8-8.8s
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  if (t >= 6.8 && t <= 8.8) {
    const zt = smooth(pr(t, 6.8, 7.5));
    const ztoutVal = 1 - smooth(pr(t, 8.2, 8.8));
    const activeZ = Math.min(zt, ztoutVal);
    zoom = 1 + activeZ * 1.8;
    panY = activeZ * 120;
  }
  
  ctx.save();
  ctx.translate(W/2 + panX, H/2 + panY);
  ctx.scale(zoom, zoom);
  ctx.translate(-W/2, -H/2);
  
  // Center of object
  const cx = W / 2;
  const cy = H / 2 + 30;
  
  // --- LAYER 1: BASE HOUSING & SKID PAD (Bottom) ---
  const dy1 = pExplode * -280;
  drawLayer1(cx, cy + dy1, pExplode);
  
  // --- LAYER 2: MAIN PCB & SMD PASSIVES ---
  const dy2 = pExplode * -120;
  drawLayer2(cx, cy + dy2, pExplode);
  
  // --- LAYER 3: COPPER HEAT SPREADER & SOC ---
  const dy3 = pExplode * 60;
  drawLayer3(cx, cy + dy3, pExplode);
  
  // --- LAYER 4: TITANIUM TOP ENCLOSURE & SAPPHIRE LENS ---
  const dy4 = pExplode * 260;
  drawLayer4(cx, cy + dy4, pExplode);
  
  // --- LEADER LINES & ANNOTATIONS ---
  if (pExplode > 0.05) {
    drawAnnotations(cx, cy, [dy1, dy2, dy3, dy4], pExplode);
  }
  
  ctx.restore();
  
  // --- HUD OVERLAYS (Fixed screen space) ---
  drawHUD(t);
}

function drawLayer1(x, y, p) {
  ctx.save();
  ctx.translate(x, y);
  
  // Base housing shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(-220, -110 + 40, 440, 220, 24);
  ctx.fill();
  
  // Anodized aluminum base
  ctx.fillStyle = SILICON;
  ctx.strokeStyle = TITANIUM;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-220, -110, 440, 220, 24);
  ctx.fill();
  ctx.stroke();
  
  // Rubber feet & fastener holes
  ctx.fillStyle = '#0f141d';
  [-180, 180].forEach(fx => {
    [-80, 80].forEach(fy => {
      ctx.beginPath(); ctx.arc(fx, fy, 14, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = TITANIUM; ctx.lineWidth = 1; ctx.stroke();
    });
  });
  
  // Laser engraved text & FCC ID
  ctx.fillStyle = TEXT_DIM;
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MODEL: NX-700 // ASSEMBLED IN PRECISION LABS', 0, 0);
  ctx.fillText('PART ID: BHS-9021-REV4', 0, 20);
  
  ctx.restore();
}

function drawLayer2(x, y, p) {
  ctx.save();
  ctx.translate(x, y);
  
  // PCB Substrate (FR4 Green)
  ctx.fillStyle = PCB_GREEN;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-200, -95, 400, 190, 16);
  ctx.fill();
  ctx.stroke();
  
  // Copper Traces
  ctx.strokeStyle = PCB_TRACE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-170, 0); ctx.lineTo(-100, 0); ctx.lineTo(-80, -40); ctx.lineTo(80, -40); ctx.lineTo(100, 0); ctx.lineTo(170, 0);
  ctx.moveTo(-150, 50); ctx.lineTo(-50, 50); ctx.lineTo(-30, 20); ctx.lineTo(120, 20);
  ctx.stroke();
  
  // Capacitors & IC packages
  ctx.fillStyle = COPPER;
  [-130, -90, 90, 130].forEach(cx => {
    ctx.fillRect(cx - 12, -25, 24, 14);
  });
  
  // GPIO Header pins
  ctx.fillStyle = GOLD;
  for(let i = -140; i <= 140; i += 20) {
    ctx.fillRect(i - 3, 65, 6, 12);
  }
  
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PCB MAIN LOGIC - 4-LAYER FR4', -185, -70);
  
  ctx.restore();
}

function drawLayer3(x, y, p) {
  ctx.save();
  ctx.translate(x, y);
  
  // Copper Vapor Chamber / Heat Spreader
  const grad = ctx.createLinearGradient(-180, -80, 180, 80);
  grad.addColorStop(0, '#b8692c');
  grad.addColorStop(0.5, '#e59d52');
  grad.addColorStop(1, '#9e561e');
  
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#ffc885';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-180, -80, 360, 160, 12);
  ctx.fill();
  ctx.stroke();
  
  // Central SoC die (Silicon)
  ctx.fillStyle = '#0f1117';
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2;
  ctx.fillRect(-45, -45, 90, 90);
  ctx.stroke();
  
  // Die wire bonds visual
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for(let i = -35; i <= 35; i += 10) {
    ctx.moveTo(i, -45); ctx.lineTo(i, -52);
    ctx.moveTo(i, 45); ctx.lineTo(i, 52);
    ctx.moveTo(-45, i); ctx.lineTo(-52, i);
    ctx.moveTo(45, i); ctx.lineTo(52, i);
  }
  ctx.stroke();
  
  ctx.fillStyle = '#000';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NX-SOC-V2', 0, 4);
  
  ctx.restore();
}

function drawLayer4(x, y, p) {
  ctx.save();
  ctx.translate(x, y);
  
  // Titanium Shell Top Lid
  ctx.fillStyle = TITANIUM;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-210, -100, 420, 200, 20);
  ctx.fill();
  ctx.stroke();
  
  // Central Sapphire Crystal Viewport / Lens
  ctx.fillStyle = '#020617';
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Lens reflection highlight
  ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.beginPath();
  ctx.arc(-15, -15, 35, Math.PI, Math.PI * 1.85);
  ctx.fill();
  
  // Fastener slots on corners
  ctx.fillStyle = SILICON;
  [-185, 185].forEach(fx => {
    [-75, 75].forEach(fy => {
      ctx.beginPath(); ctx.arc(fx, fy, 6, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = TITANIUM; ctx.lineWidth = 1; ctx.stroke();
    });
  });
  
  ctx.fillStyle = TEXT_DIM;
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOP: GRADE-5 TITANIUM ALLOY', -190, -75);
  
  ctx.restore();
}

function drawAnnotations(cx, cy, dys, p) {
  ctx.save();
  
  const labels = [
    { name: 'L1: BASE HOUSING // AL-6061', offset: dys[0], side: 'left' },
    { name: 'L2: MAIN LOGIC BOARD // 4L FR4', offset: dys[1], side: 'left' },
    { name: 'L3: THERMAL SPREADER & SOC', offset: dys[2], side: 'right' },
    { name: 'L4: TITANIUM CHASSIS & OPTIC', offset: dys[3], side: 'right' }
  ];
  
  labels.forEach((lbl, idx) => {
    const itemY = cy + lbl.offset;
    const targetX = lbl.side === 'left' ? cx - 230 : cx + 230;
    const lineEndX = lbl.side === 'left' ? cx - 380 : cx + 380;
    
    // Leader line
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = p * 0.8;
    ctx.beginPath();
    ctx.moveTo(targetX, itemY);
    ctx.lineTo(lineEndX, itemY - 30);
    ctx.lineTo(lbl.side === 'left' ? lineEndX - 180 : lineEndX + 180, itemY - 30);
    ctx.stroke();
    
    // Dot on part
    ctx.fillStyle = ACCENT;
    ctx.beginPath(); ctx.arc(targetX, itemY, 4, 0, Math.PI*2); ctx.fill();
    
    // Text label
    ctx.fillStyle = TEXT_BRIGHT;
    ctx.font = '13px monospace';
    ctx.textAlign = lbl.side === 'left' ? 'right' : 'left';
    ctx.fillText(lbl.name, lbl.side === 'left' ? lineEndX - 20 : lineEndX + 20, itemY - 38);
    
    // Dimension callout number
    ctx.fillStyle = GOLD;
    ctx.font = '11px monospace';
    ctx.fillText(`Z-AXIS OFFSET: +${Math.abs(Math.round(lbl.offset))}mm`, lbl.side === 'left' ? lineEndX - 20 : lineEndX + 20, itemY - 20);
  });
  
  ctx.restore();
}

function drawHUD(t) {
  ctx.save();
  
  // Top bar
  ctx.fillStyle = 'rgba(11, 14, 20, 0.85)';
  ctx.fillRect(0, 0, W, 70);
  ctx.strokeStyle = AXIS_COL;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 70); ctx.lineTo(W, 70); ctx.stroke();
  
  // Title & Spec
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PRODUCT TEARDOWN // NX-700 SYSTEM ARCHITECTURE', 50, 42);
  
  ctx.fillStyle = ACCENT;
  ctx.font = '14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`TIME: ${t.toFixed(2)}s // CAD REF: 884-099-B`, W - 50, 42);
  
  // Bottom status bar
  ctx.fillStyle = 'rgba(11, 14, 20, 0.85)';
  ctx.fillRect(0, H - 50, W, 50);
  ctx.beginPath(); ctx.moveTo(0, H - 50); ctx.lineTo(W, H - 50); ctx.stroke();
  
  ctx.fillStyle = TEXT_DIM;
  ctx.font = '13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('STATUS: EXPLODED VIEW ACTIVE [ISO-Y AXIS STACK]', 50, H - 20);
  
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'right';
  ctx.fillText('TOLERANCE: ±0.01mm // BOM ITEMS: 142', W - 50, H - 20);
  
  // Frame border
  ctx.strokeStyle = AXIS_COL;
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, W - 40, H - 40);
  
  ctx.restore();
}

window.DUR = 10;
window.render = draw;
window.READY = true;
