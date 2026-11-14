// 16-bit Pixel RPG Demo: "THE LAST SANCTUARY"
// 320x180 framebuffer, scaled 6x to 1920x1080 with nearest-neighbour.
const SW = 320, SH = 180;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const off = document.createElement('canvas');
off.width = SW;
off.height = SH;
const g = off.getContext('2d');
g.imageSmoothingEnabled = false;

// 16-bit Palette
const PAL = {
  void: '#070510',
  deep: '#140c1c',
  stone: '#2c2234',
  wall: '#44344c',
  floor: '#5c485c',
  lit: '#846874',
  bright: '#bca4a4',
  white: '#fcf4d4',
  greenDark: '#0c242c',
  greenMid: '#185c4c',
  greenLit: '#38bc74',
  greenBright: '#a4fc84',
  goldDark: '#5c2c18',
  goldMid: '#bc6c2c',
  goldLit: '#fca444',
  goldBright: '#fce484',
  rubyDark: '#5c142c',
  rubyMid: '#bc2c5c',
  rubyLit: '#f44484',
  blueDark: '#142c5c',
  blueMid: '#2c6cb4',
  blueLit: '#6cc4fc',
  blueBright: '#e4f4fc',
  shadow: 'rgba(7, 5, 16, 0.5)'
};

function fillRect(x, y, w, h, col) {
  g.fillStyle = col;
  g.fillRect(x, y, w, h);
}

function drawPixel(x, y, col) {
  g.fillStyle = col;
  g.fillRect(x, y, 1, 1);
}

function drawBox(x, y, w, h, fillCol, borderCol) {
  g.fillStyle = fillCol;
  g.fillRect(x, y, w, h);
  g.strokeStyle = borderCol;
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

// Simple font renderer for pixel text
const FONT = {
  'A': [0x6,0x9,0xf,0x9,0x9], 'B': [0xe,0x9,0xe,0x9,0xe], 'C': [0x6,0x9,0x8,0x9,0x6],
  'D': [0xe,0x9,0x9,0x9,0xe], 'E': [0xf,0x8,0xe,0x8,0xf], 'F': [0xf,0x8,0xe,0x8,0x8],
  'G': [0x6,0x8,0xb,0x9,0x6], 'H': [0x9,0x9,0xf,0x9,0x9], 'I': [0xe,0x4,0x4,0x4,0xe],
  'J': [0x3,0x2,0x2,0xa,0x4], 'K': [0x9,0xa,0xc,0xa,0x9], 'L': [0x8,0x8,0x8,0x8,0xf],
  'M': [0x9,0xf,0x9,0x9,0x9], 'N': [0x9,0xd,0xb,0x9,0x9], 'O': [0x6,0x9,0x9,0x9,0x6],
  'P': [0xe,0x9,0xe,0x8,0x8], 'Q': [0x6,0x9,0x9,0xd,0xa], 'R': [0xe,0x9,0xe,0xa,0x9],
  'S': [0x6,0x8,0x6,0x1,0x6], 'T': [0xf,0x4,0x4,0x4,0x4], 'U': [0x9,0x9,0x9,0x9,0x6],
  'V': [0x9,0x9,0x9,0x6,0x4], 'W': [0x9,0x9,0x9,0xf,0x9], 'X': [0x9,0x6,0x4,0x6,0x9],
  'Y': [0x9,0x9,0x6,0x4,0x4], 'Z': [0xf,0x2,0x4,0x8,0xf], ' ': [0x0,0x0,0x0,0x0,0x0],
  '.': [0x0,0x0,0x0,0x0,0x4], '!': [0x4,0x4,0x4,0x0,0x4], '?': [0xe,0x1,0x2,0x0,0x2],
  '-': [0x0,0x0,0xf,0x0,0x0], ':': [0x0,0x4,0x0,0x4,0x0], '0': [0x6,0x9,0x9,0x9,0x6],
  '1': [0x4,0xc,0x4,0x4,0xe], '2': [0x6,0x9,0x2,0x4,0xf], '3': [0x6,0x1,0x2,0x1,0x6],
  '4': [0x9,0x9,0xf,0x1,0x1], '5': [0xf,0x8,0xe,0x1,0xe], '6': [0x6,0x8,0xe,0x9,0x6],
  '7': [0xf,0x1,0x2,0x4,0x4], '8': [0x6,0x9,0x6,0x9,0x6], '9': [0x6,0x9,0x7,0x1,0x6],
  '/': [0x1,0x2,0x4,0x8,0x1], ',': [0x0,0x0,0x0,0x4,0x8], "'": [0x4,0x2,0x0,0x0,0x0]
};

function drawText(str, x, y, col = PAL.white) {
  str = str.toUpperCase();
  let cx = x;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const bitmap = FONT[ch] || FONT['?'];
    if (bitmap) {
      for (let r = 0; r < 5; r++) {
        const row = bitmap[r];
        for (let c = 0; c < 4; c++) {
          if ((row & (1 << (3 - c))) !== 0) {
            drawPixel(cx + c, y + r, col);
          }
        }
      }
    }
    cx += 5;
  }
}

