import type { RoomSnapshot } from '@fibopoker/shared';
import { RoomNotFoundError } from './room-errors.js';
import { snapshotOf } from './room.js';
import type { RoomRepository } from './room-repository.js';

export class GetRoomSnapshot {
  constructor(private readonly rooms: RoomRepository) {}

  async execute(roomId: string): Promise<RoomSnapshot> {
    const room = await this.rooms.findById(roomId);

    if (room === null) {
      throw new RoomNotFoundError(roomId);
    }

    return snapshotOf(room);
  }
}
