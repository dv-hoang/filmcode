// One Lamp Across — a ferryman's lamp gutters mid-river, a hand behind the
// screen saves it, and a child's lantern answers.
import { clamp, lerp, seg, ss, back, vnoise, monotone } from '/core/lib.js';
import { buildSprites, blit } from './engine/sprites.js';
import { startGL } from './engine/composite.js';
import { drawOverlay, toScreen } from './engine/stage.js';
import { drawPuppet, BODY } from './engine/rig.js';

const W = 1920;
const H = 1080;
const FEET = 980;

const cueRes = await fetch(new URL('./cue.json', import.meta.url));
if (!cueRes.ok) throw new Error('cue.json failed to load');
const cue = await cueRes.json();
const T = cue.t;

await document.fonts.load("600 72px 'Cormorant Garamond'");
await document.fonts.ready;
if (!document.fonts.check("600 72px 'Cormorant Garamond'")) {
  throw new Error('Cormorant Garamond failed to load');
}

const spr = buildSprites();
const view = document.getElementById('c');
if (!view) throw new Error('canvas missing');
const vg = view.getContext('2d');
if (!vg) throw new Error('2d context missing');
const glCanvas = document.createElement('canvas');
glCanvas.width = 1920;
glCanvas.height = 1080;
const shade = startGL(glCanvas);
const trans = document.createElement('canvas');
trans.width = W;
trans.height = H;
const tg = trans.getContext('2d');
if (!tg) throw new Error('transmission context missing');

const ferryFn = monotone([
  [0, 520],
  [8.4, 590],
  [17.25, 1160],
  [26.25, 1240],
  [27.25, 1240],
  [33.2, 560],
  [36.9, -700],
  [39, -700],
]);
const childFn = monotone([
  [0, 1560],
  [27.25, 1560],
  [33.2, 780],
  [36.6, -480],
  [39, -480],
]);

const TITLE = { x: 680, y: 78, w: 560, h: 148 };
const TEST = new URLSearchParams(location.search).get('test');

function tremor(t, seed) {
  const tense = t >= T.gutter && t < T.catch + 0.15 ? 2.1 : 1;
  return {
    x: (vnoise(t * 1.6 + seed) - 0.5) * 6.4 * tense,
    y: (vnoise(t * 1.9 + seed + 4) - 0.5) * 4.2 * tense,
    r: (vnoise(t * 1.3 + seed + 8) - 0.5) * 0.02 * tense,
  };
}

function hemOf(fn, t, face) {
  const h = 1 / 24;
  const acc = (fn(t + h) - 2 * fn(t) + fn(t - h)) / (h * h);
  return clamp(-acc * face * 0.00042, -0.24, 0.24) + (vnoise(t * 2.3 + face * 5) - 0.5) * 0.05;
}

function poleBob(t) {
  if (t < T.poleStart || t > cue.poles[cue.poles.length - 1] + 0.4) return 0;
  const u = ((t - T.poleStart) % T.polePeriod) / T.polePeriod;
  return -8 * (1 - Math.cos(u * Math.PI * 2)) / 2;
}

function crouch(t) {
  if (t < T.gutter || t > T.catch + 0.55) return 0;
  return 16 * ss(seg(t, T.gutter, T.gutter + 0.65)) * (1 - ss(seg(t, T.catch, T.catch + 0.45)));
}

function hop(t) {
  if (t < T.turn || t > T.turn + 0.85) return 0;
  return -22 * Math.sin(seg(t, T.turn, T.turn + 0.85) * Math.PI);
}

function walkBob(t) {
  if (t < T.walk || t > 36.1) return 0;
  const u = ((t - T.walk) % 0.75) / 0.75;
  return 5 * Math.cos(u * Math.PI) ** 2;
}

function poleHand(t) {
  if (t >= T.poleStart && t <= cue.poles[cue.poles.length - 1] + 0.4) {
    const u = ((t - T.poleStart) % T.polePeriod) / T.polePeriod;
    if (u < 0.3) {
      const k = u / 0.3;
      return { x: lerp(70, 48, k), y: lerp(108, 72, k) };
    }
    if (u < 0.58) {
      const k = ss((u - 0.3) / 0.28);
      return { x: lerp(48, 86, k), y: lerp(72, 124, k) };
    }
    const k = (u - 0.58) / 0.42;
    return { x: lerp(86, 70, k), y: lerp(124, 108, k) };
  }
  if (t >= T.turn && t < 36.5) {
    const s = Math.sin((t - T.turn) * 5.2);
    return { x: 36 + s * 6, y: 96 };
  }
  return { x: 68, y: 104 };
}

