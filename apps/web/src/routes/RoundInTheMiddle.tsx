import {
  ROUND_TITLE_MAX_LENGTH,
  roundTitleSchema,
  type Participant,
  type Round,
} from '@fibopoker/shared';
import { useState, type FormEvent } from 'react';
import type { OpenRoundAction } from '../shared/api/index.ts';
import { Alert } from '../shared/ui/Alert.tsx';
import { Button } from '../shared/ui/Button.tsx';
import { Input } from '../shared/ui/Input.tsx';
import { Note } from '../shared/ui/Screen.tsx';
import styles from './RoundInTheMiddle.module.css';

const TITLE_ID = 'round-title';

function howManyHaveVoted(participants: Participant[]): string {
  const voted = participants.filter(({ hasVoted }) => hasVoted).length;

  return `${voted} of ${participants.length} voted`;
}

function BeingEstimated({ round, participants }: { round: Round; participants: Participant[] }) {
  return (
    <>
      <p className={styles.title} data-titled={round.title === null ? 'no' : 'yes'}>
        {round.title ?? 'An untitled Round'}
      </p>
      <Note>{howManyHaveVoted(participants)}</Note>
    </>
  );
}

function Opening({ action }: { action: OpenRoundAction }) {
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

export function RoundInTheMiddle({
  round,
  participants,
  opening,
}: {
  round: Round | null;
  participants: Participant[];
  opening: OpenRoundAction | null;
}) {
  if (round !== null) {
    return <BeingEstimated round={round} participants={participants} />;
  }

  if (opening === null) {
    return <p className={styles.awaiting}>No Round is open</p>;
  }

  return <Opening action={opening} />;
}
