// Written-on subtitles (Caveat) and a monoline script title (Sacramento).
import { clamp } from '/core/lib.js';

const INK = 'rgba(29,26,23,0.84)';
const PAPER = 'rgba(244,239,228,0.94)';

function needSeconds(text) {
  let n = 0;
  for (const ch of text) if (!/\s/.test(ch)) n++;
  return Math.max(1.8, n / 15 + 1.5);
}

export function lineWindow(line, dur) {
  const write0 = line.t - 0.22;
  const type = 0.2 + 0.017 * line.text.length;
  const speechEnd = line.t + dur;
  const read = needSeconds(line.text);
  const holdEnd = Math.max(speechEnd + 0.6, write0 + type + read, write0 + 1.8);
  return { write0, type, holdEnd, fadeEnd: holdEnd + 0.45, text: line.text, id: line.id };
}

export function titleWindow(t0, durEnd) {
  const text = 'The Mend';
  const type = 1.45;
  return { write0: t0, type, holdEnd: durEnd, fadeEnd: durEnd, text, id: 'title' };
}

function shownCount(win, t) {
  if (t < win.write0) return 0;
  const u = clamp((t - win.write0) / win.type);
  return Math.max(1, Math.round(u * win.text.length));
}

function alpha(win, t) {
  if (t < win.write0 || t > win.fadeEnd) return 0;
  if (t < win.holdEnd) return 1;
  return clamp(1 - (t - win.holdEnd) / Math.max(0.05, win.fadeEnd - win.holdEnd));
}

function haloText(ctx, text, x, y, fill) {
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineWidth = 16;
  ctx.strokeStyle = PAPER;
  ctx.strokeText(text, x, y);
  ctx.lineWidth = 8;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

export function drawSubtitles(ctx, wins, t) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const win of wins) {
    const a = alpha(win, t);
    if (a <= 0) continue;
    const n = shownCount(win, t);
    const slice = win.text.slice(0, n);
    ctx.globalAlpha = a;
    ctx.font = '500 46px Caveat, cursive';
    haloText(ctx, slice, 960, 980, INK);
  }
  ctx.restore();
}

export function drawTitle(ctx, win, t) {
  const a = alpha(win, t);
  if (a <= 0) return;
  const n = shownCount(win, t);
  const slice = win.text.slice(0, n);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '400 84px Sacramento, cursive';
  haloText(ctx, slice, 960, 168, 'rgba(29,26,23,0.92)');
  ctx.restore();
}

export function textBoxes(ctx, wins, title, t) {
  const out = [];
  ctx.save();
  ctx.font = '500 46px Caveat, cursive';
  for (const win of wins) {
    if (alpha(win, t) <= 0.02) continue;
    const w = ctx.measureText(win.text).width;
    out.push({
      id: win.id,
      text: win.text,
      x0: 960 - w / 2 - 12,
      y0: 980 - 58,
      x1: 960 + w / 2 + 12,
      y1: 992,
    });
  }
  if (title && alpha(title, t) > 0.02) {
    ctx.font = '400 84px Sacramento, cursive';
    const w = ctx.measureText(title.text).width;
    out.push({
      id: 'title',
      text: title.text,
      x0: 960 - w / 2 - 16,
      y0: 78,
      x1: 960 + w / 2 + 16,
      y1: 184,
    });
  }
  ctx.restore();
  return out;
}
