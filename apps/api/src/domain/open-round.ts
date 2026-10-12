import { ROUND_ID_LENGTH, type OpenRoundResponse } from '@fibopoker/shared';
import { nanoid } from 'nanoid';
import type { Clock } from './clock.js';
import { openRoundOf, participantHolding } from './room.js';
import {
  RoomNotFoundError,
  RoundAlreadyOpenError,
  UnknownParticipantError,
} from './room-errors.js';
import type { RoomRepository } from './room-repository.js';
import type { Round } from './round.js';

export class OpenRound {
  constructor(
    private readonly rooms: RoomRepository,
    private readonly clock: Clock,
  ) {}

  async execute({
    roomId,
    token,
    title,
  }: {
    roomId: string;
    token: string | null;
    title: string | null;
  }): Promise<OpenRoundResponse> {
    const room = await this.rooms.findById(roomId);

    if (room === null) {
      throw new RoomNotFoundError(roomId);
    }

    const self = token === null ? null : participantHolding(room, token);

    if (self === null) {
      throw new UnknownParticipantError();
    }

    if (openRoundOf(room) !== null) {
      throw new RoundAlreadyOpenError();
    }

    const now = this.clock.now();
    const round: Round = {
      id: nanoid(ROUND_ID_LENGTH),
      title,
      openedAt: now,
      revealedAt: null,
      estimates: [],
    };

    await this.rooms.openRound(room.id, round);
    await this.rooms.markSeen(room.id, self.id, now);

    return { id: round.id };
  }
}
