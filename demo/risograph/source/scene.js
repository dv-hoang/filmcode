// The Crossing — harbour, two boats, the sheet on the wall.
import { W, H, TEAL, PINK, clearPlates, over, knockout, layer } from './draw.js';
import { VOICE } from './timeline.js';

const HORIZON = 640;
const DISC = { x: 1380, y: 540, r: 150 };

const lerp = (a, b, u) => a + (b - a) * u;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (u) => {
  const t = clamp(u, 0, 1);
  return t * t * (3 - 2 * t);
};
const twos = (t) => Math.floor(t * 12) / 12;

function shotIndex(t) {
  if (t < 5) return 0;
  if (t < 10) return 1;
  if (t < 15) return 2;
  if (t < 20) return 3;
  if (t < 27.5) return 4;
  if (t < 32.5) return 5;
  return 6;
}

export function camAt(t) {
  if (t < 5) {
    const u = ease(t / 5);
    return { cx: lerp(1120, 1040, u), cy: lerp(1240, 920, u), scale: lerp(5.6, 1.12, u) };
  }
  if (t < 10) {
    const u = (t - 5) / 5;
    return { cx: ferryX(t) + 10, cy: lerp(820, 760, u), scale: 1.05 };
  }
  if (t < 15) return { cx: 1180, cy: 640, scale: 0.62 };
  if (t < 20) {
    const u = (t - 15) / 5;
    return { cx: mailX(t) - 10, cy: lerp(980, 860, u), scale: lerp(1.38, 1.16, u) };
  }
  if (t < 27.5) return { cx: 1380, cy: 700, scale: 1.58 };
  if (t < 32.5) {
    const u = ease((t - 27.5) / 5);
    return { cx: 1400, cy: lerp(860, 980, u), scale: lerp(1.2, 1.42, u) };
  }
  return { cx: 1400, cy: 980, scale: 1.42 };
}

function ferryX(t) {
  const s = twos(Math.min(t, 32.49));
  if (s <= 5) return 900;
  if (s < 14) return lerp(900, 1080, ease((s - 5) / 9));
  return 1080;
}

function mailX(t) {
  const s = twos(Math.min(t, 32.49));
  if (s < 15) return 2360;
  if (s < 22) return lerp(2360, 1720, ease((s - 15) / 7));
  return 1720;
}

function ferryDeck(t) {
  return 860 + Math.sin(twos(t) * 2.3) * 4;
}

function mailDeck(t) {
  return 880 + Math.sin(twos(t) * 2.05 + 1) * 5;
}

const OFFSETS = [
  { t: [1.6, -1.2], p: [2.4, 1.5], rt: 0.0011, rp: -0.0014 },
  { t: [-1.8, 0.9], p: [1.3, -2.1], rt: -0.0008, rp: 0.0012 },
  { t: [-1.2, 1.1], p: [2.0, -1.4], rt: 0.0006, rp: -0.001 },
  { t: [2.1, -1.5], p: [-1.7, 2.2], rt: -0.0013, rp: 0.0009 },
  { t: [1.1, 1.7], p: [-2.4, -1.1], rt: 0.001, rp: 0.0015 },
  { t: [-1.6, 0.7], p: [2.2, -1.3], rt: -0.0007, rp: -0.0012 },
  { t: [1.5, -0.9], p: [-2.1, 1.6], rt: 0.0009, rp: -0.0008 },
];

function pinkRoll(t) {
  if (t < 15) return { on: 1, edge: -50 };
  if (t < 15.55) return { on: 1, edge: lerp(-50, 2100, (t - 15) / 0.55) };
  return { on: 0, edge: 2100 };
}

export function printState(t) {
  const shot = shotIndex(t);
  const base = OFFSETS[shot];
  const offT = base.t.slice();
  const offP = base.p.slice();
  if (t >= 10 && t < 15) {
    const u = (t - 10) / 5;
    offP[0] += u * 22;
    offP[1] += -u * 9;
  }
  if (t >= 15 && t < 15.28) {
    const k = (t - 15) / 0.28;
    const ring = Math.exp(-k * 5) * Math.sin(k * 16);
    offP[0] += ring * 5;
    offT[0] -= ring * 3;
  }
  if (t >= 27.5 && t < 27.85) {
    const k = (t - 27.5) / 0.25;
    const ring = Math.exp(-k * 4.2) * Math.cos(k * Math.PI * 2.2);
    const kick = 12 * ring;
    offP[0] += kick;
    offT[0] -= kick * 0.65;
    offP[1] += kick * 0.22;
  }
  const roll = pinkRoll(t);
  const cam = camAt(Math.min(t, 32.49));
  const period = t >= 32.5 ? 7.6 : 7.5 * Math.max(1, cam.scale);
  return {
    offT, offP, rotT: base.rt, rotP: base.rp,
    rollOn: roll.on, rollEdge: roll.edge,
    shot: shot + 1, frame: Math.floor(t * 24), period,
  };
}

