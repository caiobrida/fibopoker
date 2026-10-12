import type { Participant, RoomSnapshot } from '@fibopoker/shared';
import { useQuery } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';
import { Cadence } from './cadence.ts';
import { fetchRoomSnapshot, StaleIdentityError } from './client.ts';
import { forgetToken, storedToken } from './participant-token.ts';

export type RoomState =
  | { status: 'resolving' }
  | { status: 'unidentified'; room: RoomSnapshot }
  | { status: 'present'; room: RoomSnapshot; self: Participant }
  | { status: 'absent' }
  | { status: 'unreachable'; reason: string };

async function readRoom(roomId: string): Promise<RoomSnapshot | null> {
  const token = storedToken(roomId);

  if (token === null) {
    return fetchRoomSnapshot(roomId, null);
  }

  try {
    return await fetchRoomSnapshot(roomId, token);
  } catch (failure) {
    if (!(failure instanceof StaleIdentityError)) {
      throw failure;
    }

    forgetToken(roomId);

    return fetchRoomSnapshot(roomId, null);
  }
}

function selfIn(room: RoomSnapshot): Participant | undefined {
  return room.participants.find(({ id }) => id === room.selfId);
}

function whileTabVisibilityChanges(react: () => void): () => void {
  document.addEventListener('visibilitychange', react);

  return () => document.removeEventListener('visibilitychange', react);
}

function useTabHidden(): boolean {
  return useSyncExternalStore(
    whileTabVisibilityChanges,
    () => document.hidden,
    () => false,
  );
}

export function roomQueryKey(roomId: string): unknown[] {
  return ['room', roomId];
}

export function useRoomState(roomId: string): RoomState {
  const tabHidden = useTabHidden();
  const [cadence] = useState(() => new Cadence());

  const query = useQuery({
    queryKey: roomQueryKey(roomId),
    queryFn: async () => {
      const room = await readRoom(roomId);

      cadence.noticed(room);

      return room;
    },
    refetchInterval: () => cadence.interval(tabHidden),
    refetchIntervalInBackground: true,
    structuralSharing: true,
    retry: false,
  });

  if (query.data === null) {
    return { status: 'absent' };
  }

  if (query.data !== undefined) {
    const self = selfIn(query.data);

    return self === undefined
      ? { status: 'unidentified', room: query.data }
      : { status: 'present', room: query.data, self };
  }

  return query.error === null
    ? { status: 'resolving' }
    : { status: 'unreachable', reason: query.error.message };
}
