export type Moment = 'feedback' | 'departure' | 'settle' | 'arrival';

export function motionDuration(moment: Moment): number {
  const declared = getComputedStyle(document.documentElement)
    .getPropertyValue(`--duration-${moment}`)
    .trim();
  const value = Number.parseFloat(declared);

  if (Number.isNaN(value)) {
    return 0;
  }

  return declared.endsWith('ms') ? value : value * 1000;
}
