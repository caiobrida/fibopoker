import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renameSelf } from './client.ts';
import { storedToken } from './participant-token.ts';
import { roomQueryKey } from './use-room-state.ts';

export type RenameAction = {
  rename: (nickname: string) => void;
  isRenaming: boolean;
  failure: string | null;
};

export function useRename(roomId: string): RenameAction {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (nickname: string) => renameSelf(roomId, storedToken(roomId), nickname),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomQueryKey(roomId) });
    },
  });

  return {
    rename: (nickname: string) => mutation.mutate(nickname),
    isRenaming: mutation.isPending,
    failure: mutation.error === null ? null : mutation.error.message,
  };
}
