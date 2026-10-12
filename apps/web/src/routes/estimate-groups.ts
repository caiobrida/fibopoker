import { DECK, type RevealedEstimate } from '@fibopoker/shared';

export type Standing = 'neutral' | 'agreed' | 'lowest' | 'highest';

export type EstimateGroup = {
  value: string;
  howMany: number;
  standing: Standing;
};

function asNumber(value: string): number | null {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function deckPosition(value: string): number {
  const offered = (DECK as readonly string[]).indexOf(value);

  return offered === -1 ? DECK.length : offered;
}

function inReadingOrder(one: EstimateGroup, other: EstimateGroup): number {
  const mine = asNumber(one.value);
  const theirs = asNumber(other.value);

  if (mine !== null && theirs !== null) {
    return mine - theirs;
  }

  if (mine === null && theirs === null) {
    return deckPosition(one.value) - deckPosition(other.value);
  }

  return mine === null ? 1 : -1;
}

function standingOf(
  value: string,
  howMany: number,
  lowest: number | null,
  highest: number | null,
): Standing {
  const number = asNumber(value);

  if (number === null) {
    return 'neutral';
  }

  if (lowest === highest) {
    return howMany > 1 ? 'agreed' : 'neutral';
  }

  if (number === lowest) {
    return 'lowest';
  }

  return number === highest ? 'highest' : 'neutral';
}

export function groupedEstimates(estimates: RevealedEstimate[]): EstimateGroup[] {
  const howMany = new Map<string, number>();

  for (const { value } of estimates) {
    howMany.set(value, (howMany.get(value) ?? 0) + 1);
  }

  const numbers = [...howMany.keys()]
    .map(asNumber)
    .filter((number): number is number => number !== null);

  const lowest = numbers.length === 0 ? null : Math.min(...numbers);
  const highest = numbers.length === 0 ? null : Math.max(...numbers);

  return [...howMany]
    .map(([value, count]) => ({
      value,
      howMany: count,
      standing: standingOf(value, count, lowest, highest),
    }))
    .sort(inReadingOrder);
}

export const STANDING_READS_AS: Record<Standing, string> = {
  neutral: '',
  agreed: ', agreed',
  lowest: ', the lowest',
  highest: ', the highest',
};

export function standingOfEachValue(estimates: RevealedEstimate[]): Map<string, Standing> {
  return new Map(groupedEstimates(estimates).map(({ value, standing }) => [value, standing]));
}