function lampHand(t) {
  if (t >= T.gutter && t < T.catch) {
    const u = ss(seg(t, T.gutter, T.gutter + 0.85));
    return { x: lerp(-74, -58, u), y: lerp(78, 112, u) };
  }
  if (t >= T.catch && t < T.lamp2) {
    const u = ss(seg(t, T.catch, T.catch + 0.6));
    return { x: lerp(-58, -72, u), y: lerp(112, 64, u) };
  }
  if (t >= T.lamp2 && t < T.turn) return { x: -70, y: 62 };
  return { x: -74, y: 82 };
}

function childLamp(t) {
  if (t < T.lamp2) return { x: 62, y: 48 };
  if (t < T.lamp2 + 0.9) {
    const u = ss(seg(t, T.lamp2, T.lamp2 + 0.55));
    return { x: lerp(62, 50, u), y: lerp(48, 8, u) };
  }
  return { x: 46, y: 18 };
}

function headFerry(t) {
  if (t < T.gutter) return -0.04;
  if (t < T.catch) return lerp(-0.04, 0.3, ss(seg(t, T.gutter, T.gutter + 0.75)));
  if (t < T.catch + 1.15) return lerp(0.3, -0.22, ss(seg(t, T.catch, T.catch + 0.65)));
  return lerp(-0.22, -0.03, ss(seg(t, T.catch + 1.15, T.catch + 2)));
}

function headChild(t) {
  if (t < T.lamp2) return 0.12;
  if (t < T.lamp2 + 1) return lerp(0.12, -0.2, ss(seg(t, T.lamp2, T.lamp2 + 0.55)));
  return lerp(-0.2, 0, ss(seg(t, T.turn, T.turn + 0.9)));
}

function tiltFerry(t) {
  let a = 0.04;
  if (t >= T.poleStart && t <= 17.45) {
    const u = ((t - T.poleStart) % T.polePeriod) / T.polePeriod;
    a = 0.05 + 0.045 * Math.sin(u * Math.PI * 2);
  }
  if (t >= T.gutter && t < T.catch) a = lerp(0.05, 0.16, ss(seg(t, T.gutter, T.gutter + 0.6)));
  if (t >= T.catch && t < T.catch + 0.8) a = lerp(0.16, -0.03, ss(seg(t, T.catch, T.catch + 0.55)));
  return a;
}

function poseFerry(t) {
  const face = t < T.turn ? 1 : -1;
  return {
    waist: { x: ferryFn(t), y: FEET - BODY.foot + poleBob(t) + crouch(t) + hop(t) + (t >= T.walk ? walkBob(t) : 0) },
    face,
    sc: 1,
    tilt: tiltFerry(t),
    trem: tremor(t, 1.7),
    hem: hemOf(ferryFn, t, face),
    tasselRot: hemOf(ferryFn, t, face) * 1.6,
    headRot: headFerry(t),
    handF: poleHand(t),
    handB: lampHand(t),
    bendF: -1,
    bendB: 1,
    head: 'headA',
    torso: 'torsoA',
    robe: 'robeA',
    armU: 'armU',
    armF: 'armF',
    tassel: true,
    lampOff: { x: 0, y: 0 },
  };
}

function poseChild(t) {
  const face = -1;
  return {
    waist: { x: childFn(t), y: FEET - BODY.foot * 0.72 + (t >= T.walk ? walkBob(t + 0.2) * 0.7 : 0) },
    face,
    sc: 0.7,
    tilt: t < T.lamp2 ? 0.06 : -0.02,
    trem: tremor(t, 4.2),
    hem: hemOf(childFn, t, face),
    tasselRot: 0,
    headRot: headChild(t),
    handF: { x: 28, y: 78 },
    handB: childLamp(t),
    bendF: 1,
    bendB: -1,
    head: 'headB',
    torso: 'torsoB',
    robe: 'robeB',
    armU: 'armU',
    armF: 'armF',
    tassel: false,
    lampOff: { x: 0, y: 0 },
  };
}

