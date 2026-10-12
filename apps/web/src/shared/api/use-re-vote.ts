import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reVote } from './client.ts';
import { storedToken } from './participant-token.ts';
import { roomQueryKey } from './use-room-state.ts';

export type ReVoteAction = {
  again: () => void;
  isReVoting: boolean;
  failure: string | null;
};

export function useReVote(roomId: string, roundId: string | null): ReVoteAction {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (round: string) => reVote(roomId, round, storedToken(roomId)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomQueryKey(roomId) });
    },
  });

  const refusedThisRound = mutation.error !== null && mutation.variables === roundId;

  return {
    again: () => {
      if (roundId !== null) {
        mutation.mutate(roundId);
      }
    },
    isReVoting: mutation.isPending,
    failure: refusedThisRound ? mutation.error.message : null,
  };
}
