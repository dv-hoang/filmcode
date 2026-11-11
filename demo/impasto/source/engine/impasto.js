// Impasto · WebGL2 palette-knife renderer (project copy; not the library demo).
// API aligned with styles/impasto STYLE.md: Impasto, Strokes, KNIFE/BRUSH/DAB/LINE, hex.

export const KNIFE = 0, BRUSH = 1, DAB = 2, LINE = 3;

export function hex(h) {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map(c => c + c).join('') : s, 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

function mulberry(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Strokes {
  constructor() { this._ = []; }
  push(o) { this._.push(o); return this; }
  data() { return this._; }
  clear() { this._.length = 0; return this; }
}

const VS_STROKE = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner; // -1..1 quad corner
layout(location=1) in vec4 aPos;    // x,y,ang,type
layout(location=2) in vec4 aSize;   // len,wid,taper,skew
layout(location=3) in vec4 aCol;    // rgb + alpha
layout(location=4) in vec4 aCol2;   // c2 rgb + mix
layout(location=5) in vec4 aMeta;   // seed,hgt,rev,app
uniform vec2 uRes;
uniform vec4 uCam; // x,y,zoom,rot
uniform float uGrey;
uniform float uReveal;
uniform float uRevDur;
uniform float uAppear;
uniform float uAppDur;
uniform float uRun;
uniform float uHgtScale;
out vec2 vUv;
out vec3 vCol;
out float vHgt;
out float vAlive;
void main(){
  float seed = aMeta.x;
  float hgt0 = aMeta.y;
  float rev = aMeta.z;
  float app = aMeta.w;
  float ang = aPos.z + (fract(sin(seed*12.9898)*43758.5453)-0.5)*0.22;
  float len = aSize.x * (0.92 + fract(sin(seed*78.233)*43758.5453)*0.16);
  float wid = aSize.y * (0.92 + fract(sin(seed*39.17)*43758.5453)*0.14);
  float taper = clamp(aSize.z, 0.0, 1.0);
  float skew = aSize.w;
  float ty = aPos.w;

  // appear / reveal gates (world-space x used for wave)
  float alive = 1.0;
  if (uAppear < 1e5) {
    float a = (uAppear - app) / max(0.001, uAppDur);
    alive *= smoothstep(0.0, 1.0, a);
  }
  if (uReveal < 1e5) {
    float r = (uReveal - rev) / max(0.001, uRevDur);
    alive *= smoothstep(0.0, 1.0, r);
  }
  vAlive = alive;

  float u = aCorner.x * 0.5 + 0.5; // 0..1 along length
  float v = aCorner.y;             // -1..1 across
  float tap = mix(1.0, 1.0 - abs(u*2.0-1.0)*0.85, taper);
  if (ty > 1.5) { // DAB ~ disc
    len = max(len, wid);
    wid = len;
  }
  float lx = aCorner.x * len * 0.5;
  float ly = aCorner.y * wid * 0.5 * tap;
  ly += aCorner.x * skew * wid * 0.35;
  // broken run-out
  float run = uRun * (1.0 - taper) * fract(sin(seed*91.7)*43758.5453);
  if (u > 0.72) lx += (u-0.72)*run*40.0*(fract(sin(seed*4.1+u*9.0)*43758.5453)-0.5);

  float c = cos(ang), s = sin(ang);
  vec2 local = vec2(c*lx - s*ly, s*lx + c*ly);
  vec2 world = aPos.xy + local;

  // camera
  vec2 p = world - uCam.xy;
  float cr = cos(uCam.w), sr = sin(uCam.w);
  p = vec2(cr*p.x - sr*p.y, sr*p.x + cr*p.y) * uCam.z;
  vec2 clip = vec2(p.x / (uRes.x*0.5), -p.y / (uRes.y*0.5));

  float valJ = (fract(sin(seed*3.7)*43758.5453)-0.5)*0.06;
  vec3 col = aCol.rgb * (1.0 + valJ);
  vec3 col2 = aCol2.rgb;
  float m = aCol2.a;
  // drag second colour toward trailing edge
  float drag = clamp(u * 0.7 + (v*0.5+0.5)*0.3, 0.0, 1.0) * m;
  col = mix(col, col2, drag);
  if (uGrey > 0.5) {
    float L = dot(col, vec3(0.299,0.587,0.114));
    col = mix(col, vec3(L*0.92, L*0.94, L*1.02), 0.92);
  }

  // ridge height along blade
  float ridge = exp(-pow(v*2.2, 2.0)) * (0.55 + 0.45*sin(u*3.14159));
  if (ty > 1.5) ridge = exp(-dot(aCorner,aCorner)*2.4);
  vHgt = (0.35 + hgt0) * ridge * uHgtScale * alive;
  vCol = col * aCol.a;
  vUv = vec2(u, v*0.5+0.5);
  gl_Position = vec4(clip, 0.0, 1.0);
}`;

const FS_STROKE = `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vCol;
in float vHgt;
in float vAlive;
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oHgt;
void main(){
  if (vAlive < 0.02) discard;
  // slanted knife blade: ellipse along length, sharp lips, soft sides
  vec2 p = vec2((vUv.x - 0.5) * 2.0, (vUv.y - 0.5) * 2.0);
  float blade = 1.0 - smoothstep(0.55, 1.05, length(vec2(p.x * 0.55, p.y)));
  float tip = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
  float a = blade * tip * clamp(vAlive, 0.0, 1.0);
  if (a < 0.03) discard;
  oCol = vec4(vCol, a);
  oHgt = vec4(vHgt * a, 0.0, 0.0, a);
}`;

const VS_BLIT = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }`;

const FS_LIGHT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uCol;
uniform sampler2D uHgt;
uniform sampler2D uUnder;
uniform vec3 uLight;
uniform float uNorm, uAmb, uDif, uSpec, uAo, uExpo, uSat, uVig;
uniform vec2 uRes;
out vec4 o;
float lum(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
void main(){
  vec4 under = texture(uUnder, vUv);
  vec4 col = texture(uCol, vUv);
  float h = texture(uHgt, vUv).r;
  // height gradients
  vec2 e = 1.0 / uRes;
  float hx = texture(uHgt, vUv + vec2(e.x,0.0)).r - texture(uHgt, vUv - vec2(e.x,0.0)).r;
  float hy = texture(uHgt, vUv + vec2(0.0,e.y)).r - texture(uHgt, vUv - vec2(0.0,e.y)).r;
  vec3 N = normalize(vec3(-hx * uNorm, -hy * uNorm, 1.0));
  vec3 L = normalize(uLight);
  float ndl = max(0.0, dot(N, L));
  float ao = mix(1.0, 1.0 - h * 0.35, clamp(uAo - 1.0, 0.0, 1.0) + 0.5);
  vec3 base = mix(under.rgb, col.rgb, col.a);
  vec3 lit = base * (uAmb + uDif * ndl) * ao;
  vec3 H = normalize(L + vec3(0.0,0.0,1.0));
  float sp = pow(max(0.0, dot(N, H)), 28.0) * uSpec * (0.4 + h);
  lit += vec3(sp);
  // grade
  lit *= uExpo;
  float l0 = lum(lit);
  lit = mix(vec3(l0), lit, uSat);
  // vignette
  vec2 q = vUv * 2.0 - 1.0;
  lit *= 1.0 - dot(q,q) * uVig;
  o = vec4(clamp(lit, 0.0, 1.0), 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || 'shader');
  }
  return s;
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || 'link');
  }
  return p;
}

