const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

function draw(t) {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);

  // Background candy stripes / arcade cabinet framing
  ctx.save();
  ctx.fillStyle = '#ff2255';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffe500';
  for (let i = -H; i < W + H; i += 80) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 40, 0);
    ctx.lineTo(i - H + 40, H);
    ctx.lineTo(i - H, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // CRT / cabinet dark bezel overlay
  ctx.fillStyle = '#08050d';
  ctx.fillRect(160, 100, W - 320, H - 200);
  ctx.strokeStyle = '#3a2055';
  ctx.lineWidth = 14;
  ctx.strokeRect(154, 94, W - 308, H - 194);

  // Determine active microgame based on time t (0..10)
  // 0.0 - 2.5: Game 1 (BLUEPRINT: TAP!)
  // 2.5 - 5.0: Game 2 (RISO: FLIP!)
  // 5.0 - 7.5: Game 3 (TERMINAL: EAT!)
  // 7.5 - 10.0: BOSS / FINALE (FRENZY!)

  if (t < 2.5) {
    drawBlueprintGame(t);
  } else if (t < 5.0) {
    drawRisoGame(t - 2.5);
  } else if (t < 7.5) {
    drawTerminalGame(t - 5.0);
  } else {
    drawBossGame(t - 7.5);
  }

  // Speed lines / flash banner across top
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, 70);
  ctx.fillStyle = '#ffe500';
  ctx.font = '900 38px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MICROGAME FRENZY', 190, 46);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#00ffff';
  const speedLv = Math.min(5, Math.floor(t * 0.6) + 1);
  ctx.fillText('SPEED x' + speedLv, W - 190, 46);

  // Scanlines & vignette
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(160, y, W - 320, 2);
  }
}

function drawBlueprintGame(t) {
  // Blueprint style (cyan grid, white lines)
  ctx.save();
  ctx.beginPath();
  ctx.rect(160, 100, W - 320, H - 200);
  ctx.clip();

  ctx.fillStyle = '#0d233a';
  ctx.fillRect(160, 100, W - 320, H - 200);

  ctx.strokeStyle = 'rgba(120, 180, 255, 0.15)';
  ctx.lineWidth = 2;
  for (let x = 160; x < W - 160; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 100); ctx.lineTo(x, H - 100); ctx.stroke();
  }
  for (let y = 100; y < H - 100; y += 40) {
    ctx.beginPath(); ctx.moveTo(160, y); ctx.lineTo(W - 160, y); ctx.stroke();
  }

  // Shouted command
  ctx.fillStyle = '#fff';
  ctx.font = '900 84px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TAP!', W / 2, 220);

  // Object: A giant schematic spring / button
  const cx = W / 2, cy = H / 2 + 60;
  const tapPhase = Math.sin(t * 18);
  const scale = 1.0 + 0.15 * tapPhase;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.strokeStyle = '#6bf';
  ctx.lineWidth = 8;
  ctx.strokeRect(-120, -80, 240, 160);

  ctx.fillStyle = '#49b';
  ctx.fillRect(-100, -60, 200, 120);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PUSH', 0, 0);

  ctx.restore();

  // Result / Success stamp at the end of microgame
  if (t > 1.8) {
    ctx.save();
    ctx.translate(W / 2, H / 2 - 40);
    ctx.rotate(-0.15);
    ctx.strokeStyle = '#5ffb5f';
    ctx.lineWidth = 12;
    ctx.strokeRect(-250, -80, 500, 160);
    ctx.fillStyle = '#5ffb5f';
    ctx.font = '900 88px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SUCCESS!', 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

function drawRisoGame(t) {
  // Risograph style (bright pink and teal, misregistered grain)
  ctx.save();
  ctx.beginPath();
  ctx.rect(160, 100, W - 320, H - 200);
  ctx.clip();

  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(160, 100, W - 320, H - 200);

  // Shouted command
  ctx.fillStyle = '#ff0055';
  ctx.font = '900 84px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FLIP!', W / 2 + 4, 224);
  ctx.fillStyle = '#00cccc';
  ctx.fillText('FLIP!', W / 2 - 4, 220);

  // Object: Toast flipping
  const cx = W / 2, cy = H / 2 + 50;
  const flipAngle = t * 7;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(flipAngle);

  // Teal shadow
  ctx.fillStyle = 'rgba(0, 204, 204, 0.7)';
  ctx.fillRect(-110, -90, 200, 180);
  // Pink toaster/toast
  ctx.fillStyle = 'rgba(255, 0, 85, 0.85)';
  ctx.fillRect(-100, -100, 200, 180);

  ctx.fillStyle = '#fdfbf7';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍞', 0, 10);

  ctx.restore();

  if (t > 1.8) {
    ctx.save();
    ctx.translate(W / 2, H / 2 - 40);
    ctx.rotate(0.1);
    ctx.fillStyle = '#ff0055';
    ctx.font = '900 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WIN!', 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

function drawTerminalGame(t) {
  // Retro Green Terminal style
  ctx.save();
  ctx.beginPath();
  ctx.rect(160, 100, W - 320, H - 200);
  ctx.clip();

  ctx.fillStyle = '#051205';
  ctx.fillRect(160, 100, W - 320, H - 200);

  ctx.fillStyle = '#00ff66';
  ctx.font = '900 84px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EAT!', W / 2, 220);

  // ASCII monster chomping
  const cx = W / 2, cy = H / 2 + 60;
  const chomp = Math.floor(t * 12) % 2 === 0;

  ctx.fillStyle = '#00ff66';
  ctx.font = 'bold 72px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(chomp ? '<O_O> V' : '< - > w', cx, cy - 40);

  ctx.font = 'bold 48px monospace';
  const foodX = cx + 180 - (t * 220) % 360;
  ctx.fillText('ø', foodX, cy + 60);

  if (t > 1.8) {
    ctx.fillStyle = '#00ffcc';
    ctx.font = '900 92px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHOMP!', W / 2, H / 2 + 150);
  }

  ctx.restore();
}

function drawBossGame(t) {
  // Boss frenzy: multi-style kaleidoscope
  ctx.save();
  ctx.beginPath();
  ctx.rect(160, 100, W - 320, H - 200);
  ctx.clip();

  ctx.fillStyle = '#ffe500';
  ctx.fillRect(160, 100, W - 320, H - 200);

  ctx.fillStyle = '#ff0055';
  ctx.font = '900 96px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS STAGE!', W / 2, 220);

  const cx = W / 2, cy = H / 2 + 60;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 5);

  ctx.fillStyle = '#00ffff';
  ctx.fillRect(-150, -150, 300, 300);
  ctx.fillStyle = '#ff0055';
  ctx.fillRect(-100, -100, 200, 200);
  ctx.fillStyle = '#ffe500';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💥', 0, 0);

  ctx.restore();

  if (t > 1.8) {
    ctx.fillStyle = '#000';
    ctx.font = '900 110px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CLEAR!', W / 2, H / 2 + 50);
  }

  ctx.restore();
}

window.DUR = 10;
window.render = draw;
window.READY = true;
