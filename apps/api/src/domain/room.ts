import type { RoomSnapshot } from '@fibopoker/shared';
import type { Participant } from './participant.js';
import { hashedToken } from './participant.js';
import { UnknownParticipantError } from './room-errors.js';
import { estimateBy, isOpen, type Round } from './round.js';

export const INITIAL_REVISION = 1;

export const ACTIVITY_WINDOW_MS = 120_000;

export type Room = {
  id: string;
  revision: number;
  participants: Participant[];
  rounds: Round[];
};

function byArrival(one: Participant, other: Participant): number {
  return one.joinedAt.getTime() - other.joinedAt.getTime() || one.id.localeCompare(other.id);
}

export function seenAt(room: Room, self: Participant, at: Date): Room {
  return {
    ...room,
    participants: room.participants.map((participant) =>
      participant.id === self.id ? { ...participant, lastSeenAt: at } : participant,
    ),
  };
}

export function presentAt(room: Room, now: Date): Room {
  const windowOpened = now.getTime() - ACTIVITY_WINDOW_MS;

  return {
    ...room,
    participants: room.participants.filter(
      ({ lastSeenAt }) => lastSeenAt.getTime() >= windowOpened,
    ),
  };
}

export function openRoundOf(room: Room): Round | null {
  return room.rounds.find(isOpen) ?? null;
}

function roundOf(round: Round, self: Participant | null): RoomSnapshot['round'] {
  return {
    id: round.id,
    title: round.title,
    selfEstimate: self === null ? null : (estimateBy(round, self.id)?.value ?? null),
  };
}

export function snapshotOf(room: Room, self: Participant | null): RoomSnapshot {
  const round = openRoundOf(room);
  const voted = new Set(round?.estimates.map(({ participantId }) => participantId) ?? []);

  return {
    id: room.id,
    revision: room.revision,
    participants: [...room.participants].sort(byArrival).map(({ id, nickname }) => ({
      id,
      nickname,
      hasVoted: voted.has(id),
    })),
    selfId: self === null ? null : self.id,
    round: round === null ? null : roundOf(round, self),
  };
}

export function participantHolding(room: Room, token: string): Participant | null {
  const presented = hashedToken(token);

  return room.participants.find(({ tokenHash }) => tokenHash === presented) ?? null;
}

export function actingIn(room: Room, token: string | null): Participant {
  const self = token === null ? null : participantHolding(room, token);

  if (self === null) {
    throw new UnknownParticipantError();
  }

  return self;
}
