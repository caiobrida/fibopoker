import type { RevealedEstimate, RoomSnapshot } from '@fibopoker/shared';
import type { Participant } from './participant.js';
import { hashedToken } from './participant.js';
import {
  RoundAlreadyOpenError,
  RoundAlreadyRevealedError,
  RoundNotFoundError,
  RoundStillOpenError,
  UnknownParticipantError,
} from './room-errors.js';
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

function openRoundOf(room: Room): Round | null {
  return room.rounds.find(isOpen) ?? null;
}

export function noRoundOpenIn(room: Room): void {
  if (openRoundOf(room) !== null) {
    throw new RoundAlreadyOpenError();
  }
}

export function currentRoundOf(room: Room): Round | null {
  return room.rounds.at(-1) ?? null;
}

function roundIn(room: Room, roundId: string): Round {
  const round = room.rounds.find(({ id }) => id === roundId);

  if (round === undefined) {
    throw new RoundNotFoundError(roundId);
  }

  return round;
}

export function openRoundIn(room: Room, roundId: string): Round {
  const round = roundIn(room, roundId);

  if (!isOpen(round)) {
    throw new RoundAlreadyRevealedError();
  }

  return round;
}

export function revealedRoundIn(room: Room, roundId: string): Round {
  const round = roundIn(room, roundId);

  if (isOpen(round)) {
    throw new RoundStillOpenError();
  }

  return round;
}

function byParticipant(one: RevealedEstimate, other: RevealedEstimate): number {
  if (one.participantId === other.participantId) {
    return 0;
  }

  return one.participantId < other.participantId ? -1 : 1;
}

function roundOf(round: Round, self: Participant | null): RoomSnapshot['round'] {
  const identity = { id: round.id, title: round.title };

  if (!isOpen(round)) {
    return {
      ...identity,
      state: 'revealed',
      estimates: round.estimates
        .map(({ participantId, value }) => ({ participantId, value }))
        .sort(byParticipant),
      finalEstimate: round.finalEstimate,
    };
  }

  return {
    ...identity,
    state: 'open',
    selfEstimate: self === null ? null : (estimateBy(round, self.id)?.value ?? null),
  };
}

function finishedRoundsOf(room: Room): RoomSnapshot['history'] {
  return room.rounds
    .slice(0, -1)
    .map(({ id, title, finalEstimate }) => ({ id, title, finalEstimate }));
}

export function snapshotOf(room: Room, self: Participant | null): RoomSnapshot {
  const round = currentRoundOf(room);
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
    history: finishedRoundsOf(room),
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