function camera(t) {
  let x = 960;
  let y = 620;
  let z = 0.88;
  let mirror = 0;
  if (t < T.push[0]) {
    x = 960;
    y = 620;
    z = 0.88;
  } else if (t < T.push[1]) {
    const u = ss(seg(t, T.push[0], T.push[1]));
    z = lerp(0.88, 1.4, u);
    x = lerp(960, ferryFn(t) + 40, u);
    y = lerp(620, 800, u);
  } else if (t < T.follow[1]) {
    z = 1.4;
    x = ferryFn(t) + 30;
    y = 808;
  } else if (t < T.back[0]) {
    const u = ss(seg(t, T.gap[0], T.gap[0] + 0.85));
    z = lerp(1.4, 1.28, u);
    x = lerp(ferryFn(T.gap[0]) + 30, (ferryFn(t) + childFn(t)) * 0.5, u);
    y = 790;
  } else if (t < T.back[1]) {
    mirror = 1;
    z = 1.46;
    x = W - (ferryFn(t) - 8);
    y = 760;
  } else if (t < T.catch + 1.05) {
    const u = seg(t, T.catch, T.catch + 0.22);
    const s = seg(t, T.catch + 0.22, T.catch + 1);
    z = u < 1 ? lerp(1.36, 1.82, ss(Math.min(1, u))) : lerp(1.82, 1.36, ss(Math.min(1, s)));
    x = ferryFn(t) + 12;
    y = 790;
  } else if (t < T.pull[0]) {
    z = t < T.freeze[1] ? 1.34 : 1.28;
    x = (ferryFn(t) + childFn(t)) * 0.5;
    y = 800;
  } else {
    const u = ss(seg(t, T.pull[0], T.pull[1]));
    z = lerp(1.28, 0.82, u);
    x = lerp((ferryFn(T.pull[0]) + childFn(T.pull[0])) * 0.5, 960, u);
    y = lerp(800, 620, u);
  }
  const viewW = 1920 / z;
  const viewH = 1080 / z;
  if (viewW < W) x = clamp(x, viewW / 2, W - viewW / 2);
  if (viewH < H) y = clamp(y, viewH / 2, H - viewH / 2);
  return { x, y, z, mirror };
}

function inten1(t) {
  let s = 1;
  if (t >= T.gutter && t < T.catch) {
    const u = ss(Math.min(1, seg(t, T.gutter, T.gutter + 2.5)));
    const base = lerp(1, 0.28, u);
    const flick = 0.82 + 0.18 * Math.sin(t * 46);
    s = base * flick;
  } else if (t >= T.catch && t < T.catch + 0.85) {
    s = 0.18 + back(seg(t, T.catch, T.catch + 0.8));
  } else if (t >= T.catch + 0.85 && t < T.catch + 1.7) {
    s = lerp(1.08, 1, seg(t, T.catch + 0.85, T.catch + 1.7));
  }
  if (t > T.exitDim[0]) s *= lerp(1, 0.3, ss(seg(t, T.exitDim[0], T.exitDim[1])));
  return Math.max(0, s);
}

function inten2(t) {
  if (t < T.lamp2) return 0;
  let s = t < T.lamp2 + 0.85 ? back(seg(t, T.lamp2, T.lamp2 + 0.8)) : 1;
  if (t > T.exitDim[0]) s *= lerp(1, 0.3, ss(seg(t, T.exitDim[0], T.exitDim[1])));
  return Math.max(0, s);
}

function titleState(t) {
  const q = cue.title;
  if (t < q.in || t > q.out) return null;
  if (t < q.sharp0) {
    const u = ss(seg(t, q.in, q.sharp0));
    return { sc: lerp(1.32, 1, u), blur: lerp(7, 0, u), a: lerp(0.25, 1, u) };
  }
  if (t > q.sharp1) {
    const u = ss(seg(t, q.sharp1, q.out));
    return { sc: lerp(1, 1.18, u), blur: lerp(0, 8, u), a: lerp(1, 0, u) };
  }
  return { sc: 1, blur: 0, a: 1 };
}

function clearTrans() {
  tg.setTransform(1, 0, 0, 1, 0, 0);
  tg.globalAlpha = 1;
  tg.filter = 'none';
  tg.globalCompositeOperation = 'source-over';
  tg.fillStyle = '#fff';
  tg.fillRect(0, 0, W, H);
  tg.globalCompositeOperation = 'multiply';
}

