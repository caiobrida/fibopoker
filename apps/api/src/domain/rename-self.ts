import { actingIn } from './room.js';
import { RoomNotFoundError } from './room-errors.js';
import type { RoomRepository } from './room-repository.js';

export class RenameSelf {
  constructor(private readonly rooms: RoomRepository) {}

  async execute({
    roomId,
    token,
    nickname,
  }: {
    roomId: string;
    token: string | null;
    nickname: string;
  }): Promise<void> {
    const room = await this.rooms.findById(roomId);

    if (room === null) {
      throw new RoomNotFoundError(roomId);
    }

    const self = actingIn(room, token);

    await this.rooms.rename(room.id, self.id, nickname);
  }
}
