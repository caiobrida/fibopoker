import type { Clock } from './clock.js';
import { actingIn, roundHoldingAnEstimateBy } from './room.js';
import { RoomNotFoundError } from './room-errors.js';
import type { RoomRepository } from './room-repository.js';

export class LeaveRoom {
  constructor(
    private readonly rooms: RoomRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ roomId, token }: { roomId: string; token: string | null }): Promise<void> {
    const room = await this.rooms.findById(roomId);

    if (room === null) {
      throw new RoomNotFoundError(roomId);
    }

    const self = actingIn(room, token);
    const withdrawing = roundHoldingAnEstimateBy(room, self);

    await this.rooms.recordDeparture(room.id, {
      participantId: self.id,
      at: this.clock.now(),
      withdrawingFrom: withdrawing === null ? null : withdrawing.id,
    });
  }
}
