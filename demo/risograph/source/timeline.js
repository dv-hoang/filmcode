export const DUR = 40;
export const BPM = 96;

export const VOICE = [
  { id: 'v01', t0: 2.5, text: 'The night boat held the dark.' },
  { id: 'v02', t0: 12.5, text: 'She waited for the other drum.' },
  { id: 'v03', t0: 16.25, text: 'Pink came in with the mail.' },
  { id: 'v04', t0: 21.25, text: 'They looked, and did not touch.' },
  { id: 'v05', t0: 28.75, text: 'Where the wakes crossed, a path.' },
  { id: 'v06', t0: 33.125, text: 'Home.' },
];

export const HIT = {
  feed: 0.08,
  silence1: 10,
  silence1End: 12.5,
  motorMail: 14.2,
  pink: 15,
  look: 20,
  silence2: 26.2,
  silence2End: 27.5,
  buoy: 26.6,
  cross: 27.5,
  sheet: 32.5,
  land: 34.1,
  pin: 34.6,
  title: 35.8,
};

export const TIMELINE = { dur: DUR, bpm: BPM, voice: VOICE, hit: HIT };
