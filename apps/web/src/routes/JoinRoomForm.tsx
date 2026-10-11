import { NICKNAME_MAX_LENGTH, nicknameSchema } from '@fibopoker/shared';
import { useState, type FormEvent } from 'react';
import type { JoinRoomAction } from '../shared/api/index.ts';
import { Button } from '../shared/ui/Button.tsx';
import { Input } from '../shared/ui/Input.tsx';
import { Note } from '../shared/ui/Screen.tsx';
import styles from './JoinRoomForm.module.css';

export function JoinRoomForm({ action }: { action: JoinRoomAction }) {
  const [typed, setTyped] = useState('');
  const proposed = nicknameSchema.safeParse(typed);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (proposed.success) {
      action.join(proposed.data);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Input
        id="nickname"
        label="Your nickname"
        value={typed}
        maxLength={NICKNAME_MAX_LENGTH}
        autoComplete="off"
        autoFocus
        onChange={(event) => setTyped(event.target.value)}
      />
      <Button variant="primary" type="submit" disabled={!proposed.success || action.isJoining}>
        {action.isJoining ? 'Joining…' : 'Join the Room'}
      </Button>
      {action.failure === null ? null : (
        <Note>The Room would not take you in: {action.failure}</Note>
      )}
    </form>
  );
}
