// Plate helpers. The 2D canvas stores ink density: R = teal, G = fluorescent pink.
// source-over black is a knockout (paper). lighter adds a plate without erasing the other.

export const W = 1920;
export const H = 1080;

export function dens(channel, d) {
  const v = Math.max(0, Math.min(255, Math.round(d * 255)));
  if (channel === 'r') return `rgb(${v},0,0)`;
  if (channel === 'g') return `rgb(0,${v},0)`;
  throw new Error(`unknown plate ${channel}`);
}

export const TEAL = (d = 1) => dens('r', d);
export const PINK = (d = 1) => dens('g', d);

export function clearPlates(ctx) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);
}

export function knockout(ctx, build) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  build(ctx);
  ctx.fill();
  ctx.restore();
}

/** Overprint one plate. knock true clears every plate under the shape first (a solid of one ink). */
export function over(ctx, color, build, knock = false) {
  if (knock) knockout(ctx, build);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.beginPath();
  build(ctx);
  ctx.fill();
  ctx.restore();
}

/**
 * Paper halo, then the drawing.
 * draw(ctx, 'knock' | 'ink') must fill immediately (do not build a path and return).
 * screenScale is the current world-to-screen scale so the halo stays ~4.5 px on screen.
 */
export function layer(ctx, screenScale, draw) {
  const width = 9 / Math.max(0.15, screenScale);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, 'knock');
  ctx.restore();
  draw(ctx, 'ink');
}

/** Two-bone reach. bend +1 / -1 chooses the elbow side. Lengths are clamped so the target is always reachable. */
export function ik2(ax, ay, tx, ty, l1, l2, bend = 1) {
  const dx = tx - ax;
  const dy = ty - ay;
  const max = l1 + l2 - 1;
  const min = Math.abs(l1 - l2) + 1;
  const d = Math.max(min, Math.min(max, Math.hypot(dx, dy)));
  const ang = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const clamped = Math.max(-1, Math.min(1, cosA));
  const a = Math.acos(clamped) * bend;
  const a1 = ang + a;
  const ex = ax + Math.cos(a1) * l1;
  const ey = ay + Math.sin(a1) * l1;
  const a2 = Math.atan2(ty - ey, tx - ex);
  return { ex, ey, a1, a2 };
}
