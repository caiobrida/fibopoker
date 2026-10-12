import { useMutation, useQueryClient } from '@tanstack/react-query';
import { castEstimate } from './client.ts';
import { storedToken } from './participant-token.ts';
import { roomQueryKey } from './use-room-state.ts';

export type CastEstimateAction = {
  cast: (value: string) => void;
  choosing: string | null;
  failure: string | null;
};

export function useCastEstimate(roomId: string, roundId: string | null): CastEstimateAction {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ round, value }: { round: string; value: string }) =>
      castEstimate(roomId, round, storedToken(roomId), value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomQueryKey(roomId) });
    },
  });

  return {
    cast: (value: string) => {
      if (roundId !== null) {
        mutation.mutate({ round: roundId, value });
      }
    },
    choosing: mutation.isPending ? (mutation.variables?.value ?? null) : null,
    failure: mutation.error === null ? null : mutation.error.message,
  };
}
