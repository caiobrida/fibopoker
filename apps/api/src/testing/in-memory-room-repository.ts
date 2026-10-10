import type { Room } from '../domain/room.js';
import type { RoomRepository } from '../domain/room-repository.js';

export class InMemoryRoomRepository implements RoomRepository {
  private readonly rooms = new Map<string, Room>();

  async create(room: Room): Promise<void> {
    this.rooms.set(room.id, { ...room });
  }

  async findById(id: string): Promise<Room | null> {
    const room = this.rooms.get(id);

    return room === undefined ? null : { ...room };
  }
}