// Draw Knight sprite (16x16)
function drawKnight(x, y, frame, attack = false) {
  const head = PAL.white;
  const armor = PAL.blueMid;
  const highlight = PAL.blueLit;
  const sword = PAL.goldBright;
  const cape = PAL.rubyMid;

  // Cape
  fillRect(x + 2, y + 4, 3, 9, cape);
  
  // Body & Armor
  fillRect(x + 5, y + 5, 6, 8, armor);
  fillRect(x + 6, y + 6, 4, 6, highlight);

  // Helmet / Head
  fillRect(x + 5, y + 2, 6, 5, PAL.stone);
  fillRect(x + 7, y + 3, 3, 2, head);
  
  // Legs
  const legOffset = Math.sin(frame * Math.PI) > 0 ? 1 : 0;
  fillRect(x + 5, y + 13, 2, 3 - legOffset, PAL.stone);
  fillRect(x + 9, y + 13, 2, 2 + legOffset, PAL.stone);

  // Sword
  if (attack) {
    fillRect(x + 12, y + 6, 6, 2, sword);
    fillRect(x + 16, y + 5, 2, 4, PAL.white);
  } else {
    fillRect(x + 11, y + 7, 2, 7, sword);
  }
}

// Draw Dragon Boss sprite (32x24)
function drawDragon(x, y, anim) {
  const body = PAL.rubyMid;
  const dark = PAL.rubyDark;
  const belly = PAL.goldMid;
  const fire = PAL.goldLit;
  const wingY = Math.floor(Math.sin(anim * 4) * 2);

  // Wings
  fillRect(x + 10, y + 4 + wingY, 10, 8, dark);
  // Head & Horns
  fillRect(x + 22, y + 6, 8, 8, body);
  fillRect(x + 26, y + 4, 3, 3, dark);
  drawPixel(x + 24, y + 8, PAL.goldBright);
  
  // Body
  fillRect(x + 8, y + 10, 16, 10, body);
  fillRect(x + 10, y + 14, 12, 5, belly);

  // Tail
  fillRect(x + 2, y + 14, 6, 3, body);
  fillRect(x + 0, y + 12, 3, 3, dark);

  // Breath fire
  if (anim % 2 < 1) {
    fillRect(x + 28, y + 9, 6, 3, fire);
    fillRect(x + 32, y + 8, 4, 5, PAL.white);
  }
}

