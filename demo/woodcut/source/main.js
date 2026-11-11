// One Ember — frame function of time.
import { Printer } from './engine/woodcut.js';
import {
  camAt, drawCuts, drawHeat, protectSkin, peelP, captionAlpha,
} from './scene.js';

const cv = document.getElementById('c');
const printer = new Printer(cv);

let TL = { dur: 38, cues: [], hits: [] };

function activeCue(t) {
  let found = null;
  for (const c of TL.cues) {
    if (t >= c.t0 && t < c.t1) found = c;
  }
  return found;
}

export function render(t) {
  const cam = camAt(t);
  const m = printer.mctx;
  const c = printer.cctx;

  printer.beginMask();
  printer.cam(m, cam);
  m.fillStyle = '#fff';
  drawCuts(m, t);

  printer.beginColour();
  printer.cam(c, cam);
  drawHeat(c, t);
  protectSkin(c, t);
  printer.clipColourToCuts();

  const peel = peelP(t);
  if (t < 2.15) {
    printer.present(true);
  } else if (peel >= 0 && peel < 1) {
    printer.peel(peel);
    printer.presentColourClipped(peel, 0.9);
    if (t >= 30.42 && t < 31.2) {
      printer.brayer((t - 30.42) / 0.78);
    }
    if (t >= 31.15 && t < 31.55) {
      const a = 0.28 * (1 - (t - 31.15) / 0.4);
      printer.ctx.fillStyle = `rgba(239,232,216,${a})`;
      printer.ctx.fillRect(printer.ML, printer.MT, printer.PW, printer.PH);
    }
  } else {
    printer.present(false);
    printer.presentColour(0.9);
  }

  const cue = activeCue(t);
  if (cue) {
    const size = cue.id === 'title' ? 54 : 42;
    const y = cue.id === 'title' ? 978 : 972;
    printer.letterpress(cue.text, captionAlpha(t, cue), size, y);
  }
}

function texts(t) {
  const out = [];
  for (const c of TL.cues) {
    if (t >= c.t0 && t < c.t1) {
      out.push({
        id: c.id,
        text: c.text,
        x0: 420,
        y0: c.id === 'title' ? 940 : 944,
        x1: 1500,
        y1: c.id === 'title' ? 1024 : 1010,
      });
    }
  }
  return out;
}

window.render = render;

const timeline = fetch('./timeline.json').then((r) => {
  if (!r.ok) throw new Error(`timeline.json ${r.status}`);
  return r.json();
});

Promise.all([
  timeline,
  document.fonts.load('500 42px "Cormorant Garamond"'),
  document.fonts.load('600 34px "Cormorant Garamond"'),
  document.fonts.load('500 54px "Cormorant Garamond"'),
]).then(([tl]) => {
  TL = tl;
  window.DUR = tl.dur;
  window.EV = tl.hits;
  window.TEXTS = texts;
  render(0);
  window.READY = true;
}).catch((err) => {
  console.error(err);
  throw err;
});
