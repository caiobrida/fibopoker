import type { Participant } from './participant.js';
import type { Room } from './room.js';

export interface RoomRepository {
  create(room: Room): Promise<void>;
  findById(id: string): Promise<Room | null>;
  addParticipant(roomId: string, participant: Participant): Promise<void>;
  markSeen(roomId: string, participantId: string, at: Date): Promise<void>;
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
