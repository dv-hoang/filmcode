const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const laneY = [620, 680, 750, 830, 920];
const cars = [];
for (let i = 0; i < 45; i++) {
  cars.push({
    lane: i % laneY.length,
    x: (i * 137) % 2400 - 300,
    speed: 1.5 + (i % 3) * 0.8 + (i % 5) * 0.2,
    color: ['#e74c3c', '#f1c40f', '#3498db', '#ffffff', '#e67e22', '#2ecc71'][i % 6],
    length: 36 + (i % 3) * 14
  });
}

const trains = [
  { x: 100, speed: 2.2, color: '#c0392b' },
  { x: -900, speed: 2.2, color: '#27ae60' }
];

const clouds = [];
for (let i = 0; i < 12; i++) {
  clouds.push({
    x: i * 220 - 150,
    y: 40 + (i * 35) % 180,
    w: 240 + (i * 50) % 160,
    speed: 0.15 + (i % 3) * 0.05
  });
}

function draw(t) {
  ctx.fillStyle = '#1e2b3c';
  ctx.fillRect(0, 0, W, H);

  // 1. Sky & Sun
  const gradSky = ctx.createLinearGradient(0, 0, 0, 500);
  gradSky.addColorStop(0, '#3a7bd5');
  gradSky.addColorStop(1, '#e0eafc');
  ctx.fillStyle = gradSky;
  ctx.fillRect(0, 0, W, 500);

  ctx.fillStyle = 'rgba(255, 240, 200, 0.9)';
  ctx.beginPath();
  ctx.arc(1400, 180 + Math.sin(t * 0.1) * 10, 65, 0, Math.PI * 2);
  ctx.fill();

  // Moving cloud shadows / clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45);';
  clouds.forEach(c => {
    c.x += c.speed;
    if (c.x > W + 300) c.x = -400;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w, c.w * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Distant Hills & Suburbs (Miniature backdrop)
  ctx.fillStyle = '#2c5e3b';
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.lineTo(0, 400);
  for (let x = 0; x <= W; x += 120) {
    ctx.lineTo(x, 380 + Math.sin(x * 0.01 + t * 0.02) * 50);
  }
  ctx.lineTo(W, 480);
  ctx.fill();

  // Miniature houses & blocks (isometric-ish strips)
  ctx.fillStyle = '#8c7853';
  ctx.fillRect(0, 460, W, 40);
  ctx.fillStyle = '#dcd6d0';
  for (let x = 40; x < W; x += 90) {
    ctx.fillRect(x, 430, 60, 40);
    ctx.fillStyle = '#b23a3a'; // roof
    ctx.beginPath();
    ctx.moveTo(x - 5, 430);
    ctx.lineTo(x + 30, 405);
    ctx.lineTo(x + 65, 430);
    ctx.fill();
    ctx.fillStyle = '#dcd6d0';
  }

  // 3. Central District / Downtown Blocks
  ctx.fillStyle = '#9aa0a6';
  ctx.fillRect(200, 480, 1500, 120);

  // Buildings in downtown
  const bldgs = [
    {x: 300, w: 90, h: 180, col: '#bdc3c7'},
    {x: 420, w: 120, h: 240, col: '#7f8c8d'},
    {x: 580, w: 100, h: 140, col: '#95a5a6'},
    {x: 720, w: 140, h: 280, col: '#bdc3c7'},
    {x: 900, w: 110, h: 210, col: '#65737e'},
    {x: 1040, w: 130, h: 320, col: '#4f5b66'},
    {x: 1210, w: 90, h: 190, col: '#a7adba'},
    {x: 1340, w: 150, h: 250, col: '#343d46'}
  ];

  bldgs.forEach(b => {
    ctx.fillStyle = b.col;
    ctx.fillRect(b.x, 480 - b.h, b.w, b.h);
    // windows
    ctx.fillStyle = 'rgba(255, 230, 150, 0.8)';
    for (let wy = 480 - b.h + 15; wy < 470; wy += 20) {
      for (let wx = b.x + 10; wx < b.x + b.w - 10; wx += 16) {
        ctx.fillRect(wx, wy, 8, 12);
      }
    }
  });

  // 4. Roads and Traffic (Tilt-shift lower half)
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 580, W, 500);

  // Road lanes and markings
  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 4;
  ctx.setLineDash([25, 20]);
  laneY.forEach(y => {
    ctx.beginPath();
    ctx.moveTo(0, y + 25);
    ctx.lineTo(W, y + 25);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Trains on viaduct
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(0, 540, W, 18);
  trains.forEach(tr => {
    tr.x += tr.speed * (t * 0.05 + 0.8);
    if (tr.x > W + 400) tr.x = -600;
    ctx.fillStyle = tr.color;
    ctx.fillRect(tr.x, 528, 380, 24);
    ctx.fillStyle = '#fff';
    for (let tx = tr.x + 20; tx < tr.x + 360; tx += 40) {
      ctx.fillRect(tx, 533, 22, 14);
    }
  });

  // Moving cars (tilt-shift stop-motion jitter)
  const jump = Math.floor(t * 15);
  cars.forEach((c, idx) => {
    const jitter = Math.sin(jump + idx * 7) * 4;
    c.x += c.speed * 2.5;
    if (c.x > W + 200) c.x = -300;

    const cy = laneY[c.lane];
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.roundRect(c.x + jitter, cy + 8, c.length, 28, 6);
    ctx.fill();

    // windshield
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(c.x + jitter + c.length * 0.3, cy + 11, c.length * 0.4, 10);
  });

  // 5. Tilt-Shift Blur Simulation (Gaussian/Linear gradient overlays for top and bottom blur)
  const blurGradTop = ctx.createLinearGradient(0, 0, 0, 480);
  blurGradTop.addColorStop(0, 'rgba(30, 43, 60, 0.65)');
  blurGradTop.addColorStop(0.7, 'rgba(30, 43, 60, 0.25)');
  blurGradTop.addColorStop(1, 'rgba(30, 43, 60, 0)');
  ctx.fillStyle = blurGradTop;
  ctx.fillRect(0, 0, W, 480);

  const blurGradBot = ctx.createLinearGradient(0, 720, 0, H);
  blurGradBot.addColorStop(0, 'rgba(44, 62, 80, 0)');
  blurGradBot.addColorStop(0.3, 'rgba(44, 62, 80, 0.3)');
  blurGradBot.addColorStop(1, 'rgba(44, 62, 80, 0.85)');
  ctx.fillStyle = blurGradBot;
  ctx.fillRect(0, 720, W, H - 720);

  // 6. Miniature depth vignette & warm Kodachrome grading
  const vignette = ctx.createRadialGradient(W/2, H/2, 400, W/2, H/2, 1000);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(10, 5, 0, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

window.DUR = 10;
window.render = draw;
window.READY = true;
