// Living Screencast: "NudgeOS — Spatial Focus Workspace"
const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Helper math
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const smoothstep = (a, b, t) => {
  t = clamp((t - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOutBack = t => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const lerp = (a, b, t) => a + (b - a) * t;

// Pre-render desktop wallpaper gradient & window chrome
const bgCanvas = document.createElement('canvas');
bgCanvas.width = W; bgCanvas.height = H;
const bgCtx = bgCanvas.getContext('2d');

// Paint gorgeous dark glass/indigo desktop background with subtle blobs
function renderWallpaper() {
  const grad = bgCtx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0c101d');
  grad.addColorStop(0.5, '#131b2e');
  grad.addColorStop(1, '#080c14');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, W, H);

  // Decorative ambient glow orbs
  const drawOrb = (x, y, r, color) => {
    const og = bgCtx.createRadialGradient(x, y, 0, x, y, r);
    og.addColorStop(0, color);
    og.addColorStop(1, 'transparent');
    bgCtx.fillStyle = og;
    bgCtx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  drawOrb(400, 300, 450, 'rgba(56, 120, 240, 0.15)');
  drawOrb(1500, 800, 550, 'rgba(180, 70, 240, 0.12)');
  drawOrb(1000, 200, 350, 'rgba(50, 220, 180, 0.08)');

  // Grid pattern
  bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  bgCtx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, H); bgCtx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(W, y); bgCtx.stroke();
  }
}
renderWallpaper();

export function draw(t) {
  ctx.clearRect(0, 0, W, H);

  // --- Screen Studio Zoom & Pan Camera calculation ---
  // Keyframe timeline:
  // 0.0 - 2.5: Wide overview of desktop, mascot (Nudge) enters and waves
  // 2.5 - 5.0: Smooth zoom in to Editor panel, Nudge points at toggle
  // 5.0 - 7.5: Smooth pan/zoom to AI Assistant sidebar, typing demo
  // 7.5 - 10.0: Zoom back out, success toast, curtain finish

  let camX = W / 2, camY = H / 2, camScale = 1.0;

  if (t < 2.3) {
    camX = W / 2; camY = H / 2; camScale = 1.0;
  } else if (t >= 2.3 && t < 5.2) {
    const p = smoothstep(2.3, 3.2, t);
    camX = lerp(W / 2, 640, p);
    camY = lerp(H / 2, 540, p);
    camScale = lerp(1.0, 1.35, p);
  } else if (t >= 5.2 && t < 7.8) {
    const p = smoothstep(5.2, 6.0, t);
    camX = lerp(640, 1320, p);
    camY = lerp(540, 480, p);
    camScale = lerp(1.35, 1.45, p);
  } else {
    const p = smoothstep(7.8, 8.6, t);
    camX = lerp(1320, W / 2, p);
    camY = lerp(480, H / 2, p);
    camScale = lerp(1.45, 1.0, p);
  }

  ctx.save();
  // Apply Screen Studio camera transform
  ctx.translate(W / 2, H / 2);
  ctx.scale(camScale, camScale);
  ctx.translate(-camX, -camY);

  // 1. Draw Wallpaper
  ctx.drawImage(bgCanvas, 0, 0);

  // 2. Main App Window (Glassmorphism card)
  const winX = 160, winY = 120, winW = 1600, winH = 840;
  
  // Window shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 20;

  // Window body
  ctx.fillStyle = 'rgba(18, 24, 38, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(winX, winY, winW, winH, 16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Window Titlebar
  ctx.fillStyle = 'rgba(25, 34, 52, 0.9)';
  ctx.beginPath();
  ctx.roundRect(winX, winY, winW, 60, [16, 16, 0, 0]);
  ctx.fill();

  // Traffic lights
  const dotY = winY + 30;
  const dots = [
    { x: winX + 28, color: '#ff5f56' },
    { x: winX + 50, color: '#ffbd2e' },
    { x: winX + 72, color: '#27c93f' }
  ];
  dots.forEach(d => {
    ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.arc(d.x, dotY, 7, 0, Math.PI * 2); ctx.fill();
  });

  // Titlebar text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NudgeOS — Spatial Focus Workspace [Project: Nebula]', winX + winW / 2, dotY + 2);

  // --- App Sidebar (Left) ---
  const sideX = winX, sideY = winY + 60, sideW = 280, sideH = winH - 60;
  ctx.fillStyle = 'rgba(12, 16, 26, 0.4)';
  ctx.fillRect(sideX, sideY, sideW, sideH);

  // Sidebar items
  const menuItems = [
    { icon: '⚡', label: 'Overview', active: false },
    { icon: '🎯', label: 'Focus Flow', active: true },
    { icon: '📊', label: 'Analytics', active: false },
    { icon: '🤖', label: 'AI Copilot', active: false },
    { icon: '⚙️', label: 'Settings', active: false }
  ];
  menuItems.forEach((m, i) => {
    const iy = sideY + 24 + i * 50;
    if (m.active) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(sideX + 16, iy - 6, sideW - 32, 40, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#818cf8';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    }
    ctx.font = '15px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${m.icon}   ${m.label}`, sideX + 36, iy + 19);
  });

  // --- Center Editor / Workspace Canvas ---
  const edX = sideX + sideW + 24;
  const edY = sideY + 24;
  const edW = 860;
  const edH = winH - 108;

  ctx.fillStyle = 'rgba(10, 14, 22, 0.6)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(edX, edY, edW, edH, 12); ctx.fill(); ctx.stroke();

  // Editor Header
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '600 22px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Autonomous Focus Pipeline', edX + 28, edY + 42);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '14px -apple-system, sans-serif';
  ctx.fillText('Real-time ambient noise gating & cognitive load balancing', edX + 28, edY + 70);

  // Toggle card inside editor (interacted with around t=3.5)
  const toggleX = edX + 28, toggleY = edY + 110, toggleW = edW - 56, toggleH = 88;
  const isToggleActive = t >= 3.8;
  
  ctx.fillStyle = isToggleActive ? 'rgba(79, 70, 229, 0.15)' : 'rgba(255, 255, 255, 0.03)';
  ctx.strokeStyle = isToggleActive ? 'rgba(99, 102, 241, 0.6)' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = isToggleActive ? 2 : 1;
  ctx.beginPath(); ctx.roundRect(toggleX, toggleY, toggleW, toggleH, 10); ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = '500 16px -apple-system, sans-serif';
  ctx.fillText('Deep State Neural Shield', toggleX + 24, toggleY + 36);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '13px -apple-system, sans-serif';
  ctx.fillText('Automatically suppresses notification cascades during peak flow states.', toggleX + 24, toggleY + 60);

  // Switch UI element
  const swX = toggleX + toggleW - 70, swY = toggleY + 28, swW = 50, swH = 28;
  ctx.fillStyle = isToggleActive ? '#6366f1' : 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath(); ctx.roundRect(swX, swY, swW, swH, 14); ctx.fill();

  const knobX = isToggleActive ? swX + swW - 18 : swX + 14;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(knobX, swY + swH / 2, 10, 0, Math.PI * 2); ctx.fill();

  // Code / Timeline blocks
  const codeY = toggleY + toggleH + 20;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.beginPath(); ctx.roundRect(edX + 28, codeY, edW - 56, 260, 10); ctx.fill();

  const codeLines = [
    { text: 'const focusEngine = new NudgeCore({', color: '#c084fc' },
    { text: '  mode: "adaptive_spatial",', color: '#67e8f9' },
    { text: '  latencyBudgetMs: 4.2,', color: '#34d399' },
    { text: '  neuralDampening: true,', color: '#f472b6' },
    { text: '  onStateChange: (state) => {', color: '#fbbf24' },
    { text: '    syncWorkspaceGrid(state);', color: '#94a3b8' },
    { text: '  }', color: '#fbbf24' },
    { text: '});', color: '#c084fc' }
  ];
  codeLines.forEach((cl, idx) => {
    ctx.fillStyle = cl.color;
    ctx.font = '14px "SF Mono", Monaco, Consolas, monospace';
    ctx.fillText(cl.text, edX + 52, codeY + 36 + idx * 26);
  });


  // --- Right Sidebar (AI Copilot Panel) ---
  const aiX = edX + edW + 20;
  const aiY = edY;
  const aiW = winX + winW - aiX - 24;
  const aiH = edH;

  ctx.fillStyle = 'rgba(10, 14, 22, 0.6)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(aiX, aiY, aiW, aiH, 12); ctx.fill(); ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '600 18px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('✨ Nudge Copilot', aiX + 24, aiY + 36);

  // Chat message bubble 1
  ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
  ctx.beginPath(); ctx.roundRect(aiX + 20, aiY + 64, aiW - 40, 72, 10); ctx.fill(); ctx.stroke();
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '13px -apple-system, sans-serif';
  ctx.fillText('Optimized layout for peak cognitive throughput. Ready when you are!', aiX + 36, aiY + 92);

  // Typing simulation box (around t=5.5 to 7.5)
  const chatInputY = aiY + aiH - 70;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath(); ctx.roundRect(aiX + 20, chatInputY, aiW - 40, 46, 8); ctx.fill(); ctx.stroke();

  let typedText = '';
  if (t > 5.5 && t < 7.8) {
    const p = (t - 5.5) / 2.0;
    const fullStr = 'Analyze focus stability...';
    const len = Math.floor(p * fullStr.length);
    typedText = fullStr.substring(0, len);
  } else if (t >= 7.8) {
    typedText = 'Analyze focus stability...';
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '13px -apple-system, sans-serif';
  ctx.fillText(typedText + (t % 0.8 < 0.4 && t < 7.8 ? '|' : ''), aiX + 36, chatInputY + 27);


  // --- MASCOT (Living Screencast Character: "Nudge", a cute low-res/vector hybrid squishy mascot) ---
  // Mascot moves and guides the user through actions.
  let mascotX = 600, mascotY = 700;
  let mascotScale = 1.0;
  let isWaving = false;
  let isPointing = false;
  let pointTarget = { x: 0, y: 0 };

  if (t < 2.3) {
    // Entering from bottom left, waving hello
    const p = smoothstep(0.2, 1.2, t);
    mascotX = lerp(-100, 520, easeOutBack(p));
    mascotY = 720 + Math.sin(t * 5) * 6;
    isWaving = true;
  } else if (t >= 2.3 && t < 5.0) {
    // Moving over to point at the Deep State Neural Shield toggle
    const p = smoothstep(2.3, 3.1, t);
    mascotX = lerp(520, toggleX + 120, p);
    mascotY = lerp(720, toggleY + toggleH + 50, p);
    isPointing = true;
    pointTarget = { x: swX + 25, y: swY + 14 };
  } else if (t >= 5.0 && t < 7.8) {
    // Sliding over to AI panel
    const p = smoothstep(5.0, 5.8, t);
    mascotX = lerp(toggleX + 120, aiX + 100, p);
    mascotY = lerp(toggleY + toggleH + 50, chatInputY - 30, p);
    isPointing = true;
    pointTarget = { x: aiX + 60, y: chatInputY + 23 };
  } else {
    // Happy bounce and exit right
    const p = smoothstep(7.8, 8.8, t);
    mascotX = lerp(aiX + 100, W + 200, p);
    mascotY = 700 + Math.sin(t * 12) * 15;
    isWaving = true;
  }

  // Draw Mascot Body (Squishy pill / capsule shape with cute face)
  ctx.save();
  ctx.translate(mascotX, mascotY);

  // Soft glow under mascot
  ctx.save();
  ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 45, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Squash & Stretch physics
  const bounce = Math.sin(t * 8) * 4;
  ctx.fillStyle = '#6366f1';
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-28, -40 + bounce, 56, 80, 28);
  ctx.fill();
  ctx.stroke();

  // Face eyes (expressive glowing dots)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-10, -12 + bounce, 5, 0, Math.PI * 2);
  ctx.arc(10, -12 + bounce, 5, 0, Math.PI * 2);
  ctx.fill();

  // Cute happy mouth
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -6 + bounce, 6, 0, Math.PI);
  ctx.stroke();

  // Waving arm
  if (isWaving) {
    ctx.save();
    ctx.translate(-28, -20 + bounce);
    ctx.rotate(Math.sin(t * 15) * 0.5 - 0.5);
    ctx.fillStyle = '#6366f1';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-16, -8, 20, 12, 6);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  // Draw Pointer Arm / Laser line when pointing
  if (isPointing) {
    ctx.save();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(mascotX, mascotY - 20);
    ctx.lineTo(pointTarget.x, pointTarget.y);
    ctx.stroke();

    // Pulsing target reticle
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(pointTarget.x, pointTarget.y, 14 + Math.sin(t * 10) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }


  // --- Screen Studio Style Click Ripple Effects ---
  // Trigger click effect at toggle flip (t = 3.8) and AI submit (t = 7.8)
  const clickEvents = [ { t: 3.8, x: swX + 25, y: swY + 14 }, { t: 7.8, x: aiX + 50, y: chatInputY + 23 } ];
  clickEvents.forEach(ce => {
    if (t >= ce.t && t < ce.t + 0.6) {
      const pt = (t - ce.t) / 0.6;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${1 - pt})`;
      ctx.fillStyle = `rgba(99, 102, 241, ${0.4 * (1 - pt)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ce.x, ce.y, pt * 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  });


  // --- Screen Studio Style Smooth Cursor ---
  // Cursor follows the mascot/actions smoothly
  let curX = W / 2, curY = H / 2;
  if (t < 2.3) {
    curX = lerp(W / 2 - 200, 600, smoothstep(0, 2, t));
    curY = lerp(H / 2 + 200, 700, smoothstep(0, 2, t));
  } else if (t >= 2.3 && t < 5.0) {
    const p = smoothstep(2.3, 3.2, t);
    curX = lerp(600, swX + 25, p);
    curY = lerp(700, swY + 14, p);
  } else if (t >= 5.0 && t < 7.8) {
    const p = smoothstep(5.0, 5.8, t);
    curX = lerp(swX + 25, aiX + 60, p);
    curY = lerp(swY + 14, chatInputY + 23, p);
  } else {
    const p = smoothstep(7.8, 8.8, t);
    curX = lerp(aiX + 60, W + 100, p);
    curY = lerp(chatInputY + 23, H / 2, p);
  }

  // Draw Sleek Glass Cursor
  ctx.save();
  ctx.translate(curX, curY);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 22);
  ctx.lineTo(6, 16);
  ctx.lineTo(14, 24);
  ctx.lineTo(18, 20);
  ctx.lineTo(10, 12);
  ctx.lineTo(16, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Click scale animation on cursor
  if ((t >= 3.8 && t < 3.95) || (t >= 7.8 && t < 7.95)) {
    ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  ctx.restore(); // Restore camera transform

  // --- Cinematic Fade Out / Vignette Overlay ---
  if (t > 9.0) {
    const fade = smoothstep(9.0, 10.0, t);
    ctx.fillStyle = `rgba(5, 7, 10, ${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

window.DUR = 10;
window.render = draw;
window.READY = true;
