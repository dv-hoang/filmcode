// First Orange — Impasto Oil Painting demo film.
import { Impasto, hex } from './engine/impasto.js';
import {
  W, H, DUR, camAt, buildWorld, buildOrange, buildKnife, buildPeels,
  buildSecondFruit, buildTitleStrokes, makeUnderpainting, revealX, lightPost,
} from './scene.js';

const cv = document.getElementById('c');
const titleEl = document.getElementById('title');
const subEl = document.getElementById('sub');
const creditEl = document.getElementById('credit');

const E = new Impasto(cv, { W, H, ss: 2 });

const WORLD = buildWorld();
const ORANGE = buildOrange(960, 700);
const SECOND = buildSecondFruit();
const TITLE_PAINT = buildTitleStrokes();
const UNDER = makeUnderpainting(WORLD, ORANGE);
E.setUnderCanvas(UNDER);

const WORLD_B = E.batch(WORLD);
const ORANGE_B = E.batch(ORANGE);
const SECOND_B = E.batch(SECOND);
const TITLE_B = E.batch(TITLE_PAINT);

export const VO = [
  { id: 'v01', t0: 2.0, text: 'Before the sun, one colour waited.' },
  { id: 'v02', t0: 11.0, text: 'A knife found it.' },
  { id: 'v03', t0: 15.0, text: 'Skin broke.' },
  { id: 'v04', t0: 17.5, text: 'And the room remembered how to be warm.' },
  { id: 'v05', t0: 28.0, text: 'Breakfast.' },
];
export const VO_DUR = { v01: 2.082, v02: 1.039, v03: 0.905, v04: 1.948, v05: 0.81 };

function wrap(ctx, text, font, maxW) {
  ctx.font = font;
  const words = text.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function setSubtitles(t) {
  let shown = '';
  for (const v of VO) {
    const d = VO_DUR[v.id] || 2.5;
    if (t >= v.t0 && t < v.t0 + d + 0.15) { shown = v.text; break; }
  }
  if (shown) {
    subEl.textContent = shown;
    subEl.style.opacity = '1';
  } else {
    subEl.textContent = '';
    subEl.style.opacity = '0';
  }
}

function setTitles(t) {
  // opening quiet — no early title; end title at 32s
  if (t >= 32 && t < 40) {
    const a = Math.min(1, (t - 32) / 0.9) * (1 - Math.max(0, (t - 38) / 2));
    titleEl.style.opacity = String(a);
    titleEl.textContent = 'FIRST ORANGE';
  } else {
    titleEl.style.opacity = '0';
  }
  if (t >= 36) {
    creditEl.style.opacity = String(Math.min(1, (t - 36) / 0.8));
  } else {
    creditEl.style.opacity = '0';
  }
}

export function render(t) {
  const cam = camAt(t);
  const greyWorld = t < 17.5 ? 1 : 0;
  const rev = revealX(t);

  E.begin();
  E.under(E.texUnder);

  // world plate
  if (t < 17.5) {
    E.draw(WORLD_B, { cam, grey: 1, reveal: 1e6, run: 0.25, hgt: 1 });
  } else {
    // grey base then colour reveal wave
    E.draw(WORLD_B, { cam, grey: 1, reveal: 1e6, run: 0.25 });
    E.draw(WORLD_B, {
      cam, grey: 0, reveal: rev, revDur: 0.35, run: 0.25, hgt: 1.05,
    });
  }

  // orange always in colour (the one coloured thing)
  E.draw(ORANGE_B, { cam, grey: 0, reveal: 1e6, run: 0.1, hgt: 1.25 });

  // knife 11–18
  if (t >= 11 && t < 19) {
    const tipX = 1040 - (t - 11) * 18;
    const tipY = 680 + Math.sin((t - 11) * 3) * 6;
    E.drawNow(buildKnife(t, tipX, tipY), { cam, grey: 0, run: 0 });
  }

  // peels
  if (t >= 13.5) {
    const n = 1 + Math.floor((t - 13.5) / 1.2);
    E.drawNow(buildPeels(n, 13.5, t), { cam, grey: 0, appear: t, appDur: 0.35, run: 0.2 });
  }

  if (t >= 24.5) {
    E.draw(SECOND_B, { cam, grey: 0, appear: t, appDur: 1.2, run: 0.15 });
  }

  if (t >= 32) {
    E.draw(TITLE_B, { cam, grey: 0, appear: t, appDur: 1.0, run: 0.1 });
  }

  E.finish(lightPost(t));
  setSubtitles(t);
  setTitles(t);
}

window.render = render;
window.DUR = DUR;
window.EV = [
  { t: 11.0, type: 'knife' },
  { t: 13.5, type: 'peel' },
  { t: 14.7, type: 'peel' },
  { t: 15.9, type: 'peel' },
  { t: 17.5, type: 'reveal' },
  { t: 28.0, type: 'breakfast' },
  { t: 32.0, type: 'title' },
];
window.TEXTS = (t) => {
  const out = [];
  if (t >= 32 && t < 40) out.push({ id: 'title', text: 'FIRST ORANGE', x0: 400, y0: 140, x1: 1520, y1: 280 });
  return out;
};

(async () => {
  await Promise.all([
    document.fonts.load('italic 400 42px "Cormorant Garamond"'),
    document.fonts.load('500 92px "Cormorant Garamond"'),
  ]);
  // warm one frame
  render(0);
  window.READY = true;
})();

void hex;
void wrap;
