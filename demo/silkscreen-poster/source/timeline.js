// One grid for picture, voice, foley, and score. 96 BPM. Pulls are linear.

export const BPM = 96;
export const BEAT = 60 / 96;
export const DUR = 40;

export const INK = {
  paper: '#F6F1E4',
  sky1: '#F6CD98',
  sky2: '#EE9A73',
  far: '#9A7FA8',
  mid: '#3E7079',
  near: '#1E3B3F',
  accent: '#E8553D',
};

export const PULLS = {
  sun: [0.20, 1.875],
  sky: [2.95, 5.00],
  far: [5.00, 7.50],
  lit: [5.3125, 7.50],
  sea: [7.50, 10.00],
  land: [10.00, 12.50],
  pines: [10.3125, 12.50],
  wrong: [12.70, 14.05],
  hour: [17.65, 19.05],
  title: [19.20, 20.90],
  band: [23.80, 26.20],
};

export const DASHES = [17.8125, 18.4375, 19.0625, 19.6875, 20.3125, 20.9375];

export const LINES = [
  { id: 'v01', t: 0.55, show: 'The stair is not a path.' },
  { id: 'v02', t: 5.15, show: 'It shows when the water leaves.' },
  { id: 'v03', t: 10.45, show: 'The first pull misses the hour.' },
  { id: 'v04', t: 18.35, show: '4:10. One window.' },
  { id: 'v05', t: 26.10, show: 'Walk it before the tide comes back.' },
  { id: 'v06', t: 34.50, show: 'Then the sheet is the only stair left.' },
];

export const SILENCE = [
  { t: 15.55, d: 1.95 },
  { t: 32.15, d: 1.10 },
];

// Musical events. kind is interpreted in music/score.py.
export const NOTES = [
  { t: 0.20, kind: 'strum', pitches: ['D3', 'A3', 'D4'], dur: 1.5, vel: 0.30, pan: -0.12 },
  { t: 1.875, kind: 'strum', pitches: ['G3', 'B3', 'D4'], dur: 1.7, vel: 0.46, pan: 0.04 },
  { t: 1.875, kind: 'bass', pitch: 'G2', dur: 0.42, vel: 0.36, pan: -0.18 },
  { t: 3.125, kind: 'brush', pan: 0.25 },
  { t: 4.375, kind: 'brush', pan: -0.15 },
  { t: 5.00, kind: 'strum', pitches: ['D3', 'A3', 'F4'], dur: 1.6, vel: 0.48, pan: 0.0 },
  { t: 5.00, kind: 'bass', pitch: 'D2', dur: 0.45, vel: 0.38, pan: -0.16 },
  { t: 5.625, kind: 'brush', pan: 0.2 },
  { t: 6.875, kind: 'brush', pan: -0.1 },
  { t: 7.50, kind: 'strum', pitches: ['C3', 'G3', 'C4'], dur: 1.5, vel: 0.44, pan: -0.04 },
  { t: 7.50, kind: 'bass', pitch: 'C2', dur: 0.4, vel: 0.34, pan: -0.14 },
  { t: 8.125, kind: 'brush', pan: 0.18 },
  { t: 9.375, kind: 'brush', pan: -0.12 },
  { t: 10.00, kind: 'strum', pitches: ['G3', 'B3', 'D4'], dur: 1.45, vel: 0.42, pan: 0.08 },
  { t: 10.00, kind: 'bass', pitch: 'G2', dur: 0.38, vel: 0.34, pan: -0.12 },
  { t: 10.625, kind: 'brush', pan: 0.16 },
  { t: 11.875, kind: 'brush', pan: -0.08 },
  { t: 12.50, kind: 'strum', pitches: ['D3', 'A3', 'D4'], dur: 1.15, vel: 0.26, pan: 0.0 },
  { t: 13.125, kind: 'brush', pan: 0.1 },
  { t: 14.375, kind: 'brush', pan: -0.05 },
  { t: 17.50, kind: 'strum', pitches: ['D3', 'A3', 'D4', 'F#4'], dur: 2.1, vel: 0.70, pan: 0.0 },
  { t: 17.50, kind: 'bass', pitch: 'D2', dur: 0.62, vel: 0.55, pan: -0.1 },
  { t: 17.50, kind: 'harm', hz: 587.33, dur: 1.35, vel: 0.5, pan: 0.22 },
  { t: 17.8125, kind: 'pluck', pitch: 'D4', dur: 0.32, vel: 0.28, pan: 0.08 },
  { t: 18.4375, kind: 'pluck', pitch: 'E4', dur: 0.3, vel: 0.26, pan: 0.12 },
  { t: 19.0625, kind: 'pluck', pitch: 'F4', dur: 0.3, vel: 0.26, pan: 0.16 },
  { t: 19.6875, kind: 'pluck', pitch: 'G4', dur: 0.3, vel: 0.28, pan: 0.1 },
  { t: 20.3125, kind: 'pluck', pitch: 'A4', dur: 0.32, vel: 0.3, pan: 0.14 },
  { t: 20.9375, kind: 'pluck', pitch: 'D5', dur: 0.36, vel: 0.32, pan: 0.18 },
  { t: 22.50, kind: 'strum', pitches: ['D3', 'A3', 'D4'], dur: 1.35, vel: 0.38, pan: 0.0 },
  { t: 22.50, kind: 'bass', pitch: 'D2', dur: 0.4, vel: 0.34, pan: -0.12 },
  { t: 23.75, kind: 'brush', pan: 0.2 },
  { t: 25.00, kind: 'strum', pitches: ['G3', 'B3', 'D4'], dur: 1.4, vel: 0.4, pan: 0.05 },
  { t: 25.00, kind: 'bass', pitch: 'G2', dur: 0.38, vel: 0.32, pan: -0.1 },
  { t: 25.00, kind: 'harm', hz: 698.46, dur: 1.05, vel: 0.28, pan: 0.24 },
  { t: 26.25, kind: 'brush', pan: -0.1 },
  { t: 27.50, kind: 'strum', pitches: ['D3', 'A3', 'F4'], dur: 1.3, vel: 0.34, pan: -0.04 },
  { t: 28.75, kind: 'brush', pan: 0.12 },
  { t: 30.00, kind: 'strum', pitches: ['C3', 'G3', 'C4'], dur: 1.15, vel: 0.24, pan: 0.0 },
  { t: 31.25, kind: 'brush', pan: 0.08 },
  { t: 33.25, kind: 'slide', pitch: 'A3', dur: 1.55, vel: 0.48, pan: 0.06 },
  { t: 35.00, kind: 'strum', pitches: ['D3', 'A3', 'D4'], dur: 1.7, vel: 0.36, pan: -0.06 },
  { t: 35.00, kind: 'harm', hz: 587.33, dur: 1.5, vel: 0.26, pan: 0.16 },
  { t: 36.25, kind: 'bass', pitch: 'D2', dur: 0.48, vel: 0.3, pan: -0.12 },
  { t: 37.50, kind: 'strum', pitches: ['D3', 'A3', 'D4'], dur: 2.2, vel: 0.28, pan: 0.0 },
];

