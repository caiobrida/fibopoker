import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setFinalEstimate } from './client.ts';
import { storedToken } from './participant-token.ts';
import { roomQueryKey } from './use-room-state.ts';

export type SetFinalEstimateAction = {
  record: (value: string) => void;
  recording: string | null;
  failure: string | null;
};

export function useSetFinalEstimate(
  roomId: string,
  roundId: string | null,
): SetFinalEstimateAction {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ round, value }: { round: string; value: string }) =>
      setFinalEstimate(roomId, round, storedToken(roomId), value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomQueryKey(roomId) });
    },
  });

  const refusedThisRound = mutation.error !== null && mutation.variables?.round === roundId;

  return {
    record: (value: string) => {
      if (roundId !== null) {
        mutation.mutate({ round: roundId, value });
      }
    },
    recording: mutation.isPending ? (mutation.variables?.value ?? null) : null,
    failure: refusedThisRound ? mutation.error.message : null,
  };
}
