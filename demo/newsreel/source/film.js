// 1920s Newsreel: "THE METROPOLIS CHRONICLE"
// 10 seconds of sepia, nitrate scratches, spinning front page, and brass fanfare.

const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Pre-render noise / film grain pattern deterministically
const grainCanvas = document.createElement('canvas');
grainCanvas.width = 300; grainCanvas.height = 300;
const gctx = grainCanvas.getContext('2d');
const gdata = gctx.createImageData(300, 300);
for (let i = 0; i < gdata.data.length; i += 4) {
  const v = (Math.sin(i * 12.9898) * 43758.5453) % 1;
  const c = Math.floor(v * 255);
  gdata.data[i] = c;
  gdata.data[i+1] = c;
  gdata.data[i+2] = c;
  gdata.data[i+3] = 45;
}
gctx.putImageData(gdata, 0, 0);

function drawNitrateScratches(t) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const seed = Math.floor(t * 12 + i * 99);
    const x = (Math.sin(seed) * 10000) % W;
    if (Math.sin(seed * 2) > 0.3) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.sin(seed) * 10), H);
      ctx.stroke();
    }
  }
  // Flickering dust specks
  ctx.fillStyle = 'rgba(245,235,210,0.3)';
  for (let i = 0; i < 12; i++) {
    const fx = Math.abs(Math.sin(t * 77 + i * 33)) * W;
    const fy = Math.abs(Math.cos(t * 53 + i * 47)) * H;
    const fs = (i % 3) + 1;
    if ((Math.floor(t * 15 + i) % 3) === 0) {
      ctx.fillRect(fx, fy, fs, fs);
    }
  }
  ctx.restore();
}

