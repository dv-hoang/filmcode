// Still Lit — frame, handwriting, subtitles.
import { bakePaper, makeTooth, handwrite } from './engine.js';
import {
  PW, PH, DUR, camAt, drawWorld, subtitleAt, textsAt, events,
} from './scene.js';

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
if (!ctx) throw new Error('canvas 2d unavailable');

const paper = bakePaper(PW, PH);
const tooth = makeTooth();

function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#e3d6c4';
  ctx.fillRect(0, 0, 1920, 1080);
  const cam = camAt(t);
  ctx.setTransform(cam.z, 0, 0, cam.z, 960 - cam.x * cam.z, 540 - cam.y * cam.z);
  drawWorld(ctx, t, paper, tooth);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sub = subtitleAt(t);
  if (sub) handwrite(ctx, sub.text, 168, 1004, 44, sub.p);
}

window.render = render;
window.DUR = DUR;
window.EV = events();
window.TEXTS = (t) => textsAt(ctx, t);

document.fonts.load('560 54px Caveat').then(() => {
  if (!document.fonts.check('20px Caveat')) throw new Error('Caveat font failed to load');
  window.READY = true;
}).catch((err) => {
  console.error(err);
  throw err;
});
