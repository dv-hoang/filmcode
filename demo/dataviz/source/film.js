// Data Flow Demo – 10 second animation
// window.DUR = 10; window.render = draw; window.READY = true

window.DUR = 10;
window.READY = true;

const NUM_BARS = 10;
const BAR_WIDTH = 60;
const BAR_GAP = 20;
const MAX_HEIGHT = 400;
const BASE_Y = 500;
const LINE_COLOR = '#0066cc';
const BAR_COLOR = '#ff6600';
const BG_COLOR = '#ffffff';
const AXIS_COLOR = '#333333';

function draw(ctx, t) {
  // Clear
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw axes
  ctx.strokeStyle = AXIS_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, BASE_Y);
  ctx.lineTo(50, 100);
  ctx.lineTo(ctx.canvas.width - 50, 100);
  ctx.stroke();

  // Compute data values
  const values = [];
  for (let i = 0; i < NUM_BARS; i++) {
    const phase = (i / NUM_BARS) * Math.PI * 2;
    const val = (Math.sin(t + phase) + 1) / 2; // 0..1
    values.push(val);
  }

  // Draw bars
  ctx.fillStyle = BAR_COLOR;
  for (let i = 0; i < NUM_BARS; i++) {
    const x = 70 + i * (BAR_WIDTH + BAR_GAP);
    const h = values[i] * MAX_HEIGHT;
    const y = BASE_Y - h;
    ctx.fillRect(x, y, BAR_WIDTH, h);
  }

  // Draw line chart over bars
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < NUM_BARS; i++) {
    const x = 70 + i * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2;
    const h = values[i] * MAX_HEIGHT;
    const y = BASE_Y - h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw title
  ctx.fillStyle = AXIS_COLOR;
  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Data Flow Demo', ctx.canvas.width / 2, 50);
}

window.render = draw;
