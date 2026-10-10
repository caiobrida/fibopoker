import type { RoomSnapshot } from '@fibopoker/shared';
import { skipToken, useQuery } from '@tanstack/react-query';
import { fetchRoomSnapshot } from './client.ts';

export type RoomState =
  | { status: 'resolving' }
  | { status: 'present'; room: RoomSnapshot }
  | { status: 'absent' }
  | { status: 'unreachable'; reason: string };

export function useRoomState(roomId: string | undefined): RoomState {
  const query = useQuery({
    queryKey: ['room', roomId],
    queryFn: roomId === undefined ? skipToken : () => fetchRoomSnapshot(roomId),
    retry: false,
  });

  if (roomId === undefined || query.data === null) {
    return { status: 'absent' };
  }

  if (query.data !== undefined) {
    return { status: 'present', room: query.data };
  }

  return query.error === null
    ? { status: 'resolving' }
    : { status: 'unreachable', reason: query.error.message };
}
