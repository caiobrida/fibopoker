import type { Clock } from './clock.js';
import { actingIn, openRoundIn } from './room.js';
import { RoomNotFoundError } from './room-errors.js';
import type { RoomRepository } from './room-repository.js';

export class RevealRound {
  constructor(
    private readonly rooms: RoomRepository,
    private readonly clock: Clock,
  ) {}

  async execute({
    roomId,
    roundId,
    token,
  }: {
    roomId: string;
    roundId: string;
    token: string | null;
  }): Promise<void> {
    const room = await this.rooms.findById(roomId);

    if (room === null) {
      throw new RoomNotFoundError(roomId);
    }

    actingIn(room, token);

    const round = openRoundIn(room, roundId);

    await this.rooms.revealRound(room.id, round.id, this.clock.now());
  }
}
