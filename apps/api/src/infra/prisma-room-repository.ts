import type { Participant } from '../domain/participant.js';
import type { Room } from '../domain/room.js';
import type { RoomRepository } from '../domain/room-repository.js';
import type { Estimate, Round } from '../domain/round.js';
import type { Prisma, PrismaClient } from '../generated/prisma/client.js';

export class PrismaRoomRepository implements RoomRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(room: Room): Promise<void> {
    await this.prisma.room.create({ data: { id: room.id, revision: room.revision } });
  }

  async findById(id: string): Promise<Room | null> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        participants: true,
        rounds: { include: { estimates: true }, orderBy: { openedAt: 'asc' } },
      },
    });

    if (room === null) {
      return null;
    }

    return {
      id: room.id,
      revision: room.revision,
      participants: room.participants.map(
        ({ id: participantId, nickname, tokenHash, joinedAt, lastSeenAt }) => ({
          id: participantId,
          nickname,
          tokenHash,
          joinedAt,
          lastSeenAt,
        }),
      ),
      rounds: room.rounds.map(({ id: roundId, title, openedAt, revealedAt, estimates }) => ({
        id: roundId,
        title,
        openedAt,
        revealedAt,
        estimates: estimates.map(({ participantId, value, castAt }) => ({
          participantId,
          value,
          castAt,
        })),
      })),
    };
  }

  addParticipant(roomId: string, participant: Participant): Promise<void> {
    return this.bumpingRevision(roomId, (transaction) =>
      transaction.participant.create({ data: { ...participant, roomId } }),
    );
  }

  async markSeen(roomId: string, participantId: string, at: Date): Promise<void> {
    await this.prisma.participant.update({
      where: { id: participantId, roomId },
      data: { lastSeenAt: at },
    });
  }

  openRound(roomId: string, round: Round): Promise<void> {
    return this.bumpingRevision(roomId, (transaction) =>
      transaction.round.create({
        data: {
          id: round.id,
          roomId,
          title: round.title,
          openedAt: round.openedAt,
          revealedAt: round.revealedAt,
        },
      }),
    );
  }

  castEstimate(roomId: string, roundId: string, estimate: Estimate): Promise<void> {
    const { participantId, value, castAt } = estimate;

    return this.bumpingRevision(roomId, (transaction) =>
      transaction.estimate.upsert({
        where: { roundId_participantId: { roundId, participantId } },
        create: { roundId, participantId, value, castAt },
        update: { value, castAt },
      }),
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
