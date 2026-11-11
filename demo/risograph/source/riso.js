// Prints an RGB plate canvas. R = teal density, G = pink density.
// Halftone is anchored to the screen. Period scales up with the camera so a push-in
// turns dots into shapes; a pan at constant scale slides the picture under a fixed screen.

const VS = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uPlates;
uniform vec2 uRes;
uniform vec2 uOffT;
uniform vec2 uOffP;
uniform float uRotT;
uniform float uRotP;
uniform float uRollOn;
uniform float uRollEdge;
uniform float uShot;
uniform float uFrame;
uniform float uPeriod;

out vec4 o;

float hash2(vec2 p, float seed) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031 + seed * 0.17);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float blot(vec2 px, float seed) {
  vec2 g = px / 96.0;
  vec2 i = floor(g);
  vec2 f = fract(g);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash2(i, seed);
  float b = hash2(i + vec2(1.0, 0.0), seed);
  float c = hash2(i + vec2(0.0, 1.0), seed);
  float d = hash2(i + vec2(1.0, 1.0), seed);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float grainOf(vec2 px) {
  float stable = hash2(px, uShot + 4.0);
  float boil = hash2(px, uFrame * 0.173 + 19.0);
  float pick = step(0.67, hash2(floor(px) + vec2(3.0, 1.0), uShot + 8.0));
  return mix(stable, boil, pick);
}

vec2 spin(vec2 px, vec2 off, float rot) {
  vec2 c = uRes * 0.5;
  vec2 p = px - off - c;
  float cs = cos(rot);
  float sn = sin(rot);
  p = vec2(cs * p.x - sn * p.y, sn * p.x + cs * p.y);
  return p + c;
}

float roller(float x) {
  if (uRollOn < 0.5) return 1.0;
  return smoothstep(0.0, 28.0, uRollEdge - x);
}

float rollerBand(float x) {
  if (uRollOn < 0.5) return 0.0;
  float d = x - uRollEdge;
  return exp(-d * d / 320.0) * 0.2;
}

float feed(vec2 px, float den) {
  float wave = 0.95 + 0.05 * sin(px.y * 0.027 + uShot * 1.7);
  float blotch = 0.93 + 0.07 * blot(px, uShot + 1.3);
  float row = fract(px.y / 460.0 + uShot * 0.21);
  float along = fract(px.x / 1400.0 + uShot * 0.09);
  float scratch = (den > 0.85 && row < 0.008 && along > 0.22 && along < 0.46) ? 0.0 : 1.0;
  return wave * blotch * scratch;
}

float dots(float den, vec2 px, float ang, float g) {
  den = clamp(den, 0.0, 1.0);
  if (den < 0.025) return 0.0;
  if (den >= 0.9) {
    float pin = hash2(px + vec2(11.0, 5.0), uShot + 2.0);
    return pin < 0.034 ? 0.0 : 1.0;
  }
  float cs = cos(ang);
  float sn = sin(ang);
  vec2 p = mat2(cs, -sn, sn, cs) * px;
  vec2 q = p / uPeriod;
  float s = 0.5 + 0.5 * cos(6.2831853 * q.x) * cos(6.2831853 * q.y);
  s += (g - 0.5) * 0.11;
  float edge = 1.0 - den;
  float aa = max(fwidth(s) * 1.2, 0.02);
  return smoothstep(edge - aa, edge + aa, s);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 pxT = spin(frag, uOffT, uRotT);
  vec2 pxP = spin(frag, uOffP, uRotP);
  vec2 uvT = pxT / uRes;
  vec2 uvP = pxP / uRes;
  float teal = texture(uPlates, uvT).r;
  float pink = texture(uPlates, uvP).g;
  float modT = clamp(teal * feed(frag, teal), 0.0, 1.0);
  float modP = clamp(pink * feed(frag + vec2(40.0, 0.0), pink) * roller(frag.x) + rollerBand(frag.x), 0.0, 1.0);
  float g = grainOf(frag);
  float covT = dots(modT, frag, 0.2618, g);
  float covP = dots(modP, frag, 1.3090, grainOf(frag + vec2(17.0, 9.0)));

  float fibre = hash2(frag * 0.5, 3.0);
  vec3 paper = vec3(0.9569, 0.9333, 0.8863);
  paper *= 0.984 + 0.016 * fibre;
  vec3 col = paper;
  col *= mix(vec3(1.0), vec3(0.0, 0.5137, 0.5412), covT);
  col *= mix(vec3(1.0), vec3(1.0, 0.2824, 0.6902), covP);
  o = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || 'shader compile failed');
  }
  return sh;
}

export function createPrinter(canvas) {
  const gl = canvas.getContext('webgl2', {
    preserveDrawingBuffer: true,
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
  });
  if (!gl) throw new Error('WebGL2 is required for the risograph print');
  const vs = compile(gl, gl.VERTEX_SHADER, VS);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || 'program link failed');
  }
  gl.useProgram(prog);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const loc = (n) => gl.getUniformLocation(prog, n);
  const u = {
    res: loc('uRes'),
    offT: loc('uOffT'),
    offP: loc('uOffP'),
    rotT: loc('uRotT'),
    rotP: loc('uRotP'),
    rollOn: loc('uRollOn'),
    rollEdge: loc('uRollEdge'),
    shot: loc('uShot'),
    frame: loc('uFrame'),
    period: loc('uPeriod'),
  };
  gl.uniform2f(u.res, canvas.width, canvas.height);
  gl.viewport(0, 0, canvas.width, canvas.height);

  return {
    gl,
    print(plate, state) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, plate);
      gl.uniform2f(u.offT, state.offT[0], state.offT[1]);
      gl.uniform2f(u.offP, state.offP[0], state.offP[1]);
      gl.uniform1f(u.rotT, state.rotT);
      gl.uniform1f(u.rotP, state.rotP);
      gl.uniform1f(u.rollOn, state.rollOn);
      gl.uniform1f(u.rollEdge, state.rollEdge);
      gl.uniform1f(u.shot, state.shot);
      gl.uniform1f(u.frame, state.frame);
      gl.uniform1f(u.period, state.period);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
