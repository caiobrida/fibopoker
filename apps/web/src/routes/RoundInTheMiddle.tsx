import {
  ROUND_TITLE_MAX_LENGTH,
  roundTitleSchema,
  type Participant,
  type Round,
} from '@fibopoker/shared';
import { useState, type FormEvent } from 'react';
import type { OpenRoundAction, RevealRoundAction } from '../shared/api/index.ts';
import { Alert } from '../shared/ui/Alert.tsx';
import { Button } from '../shared/ui/Button.tsx';
import { Input } from '../shared/ui/Input.tsx';
import { Note } from '../shared/ui/Screen.tsx';
import { RevealedEstimates } from './RevealedEstimates.tsx';
import styles from './RoundInTheMiddle.module.css';

const TITLE_ID = 'round-title';

function howManyHaveVoted(participants: Participant[]): string {
  const voted = participants.filter(({ hasVoted }) => hasVoted).length;

  return `${voted} of ${participants.length} voted`;
}

function WhatIsBeingEstimated({ title }: { title: string | null }) {
  return (
    <p className={styles.title} data-titled={title === null ? 'no' : 'yes'}>
      {title ?? 'An untitled Round'}
    </p>
  );
}

function BeingEstimated({
  participants,
  revealing,
}: {
  participants: Participant[];
  revealing: RevealRoundAction | null;
}) {
  return (
    <>
      <Note>{howManyHaveVoted(participants)}</Note>
      {revealing === null ? null : (
        <Button variant="secondary" onClick={revealing.reveal} disabled={revealing.isRevealing}>
          {revealing.isRevealing ? 'Revealing…' : 'Reveal'}
        </Button>
      )}
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
  revealing,
}: {
  round: Round | null;
  participants: Participant[];
  opening: OpenRoundAction | null;
  revealing: RevealRoundAction | null;
}) {
  if (round === null) {
    return opening === null ? (
      <p className={styles.awaiting}>No Round is open</p>
    ) : (
      <Opening action={opening} />
    );
  }

  return (
    <>
      <WhatIsBeingEstimated title={round.title} />
      {round.state === 'revealed' ? (
        <RevealedEstimates estimates={round.estimates} />
      ) : (
        <BeingEstimated participants={participants} revealing={revealing} />
      )}
    </>
  );
}
