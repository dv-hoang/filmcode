import { DUR, makeEvents, renderFrame, textsAt } from './scene.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });

window.DUR = DUR;
window.EV = makeEvents();
window.TEXTS = (t) => textsAt(ctx, t);
window.render = (t) => renderFrame(ctx, t);
window.READY = false;

document.fonts.ready.then(() => {
  window.READY = true;
});
