import type { Participant } from '../domain/participant.js';
import type { Room } from '../domain/room.js';
import { RoomNotFoundError, RoundAlreadyRevealedError } from '../domain/room-errors.js';
import type { RoomRepository } from '../domain/room-repository.js';
import { isOpen, type Estimate, type Round } from '../domain/round.js';

function stillOpen(round: Round): Round {
  if (!isOpen(round)) {
    throw new RoundAlreadyRevealedError();
  }

  return round;
}

function copyOfRound(round: Round): Round {
  return { ...round, estimates: round.estimates.map((estimate) => ({ ...estimate })) };
}

function copyOf(room: Room): Room {
  return {
    ...room,
    participants: room.participants.map((participant) => ({ ...participant })),
    rounds: room.rounds.map(copyOfRound),
  };
}

function holding(estimates: Estimate[], cast: Estimate): Estimate[] {
  const replacing = estimates.some(({ participantId }) => participantId === cast.participantId);

  return replacing
    ? estimates.map((estimate) =>
        estimate.participantId === cast.participantId ? { ...cast } : estimate,
      )
    : [...estimates, { ...cast }];
}

export class InMemoryRoomRepository implements RoomRepository {
  private readonly rooms = new Map<string, Room>();

  async create(room: Room): Promise<void> {
    this.rooms.set(room.id, copyOf(room));
  }

  async findById(id: string): Promise<Room | null> {
    const room = this.rooms.get(id);

    return room === undefined ? null : copyOf(room);
  }

  async addParticipant(roomId: string, participant: Participant): Promise<void> {
    this.bumpingRevision(roomId, (room) => ({
      ...room,
      participants: [...room.participants, { ...participant }],
    }));
  }

  async markSeen(roomId: string, participantId: string, at: Date): Promise<void> {
    const room = this.rooms.get(roomId);

    if (room === undefined) {
      throw new RoomNotFoundError(roomId);
    }

    this.rooms.set(roomId, {
      ...room,
      participants: room.participants.map((participant) =>
        participant.id === participantId ? { ...participant, lastSeenAt: at } : participant,
      ),
    });
  }

  async openRound(roomId: string, round: Round): Promise<void> {
    this.bumpingRevision(roomId, (room) => ({
      ...room,
      rounds: [...room.rounds, copyOfRound(round)],
    }));
  }

  async castEstimate(roomId: string, roundId: string, estimate: Estimate): Promise<void> {
    this.bumpingRevision(roomId, (room) => ({
      ...room,
      rounds: room.rounds.map((round) =>
        round.id === roundId
          ? { ...stillOpen(round), estimates: holding(round.estimates, estimate) }
          : round,
      ),
    }));
  }

  async revealRound(roomId: string, roundId: string, at: Date): Promise<void> {
    this.bumpingRevision(roomId, (room) => ({
      ...room,
      rounds: room.rounds.map((round) =>
        round.id === roundId ? { ...stillOpen(round), revealedAt: at } : round,
      ),
    }));
  }

  private bumpingRevision(roomId: string, write: (room: Room) => Room): void {
    const room = this.rooms.get(roomId);

    if (room === undefined) {
      throw new RoomNotFoundError(roomId);
    }

    this.rooms.set(roomId, { ...write(room), revision: room.revision + 1 });
  }
}
