import { isInTheDeck } from '@fibopoker/shared';
import type { Clock } from './clock.js';
import { actingIn, openRoundOf } from './room.js';
import {
  EstimateOutsideTheDeckError,
  RoomNotFoundError,
  RoundNotFoundError,
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

    const self = actingIn(room, token);
    const round = openRoundOf(room);

    if (round === null || round.id !== roundId) {
      throw new RoundNotFoundError(roundId);
    }

    if (!isInTheDeck(value)) {
      throw new EstimateOutsideTheDeckError();
    }

    await this.rooms.castEstimate(room.id, round.id, {
      participantId: self.id,
      value,
      castAt: this.clock.now(),
    });
  }
}
