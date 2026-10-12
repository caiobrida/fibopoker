import { ROOM_ID_LENGTH, type RoomSnapshot } from '@fibopoker/shared';
import { nanoid } from 'nanoid';
import { INITIAL_REVISION, snapshotOf, type Room } from './room.js';
import type { RoomRepository } from './room-repository.js';

export class CreateRoom {
  constructor(private readonly rooms: RoomRepository) {}

  async execute(): Promise<RoomSnapshot> {
    const room: Room = {
      id: nanoid(ROOM_ID_LENGTH),
      revision: INITIAL_REVISION,
      participants: [],
      rounds: [],
    };

    await this.rooms.create(room);

    return snapshotOf(room, null);
  }
}
