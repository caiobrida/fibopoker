import type { Room } from '../domain/room.js';
import type { RoomRepository } from '../domain/room-repository.js';
import type { PrismaClient } from '../generated/prisma/client.js';

export class PrismaRoomRepository implements RoomRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(room: Room): Promise<void> {
    await this.prisma.room.create({ data: room });
  }

  findById(id: string): Promise<Room | null> {
    return this.prisma.room.findUnique({ where: { id } });
  }
}
