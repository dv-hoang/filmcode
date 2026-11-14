window.DUR = 10;
window.READY = true;

const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const NAVY = '#050b14';
const BLUE = '#0a2342';
const RED = '#c8102e';
const GOLD = '#f0a500';
const WHITE = '#ffffff';
const GRAY = '#8899aa';

const stories = [
  { num: '01', title: 'ORBITAL STATION ALPHA DOCKS NEW MODULE', cat: 'SPACE' },
  { num: '02', title: 'GLOBAL RENEWABLE GRID SURPASSES 60%', cat: 'ENERGY' },
  { num: '03', title: 'QUANTUM ENCRYPTION STANDARD RATIFIED', cat: 'TECH' }
];

const marketData = [
  { label: 'SOLAR INDEX', val: '4,820.10', change: '+2.4%' },
  { label: 'FUSION CO.', val: '128.45', change: '+5.1%' },
  { label: 'SYNTH-AGRI', val: '912.80', change: '-0.8%' },
  { label: 'ORBIT LOG', val: '314.00', change: '+1.9%' }
];

function smoothstep(min, max, value) {
  let x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function drawSting(t) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(10, 35, 66, 0.8)';
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  let p = smoothstep(0.2, 1.2, t);
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, 0);
  ctx.lineTo(W * (0.5 + p * 0.6), 0);
  ctx.lineTo(W * (0.5 - p * 0.4), H);
  ctx.lineTo(W * 0.5 - 200, H);
  ctx.fill();

  let p2 = smoothstep(0.4, 1.4, t);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(W * 0.5 - 150, 0);
  ctx.lineTo(W * (0.5 - 150 + p2 * 0.5), 0);
  ctx.lineTo(W * (0.5 - 350 + p2 * 0.5), H);
  ctx.lineTo(W * 0.5 - 500, H);
  ctx.fill();

  if (t > 0.8) {
    let alpha = smoothstep(0.8, 1.2, t);
    ctx.save();
    ctx.globalAlpha = alpha;
    
    ctx.fillStyle = BLUE;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.fillRect(W/2 - 450, H/2 - 120, 900, 240);
    ctx.strokeRect(W/2 - 450, H/2 - 120, 900, 240);

    ctx.fillStyle = RED;
    ctx.fillRect(W/2 - 450, H/2 - 120, 220, 60);

    ctx.fillStyle = WHITE;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LIVE BULLETIN', W/2 - 340, H/2 - 90);

    ctx.font = 'bold 64px sans-serif';
    ctx.fillStyle = WHITE;
    ctx.fillText('GLOBAL NEWS', W/2, H/2 + 10);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = GOLD;
    ctx.fillText('SPECIAL REPORT • 24/7 NETWORK FEED', W/2, H/2 + 75);
    ctx.restore();
  }
}

function drawChannelBug() {
  ctx.save();
  ctx.fillStyle = BLUE;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.fillRect(W - 240, 30, 210, 70);
  ctx.strokeRect(W - 240, 30, 210, 70);

  ctx.fillStyle = RED;
  ctx.fillRect(W - 240, 30, 70, 70);

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GN', W - 205, 65);

  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LIVE', W - 150, 65);

  ctx.fillStyle = (Math.floor(Date.now() / 400) % 2 === 0) ? RED : '#500';
  ctx.beginPath();
  ctx.arc(W - 90, 65, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLowerThird(t, headline, sub) {
  let yBase = H - 140;
  ctx.save();

  ctx.fillStyle = RED;
  ctx.fillRect(100, yBase - 12, 120, 12);

  ctx.fillStyle = BLUE;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.fillRect(100, yBase, 1300, 80);
  ctx.strokeRect(100, yBase, 1300, 80);

  ctx.fillStyle = GOLD;
  ctx.fillRect(120, yBase + 15, 140, 50);
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BREAKING', 190, yBase + 40);

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(headline, 290, yBase + 40);

  ctx.restore();
}

function drawTicker() {
  ctx.save();
  ctx.fillStyle = '#02050a';
  ctx.fillRect(0, H - 45, W, 45);

  ctx.fillStyle = RED;
  ctx.fillRect(0, H - 45, 160, 45);
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MARKETS', 80, H - 22);

  let xOffset = 200;
  marketData.forEach(m => {
    ctx.fillStyle = GRAY;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(m.label, xOffset, H - 22);
    xOffset += 130;

    ctx.fillStyle = WHITE;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(m.val, xOffset, H - 22);
    xOffset += 110;

    ctx.fillStyle = m.change.startsWith('+') ? '#00ff88' : '#ff4444';
    ctx.fillText(m.change, xOffset, H - 22);
    xOffset += 100;
  });
  ctx.restore();
}

function drawRundown(t) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, H);

  drawChannelBug();

  ctx.fillStyle = BLUE;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.fillRect(150, 80, W - 300, 90);
  ctx.strokeRect(150, 80, W - 300, 90);

  ctx.fillStyle = RED;
  ctx.fillRect(150, 80, 220, 90);
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BULLETIN', 260, 125);

  ctx.fillStyle = GOLD;
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TODAY\'S TOP STORIES', 400, 125);

  stories.forEach((s, i) => {
    let y = 220 + i * 160;
    let animT = smoothstep(2.4 + i * 0.3, 2.9 + i * 0.3, t);
    
    ctx.save();
    ctx.globalAlpha = animT;
    ctx.translate(0, (1 - animT) * 40);

    ctx.fillStyle = BLUE;
    ctx.strokeStyle = i === 0 ? GOLD : 'rgba(240,165,0,0.3)';
    ctx.lineWidth = i === 0 ? 3 : 1;
    ctx.fillRect(150, y, W - 300, 130);
    ctx.strokeRect(150, y, W - 300, 130);

    ctx.fillStyle = i === 0 ? RED : '#112244';
    ctx.fillRect(150, y, 120, 130);
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.num, 210, y + 65);

    ctx.fillStyle = GOLD;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`[ ${s.cat} ]`, 300, y + 35);

    ctx.fillStyle = WHITE;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(s.title, 300, y + 80);

    ctx.restore();
  });

  drawTicker();
}

