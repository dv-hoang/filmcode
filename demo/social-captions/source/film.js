const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const pr = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t;
const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Offscreen buffer for source document simulation
const docCanvas = document.createElement('canvas');
docCanvas.width = 1200; docCanvas.height = 1400;
const dc = docCanvas.getContext('2d');

function initDoc() {
  dc.fillStyle = '#f4efe6';
  dc.fillRect(0, 0, 1200, 1400);
  dc.fillStyle = '#111';
  dc.font = 'bold 36px monospace';
  dc.fillText('GLOBAL ENERGY RESEARCH COUNCIL', 80, 100);
  dc.font = '20px monospace';
  dc.fillStyle = '#555';
  dc.fillText('REPORT: 2024-Q4 EXTRACTION & SUPPLY METRICS', 80, 140);
  
  dc.lineWidth = 2;
  dc.strokeStyle = '#ccc';
  dc.beginPath(); dc.moveTo(80, 170); dc.lineTo(1120, 170); dc.stroke();

  // Paragraph lines
  dc.fillStyle = '#333';
  for (let y = 220; y < 900; y += 45) {
    const len = 700 + (y * 37) % 350;
    dc.fillRect(80, y, len, 14);
  }

  // Highlighted data box
  dc.fillStyle = 'rgba(255, 204, 0, 0.4)';
  dc.fillRect(70, 940, 1050, 180);
  dc.strokeStyle = '#e67300';
  dc.lineWidth = 4;
  dc.strokeRect(70, 940, 1050, 180);

  dc.fillStyle = '#000';
  dc.font = 'bold 32px monospace';
  dc.fillText('TABLE 4.B: LITHIUM DEMAND SURGE', 100, 1000);
  dc.font = 'bold 52px monospace';
  dc.fillStyle = '#cc0000';
  dc.fillText('DEMAND: +312% YOY', 100, 1075);

  dc.fillStyle = '#666';
  dc.font = '22px monospace';
  dc.fillText('Source: International Energy Index / SEC Reg 8-K', 80, 1320);
}
initDoc();

