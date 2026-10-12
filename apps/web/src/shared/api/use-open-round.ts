import { useMutation, useQueryClient } from '@tanstack/react-query';
import { openRound } from './client.ts';
import { storedToken } from './participant-token.ts';
import { roomQueryKey } from './use-room-state.ts';

export type OpenRoundAction = {
  open: (title: string | null) => void;
  isOpening: boolean;
  failure: string | null;
};

export function useOpenRound(roomId: string): OpenRoundAction {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (title: string | null) => openRound(roomId, storedToken(roomId), title),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomQueryKey(roomId) });
    },
  });

  return {
    open: (title: string | null) => mutation.mutate(title),
    isOpening: mutation.isPending,
    failure: mutation.error === null ? null : mutation.error.message,
  };
}
