import { actingIn, roundHoldingAnEstimateBy } from './room.js';
import { EstimateAlreadyCastError, RoomNotFoundError } from './room-errors.js';
import type { RoomRepository } from './room-repository.js';

export class SetSpectating {
  constructor(private readonly rooms: RoomRepository) {}

  async execute({
    roomId,
    token,
    spectating,
  }: {
    roomId: string;
    token: string | null;
    spectating: boolean;
  }): Promise<void> {
    const room = await this.rooms.findById(roomId);

    if (room === null) {
      throw new RoomNotFoundError(roomId);
    }

    const self = actingIn(room, token);

    if (spectating && roundHoldingAnEstimateBy(room, self) !== null) {
      throw new EstimateAlreadyCastError();
    }

    await this.rooms.setSpectating(room.id, self.id, spectating);
  }
}