function drawSpecCard(t) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, H);

  drawChannelBug();

  ctx.fillStyle = BLUE;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.fillRect(150, 80, W - 300, 90);
  ctx.strokeRect(150, 80, W - 300, 90);

  ctx.fillStyle = RED;
  ctx.fillRect(150, 80, 240, 90);
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SYSTEM SPEC', 270, 125);

  ctx.fillStyle = GOLD;
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ORBITAL STATION ALPHA: POWER METRICS', 420, 125);

  let specs = [
    { label: 'SOLAR ARRAY EFFICIENCY', val: '94.2%', pct: 0.94 },
    { label: 'FUSION CORE STABILITY', val: '88.7%', pct: 0.88 },
    { label: 'LIFE SUPPORT RESERVES', val: '99.9%', pct: 0.99 },
    { label: 'QUANTUM BUFFER CAPACITY', val: '76.4%', pct: 0.76 }
  ];

  specs.forEach((sp, i) => {
    let y = 240 + i * 140;
    let barT = smoothstep(5.7 + i * 0.2, 6.3 + i * 0.2, t);

    ctx.fillStyle = BLUE;
    ctx.strokeStyle = 'rgba(240,165,0,0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(150, y, W - 300, 110);
    ctx.strokeRect(150, y, W - 300, 110);

    ctx.fillStyle = WHITE;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(sp.label, 190, y + 35);

    ctx.fillStyle = GOLD;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(sp.val, W - 190, y + 35);

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(190, y + 65, W - 420, 24);

    ctx.fillStyle = RED;
    ctx.fillRect(190, y + 65, (W - 420) * sp.pct * barT, 24);
  });

  if (t > 7.2) {
    let stAlpha = smoothstep(7.2, 7.6, t);
    ctx.save();
    ctx.globalAlpha = stAlpha;
    ctx.translate(W - 450, H - 350);
    ctx.rotate(-0.15);

    ctx.strokeStyle = RED;
    ctx.lineWidth = 8;
    ctx.strokeRect(-180, -70, 360, 140);

    ctx.fillStyle = RED;
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VERIFIED', 0, 0);

    ctx.restore();
  }

  drawLowerThird(t, 'ORBITAL STATION ALPHA MODULE FULLY OPERATIONAL', 'LIVE FEED');
  drawTicker();
}

function drawOutro(t) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, H);

  drawChannelBug();

  let alpha = smoothstep(8.5, 9.0, t);
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = BLUE;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.fillRect(W/2 - 500, H/2 - 150, 1000, 300);
  ctx.strokeRect(W/2 - 500, H/2 - 150, 1000, 300);

  ctx.fillStyle = RED;
  ctx.fillRect(W/2 - 500, H/2 - 150, 1000, 70);

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GLOBAL NEWS • CONTINUOUS COVERAGE', W/2, H/2 - 115);

  ctx.font = 'bold 56px sans-serif';
  ctx.fillStyle = WHITE;
  ctx.fillText('END OF BULLETIN', W/2, H/2 + 20);

  ctx.font = '24px sans-serif';
  ctx.fillStyle = GOLD;
  ctx.fillText('STAY TUNED FOR NEXT UPDATE AT THE TOP OF THE HOUR', W/2, H/2 + 90);

  ctx.restore();
  drawTicker();
}

function draw(t) {
  ctx.clearRect(0, 0, W, H);

  if (t < 2.2) {
    drawSting(t);
  } else if (t < 5.5) {
    drawRundown(t);
  } else if (t < 8.5) {
    drawSpecCard(t);
  } else {
    drawOutro(t);
  }
}

window.render = draw;
