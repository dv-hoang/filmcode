// Cut sheets for the potting-shed lamp. Metre space, y up, origin at the sheet centre.
import { SW, SH, TW, TH, blank, cut, finish } from './engine/paper.js';

const X = (x) => (x / SW + 0.5) * TW;
const Y = (y) => (0.5 - y / SH) * TH;
const Sx = (m) => (m / SW) * TW;
const Sy = (m) => (m / SH) * TH;

function ctxOf(c) {
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  return g;
}

function arch(g, cx, baseY, w, h) {
  const x = X(cx);
  const y = Y(baseY);
  const hw = Sx(w) / 2;
  const hh = Sy(h);
  g.beginPath();
  g.moveTo(x - hw, y);
  g.lineTo(x - hw, y - hh + hw);
  g.quadraticCurveTo(x - hw, y - hh, x, y - hh);
  g.quadraticCurveTo(x + hw, y - hh, x + hw, y - hh + hw);
  g.lineTo(x + hw, y);
  g.closePath();
  g.fill();
}

function pot(g, cx, baseY, w, h) {
  const x = X(cx);
  const y = Y(baseY);
  const hw = Sx(w) / 2;
  const hh = Sy(h);
  g.beginPath();
  g.moveTo(x - hw * 0.72, y - hh);
  g.lineTo(x - hw, y);
  g.quadraticCurveTo(x, y + hh * 0.08, x + hw, y);
  g.lineTo(x + hw * 0.72, y - hh);
  g.closePath();
  g.fill();
  g.fillRect(x - hw * 0.92, y - hh - Sy(0.004), hw * 1.84, Sy(0.008));
}

