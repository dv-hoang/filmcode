(() => {
  const W = 1920, H = 1080;
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const slug = new URLSearchParams(location.search).get('style');
  let S = null, grain = null;

  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
  const easeInOut = x => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };

  function rgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgba(h, a) { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; }
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  const FONTS = {
    serif: "Georgia, 'Times New Roman', 'Songti SC', serif",
    sans: "'Helvetica Neue', Helvetica, Arial, 'PingFang SC', sans-serif",
    mono: "'SFMono-Regular', 'Courier New', monospace",
    display: "'Arial Black', Impact, 'Helvetica Neue', sans-serif",
  };
  const font = (type, weight, size) => `${weight} ${size}px ${FONTS[type] || FONTS.sans}`;
  const setFont = (type, weight, size) => { ctx.font = font(type, weight, size); };

  function fit(str, type, weight, maxSize, maxWidth) {
    let size = maxSize;
    setFont(type, weight, size);
    while (size > 44 && ctx.measureText(str).width > maxWidth) {
      size -= 4;
      setFont(type, weight, size);
    }
    return size;
  }

  function text(str, x, y, type, weight, size, color, alpha = 1, align = 'left') {
    ctx.save();
    ctx.globalAlpha *= alpha;
    setFont(type, weight, size);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function panel(x, y, w, h, r, fill, stroke) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
  }

  function line(x1, y1, x2, y2, color, width, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  }

  function makeGrain() {
    const g = document.createElement('canvas');
    g.width = 256; g.height = 256;
    const c = g.getContext('2d');
    const im = c.createImageData(256, 256);
    const r = rng(17);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = Math.floor(r() * 255);
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = 16;
    }
    c.putImageData(im, 0, 0);
    return ctx.createPattern(g, 'repeat');
  }

  function backdrop() {
    const { bg, accent, support } = S.colors;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.68, H * 0.38, 60, W * 0.68, H * 0.38, W * 0.8);
    g.addColorStop(0, rgba(accent, 0.18));
    g.addColorStop(0.55, rgba(support, 0.08));
    g.addColorStop(1, rgba(bg, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.98);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    if (grain) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = grain;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  function grid(t, intro, out) {
    const cols = 14, rows = 8, x0 = 130, y0 = 110, w = W - 260, h = H - 220;
    ctx.save();
    const drift = Math.sin(t * 0.6) * 10;
    ctx.translate(drift, 0);
    ctx.globalAlpha = 0.55 * intro * out;
    for (let i = 0; i <= cols; i++) line(x0 + (w * i) / cols, y0, x0 + (w * i) / cols, y0 + h * intro, S.colors.ink, 2);
    for (let j = 0; j <= rows; j++) line(x0, y0 + (h * j) / rows, x0 + w * intro, y0 + (h * j) / rows, S.colors.ink, 2);
    const r = rng(S.seed);
    for (let n = 0; n < 26; n++) {
      const cx = x0 + w * r(), cy = y0 + h * r(), cw = 40 + r() * 120, ch = 40 + r() * 90;
      const a = intro * clamp((t - 0.8 - n * 0.025) * 0.9);
      ctx.globalAlpha = (0.32 + 0.18 * Math.sin(t * 1.4 + n)) * a * out;
      ctx.fillStyle = n % 4 === 0 ? S.colors.accent : S.colors.support;
      const ox = Math.sin(t * 0.9 + n * 0.7) * 9, oy = Math.cos(t * 0.7 + n * 0.5) * 9;
      const sw = 0.92 + 0.08 * Math.sin(t * 1.1 + n), sh = 0.92 + 0.08 * Math.cos(t * 0.9 + n);
      ctx.fillRect(cx + ox, cy + oy, cw * sw, ch * sh);
    }
    ctx.restore();
  }

  function rings(t, intro, out) {
    const cx = W * 0.7, cy = H * 0.45;
    ctx.save();
    ctx.globalAlpha = 0.55 * out;
    for (let i = 0; i < 7; i++) {
      const rad = 90 + i * 90 + easeOut(clamp(t / 6 - i * 0.04)) * 45;
      ctx.save();
      ctx.globalAlpha *= intro;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.strokeStyle = i === 2 ? S.colors.accent : i % 2 ? S.colors.support : S.colors.ink;
      ctx.lineWidth = i === 2 ? 7 : 2.5;
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < 30; i++) {
      const a = t * (0.12 + i * 0.006) + i * 2.399;
      const rad = 90 + (i % 7) * 90 + 30;
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      ctx.save();
      ctx.globalAlpha = intro * out * (0.25 + 0.55 * (i % 3 === 0));
      ctx.fillStyle = i % 5 === 0 ? S.colors.accent : S.colors.support;
      ctx.beginPath();
      ctx.arc(x, y, 3 + (i % 5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function bands(t, intro, out) {
    const p = t / 10;
    ctx.save();
    ctx.globalAlpha = 0.9 * intro * out;
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.38);
    for (let i = -14; i < 15; i++) {
      const x = i * 170 + ((p * 900) % 170) - 850;
      const w = 42 + 26 * Math.sin(i * 1.7 + p * 5);
      ctx.save();
      ctx.globalAlpha *= i % 3 === 0 ? 0.55 : 0.22;
      ctx.fillStyle = i % 4 === 0 ? S.colors.accent : S.colors.support;
      ctx.fillRect(x, -H, w, H * 2);
      ctx.restore();
    }
    ctx.restore();
  }

  function orbit(t, intro, out) {
    const cx = W * 0.7, cy = H * 0.45;
    ctx.save();
    ctx.globalAlpha = intro * out;
    for (let i = 0; i < 3; i++) {
      const rx = 170 + i * 120, ry = 70 + i * 52;
      ctx.save();
      ctx.globalAlpha *= 0.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, -0.35 + i * 0.18, 0, Math.PI * 2);
      ctx.strokeStyle = i === 1 ? S.colors.accent : S.colors.ink;
      ctx.lineWidth = i === 1 ? 4 : 2;
      ctx.stroke();
      ctx.restore();
      const a = t * (0.8 - i * 0.12) + i * 2.1;
      ctx.save();
      ctx.fillStyle = i === 1 ? S.colors.accent : S.colors.support;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 8 + i * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function columns(t, intro, out) {
    const n = 18, gap = W / n;
    ctx.save();
    ctx.globalAlpha = intro * out;
    for (let i = 0; i < n; i++) {
      const h = (80 + 520 * Math.abs(Math.sin(i * 0.7 + t * 0.45))) * intro;
      ctx.globalAlpha = (0.28 + 0.35 * (i / n)) * intro * out;
      ctx.fillStyle = i % 5 === 0 ? S.colors.accent : S.colors.support;
      ctx.fillRect(i * gap + gap * 0.22, H - h, gap * 0.56, h);
    }
    ctx.restore();
    line(80, H - 120, W - 80, H - 120, S.colors.ink, 3, 0.5 * intro * out);
  }

  function wave(t, intro, out) {
    ctx.save();
    ctx.globalAlpha = intro * out;
    for (let j = 0; j < 7; j++) {
      const y0 = H * 0.28 + j * 74, amp = 50 + j * 8;
      ctx.save();
      ctx.globalAlpha *= 0.25 + 0.1 * j;
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 14) {
        const env = Math.sin(Math.PI * clamp(x / W));
        const y = y0 + Math.sin(x * 0.0045 + t * 1.2 + j * 0.55) * amp * env * intro;
        if (x < 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = j === 2 ? S.colors.accent : S.colors.support;
      ctx.lineWidth = j === 2 ? 5 : 2.5;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function motif(t) {
    const intro = easeOut((t - 0.3) / 1.2);
    const out = 1 - smooth((t - 9.1) / 0.8);
    if (out <= 0) return;
    const zoom = 1 + 0.014 * Math.sin(t * 0.55);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);
    switch (S.motif) {
      case 'grid': grid(t, intro, out); break;
      case 'rings': rings(t, intro, out); break;
      case 'bands': bands(t, intro, out); break;
      case 'orbit': orbit(t, intro, out); break;
      case 'columns': columns(t, intro, out); break;
      default: wave(t, intro, out);
    }
    ctx.restore();
  }

  function title(t) {
    const a = easeOut((t - 1.8) / 1.1) * (1 - smooth((t - 9.1) / 0.7));
    if (a <= 0) return;
    const x = 140, y = 630, w = W - 280, h = 382;
    ctx.save();
    ctx.globalAlpha = a;
    panel(x, y, w, h, 26, rgba(S.colors.bg, 0.82), rgba(S.colors.ink, 0.18));
    text(S.category.toUpperCase(), x + 46, y + 52, 'sans', 700, 24, S.colors.accent, 0.95);
    line(x + 46, y + 70, x + 306, y + 70, S.colors.accent, 3, 0.8);
    const size = fit(S.en, S.type, 700, 104, w - 92);
    const titleTop = y + 92;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, titleTop - 8, (w - 80) * easeOut((t - 2.0) / 1.2), h);
    ctx.clip();
    text(S.en, x + 46, titleTop + size, S.type, 700, size, S.colors.ink);
    ctx.restore();
    const topic = '"' + S.topic + '"';
    const tsize = Math.min(48, fit(topic, S.type, 400, 48, w - 92));
    text(topic, x + 46, titleTop + size + 54, S.type, 400, tsize, rgba(S.colors.ink, 0.78));
    text('A 10-second style study', x + 46, y + 334, 'sans', 500, 26, rgba(S.colors.ink, 0.62));
    const sx = x + w - 46 - 4 * 54 - 18;
    ['bg', 'accent', 'support', 'ink'].forEach((k, i) => {
      ctx.save();
      ctx.fillStyle = S.colors[k];
      ctx.beginPath();
      ctx.roundRect(sx + i * 54, y + 300, 42, 42, 8);
      ctx.fill();
      ctx.strokeStyle = rgba(S.colors.ink, 0.25);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    });
    text('FilmCode', W - 140, y + h + 50, 'sans', 700, 26, rgba(S.colors.ink, 0.55), 1, 'right');
    ctx.restore();
  }

  function draw(t) {
    if (!S) return;
    backdrop();
    motif(t);
    const intro = 1 - smooth(t / 0.45);
    if (intro > 0) { ctx.fillStyle = `rgba(0,0,0,${intro})`; ctx.fillRect(0, 0, W, H); }
    title(t);
    const end = smooth((t - 9.35) / 0.65);
    if (end > 0) { ctx.fillStyle = `rgba(0,0,0,${end * 0.94})`; ctx.fillRect(0, 0, W, H); }
  }

  window.DUR = 10;
  window.render = draw;
  fetch('./styles.json')
    .then(r => r.json())
    .then(list => {
      S = list.find(x => x.slug === slug);
      if (!S) throw new Error('unknown style: ' + slug);
      grain = makeGrain();
      window.READY = true;
    })
    .catch(e => console.error(e));
})();
