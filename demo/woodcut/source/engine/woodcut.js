// Woodcut Print compositor. Black is the wood; white is what the knife removed.
// One colour plate, drawn only into the cuts. No library-demo code.

import { clamp, hash } from '/core/lib.js';

export const PAPER = '#efe8d8';
export const COPPER = '#c8502a';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function fillNoise(ctx, w, h, seed, paint) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const n = hash(seed + x * 0.17 + y * 13.1);
      const px = paint(x, y, n);
      d[i] = px[0];
      d[i + 1] = px[1];
      d[i + 2] = px[2];
      d[i + 3] = px[3];
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** One hand-cut: blunt entry, a short taper only at the exit, a small bow. */
export function gouge(ctx, x0, y0, x1, y1, w, seed, prog = 1) {
  const p = clamp(prog, 0, 1);
  if (p <= 0.001 || !(w > 0)) return;
  const x1p = x0 + (x1 - x0) * p;
  const y1p = y0 + (y1 - y0) * p;
  const dx = x1p - x0;
  const dy = y1p - y0;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const nx = -dy / len;
  const ny = dx / len;
  const ux = dx / len;
  const uy = dy / len;
  const bow = (hash(seed) - 0.5) * Math.min(3.5, w * 0.22);
  const hw = w * 0.5;
  const tip = Math.min(len * 0.22, Math.max(6, hw * 1.1));
  const bx = x1p - ux * tip;
  const by = y1p - uy * tip;
  const mx = (x0 + bx) / 2 + nx * bow;
  const my = (y0 + by) / 2 + ny * bow;
  ctx.beginPath();
  ctx.moveTo(x0 + nx * hw, y0 + ny * hw);
  ctx.quadraticCurveTo(mx + nx * hw, my + ny * hw, bx + nx * hw, by + ny * hw);
  ctx.lineTo(x1p, y1p);
  ctx.lineTo(bx - nx * hw, by - ny * hw);
  ctx.quadraticCurveTo(mx - nx * hw, my - ny * hw, x0 - nx * hw, y0 - ny * hw);
  ctx.closePath();
  ctx.fill();
}

export function stab(ctx, x, y, r, seed) {
  if (!(r > 0.4)) return;
  const rot = hash(seed) * Math.PI;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * (0.62 + hash(seed + 3) * 0.3), rot, 0, Math.PI * 2);
  ctx.fill();
}

export function prog(t, t0, dur) {
  if (t < t0) return 0;
  if (dur <= 0) return 1;
  return clamp((t - t0) / dur, 0, 1);
}

export class Printer {
  constructor(main) {
    this.main = main;
    this.ctx = main.getContext('2d', { alpha: false });
    this.W = 1920;
    this.H = 1080;
    this.ML = 90;
    this.MT = 52;
    this.PW = 1740;
    this.PH = 820;
    this.mask = canvas(this.PW, this.PH);
    this.col = canvas(this.PW, this.PH);
    this.sheet = canvas(this.PW, this.PH);
    this.mctx = this.mask.getContext('2d');
    this.cctx = this.col.getContext('2d');
    this.sctx = this.sheet.getContext('2d');
    this.ink = canvas(this.PW, this.PH);
    this.wood = canvas(this.PW, this.PH);
    this.pale = canvas(this.PW, this.PH);
    this.speck = canvas(this.PW, this.PH);
    this.ragged = canvas(this.PW, this.PH);
    this.paper = canvas(this.W, this.H);
    this._bake();
  }

