// The Mend — render(t) is the whole frame. Deterministic; no frame-to-frame state.
import { sample } from './engine/geom.js';
import { makeCamera, worldToScreen } from './engine/cam.js';
import { preparePaper, drawPaper, drawTooth, PAPER } from './engine/paper.js';
import { drawInk } from './engine/ink.js';
import { drawHands } from './engine/hands.js';
import { lineWindow, titleWindow, drawSubtitles, drawTitle, textBoxes } from './engine/subs.js';
import { buildFilm, DUR, LINES, TITLE_AT } from './scene.js';

const q = new URLSearchParams(location.search);
const ALL = q.get('all') === '1';
const NOPEN = q.get('nopen') === '1';
const NOSUB = q.get('nosub') === '1';
const CAM_Q = q.get('cam');

const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { alpha: false });

const film = buildFilm();
const camera = makeCamera(film.camKeys);

const FALLBACK_DUR = { v01: 2.45, v02: 2.55, v03: 2.15, v04: 2.7 };

function penSamples() {
  const out = [];
  for (let t = 0; t <= DUR + 1e-6; t += 0.02) {
    const p = sample(film.path, t);
    const cam = camera(film.path, t);
    const [sx] = worldToScreen(p.x, p.y, cam);
    out.push({
      t: +t.toFixed(3),
      v: +Math.max(0, p.v).toFixed(1),
      pan: +Math.max(-1, Math.min(1, (sx / 1920) * 2 - 1)).toFixed(3),
      dry: p.gap ? 1 : 0,
      young: p.young ? 1 : 0,
    });
  }
  return out;
}

let wins = LINES.map((ln) => lineWindow(ln, FALLBACK_DUR[ln.id]));
let title = titleWindow(TITLE_AT, DUR);

function events() {
  return [
    { t: 14, type: 'blot' },
    { t: 16, type: 'rub' },
    { t: 14, type: 'silence', t1: 16 },
    ...wins.map((w) => ({ type: 'sub', id: w.id, t0: +w.write0.toFixed(3), t1: +w.fadeEnd.toFixed(3), text: w.text })),
    { type: 'title', t0: title.write0, t1: DUR, text: title.text },
    { type: 'pen', step: 0.02, samples: penSamples() },
  ];
}

window.DUR = DUR;
window.EV = events();

function camAt(t) {
  if (CAM_Q) {
    const [x, y, z] = CAM_Q.split(',').map(Number);
    return { x, y, zoom: z, roll: 0, follow: 0 };
  }
  return camera(film.path, t);
}

function render(t) {
  const drawT = ALL ? DUR : t;
  const cam = camAt(drawT);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, 1920, 1080);
  drawPaper(ctx, cam);
  drawInk(ctx, film.path, drawT, cam, film.hold);
  drawTooth(ctx, cam);
  if (!NOPEN) {
    const nib = sample(film.path, drawT);
    drawHands(ctx, nib, cam, drawT, film.hold);
  }
  if (!NOSUB && !ALL) {
    drawSubtitles(ctx, wins, t);
    drawTitle(ctx, title, t);
  }
}

window.render = render;
window.TEXTS = (t) => (NOSUB || ALL ? [] : textBoxes(ctx, wins, title, t));

async function loadDurations() {
  try {
    const res = await fetch('tts/voices/dur.json');
    if (!res.ok) return;
    const dur = await res.json();
    wins = LINES.map((ln) => lineWindow(ln, Number(dur[ln.id]) || FALLBACK_DUR[ln.id]));
    const last = wins[wins.length - 1];
    const titleT = Math.max(TITLE_AT, last.fadeEnd + 0.35);
    title = titleWindow(Math.min(titleT, 35.2), DUR);
    window.EV = events();
  } catch (err) {
    console.warn('voice durations unavailable', err);
  }
}

await Promise.all([
  document.fonts.load('500 46px Caveat'),
  document.fonts.load('400 84px Sacramento'),
  loadDurations(),
]);
preparePaper();
window.READY = true;
