import { ROUND_ID_LENGTH, type OpenRoundResponse } from '@fibopoker/shared';
import { nanoid } from 'nanoid';
import type { Clock } from './clock.js';
import { actingIn, openRoundOf } from './room.js';
import { RoomNotFoundError, RoundAlreadyOpenError } from './room-errors.js';
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

    actingIn(room, token);

    if (openRoundOf(room) !== null) {
      throw new RoundAlreadyOpenError();
    }

    const round: Round = {
      id: nanoid(ROUND_ID_LENGTH),
      title,
      openedAt: this.clock.now(),
      revealedAt: null,
      finalEstimate: null,
      estimates: [],
    };

    await this.rooms.openRound(room.id, round);

    return { id: round.id };
  }
}