function leaf(g, cx, cy, rx, ry, rot) {
  g.save();
  g.translate(X(cx), Y(cy));
  g.rotate(rot);
  g.beginPath();
  g.ellipse(0, 0, Sx(rx), Sy(ry), 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function fillSheet(g, hex) {
  g.fillStyle = hex;
  g.fillRect(0, 0, TW, TH);
}

export function drawWorld() {
  const sky = blank();
  const skyG = ctxOf(sky);
  const skyGlow = blank();
  const skyGlowG = ctxOf(skyGlow);
  fillSheet(skyG, '#1c2636');
  const moon = (g) => {
    g.beginPath();
    g.arc(X(0), Y(0.108), Sx(0.022), 0, Math.PI * 2);
    g.fill();
  };
  cut(skyG, moon);
  skyGlowG.fillStyle = '#fff';
  moon(skyGlowG);
  finish(skyG, 21);

  const glass = blank();
  const glassG = ctxOf(glass);
  const glassGlow = blank();
  const glassGlowG = ctxOf(glassGlow);
  glassG.fillStyle = '#b7c7c0';
  glassG.fillRect(X(-0.24), Y(0.088), Sx(0.48), Y(-0.055) - Y(0.088));
  const arches = [
    [-0.095, -0.02, 0.062, 0.092],
    [0.0, -0.02, 0.07, 0.102],
    [0.098, -0.02, 0.062, 0.092],
  ];
  for (const a of arches) {
    cut(glassG, (g) => { g.fillStyle = '#000'; arch(g, a[0], a[1], a[2], a[3]); });
    glassGlowG.fillStyle = '#fff';
    arch(glassGlowG, a[0], a[1], a[2], a[3]);
  }
  finish(glassG, 22);

  const leaves = blank();
  const leafG = ctxOf(leaves);
  leafG.fillStyle = '#7d9a8e';
  const clumps = [
    [-0.18, 0.12, 0.055, 0.028, -0.4],
    [-0.13, 0.1, 0.04, 0.022, 0.3],
    [-0.16, 0.07, 0.035, 0.02, 0.8],
    [0.17, 0.115, 0.05, 0.026, 0.5],
    [0.13, 0.085, 0.038, 0.02, -0.6],
    [0.19, 0.06, 0.03, 0.018, 1.1],
    [-0.06, 0.125, 0.028, 0.016, 0.2],
    [0.055, 0.122, 0.026, 0.014, -0.3],
  ];
  for (const c of clumps) leaf(leafG, c[0], c[1], c[2], c[3], c[4]);
  finish(leafG, 23);

  const shelf = blank();
  const shelfG = ctxOf(shelf);
  shelfG.fillStyle = '#4d6a5e';
  shelfG.fillRect(X(-0.2), Y(-0.028), Sx(0.4), Sy(0.012));
  pot(shelfG, -0.075, -0.04, 0.04, 0.032);
  pot(shelfG, 0.02, -0.04, 0.046, 0.036);
  shelfG.fillRect(X(0.012), Y(0.012), Sx(0.006), Sy(0.05));
  shelfG.save();
  shelfG.translate(X(0.058), Y(-0.02));
  shelfG.rotate(-0.9);
  shelfG.fillRect(0, 0, Sx(0.028), Sy(0.004));
  shelfG.beginPath();
  shelfG.arc(Sx(0.028), Sy(0.002), Sx(0.0022), 0, Math.PI * 2);
  shelfG.fill();
  shelfG.restore();
  finish(shelfG, 24);

  const near = blank();
  const nearG = ctxOf(near);
  nearG.fillStyle = '#1a2420';
  leaf(nearG, -0.2, 0.02, 0.07, 0.035, 0.6);
  leaf(nearG, -0.16, -0.02, 0.045, 0.025, -0.4);
  leaf(nearG, 0.2, 0.04, 0.05, 0.028, -0.7);
  leaf(nearG, 0.16, -0.015, 0.03, 0.02, 0.4);
  finish(nearG, 25);

  const front = blank();
  const frontG = ctxOf(front);
  fillSheet(frontG, '#141a18');
  cut(frontG, (g) => {
    const x = X(-0.155);
    const y = Y(0.145);
    const w = Sx(0.31);
    const h = Y(-0.048) - Y(0.145);
    const r = Sx(0.012);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
    g.fill();
  });
  finish(frontG, 26);

  return { sky, skyGlow, glass, glassGlow, leaves, shelf, near, front };
}

export function drawFlower() {
  const c = blank(720, 720);
  const g = ctxOf(c);
  g.clearRect(0, 0, 720, 720);
  g.fillStyle = '#8a2a20';
  const cx = 360;
  const cy = 400;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.beginPath();
    g.ellipse(cx + Math.cos(a) * 78, cy + Math.sin(a) * 64, 70, 44, a, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.35;
    g.beginPath();
    g.ellipse(cx + Math.cos(a) * 40, cy + Math.sin(a) * 32, 42, 28, a, 0, Math.PI * 2);
    g.fill();
  }
  cut(g, (ctx) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  });
  finish(g, 27);
  return c;
}

export function drawTitle() {
  const c = blank(1400, 280);
  const g = ctxOf(c);
  g.clearRect(0, 0, 1400, 280);
  g.fillStyle = '#fff';
  g.font = '500 132px "Cormorant Garamond"';
  g.textBaseline = 'middle';
  const s = 'FIRST BLOOM';
  const gap = 10;
  const widths = [...s].map((ch) => g.measureText(ch).width + (ch === ' ' ? 28 : gap));
  const total = widths.reduce((a, b) => a + b, 0) - gap;
  let x = (1400 - total) / 2;
  for (let i = 0; i < s.length; i++) {
    g.fillText(s[i], x, 150);
    x += widths[i];
  }
  return c;
}

export const FLOWER_M = 0.1;

export function addRoom(scene, THREE) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x5c3e2a, roughness: 0.78, metalness: 0.02 });
  const night = new THREE.MeshStandardMaterial({ color: 0x100e0c, roughness: 0.95 });
  const clay = new THREE.MeshStandardMaterial({ color: 0x8a4e36, roughness: 0.8, emissive: 0x3a1c12, emissiveIntensity: 0.45 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a9298, roughness: 0.32, metalness: 0.7, emissive: 0x2a3034, emissiveIntensity: 0.35 });

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), night);
  wall.position.set(0, 0.05, -0.5);
  wall.receiveShadow = true;
  scene.add(wall);

  const lip = 0.038;
  const zf = 0.02;
  const beam = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const outerW = 0.56 + lip * 2;
  const outerH = 0.33;
  beam(outerW, lip, 0.05, 0, 0.165 + lip / 2, zf);
  beam(outerW, lip, 0.05, 0, -0.165 - lip / 2, zf);
  beam(lip, outerH, 0.05, 0.28 + lip / 2, 0, zf);
  beam(lip, outerH, 0.05, -0.28 - lip / 2, 0, zf);

  const topY = -0.165 - lip;
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.03, 0.7), wood);
  table.position.set(0, topY - 0.015, 0.18);
  table.castShadow = true;
  table.receiveShadow = true;
  scene.add(table);

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.017, 0.046, 28), clay);
  cup.position.set(0.16, topY + 0.023, 0.2);
  cup.castShadow = true;
  cup.receiveShadow = true;
  scene.add(cup);

  const blade = new THREE.BoxGeometry(0.13, 0.005, 0.012);
  const b1 = new THREE.Mesh(blade, metal);
  b1.position.set(-0.16, topY + 0.006, 0.22);
  b1.rotation.set(0.1, 0.15, 0.45);
  b1.castShadow = true;
  b1.receiveShadow = true;
  scene.add(b1);
  const b2 = new THREE.Mesh(blade, metal);
  b2.position.set(-0.15, topY + 0.011, 0.22);
  b2.rotation.set(0.1, -0.1, -0.4);
  b2.castShadow = true;
  b2.receiveShadow = true;
  scene.add(b2);

  const spot = new THREE.SpotLight(0xffc58a, 0.2, 1.6, Math.PI / 5, 0.75, 1.1);
  spot.position.set(0, 0.02, 0.04);
  spot.target.position.set(0.02, topY, 0.3);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.radius = 10;
  spot.shadow.bias = -0.0004;
  scene.add(spot);
  scene.add(spot.target);

  const hemi = new THREE.HemisphereLight(0x3a342c, 0x100e0c, 0.55);
  scene.add(hemi);
  const fill = new THREE.DirectionalLight(0xffe2c4, 0.85);
  fill.position.set(0.15, 0.35, 1.4);
  scene.add(fill);

  return { spot, topY };
}
