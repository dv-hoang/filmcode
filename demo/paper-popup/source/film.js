const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const pr = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

function drawDesk() {
  // Wooden desk background with vignette & warm lighting
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2b1a10');
  bg.addColorStop(0.5, '#1d1109');
  bg.addColorStop(1, '#0e0804');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Desk wood grain lines & warm spot
  ctx.save();
  const spot = ctx.createRadialGradient(W * 0.5, H * 0.45, 50, W * 0.5, H * 0.45, 900);
  spot.addColorStop(0, 'rgba(255, 210, 150, 0.12)');
  spot.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, W, H);

  // Scattered desk items (pencil, brass compass hint in bokeh/shadow)
  ctx.fillStyle = 'rgba(15, 10, 6, 0.6)';
  ctx.beginPath();
  ctx.ellipse(W * 0.8, H * 0.85, 220, 45, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBook(foldP, pageOpenP) {
  ctx.save();
  // Center book on desk
  const cx = W / 2;
  const cy = H / 2 + 60;
  
  const bookW = 1100;
  const bookH = 680;

  // Hardcover shadow
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + bookH * 0.45, bookW * 0.52, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leather cover (open spread)
  const coverExt = 50;
  ctx.fillStyle = '#4a2511';
  ctx.beginPath();
  ctx.roundRect(cx - bookW/2 - coverExt, cy - bookH/2 - coverExt, bookW + coverExt*2, bookH + coverExt*2, 24);
  ctx.fill();

  // Cover gold foil border & ornaments
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - bookW/2 - coverExt + 14, cy - bookH/2 - coverExt + 14, bookW + coverExt*2 - 28, bookH + coverExt*2 - 28);

  // Inner pages base (cream paper)
  ctx.fillStyle = '#f4ebd8';
  ctx.beginPath();
  ctx.roundRect(cx - bookW/2, cy - bookH/2, bookW, bookH, 8);
  ctx.fill();

  // Center binding crease shadow
  const gutterG = ctx.createLinearGradient(cx - 30, cy, cx + 30, cy);
  gutterG.addColorStop(0, 'rgba(0,0,0,0.25)');
  gutterG.addColorStop(0.5, 'rgba(0,0,0,0.02)');
  gutterG.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = gutterG;
  ctx.fillRect(cx - 30, cy - bookH/2, 60, bookH);

  // Page split line
  ctx.strokeStyle = '#d9ccb0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - bookH/2);
  ctx.lineTo(cx, cy + bookH/2);
  ctx.stroke();

  ctx.restore();
}

