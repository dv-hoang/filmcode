// hologram-hud style film.js
// Sci-Fi Hologram HUD — Reactor Core Telemetry Teardown
const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const C_CYAN = '#00f2ff';
const C_BLUE = '#0077ff';
const C_GLOW = 'rgba(0, 242, 255, 0.4)';
const C_WHITE = '#e0f8ff';
const C_DIM = 'rgba(0, 119, 255, 0.35)';

// Deterministic pseudo-random helper
function hash(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

function randStr(len, seed) {
  let s = '';
  const chars = '0123456789ABCDEFXYZ#@/\\';
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(hash(seed + i) * chars.length)];
  }
  return s;
}

function draw(t) {
  ctx.fillStyle = '#02060c';
  ctx.fillRect(0, 0, W, H);

  // Background grid / scan lines
  ctx.strokeStyle = 'rgba(0, 80, 150, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Radial vignette & projector base glow
  const grad = ctx.createRadialGradient(W/2, H/2 + 250, 50, W/2, H/2 + 250, 700);
  grad.addColorStop(0, 'rgba(0, 100, 255, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Projector pad rings at bottom center
  ctx.strokeStyle = C_BLUE;
  ctx.lineWidth = 2;
  ctx.save();
  ctx.translate(W/2, H/2 + 300);
  ctx.scale(1, 0.3);
  ctx.beginPath(); ctx.arc(0, 0, 320, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 240, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = C_CYAN;
  ctx.beginPath(); ctx.arc(0, 0, 160, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Scanline wipe effect if t < 1.2
  if (t < 1.5) {
    const scanY = (t / 1.5) * H;
    ctx.strokeStyle = C_CYAN;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(W, scanY); ctx.stroke();
    ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
    ctx.fillRect(0, 0, W, scanY);
  }

  // Object exploded view parameters
  // Exploded distance expands from t=2.0 to t=5.0
  const expProgress = Math.max(0, Math.min(1, (t - 2.0) / 3.0));
  const easeExp = expProgress < 0.5 ? 2 * expProgress * expProgress : 1 - Math.pow(-2 * expProgress + 2, 2) / 2;
  const spread = easeExp * 140;

  const cx = W / 2;
  const cy = H / 2 - 30;

  // Draw Wireframe Object: Reactor Core rings & struts
  ctx.save();
  ctx.shadowColor = C_CYAN;
  ctx.shadowBlur = 15;
  ctx.lineWidth = 2;
  ctx.strokeStyle = C_CYAN;

  // Ring 1 (Top)
  ctx.beginPath();
  ctx.ellipse(cx, cy - spread - 80, 120, 45, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Ring 2 (Upper-Mid)
  ctx.beginPath();
  ctx.ellipse(cx, cy - spread * 0.3 - 20, 160, 60, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Ring 3 (Lower-Mid)
  ctx.beginPath();
  ctx.ellipse(cx, cy + spread * 0.3 + 20, 180, 65, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Ring 4 (Bottom Base)
  ctx.beginPath();
  ctx.ellipse(cx, cy + spread + 90, 140, 50, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Vertical struts connecting rings
  ctx.strokeStyle = C_BLUE;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + t * 0.1;
    const xTop = cx + Math.cos(angle) * 100;
    const yTop = cy - spread - 80 + Math.sin(angle) * 35;
    const xBot = cx + Math.cos(angle) * 110;
    const yBot = cy + spread + 90 + Math.sin(angle) * 40;
    ctx.beginPath();
    ctx.moveTo(xTop, yTop);
    ctx.lineTo(xBot, yBot);
    ctx.stroke();
  }

  // If t > 6.5, flash solid core hologram
  if (t > 6.5) {
    const flashAlpha = Math.min(1, (t - 6.5) / 0.8) * 0.25;
    ctx.fillStyle = `rgba(0, 242, 255, ${flashAlpha})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 150, 180, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // HUD Annotations, Leaders, and Target Boxes
  if (t > 1.2) {
    drawHUDCallout(cx + 170, cy - spread - 80, 'TOP FLANGE SEAL // MK-IV', 'INTEGRITY', 99.4, 1, t);
    drawHUDCallout(cx - 240, cy - spread * 0.3 - 20, 'MAGNETIC COIL ARRAY', 'FLUX DENSITY', 4.82, 2, t);
    drawHUDCallout(cx + 220, cy + spread * 0.3 + 20, 'PLASMA INJECTOR PORT', 'FLOW RATE', 128.5, 3, t);
    drawHUDCallout(cx - 220, cy + spread + 90, 'BASE MANIFOLD HOUSING', 'PRESSURE', 1.04, 4, t);
  }

  // Global header & status bar
  ctx.font = '16px monospace';
  ctx.fillStyle = C_CYAN;
  ctx.shadowColor = C_CYAN;
  ctx.shadowBlur = 8;
  ctx.fillText('SYS.CORE // TELEMETRY & TEARDOWN DIAGNOSTIC', 80, 70);
  ctx.fillText(`TIME: ${t.toFixed(2)}s | STATUS: ${t > 6.5 ? 'SYNTHESIS COMPLETE' : 'ANALYZING ASSEMBLY'}`, 80, 100);

  // Crosshairs &corner brackets
  drawCornerBrackets();
}

function drawHUDCallout(targetX, targetY, title, label, realVal, index, t) {
  const side = targetX > W / 2 ? 1 : -1;
  const elbowX = targetX + side * 80;
  const elbowY = targetY - 40;
  const endX = elbowX + side * 180;
  const endY = elbowY;

  ctx.save();
  ctx.strokeStyle = C_CYAN;
  ctx.fillStyle = C_CYAN;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = C_CYAN;
  ctx.shadowBlur = 6;

  // Target box around part
  ctx.strokeRect(targetX - 25, targetY - 25, 50, 50);

  // Leader line
  ctx.beginPath();
  ctx.moveTo(targetX + side * 25, targetY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Target dot
  ctx.beginPath();
  ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Callout text panel
  const boxX = side > 0 ? endX + 10 : endX - 260;
  const boxY = endY - 55;
  ctx.fillStyle = 'rgba(0, 20, 40, 0.85)';
  ctx.strokeStyle = C_BLUE;
  ctx.fillRect(boxX, boxY, 250, 60);
  ctx.strokeRect(boxX, boxY, 250, 60);

  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = C_WHITE;
  ctx.fillText(title, boxX + 12, boxY + 20);

  ctx.font = '12px monospace';
  ctx.fillStyle = C_CYAN;
  // Rolling number effect from t=1.2 to t=3.5
  const rollDuration = 2.3;
  const rollProgress = Math.max(0, Math.min(1, (t - (1.2 + index * 0.2)) / rollDuration));
  const displayVal = rollProgress < 1 ? randStr(6, t * 10 + index) : realVal.toFixed(2);
  ctx.fillText(`${label}: ${displayVal}`, boxX + 12, boxY + 44);

  ctx.restore();
}

function drawCornerBrackets() {
  ctx.save();
  ctx.strokeStyle = C_BLUE;
  ctx.lineWidth = 2;
  const len = 40;
  const margin = 40;

  // Top-left
  ctx.beginPath(); ctx.moveTo(margin, margin + len); ctx.lineTo(margin, margin); ctx.lineTo(margin + len, margin); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(W - margin - len, margin); ctx.lineTo(W - margin, margin); ctx.lineTo(W - margin, margin + len); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(margin, H - margin - len); ctx.lineTo(margin, H - margin); ctx.lineTo(margin + len, H - margin); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(W - margin - len, H - margin); ctx.lineTo(W - margin, H - margin); ctx.lineTo(W - margin, H - margin - len); ctx.stroke();

  ctx.restore();
}

window.DUR = 10;
window.render = draw;
window.READY = true;
