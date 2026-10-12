import type { OpenRoundResponse } from '@fibopoker/shared';
import type { Clock } from './clock.js';
import { actingIn, noRoundOpenIn } from './room.js';
import { RoomNotFoundError } from './room-errors.js';
import type { RoomRepository } from './room-repository.js';
import { freshRound } from './round.js';

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
    noRoundOpenIn(room);

    const round = freshRound(title, this.clock.now());

    await this.rooms.openRound(room.id, round);

    return { id: round.id };
  }
}
