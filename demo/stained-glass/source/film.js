const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Deterministic noise / pseudo-random helper
function rnd(seed) {
  let x = Math.sin(seed * 91.345) * 43758.5453123;
  return x - Math.floor(x);
}

// Draw the cathedral stone wall frame & interior arch
function drawStone(ctx, lightIntensity) {
  ctx.fillStyle = '#141215';
  ctx.fillRect(0, 0, W, H);

  // Stone masonry texture / blocks
  ctx.strokeStyle = '#0b0a0c';
  ctx.lineWidth = 4;
  for (let y = 0; y < H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let x = 0; x < W; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // Large gothic lancet window opening arch
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, 480, 420, Math.PI, 0, false);
  ctx.lineTo(W / 2 + 420, H);
  ctx.lineTo(W / 2 - 420, H);
  ctx.closePath();
  ctx.fillStyle = '#060506';
  ctx.fill();
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#1e1a17';
  ctx.stroke();
  ctx.restore();

  // Floor stone light pool (projected chromatic light)
  if (lightIntensity > 0.05) {
    ctx.save();
    const grad = ctx.createRadialGradient(W / 2, 920, 20, W / 2, 920, 700);
    grad.addColorStop(0, `rgba(255, 215, 130, ${0.45 * lightIntensity})`);
    grad.addColorStop(0.3, `rgba(180, 90, 220, ${0.35 * lightIntensity})`);
    grad.addColorStop(0.7, `rgba(60, 160, 240, ${0.25 * lightIntensity})`);
    grad.addColorStop(1, 'rgba(10, 8, 10, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(W / 2, 920, 680, 140, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Draw stained glass window geometry & panels
function drawStainedGlass(ctx, t, lightIntensity) {
  const cx = W / 2;
  const cy = 480;
  const r = 400;

  ctx.save();
  // Clip to lancet window shape
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0, false);
  ctx.lineTo(cx + r, cy + 340);
  ctx.lineTo(cx - r, cy + 340);
  ctx.closePath();
  ctx.clip();

  // Background glow behind glass when light is up
  if (lightIntensity > 0.01) {
    const bgGrad = ctx.createRadialGradient(cx, cy - 50, 20, cx, cy, r + 50);
    bgGrad.addColorStop(0, `rgba(255, 245, 210, ${0.9 * lightIntensity})`);
    bgGrad.addColorStop(0.5, `rgba(255, 170, 70, ${0.7 * lightIntensity})`);
    bgGrad.addColorStop(1, `rgba(140, 30, 180, ${0.6 * lightIntensity})`);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = '#080608';
    ctx.fillRect(0, 0, W, H);
  }

  // Glass panels (The Tree of Life / Rose motif)
  // We draw individual geometric segments with rich jewel colors, dark grisaille shadows, and lead cames.
  
  const panels = [
    // Center medallion (The Sun / Heart)
    { path: c => { c.arc(cx, cy, 90, 0, Math.PI * 2); }, col: '#ffde59', glow: '#ff9900', crack: 0.3 },
    // Inner petals
    { path: c => { c.moveTo(cx, cy); c.arc(cx, cy, 180, -Math.PI/3, 0); c.closePath(); }, col: '#e63946', glow: '#ff4d6d', crack: 0.8 },
    { path: c => { c.moveTo(cx, cy); c.arc(cx, cy, 180, 0, Math.PI/3); c.closePath(); }, col: '#457b9d', glow: '#1d3557', crack: 0.1 },
    { path: c => { c.moveTo(cx, cy); c.arc(cx, cy, 180, Math.PI/3, 2*Math.PI/3); c.closePath(); }, col: '#2a9d8f', glow: '#264653', crack: 0.5 },
    { path: c => { c.moveTo(cx, cy); c.arc(cx, cy, 180, 2*Math.PI/3, Math.PI); c.closePath(); }, col: '#e9c46a', glow: '#f4a261', crack: 0.2 },
    { path: c => { c.moveTo(cx, cy); c.arc(cx, cy, 180, Math.PI, 4*Math.PI/3); c.closePath(); }, col: '#9b5de5', glow: '#7209b7', crack: 0.9 },
    { path: c => { c.moveTo(cx, cy); c.arc(cx, cy, 180, 4*Math.PI/3, 5*Math.PI/3); c.closePath(); }, col: '#00b4d8', glow: '#0077b6', crack: 0.4 },

    // Outer tracery panels (Lower lancet figures / pillars)
    { path: c => { c.rect(cx - 380, cy + 10, 170, 320); }, col: '#d90429', glow: '#8d0801', crack: 0.7 },
    { path: c => { c.rect(cx - 190, cy + 10, 170, 320); }, col: '#ffb703', glow: '#fb8500', crack: 0.2 },
    { path: c => { c.rect(cx + 20, cy + 10, 170, 320); }, col: '#3a86ff', glow: '#03045e', crack: 0.6 },
    { path: c => { c.rect(cx + 210, cy + 10, 170, 320); }, col: '#38b000', glow: '#007200', crack: 0.3 }
  ];

  panels.forEach((p, idx) => {
    ctx.save();
    ctx.beginPath();
    p.path(ctx);
    ctx.clip();

    // Base translucent color
    ctx.fillStyle = p.col;
    ctx.globalAlpha = 0.85 * lightIntensity;
    ctx.fill();

    // Subtle glass texture (hand-blown ripples / bubbles)
    for (let i = 0; i < 5; i++) {
      let bx = cx + (rnd(idx * 17 + i) - 0.5) * 350;
      let by = cy + (rnd(idx * 31 + i) - 0.5) * 350;
      let br = 20 + rnd(idx + i) * 60;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.12 * lightIntensity})`;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grisaille painted details (medieval facial lines and drapery folds)
    ctx.strokeStyle = 'rgba(30, 15, 5, 0.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let f = 0; f < 4; f++) {
      let fx = cx + (rnd(idx * 5 + f) - 0.5) * 200;
      let fy = cy + (rnd(idx * 7 + f) - 0.5) * 200;
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + 40 + f * 15, fy + 80 + f * 10);
    }
    ctx.stroke();

    // Dynamic crack repair effect (Young Sherlock Holmes style puzzle healing / cracking)
    // Between t=4.0 and t=7.0, pieces fracture and reassemble
    let crackPhase = 0;
    if (t > 4.0 && t < 7.5) {
      crackPhase = Math.sin((t - 4.0) * 3.5 + p.crack * 10) * (1 - Math.abs(t - 5.75) / 1.75);
      crackPhase = Math.max(0, crackPhase);
    }
    
    if (crackPhase > 0.05) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * crackPhase})`;
      ctx.lineWidth = 4 * crackPhase;
      ctx.beginPath();
      let startX = cx + (p.crack - 0.5) * 200;
      let startY = cy + (p.crack * 13 % 1.0 - 0.5) * 200;
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + 60, startY + 80);
      ctx.lineTo(startX + 120, startY + 50);
      ctx.stroke();

      // Golden light streaming from fracture
      ctx.fillStyle = `rgba(255, 255, 200, ${0.8 * crackPhase})`;
      ctx.fill();
    }

    ctx.restore();
  });

  // Heavy Lead Cames (Dark solder lines holding the stained glass together)
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#050404';
  panels.forEach(p => {
    ctx.save();
    ctx.beginPath();
    p.path(ctx);
    ctx.stroke();
    ctx.restore();
  });

  // Center rosette lead tracery circles
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#050404';
  ctx.beginPath();
  ctx.arc(cx, cy, 90, 0, Math.PI * 2);
  ctx.arc(cx, cy, 180, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore(); // restore from window clip
}

