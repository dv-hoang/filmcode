const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Colour ladder (cool neutrals, slightly blue)
const BG      = '#040406';
const SURF_0  = '#0a0a0e';
const SURF_1  = '#111118';
const SURF_2  = '#1a1a24';
const TEXT_1  = '#e8e8f0';
const TEXT_2  = '#9898a8';
const TEXT_3  = '#585868';
const BORDER  = '#1a1a24';
const HILITE  = '#2a2a3a';
const ACCENT  = '#00d4aa';
const ACCENT_GLOW = 'rgba(0,212,170,0.35)';

const GRID_SZ = 48;
const GRID_OP1 = 0.03;
const GRID_OP2 = 0.06;

const pr = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const ease = (x) => x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x+2, 2)/2;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

let lightX = 0, lightY = 0, lightR = 0, lightActive = false;

function drawBG(t) {
  const g = ctx.createRadialGradient(W*0.5, H*0.15, 0, W*0.5, H*0.15, Math.hypot(W,H)*0.7);
  g.addColorStop(0, '#0a0a10');
  g.addColorStop(1, BG);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Large cool glow off-centre
  const glow = ctx.createRadialGradient(W*0.7, H*0.35, 0, W*0.7, H*0.35, W*0.6);
  glow.addColorStop(0, 'rgba(80,100,140,0.04)');
  glow.addColorStop(1, 'rgba(80,100,140,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Vignette
  const vig = ctx.createRadialGradient(W*0.5, H*0.5, 0, W*0.5, H*0.5, Math.hypot(W,H)*0.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.6, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.52)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Hairline grid
  ctx.strokeStyle = `rgba(255,255,255,${GRID_OP1})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += GRID_SZ) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
  }
  for (let y = 0; y <= H; y += GRID_SZ) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
  }
  ctx.stroke();

  ctx.strokeStyle = `rgba(255,255,255,${GRID_OP2})`;
  ctx.beginPath();
  for (let x = 0; x <= W; x += GRID_SZ * 4) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
  }
  for (let y = 0; y <= H; y += GRID_SZ * 4) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
  }
  ctx.stroke();
}

function roundedRect(x, y, w, h, r) {
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
}

function drawSurface(x, y, w, h, level, z = 0, rotY = 0) {
  const scale = 1 / (1 - z * 0.0015);
  const sw = w * scale, sh = h * scale;
  const sx = x - (sw - w) / 2, sy = y - (sh - h) / 2;

  const surfCol = [SURF_0, SURF_1, SURF_2][Math.min(2, level)];
  const shadowBlur = 16 + level * 12 + z * 0.08;
  const shadowY = 8 + level * 6 + z * 0.04;

  ctx.save();
  ctx.translate(sx + sw/2, sy + sh/2);
  ctx.scale(scale, scale);
  ctx.translate(-sw/2, -sh/2);

  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetY = shadowY;

  roundedRect(0, 0, sw, sh, 12);
  ctx.fillStyle = surfCol;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Inner top highlight
  ctx.beginPath();
  ctx.moveTo(1, 1);
  ctx.lineTo(sw - 1, 1);
  ctx.strokeStyle = HILITE;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
  return { sx, sy, sw, sh, scale };
}

function drawTitleBar(x, y, w, title, glyph, accent = false) {
  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, system-ui';
  ctx.fillStyle = accent ? ACCENT : TEXT_1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const gx = x + 16;
  ctx.fillText(glyph, gx, y + 20);
  ctx.fillStyle = TEXT_2;
  ctx.fillText(title, gx + 22, y + 20);
}

function drawWindow(win, t) {
  const { x, y, w, h, title, glyph, level, z, rotY, content, accent, progress } = win;
  const s = drawSurface(x, y, w, h, level, z, rotY);
  ctx.save();
  ctx.translate(s.sx, s.sy);
  ctx.clip();
  roundedRect(0, 0, s.sw, s.sh, 12);
  ctx.clip();

  // Title bar area
  ctx.fillStyle = SURF_0;
  ctx.fillRect(0, 0, s.sw, 44 * s.scale);
  drawTitleBar(0, 0, s.sw, title, glyph, accent);

  // Content
  if (content) content(ctx, s.sw, s.sh, t, progress, accent);

  ctx.restore();
}

function drawNotification(ctx, w, h, t, p, accent) {
  ctx.font = '400 13px -apple-system, BlinkMacSystemFont, system-ui';
  ctx.fillStyle = TEXT_1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Focus mode available', 16, 56);
  ctx.fillStyle = TEXT_3;
  ctx.fillText('Press ⌘⇧F to enter', 16, 80);

  // Accent bar
  const bw = (w - 32) * p;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(16, h - 8, bw, 3);
}

function drawFileIcon(ctx, w, h, t, p, accent) {
  ctx.font = '400 12px -apple-system, BlinkMacSystemFont, system-ui';
  // Icon
  ctx.fillStyle = accent ? ACCENT : TEXT_2;
  roundedRect(16, 56, 40, 40, 8);
  ctx.fill();
  ctx.fillStyle = BG;
  ctx.font = '600 20px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('◈', 36, 76);

  ctx.fillStyle = TEXT_1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('focus_session_047.md', 16, 110);
  ctx.fillStyle = TEXT_3;
  ctx.font = '400 11px system-ui';
  ctx.fillText('Modified 2m ago · 2.4 KB', 16, 132);
}

function drawListRow(ctx, w, h, t, p, accent, i) {
  const items = ['Inbox', 'Drafts', 'Sent', 'Archive', 'Trash'];
  const item = items[i % items.length];
  ctx.font = '400 14px -apple-system, BlinkMacSystemFont, system-ui';
  ctx.fillStyle = i === 0 && accent ? ACCENT : TEXT_1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(item, 16, h/2);
  if (i === 0 && accent) {
    ctx.fillStyle = ACCENT_GLOW;
    ctx.beginPath();
    ctx.arc(w - 30, h/2, 8 + 4 * Math.sin(t * 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTiles(ctx, w, h, t, p, accent) {
  const cols = 3, rows = 2;
  const tw = (w - 48) / cols, th = (h - 80) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = 16 + c * (tw + 8);
      const ty = 56 + r * (th + 8);
      ctx.fillStyle = SURF_1;
      roundedRect(tx, ty, tw, th, 8);
      ctx.fill();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Thumbnail pattern
      ctx.fillStyle = TEXT_3;
      ctx.font = '600 24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(['◐','◑','◒','◓','◔','◕'][r*cols+c], tx + tw/2, ty + th/2);
    }
  }
}

function drawGiantNumber(ctx, w, h, t, p, accent) {
  const num = '47';
  const size = Math.min(w, h) * 0.65 * easeOut(p);
  ctx.font = `800 ${size}px -apple-system, BlinkMacSystemFont, system-ui`;
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = ACCENT_GLOW;
  ctx.shadowBlur = 60 * p;
  ctx.fillText(num, w/2, h/2 - 10);
  ctx.shadowBlur = 0;

  // Label
  ctx.font = '400 18px -apple-system, BlinkMacSystemFont, system-ui';
  ctx.fillStyle = TEXT_2;
  ctx.shadowColor = 'transparent';
  ctx.fillText('focus sessions this week', w/2, h/2 + size/2 + 24);
}

function drawCursor(x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI/4);
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(18, 6);
  ctx.lineTo(6, 18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLightSweep(t) {
  if (!lightActive) return;
  const g = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, lightR);
  g.addColorStop(0, 'rgba(255,255,255,0.12)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.04)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Scene definition
const windows = [
  { x: 120, y: 100, w: 520, h: 380, title: 'Messages', glyph: '◉', level: 1, z: 0, content: drawListRow },
  { x: 680, y: 80, w: 400, h: 420, title: 'Files', glyph: '◆', level: 1, z: 50, content: drawFileIcon },
  { x: 1120, y: 140, w: 360, h: 300, title: 'Notifications', glyph: '●', level: 2, z: 100, content: drawNotification, accent: true },
  { x: 180, y: 520, w: 580, h: 400, title: 'Projects', glyph: '■', level: 1, z: 20, content: drawTiles },
  { x: 800, y: 540, w: 480, h: 360, title: 'Terminal', glyph: '▲', level: 0, z: 80, content: null },
];

let giantNumberWin = { x: W/2 - 400, y: H/2 - 300, w: 800, h: 600, title: '', glyph: '', level: 2, z: 200, content: drawGiantNumber };

function draw(t) {
  ctx.clearRect(0, 0, W, H);
  drawBG(t);

  // Phase 0-3.5s: Chaotic desktop
  // Phase 3.5-4.5s: Key press, light sweep
  // Phase 4.5-10s: Giant number reveal

  const phase1 = pr(t, 0, 3.5);
  const phase2 = pr(t, 3.5, 4.5);
  const phase3 = pr(t, 4.5, 10);

  // Animate windows in phase 1
  if (phase1 < 1) {
    windows.forEach((win, i) => {
      const delay = i * 0.15;
      const p = pr(t, delay, delay + 0.6);
      const ep = easeOut(p);
      const wx = win.x + (1 - ep) * 60;
      const wy = win.y + (1 - ep) * 40;
      const wz = win.z * (1 - ep);
      drawWindow({ ...win, x: wx, y: wy, z: wz, progress: ep }, t);
    });
  } else {
    windows.forEach(win => drawWindow({ ...win, progress: 1 }, t));
  }

  // Light sweep trigger at 3.5s
  if (t >= 3.5 && t < 4.5) {
    lightActive = true;
    lightX = W * 0.1 + (W * 0.8) * ease(phase2);
    lightY = H * 0.15;
    lightR = Math.max(W, H) * 1.2 * phase2;
  } else if (t >= 4.5) {
    lightActive = false;
  }

  drawLightSweep(t);

  // Giant number reveal in phase 3
  if (phase3 > 0) {
    const ep = easeOut(phase3);
    drawWindow({ ...giantNumberWin, progress: ep }, t);
  }

  // Cursor at key moment
  if (t >= 3.3 && t < 3.8) {
    const cp = pr(t, 3.3, 3.8);
    const cx = 1120 + 16 + 200 * cp;
    const cy = 140 + 22;
    drawCursor(cx, cy, t);
  }

  // Key hint
  if (t < 3.5) {
    const hp = pr(t, 2.5, 3.5);
    ctx.font = '400 13px -apple-system, BlinkMacSystemFont, system-ui';
    ctx.fillStyle = `rgba(152,152,168,${0.6 * (1 - hp)})`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('⌘⇧F', W - 32, H - 32);
  }
}

window.DUR = 10;
window.render = draw;
window.READY = true;