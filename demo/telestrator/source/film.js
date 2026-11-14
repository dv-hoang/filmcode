const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const pr = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// Procedural match pitch & player simulation
const players = [
  { id: 1, x: 400, y: 350, vx: 18, vy: 4, team: 'A', name: '07' },
  { id: 2, x: 620, y: 520, vx: 22, vy: -12, team: 'A', name: '10' },
  { id: 3, x: 880, y: 300, vx: -15, vy: 20, team: 'A', name: '04' },
  { id: 4, x: 1150, y: 680, vx: -8, vy: -15, team: 'A', name: '09' },
  { id: 5, x: 500, y: 700, vx: 25, vy: 8, team: 'B', name: '11' },
  { id: 6, x: 780, y: 440, vx: -18, vy: 14, team: 'B', name: '05' },
  { id: 7, x: 1020, y: 550, vx: 12, vy: 18, team: 'B', name: '08' },
  { id: 8, x: 1350, y: 400, vx: -22, vy: -10, team: 'B', name: '02' }
];

function getPos(p, t) {
  let cx = p.x + p.vx * t;
  let cy = p.y + p.vy * t;
  // keep inside pitch bounds
  if (cx < 200 || cx > 1720) p.vx *= -1;
  if (cy < 180 || cy > 900) p.vy *= -1;
  return { x: cx, y: cy };
}

function drawPitch(t) {
  // Turf gradient
  const grad = ctx.createLinearGradient(0, 100, 0, 980);
  grad.addColorStop(0, '#103a18');
  grad.addColorStop(0.5, '#164820');
  grad.addColorStop(1, '#0e3214');
  ctx.fillStyle = grad;
  ctx.fillRect(100, 100, 1720, 880);

  // Stripe mows
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let x = 100; x < 1820; x += 120) {
    if ((Math.floor(x / 120) % 2) === 0) {
      ctx.fillRect(x, 100, 120, 880);
    }
  }

  // Pitch lines (White with glow)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 4;
  ctx.shadowColor = 'rgba(255,255,255,0.6)';
  ctx.shadowBlur = 8;

  // Outer boundary
  ctx.strokeRect(150, 150, 1620, 780);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(960, 150);
  ctx.lineTo(960, 930);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(960, 540, 110, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(960, 540, 6, 0, Math.PI * 2);
  ctx.fill();

  // Penalty areas
  ctx.strokeRect(150, 340, 260, 400);
  ctx.strokeRect(1510, 340, 260, 400);

  // Goal boxes
  ctx.strokeRect(150, 450, 90, 180);
  ctx.strokeRect(1680, 450, 90, 180);

  ctx.shadowBlur = 0;
}