// Title cards / Medieval inscriptions in calligraphy font style
function drawTitle(ctx, t) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Prologue card (0s - 3s): "In the stillness of stone..."
  if (t >= 1.0 && t < 3.8) {
    let alpha = 1.0;
    if (t < 1.8) alpha = (t - 1.0) / 0.8;
    if (t > 3.0) alpha = (3.8 - t) / 0.8;
    
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = 'italic 38px Georgia, serif';
    ctx.fillStyle = '#d4af37';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 15;
    ctx.fillText("In the stillness of stone, light is the only clock.", W / 2, 980);
  }

  // Climax card (7.5s - 9.5s): "The Rose Awakening"
  if (t >= 7.5 && t < 9.8) {
    let alpha = 1.0;
    if (t < 8.2) alpha = (t - 7.5) / 0.7;
    if (t > 9.0) alpha = (9.8 - t) / 0.8;

    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = 'bold 52px Georgia, serif';
    ctx.fillStyle = '#ffdf70';
    ctx.shadowColor = 'rgba(255,160,50,0.8)';
    ctx.shadowBlur = 20;
    ctx.fillText("THE ROSE WINDOW", W / 2, 970);

    ctx.font = '24px Georgia, serif';
    ctx.fillStyle = '#bfa15f';
    ctx.fillText("Chartres, XII Century", W / 2, 1015);
  }

  ctx.restore();
}

// Dust motes floating in sunbeams
function drawDustMotes(ctx, t, lightIntensity) {
  if (lightIntensity < 0.1) return;
  ctx.save();
  for (let i = 0; i < 40; i++) {
    let x = W / 2 + (rnd(i * 13) - 0.5) * 700 + Math.sin(t * 0.8 + i) * 30;
    let y = 300 + (rnd(i * 37) * 650) + Math.cos(t * 0.5 + i) * 20;
    let sz = 1 + rnd(i * 7) * 3;
    let alpha = (0.3 + 0.5 * Math.sin(t * 2 + i * 3)) * lightIntensity;
    ctx.fillStyle = `rgba(255, 240, 190, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Main draw function required by FilmCode
export function draw(t) {
  // Compute sun light intensity based on time (0s to 10s)
  // Dawn / sunrise beam sweeps across the window starting around t=2s, peaks at t=6s, flares at t=8s.
  let lightIntensity = 0.05;
  if (t > 2.0 && t < 4.0) {
    lightIntensity = 0.05 + 0.95 * ((t - 2.0) / 2.0);
  } else if (t >= 4.0 && t < 7.5) {
    lightIntensity = 1.0;
  } else if (t >= 7.5 && t <= 10.0) {
    // Magnificent flare and steady warm glow
    lightIntensity = 1.0 + 0.3 * Math.sin((t - 7.5) * Math.PI * 1.5);
  }

  // 1. Draw cathedral stone architecture & floor light pool
  drawStone(ctx, lightIntensity);

  // 2. Draw stained glass window with lead cames & dynamic glass fracturing/healing
  drawStainedGlass(ctx, t, lightIntensity);

  // 3. Floating dust motes in sunbeam
  drawDustMotes(ctx, t, lightIntensity);

  // 4. Atmospheric vignette / darkness at edges of the stone hall
  const vig = ctx.createRadialGradient(W / 2, H / 2, 400, W / 2, H / 2, 950);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(0.7, 'rgba(2, 1, 1, 0.6)');
  vig.addColorStop(1, 'rgba(1, 0, 0, 0.92)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // 5. Titles / inscriptions
  drawTitle(ctx, t);
}

window.DUR = 10;
window.render = draw;
window.READY = true;
