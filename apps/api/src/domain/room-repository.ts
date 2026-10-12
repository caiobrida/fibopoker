import type { Departure, Participant } from './participant.js';
import type { Room } from './room.js';
import type { Estimate, Round } from './round.js';

export interface RoomRepository {
  create(room: Room): Promise<void>;
  findById(id: string): Promise<Room | null>;
  addParticipant(roomId: string, participant: Participant): Promise<void>;
  markSeen(roomId: string, participantId: string, at: Date): Promise<void>;
  rename(roomId: string, participantId: string, nickname: string): Promise<void>;
  setSpectating(roomId: string, participantId: string, spectating: boolean): Promise<void>;
  recordDeparture(roomId: string, departure: Departure): Promise<void>;
  openRound(roomId: string, round: Round): Promise<void>;
  castEstimate(roomId: string, roundId: string, estimate: Estimate): Promise<void>;
  revealRound(roomId: string, roundId: string, at: Date): Promise<void>;
  setFinalEstimate(roomId: string, roundId: string, value: string): Promise<void>;
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
