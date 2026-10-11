import type { Participant } from '../domain/participant.js';
import type { Room } from '../domain/room.js';
import { RoomNotFoundError } from '../domain/room-errors.js';
import type { RoomRepository } from '../domain/room-repository.js';

function copyOf(room: Room): Room {
  return { ...room, participants: room.participants.map((participant) => ({ ...participant })) };
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

  private bumpingRevision(roomId: string, write: (room: Room) => Room): void {
    const room = this.rooms.get(roomId);

    if (room === undefined) {
      throw new RoomNotFoundError(roomId);
    }

    this.rooms.set(roomId, { ...write(room), revision: room.revision + 1 });
  }
}
