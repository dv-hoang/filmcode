// Microscope: 0s to 10s continuous optical dive from glass slide to cellular matrix.
// Canvas 2D, zero external assets, deterministic per frame.

const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const smooth = t => t * t * (3 - 2 * t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function draw(t) {
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, W, H);

  // 1. Zoom scale calculation (1x to 1000x exponential zoom)
  // 0s-2s: macro stage view, 2s-8s: optical dive through tissue, 8s-10s: single cell organelle resolve.
  let zoom = Math.pow(1000, clamp(t / 9.0, 0, 1));
  if (t < 0.5) zoom = 1.0 + t * 0.2; // slight breath at start

  ctx.save();
  ctx.translate(W / 2, H / 2);

  // Optical aperture vignette & dark stage surround
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 480, 0, Math.PI * 2);
  ctx.clip();

  // Draw simulated specimen layers inside the optical field
  ctx.fillStyle = '#0a1018';
  ctx.fillRect(-500, -500, 1000, 1000);

  // Tissue fibers / slide structure
  ctx.save();
  ctx.scale(zoom, zoom);
  
  // Rotating/panning camera drift
  let driftX = Math.sin(t * 0.3) * 15;
  let driftY = Math.cos(t * 0.2) * 15;
  ctx.translate(driftX, driftY);

  // Draw cellular / crystalline specimen structures
  for (let i = -15; i <= 15; i++) {
    for (let j = -15; j <= 15; j++) {
      let cx = i * 60 + Math.sin(i * 9.3) * 18;
      let cy = j * 60 + Math.cos(j * 7.1) * 18;
      let r = 22 + (Math.sin(i * j) * 8);

      let dist = Math.sqrt(cx*cx + cy*cy);
      if (dist > 500) continue;

      // Cell wall
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(30, 80, 120, ${0.15 + 0.15 * Math.sin(i + j + t)})`;
      ctx.fill();
      ctx.lineWidth = 1.5 / Math.sqrt(zoom);
      ctx.strokeStyle = `rgba(120, 210, 255, ${0.4 + 0.3 * Math.cos(t + i)})`;
      ctx.stroke();

      // Nucleus / organelle
      ctx.beginPath();
      ctx.arc(cx + 4, cy - 3, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 240, 100, ${0.25 + 0.15 * Math.sin(t * 2 + i)})`;
      ctx.fill();

      // Granules / ribosomes
      for (let k = 0; k < 5; k++) {
        let gx = cx + Math.sin(k * 13 + i) * (r * 0.5);
        let gy = cy + Math.cos(k * 17 + j) * (r * 0.5);
        ctx.beginPath();
        ctx.arc(gx, gy, 2 / Math.sqrt(zoom), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
      }
    }
  }

  // Collagen fiber matrix overlay
  ctx.strokeStyle = 'rgba(90, 180, 140, 0.12)';
  ctx.lineWidth = 3 / Math.sqrt(zoom);
  ctx.beginPath();
  for (let k = -5; k <= 5; k++) {
    ctx.moveTo(-400, k * 80);
    ctx.bezierCurveTo(0, k * 80 + Math.sin(k + t) * 50, 200, k * 80 - Math.cos(k) * 50, 400, k * 80);
  }
  ctx.stroke();

  ctx.restore(); // restore zoom transform

  // Optical lens chromatic aberration / edge ring
  let grad = ctx.createRadialGradient(0, 0, 380, 0, 0, 480);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.7, 'rgba(2, 8, 15, 0.6)');
  grad.addColorStop(1, 'rgba(5, 12, 22, 0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(-500, -500, 1000, 1000);

  // Focus breathing ring
  let focusAlpha = 0.15 + 0.1 * Math.sin(t * 4);
  ctx.beginPath();
  ctx.arc(0, 0, 476, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(150, 220, 255, ${focusAlpha})`;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.restore(); // restore clip region

  // Outer bezel / instrument chassis
  ctx.strokeStyle = '#18202c';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(0, 0, 482, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Microscope Digital HUD / UI Overlays (System font, clean engineering readout)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Top Left: Instrument Status
  ctx.fillStyle = 'rgba(120, 210, 255, 0.85)';
  ctx.font = '18px monospace';
  ctx.fillText('LEICA DM-V8 // FIELD 04-B', 80, 70);
  ctx.fillStyle = 'rgba(120, 210, 255, 0.5)';
  ctx.font = '14px monospace';
  ctx.fillText('SPECIMEN: CORTEX TISSUE (STAIN: H&E)', 80, 95);

  // Top Right: Magnification & Scale
  let magText = zoom < 10 ? `${(zoom * 10).toFixed(0)}x` : zoom < 250 ? `${(zoom * 5).toFixed(0)}x` : `${(zoom * 2.5).toFixed(0)}x`;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 200, 120, 0.9)';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(magText, W - 80, 70);

  ctx.fillStyle = 'rgba(120, 210, 255, 0.6)';
  ctx.font = '14px monospace';
  ctx.fillText('NA 0.95  //  λ 550nm', W - 80, 105);

  // Bottom Left: Scale Bar & Coordinates
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(120, 210, 255, 0.7)';
  ctx.font = '14px monospace';
  ctx.fillText('X: +14.288 mm   Y: -04.102 mm   Z: ' + (12.4 - t * 0.8).toFixed(3) + ' µm', 80, H - 70);

  // Dynamic Scale Bar
  let barLengthPx = 120;
  let scaleMicrons = Math.round(500 / zoom);
  ctx.strokeStyle = 'rgba(120, 210, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, H - 95);
  ctx.lineTo(80 + barLengthPx, H - 95);
  ctx.moveTo(80, H - 100);
  ctx.lineTo(80, H - 90);
  ctx.moveTo(80 + barLengthPx, H - 100);
  ctx.lineTo(80 + barLengthPx, H - 90);
  ctx.stroke();

  ctx.fillStyle = 'rgba(120, 210, 255, 0.8)';
  ctx.font = '13px monospace';
  ctx.fillText(`${scaleMicrons} µm`, 80 + barLengthPx / 2 - 15, H - 118);

  // Bottom Right: Focal Plane indicator & Illuminator status
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(100, 255, 160, 0.8)';
  ctx.font = '14px monospace';
  ctx.fillText('LED ILLUM: 5200K (98% INTENS)', W - 80, H - 70);

  ctx.fillStyle = 'rgba(120, 210, 255, 0.5)';
  ctx.fillText('FOCAL PLANE: LOCKED', W - 80, H - 95);

  // Title card fade in/out at very beginning
  if (t < 2.0) {
    let alpha = t < 0.5 ? t * 2 : t > 1.5 ? (2.0 - t) * 2 : 1.0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(220, 240, 255, ${alpha * 0.9})`;
    ctx.font = '32px monospace';
    ctx.fillText('OPTICAL BIO-PATHOLOGY // SLIDE #884', 0, -320);
  }

  ctx.restore();
}

window.DUR = 10;
window.render = draw;
window.READY = true;
