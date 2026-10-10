import type { Room } from './room.js';

export interface RoomRepository {
  create(room: Room): Promise<void>;
  findById(id: string): Promise<Room | null>;
}

export const ROOM_REPOSITORY = Symbol('RoomRepository');
