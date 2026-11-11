import { createPrinter } from './riso.js';
import { drawPlates, printState, visibleText } from './scene.js';
import { DUR, HIT } from './timeline.js';

const cv = document.getElementById('c');
const printer = createPrinter(cv);
const plate = document.createElement('canvas');
plate.width = 1920;
plate.height = 1080;
const ctx = plate.getContext('2d', { alpha: false });
if (!ctx) throw new Error('2D plate canvas is unavailable');

let durs = { v01: 2.4, v02: 2.3, v03: 2.2, v04: 2.4, v05: 2.5, v06: 0.55 };

function render(t) {
  drawPlates(ctx, t, durs);
  printer.print(plate, printState(t));
}

window.render = render;
window.DUR = DUR;
window.EV = [
  { t: HIT.feed, type: 'feed' },
  { t: HIT.silence1, type: 'silence' },
  { t: HIT.motorMail, type: 'motor' },
  { t: HIT.pink, type: 'chunk' },
  { t: HIT.buoy, type: 'buoy' },
  { t: HIT.cross, type: 'cross' },
  { t: HIT.sheet, type: 'sheet' },
  { t: HIT.land, type: 'land' },
  { t: HIT.pin, type: 'pin' },
  { t: HIT.title, type: 'title' },
];
window.TEXTS = (t) => visibleText(t, durs);

const faces = Promise.all([
  document.fonts.load('700 76px "Cormorant Garamond"'),
  document.fonts.load('600 44px "Cormorant Garamond"'),
]);
const measured = fetch('tts/voices/dur.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));

Promise.all([faces, measured]).then(([, got]) => {
  durs = { ...durs, ...got };
  window.READY = true;
}).catch((err) => {
  console.error(err);
  throw err;
});
