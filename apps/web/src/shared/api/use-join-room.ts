import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinRoom } from './client.ts';
import { rememberToken } from './participant-token.ts';
import { roomQueryKey } from './use-room-state.ts';

export type JoinRoomAction = {
  join: (nickname: string) => void;
  isJoining: boolean;
  failure: string | null;
};

export function useJoinRoom(roomId: string): JoinRoomAction {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (nickname: string) => joinRoom(roomId, nickname),
    onSuccess: async ({ token }) => {
      rememberToken(roomId, token);

      await queryClient.invalidateQueries({ queryKey: roomQueryKey(roomId) });
    },
  });

  return {
    join: (nickname: string) => mutation.mutate(nickname),
    isJoining: mutation.isPending,
    failure: mutation.error === null ? null : mutation.error.message,
  };
}