function drawVignetteAndSepia() {
  const grad = ctx.createRadialGradient(W/2, H/2, 400, W/2, H/2, 1100);
  grad.addColorStop(0, 'rgba(40, 30, 20, 0)');
  grad.addColorStop(0.7, 'rgba(25, 18, 10, 0.4)');
  grad.addColorStop(1, 'rgba(10, 7, 4, 0.9)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Grain overlay
  const pat = ctx.createPattern(grainCanvas, 'repeat');
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
}

function drawGlobeIdent(t) {
  // 0.0 - 2.8s: Searchlight & Spinning Globe ident ("ATLAS NEWS")
  ctx.fillStyle = '#1c150e';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  // Searchlight beam
  const beamGrad = ctx.createLinearGradient(W/2, H, W/2 - 300, 0);
  beamGrad.addColorStop(0, 'rgba(255, 240, 200, 0.25)');
  beamGrad.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(W/2 - 100, H);
  ctx.lineTo(W/2 + 100, H);
  ctx.lineTo(W/2 - 600, 0);
  ctx.lineTo(W/2 + 600, 0);
  ctx.closePath();
  ctx.fill();

  // Globe circle
  const cx = W/2, cy = H/2 - 40;
  const r = 240;
  ctx.fillStyle = '#3a2b1c';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#d4b483';
  ctx.stroke();

  // Parallels & Meridians moving across globe
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = '#d4b483';
  ctx.lineWidth = 2;
  const offset = (t * 1.5) % (Math.PI * 2);
  for (let i = -4; i <= 4; i++) {
    const mx = cx + i * 55 + Math.sin(offset) * 20;
    ctx.beginPath();
    ctx.ellipse(mx, cy, r * 0.4, r, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let j = -3; j <= 3; j++) {
    const my = cy + j * 60;
    ctx.beginPath();
    ctx.arc(cx, my, r * 0.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Banner text
  ctx.fillStyle = '#f5e6c8';
  ctx.font = 'bold 72px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 15;
  ctx.fillText("ATLAS SOUND NEWS", W/2, cy + r + 75);

  ctx.font = 'italic 28px "Times New Roman", serif';
  ctx.fillStyle = '#c2a478';
  ctx.fillText("PRESENTS WORLD EVENTS ON THE SCREEN", W/2, cy + r + 125);
  ctx.restore();
}

function drawSpinningNewspaper(t) {
  // 2.8 - 6.0s: Spinning Newspaper ("GREAT METROPOLIS BRIDGE OPENED!")
  const progress = (t - 2.8) / 3.2; // 0 to 1
  ctx.fillStyle = '#221911';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  // Simulate 3D scale/rotation with transform matrix
  const scale = Math.min(1, progress * 1.5);
  const rot = (1 - Math.min(1, progress * 1.2)) * Math.PI * 6;
  
  ctx.translate(W/2, H/2);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.translate(-W/2, -H/2);

  // Paper background
  const pw = 900, ph = 750;
  const px = (W - pw)/2, py = (H - ph)/2;
  ctx.fillStyle = '#f4ebd0';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 30;
  ctx.fillRect(px, py, pw, ph);

  // Newspaper border & masthead
  ctx.strokeStyle = '#2b1d11';
  ctx.lineWidth = 4;
  ctx.strokeRect(px + 20, py + 20, pw - 40, ph - 40);

  ctx.fillStyle = '#1c140c';
  ctx.font = 'bold 54px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText("THE DAILY CHRONICLE", W/2, py + 85);

  ctx.font = '16px "Times New Roman", serif';
  ctx.fillText("VOL. XIV NO. 284 — SEVEN CENTS", W/2, py + 115);

  // Headline
  ctx.font = 'bold 44px "Times New Roman", serif';
  ctx.fillText("COLOSSAL SUSPENSION BRIDGE", W/2, py + 180);
  ctx.fillText("OPENED TO MILLIONS TODAY!", W/2, py + 230);

  // Columns of fake newspaper text / photo placeholder
  ctx.fillStyle = '#443322';
  ctx.fillRect(px + 60, py + 270, 360, 220); // photo box
  ctx.fillStyle = '#f4ebd0';
  ctx.font = 'bold 20px "Times New Roman", serif';
  ctx.fillText("BRIDGE CELEBRATION", px + 240, py + 380);

  // Text lines
  ctx.fillStyle = '#2b1d11';
  for (let row = 0; row < 12; row++) {
    const ly = py + 520 + row * 18;
    ctx.fillRect(px + 60, ly, 360, 10);
    ctx.fillRect(px + 480, py + 270 + row * 18, 360, 10);
  }

  ctx.restore();
}

function drawHeadlineStory(t) {
  // 6.0 - 10.0s: Feature Story Card & Graphical Diagram / Cityscape
  const localT = t - 6.0;
  ctx.fillStyle = '#18120c';
  ctx.fillRect(0, 0, W, H);

  // Location / Item Title Card style
  ctx.save();
  ctx.strokeStyle = '#d4b483';
  ctx.lineWidth = 6;
  ctx.strokeRect(120, 120, W - 240, H - 240);

  ctx.fillStyle = '#f5e6c8';
  ctx.font = 'bold 48px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText("NEW YORK", W/2, 220);

  ctx.font = 'italic 32px "Times New Roman", serif';
  ctx.fillStyle = '#c2a478';
  ctx.fillText("The Marvel of Modern Engineering in Motion", W/2, 280);

  // Animated suspension bridge graphic
  const bx = 300, by = 600;
  const bw = 1320, bh = 260;

  ctx.strokeStyle = '#d4b483';
  ctx.lineWidth = 4;
  // Towers
  ctx.strokeRect(bx + 200, by, 60, bh);
  ctx.strokeRect(bx + bw - 260, by, 60, bh);

  // Deck
  ctx.beginPath();
  ctx.moveTo(bx, by + bh - 40);
  ctx.lineTo(bx + bw, by + bh - 40);
  ctx.stroke();

  // Cables (catenary curve)
  ctx.beginPath();
  ctx.moveTo(bx, by + 40);
  ctx.quadraticCurveTo(bx + bw/2, by + bh - 20, bx + bw, by + 40);
  ctx.stroke();

  // Suspension vertical wires
  for (let i = 1; i <= 14; i++) {
    const wx = bx + (i * (bw / 15));
    // Approximate parabolic height for wire
    const normX = (wx - (bx + bw/2)) / (bw/2);
    const wy = by + 40 + (normX * normX * 180);
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx, by + bh - 40);
    ctx.stroke();
  }

  // Steamboat passing under bridge
  const boatX = bx + 200 + ((localT * 250) % (bw - 400));
  ctx.fillStyle = '#c2a478';
  ctx.fillRect(boatX, by + bh - 80, 120, 35);
  ctx.fillStyle = '#f5e6c8';
  // Smoke stacks
  ctx.fillRect(boatX + 30, by + bh - 110, 12, 30);
  ctx.fillRect(boatX + 70, by + bh - 110, 12, 30);

  // Footer caption
  ctx.font = 'bold 36px "Times New Roman", serif';
  ctx.fillStyle = '#f5e6c8';
  ctx.fillText("OVER THIRTY THOUSAND VEHICLES CROSS DAILY", W/2, H - 190);

  ctx.restore();
}

function draw(t) {
  ctx.clearRect(0, 0, W, H);

  if (t < 2.8) {
    drawGlobeIdent(t);
  } else if (t < 6.0) {
    drawSpinningNewspaper(t);
  } else {
    drawHeadlineStory(t);
  }

  drawNitrateScratches(t);
  drawVignetteAndSepia();
}

window.DUR = 10;
window.render = draw;
window.READY = true;
