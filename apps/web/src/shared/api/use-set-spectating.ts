import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setSpectating } from './client.ts';
import { storedToken } from './participant-token.ts';
import { roomQueryKey } from './use-room-state.ts';

export type SetSpectatingAction = {
  spectate: (spectating: boolean) => void;
  isSwitching: boolean;
  failure: string | null;
};

export function useSetSpectating(roomId: string): SetSpectatingAction {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (spectating: boolean) => setSpectating(roomId, storedToken(roomId), spectating),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomQueryKey(roomId) });
    },
  });

  return {
    spectate: (spectating: boolean) => mutation.mutate(spectating),
    isSwitching: mutation.isPending,
    failure: mutation.error === null ? null : mutation.error.message,
  };
}
