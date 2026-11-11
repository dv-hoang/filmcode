// Heat Leaves — picture, camera, voice cues, and sound events.
import { eio, lerp } from '/core/lib.js';
import { bakeStroke } from './chalk.js';
import { layoutWord, polyStroke } from './letters.js';

export const DUR = 39;

const WHITE = '#f3efe2';
const ORANGE = '#e07a32';
const YELLOW = '#e6d07a';

const CLOSE = { cx: 1680, cy: 820, s: 1.05 };
const MED = { cx: 1680, cy: 740, s: 0.62 };
const RIGHT_A = { cx: 4680, cy: 720, s: 0.64 };
const RIGHT_B = { cx: 5280, cy: 720, s: 0.64 };
const WIDE = { cx: 3100, cy: 860, s: 0.218 };

function mixCam(a, b, u) {
  return { cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), s: lerp(a.s, b.s, u) };
}

function whipEase(u) {
  if (u < 0.82) {
    const x = u / 0.82;
    return 1.045 * (1 - (1 - x) ** 3);
  }
  return 1.045 - 0.045 * ((u - 0.82) / 0.18);
}

export function camAt(t) {
  if (t < 3) return { ...CLOSE, shot: 0, blur: 0, shotT0: 0 };
  if (t < 5) return { ...mixCam(CLOSE, MED, eio((t - 3) / 2)), shot: 1, blur: 0, shotT0: 3 };
  if (t < 20.85) return { ...MED, shot: 2, blur: 0, shotT0: 5 };
  if (t < 21.3) {
    const u = (t - 20.85) / 0.45;
    return { ...mixCam(MED, RIGHT_A, whipEase(u)), shot: 3, blur: 1, shotT0: 20.85 };
  }
  if (t < 30.4) {
    const u = eio(Math.min(1, Math.max(0, (t - 24.2) / 5.8)));
    return { ...mixCam(RIGHT_A, RIGHT_B, u), shot: 4, blur: 0, shotT0: 21.3 };
  }
  if (t < 34) return { ...mixCam(RIGHT_B, WIDE, eio((t - 30.4) / 3.6)), shot: 5, blur: 0, shotT0: 30.4 };
  return { ...WIDE, shot: 6, blur: 0, shotT0: 34 };
}

function bowLine(x0, y0, x1, y1, amp) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts = [];
  const n = Math.max(8, Math.round(len / 80));
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const o = Math.sin(Math.PI * u) * amp;
    pts.push([x0 + dx * u + nx * o, y0 + dy * u + ny * o]);
  }
  return pts;
}

function arrowStrokes(x0, y0, x1, y1, width) {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const head = Math.max(54, width * 4.2);
  const a1 = ang + 2.55;
  const a2 = ang - 2.55;
  return [
    polyStroke(bowLine(x0, y0, x1, y1, 8), width, 'stem'),
    polyStroke(bowLine(x1, y1, x1 + Math.cos(a1) * head, y1 + Math.sin(a1) * head, 2), width * 0.92, 'taper'),
    polyStroke(bowLine(x1, y1, x1 + Math.cos(a2) * head, y1 + Math.sin(a2) * head, 2), width * 0.92, 'taper'),
  ];
}

function windowStrokes(x, y, w, h, width) {
  const lines = [
    [[x, y + 8], [x + w, y]],
    [[x + w, y], [x + w + 8, y + h]],
    [[x + w, y + h], [x + 6, y + h + 8]],
    [[x + 4, y + h], [x, y + 10]],
    [[x + w * 0.5, y + 12], [x + w * 0.5 + 6, y + h - 10]],
    [[x + 14, y + h * 0.48], [x + w - 12, y + h * 0.48 - 8]],
  ];
  return lines.map(([a, b]) => polyStroke(bowLine(a[0], a[1], b[0], b[1], 7), width, 'stem'));
}

function schedule(samplesList, t0, draw, air, extra) {
  const out = [];
  let t = t0;
  for (const samples of samplesList) {
    const stroke = {
      samples,
      t0: t,
      t1: t + draw,
      ...extra,
    };
    stroke.full = bakeStroke(samples, extra.color);
    if (!stroke.full) throw new Error('chalk bake failed');
    out.push(stroke);
    t += draw + air;
  }
  return { strokes: out, end: t };
}

function wordRun(word, cx, baseline, h, t0, draw, air, extra) {
  const laid = layoutWord(word, cx, baseline, h, extra);
  const run = schedule(laid.strokes.map((s) => s.samples), t0, draw, air, extra);
  return { ...run, box: laid.box, text: word };
}

export const WIPE = {
  t0: 7.95,
  t1: 10.05,
  r: 340,
  // One continuous pass: across the arrow, back through COLD, across COMES IN.
  path: [[980, 390], [2360, 410], [2280, 840], [1020, 880], [1100, 1260], [2420, 1340]],
};

const built = build();

