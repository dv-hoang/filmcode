// The pen is never drawn. A soft shadow, a contact dot, and one layer per hand.
import { clamp, lerp } from '/core/lib.js';
import { worldToScreen } from './cam.js';

let oldLayer = null;
let youngLayer = null;

function layer() {
  const c = document.createElement('canvas');
  c.width = 1920;
  c.height = 1080;
  return c;
}

function paintHand(ctx, x, y, scale, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(42, 34, 26, 0.72)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 34, 24, 0, 0, Math.PI * 2);
  for (let i = 0; i < 4; i++) {
    ctx.ellipse(-16 + i * 11, -22, 5.5, 16, -0.2 + i * 0.1, 0, Math.PI * 2);
  }
  ctx.ellipse(28, -2, 6, 14, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function stamp(which, draw) {
  const c = which === 'old' ? (oldLayer ||= layer()) : (youngLayer ||= layer());
  const ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, 1920, 1080);
  ctx.filter = 'blur(9px)';
  draw(ctx);
  ctx.filter = 'none';
  return c;
}

export function drawHands(main, nib, cam, t, hold) {
  const [sx, sy] = worldToScreen(nib.x, nib.y, cam);
  const oldA = t < hold.t1 - 0.55 ? 1 : t > hold.t1 + 0.2 ? 0 : clamp(1 - (t - (hold.t1 - 0.55)) / 0.75);
  const youngA = t < hold.t1 - 0.4 ? 0 : t > hold.t1 + 0.45 ? 1 : clamp((t - (hold.t1 - 0.4)) / 0.85);
  const leave = t > 36.2 ? clamp(1 - (t - 36.2) / 0.8) : 1;

  if (oldA > 0.02) {
    const c = stamp('old', (ctx) => {
      paintHand(ctx, sx - 86, sy - 36, 1.15, -0.45);
    });
    main.save();
    main.globalAlpha = 0.34 * oldA;
    main.drawImage(c, 0, 0);
    main.restore();
  }
  if (youngA > 0.02 && leave > 0.02) {
    const c = stamp('young', (ctx) => {
      paintHand(ctx, sx + 62, sy - 18, 0.78, 0.4);
    });
    main.save();
    main.globalAlpha = 0.32 * youngA * leave;
    main.drawImage(c, 0, 0);
    main.restore();
  }

  const len = clamp(140 * cam.zoom, 64, 320);
  const ang = 0.55 + cam.roll;
  main.save();
  main.translate(sx, sy);
  main.rotate(ang);
  const g = main.createLinearGradient(0, 0, len, len * 0.35);
  g.addColorStop(0, 'rgba(30,24,18,0.20)');
  g.addColorStop(1, 'rgba(30,24,18,0)');
  main.fillStyle = g;
  main.filter = 'blur(10px)';
  main.beginPath();
  main.moveTo(0, 0);
  main.lineTo(len, len * 0.22);
  main.lineTo(len * 0.82, len * 0.42);
  main.closePath();
  main.fill();
  main.filter = 'none';
  main.restore();

  const dot = lerp(1.4, 3.2, clamp(1 - nib.v / 400));
  main.beginPath();
  main.fillStyle = 'rgba(20,16,12,0.75)';
  main.arc(sx, sy, dot, 0, Math.PI * 2);
  main.fill();
}
