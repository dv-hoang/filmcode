// WebGL2 grade: a light vignette, a small contrast lift, ordered-ish dither.
// The visible frame stays on the 2D canvas; this pass only colours it.

const VS = `attribute vec2 p; varying vec2 v;
void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `precision mediump float; varying vec2 v; uniform sampler2D u; uniform float vig;
void main() {
  vec3 c = texture2D(u, v).rgb;
  c = pow(max(c, vec3(0.0)), vec3(0.97));
  c = (c - 0.5) * 1.05 + 0.5;
  float d = distance(v, vec2(0.5, 0.46));
  c *= 1.0 - vig * smoothstep(0.62, 1.08, d);
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * (1.4 / 255.0);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

let gl = null;
let failed = false;

function compile(glc, type, src) {
  const sh = glc.createShader(type);
  glc.shaderSource(sh, src);
  glc.compileShader(sh);
  if (!glc.getShaderParameter(sh, glc.COMPILE_STATUS)) {
    throw new Error(glc.getShaderInfoLog(sh) || 'shader');
  }
  return sh;
}

function init() {
  if (gl || failed) return gl;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const glc = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true });
    if (!glc) throw new Error('webgl2 missing');
    const prog = glc.createProgram();
    glc.attachShader(prog, compile(glc, glc.VERTEX_SHADER, VS));
    glc.attachShader(prog, compile(glc, glc.FRAGMENT_SHADER, FS));
    glc.linkProgram(prog);
    if (!glc.getProgramParameter(prog, glc.LINK_STATUS)) throw new Error(glc.getProgramInfoLog(prog) || 'link');
    glc.useProgram(prog);
    const buf = glc.createBuffer();
    glc.bindBuffer(glc.ARRAY_BUFFER, buf);
    glc.bufferData(glc.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), glc.STATIC_DRAW);
    const loc = glc.getAttribLocation(prog, 'p');
    glc.enableVertexAttribArray(loc);
    glc.vertexAttribPointer(loc, 2, glc.FLOAT, false, 0, 0);
    const tex = glc.createTexture();
    glc.bindTexture(glc.TEXTURE_2D, tex);
    glc.texParameteri(glc.TEXTURE_2D, glc.TEXTURE_MIN_FILTER, glc.LINEAR);
    glc.texParameteri(glc.TEXTURE_2D, glc.TEXTURE_MAG_FILTER, glc.LINEAR);
    glc.texParameteri(glc.TEXTURE_2D, glc.TEXTURE_WRAP_S, glc.CLAMP_TO_EDGE);
    glc.texParameteri(glc.TEXTURE_2D, glc.TEXTURE_WRAP_T, glc.CLAMP_TO_EDGE);
    glc.pixelStorei(glc.UNPACK_FLIP_Y_WEBGL, true);
    glc.uniform1i(glc.getUniformLocation(prog, 'u'), 0);
    gl = { glc, prog, tex, canvas, vig: glc.getUniformLocation(prog, 'vig') };
  } catch (err) {
    failed = true;
    console.error(err);
    gl = null;
  }
  return gl;
}

export function grade(source, dest, vig) {
  const g = init();
  if (!g) {
    dest.drawImage(source, 0, 0);
    return;
  }
  const { glc } = g;
  glc.uniform1f(g.vig, vig);
  glc.bindTexture(glc.TEXTURE_2D, g.tex);
  glc.texImage2D(glc.TEXTURE_2D, 0, glc.RGBA, glc.RGBA, glc.UNSIGNED_BYTE, source);
  glc.viewport(0, 0, 1920, 1080);
  glc.drawArrays(glc.TRIANGLE_STRIP, 0, 4);
  dest.drawImage(g.canvas, 0, 0);
}
