import type { RoomSnapshot } from '@fibopoker/shared';
import { useQuery } from '@tanstack/react-query';
import { fetchRoomSnapshot } from './client.ts';

export type RoomState =
  | { status: 'resolving' }
  | { status: 'present'; room: RoomSnapshot }
  | { status: 'absent' }
  | { status: 'unreachable'; reason: string };

export function useRoomState(roomId: string | undefined): RoomState {
  const query = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => fetchRoomSnapshot(roomId ?? ''),
    enabled: roomId !== undefined,
    retry: false,
  });

  if (roomId === undefined) {
    return { status: 'absent' };
  }

  if (query.error !== null) {
    return { status: 'unreachable', reason: query.error.message };
  }

  if (query.data === undefined) {
    return { status: 'resolving' };
  }

  return query.data === null ? { status: 'absent' } : { status: 'present', room: query.data };
}
