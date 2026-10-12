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
  estimates: Estimate[];
};

export function isOpen(round: Round): boolean {
  return round.revealedAt === null;
}

export function estimateBy(round: Round, participantId: string): Estimate | null {
  return round.estimates.find((estimate) => estimate.participantId === participantId) ?? null;
}
