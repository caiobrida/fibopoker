import { isInTheDeck } from '@fibopoker/shared';
import { actingIn, revealedRoundIn } from './room.js';
import { EstimateOutsideTheDeckError, RoomNotFoundError } from './room-errors.js';
import type { RoomRepository } from './room-repository.js';

export class SetFinalEstimate {
  constructor(private readonly rooms: RoomRepository) {}

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

    actingIn(room, token);

    const round = revealedRoundIn(room, roundId);

    if (!isInTheDeck(value)) {
      throw new EstimateOutsideTheDeckError();
    }

    await this.rooms.setFinalEstimate(room.id, round.id, value);
  }
}
