import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveRoom } from './client.ts';
import { forgetToken, storedToken } from './participant-token.ts';
import { roomQueryKey } from './use-room-state.ts';

export type LeaveRoomAction = {
  leave: () => void;
  isLeaving: boolean;
  failure: string | null;
};

export function useLeaveRoom(roomId: string): LeaveRoomAction {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => leaveRoom(roomId, storedToken(roomId)),
    onSuccess: async () => {
      forgetToken(roomId);

      await queryClient.invalidateQueries({ queryKey: roomQueryKey(roomId) });
    },
  });

  return {
    leave: () => mutation.mutate(),
    isLeaving: mutation.isPending,
    failure: mutation.error === null ? null : mutation.error.message,
  };
}
