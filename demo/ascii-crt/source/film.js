const W = 1920, H = 1080;
const AMBER = '#ffc06a', BRIGHT = '#fff0d0', DIM = '#b06a2a', GLASS = '#080604';
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const term = document.createElement('canvas');
term.width = W; term.height = H;
const g = term.getContext('2d');
let grain = null;

const G = { cols: 80, cw: 24, ch: 44, top: 52, font: 26 };
const pr = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

function put(col, row, str, o = {}) {
  const a = o.a ?? 1, dim = o.dim, bright = o.bright, inverse = o.inverse;
  g.save();
  g.globalAlpha = a;
  g.font = `${o.font ?? G.font}px VT323`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(255,180,94,0.55)';
  g.shadowBlur = o.bright ? 10 : 5;
  for (let i = 0; i < str.length; i++) {
    const c = col + i;
    if (c < 0 || c >= G.cols) continue;
    const x = c * G.cw + G.cw / 2;
    const y = G.top + row * G.ch + G.ch / 2;
    if (inverse) {
      g.fillStyle = AMBER;
      g.fillRect(c * G.cw, G.top + row * G.ch, G.cw, G.ch);
      g.fillStyle = GLASS;
    } else {
      g.fillStyle = bright ? BRIGHT : dim ? DIM : AMBER;
    }
    g.fillText(str[i], x, y);
  }
  g.restore();
}

function detail() {
  // sparse field and a horizon
  for (let row = 12; row < 16; row++) {
    for (let c = 0; c < G.cols; c++) {
      const h = hash(c * 1.7, row * 3.1);
      if (h > 0.84) put(c, row, h > 0.95 ? ':' : '.', { dim: true, a: 0.75 });
    }
  }
  for (let c = 0; c < G.cols; c += 2) put(c, 12, '-', { dim: true, a: 0.5 });
  put(68, 4, 'O', { bright: true });
  put(67, 4, '(', { dim: true });
  put(69, 4, ')', { dim: true });
  for (let i = 0; i < 6; i++) put(65 + i * 2, 2 + (i % 2), "'", { dim: true, a: 0.5 });
}

function signAt(col, a) {
  if (col > G.cols - 2 || col + 23 < 0) return;
  const top = 6, w = 22;
  const border = '+' + '-'.repeat(w) + '+';
  const line = (txt) => '|' + (txt + ' '.repeat(w)).slice(0, w) + '|';
  put(col, top, border, { a, dim: true });
  put(col, top + 1, line('THE MOVING SIGN'), { a, bright: true });
  put(col, top + 2, line(''), { a, dim: true });
  put(col, top + 3, line('EASTBOUND / 07'), { a, dim: true });
  put(col, top + 4, border, { a, dim: true });
  const post = col + 11;
  for (let row = top + 5; row <= 14; row++) put(post, row, '|', { a, dim: true });
  put(post - 2, 14, '===', { a, dim: true });
}

function terminal(t) {
  put(0, 0, ' '.repeat(G.cols), { inverse: true });
  put(1, 0, ' SYS 07  //  NIGHT RELAY  //  CH 07  //  LINK 78%  //  00:10:00', { inverse: true });
  const b1 = '> BOOT  CRT-07 / VT323 ......... OK';
  const b2 = '> SCAN  /SIGNALS ................ ACQUIRED';
  const b3 = '> DECODE 80 x 22 ................ 100%';
  put(1, 1, b1.slice(0, Math.max(0, Math.floor((t - 0.55) * 34))), { dim: true });
  put(1, 2, b2.slice(0, Math.max(0, Math.floor((t - 1.25) * 30))), { dim: true });
  put(1, 3, b3.slice(0, Math.max(0, Math.floor((t - 1.95) * 34))), { dim: true });

  detail();
  const p = pr(t, 3.35, 8.1);
  const sc = Math.floor(-2 + p * 62);
  signAt(sc - 2, 0.16);
  signAt(sc, 1);

  put(0, 17, '-'.repeat(G.cols), { dim: true, a: 0.55 });
  put(0, 18, ' LOG ', { inverse: true });
  const log = '> THE SIGN IS STILL MOVING';
  put(5, 18, log.slice(0, Math.max(0, Math.floor((t - 4.3) * 22))), { bright: true });
  put(1, 19, '> EASTBOUND  //  FRAME 0240  //  NO FURTHER DATA', { dim: true, a: 0.8 });
  const waiting = '> AWAITING NEXT FRAME';
  put(1, 20, waiting, { dim: true, a: 0.75 });
  if (Math.floor(t * 3) % 2 === 0) put(1 + waiting.length, 20, '_', { bright: true });
}

function bigGrid() {
  return { cols: 28, cw: 68, ch: 92, top: 300, font: 64 };
}

function title(t) {
  const B = bigGrid();
  const saved = { ...G };
  Object.assign(G, B);
  const text = 'THE MOVING SIGN';
  const col = Math.floor((G.cols - text.length) / 2);
  const n = Math.floor(pr(t, 8.55, 9.15) * text.length);
  put(col, 2, text.slice(0, n), { bright: true, font: 64 });
  if (Math.floor(t * 3) % 2 === 0) put(col + n, 2, '_', { bright: true, font: 64 });
  put(0, 4, ' '.repeat(G.cols), { inverse: true });
  put(6, 4, 'CHANNEL 07 // END', { inverse: true });
  Object.assign(G, saved);
}

function makeGrain() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d'); const im = x.createImageData(256, 256);
  let s = 1234567;
  for (let i = 0; i < im.data.length; i += 4) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const v = s % 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 15;
  }
  x.putImageData(im, 0, 0);
  return ctx.createPattern(c, 'repeat');
}

function draw(t) {
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (t < 0.36) {
    const k = pr(t, 0, 0.36);
    g.fillStyle = BRIGHT; g.fillRect((W / 2) * (1 - k), H / 2 - 3, W * k, 6);
  } else if (t < 8.55) {
    terminal(t);
  } else {
    title(t);
  }

  ctx.fillStyle = GLASS; ctx.fillRect(0, 0, W, H);
  const flicker = 0.94 + 0.035 * Math.sin(t * 41) + 0.015 * Math.sin(t * 7.3);
  ctx.save();
  ctx.globalAlpha = flicker;
  ctx.drawImage(term, 0, 0);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.filter = 'blur(7px)';
  ctx.drawImage(term, 0, 0);
  ctx.restore();

  // scanlines
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
  ctx.restore();

  if (grain) { ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = grain; ctx.fillRect(0, 0, W, H); ctx.restore(); }

  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.44)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,180,100,0.10)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.roundRect(16, 12, W - 32, H - 24, 42);
  ctx.stroke();
  ctx.restore();

  if (t > 9.62) {
    const k = pr(t, 9.62, 9.96);
    ctx.fillStyle = GLASS;
    ctx.fillRect(0, 0, W, H * k / 2);
    ctx.fillRect(0, H - H * k / 2, W, H * k / 2);
    if (k < 1) {
      ctx.fillStyle = BRIGHT;
      ctx.fillRect(W / 2 - (W / 2) * (1 - k), H / 2 - 3, W * (1 - k), 6);
    }
  }
}

window.DUR = 10;
window.render = draw;
grain = makeGrain();
document.fonts.ready.then(async () => {
  try { await document.fonts.load('26px VT323'); } catch (e) {}
  window.READY = true;
});
