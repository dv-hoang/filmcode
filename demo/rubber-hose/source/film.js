// 1930s Rubber Hose Cartoon - "THE JAZZIN' TEAPOT"
// 1920x1080 Canvas 2D, B&W hand-inked Fleischer style, bouncing ball, dancing teapot, hot jazz swing.

const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

function draw(t) {
  ctx.fillStyle = '#fbf9f1'; // aged parchment white
  ctx.fillRect(0, 0, W, H);

  // --- FILM GRAIN & VINTAGE PROJECTOR SHAKE ---
  ctx.save();
  const shakeX = Math.sin(t * 43.7) * 4;
  const shakeY = Math.cos(t * 31.3) * 3;
  ctx.translate(shakeX, shakeY);

  // --- INKED BORDER FRAME ---
  ctx.strokeStyle = '#121212';
  ctx.lineWidth = 14;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 4;
  ctx.strokeRect(52, 52, W - 104, H - 104);

  // --- BACKGROUND VINTAGE VIGNETTE & FLOOR ---
  ctx.fillStyle = '#121212';
  ctx.fillRect(80, H - 240, W - 160, 16);
  ctx.fillRect(80, H - 228, W - 160, 4);

  // Background musical notes floating
  ctx.font = "bold 64px sans-serif";
  ctx.fillStyle = '#121212';
  for (let i = 0; i < 5; i++) {
    const nx = 300 + i * 320 + Math.sin(t * 2 + i) * 30;
    const ny = 300 + Math.sin(t * 3 + i * 1.5) * 40 - i * 20;
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(Math.sin(t + i) * 0.3);
    ctx.fillText(i % 2 === 0 ? "♪" : "♫", 0, 0);
    ctx.restore();
  }

  // --- BOUNCING SINGALONG BALL & TEXT ---
  // Song lyrics at bottom/top
  ctx.font = "bold 56px 'Courier New', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#121212';
  ctx.fillText("~ SWING THAT JAZZ POT ~", W / 2, 140);

  // Bouncing ball following melody
  const ballPhase = (t * 4.5) % (Math.PI * 2);
  const bx = 300 + ((t / 10) * (W - 600)) % (W - 600);
  const by = 220 - Math.abs(Math.sin(t * 9)) * 120;
  
  // Ball shadow
  ctx.beginPath();
  ctx.ellipse(bx, 240, 30 - Math.abs(Math.sin(t * 9)) * 10, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(18,18,18,0.3)';
  ctx.fill();

  // Pie-eyed bouncing character ball
  ctx.beginPath();
  ctx.arc(bx, by, 35, 0, Math.PI * 2);
  ctx.fillStyle = '#121212';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#121212';
  ctx.stroke();

  // Pie eyes on ball
  ctx.fillStyle = '#fbf9f1';
  ctx.beginPath();
  ctx.arc(bx - 10, by - 6, 8, 0, Math.PI * 2);
  ctx.arc(bx + 10, by - 6, 8, 0, Math.PI * 2);
  ctx.fill();
  // Pie wedges
  ctx.fillStyle = '#121212';
  ctx.beginPath();
  ctx.moveTo(bx - 10, by - 6);
  ctx.lineTo(bx - 2, by - 14);
  ctx.lineTo(bx - 10, by - 14);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx + 10, by - 6);
  ctx.lineTo(bx + 18, by - 14);
  ctx.lineTo(bx + 10, by - 14);
  ctx.fill();

  // --- MAIN HERO: THE DANCING JAZZ TEAPOT ---
  const potX = W / 2 + Math.sin(t * 6) * 40;
  const potY = H / 2 + 100 + Math.cos(t * 12) * 25; // squish/stretch bounce

  ctx.save();
  ctx.translate(potX, potY);

  // Rubber-hose legs kicking
  const legKick = Math.sin(t * 12);
  ctx.strokeStyle = '#121212';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Left Leg
  ctx.beginPath();
  ctx.moveTo(-40, 80);
  ctx.quadraticCurveTo(-80 + legKick * 50, 160, -120 + legKick * 80, 240);
  ctx.stroke();

  // Right Leg
  ctx.beginPath();
  ctx.moveTo(40, 80);
  ctx.quadraticCurveTo(80 - legKick * 50, 160, 120 - legKick * 80, 240);
  ctx.stroke();

  // White gloves / shoes at feet
  // Left foot
  ctx.fillStyle = '#121212';
  ctx.beginPath();
  ctx.ellipse(-120 + legKick * 80, 250, 35, 20, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Right foot
  ctx.beginPath();
  ctx.ellipse(120 - legKick * 80, 250, 35, 20, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Rubber-hose arms swaying with jazz horn
  const armSway = Math.sin(t * 9);
  // Left arm (holding cane or snapping)
  ctx.beginPath();
  ctx.moveTo(-110, -20);
  ctx.quadraticCurveTo(-180, -40 + armSway * 40, -220, 20 + armSway * 30);
  ctx.stroke();
  // Left white glove
  ctx.beginPath();
  ctx.arc(-230, 25 + armSway * 30, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#fbf9f1';
  ctx.fill();
  ctx.stroke();

  // Right arm holding a jazzy trumpet
  ctx.beginPath();
  ctx.moveTo(110, -20);
  ctx.quadraticCurveTo(180, -40 - armSway * 40, 240, -20 - armSway * 20);
  ctx.stroke();
  // Trumpet bell
  ctx.save();
  ctx.translate(260, -30 - armSway * 20);
  ctx.rotate(0.5);
  ctx.fillStyle = '#121212';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(40, -30);
  ctx.lineTo(40, 30);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Teapot Body (rounded surreal plump body)
  ctx.beginPath();
  const squishX = 1 + Math.sin(t * 12) * 0.1;
  const squishY = 1 - Math.sin(t * 12) * 0.1;
  ctx.scale(squishX, squishY);
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.fillStyle = '#fbf9f1';
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#121212';
  ctx.stroke();

  // Teapot spout (curved rubber-hose spout)
  ctx.beginPath();
  ctx.moveTo(-100, -30);
  ctx.bezierCurveTo(-180, -80, -220, 20, -180, 60);
  ctx.lineWidth = 18;
  ctx.stroke();

  // Teapot handle
  ctx.beginPath();
  ctx.moveTo(100, -40);
  ctx.bezierCurveTo(170, -40, 170, 40, 100, 40);
  ctx.lineWidth = 18;
  ctx.stroke();

  // Lid and knob
  ctx.beginPath();
  ctx.arc(0, -115, 50, Math.PI, 0);
  ctx.fillStyle = '#121212';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -140, 16, 0, Math.PI * 2);
  ctx.fill();

  // Face on Teapot: Big wide goofy cartoon smile and pie eyes
  ctx.fillStyle = '#121212';
  // Left pie eye
  ctx.beginPath();
  ctx.arc(-35, -20, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fbf9f1';
  ctx.beginPath();
  ctx.arc(-35, -20, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#121212';
  ctx.beginPath();
  ctx.moveTo(-35, -20);
  ctx.lineTo(-20, -35);
  ctx.lineTo(-35, -35);
  ctx.fill();

  // Right pie eye
  ctx.beginPath();
  ctx.arc(35, -20, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fbf9f1';
  ctx.beginPath();
  ctx.arc(35, -20, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#121212';
  ctx.beginPath();
  ctx.moveTo(35, -20);
  ctx.lineTo(50, -35);
  ctx.lineTo(35, -35);
  ctx.fill();

  // Cheerful wide grin
  ctx.beginPath();
  ctx.arc(0, 15, 45, 0.1 * Math.PI, 0.9 * Math.PI, false);
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.stroke();
  // Tongue poking out
  ctx.beginPath();
  ctx.arc(0, 52, 16, 0, Math.PI, false);
  ctx.fillStyle = '#121212';
  ctx.fill();

  ctx.restore(); // restore teapot transform

  // --- FOREGROUND FLICKER / SCRATCHES ---
  ctx.fillStyle = 'rgba(18,18,18,0.15)';
  for (let s = 0; s < 4; s++) {
    const sx = (Math.sin(t * 17 + s * 43) * 0.5 + 0.5) * W;
    const sy = (Math.cos(t * 23 + s * 37) * 0.5 + 0.5) * H;
    ctx.fillRect(sx, sy, 3, 40 + (s * 15));
  }

  ctx.restore(); // restore global shake
}

window.DUR = 10;
window.render = draw;
window.READY = true;