export function draw(t) {
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, W, H);

  // ---------------------------------------------------------------------------
  // SCENE 1 (0.0 - 2.8s): The Hook — Huge Captions & Background Footage
  // ---------------------------------------------------------------------------
  if (t < 2.9) {
    const p1 = pr(t, 0.0, 2.8);
    
    // Background: stylized mining landscape / abstract pulse
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(1 + p1 * 0.05, 1 + p1 * 0.05);
    ctx.translate(-W / 2, -H / 2);

    // Grid / Terrain lines
    ctx.strokeStyle = '#1e2430';
    ctx.lineWidth = 3;
    for (let x = 0; x < W; x += 120) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 120) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Glowing salt flats / extraction pools graphic
    const grad = ctx.createRadialGradient(W*0.5, H*0.6, 100, W*0.5, H*0.6, 900);
    grad.addColorStop(0, '#0d253f');
    grad.addColorStop(1, '#050811');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Source tag sliding in (top left)
    const tagProg = easeOut(pr(t, 0.1, 0.4));
    ctx.save();
    ctx.translate(-200 + tagProg * 250, 70);
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, 380, 64);
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 380, 64);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('SOURCE: GLOBAL ENERGY COUNCIL', 20, 40);
    ctx.restore();

    // Captions slamming in chunk by chunk
    // Beat 1: "GLOBAL"
    if (t > 0.3) {
      const b1 = easeOut(pr(t, 0.3, 0.45));
      ctx.save();
      ctx.translate(140, 480);
      ctx.scale(b1, b1);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 20;
      ctx.fillText('GLOBAL', 0, 0);
      ctx.restore();
    }

    // Beat 2: "LITHIUM" (Yellow block keyword)
    if (t > 0.7) {
      const b2 = easeOut(pr(t, 0.7, 0.85));
      ctx.save();
      ctx.translate(410, 480);
      ctx.scale(b2, b2);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(-15, -75, 340, 95);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText('LITHIUM', 10, 0);
      ctx.restore();
    }

    // Beat 3: "DEMAND"
    if (t > 1.1) {
      const b3 = easeOut(pr(t, 1.1, 1.25));
      ctx.save();
      ctx.translate(790, 480);
      ctx.scale(b3, b3);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText('DEMAND', 0, 0);
      ctx.restore();
    }

    // Beat 4: Second line "IS SURGING."
    if (t > 1.5) {
      const b4 = easeOut(pr(t, 1.5, 1.68));
      ctx.save();
      ctx.translate(140, 600);
      ctx.scale(b4, b4);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText('IS SURGING.', 0, 0);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // SCENE 2 (2.8 - 6.2s): The Document Proof & Rolling Number
  // ---------------------------------------------------------------------------
  if (t >= 2.8 && t < 6.4) {
    const p2 = pr(t, 2.8, 6.4);

    // Slide document in from right
    const docSlide = easeInOut(pr(t, 2.8, 3.2));
    ctx.save();
    ctx.translate(W - 750 + (1 - docSlide) * 900, 120);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 40;
    ctx.drawImage(docCanvas, 0, 0, 700, 850);
    ctx.restore();

    // Source badge
    const tagProg2 = easeOut(pr(t, 2.9, 3.2));
    ctx.save();
    ctx.translate(120, 100 + (1 - tagProg2) * -50);
    ctx.globalAlpha = tagProg2;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, 440, 64);
    ctx.strokeStyle = '#e67300'; ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 440, 64);
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('SEC REG 8-K • TABLE 4.B', 20, 40);
    ctx.restore();

    // Left captions explaining the figure
    if (t > 3.4) {
      const c1 = easeOut(pr(t, 3.4, 3.6));
      ctx.save();
      ctx.translate(120, 320);
      ctx.scale(c1, c1);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText('UP BY A', 0, 0);
      ctx.restore();
    }

    // Rolling number + yellow block
    if (t > 3.8) {
      const c2 = easeOut(pr(t, 3.8, 4.0));
      ctx.save();
      ctx.translate(120, 440);
      ctx.scale(c2, c2);
      
      // Yellow block
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(-15, -75, 410, 95);

      // Roll number from 0 to 312
      const rollProg = easeOut(pr(t, 4.0, 5.2));
      const currentVal = Math.floor(rollProg * 312);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 78px sans-serif';
      ctx.fillText(`+${currentVal}%`, 10, 0);
      ctx.restore();
    }

    if (t > 5.3) {
      const c3 = easeOut(pr(t, 5.3, 5.5));
      ctx.save();
      ctx.translate(120, 560);
      ctx.scale(c3, c3);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText('IN ONE YEAR.', 0, 0);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // SCENE 3 (6.4 - 10.0s): The Takeaway & CTA
  // ---------------------------------------------------------------------------
  if (t >= 6.4) {
    const p3 = pr(t, 6.4, 10.0);

    // Dark background flash / pulse
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);

    // Grid lines moving back
    ctx.strokeStyle = '#162032';
    ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 100) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // Big concluding captions
    if (t > 6.6) {
      const s1 = easeOut(pr(t, 6.6, 6.8));
      ctx.save();
      ctx.translate(W / 2, 340);
      ctx.scale(s1, s1);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 58px sans-serif';
      ctx.fillText('WHAT THIS MEANS FOR', 0, 0);
      ctx.restore();
    }

    if (t > 7.2) {
      const s2 = easeOut(pr(t, 7.2, 7.4));
      ctx.save();
      ctx.translate(W / 2, 480);
      ctx.scale(s2, s2);
      ctx.textAlign = 'center';
      
      // Wide yellow banner
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(-450, -85, 900, 110);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText('EV SUPPLY CHAINS', 0, -5);
      ctx.restore();
    }

    if (t > 8.0) {
      const s3 = easeOut(pr(t, 8.0, 8.2));
      ctx.save();
      ctx.translate(W / 2, 640);
      ctx.scale(s3, s3);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('Tap link in bio for full briefing & source docs.', 0, 0);
      ctx.restore();
    }

    // Final social brand watermark / handle
    const brandFade = pr(t, 8.5, 9.0);
    ctx.save();
    ctx.globalAlpha = brandFade;
    ctx.translate(W / 2, 850);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('// BRIEFING NEWS DIRECT', 0, 0);
    ctx.restore();
  }
}

window.DUR = 10;
window.render = draw;
window.READY = true;