function applyCam(ctx, cam) {
  ctx.translate(W / 2, H / 2);
  ctx.scale(cam.scale, cam.scale);
  ctx.translate(-cam.cx, -cam.cy);
}

function shape(ctx, mode, color, screenScale, trace) {
  ctx.save();
  ctx.beginPath();
  trace(ctx);
  if (mode === 'knock') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 9 / Math.max(0.2, screenScale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fill();
    ctx.stroke();
  } else if (color) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

function rect(x, y, w, h) {
  return (c) => { c.rect(x, y, w, h); };
}

function drawGround(ctx) {
  over(ctx, TEAL(0.24), rect(0, 0, 4000, 560));
  over(ctx, TEAL(0.1), rect(0, 560, 4000, 80));
  over(ctx, TEAL(1), rect(-200, HORIZON, 4400, 130));
  over(ctx, TEAL(0.62), rect(-200, 770, 4400, 160));
  over(ctx, TEAL(0.4), rect(-200, 930, 4400, 200));
  over(ctx, TEAL(0.22), rect(-200, 1130, 4400, 500));
  over(ctx, TEAL(1), (c) => {
    c.moveTo(-100, HORIZON);
    c.lineTo(-100, 400);
    c.lineTo(160, 360);
    c.lineTo(480, 470);
    c.lineTo(760, HORIZON);
    c.closePath();
  });
}

function drawPier(ctx) {
  over(ctx, TEAL(1), rect(140, 700, 460, 52));
  for (let i = 0; i < 4; i++) over(ctx, TEAL(1), rect(190 + i * 110, 752, 24, 200));
  over(ctx, TEAL(1), rect(220, 520, 230, 180));
  knockout(ctx, rect(280, 566, 78, 58));
  over(ctx, PINK(1), rect(300, 582, 26, 26), true);
}

function hullPath(x, deck, len, h, nose) {
  return (c) => {
    const left = x - len * 0.5;
    const right = x + len * nose;
    c.moveTo(left, deck);
    c.lineTo(right, deck);
    c.quadraticCurveTo(x + len * 0.56, deck + h * 0.72, x + len * 0.08, deck + h);
    c.quadraticCurveTo(x - len * 0.5, deck + h, left + 8, deck);
    c.closePath();
  };
}

function drawFerry(ctx, t, screenScale) {
  const x = ferryX(t);
  const deck = ferryDeck(t);
  over(ctx, TEAL(1), hullPath(x, deck, 460, 100, 0.44), true);
  over(ctx, TEAL(1), rect(x - 90, deck - 64, 110, 64), true);
  over(ctx, TEAL(1), rect(x - 36, deck - 118, 18, 58), true);
  const s = twos(t);
  over(ctx, TEAL(0.45), (c) => {
    c.arc(x - 20, deck - 110 + Math.sin(s * 3) * 6, 18, 0, Math.PI * 2);
  });
  for (let i = 0; i < 4; i++) {
    const bx = x - 150 - i * 46;
    knockout(ctx, (c) => {
      c.moveTo(bx, deck + 20);
      c.lineTo(bx - 36, deck + 48);
      c.lineTo(bx - 8, deck + 52);
      c.closePath();
    });
  }
  const step = twos(t);
  const look = step < 20 ? 0 : clamp((step - 20) / 0.8, 0, 1);
  drawPerson(ctx, {
    x: x + 20, y: deck, face: 1, screenScale, step,
    look: look * 8,
    arm: step < 20 ? 1.15 : lerp(1.15, 0.7, look),
    cap: TEAL(1),
    scarf: true,
  });
}

function drawMail(ctx, t, screenScale) {
  const x = mailX(t);
  const deck = mailDeck(t);
  over(ctx, PINK(1), hullPath(x, deck, 480, 92, 0.4), true);
  over(ctx, PINK(1), rect(x - 40, deck - 70, 120, 70), true);
  over(ctx, PINK(1), rect(x + 80, deck - 150, 10, 150), true);
  const s = twos(t);
  over(ctx, PINK(1), (c) => {
    const mastX = x + 85;
    const y = deck - 150;
    c.moveTo(mastX, y);
    for (let i = 1; i <= 7; i++) {
      const u = i / 7;
      c.lineTo(mastX - u * 86, y + Math.sin(u * 5.4 + s * 4.2) * (5 + u * 16));
    }
    for (let i = 7; i >= 0; i--) {
      const u = i / 7;
      c.lineTo(mastX - u * 86, y + 18 + Math.sin(u * 5.4 + s * 4.2 + 0.7) * (4 + u * 12));
    }
    c.closePath();
  }, true);
  const step = twos(t);
  let arm = 1.05;
  if (step >= 20.2 && step < 21.1) arm = lerp(1.05, -0.95, (step - 20.2) / 0.9);
  else if (step >= 21.1 && step < 23.4) arm = -0.95 + Math.sin((step - 21.1) * 7) * 0.18;
  else if (step >= 23.4 && step < 24.6) arm = lerp(-0.85, 0.9, (step - 23.4) / 1.2);
  else if (step >= 24.6) arm = 0.85;
  const look = step < 20 ? 0 : clamp((step - 20) / 0.8, 0, 1);
  drawPerson(ctx, {
    x: x - 20, y: deck, face: -1, screenScale, step,
    look: -look * 8,
    arm,
    cap: PINK(1),
    scarf: false,
  });
}

function drawPerson(ctx, o) {
  const sc = o.screenScale;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.scale(o.face, 1);
  ctx.translate(Math.sin(o.step * 2.5) * 3, 0);
  const passes = ['knock', 'ink'];
  for (const mode of passes) {
    const leg = (lx, rot) => shape(ctx, mode, TEAL(1), sc, (c) => {
      c.translate(lx, -78);
      c.rotate(rot);
      c.rect(-7, 0, 14, 78);
    });
    const stance = Math.sin(o.step * 4.2) * 0.08;
    leg(-14, 0.12 + stance);
    leg(10, -0.08 - stance);
    shape(ctx, mode, TEAL(1), sc, (c) => {
      c.moveTo(-30, -158);
      c.lineTo(28, -154);
      c.lineTo(34, -68);
      c.lineTo(-32, -72);
      c.closePath();
    });
    shape(ctx, mode, TEAL(1), sc, (c) => {
      c.translate(6, -148);
      c.rotate(o.arm);
      c.rect(-8, -8, 62, 16);
    });
    shape(ctx, mode, null, sc, (c) => {
      c.arc(o.look, -186, 28, 0, Math.PI * 2);
    });
    shape(ctx, mode, o.cap, sc, (c) => {
      c.moveTo(o.look - 30, -190);
      c.lineTo(o.look + 26, -196);
      c.lineTo(o.look + 34, -176);
      c.lineTo(o.look - 22, -174);
      c.closePath();
    });
    if (o.scarf) {
      shape(ctx, mode, PINK(1), sc, (c) => {
        const y = -150;
        c.moveTo(-18, y);
        for (let i = 1; i <= 7; i++) {
          const u = i / 7;
          c.lineTo(-18 - u * 74, y + Math.sin(u * 6 + o.step * 4) * (4 + u * 12));
        }
        for (let i = 7; i >= 0; i--) {
          const u = i / 7;
          c.lineTo(-18 - u * 74, y + 14 + Math.sin(u * 6 + o.step * 4 + 0.5) * (3 + u * 8));
        }
        c.closePath();
      });
    }
  }
  ctx.restore();
}

function drawCross(ctx, t) {
  if (t < 27.5) return;
  const u = ease(clamp((twos(t) - 27.5) / 1.4, 0, 1));
  const xR = mailX(t) - 20;
  const xL = lerp(xR, ferryX(t) + 30, u);
  const bands = [0.34, 0.52, 0.7];
  bands.forEach((d, i) => {
    const y = 900 + i * 46;
    over(ctx, PINK(d), (c) => {
      c.moveTo(xR, y);
      c.lineTo(xL, y + 8);
      c.lineTo(xL, y + 42);
      c.lineTo(xR, y + 34);
      c.closePath();
    }, false);
  });
}

function drawWorld(ctx, t, screenScale) {
  drawGround(ctx);
  over(ctx, PINK(1), (c) => {
    c.arc(DISC.x, DISC.y, DISC.r, 0, Math.PI * 2);
  }, true);
  drawPier(ctx);
  drawCross(ctx, t);
  drawFerry(ctx, t, screenScale);
  if (t >= 14.95) drawMail(ctx, t, screenScale);
}

function posterRect(t) {
  const u = ease(clamp((t - 32.5) / 1.35, 0, 1));
  return {
    x: lerp(0, 400, u),
    y: lerp(0, 96, u),
    w: lerp(1920, 1120, u),
    h: lerp(1080, 630, u),
  };
}

function pinPoint(t) {
  const r = posterRect(t);
  return { x: r.x + 54, y: r.y + 42 };
}

function drawHand(ctx, t) {
  if (t < 33.6) return;
  const pin = pinPoint(t);
  const s = twos(t);
  const u = ease(clamp((s - 33.6) / 0.7, 0, 1));
  const press = clamp((s - 34.4) / 0.25, 0, 1);
  const x = pin.x + 6;
  const y = lerp(pin.y - 150, pin.y + 4, u) + Math.sin(press * Math.PI) * 8;
  layer(ctx, 1, (c, mode) => {
    shape(c, mode, TEAL(1), 1, (g) => { g.rect(x - 14, y - 90, 28, 96); });
    shape(c, mode, null, 1, (g) => { g.arc(x, y + 6, 20, 0, Math.PI * 2); });
    for (let i = 0; i < 3; i++) {
      shape(c, mode, TEAL(1), 1, (g) => { g.rect(x - 16 + i * 11, y + 16, 8, 18); });
    }
  });
}

function drawWall(ctx, t) {
  over(ctx, TEAL(0.28), rect(0, 0, 240, H));
  over(ctx, TEAL(0.16), rect(0, 990, W, 90));
  for (let i = 0; i < 3; i++) {
    const x = 1560 + i * 14;
    const y = 800 + i * 16;
    knockout(ctx, rect(x, y, 280, 70));
    over(ctx, TEAL(1), (c) => {
      c.rect(x, y, 280, 8);
      c.rect(x, y, 8, 70);
    });
  }
}

function drawTitle(ctx, t) {
  if (t < 35.8) return;
  const u = clamp((t - 35.8) / 0.34, 0, 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(180, 800, Math.max(8, u * 1560), 180);
  ctx.clip();
  ctx.font = '700 76px "Cormorant Garamond"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = TEAL(1);
  ctx.fillText('THE CROSSING', 954, 908);
  ctx.fillStyle = PINK(1);
  ctx.fillText('THE CROSSING', 968, 914);
  ctx.restore();
  if (u < 1) {
    over(ctx, PINK(0.45), rect(180 + u * 1560 - 16, 820, 22, 140));
  }
}

function lineHold(text, dur) {
  const chars = [...text].filter((ch) => !/\s/.test(ch)).length;
  return Math.max(1.8, dur + 0.6, chars / 15 + 1.5) + 0.08;
}

const TOP = new Set(['v04', 'v05']);

export function subtitleBox(id) {
  if (TOP.has(id)) return { x: 360, y: 36, w: 1200, h: 78 };
  return { x: 300, y: 968, w: 1320, h: 78 };
}

function drawSubtitle(ctx, t, durs) {
  for (const v of VOICE) {
    const dur = durs[v.id] ?? 2.2;
    const hold = lineHold(v.text, dur);
    const t1 = v.t0 + hold;
    if (t < v.t0 || t >= t1) continue;
    const box = subtitleBox(v.id);
    const u = clamp((t - v.t0) / 0.12, 0, 1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, Math.max(4, box.w * u), box.h);
    ctx.clip();
    knockout(ctx, (c) => { c.rect(box.x, box.y, box.w, box.h); });
    ctx.font = '600 44px "Cormorant Garamond"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = TEAL(1);
    ctx.fillText(v.text, box.x + box.w / 2, box.y + box.h / 2 + 2);
    ctx.restore();
    return;
  }
}

export function drawPlates(ctx, t, durs) {
  clearPlates(ctx);
  if (t < 32.5) {
    const cam = camAt(t);
    ctx.save();
    applyCam(ctx, cam);
    drawWorld(ctx, t, cam.scale);
    ctx.restore();
  } else {
    drawWall(ctx, t);
    const r = posterRect(t);
    const cam = camAt(32.49);
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    knockout(ctx, (c) => { c.rect(r.x, r.y, r.w, r.h); });
    ctx.translate(r.x, r.y);
    ctx.scale(r.w / W, r.h / H);
    applyCam(ctx, cam);
    drawWorld(ctx, 32.49, cam.scale * (r.w / W));
    ctx.restore();
    const pin = pinPoint(t);
    over(ctx, PINK(1), (c) => { c.arc(pin.x, pin.y, 11, 0, Math.PI * 2); }, true);
    over(ctx, TEAL(1), (c) => { c.arc(pin.x + 3, pin.y + 4, 4, 0, Math.PI * 2); }, true);
    drawHand(ctx, t);
  }
  drawSubtitle(ctx, t, durs);
  if (t >= 32.5) drawTitle(ctx, t);
}

export function visibleText(t, durs) {
  const out = [];
  for (const v of VOICE) {
    const dur = durs[v.id] ?? 2.2;
    const hold = lineHold(v.text, dur);
    if (t >= v.t0 && t < v.t0 + hold) {
      const b = subtitleBox(v.id);
      out.push({ id: v.id, text: v.text, x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h });
    }
  }
  if (t >= 35.95 && t < 40) {
    out.push({ id: 'title', text: 'THE CROSSING', x0: 360, y0: 840, x1: 1560, y1: 980 });
  }
  return out;
}
