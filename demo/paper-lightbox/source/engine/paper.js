// Paper sheets for First Bloom. One flat colour, holes, fibre, backlight.
import * as THREE from 'three';
import { mulberry } from '/core/lib.js';

export const SW = 0.56;
export const SH = 0.33;
export const PPM = 3400;
export const TW = Math.round(SW * PPM);
export const TH = Math.round(SH * PPM);

const VERT = `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAG = `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;
  uniform sampler2D uMap;
  uniform sampler2D uGlow;
  uniform sampler2D uPulp;
  uniform sampler2D uOcc;
  uniform vec3 uLight;
  uniform vec3 uLightCol;
  uniform float uLightR;
  uniform float uLit;
  uniform float uTrans;
  uniform float uGlowAmt;
  uniform float uFlicker;
  uniform float uRecv;
  uniform float uReveal;
  uniform float uRevealAxis;
  uniform vec2 uShadow;

  void main() {
    if (uRevealAxis > 1.5 && vUv.y > uReveal) discard;
    if (uRevealAxis > 0.5 && uRevealAxis < 1.5 && vUv.x > uReveal) discard;

    vec4 albedo = texture2D(uMap, vUv);
    float g = texture2D(uGlow, vUv).r * uGlowAmt * uFlicker;
    if (albedo.a < 0.12 && g < 0.08) discard;

    float rim = smoothstep(0.985, 1.0, vUv.y);
    float bot = smoothstep(0.035, 0.0, vUv.y);
    float cloud = texture2D(uPulp, vUv * vec2(7.0, 5.0)).r;

    vec2 d = vWorld.xy - uLight.xy;
    float falloff = exp(-dot(d, d) / max(uLightR * uLightR, 1e-4));

    if (albedo.a < 0.12) {
      vec3 burn = uLightCol * g * (0.62 + 0.28 * falloff);
      gl_FragColor = vec4(burn, 1.0);
      return;
    }

    float sh = 0.0;
    if (uRecv > 0.5) {
      vec2 base = vUv + uShadow;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 o = vec2(float(i), float(j)) * 0.0035;
          sh += texture2D(uOcc, base + o).a;
        }
      }
      sh = clamp(sh / 9.0, 0.0, 1.0);
    }

    vec3 body = albedo.rgb * (0.07 + 0.16 * uLit);
    vec3 emit = albedo.rgb * uLightCol * uTrans * uLit * falloff * (0.32 + 0.68 * cloud);
    vec3 col = body + emit;
    col += uLightCol * g * 0.35;
    col += vec3(1.0, 0.78, 0.42) * rim * uLit * 0.55;
    col *= mix(1.0, 0.58, bot);
    col *= mix(1.0, 0.34, sh);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const BURST_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform float uAmt;
  uniform vec3 uCol;
  void main() {
    vec2 p = vUv - 0.5;
    float a = exp(-dot(p, p) * 24.0) * uAmt;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uCol * a, a);
  }
`;

export function cut(ctx, fn) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  fn(ctx);
  ctx.restore();
}

export function blank(w = TW, h = TH) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function finish(ctx, seed) {
  const { width: W, height: H } = ctx.canvas;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const rnd = mulberry(seed);
  const clamp = (n) => n < 0 ? 0 : n > 255 ? 255 : n;
  for (let y = 0; y < H; y++) {
    const rim = y < 6 ? (6 - y) / 6 : 0;
    const bot = y > H - 10 ? (y - (H - 10)) / 10 : 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] < 8) continue;
      const f = (rnd() - 0.5) * 16;
      d[i] = clamp(d[i] + f + rim * 36);
      d[i + 1] = clamp(d[i + 1] + f * 0.85 + rim * 22);
      d[i + 2] = clamp(d[i + 2] + f * 0.55 + rim * 8);
      const s = bot * 0.32;
      d[i] *= (1 - s);
      d[i + 1] *= (1 - s);
      d[i + 2] *= (1 - s);
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function pulpTexture() {
  const c = blank(256, 256);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(256, 256);
  const rnd = mulberry(10);
  for (let i = 0; i < 256 * 256; i++) {
    const n = 170 + Math.floor(rnd() * 80);
    img.data[i * 4] = n;
    img.data[i * 4 + 1] = n;
    img.data[i * 4 + 2] = n;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

function texOf(canvas, color) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

export function emptyTex() {
  return texOf(blank(2, 2), false);
}

export function makeSheet({
  map, glow, pulp, w = SW, h = SH, z = 0, x = 0, y = 0,
  trans = 0.4, shadow = true, recv = true,
}) {
  const uniforms = {
    uMap: { value: texOf(map, true) },
    uGlow: { value: glow ? texOf(glow, false) : emptyTex() },
    uPulp: { value: pulp },
    uOcc: { value: emptyTex() },
    uLight: { value: new THREE.Vector3(0, 0.02, -0.08) },
    uLightCol: { value: new THREE.Color('#ffb862') },
    uLightR: { value: 0.18 },
    uLit: { value: 0.08 },
    uTrans: { value: trans },
    uGlowAmt: { value: 0 },
    uFlicker: { value: 1 },
    uRecv: { value: recv ? 1 : 0 },
    uReveal: { value: 1 },
    uRevealAxis: { value: 0 },
    uShadow: { value: new THREE.Vector2(0, 0.012) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: true,
    depthWrite: true,
    side: THREE.FrontSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.shadow = shadow;
  return { mesh, uniforms };
}

export function makeBurst() {
  const uniforms = {
    uAmt: { value: 0 },
    uCol: { value: new THREE.Color('#ffc48a') },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: BURST_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), mat);
  mesh.position.set(0.055, -0.008, -0.046);
  mesh.renderOrder = 2;
  return { mesh, uniforms };
}

export function makePool() {
  const uniforms = { uAmt: { value: 0 }, uCol: { value: new THREE.Color('#ffb862') } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: BURST_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.1, 40), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0.02, -0.182, 0.22);
  mesh.renderOrder = 1;
  return { mesh, uniforms };
}
