// Chalk strokes: centre-line samples, pressure width, grain deposit.
// A finished stroke is baked once. A stroke still being written is redrawn from the same samples.

const SS = 2;

function grainTile() {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  let n = 42;
  const rnd = () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
  for (let i = 0; i < s * s; i++) {
    const r = rnd();
    // Firm chalk: most grains take pigment. A few pits, no sugar halo.
    let a = 255;
    if (r > 0.82) a = 150 + Math.floor(rnd() * 70);
    if (r > 0.94) a = 40 + Math.floor(rnd() * 50);
    img.data[i * 4] = 255;
    img.data[i * 4 + 1] = 255;
    img.data[i * 4 + 2] = 255;
    img.data[i * 4 + 3] = a;
  }
  g.putImageData(img, 0, 0);
  return g.createPattern(c, 'repeat');
}

const GRAIN = grainTile();

export function widthMul(u, kind) {
  const ends = Math.abs(u - 0.5) * 2;
  let m = 0.74 + 0.32 * ends * ends;
  if (u < 0.12) m *= 1 + 0.14 * (1 - u / 0.12);
  if (kind === 'taper' && u > 0.6) m *= 1 - 0.7 * ((u - 0.6) / 0.4);
  if (kind === 'dot') m *= 0.45 + 0.7 * Math.sin(Math.min(1, u) * Math.PI);
  return Math.max(0.18, m);
}

function paint(samples, u, color, powder) {
  if (!samples.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let maxW = 1;
  for (const p of samples) {
    minX = Math.min(minX, p.x - p.w);
    minY = Math.min(minY, p.y - p.w);
    maxX = Math.max(maxX, p.x + p.w);
    maxY = Math.max(maxY, p.y + p.w);
    maxW = Math.max(maxW, p.w);
  }
  const pad = maxW + 8;
  minX -= pad;
  minY -= pad;
  const bw = Math.max(2, Math.ceil(maxX - minX + pad));
  const bh = Math.max(2, Math.ceil(maxY - minY + pad));
  if (bw > 6000 || bh > 4000) throw new Error(`stroke sprite too large ${bw}x${bh}`);

  const hi = document.createElement('canvas');
  hi.width = Math.max(1, bw * SS);
  hi.height = Math.max(1, bh * SS);
  const h = hi.getContext('2d');
  h.scale(SS, SS);
  h.translate(-minX, -minY);
  h.lineCap = 'round';
  h.lineJoin = 'round';
  h.strokeStyle = '#fff';

  const n = samples.length;
  const f = Math.max(0, Math.min(1, u)) * (n - 1);
  const last = Math.max(1, Math.ceil(f));
  for (let i = 1; i <= last && i < n; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    const segU = i === last && f < last ? f - (last - 1) : 1;
    const x = a.x + (b.x - a.x) * segU;
    const y = a.y + (b.y - a.y) * segU;
    h.beginPath();
    h.lineWidth = Math.max(2.2, a.w);
    h.moveTo(a.x, a.y);
    h.lineTo(x, y);
    h.stroke();
  }

  if (powder && u >= 0.98) {
    const tip = samples[n - 1];
    const grains = [
      [6, -4, 2.1], [11, 3, 1.6], [-3, 7, 1.8], [8, 8, 1.3],
    ];
    h.fillStyle = '#fff';
    for (const [dx, dy, r] of grains) {
      h.beginPath();
      h.arc(tip.x + dx, tip.y + dy, r, 0, Math.PI * 2);
      h.fill();
    }
  }

  h.setTransform(1, 0, 0, 1, 0, 0);
  h.globalCompositeOperation = 'destination-in';
  h.fillStyle = GRAIN;
  h.fillRect(0, 0, hi.width, hi.height);
  h.globalCompositeOperation = 'source-in';
  h.fillStyle = color;
  h.fillRect(0, 0, hi.width, hi.height);

  const out = document.createElement('canvas');
  out.width = bw;
  out.height = bh;
  out.getContext('2d').drawImage(hi, 0, 0, bw, bh);
  return { canvas: out, x: minX, y: minY };
}

export function bakeStroke(samples, color) {
  return paint(samples, 1, color, true);
}

export function drawPartial(samples, u, color) {
  if (u <= 0) return null;
  if (u >= 1) return paint(samples, 1, color, true);
  return paint(samples, u, color, false);
}

export function blit(ctx, cam, sprite) {
  if (!sprite) return;
  const x = 960 + (sprite.x - cam.cx) * cam.s;
  const y = 540 + (sprite.y - cam.cy) * cam.s;
  ctx.drawImage(sprite.canvas, x, y, sprite.canvas.width * cam.s, sprite.canvas.height * cam.s);
}
