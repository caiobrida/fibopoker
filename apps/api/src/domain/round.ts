import { ROUND_ID_LENGTH } from '@fibopoker/shared';
import { nanoid } from 'nanoid';

export type Estimate = {
  participantId: string;
  value: string;
  castAt: Date;
};

export type Round = {
  id: string;
  title: string | null;
  openedAt: Date;
  revealedAt: Date | null;
  finalEstimate: string | null;
  estimates: Estimate[];
};

export function freshRound(title: string | null, openedAt: Date): Round {
  return {
    id: nanoid(ROUND_ID_LENGTH),
    title,
    openedAt,
    revealedAt: null,
    finalEstimate: null,
    estimates: [],
  };
}

export function isOpen(round: Round): boolean {
  return round.revealedAt === null;
}

export function estimateBy(round: Round, participantId: string): Estimate | null {
  return round.estimates.find((estimate) => estimate.participantId === participantId) ?? null;
}
