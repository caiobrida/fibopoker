import type { Participant } from '../domain/participant.js';
import type { Room } from '../domain/room.js';
import type { RoomRepository } from '../domain/room-repository.js';
import type { Prisma, PrismaClient } from '../generated/prisma/client.js';

export class PrismaRoomRepository implements RoomRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(room: Room): Promise<void> {
    await this.prisma.room.create({ data: { id: room.id, revision: room.revision } });
  }

  async findById(id: string): Promise<Room | null> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (room === null) {
      return null;
    }

    return {
      id: room.id,
      revision: room.revision,
      participants: room.participants.map(
        ({ id: participantId, nickname, tokenHash, joinedAt }) => ({
          id: participantId,
          nickname,
          tokenHash,
          joinedAt,
        }),
      ),
    };
  }

  addParticipant(roomId: string, participant: Participant): Promise<void> {
    return this.bumpingRevision(roomId, (transaction) =>
      transaction.participant.create({ data: { ...participant, roomId } }),
    );
  }

  private async bumpingRevision(
    roomId: string,
    write: (transaction: Prisma.TransactionClient) => Promise<unknown>,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.room.update({
        where: { id: roomId },
        data: { revision: { increment: 1 } },
      });

      await write(transaction);
    });
  }
}
