import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revealRound } from './client.ts';
import { storedToken } from './participant-token.ts';
import { roomQueryKey } from './use-room-state.ts';

export type RevealRoundAction = {
  reveal: () => void;
  isRevealing: boolean;
  failure: string | null;
};

export function useRevealRound(roomId: string, roundId: string | null): RevealRoundAction {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (round: string) => revealRound(roomId, round, storedToken(roomId)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomQueryKey(roomId) });
    },
  });

  return {
    reveal: () => {
      if (roundId !== null) {
        mutation.mutate(roundId);
      }
    },
    isRevealing: mutation.isPending,
    failure: mutation.error === null ? null : mutation.error.message,
  };
}
