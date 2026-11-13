// FilmCode demo: Archive Light Table
// Duration: 10 seconds
// Style: archive-lighttable

const W = 1920;
const H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Helper to draw rounded rectangle
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function draw(t) {
  // Clear
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);

  // Light table background
  const lt = ctx.createLinearGradient(0, 0, 0, H);
  lt.addColorStop(0, '#222');
  lt.addColorStop(1, '#111');
  ctx.fillStyle = lt;
  roundRect(ctx, 100, 80, W - 200, H - 160, 20);

  // Glass pane
  ctx.fillStyle = '#fff';
  roundRect(ctx, 150, 120, W - 300, H - 240, 15);

  // Letter content
  ctx.font = '48px Arial';
  ctx.fillStyle = '#222';
  ctx.textBaseline = 'top';
  const text = 'DEAR FRIEND,';
  const subtext = 'I hope this finds you well.\n\nSincerely,\nArchivist';
  const x = 200;
  const y = 200;
  ctx.fillText(text, x, y);
  const lines = subtext.split('\n');
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + 70 + i * 60);
  }

  // Loupe animation: circle moves across letter
  const loupeRadius = 200;
  const startX = 200;
  const endX = W - 200;
  const duration = 6; // seconds for full sweep
  const progress = Math.min(Math.max((t % duration) / duration, 0), 1);
  const lx = startX + (endX - startX) * progress;
  const ly = y + 70; // vertical center of text

  // Clip to loupe area
  ctx.save();
  ctx.beginPath();
  ctx.arc(lx, ly, loupeRadius, 0, Math.PI * 2);
  ctx.clip();

  // Draw text again inside loupe with brighter color
  ctx.fillStyle = '#fff';
  ctx.fillText(text, x, y);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + 70 + i * 60);
  }

  ctx.restore();

  // Loupe border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(lx, ly, loupeRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Catalogue number appears at bottom right
  const catNum = '001-2023';
  ctx.font = '36px Arial';
  ctx.fillStyle = '#fff';
  const catX = W - 200;
  const catY = H - 100;
  const catProgress = Math.min(Math.max((t - 8) / 2, 0), 1); // fade in last 2s
  ctx.globalAlpha = catProgress;
  ctx.fillText(catNum, catX, catY);
  ctx.globalAlpha = 1;
}

window.DUR = 10;
window.render = draw;
window.READY = true;
