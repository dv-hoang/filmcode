// 60s Spy Title Sequence - Cut paper, four-ink aesthetic (Saul Bass / Kuntzel+Deygas)
const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// 4 Inks + Paper
const PAPER = '#f3f0e6';
const INK_RED = '#d63220';
const INK_BLACK = '#1a1818';
const INK_MUSTARD = '#e5a93b';
const INK_WHITE = '#faf8f2';

function rect(x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x, y, w, h);
}

function cutPolygon(pts, col) {
  ctx.save();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPaperGrain() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.015)';
  for (let i = 0; i < 400; i++) {
    const rx = (i * 37.1) % W;
    const ry = (i * 73.3) % H;
    ctx.fillRect(rx, ry, 2, 2);
  }
  ctx.restore();
}

export function draw(t) {
  // Background
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  drawPaperGrain();

  // Act I (0 - 3.2s): The Dossier / Classified Redacted Stamp & Shadow Profile
  if (t < 3.5) {
    const progress = Math.min(1, t / 0.8);
    // Sliding black dossier folder
    const folderX = -200 + progress * 450;
    
    ctx.save();
    ctx.shadowColor = 'rgba(26,24,24,0.3)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 15;
    ctx.shadowOffsetY = 15;
    rect(folderX, 150, 1100, 780, INK_BLACK);
    ctx.restore();

    // Mustard paper inner flap
    rect(folderX + 40, 190, 1020, 700, INK_MUSTARD);
    
    // Redacted black strips sliding across
    if (t > 1.0) {
      const p2 = Math.min(1, (t - 1.0) / 0.6);
      rect(folderX + 100, 300, 800 * p2, 60, INK_BLACK);
      rect(folderX + 100, 390, 650 * p2, 60, INK_BLACK);
      rect(folderX + 100, 480, 720 * p2, 60, INK_BLACK);
    }

    // Silhouette of spy head profile appearing
    if (t > 1.8) {
      const p3 = Math.min(1, (t - 1.8) / 0.7);
      ctx.save();
      ctx.globalAlpha = p3;
      // Cut paper profile head
      cutPolygon([
        [1150, 750], [1100, 600], [1130, 450], [1210, 350], 
        [1350, 330], [1450, 400], [1480, 520], [1420, 680], [1350, 750]
      ], INK_RED);
      // Fedora hat cutout
      cutPolygon([
        [1080, 420], [1520, 380], [1480, 320], [1120, 340]
      ], INK_BLACK);
      cutPolygon([
        [1180, 330], [1400, 310], [1370, 220], [1210, 230]
      ], INK_BLACK);
      ctx.restore();
    }

    // Title card text
    if (t > 2.4) {
      ctx.save();
      ctx.fillStyle = INK_BLACK;
      ctx.font = '900 64px "Helvetica Neue", Arial, sans-serif';
      ctx.letterSpacing = '12px';
      ctx.fillText("MINISTRY OF SHADOWS", 220, 640);
      ctx.fillStyle = INK_RED;
      ctx.font = '700 28px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText("ACQUIRED ASSETS // FILE 09", 220, 710);
      ctx.restore();
    }
  }

  // Act II (3.5 - 7.0s): The Pursuit / Lateral Cut-Paper Chase
  else if (t < 7.2) {
    const t2 = t - 3.5;
    
    // Abstract geometric city backdrop (black & mustard buildings)
    for (let i = 0; i < 7; i++) {
      const bx = i * 310 - (t2 * 140) % 2170;
      const bw = 220;
      const bh = 400 + (i * 73) % 400;
      rect(bx, H - bh, bw, bh, i % 2 === 0 ? INK_BLACK : INK_MUSTARD);
    }

    // Slanted street strip
    ctx.save();
    ctx.fillStyle = INK_BLACK;
    ctx.beginPath();
    ctx.moveTo(0, 950);
    ctx.lineTo(W, 850);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Running silhouette figure (cut paper limbs moving)
    const runCycle = Math.sin(t2 * 18);
    const figX = 500 + Math.sin(t2 * 2) * 150;
    const figY = 700 + runCycle * 25;

    ctx.save();
    // Body / Coat
    cutPolygon([
      [figX - 40, figY], [figX + 30, figY - 120], 
      [figX + 60, figY - 200], [figX - 10, figY - 220], [figX - 60, figY - 120]
    ], INK_RED);
    // Head & Hat
    cutPolygon([
      [figX - 15, figY - 250], [figX + 35, figY - 260], 
      [figX + 25, figY - 300], [figX - 25, figY - 290]
    ], INK_BLACK);
    // Briefcase swinging
    const caseAngle = t2 * 10;
    rect(figX + 70 + Math.cos(caseAngle)*30, figY - 100 + Math.sin(caseAngle)*30, 50, 35, INK_BLACK);
    ctx.restore();

    // Bold Credits flashing in Saul Bass bold typography
    if (t2 > 1.0 && t2 < 2.5) {
      ctx.save();
      ctx.fillStyle = INK_WHITE;
      ctx.shadowColor = INK_BLACK;
      ctx.shadowBlur = 10;
      ctx.font = '900 85px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText("STARRING VERA LANCE", 200, 250);
      ctx.restore();
    }
    if (t2 > 2.5) {
      ctx.save();
      ctx.fillStyle = INK_RED;
      ctx.font = '900 85px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText("MUSIC BY QUINN MERCER", 200, 250);
      ctx.restore();
    }
  }

  // Act III (7.2 - 10.0s): The Cipher & Final Title Resolution
  else {
    const t3 = t - 7.2;
    const reveal = Math.min(1, t3 / 0.8);

    // Large expanding concentric cut-paper circles
    ctx.save();
    ctx.fillStyle = INK_BLACK;
    ctx.beginPath();
    ctx.arc(W/2, H/2, (1 - reveal) * 1200, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Central Dossier Stamp Box
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 40;
    rect(W/2 - 500, H/2 - 220, 1000, 440, PAPER);
    
    // Red perforated stamp border
    ctx.strokeStyle = INK_RED;
    ctx.lineWidth = 8;
    ctx.setLineDash([20, 15]);
    ctx.strokeRect(W/2 - 470, H/2 - 190, 940, 380);
    ctx.restore();

    // Main Film Title
    if (t3 > 0.4) {
      ctx.save();
      ctx.fillStyle = INK_BLACK;
      ctx.font = '900 110px "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '24px';
      ctx.fillText("DEAD DROP", W/2, H/2 - 20);

      ctx.fillStyle = INK_RED;
      ctx.font = '700 32px "Helvetica Neue", Arial, sans-serif';
      ctx.letterSpacing = '16px';
      ctx.fillText("A ZERO-SUM AFFAIR", W/2, H/2 + 70);

      // Bottom confidentiality tag
      ctx.fillStyle = INK_MUSTARD;
      rect(W/2 - 180, H/2 + 120, 360, 40, INK_MUSTARD);
      ctx.fillStyle = INK_BLACK;
      ctx.font = '700 18px "Helvetica Neue", Arial, sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText("TOP SECRET // EYES ONLY", W/2, H/2 + 147);
      ctx.restore();
    }
  }
}

window.DUR = 10;
window.render = draw;
window.READY = true;
