import { isInTheDeck } from '@fibopoker/shared';
import type { Clock } from './clock.js';
import { participantHolding, roundIn } from './room.js';
import {
  EstimateOutsideTheDeckError,
  RoomNotFoundError,
  RoundNotFoundError,
  UnknownParticipantError,
} from './room-errors.js';
import type { RoomRepository } from './room-repository.js';

export class CastEstimate {
  constructor(
    private readonly rooms: RoomRepository,
    private readonly clock: Clock,
  ) {}

  async execute({
    roomId,
    roundId,
    token,
    value,
  }: {
    roomId: string;
    roundId: string;
    token: string | null;
    value: string;
  }): Promise<void> {
    const room = await this.rooms.findById(roomId);

    if (room === null) {
      throw new RoomNotFoundError(roomId);
    }

    const self = token === null ? null : participantHolding(room, token);

    if (self === null) {
      throw new UnknownParticipantError();
    }

    const round = roundIn(room, roundId);

    if (round === null) {
      throw new RoundNotFoundError(roundId);
    }

    if (!isInTheDeck(value)) {
      throw new EstimateOutsideTheDeckError(value);
    }

    const now = this.clock.now();

    await this.rooms.castEstimate(room.id, round.id, {
      participantId: self.id,
      value,
      castAt: now,
    });
    await this.rooms.markSeen(room.id, self.id, now);
  }
}