function packStrokes(list) {
  // 20 floats per stroke
  const n = list.length;
  const a = new Float32Array(n * 20);
  for (let i = 0; i < n; i++) {
    const s = list[i];
    const o = i * 20;
    const c = s.c || [1, 1, 1];
    const c2 = s.c2 || c;
    a[o] = s.x || 0; a[o + 1] = s.y || 0; a[o + 2] = s.ang || 0; a[o + 3] = s.type ?? KNIFE;
    a[o + 4] = s.len || 40; a[o + 5] = s.wid || 18; a[o + 6] = s.taper ?? 0.7; a[o + 7] = s.skew ?? 0.35;
    a[o + 8] = c[0]; a[o + 9] = c[1]; a[o + 10] = c[2]; a[o + 11] = s.alpha ?? 1;
    a[o + 12] = c2[0]; a[o + 13] = c2[1]; a[o + 14] = c2[2]; a[o + 15] = s.c2 ? 0.55 : 0.0;
    a[o + 16] = s.seed ?? i + 1; a[o + 17] = s.hgt ?? 1; a[o + 18] = s.rev ?? 0; a[o + 19] = s.app ?? 0;
  }
  return a;
}

export class Impasto {
  constructor(canvas, { W = 1920, H = 1080, ss = 2 } = {}) {
    this.canvas = canvas;
    this.W = W; this.H = H; this.ss = ss;
    canvas.width = W; canvas.height = H;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 required');
    this.gl = gl;
    this.progStroke = program(gl, VS_STROKE, FS_STROKE);
    this.progLight = program(gl, VS_BLIT, FS_LIGHT);
    this._initTargets();
    this._initGeo();
    this._under = null;
    this._post = {
      light: [-0.55, -0.55, 0.75],
      norm: 3.0, amb: 0.78, dif: 0.32, spec: 0.22, ao: 1.15,
      expo: 1.05, sat: 1.12, vig: 0.18,
    };
  }

