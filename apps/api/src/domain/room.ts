import type { RoomSnapshot } from '@fibopoker/shared';

export const INITIAL_REVISION = 1;

export type Room = {
  id: string;
  revision: number;
};

export function snapshotOf(room: Room): RoomSnapshot {
  return { id: room.id, revision: room.revision };
}
