import { PARTICIPANT_ID_LENGTH, type JoinRoomResponse } from '@fibopoker/shared';
import { nanoid } from 'nanoid';
import type { Clock } from './clock.js';
import { hashedToken, issueToken } from './participant.js';
import { isNicknameInUse } from './room.js';
import { RoomNotFoundError } from './room-errors.js';
import type { RoomRepository } from './room-repository.js';

export class JoinRoom {
  constructor(
    private readonly rooms: RoomRepository,
    private readonly clock: Clock,
  ) {}

  async execute({
    roomId,
    nickname,
  }: {
    roomId: string;
    nickname: string;
  }): Promise<JoinRoomResponse> {
    const room = await this.rooms.findById(roomId);

    if (room === null) {
      throw new RoomNotFoundError(roomId);
    }

    const token = issueToken();

    await this.rooms.addParticipant(room.id, {
      id: nanoid(PARTICIPANT_ID_LENGTH),
      nickname,
      tokenHash: hashedToken(token),
      joinedAt: this.clock.now(),
    });

    return { token, nicknameAlreadyInUse: isNicknameInUse(room, nickname) };
  }
}