function drawScenery(t) {
  blit(tg, spr.willow, 1860, 1040);
  blit(tg, spr.bank, 0, 880);
  blit(tg, spr.bank, 1180, 868);
  blit(tg, spr.reed, 140, 1010);
  blit(tg, spr.reed, 1860, 1000);
  const frame = ((Math.floor(t * 12) % 3) + 3) % 3;
  const lift = ss(seg(t, T.waterLift[0], T.waterLift[1]));
  tg.save();
  tg.globalAlpha = 1 - lift;
  if (lift > 0) tg.filter = `blur(${12 * lift}px)`;
  tg.drawImage(spr.water[frame].canvas, 420, 820 - 240 * lift);
  tg.restore();
  const bx = t < 31.15 ? ferryFn(t) : Math.max(ferryFn(t), 840);
  blit(tg, spr.boat, bx, 990);
}

function drawPole(hand, face, t) {
  const onLand = t > 31.2;
  const tip = { x: hand.x + face * (onLand ? 40 : 110), y: onLand ? hand.y + 160 : 1050 };
  const dx = tip.x - hand.x;
  const dy = tip.y - hand.y;
  const dist = Math.hypot(dx, dy) || 1;
  tg.save();
  tg.translate(hand.x, hand.y);
  tg.rotate(Math.atan2(dx, dy));
  tg.scale(1, dist / (spr.pole.h - spr.pole.ay));
  tg.drawImage(spr.pole.canvas, -spr.pole.ax, -spr.pole.ay);
  tg.restore();
}

function drawFlame(pt, inten, t, seed) {
  if (inten < 0.08) return;
  const ft = Math.floor(t * 12);
  const frame = ((ft % 3) + 3) % 3;
  const shaky = inten < 0.55 ? 18 : 8;
  tg.save();
  tg.translate(pt.x + (vnoise(ft * 0.2 + seed) - 0.5) * shaky, pt.y + (vnoise(ft * 0.2 + seed + 3) - 0.5) * 8);
  tg.rotate((vnoise(ft * 0.15 + seed + 1) - 0.5) * 0.3);
  const sc = 0.16 + Math.min(inten, 1.2) * 0.14;
  tg.scale(sc, sc);
  const flame = spr.flame[frame];
  tg.drawImage(flame.canvas, -flame.ax, -flame.ay);
  tg.restore();
}

function drawSmoke(pt, t) {
  tg.save();
  tg.globalAlpha = 0.75;
  for (let i = 0; i < 4; i++) {
    const ft = Math.floor(t * 12) / 12;
    const ox = (vnoise(ft * 1.4 + i * 2.2) - 0.5) * 50;
    const oy = -20 - i * 28 - vnoise(ft + i) * 16;
    blit(tg, spr.smoke, pt.x + ox, pt.y + oy);
  }
  tg.restore();
}

function drawTitle(t) {
  const st = titleState(t);
  if (!st) return null;
  const cx = TITLE.x + TITLE.w / 2;
  const cy = TITLE.y + TITLE.h / 2;
  tg.save();
  tg.translate(cx, cy);
  tg.scale(st.sc, st.sc);
  tg.globalAlpha = st.a;
  if (st.blur > 0.2) tg.filter = `blur(${st.blur}px)`;
  tg.drawImage(spr.title.canvas, -TITLE.w / 2, -TITLE.h / 2);
  tg.restore();
  return st;
}

function present(cam, lamps, exposure, haze, t, overlay) {
  shade(trans, cam, lamps, exposure, haze, t);
  vg.setTransform(1, 0, 0, 1, 0, 0);
  vg.globalAlpha = 1;
  vg.filter = 'none';
  vg.globalCompositeOperation = 'source-over';
  vg.drawImage(glCanvas, 0, 0);
  drawOverlay(vg, overlay);
}