  _initTargets() {
    const gl = this.gl;
    const w = this.W * this.ss, h = this.H * this.ss;
    this.tw = w; this.th = h;

    const mkTex = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.texCol = mkTex();
    this.texHgt = mkTex();
    this.texUnder = mkTex();
    this.fbo = gl.createFramebuffer();
  }

  _initGeo() {
    const gl = this.gl;
    // unit quad
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    this.instance = gl.createBuffer();
    this.vaoStroke = gl.createVertexArray();
    gl.bindVertexArray(this.vaoStroke);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instance);
    const stride = 20 * 4;
    const bind = (loc, size, off) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off);
      gl.vertexAttribDivisor(loc, 1);
    };
    bind(1, 4, 0);
    bind(2, 4, 16);
    bind(3, 4, 32);
    bind(4, 4, 48);
    bind(5, 4, 64);
    gl.bindVertexArray(null);

    this.vaoBlit = gl.createVertexArray();
    gl.bindVertexArray(this.vaoBlit);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  texture(srcCanvas) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  begin() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texCol, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.texHgt, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, this.tw, this.th);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
  }

  under(tex, w, h, o = {}) {
    // blit underpainting into colour target at low alpha via light pass path — simple copy into texUnder
    const gl = this.gl;
    this._under = tex || this.texUnder;
    if (tex && w && h) {
      // already a GL texture
      this._under = tex;
    }
    void o;
  }

  setUnderCanvas(c) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texUnder);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, c);
    this._under = this.texUnder;
  }

  batch(listOrPacked) {
    if (listOrPacked instanceof Float32Array) return listOrPacked;
    return packStrokes(listOrPacked);
  }

  _drawPacked(packed, o = {}) {
    const gl = this.gl;
    const n = packed.length / 20;
    if (n < 1) return;
    gl.bindVertexArray(this.vaoStroke);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instance);
    gl.bufferData(gl.ARRAY_BUFFER, packed, gl.DYNAMIC_DRAW);
    gl.useProgram(this.progStroke);
    const u = (name) => gl.getUniformLocation(this.progStroke, name);
    gl.uniform2f(u('uRes'), this.W, this.H);
    const cam = o.cam || { x: this.W / 2, y: this.H / 2, zoom: 1, rot: 0 };
    gl.uniform4f(u('uCam'), cam.x, cam.y, cam.zoom ?? 1, cam.rot ?? 0);
    gl.uniform1f(u('uGrey'), o.grey ?? 0);
    gl.uniform1f(u('uReveal'), o.reveal ?? 1e6);
    gl.uniform1f(u('uRevDur'), o.revDur ?? 1.2);
    gl.uniform1f(u('uAppear'), o.appear ?? 1e6);
    gl.uniform1f(u('uAppDur'), o.appDur ?? 1.0);
    gl.uniform1f(u('uRun'), o.run ?? 0.35);
    gl.uniform1f(u('uHgtScale'), o.hgt ?? 1.0);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
    gl.bindVertexArray(null);
  }

  draw(packed, o = {}) { this._drawPacked(packed, o); }
  drawNow(list, o = {}) { this._drawPacked(this.batch(list), o); }

  finish(post = {}) {
    const gl = this.gl;
    const P = { ...this._post, ...post };
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.W, this.H);
    gl.disable(gl.BLEND);
    gl.useProgram(this.progLight);
    gl.bindVertexArray(this.vaoBlit);
    const u = (name) => gl.getUniformLocation(this.progLight, name);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texCol); gl.uniform1i(u('uCol'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texHgt); gl.uniform1i(u('uHgt'), 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this._under || this.texUnder); gl.uniform1i(u('uUnder'), 2);
    gl.uniform3fv(u('uLight'), P.light);
    gl.uniform1f(u('uNorm'), P.norm);
    gl.uniform1f(u('uAmb'), P.amb);
    gl.uniform1f(u('uDif'), P.dif);
    gl.uniform1f(u('uSpec'), P.spec);
    gl.uniform1f(u('uAo'), P.ao);
    gl.uniform1f(u('uExpo'), P.expo);
    gl.uniform1f(u('uSat'), P.sat);
    gl.uniform1f(u('uVig'), P.vig);
    gl.uniform2f(u('uRes'), this.tw, this.th);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }
}