function draw(t) {
  g.fillStyle = PAL.void;
  g.fillRect(0, 0, SW, SH);

  if (t < 3.0) {
    // SCENE 1: Overworld dungeon approach
    for (let i = 0; i < 5; i++) {
      let bx = i * 70 - 10;
      fillRect(bx, 40, 50, 90, PAL.stone);
      fillRect(bx + 10, 20, 30, 30, PAL.stone);
      fillRect(bx + 15, 60, 6, 12, PAL.void);
      fillRect(bx + 29, 60, 6, 12, PAL.void);
    }
    fillRect(0, 130, SW, 50, PAL.floor);
    g.strokeStyle = PAL.stone;
    g.lineWidth = 0.5;
    for (let gx = 0; gx < SW; gx += 16) {
      g.beginPath();
      g.moveTo(gx, 130);
      g.lineTo(gx - 40, SH);
      g.stroke();
    }

    const heroX = Math.floor(20 + t * 40);
    drawKnight(heroX, 115, t * 6);

    drawBox(40, 15, 240, 32, PAL.deep, PAL.goldMid);
    drawText("QUEST: THE LAST SANCTUARY", 54, 21, PAL.goldBright);
    drawText("AREA: DRAGON'S KEEP B3", 64, 31, PAL.white);

  } else if (t < 7.0) {
    // SCENE 2: Boss Encounter
    const bt = t - 3.0;
    
    fillRect(0, 0, SW, 120, PAL.deep);
    const torchFlicker = Math.floor(bt * 8) % 2 === 0;
    fillRect(60, 40, 4, 8, PAL.goldDark);
    fillRect(58, 36, 8, 4, torchFlicker ? PAL.goldBright : PAL.goldLit);
    fillRect(256, 40, 4, 8, PAL.goldDark);
    fillRect(254, 36, 8, 4, torchFlicker ? PAL.goldLit : PAL.goldBright);

    fillRect(0, 120, SW, 60, PAL.stone);
    
    const dragonHit = bt > 2.5 && bt < 2.8;
    const dragonX = 180 + (dragonHit ? Math.sin(bt * 50) * 3 : 0);
    drawDragon(dragonX, 55, bt);

    const attacking = bt > 2.2 && bt < 3.2;
    const heroX = attacking ? 120 + Math.sin(bt * 30) * 15 : 80;
    drawKnight(heroX, 95, bt * 4, attacking);

    if (attacking) {
      fillRect(150, 65, 20, 2, PAL.white);
      fillRect(155, 60, 2, 14, PAL.goldBright);
    }

    drawBox(10, 126, 300, 48, PAL.deep, PAL.blueLit);
    drawText("HERO LV.99", 20, 134, PAL.blueBright);
    drawText("HP: 450/450", 20, 144, PAL.white);
    drawText("MP: 120/120", 20, 154, PAL.white);

    drawText("COMMAND", 140, 134, PAL.goldBright);
    drawText("> SWORD", 140, 144, PAL.white);
    drawText("  MAGIC", 140, 154, PAL.stone);

    drawBox(190, 134, 110, 14, PAL.stone, PAL.rubyMid);
    drawText("PYROCLAST", 196, 138, PAL.rubyLit);
    const hpWidth = Math.max(0, Math.floor(96 * (1.0 - Math.min(1, bt / 3.5))));
    fillRect(197, 146, hpWidth, 4, PAL.rubyLit);

  } else {
    // SCENE 3: Victory Fanfare
    const vt = t - 7.0;

    fillRect(0, 0, SW, SH, PAL.deep);

    const chestX = 144, chestY = 90;
    fillRect(chestX, chestY + 6, 32, 16, PAL.goldDark);
    fillRect(chestX + 2, chestY, 28, 6, PAL.goldMid);
    fillRect(chestX + 8, chestY + 2, 16, 8, PAL.goldBright);
    
    const pSparkle = Math.floor(vt * 10);
    for (let i = 0; i < 6; i++) {
      let px = chestX + 16 + Math.sin(pSparkle + i * 1.2) * 35;
      let py = chestY + 8 + Math.cos(pSparkle * 0.8 + i) * 25;
      fillRect(Math.floor(px), Math.floor(py), 2, 2, PAL.white);
    }

    drawKnight(110, 85, 0);

    drawBox(40, 20, 240, 46, PAL.deep, PAL.goldBright);
    drawText("VICTORY!", 130, 28, PAL.goldBright);
    drawText("OBTAINED LEGENDARY BLADE", 64, 42, PAL.white);
    
    if (vt > 1.5) {
      drawText("- THE END -", 128, 140, PAL.blueBright);
      drawText("THANKS FOR PLAYING", 92, 152, PAL.stone);
    }
  }

  ctx.clearRect(0, 0, 1920, 1080);
  ctx.drawImage(off, 0, 0, 1920, 1080);
}

window.DUR = 10;
window.render = draw;
window.READY = true;
