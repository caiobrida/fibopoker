import type { RoomSnapshot } from '@fibopoker/shared';
import { NO_FINAL_ESTIMATE, STILL_OPEN, UNTITLED_ROUND } from './round-wording.ts';

function onOneLine(title: string): string {
  return title.replace(/\s+/gu, ' ');
}

function nameOf(title: string | null): string {
  return title === null ? UNTITLED_ROUND : onOneLine(title);
}

function outcomeOf(round: NonNullable<RoomSnapshot['round']>): string {
  if (round.state === 'open') {
    return STILL_OPEN;
  }

  return round.finalEstimate ?? NO_FINAL_ESTIMATE;
}

function lineFor(title: string | null, outcome: string): string {
  return `${nameOf(title)} → ${outcome}`;
}

function everyLineIn({ history, round }: RoomSnapshot): string[] {
  const finished = history.map(({ title, finalEstimate }) =>
    lineFor(title, finalEstimate ?? NO_FINAL_ESTIMATE),
  );

  return round === null ? finished : [...finished, lineFor(round.title, outcomeOf(round))];
}

export function roundsAsText(room: RoomSnapshot): string {
  return everyLineIn(room).join('\n');
}
