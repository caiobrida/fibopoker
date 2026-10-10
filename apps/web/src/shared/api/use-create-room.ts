import type { RoomSnapshot } from '@fibopoker/shared';
import { useMutation } from '@tanstack/react-query';
import { createRoom } from './client.ts';

export type CreateRoomAction = {
  create: () => void;
  isCreating: boolean;
  failure: string | null;
};

export function useCreateRoom(onCreated: (room: RoomSnapshot) => void): CreateRoomAction {
  const mutation = useMutation({ mutationFn: createRoom, onSuccess: onCreated });

  return {
    create: () => mutation.mutate(),
    isCreating: mutation.isPending,
    failure: mutation.error === null ? null : mutation.error.message,
  };
}
