import type { Participant } from '@fibopoker/shared';

function same(one: string, other: string): boolean {
  return one.toLowerCase() === other.toLowerCase();
}

export function alreadyAtTheTable(participants: Participant[], nickname: string): boolean {
  return participants.some((participant) => same(participant.nickname, nickname));
}

export function sharedWithSomebodyElse(participants: Participant[], self: Participant): boolean {
  return participants.some(
    (participant) => participant.id !== self.id && same(participant.nickname, self.nickname),
  );
}
