import type { RoomSnapshot } from '@fibopoker/shared';
import { participantHolding, snapshotOf } from './room.js';
import { RoomNotFoundError, UnknownParticipantError } from './room-errors.js';
import type { RoomRepository } from './room-repository.js';

export class GetRoomSnapshot {
  constructor(private readonly rooms: RoomRepository) {}

  async execute({
    roomId,
    token,
  }: {
    roomId: string;
    token: string | null;
  }): Promise<RoomSnapshot> {
    const room = await this.rooms.findById(roomId);

    if (room === null) {
      throw new RoomNotFoundError(roomId);
    }

    if (token === null) {
      return snapshotOf(room, null);
    }

    const self = participantHolding(room, token);

    if (self === null) {
      throw new UnknownParticipantError();
    }

    return snapshotOf(room, self);
  }
}
