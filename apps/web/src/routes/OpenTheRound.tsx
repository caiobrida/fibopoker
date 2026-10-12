import { ROUND_TITLE_MAX_LENGTH, roundTitleSchema } from '@fibopoker/shared';
import { useState, type FormEvent } from 'react';
import type { OpenRoundAction } from '../shared/api/index.ts';
import { Alert } from '../shared/ui/Alert.tsx';
import { Button } from '../shared/ui/Button.tsx';
import { Input } from '../shared/ui/Input.tsx';
import { Note } from '../shared/ui/Screen.tsx';
import styles from './OpenTheRound.module.css';

const TITLE_ID = 'round-title';

export function OpenTheRound({ action }: { action: OpenRoundAction }) {
  const [typed, setTyped] = useState('');
  const proposed = roundTitleSchema.safeParse(typed);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (proposed.success) {
      action.open(proposed.data);
    }
  }

  return (
    <form className={styles.opening} onSubmit={submit}>
      <Input
        id={TITLE_ID}
        label="What are we estimating?"
        value={typed}
        maxLength={ROUND_TITLE_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setTyped(event.target.value)}
      />
      <Button variant="primary" type="submit" disabled={!proposed.success || action.isOpening}>
        {action.isOpening ? 'Opening…' : 'Open the Round'}
      </Button>
      <Note>Leave it empty for a vote nobody planned.</Note>
      {action.failure === null ? null : <Alert>The Round would not open: {action.failure}</Alert>}
    </form>
  );
}
