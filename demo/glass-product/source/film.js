// window.DUR = 10 seconds
window.DUR = 10;

// Render function called with canvas context and time in seconds
window.render = function(ctx, t) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  // Clear background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, w, h);

  // Center of canvas
  const cx = w / 2;
  const cy = h / 2;
  const size = Math.min(w, h) * 0.4;

  // Rotation angle
  const angle = (t / window.DUR) * Math.PI * 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Draw glass cube (square) with gradient fill
  const grad = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
  grad.addColorStop(0, 'rgba(255,255,255,0.15)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  grad.addColorStop(1, 'rgba(255,255,255,0.15)');
  ctx.fillStyle = grad;
  ctx.fillRect(-size/2, -size/2, size, size);

  // Glass edges
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 4;
  ctx.strokeRect(-size/2, -size/2, size, size);

  ctx.restore();

  // Light sweep effect: moving radial gradient across canvas
  const sweep = (t % 2) / 2; // 0 to 1 over 2 seconds
  const sweepX = w * sweep;
  const sweepY = h * sweep;
  const sweepGrad = ctx.createRadialGradient(sweepX, sweepY, 0, sweepX, sweepY, size * 2);
  sweepGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
  sweepGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  sweepGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sweepGrad;
  ctx.fillRect(0, 0, w, h);
};

window.READY = true;
