export type Moment = 'feedback' | 'departure' | 'settle' | 'arrival';

export function motionDuration(moment: Moment): number {
  const declared = getComputedStyle(document.documentElement).getPropertyValue(
    `--duration-${moment}`,
  );
  const milliseconds = Number.parseFloat(declared);

  return Number.isNaN(milliseconds) ? 0 : milliseconds;
}
