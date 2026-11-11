// Composition keys, nib follow (lag and anticipation), soft clamp.
import { clamp, monotone } from '/core/lib.js';
import { sample } from './geom.js';

export const W = 1920;
export const H = 1080;

export function worldToScreen(x, y, cam) {
  const c = Math.cos(cam.roll);
  const s = Math.sin(cam.roll);
  const dx = x - cam.x;
  const dy = y - cam.y;
  return [
    W / 2 + cam.zoom * (c * dx - s * dy),
    H / 2 + cam.zoom * (s * dx + c * dy),
  ];
}

export function applyCam(ctx, cam) {
  const c = Math.cos(cam.roll);
  const s = Math.sin(cam.roll);
  const z = cam.zoom;
  ctx.setTransform(
    z * c, z * s,
    -z * s, z * c,
    W / 2 - z * (c * cam.x - s * cam.y),
    H / 2 - z * (s * cam.x + c * cam.y),
  );
}

function followPoint(path, t) {
  let x = 0;
  let y = 0;
  let w = 0;
  for (let dt = -0.55; dt <= 0.4 + 1e-6; dt += 0.05) {
    const p = sample(path, t + dt);
    const ahead = dt >= 0 ? 1.2 : 0.82;
    const wgt = ahead * (1 - Math.abs(dt) / 0.7);
    if (wgt <= 0) continue;
    x += p.x * wgt;
    y += p.y * wgt;
    w += wgt;
  }
  return [x / w, y / w];
}

function clampNib(cam, nib) {
  const [sx, sy] = worldToScreen(nib.x, nib.y, cam);
  const x0 = W * 0.15;
  const x1 = W * 0.85;
  const y0 = H * 0.2;
  const y1 = H * 0.8;
  const ex = sx < x0 ? sx - x0 : sx > x1 ? sx - x1 : 0;
  const ey = sy < y0 ? sy - y0 : sy > y1 ? sy - y1 : 0;
  if (ex === 0 && ey === 0) return;
  const c = Math.cos(cam.roll);
  const s = Math.sin(cam.roll);
  const z = cam.zoom;
  const f = clamp(cam.follow, 0, 1);
  cam.x += f * (ex * c + ey * s) / z;
  cam.y += f * (-ex * s + ey * c) / z;
}

export function makeCamera(keys) {
  const z = monotone(keys.map((k) => [k.t, k.zoom]));
  const roll = monotone(keys.map((k) => [k.t, k.roll]));
  const follow = monotone(keys.map((k) => [k.t, k.follow]));
  const ax = monotone(keys.map((k) => [k.t, k.ax]));
  const ay = monotone(keys.map((k) => [k.t, k.ay]));
  return (path, t) => {
    const nib = sample(path, t);
    const f = clamp(follow(t), 0, 1);
    const [fx, fy] = followPoint(path, t);
    const cam = {
      x: ax(t) * (1 - f) + fx * f,
      y: ay(t) * (1 - f) + fy * f,
      zoom: Math.max(0.2, z(t)),
      roll: roll(t),
      follow: f,
    };
    clampNib(cam, nib);
    return cam;
  };
}
