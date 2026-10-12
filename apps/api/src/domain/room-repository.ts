import type { Participant } from './participant.js';
import type { Room } from './room.js';
import type { Estimate, Round } from './round.js';

export interface RoomRepository {
  create(room: Room): Promise<void>;
  findById(id: string): Promise<Room | null>;
  addParticipant(roomId: string, participant: Participant): Promise<void>;
  markSeen(roomId: string, participantId: string, at: Date): Promise<void>;
  openRound(roomId: string, round: Round): Promise<void>;
  castEstimate(roomId: string, roundId: string, estimate: Estimate): Promise<void>;
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
