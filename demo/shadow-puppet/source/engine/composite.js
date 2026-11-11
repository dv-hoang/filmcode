// WebGL2 cloth: lamp × hide transmission × weave, then a warm grade.
// image = tonemap(lampLight × hideTransmission × cloth)

const VS = `#version 300 es
layout(location=0) in vec2 a;
out vec2 vUv;
void main() {
  vUv = a * 0.5 + 0.5;
  gl_Position = vec4(a, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTrans;
uniform vec2 uCloth;
uniform vec3 uCam;
uniform vec3 uLamp[4];
uniform float uTime;
uniform float uMirror;
uniform float uExposure;
uniform float uHaze;
out vec4 o;

float hash1(float n) {
  return fract(sin(n * 127.1 + 311.7) * 43758.5453);
}
float vnoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash1(i), hash1(i + 1.0), u);
}
float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * vec2(1920.0, 1080.0);
  vec2 cloth = vec2(uCam.x, uCam.y) + (screen - vec2(960.0, 540.0)) / max(uCam.z, 0.2);
  vec2 sampleP = cloth;
  if (uMirror > 0.5) sampleP.x = uCloth.x - cloth.x;
  float haze = uHaze;
  sampleP += vec2(
    sin(sampleP.y * 0.05 + uTime * 3.1),
    cos(sampleP.x * 0.04 - uTime * 2.4)
  ) * haze;

  float inside =
    step(0.0, sampleP.x) * step(sampleP.x, uCloth.x) *
    step(0.0, sampleP.y) * step(sampleP.y, uCloth.y);

  vec2 uv = clamp(sampleP / uCloth, 0.0, 1.0);
  vec3 trans = texture(uTrans, uv).rgb;

  float n = hash2(floor(sampleP / 6.0));
  vec2 wuv = sampleP / 7.2 + vec2(n * 0.2, n * 0.05);
  float weave = 0.88 + 0.12 * sin(wuv.x) * sin(wuv.y);
  float blot = 0.93 + 0.07 * sin(sampleP.x * 0.011) * sin(sampleP.y * 0.013);
  float speck = 0.94 + 0.06 * hash2(floor(sampleP));
  float edge = smoothstep(0.0, 90.0, sampleP.x) * smoothstep(0.0, 90.0, uCloth.x - sampleP.x)
    * smoothstep(0.0, 70.0, sampleP.y) * smoothstep(0.0, 70.0, uCloth.y - sampleP.y);
  float clothT = weave * blot * speck * mix(0.62, 1.0, edge);

  vec3 lamp = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    float inten = uLamp[i].z;
    vec2 lp = uLamp[i].xy;
    float d = length(sampleP - lp);
    float flick = 1.0
      + 0.035 * (vnoise(uTime * 7.0 + float(i) * 19.0) * 2.0 - 1.0)
      + 0.016 * sin(uTime * 23.0 + float(i) * 2.2);
    float broad = exp(-d * d / (2.0 * 560.0 * 560.0));
    float mid = exp(-d * d / (2.0 * 170.0 * 170.0));
    float hot = exp(-d * d / (2.0 * 58.0 * 58.0));
    float lobe = 0.34 + broad * 0.85 + mid * 0.85 + hot * 2.2;
    lamp += vec3(1.0, 0.84, 0.66) * inten * flick * lobe;
  }

  vec3 hdr = lamp * trans * clothT;
  vec3 col = 1.0 - exp(-hdr * uExposure);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 1.16);
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.28);

  vec2 q = screen / vec2(1920.0, 1080.0) * 2.0 - 1.0;
  float vig = dot(q, q);
  col *= mix(vec3(1.0), vec3(0.42, 0.22, 0.09), smoothstep(0.45, 1.45, vig) * 0.62);

  vec3 wood = vec3(0.11, 0.045, 0.018);
  col = mix(wood, col, inside);
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
  }
  return sh;
}

export function startGL(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error('WebGL2 unavailable');
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || 'program link failed');
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const loc = {
    cloth: gl.getUniformLocation(prog, 'uCloth'),
    cam: gl.getUniformLocation(prog, 'uCam'),
    lamp: gl.getUniformLocation(prog, 'uLamp[0]'),
    time: gl.getUniformLocation(prog, 'uTime'),
    mirror: gl.getUniformLocation(prog, 'uMirror'),
    exposure: gl.getUniformLocation(prog, 'uExposure'),
    haze: gl.getUniformLocation(prog, 'uHaze'),
  };
  const lampBuf = new Float32Array(12);
  gl.viewport(0, 0, canvas.width, canvas.height);

  return function draw(transCanvas, cam, lamps, exposure, haze, time) {
    if (gl.isContextLost()) throw new Error('WebGL context lost');
    gl.useProgram(prog);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, transCanvas);
    gl.uniform2f(loc.cloth, transCanvas.width, transCanvas.height);
    gl.uniform3f(loc.cam, cam.x, cam.y, cam.z);
    for (let i = 0; i < 4; i++) {
      const L = lamps[i] || { x: 0, y: 0, i: 0 };
      lampBuf[i * 3] = L.x;
      lampBuf[i * 3 + 1] = L.y;
      lampBuf[i * 3 + 2] = L.i;
    }
    gl.uniform3fv(loc.lamp, lampBuf);
    gl.uniform1f(loc.time, time);
    gl.uniform1f(loc.mirror, cam.mirror ? 1 : 0);
    gl.uniform1f(loc.exposure, exposure);
    gl.uniform1f(loc.haze, haze);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}
