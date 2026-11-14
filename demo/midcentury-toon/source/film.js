// Mid-century Cartoon Style Film: "The Synchronized Kitchen"
// 1950s flat colour, broken ink lines, geometric shapes, cool jazz soundtrack timing.

const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// 1950s Palette: Mustard yellow, teal, coral red, cream, charcoal ink
const C_BG = '#f4efe6';
const C_INK = '#23201d';
const C_MUSTARD = '#e8b835';
const C_TEAL = '#2a7c7b';
const C_CORAL = '#d94f38';
const C_CREAM = '#f9f6f0';
const C_PINK = '#f0a8a8';

function pr(t, a, b) {
  return Math.max(0, Math.min(1, (t - a) / (b - a)));
}

function ease(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Draw a wiggly mid-century ink stroke / outline
function wigglePath(fn, seed, time) {
  ctx.beginPath();
  fn();
}

function drawBackground() {
  ctx.fillStyle = C_BG;
  ctx.fillRect(0, 0, W, H);

  // Abstract atomic shapes / geometric wall panels
  ctx.fillStyle = C_CREAM;
  ctx.fillRect(150, 100, 1620, 800);

  // Teal accent wall block
  ctx.fillStyle = C_TEAL;
  ctx.beginPath();
  ctx.moveTo(150, 600);
  ctx.lineTo(1100, 550);
  ctx.lineTo(1100, 900);
  ctx.lineTo(150, 900);
  ctx.closePath();
  ctx.fill();

  // Mustard yellow floor block
  ctx.fillStyle = C_MUSTARD;
  ctx.fillRect(150, 900, 1620, 100);

  // Ink border frame
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 6;
  ctx.strokeRect(140, 90, 1640, 810);
}

function drawClock(t) {
  ctx.save();
  ctx.translate(960, 250);

  // Clock body
  ctx.fillStyle = C_CORAL;
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Clock face
  ctx.fillStyle = C_CREAM;
  ctx.beginPath();
  ctx.arc(0, 0, 75, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hands moving in jerky cartoon steps
  const stepT = Math.floor(t * 4) / 4;
  const angle = stepT * Math.PI * 2 * 2;
  
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.sin(angle) * 50, -Math.cos(angle) * 50);
  ctx.stroke();

  // Sunburst rays behind clock
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * 100, Math.cos(a) * 100);
    ctx.lineTo(Math.sin(a) * 125, Math.cos(a) * 125);
    ctx.stroke();
  }

  ctx.restore();
}