function build() {
  const strokes = [];
  const words = [];

  const cold = wordRun('COLD', 1680, 1040, 400, 0.48, 0.24, 0.06, { color: WHITE, wipe: true, hand: 'teacher', seed: 3 });
  strokes.push(...cold.strokes);
  words.push({ id: 'cold', text: 'COLD', t0: 0.48, t1: WIPE.t0, box: cold.box });

  const winL = schedule(windowStrokes(1280, 28, 780, 230, 16), 3.15, 0.16, 0.04, { color: WHITE, wipe: false, hand: 'teacher' });
  strokes.push(...winL.strokes);

  const comes = wordRun('COMES IN', 1680, 1340, 188, 5.2, 0.1, 0.025, {
    color: YELLOW, wipe: true, hand: 'pupil', wobble: 3.2, seed: 11,
  });
  strokes.push(...comes.strokes);
  words.push({ id: 'comes', text: 'COMES IN', t0: 5.2, t1: WIPE.t0, box: comes.box });

  const inArrow = schedule(arrowStrokes(2140, 470, 1760, 300, 15), 7.05, 0.16, 0.04, {
    color: YELLOW, wipe: true, hand: 'pupil',
  });
  strokes.push(...inArrow.strokes);

  const heat = wordRun('HEAT', 1680, 1040, 400, 13.5, 0.075, 0.02, { color: WHITE, wipe: false, hand: 'teacher', seed: 5 });
  strokes.push(...heat.strokes);
  words.push({ id: 'heat', text: 'HEAT', t0: 13.5, t1: 20.8, box: heat.box });

  const leaves = wordRun('LEAVES', 1680, 1340, 188, 14.7, 0.085, 0.02, { color: WHITE, wipe: false, hand: 'teacher', seed: 8 });
  strokes.push(...leaves.strokes);
  words.push({ id: 'leaves', text: 'LEAVES', t0: 14.55, t1: 20.8, box: leaves.box });

  const outArrows = [
    ...arrowStrokes(1460, 90, 2080, 70, 15),
    ...arrowStrokes(1440, 155, 2140, 160, 15),
    ...arrowStrokes(1480, 215, 2060, 230, 15),
  ];
  const arrowsL = schedule(outArrows, 16.25, 0.11, 0.025, { color: ORANGE, wipe: false, hand: 'accent' });
  strokes.push(...arrowsL.strokes);

  const seamA = schedule(
    [polyStroke(bowLine(2060, 150, 3200, 230, 16), 16, 'stem')],
    17.35, 1.15, 0, { color: ORANGE, wipe: false, hand: 'accent' },
  );
  strokes.push(...seamA.strokes);

  const winR = schedule(windowStrokes(4240, 180, 980, 400, 18), 21.35, 0.16, 0.035, { color: WHITE, wipe: false, hand: 'teacher' });
  strokes.push(...winR.strokes);

  const seamB = schedule(
    [polyStroke(bowLine(3200, 230, 4300, 360, 14), 16, 'stem')],
    21.4, 0.95, 0, { color: ORANGE, wipe: false, hand: 'accent' },
  );
  strokes.push(...seamB.strokes);

  const out = wordRun('OUT', 4760, 1120, 230, 22.55, 0.18, 0.04, { color: WHITE, wipe: false, hand: 'teacher', seed: 9 });
  strokes.push(...out.strokes);
  words.push({ id: 'out', text: 'OUT', t0: 22.55, t1: 30.35, box: out.box });

  const arrowsR = [
    ...arrowStrokes(4520, 280, 5280, 250, 16),
    ...arrowStrokes(4500, 390, 5340, 400, 16),
    ...arrowStrokes(4540, 500, 5220, 530, 16),
  ];
  const arrowsRun = schedule(arrowsR, 23.55, 0.11, 0.025, { color: ORANGE, wipe: false, hand: 'accent' });
  strokes.push(...arrowsRun.strokes);

  return { strokes, words };
}

export const STROKES = built.strokes;
export const WORDS = built.words;

export const VO = [
  { id: 'v01', t0: 0.75, dur: 1.845, text: 'Everyone writes the same mistake.' },
  { id: 'v02', t0: 5.15, dur: 1.42, text: 'Cold comes in, they say.' },
  { id: 'v03', t0: 7.25, dur: 0.662, text: 'Watch.' },
  { id: 'v04', t0: 11.5, dur: 1.39, text: 'Cold does not travel.' },
  { id: 'v05', t0: 13.58, dur: 1.431, text: 'Heat does. It leaves.' },
  { id: 'v06', t0: 22.4, dur: 1.932, text: 'Through the glass, warmth goes out.' },
  { id: 'v07', t0: 31.2, dur: 1.144, text: 'That is the lesson.' },
];

function cueEnd(v, next) {
  const hold = Math.max(v.dur + 0.6, 1.8);
  const t1 = v.t0 + hold;
  return next ? Math.min(t1, next.t0) : t1;
}

export const SUBS = VO.map((v, i) => ({
  id: v.id,
  t0: v.t0,
  t1: cueEnd(v, VO[i + 1]),
  text: v.text,
}));

function panFor(stroke) {
  const s = stroke.samples;
  const x = s[Math.floor(s.length / 2)].x;
  return Math.max(-0.8, Math.min(0.8, (x - 3200) / 3400));
}

export const EV = [
  { t: 0.08, type: 'bell' },
  { t: WIPE.t0 - 0.16, type: 'wipe', d: WIPE.t1 - WIPE.t0 + 0.16 },
  { t: 20.85, type: 'whip', d: 0.45 },
  { t: 21.28, type: 'knock' },
  { t: 34.15, type: 'tick' },
  { t: 36.45, type: 'bell' },
  ...SUBS.map((s) => ({ t: s.t0, type: 'sub', t1: s.t1, text: s.text })),
  ...VO.map((v) => ({ t: v.t0, type: 'vo', id: v.id })),
  ...STROKES.map((s) => ({
    t: s.t0,
    type: 'chalk',
    d: Math.max(0.06, s.t1 - s.t0),
    len: s.samples.length,
    hand: s.hand,
    pan: panFor(s),
    big: s.samples.some((p) => p.w > 28),
  })),
];
