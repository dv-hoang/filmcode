// Opaque silkscreen: one path per ink, stepped bands, registration, a ragged pull.
import { mulberry, vnoise, hash } from '/core/lib.js';

export const W = 1920;
export const H = 1080;

let scratch, paper, mottle, pinholes, mesh;

export function makeTextures(paperColor) {
  const rng = mulberry(11);
  paper = document.createElement('canvas');
  paper.width = W;
  paper.height = H;
  const pg = paper.getContext('2d');
  pg.fillStyle = paperColor;
  pg.fillRect(0, 0, W, H);
  pg.globalAlpha = 0.22;
  for (let i = 0; i < 2800; i++) {
    pg.strokeStyle = rng() > 0.55 ? '#e7dcc8' : '#fffaf1';
    pg.lineWidth = rng() > 0.8 ? 1.4 : 0.6;
    pg.beginPath();
    const x = rng() * W;
    const y = rng() * H;
    pg.moveTo(x, y);
    pg.lineTo(x + 8 + rng() * 22, y + (rng() - 0.5) * 1.6);
    pg.stroke();
  }

  mottle = document.createElement('canvas');
  mottle.width = 512;
  mottle.height = 512;
  const mg = mottle.getContext('2d');
  const img = mg.createImageData(512, 512);
  const mr = mulberry(19);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 228 + mr() * 27;
    img.data[i] = n;
    img.data[i + 1] = n - 4;
    img.data[i + 2] = n - 10;
    img.data[i + 3] = 255;
  }
  mg.putImageData(img, 0, 0);

  pinholes = document.createElement('canvas');
  pinholes.width = W;
  pinholes.height = H;
  const hg = pinholes.getContext('2d');
  const hr = mulberry(23);
  hg.fillStyle = '#000';
  for (let i = 0; i < 900; i++) {
    const x = hr() * W;
    const y = hr() * H;
    const r = hr() > 0.85 ? 1.7 : 1.05;
    hg.beginPath();
    hg.arc(x, y, r, 0, Math.PI * 2);
    hg.fill();
  }

  mesh = document.createElement('canvas');
  mesh.width = W;
  mesh.height = H;
  const xg = mesh.getContext('2d');
  xg.strokeStyle = 'rgba(40, 32, 24, 0.45)';
  xg.lineWidth = 1;
  for (let x = 0; x <= W; x += 7) {
    xg.beginPath();
    xg.moveTo(x, 0);
    xg.lineTo(x, H);
    xg.stroke();
  }
  for (let y = 0; y <= H; y += 7) {
    xg.beginPath();
    xg.moveTo(0, y);
    xg.lineTo(W, y);
    xg.stroke();
  }

  scratch = document.createElement('canvas');
  scratch.width = W;
  scratch.height = H;
  return { paper, mesh };
}

function reset(g) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.letterSpacing = '0px';
  g.shadowBlur = 0;
  g.clearRect(0, 0, W, H);
}

function compound(spec) {
  if (!spec.knock && !spec.even) return spec.path;
  const p = new Path2D();
  p.addPath(spec.path);
  if (spec.knock) p.addPath(spec.knock);
  return p;
}

function fillSpec(g, spec) {
  const p = compound(spec);
  if (spec.knock || spec.even) g.fill(p, 'evenodd');
  else g.fill(p);
}

function clipSpec(g, spec) {
  const p = compound(spec);
  if (spec.knock || spec.even) g.clip(p, 'evenodd');
  else g.clip(p);
}

// Ragged reveal, left of a squeegee. Tail ~30 units.
export function wipePath(p, seed) {
  const front = -36 + p * (W + 72);
  const path = new Path2D();
  path.moveTo(-80, -80);
  path.lineTo(-80, H + 80);
  const n = 42;
  for (let i = n; i >= 0; i--) {
    const y = -80 + ((H + 160) * i) / n;
    const j = vnoise(y * 0.012 + seed * 1.7);
    const tail = -Math.abs(Math.sin(y * 0.037 + seed)) * 30 * (0.35 + 0.65 * hash(seed * 17 + i));
    path.lineTo(front + (j - 0.5) * 12 + tail, y);
  }
  path.closePath();
  return path;
}

export function wipeFrontX(p) {
  return -36 + p * (W + 72);
}

