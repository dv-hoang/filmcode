// Brick-Toy Train — 10s Canvas 2D demo
const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const BRICK_W = 80;
const BRICK_H = 40;
const WHEEL_R = 12;
const SPEED = 220;
const NUM_BRICKS = 5;

function draw(t) {
  ctx.fillStyle = '#f0e4d7';
  ctx.fillRect(0, 0, W, H);

  const groundY = H * 0.75;
  ctx.fillStyle = '#c49e6c';
  ctx.fillRect(0, groundY, W, H - groundY);

  ctx.fillStyle = '#d9b38c';
  for (let x = 0; x < W; x += BRICK_W * 2) {
    ctx.fillRect(x, groundY - BRICK_H, BRICK_W, BRICK_H);
    ctx.fillRect(x + BRICK_W, groundY - BRICK_H * 2, BRICK_W, BRICK_H);
  }

  const trainX = -NUM_BRICKS * (BRICK_W + 10) + SPEED * t;
  const trainY = groundY - BRICK_H - WHEEL_R * 2;

  for (let i = 0; i < NUM_BRICKS; i++) {
    const bx = trainX + i * (BRICK_W + 10);
    const by = trainY + Math.sin(t * 14 + i) * 2;
    ctx.fillStyle = i === 0 ? '#c0392b' : '#b5651d';
    ctx.fillRect(bx, by, BRICK_W, BRICK_H);
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, BRICK_W, BRICK_H);
    // studs
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.arc(bx + 12 + s * 18, by + 12, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#333';
    const wheelY = by + BRICK_H + WHEEL_R;
    const rot = t * SPEED / WHEEL_R;
    for (const wx of [bx + BRICK_W * 0.25, bx + BRICK_W * 0.75]) {
      ctx.beginPath();
      ctx.arc(wx, wheelY, WHEEL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#777';
      ctx.beginPath();
      ctx.moveTo(wx, wheelY);
      ctx.lineTo(wx + Math.cos(rot) * WHEEL_R, wheelY + Math.sin(rot) * WHEEL_R);
      ctx.stroke();
    }
  }

  if (t < 2.2) {
    ctx.fillStyle = '#5a3e2b';
    ctx.font = '600 52px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(1, t / 0.4) * Math.min(1, (2.2 - t) / 0.35);
    ctx.fillText('Brick-Toy Train', W / 2, H * 0.2);
    ctx.globalAlpha = 1;
  }

  if (t > 9.4) {
    ctx.fillStyle = `rgba(240,228,215,${Math.min(1, (t - 9.4) / 0.5)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

window.DUR = 10;
window.render = draw;
window.READY = true;