function drawToaster(t, x, y) {
  ctx.save();
  ctx.translate(x, y);

  // Body offset cel colour
  ctx.fillStyle = C_PINK;
  ctx.fillRect(-110 + Math.sin(t*20)*1, -70, 220, 140);

  // Main body
  ctx.fillStyle = C_CORAL;
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(-100, -60, 200, 130, 25);
  ctx.fill();
  ctx.stroke();

  // Slot
  ctx.fillStyle = C_INK;
  ctx.fillRect(-60, -35, 120, 12);

  // Toast popping up at t > 3.5
  if (t > 3.5) {
    const pop = Math.min(1, (t - 3.5) * 4);
    const py = -40 - pop * 90 + Math.sin(t * 15) * 3;
    
    // Bread slice
    ctx.fillStyle = C_MUSTARD;
    ctx.strokeStyle = C_INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-40, py, 80, 85, [30, 30, 10, 10]);
    ctx.fill();
    ctx.stroke();

    // Butter pat
    ctx.fillStyle = C_CREAM;
    ctx.fillRect(-15, py + 25, 30, 20);
    ctx.strokeRect(-15, py + 25, 30, 20);
  }

  // Handle lever
  ctx.fillStyle = C_INK;
  ctx.fillRect(105, -10, 25, 20);
  ctx.beginPath();
  ctx.arc(125, 0, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCoffeePot(t, x, y) {
  ctx.save();
  ctx.translate(x, y);

  // Percolator body (hourglass mid-century shape)
  ctx.fillStyle = C_TEAL;
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 5;

  ctx.beginPath();
  ctx.moveTo(-50, 100);
  ctx.bezierCurveTo(-70, 20, -30, -20, -35, -70);
  ctx.lineTo(35, -70);
  ctx.bezierCurveTo(30, -20, 70, 20, 50, 100);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Handle
  ctx.beginPath();
  ctx.moveTo(-45, -20);
  ctx.bezierCurveTo(-110, -20, -110, 60, -45, 70);
  ctx.stroke();

  // Spout
  ctx.beginPath();
  ctx.moveTo(40, -50);
  ctx.bezierCurveTo(90, -60, 100, -10, 80, 10);
  ctx.stroke();

  // Steam puffs rising
  if (t > 2.0) {
    ctx.strokeStyle = C_INK;
    ctx.lineWidth = 3;
    const sy = -90 - ((t * 40) % 60);
    const sa = Math.max(0, 1 - ((t * 40) % 60) / 60);
    ctx.globalAlpha = sa;
    ctx.beginPath();
    ctx.arc(0, sy, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(10, sy - 30, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTitleCard(t) {
  if (t > 1.5) return;
  const p = pr(t, 0, 0.4);
  const alpha = 1 - pr(t, 1.1, 1.5);
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = C_CORAL;
  ctx.fillRect(400, 350, 1120, 380);
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 8;
  ctx.strokeRect(400, 350, 1120, 380);

  // Inner cream box
  ctx.fillStyle = C_CREAM;
  ctx.fillRect(430, 380, 1060, 320);
  ctx.strokeRect(430, 380, 1060, 320);

  ctx.fillStyle = C_INK;
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("LESSON NO. 4", 960, 460);

  ctx.font = 'bold 54px sans-serif';
  ctx.fillStyle = C_TEAL;
  ctx.fillText("THE SYNCHRONIZED KITCHEN", 960, 560);

  ctx.restore();
}

function drawDiagramArrows(t) {
  if (t < 2.0 || t > 8.5) return;
  ctx.save();
  ctx.strokeStyle = C_CORAL;
  ctx.lineWidth = 6;
  ctx.setLineDash([15, 15]);

  // Curved callout arrow between pot and toaster
  ctx.beginPath();
  ctx.moveTo(650, 500);
  ctx.bezierCurveTo(800, 350, 1100, 350, 1250, 500);
  ctx.stroke();

  // Arrowhead
  ctx.setLineDash([]);
  ctx.fillStyle = C_CORAL;
  ctx.beginPath();
  ctx.moveTo(1250, 500);
  ctx.lineTo(1230, 480);
  ctx.lineTo(1235, 515);
  ctx.closePath();
  ctx.fill();

  // Numbered circle medallion
  ctx.fillStyle = C_MUSTARD;
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(960, 330, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = C_INK;
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("1", 960, 332);

  ctx.restore();
}

function drawNarratorText(t) {
  let text = "";
  if (t > 1.5 && t < 4.0) text = "Figure A: The Morning Routine begins on the beat.";
  else if (t >= 4.0 && t < 7.0) text = "Figure B: Notice the simultaneous toast elevation.";
  else if (t >= 7.0 && t < 9.5) text = "A harmonious culinary environment.";

  if (!text) return;

  ctx.save();
  ctx.fillStyle = C_INK;
  ctx.fillRect(360, 920, 1200, 100);
  ctx.strokeStyle = C_CREAM;
  ctx.lineWidth = 4;
  ctx.strokeRect(360, 920, 1200, 100);

  ctx.fillStyle = C_CREAM;
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 960, 970);
  ctx.restore();
}

function draw(t) {
  drawBackground();
  drawClock(t);
  drawCoffeePot(t, 550, 620);
  drawToaster(t, 1370, 640);

  // Table surface line
  ctx.strokeStyle = C_INK;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(150, 750);
  ctx.lineTo(1770, 750);
  ctx.stroke();

  drawDiagramArrows(t);
  drawTitleCard(t);
  drawNarratorText(t);
}

window.DUR = 10;
window.render = draw;
window.READY = true;