/** Lay knife strokes along a polyline. */
export function strokePath(out, pts, { wid = 20, c = hex('#c98d7e'), type = KNIFE, step = 18, seed = 1 } = {}) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(d / step));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      out.push({
        x, y, ang: Math.atan2(y1 - y0, x1 - x0),
        len: step * 1.6, wid, c, c2: c, type, taper: 0.75, seed: seed + i * 17 + k,
        rev: x * 0.001, app: x * 0.001,
      });
    }
  }
}

/** Fill a region with coarse→fine knife strokes (simple disc/box coverage). */
export function fillRegion(out, { x, y, w, h, c, c2, maxR = 48, detail = 0.55, dir = 0.2, seed = 1, group = 0 }) {
  const rnd = mulberry(seed + group * 97);
  const area = w * h;
  const n = Math.max(40, Math.floor(area / (maxR * maxR * 0.22) * (0.65 + detail)));
  for (let i = 0; i < n; i++) {
    const px = x + rnd() * w;
    const py = y + rnd() * h;
    const r = maxR * (0.28 + rnd() * 0.7) * (1 - detail * 0.35);
    const push = (o) => (out.push ? out.push(o) : out._.push(o));
    push({
      x: px, y: py,
      ang: dir + (rnd() - 0.5) * 0.85,
      len: r * (1.7 + rnd() * 1.4),
      wid: r * (0.9 + rnd() * 0.55),
      c, c2: c2 || c,
      type: KNIFE, taper: 0.55 + rnd() * 0.35, skew: (rnd() - 0.5) * 1.1,
      seed: seed + i + 1, hgt: 0.75 + rnd() * 0.6,
      rev: px * 0.001 + py * 0.0002,
      app: px * 0.001,
    });
  }
}