function drawPopUpScene(t) {
  const cx = W / 2;
  const cy = H / 2 + 60;
  const popP = easeOut(pr(t, 0.8, 3.2)); // Pop-up rises

  if (popP <= 0) return;

  ctx.save();
  // We apply a slight perspective transform or layering for pop-up depth
  
  // Base pop-up platform (V-fold trapezoid)
  const baseScaleY = popP;
  ctx.save();
  ctx.translate(cx, cy);
  
  // Layer 1: Background meadow / hills cut paper
  ctx.fillStyle = '#bce6c5';
  ctx.strokeStyle = '#2b4731';
  ctx.lineWidth = 4;
  
  const hillY = -120 * baseScaleY;
  ctx.beginPath();
  ctx.moveTo(-350, 40);
  ctx.quadraticCurveTo(-150, hillY - 60, 0, hillY);
  ctx.quadraticCurveTo(150, hillY - 60, 350, 40);
  ctx.lineTo(400, 180);
  ctx.lineTo(-400, 180);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White paper cut-out borders (Paper Mario style signature thick white outline)
  // Sun / Moon pop-up disc
  const sunY = hillY - 140 * baseScaleY;
  const sunRadius = 65;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(180, sunY, sunRadius + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffecb6';
  ctx.beginPath();
  ctx.arc(180, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // Layer 2: Clockwork Tree & Gear V-fold pieces
  const treeBaseX = -200;
  const treeBaseY = 50 * baseScaleY;
  
  // Tree trunk (corrugated brown paper look)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(treeBaseX - 35, treeBaseY - 240 * baseScaleY, 70, 250 * baseScaleY, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath();
  ctx.roundRect(treeBaseX - 28, treeBaseY - 230 * baseScaleY, 56, 230 * baseScaleY, 6);
  ctx.fill();

  // Tree canopy (geometric origami leaves)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(treeBaseX, treeBaseY - 260 * baseScaleY, 126, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#5c946e';
  ctx.beginPath();
  ctx.arc(treeBaseX, treeBaseY - 260 * baseScaleY, 118, 0, Math.PI * 2);
  ctx.fill();

  // Golden brass gears attached to tree
  const gearRot = t * 1.5;
  drawGear(treeBaseX - 40, treeBaseY - 220 * baseScaleY, 36, gearRot);
  drawGear(treeBaseX + 30, treeBaseY - 280 * baseScaleY, 24, -gearRot * 1.5);

  // Layer 3: The Mechanical Bird (Hero character)
  const birdHover = Math.sin(t * 4) * 12 * popP;
  const birdX = 60;
  const birdY = -60 * baseScaleY + birdHover;

  // Bird shadow on page
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(birdX, 100, 60 * popP, 16 * popP, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bird white outline cutout
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(birdX, birdY, 84, 54, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Bird body (skyblue paper)
  ctx.fillStyle = '#7bc6cc';
  ctx.beginPath();
  ctx.ellipse(birdX, birdY, 76, 48, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Clockwork chest plate (brass gear on bird)
  drawGear(birdX - 10, birdY + 5, 28, -t * 3);

  // Beak (orange folded paper triangle)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(birdX + 65, birdY - 15);
  ctx.lineTo(birdX + 115, birdY - 5);
  ctx.lineTo(birdX + 65, birdY + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f48c42';
  ctx.beginPath();
  ctx.moveTo(birdX + 68, birdY - 12);
  ctx.lineTo(birdX + 108, birdY - 5);
  ctx.lineTo(birdX + 68, birdY + 9);
  ctx.closePath();
  ctx.fill();

  // Wing (flap animation)
  const wingAngle = Math.sin(t * 12) * 0.4 - 0.2;
  ctx.save();
  ctx.translate(birdX - 10, birdY - 10);
  ctx.rotate(wingAngle);
  
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(-10, -50, 40, 70, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#4fa3a8';
  ctx.beginPath();
  ctx.roundRect(-6, -45, 32, 60, 12);
  ctx.fill();
  ctx.restore();

  // Bird Eye (googly / paper rivet)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(birdX + 35, birdY - 18, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(birdX + 37, birdY - 18, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function drawGear(x, y, r, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // White border gear
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  
  // Draw gear teeth
  const teeth = 8;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const ax = Math.cos(a) * (r + 6);
    const ay = Math.sin(a) * (r + 6);
    if (i === 0) ctx.moveTo(ax, ay);
    else ctx.lineTo(ax, ay);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Brass inner body
  ctx.fillStyle = '#e5a93b';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Center hole
  ctx.fillStyle = '#7a4e12';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawUI(t) {
  // Paper speech bubble / title placard sliding in from top left
  const placardP = easeOut(pr(t, 3.5, 4.5));
  if (placardP <= 0) return;

  ctx.save();
  const px = 180;
  const py = 120 - (1 - placardP) * 50;

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.roundRect(px - 150, py - 40, 320, 80, 16);
  ctx.fill();

  // White paper placard
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#2b1a10';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(px - 155, py - 45, 320, 80, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fffded';
  ctx.beginPath();
  ctx.roundRect(px - 150, py - 40, 310, 70, 12);
  ctx.fill();

  // Placard text
  ctx.font = 'bold 34px sans-serif';
  ctx.fillStyle = '#3a2211';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ACT I : THE AVIARY', px + 5, py - 2);

  // Action rating star popup at t=5.0
  const starP = easeOut(pr(t, 5.0, 5.8));
  if (starP > 0) {
    const sx = W - 220;
    const sy = 160;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(starP, starP);

    // Star paper cutout
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#2b1a10';
    ctx.lineWidth = 5;
    drawStarShape(ctx, 0, 0, 5, 55, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    drawStarShape(ctx, 0, 0, 5, 48, 24);
    ctx.fill();

    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#3a2211';
    ctx.textAlign = 'center';
    ctx.fillText('EXCELLENT!', 0, 80);

    ctx.restore();
  }

  ctx.restore();
}

function drawStarShape(c, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  c.beginPath();
  c.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    c.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    c.lineTo(x, y);
    rot += step;
  }
  c.lineTo(cx, cy - outerRadius);
  c.closePath();
}

function drawVignetteAndFocus(t) {
  // Macro depth of field vignette (blur edges via dark warm gradient)
  const grad = ctx.createRadialGradient(W/2, H/2, 450, W/2, H/2, 950);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.7, 'rgba(15, 8, 3, 0.45)');
  grad.addColorStop(1, 'rgba(10, 5, 2, 0.88)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

export function draw(t) {
  ctx.clearRect(0, 0, W, H);

  // 1. Photoreal wooden desk environment
  drawDesk();

  // 2. Hardcover open book
  const foldP = easeOut(pr(t, 0.0, 1.5));
  drawBook(foldP, 1.0);

  // 3. Pop-up V-folds, paper actors, gears & mechanisms
  drawPopUpScene(t);

  // 4. Paper Pop-up UI (placards, action ratings)
  drawUI(t);

  // 5. Macro lens lighting, shadows & vignette
  drawVignetteAndFocus(t);
}

window.DUR = 10;
window.render = draw;
window.READY = true;
