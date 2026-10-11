import type { RoomSnapshot } from '@fibopoker/shared';
import type { Clock } from './clock.js';
import { participantHolding, presentAt, seenAt, snapshotOf } from './room.js';
import { RoomNotFoundError, UnknownParticipantError } from './room-errors.js';
import type { RoomRepository } from './room-repository.js';

export class GetRoomSnapshot {
  constructor(
    private readonly rooms: RoomRepository,
    private readonly clock: Clock,
  ) {}

  async execute({
    roomId,
    token,
  }: {
    roomId: string;
    token: string | null;
  }): Promise<RoomSnapshot> {
    const room = await this.rooms.findById(roomId);

    if (room === null) {
      throw new RoomNotFoundError(roomId);
    }

    const now = this.clock.now();

    if (token === null) {
      return snapshotOf(presentAt(room, now), null);
    }

    const self = participantHolding(room, token);

    if (self === null) {
      throw new UnknownParticipantError();
    }

    await this.rooms.markSeen(room.id, self.id, now);

    return snapshotOf(presentAt(seenAt(room, self, now), now), self);
  }
}