function drawHUD(t) {
  // Score bug top-left
  ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
  ctx.strokeStyle = '#304868';
  ctx.lineWidth = 2;
  ctx.fillRect(80, 40, 360, 70);
  ctx.strokeRect(80, 40, 360, 70);

  ctx.fillStyle = '#ff3344';
  ctx.fillRect(80, 40, 12, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('UNITED', 110, 85);
  ctx.fillStyle = '#ffcc00';
  ctx.fillText('2', 280, 85);
  ctx.fillStyle = '#66aaff';
  ctx.fillText('1', 320, 85);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('CITY', 360, 85);

  // Match clock top center
  ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
  ctx.fillRect(860, 40, 200, 70);
  ctx.strokeRect(860, 40, 200, 70);
  ctx.fillStyle = '#00ffcc';
  ctx.font = 'bold 30px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('78:42', 960, 85);

  // Telestrator Mode Tag bottom right
  const pMode = pr(t, 2.0, 2.5);
  if (pMode > 0) {
    ctx.globalAlpha = pMode;
    ctx.fillStyle = 'rgba(255, 140, 0, 0.9)';
    ctx.fillRect(1460, 970, 380, 60);
    ctx.fillStyle = '#05070a';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TELUSTRATOR ACTIVE', 1650, 1008);
    ctx.globalAlpha = 1.0;
  }
}

function drawDrawings(t) {
  // 3.0s to 7.0s: Pundit draws telestrator annotations
  const drawProg = pr(t, 3.2, 6.5);
  if (drawProg <= 0) return;

  ctx.save();
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#ff9900';
  ctx.shadowBlur = 15;

  // 1. Circle around player 2
  const p2 = getPos(players[1], t);
  const c1Prog = pr(drawProg, 0.0, 0.3);
  if (c1Prog > 0) {
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 55, 0, Math.PI * 2 * c1Prog);
    ctx.stroke();
  }

  // 2. Arrow passing line from player 2 to player 4
  const p4 = getPos(players[3], t);
  const aProg = pr(drawProg, 0.3, 0.7);
  if (aProg > 0) {
    const currX = lerp(p2.x + 50, p4.x - 40, smooth(aProg));
    const currY = lerp(p2.y, p4.y, smooth(aProg));
    
    ctx.beginPath();
    ctx.moveTo(p2.x + 50, p2.y);
    ctx.lineTo(currX, currY);
    ctx.stroke();

    if (aProg > 0.8) {
      // Arrowhead
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(p4.x - 40, p4.y);
      ctx.lineTo(p4.x - 65, p4.y - 15);
      ctx.lineTo(p4.x - 65, p4.y + 15);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 3. Shaded tactical space (polygon)
  const shadeProg = pr(drawProg, 0.7, 1.0);
  if (shadeProg > 0) {
    ctx.fillStyle = 'rgba(255, 68, 68, 0.35)';
    ctx.strokeStyle = '#ff3344';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(750, 420);
    ctx.lineTo(1050, 380);
    ctx.lineTo(1120, 580);
    ctx.lineTo(820, 620);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // "SPACE" text label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillText('VACANT ZONE', 935, 515);
  }

  ctx.restore();
}

function drawRewindVCR(t) {
  // Rewind effect between 1.8s and 2.3s
  const rwProg = pr(t, 1.8, 2.3);
  if (rwProg > 0 && rwProg < 1) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = 'bold 60px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◄◄ REWIND 2.0s', 960, 540);

    // Scanlines / static glitch
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = 0; i < H; i += 12) {
      ctx.fillRect(0, (i + t * 400) % H, W, 4);
    }
  }
}

function drawBoardWipe(t) {
  // Final transition wipe from pitch to tactical chalkboard at t = 7.5s - 8.2s
  const wipeProg = pr(t, 7.5, 8.3);
  if (wipeProg <= 0) return;

  const width = lerp(0, W + 400, smooth(wipeProg));
  ctx.save();
  ctx.fillStyle = '#183020'; // chalkboard green
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W - width + 400, 0);
  ctx.lineTo(W - width, H);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Chalkboard border & grid
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(100, 100, 1720, 880);

  if (wipeProg > 0.6) {
    const textAlpha = pr(wipeProg, 0.6, 1.0);
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TACTICAL SUMMARY: PRESS 4-3-3', 960, 220);

    // Tactical X/O diagram on board
    ctx.font = 'bold 44px monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('O  O  O', 960, 420);
    ctx.fillStyle = '#66aaff';
    ctx.fillText('X     X     X', 960, 620);

    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ANALYSIS CONCLUDED — MATCH FEED RESUMES', 960, 850);
  }
  ctx.restore();
}

export function draw(t) {
  ctx.clearRect(0, 0, W, H);

  // 1. Render Pitch
  drawPitch(t);

  // 2. Render Players
  players.forEach(p => {
    const pos = getPos(p, t);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    
    // Player circle
    ctx.fillStyle = p.team === 'A' ? '#ff3344' : '#2266ff';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Player number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.name, pos.x, pos.y);
    ctx.restore();
  });

  // 3. Ball
  const ballX = lerp(850, 980, Math.sin(t * 3));
  const ballY = lerp(500, 520, Math.cos(t * 4));
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4. HUD / Score bug / Clocks
  drawHUD(t);

  // 5. Rewind effect
  drawRewindVCR(t);

  // 6. Telestrator Annotations
  drawDrawings(t);

  // 7. Tactical Board Flatten Wipe
  drawBoardWipe(t);

  // 8. CRT Vignette & Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 2);
  }

  // Vignette
  const grad = ctx.createRadialGradient(W/2, H/2, H/3, W/2, H/2, W/1.1);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

window.DUR = 10;
window.render = draw;
window.READY = true;
