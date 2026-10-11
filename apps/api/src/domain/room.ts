import type { RoomSnapshot } from '@fibopoker/shared';
import type { Participant } from './participant.js';
import { hashedToken } from './participant.js';

export const INITIAL_REVISION = 1;

export const ACTIVITY_WINDOW_MS = 120_000;

export type Room = {
  id: string;
  revision: number;
  participants: Participant[];
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

export function snapshotOf(room: Room, self: Participant | null): RoomSnapshot {
  return {
    id: room.id,
    revision: room.revision,
    participants: [...room.participants]
      .sort(byArrival)
      .map(({ id, nickname }) => ({ id, nickname })),
    selfId: self === null ? null : self.id,
  };
}

export function participantHolding(room: Room, token: string): Participant | null {
  const presented = hashedToken(token);

  return room.participants.find(({ tokenHash }) => tokenHash === presented) ?? null;
}