export function pullP(t, span) {
  const [a, b] = span;
  if (t <= a) return 0;
  if (t >= b) return 1;
  return (t - a) / (b - a);
}

export function loose(t) {
  if (t < 12.4) return 0;
  if (t < 13.3) return (t - 12.4) / 0.9;
  if (t < 17.5) return 1;
  if (t < 17.62) return 1 - (t - 17.5) / 0.12;
  return 0;
}

export function buildEV() {
  const ev = [];
  for (const n of NOTES) ev.push({ type: 'note', ...n });
  for (const s of SILENCE) ev.push({ type: 'silence', t: s.t, d: s.d });
  for (const line of LINES) ev.push({ type: 'vo', id: line.id, t: line.t });
  const blades = ['sun', 'sky', 'far', 'sea', 'land', 'wrong', 'hour', 'title', 'band'];
  for (const id of blades) {
    const [a, b] = PULLS[id];
    ev.push({ type: 'pull', id, t: a, d: +(b - a).toFixed(4), speed: +(1.7 / (b - a)).toFixed(3), pan: id === 'sun' ? -0.2 : 0.05 });
    ev.push({ type: 'squelch', t: a, pan: 0.1, seed: id.length * 3 });
  }
  ev.push({ type: 'clack', t: 2.50, pan: 0.0 });
  ev.push({ type: 'creak', t: 2.50, pan: -0.05 });
  ev.push({ type: 'clamp', t: 17.50, pan: 0.0, gain: 1 });
  ev.push({ type: 'clip', t: 36.60, pan: 0.15 });
  for (let i = 0; i < DASHES.length; i++) ev.push({ type: 'stamp', t: DASHES[i], pan: -0.05 + i * 0.06 });
  ev.push({ type: 'surf', t: 9.0, d: 13.0 });
  ev.push({ type: 'hiss', t: 0, d: DUR });
  ev.push({ type: 'room', t: 0, d: DUR });
  return ev;
}
