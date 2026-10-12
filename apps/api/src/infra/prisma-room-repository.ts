import type { Departure, Participant } from '../domain/participant.js';
import type { Room } from '../domain/room.js';
import { RoundAlreadyRevealedError, RoundStillOpenError } from '../domain/room-errors.js';
import type { RoomRepository } from '../domain/room-repository.js';
import type { Estimate, Round } from '../domain/round.js';
import type { Prisma, PrismaClient } from '../generated/prisma/client.js';

async function stillOpen(
  transaction: Prisma.TransactionClient,
  roomId: string,
  roundId: string,
): Promise<void> {
  const open = await transaction.round.findFirst({
    where: { id: roundId, roomId, revealedAt: null },
    select: { id: true },
  });

  if (open === null) {
    throw new RoundAlreadyRevealedError();
  }
}

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
        ({ id: participantId, nickname, tokenHash, spectating, joinedAt, lastSeenAt, leftAt }) => ({
          id: participantId,
          nickname,
          tokenHash,
          spectating,
          joinedAt,
          lastSeenAt,
          leftAt,
        }),
      ),
      rounds: room.rounds.map(
        ({ id: roundId, title, openedAt, revealedAt, finalEstimate, estimates }) => ({
          id: roundId,
          title,
          openedAt,
          revealedAt,
          finalEstimate,
          estimates: estimates.map(({ participantId, value, castAt }) => ({
            participantId,
            value,
            castAt,
          })),
        }),
      ),
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

  rename(roomId: string, participantId: string, nickname: string): Promise<void> {
    return this.bumpingRevision(roomId, (transaction) =>
      transaction.participant.update({ where: { id: participantId, roomId }, data: { nickname } }),
    );
  }

  setSpectating(roomId: string, participantId: string, spectating: boolean): Promise<void> {
    return this.bumpingRevision(roomId, (transaction) =>
      transaction.participant.update({
        where: { id: participantId, roomId },
        data: { spectating },
      }),
    );
  }

  recordDeparture(roomId: string, departure: Departure): Promise<void> {
    const { participantId, at, withdrawingFrom } = departure;

    return this.bumpingRevision(roomId, async (transaction) => {
      await transaction.participant.update({
        where: { id: participantId, roomId },
        data: { leftAt: at },
      });

      if (withdrawingFrom === null) {
        return;
      }

      await transaction.estimate.deleteMany({
        where: { roundId: withdrawingFrom, participantId, round: { roomId, revealedAt: null } },
      });
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
          finalEstimate: round.finalEstimate,
        },
      }),
    );
  }

  castEstimate(roomId: string, roundId: string, estimate: Estimate): Promise<void> {
    const { participantId, value, castAt } = estimate;

    return this.bumpingRevision(roomId, async (transaction) => {
      await stillOpen(transaction, roomId, roundId);

      await transaction.estimate.upsert({
        where: { roundId_participantId: { roundId, participantId } },
        create: { roundId, participantId, value, castAt },
        update: { value, castAt },
      });
    });
  }

  revealRound(roomId: string, roundId: string, at: Date): Promise<void> {
    return this.bumpingRevision(roomId, async (transaction) => {
      const { count } = await transaction.round.updateMany({
        where: { id: roundId, roomId, revealedAt: null },
        data: { revealedAt: at },
      });

      if (count === 0) {
        throw new RoundAlreadyRevealedError();
      }
    });
  }

  setFinalEstimate(roomId: string, roundId: string, value: string): Promise<void> {
    return this.bumpingRevision(roomId, async (transaction) => {
      const { count } = await transaction.round.updateMany({
        where: { id: roundId, roomId, revealedAt: { not: null } },
        data: { finalEstimate: value },
      });

      if (count === 0) {
        throw new RoundStillOpenError();
      }
    });
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