function renderStory(t) {
  clearTrans();
  drawScenery(t);
  const child = poseChild(t);
  const ferry = poseFerry(t);
  const cPts = drawPuppet(tg, spr, child);
  const fPts = drawPuppet(tg, spr, ferry);
  drawPole(fPts.handF, ferry.face, t);
  const i1 = inten1(t);
  const i2 = inten2(t);
  drawFlame(fPts.lamp, i1, t, 1);
  drawFlame(cPts.lamp, i2, t, 2);
  if (t >= T.gutter && t < T.catch && i1 < 0.75) drawSmoke(fPts.lamp, t);
  const shown = drawTitle(t);
  const cam = camera(t);
  const n = 1 + (i2 > 0.08 ? 1 : 0);
  const exposure = 1.05 / Math.sqrt(n);
  const haze = t >= T.lamp2 && t < T.lamp2 + 1.05 ? 2.2 * Math.sin(seg(t, T.lamp2, T.lamp2 + 1.05) * Math.PI) : 0;
  const lamps = [
    { x: fPts.lamp.x, y: fPts.lamp.y, i: i1 },
    { x: cPts.lamp.x, y: cPts.lamp.y, i: i2 },
    { x: 0, y: 0, i: 0 },
    { x: 0, y: 0, i: 0 },
  ];
  present(cam, lamps, exposure, haze, t, {
    cam,
    W,
    H,
    t,
    cue,
    points: cam.mirror ? null : [fPts.neck, fPts.handF, fPts.handB, cPts.neck, cPts.handB],
    hand: cam.mirror ? fPts.lamp : null,
    title: shown ? TITLE : null,
  });
}

function renderModel() {
  clearTrans();
  drawScenery(12);
  const poses = [poseFerry(12), poseFerry(18.7), poseFerry(24.1)];
  poses[0].waist.x = 380;
  poses[1].waist.x = 960;
  poses[1].waist.y += 16;
  poses[2].waist.x = 1480;
  poses[2].face = 1;
  const lamps = [];
  for (const p of poses) {
    const pts = drawPuppet(tg, spr, p);
    drawFlame(pts.lamp, 1, 12, 1);
    lamps.push({ x: pts.lamp.x, y: pts.lamp.y, i: 1 });
  }
  const child = poseChild(8);
  child.waist.x = 700;
  const cPts = drawPuppet(tg, spr, child);
  lamps.push({ x: cPts.lamp.x, y: cPts.lamp.y, i: 0.2 });
  while (lamps.length < 4) lamps.push({ x: 0, y: 0, i: 0 });
  const cam = { x: 960, y: 620, z: 0.82, mirror: 0 };
  present(cam, lamps, 1.15, 0, 0, { cam, W, H, t: 0, cue, points: null, hand: null, title: null });
}

function render(t) {
  if (TEST === 'model') renderModel();
  else renderStory(t);
}

function buildEvents() {
  const ev = [
    { t: 0.06, type: 'foley', id: 'clapper' },
    { t: cue.title.in, type: 'foley', id: 'tap' },
    { t: cue.title.in + 0.08, type: 'foley', id: 'flap' },
    { t: T.silence[0][0] + 0.05, type: 'foley', id: 'sizzle' },
    { t: T.catch, type: 'foley', id: 'fwoomp' },
    { t: T.lamp2 - 0.2, type: 'foley', id: 'sizzle' },
    { t: T.lamp2, type: 'foley', id: 'fwoomp' },
    { t: T.waterLift[0] - 0.12, type: 'foley', id: 'flap' },
    { t: 36.9, type: 'foley', id: 'flap' },
    { t: T.catch, type: 'hit', id: 'catch' },
    { t: T.lamp2, type: 'hit', id: 'lamp2' },
    { t: T.gongEnd, type: 'hit', id: 'gongEnd' },
  ];
  for (const t of cue.poles) ev.push({ t, type: 'foley', id: 'pole' });
  for (const t of cue.steps) ev.push({ t, type: 'foley', id: 'step' });
  for (const v of cue.voices) ev.push({ t: v.t, type: 'voice', id: v.id });
  ev.sort((a, b) => a.t - b.t);
  return ev;
}

window.DUR = cue.dur;
window.EV = buildEvents();
window.TEXTS = (t) => {
  const q = cue.title;
  if (t < q.sharp0 || t > q.sharp1) return [];
  const cam = camera(t);
  const a = toScreen(TITLE.x, TITLE.y, cam, W);
  const b = toScreen(TITLE.x + TITLE.w, TITLE.y + TITLE.h, cam, W);
  const box = {
    id: 'title',
    text: q.text,
    x0: Math.min(a[0], b[0]),
    y0: Math.min(a[1], b[1]),
    x1: Math.max(a[0], b[0]),
    y1: Math.max(a[1], b[1]),
  };
  if (box.x0 < 1 || box.y0 < 1 || box.x1 > 1919 || box.y1 > 1079) return [];
  return [box];
};
window.render = render;
window.READY = true;
