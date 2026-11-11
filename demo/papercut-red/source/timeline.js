// Single clock for Eighth Fold. Score and cuecheck read UNFOLD from this file.
export const DUR = 40;

// Eight panels, left to right. Gaps tighten: the unfold accelerates.
export const UNFOLD = [10.00, 10.55, 11.05, 11.48, 11.86, 12.18, 12.46, 12.70];

export const EV = [
  { t: 0.82, type: 'fold' },
  { t: 0.86, type: 'crease' },
  { t: 4.15, type: 'snip' },
  { t: 4.55, type: 'snip' },
  { t: 4.62, type: 'drop' },
  { t: 5.35, type: 'pat' },
  ...UNFOLD.map((t) => ({ t, type: 'snap' })),
  { t: 18.35, type: 'lift' },
  { t: 18.90, type: 'slide' },
  { t: 28.50, type: 'peel' },
  { t: 28.50, type: 'step' },
  { t: 29.40, type: 'lamp' },
];