  _bake() {
    const { PW, PH, W, H } = this;
    fillNoise(this.ink.getContext('2d'), PW, PH, 11, (x, y, n) => {
      const streak = Math.sin(y * 0.41 + x * 0.01) * 5 + Math.sin(x * 0.02) * 3;
      const v = clamp(20 + (n - 0.5) * 16 + streak, 8, 38);
      return [v, v - 1, v - 3, 255];
    });
    fillNoise(this.wood.getContext('2d'), PW, PH, 29, (x, y, n) => {
      const band = Math.sin(y * 0.55) * 14 + Math.sin(y * 0.08 + x * 0.004) * 10;
      const grain = Math.sin(x * 0.9 + y * 0.15) > 0.92 ? -18 : 0;
      const r = clamp(92 + band + (n - 0.5) * 18 + grain, 58, 130);
      return [r, r * 0.68, r * 0.42, 255];
    });
    fillNoise(this.pale.getContext('2d'), PW, PH, 47, (x, y, n) => {
      const r = clamp(214 + (n - 0.5) * 16 + Math.sin(y * 0.7) * 6, 196, 230);
      return [r, r * 0.9, r * 0.72, 255];
    });
    const sp = this.speck.getContext('2d');
    sp.clearRect(0, 0, PW, PH);
    for (let i = 0; i < 700; i++) {
      const x = hash(i * 4.1) * PW;
      const y = hash(i * 8.7) * PH;
      const r = 0.6 + hash(i * 2.2) * 1.6;
      sp.fillStyle = `rgba(239,232,216,${0.45 + hash(i) * 0.5})`;
      sp.fillRect(x, y, r, r);
    }
    fillNoise(this.ragged.getContext('2d'), PW, PH, 71, (x, y, n) => {
      const d = Math.min(x, y, PW - 1 - x, PH - 1 - y);
      const bite = (hash(Math.floor(x / 70) * 19 + Math.floor(y / 70) * 23) > 0.82) ? 10 : 0;
      const edge = 8 + (n - 0.5) * 12 + bite;
      const a = d > edge + 5 ? 255 : d < edge - 4 ? 0 : Math.round(clamp((d - (edge - 4)) / 9, 0, 1) * 255);
      return [255, 255, 255, a];
    });
    const p = this.paper.getContext('2d');
    p.fillStyle = PAPER;
    p.fillRect(0, 0, W, H);
    const img = p.getImageData(0, 0, W, H);
    const dd = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const n = hash(x * 0.13 + y * 9.2) - 0.5;
        const laid = (y % 5 === 0) ? -7 : 0;
        dd[i] = clamp(239 + n * 10 + laid, 0, 255);
        dd[i + 1] = clamp(232 + n * 8 + laid, 0, 255);
        dd[i + 2] = clamp(216 + n * 8, 0, 255);
      }
    }
    p.putImageData(img, 0, 0);
  }

  beginMask() {
    const g = this.mctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, this.PW, this.PH);
  }

  beginColour() {
    const g = this.cctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, this.PW, this.PH);
  }

  /** Camera over the plate. The paper margin is not transformed. */
  cam(g, cam) {
    const { PW, PH } = this;
    g.setTransform(cam.s, 0, 0, cam.s, PW / 2 - cam.cx * cam.s, PH / 2 - cam.cy * cam.s);
  }

  clipColourToCuts() {
    const g = this.cctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(this.mask, -3, 1);
    g.globalCompositeOperation = 'source-over';
  }

  _compose(block) {
    const g = this.sctx;
    const { PW, PH } = this;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, PW, PH);
    if (block) {
      g.drawImage(this.pale, 0, 0);
      g.drawImage(this.wood, 0, 0);
    } else {
      g.drawImage(this.ink, 0, 0);
    }
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(this.mask, 0, 0);
    g.globalCompositeOperation = 'source-over';
    if (!block) g.drawImage(this.speck, 0, 0);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(this.ragged, 0, 0);
    g.globalCompositeOperation = 'source-over';
  }

  paintPaper() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(this.paper, 0, 0);
  }

  /** True print, or the block when `block` is set. */
  present(block) {
    this._compose(block);
    this.paintPaper();
    this.ctx.drawImage(this.sheet, this.ML, this.MT);
  }

  /**
   * Peel from the mirrored block (p = 0) to the true print (p = 1).
   * The sheet must already be the true print.
   */
  peel(p) {
    this._compose(false);
    this.paintPaper();
    const { ctx, ML, MT, PW, PH, sheet } = this;
    const curl = clamp(p, 0, 1) * PW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ML + curl, MT, PW - curl + 1, PH);
    ctx.clip();
    ctx.translate(ML + PW, MT);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, 0, 0);
    ctx.restore();
    if (curl < PW) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(ML + curl, MT, PW - curl, PH);
      ctx.clip();
      ctx.fillStyle = 'rgba(92, 64, 40, 0.38)';
      ctx.fillRect(ML, MT, PW, PH);
      ctx.restore();
    }
    if (curl > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(ML, MT, curl, PH);
      ctx.clip();
      ctx.drawImage(sheet, ML, MT);
      ctx.restore();
    }
    if (p > 0.001 && p < 0.999) {
      const x = ML + curl;
      const grd = ctx.createLinearGradient(x - 36, 0, x + 22, 0);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(0.42, 'rgba(0,0,0,0.45)');
      grd.addColorStop(0.58, 'rgba(255,248,236,0.85)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(x - 36, MT, 58, PH);
    }
  }

  presentColour(alpha = 0.92) {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(this.col, this.ML, this.MT);
    this.ctx.restore();
  }

  /** Colour only on the revealed (true) side of a peel. */
  presentColourClipped(p, alpha = 0.92) {
    const curl = clamp(p, 0, 1) * this.PW;
    if (curl < 2) return;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(this.ML, this.MT, curl, this.PH);
    this.ctx.clip();
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(this.col, this.ML, this.MT);
    this.ctx.restore();
  }

  brayer(u) {
    const { ctx, ML, MT, PW, PH } = this;
    const x = ML + clamp(u, 0, 1) * PW;
    const grd = ctx.createLinearGradient(x - 70, 0, x + 30, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.5, 'rgba(255,248,230,0.42)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(x - 70, MT, 100, PH);
  }

  letterpress(text, alpha, size, y) {
    if (!(alpha > 0) || !text) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `500 ${size}px "Cormorant Garamond", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const x = this.W / 2;
    ctx.fillStyle = 'rgba(40, 32, 26, 0.35)';
    ctx.fillText(text, x + 1.2, y + 1.2);
    ctx.fillStyle = '#171310';
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}