// Paint one ink onto `main` (already in poster space). Later ink covers earlier ink.
export function ink(main, spec, opt) {
  const g = scratch.getContext('2d');
  reset(g);
  g.save();
  if (opt.clip) g.clip(opt.clip);
  const reg = opt.reg || [0, 0];
  const gap = opt.gap;
  const thick = opt.thick;

  if (thick && (thick[0] || thick[1])) {
    g.save();
    g.translate(reg[0] + thick[0], reg[1] + thick[1]);
    g.fillStyle = opt.thickColor || '#142022';
    fillSpec(g, spec);
    g.restore();
  }
  if (gap && (gap[0] || gap[1])) {
    g.save();
    g.translate(reg[0] + gap[0], reg[1] + gap[1]);
    g.fillStyle = opt.paper || '#F6F1E4';
    fillSpec(g, spec);
    g.restore();
  }

  if (opt.trap !== false) {
    g.save();
    g.translate(reg[0] + 2.2, reg[1] + 2.2);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = 'rgba(18, 12, 8, 0.55)';
    fillSpec(g, spec);
    g.restore();
  }

  g.save();
  g.translate(reg[0], reg[1]);
  g.fillStyle = opt.color;
  fillSpec(g, spec);
  g.restore();

  g.save();
  g.translate(reg[0], reg[1]);
  clipSpec(g, spec);
  g.fillStyle = 'rgba(255, 248, 236, 0.20)';
  g.translate(-1.7, -1.7);
  fillSpec(g, spec);
  g.translate(3.4, 3.4);
  g.fillStyle = 'rgba(8, 6, 4, 0.28)';
  fillSpec(g, spec);
  g.restore();

  if (opt.sheen > 0 && opt.front != null) {
    g.save();
    if (opt.clip) g.clip(opt.clip);
    g.translate(reg[0], reg[1]);
    clipSpec(g, spec);
    g.globalAlpha = 0.38 * opt.sheen;
    g.fillStyle = '#fffaf2';
    g.fillRect(opt.front - reg[0] - 34, -20, 20, H + 40);
    g.restore();
  }

  g.save();
  if (opt.clip) g.clip(opt.clip);
  g.translate(reg[0], reg[1]);
  clipSpec(g, spec);
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = 0.55;
  for (let y = -512; y < H; y += 512) {
    for (let x = -512; x < W; x += 512) g.drawImage(mottle, x, y);
  }
  g.restore();

  g.save();
  if (opt.clip) g.clip(opt.clip);
  g.translate(reg[0], reg[1]);
  clipSpec(g, spec);
  g.globalCompositeOperation = 'destination-out';
  g.globalAlpha = 0.75;
  g.drawImage(pinholes, -reg[0], -reg[1]);
  g.restore();

  g.restore();
  main.drawImage(scratch, 0, 0);
}

export function squeegee(ctx, x, tilt, colors) {
  ctx.save();
  ctx.translate(x, H / 2);
  ctx.rotate(tilt);
  const half = H * 0.46;
  ctx.fillStyle = 'rgba(20, 16, 12, 0.18)';
  ctx.fillRect(-4, -half, 14, half * 2);

  ctx.fillStyle = '#e4dfd6';
  ctx.fillRect(-5, -half, 8, half * 2);
  ctx.fillStyle = '#b7b2a8';
  ctx.fillRect(2, -half, 2.5, half * 2);

  const r = 11;
  ctx.beginPath();
  ctx.arc(16, -half + 40, r, Math.PI, 0);
  ctx.arc(16, half - 40, r, 0, Math.PI);
  ctx.closePath();
  if (colors.length === 1) {
    ctx.fillStyle = colors[0];
    ctx.fill();
  } else {
    ctx.save();
    ctx.clip();
    const mid = 0;
    ctx.fillStyle = colors[0];
    ctx.fillRect(-10, -half, 40, mid + half);
    ctx.fillStyle = colors[1];
    ctx.fillRect(-10, mid, 40, half - mid + 20);
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(12, -140, 3.2, 48, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(21, 90, 3.2, 42, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fffaf2';
  ctx.beginPath();
  ctx.arc(14, -80, 3.2, 0, Math.PI * 2);
  ctx.arc(16, 140, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8a8680';
  ctx.fillRect(12, -half - 28, 7, 34);
  ctx.restore();
}

export function screenFrame(ctx, hinge, meshCanvas) {
  const lift = hinge;
  const top = -8 - lift * 40;
  const bottom = H + 8 - lift * 1280;
  const h = bottom - top;
  if (h < 12) return;
  const thick = 36;
  ctx.save();
  ctx.fillStyle = 'rgba(24, 18, 12, 0.30)';
  const o = 18 + lift * 46;
  ctx.beginPath();
  ctx.rect(10 + o, top + 12 + o, W - 20, Math.max(0, h - 16));
  ctx.rect(thick + 8 + o, top + thick + 8 + o, W - thick * 2 - 16, Math.max(0, h - thick * 2 - 16));
  ctx.fill('evenodd');

  ctx.fillStyle = '#cbbda6';
  ctx.fillRect(0, top, W, thick);
  ctx.fillRect(0, top, thick, h);
  ctx.fillRect(W - thick, top, thick, h);
  ctx.fillRect(0, top + h - thick, W, thick);
  ctx.fillStyle = '#a89880';
  ctx.fillRect(0, top + thick - 8, W, 8);
  ctx.fillRect(thick - 8, top, 8, h);

  if (lift < 0.92) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(thick, top + thick, W - thick * 2, Math.max(0, h - thick * 2));
    ctx.clip();
    ctx.globalAlpha = 0.16 * (1 - lift);
    ctx.drawImage(meshCanvas, 0, top);
    ctx.restore();
  }
  ctx.restore();
}

export function paperSheet(ctx) {
  ctx.drawImage(paper, 0, 0);
}

export function sheenOf(t, span) {
  const [a, b] = span;
  if (t < a) return 0;
  if (t <= b) return 1;
  return Math.max(0, 1 - (t - b));
}
