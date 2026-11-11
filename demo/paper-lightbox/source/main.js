// First Bloom — one paper potting-shed lamp, from a moon-hole to the table.
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { lerp, seg, ss, track } from '/core/lib.js';
import { pulpTexture, makeSheet, makeBurst, makePool } from './engine/paper.js';
import { drawWorld, drawFlower, drawTitle, addRoom, FLOWER_M } from './world.js';

const W = 1920;
const H = 1080;
const subEl = document.getElementById('sub');
const subText = document.getElementById('subtext');

const TL = await fetch('./timeline.json').then((r) => {
  if (!r.ok) throw new Error('timeline.json ' + r.status);
  return r.json();
});
try {
  const r = await fetch('./tts/voices/dur.json');
  if (r.ok) {
    const d = await r.json();
    for (const v of TL.voice) if (typeof d[v.id] === 'number') v.dur = d[v.id];
  }
} catch (err) {
  console.warn('dur.json unavailable', err);
}

const HIT = TL.hit;
const DUR = TL.dur;

await Promise.all([
  document.fonts.load('500 132px "Cormorant Garamond"'),
  document.fonts.load('italic 400 38px "Cormorant Garamond"'),
]);

const drawn = drawWorld();
const flowerCanvas = drawFlower();
const titleCanvas = drawTitle();
const pulp = pulpTexture();

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.setClearColor(0x100e0c, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#100e0c');
const camera = new THREE.PerspectiveCamera(26, W / H, 0.02, 6);

const { spot, topY } = addRoom(scene, THREE);

const specs = [
  { key: 'sky', map: drawn.sky, glow: drawn.skyGlow, z: -0.140, trans: 0.90, on: 0.0 },
  { key: 'glass', map: drawn.glass, glow: drawn.glassGlow, z: -0.116, trans: 0.72, on: 0.40 },
  { key: 'leaves', map: drawn.leaves, glow: null, z: -0.094, trans: 0.52, on: 0.80 },
  { key: 'shelf', map: drawn.shelf, glow: null, z: -0.072, trans: 0.34, on: 1.20 },
  { key: 'near', map: drawn.near, glow: null, z: -0.034, trans: 0.12, on: 1.60 },
  { key: 'front', map: drawn.front, glow: null, z: -0.012, trans: 0.16, on: 2.00 },
];

const sheets = specs.map((s) => {
  const sheet = makeSheet({
    map: s.map, glow: s.glow, pulp, z: s.z, trans: s.trans,
    recv: s.key !== 'front',
  });
  sheet.key = s.key;
  sheet.on = HIT.strike + s.on;
  sheet.baseY = 0;
  scene.add(sheet.mesh);
  return sheet;
});

const byKey = Object.fromEntries(sheets.map((s) => [s.key, s]));
const occOf = { sky: 'glass', glass: 'leaves', leaves: 'shelf', shelf: 'near', near: 'front' };
for (const [back, front] of Object.entries(occOf)) {
  byKey[back].uniforms.uOcc.value = byKey[front].uniforms.uMap.value;
}

const flower = makeSheet({
  map: flowerCanvas, glow: flowerCanvas, pulp,
  w: FLOWER_M, h: FLOWER_M, x: 0.02, y: 0.02, z: -0.052,
  trans: 0.1, recv: false,
});
flower.uniforms.uRevealAxis.value = 2;
flower.uniforms.uReveal.value = 0;
flower.baseY = 0.02;
scene.add(flower.mesh);

const title = makeSheet({
  map: titleCanvas, glow: titleCanvas, pulp,
  w: 0.28, h: 0.055, x: 0, y: -0.128, z: -0.004,
  trans: 0.9, recv: false, shadow: false,
});
title.uniforms.uRevealAxis.value = 1;
title.uniforms.uReveal.value = 0;
title.baseY = -0.128;
scene.add(title.mesh);

const burst = makeBurst();
scene.add(burst.mesh);
const pool = makePool();
pool.mesh.position.y = topY + 0.001;
pool.mesh.position.z = 0.36;
pool.mesh.position.x = 0.0;
scene.add(pool.mesh);

const post = makePost(renderer, scene, camera, W, H, { ssaa: 2, ao: false });
canvas.style.width = W + 'px';
canvas.style.height = H + 'px';

const camPos = track([
  [0, [0.0, 0.02, 0.30]],
  [5, [0.0, 0.016, 0.252]],
  [9, [-0.01, 0.012, 0.248]],
  [17, [0.012, -0.002, 0.228]],
  [22, [0.02, -0.004, 0.178]],
  [26, [0.006, 0.0, 0.24]],
  [32, [0.0, 0.02, 0.52]],
  [34.2, [0.0, 0.04, 1.08]],
  [39, [0.0, 0.045, 1.18]],
]);
const camLook = track([
  [0, [0.0, 0.075, -0.10]],
  [9, [0.0, 0.05, -0.09]],
  [17, [0.012, 0.004, -0.06]],
  [22, [0.02, 0.01, -0.05]],
  [26, [0.008, 0.0, -0.06]],
  [32, [0.0, -0.02, -0.02]],
  [39, [0.0, -0.06, 0.02]],
]);

const focusPt = new THREE.Vector3();
const titleBox = new THREE.Box3();
const corner = new THREE.Vector3();

function layerLit(t, on) {
  const base = 0.1;
  if (t <= on) return base;
  return base + (1 - base) * ss(seg(t, on, on + 0.42));
}

function lightState(t) {
  const k = ss(seg(t, HIT.strike, HIT.strike + 1.8));
  return {
    x: lerp(0.06, 0.0, k),
    y: lerp(-0.012, 0.03, k),
    r: lerp(0.045, 0.22, k),
  };
}

function burstAmt(t) {
  const d = t - HIT.strike;
  if (d < -0.04 || d > 1.15) return 0;
  return Math.exp(-((d - 0.02) ** 2) / 0.01) + 0.22 * Math.exp(-((d - 0.18) ** 2) / 0.06);
}

function focusZ(t) {
  if (t < 9) return -0.14;
  if (t < 17) return lerp(-0.116, -0.072, ss(seg(t, 9, 16)));
  if (t < 26) return -0.052;
  if (t < 32) return lerp(-0.052, -0.02, ss(seg(t, 26, 32)));
  return lerp(-0.01, 0.02, ss(seg(t, 32, 36)));
}

function gradeAt(t, focus) {
  const wake = ss(seg(t, HIT.strike, HIT.strike + 2.4));
  return {
    bloom: lerp(0.06, 0.2, Math.max(wake, ss(seg(t, HIT.glass, HIT.glass + 0.6)))),
    radius: 0.4,
    threshold: 1.05,
    vignette: lerp(0.52, 0.32, wake),
    warm: 0.58,
    sat: 1.08,
    contrast: 0.07,
    fade: lerp(0.72, 1, wake),
    focus,
    aper: t < 8 ? 5.2 : t < 17 ? 7.4 : t < 26 ? 4.8 : t < 32 ? 3.8 : 2.8,
    maxCoc: 12,
  };
}

function applyGrade(g) {
  post.bloom.strength = g.bloom;
  post.bloom.radius = g.radius;
  post.bloom.threshold = g.threshold;
  const u = post.vig.uniforms;
  u.amt.value = g.vignette;
  u.warm.value = g.warm;
  u.sat.value = g.sat;
  u.contrast.value = g.contrast;
  u.fade.value = g.fade;
  post.dof.focus = g.focus;
  post.dof.aper = g.aper;
  post.dof.maxCoc = g.maxCoc;
}

function cueEnd(v) {
  return v.t0 + Math.max(1.8, v.dur + 0.6);
}

function setSubtitles(t) {
  let shown = '';
  for (const v of TL.voice) {
    if (t >= v.t0 && t < cueEnd(v)) { shown = v.text; break; }
  }
  const boxed = t >= 33.2;
  subEl.style.bottom = boxed ? '74px' : '64px';
  subEl.querySelector('.band').style.opacity = boxed ? '0' : '1';
  if (shown) {
    subText.textContent = shown;
    subEl.style.opacity = '1';
  } else {
    subText.textContent = '';
    subEl.style.opacity = '0';
  }
}

function projectTitle() {
  titleBox.setFromObject(title.mesh);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const zs = [titleBox.min.z, titleBox.max.z];
  for (const x of [titleBox.min.x, titleBox.max.x]) {
    for (const y of [titleBox.min.y, titleBox.max.y]) {
      for (const z of zs) {
        corner.set(x, y, z).project(camera);
        const sx = (corner.x * 0.5 + 0.5) * W;
        const sy = (-corner.y * 0.5 + 0.5) * H;
        x0 = Math.min(x0, sx);
        y0 = Math.min(y0, sy);
        x1 = Math.max(x1, sx);
        y1 = Math.max(y1, sy);
      }
    }
  }
  return { id: 'title', text: 'FIRST BLOOM', x0, y0, x1, y1 };
}

export function render(t) {
  const p = camPos(t);
  const look = camLook(t);
  const driftX = 0.0006 * Math.sin(t * 1.7);
  const driftY = 0.00045 * Math.sin(t * 1.31 + 0.7);
  camera.position.set(p[0] + driftX, p[1] + driftY, p[2]);
  camera.lookAt(look[0], look[1], look[2]);
  camera.updateMatrixWorld();

  const light = lightState(t);
  const flick = t > HIT.glass + 0.3 ? 1 + 0.06 * Math.sin(7.3 * t) * Math.sin(3.1 * t) : 1;
  const glowMoon = 0.42 + 0.58 * ss(seg(t, 0.15, 1.3));
  const glowGlass = ss(seg(t, HIT.glass - 0.12, HIT.glass + 0.38));
  const flowerReveal = ss(seg(t, HIT.flower - 0.85, HIT.flower + 0.12));
  const titleReveal = ss(seg(t, HIT.title, HIT.title + 1.05));

  for (const s of sheets) {
    const lit = layerLit(t, s.on);
    const u = s.uniforms;
    u.uLit.value = lit;
    u.uLight.value.set(light.x, light.y, -0.08);
    u.uLightR.value = light.r;
    u.uFlicker.value = s.key === 'glass' || s.key === 'sky' ? flick : 1;
    u.uGlowAmt.value = s.key === 'sky' ? glowMoon : s.key === 'glass' ? glowGlass : 0;
    u.uShadow.value.set((s.mesh.position.x - light.x) * 0.015, 0.013);
    s.mesh.position.y = s.baseY + 0.0014 * (1 - lit);
  }

  const fu = flower.uniforms;
  const flit = layerLit(t, HIT.flower - 0.7);
  fu.uLit.value = flit;
  fu.uLight.value.set(light.x, light.y, -0.08);
  fu.uLightR.value = light.r;
  fu.uFlicker.value = 1;
  fu.uGlowAmt.value = 0;
  fu.uReveal.value = flowerReveal;
  flower.mesh.position.y = flower.baseY + 0.001 * (1 - flowerReveal);

  const tu = title.uniforms;
  tu.uLit.value = 1;
  tu.uLight.value.set(0, -0.09, -0.02);
  tu.uLightR.value = 0.28;
  tu.uFlicker.value = 1;
  tu.uGlowAmt.value = titleReveal;
  tu.uReveal.value = t < HIT.title ? 0 : titleReveal;
  tu.uTrans.value = 0.95;

  burst.uniforms.uAmt.value = burstAmt(t);
  const spill = ss(seg(t, HIT.pull - 1.4, HIT.pull + 2.2));
  pool.uniforms.uAmt.value = spill * 0.18;
  spot.intensity = 0.4 + 6 * spill;

  focusPt.set(look[0], look[1], focusZ(t));
  const focus = Math.max(0.05, camera.position.distanceTo(focusPt));
  applyGrade(gradeAt(t, focus));
  post.composer.render();
  setSubtitles(t);
}

window.render = render;
window.DUR = DUR;
window.EV = [
  { t: HIT.strike, type: 'strike' },
  { t: HIT.strike + 0.4, type: 'paper' },
  { t: HIT.strike + 0.8, type: 'paper' },
  { t: HIT.strike + 1.2, type: 'paper' },
  { t: HIT.strike + 1.6, type: 'paper' },
  { t: HIT.glass, type: 'glass' },
  { t: HIT.flower, type: 'flower' },
  { t: HIT.pull, type: 'pull' },
  { t: HIT.title, type: 'title' },
];
window.TEXTS = (t) => {
  if (t < HIT.title || t > DUR) return [];
  return [projectTitle()];
};

render(0);
window.READY = true;
