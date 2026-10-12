import { NICKNAME_MAX_LENGTH, nicknameSchema, type Participant } from '@fibopoker/shared';
import { useState, type FormEvent } from 'react';
import type { JoinRoomAction } from '../shared/api/index.ts';
import { Alert } from '../shared/ui/Alert.tsx';
import { Button } from '../shared/ui/Button.tsx';
import { Input } from '../shared/ui/Input.tsx';
import { Heading, Lead } from '../shared/ui/Screen.tsx';
import styles from './EntryPanel.module.css';
import { alreadyAtTheTable, sentencesIn } from './nicknames.ts';

const NAMES_SPELLED_OUT = 3;

const ALERTS_ID = 'nickname-alerts';

function joinedWithAnd(items: string[]): string {
  const leading = items.slice(0, -1);
  const last = items.slice(-1).join('');

  return leading.length === 0 ? last : `${leading.join(', ')} and ${last}`;
}

function whoIsAlreadyHere(participants: Participant[]): string {
  if (participants.length === 0) {
    return 'Nobody is at the table yet, so you will be the first one here.';
  }

  const names = participants.map(({ nickname }) => nickname);
  const unnamed = names.length - NAMES_SPELLED_OUT;
  const named = unnamed > 1 ? [...names.slice(0, NAMES_SPELLED_OUT), `${unnamed} others`] : names;

  return `${joinedWithAnd(named)} ${named.length === 1 ? 'is' : 'are'} already at the table.`;
}

export function EntryPanel({
  participants,
  action,
  seated,
}: {
  participants: Participant[];
  action: JoinRoomAction;
  seated: boolean;
}) {
  const [typed, setTyped] = useState('');
  const proposed = nicknameSchema.safeParse(typed);
  const refusal = proposed.success || typed === '' ? null : sentencesIn(proposed.error.issues);
  const taken = proposed.success && alreadyAtTheTable(participants, proposed.data);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (proposed.success) {
      action.join(proposed.data);
    }
  }

  return (
    <div className={styles.arrival} data-state={seated ? 'leaving' : 'standing'}>
      <section className={styles.panel}>
        <header className={styles.welcome}>
          <Heading>Take a seat</Heading>
          <Lead>{whoIsAlreadyHere(participants)}</Lead>
        </header>
        <form className={styles.form} onSubmit={submit}>
          <Input
            id="nickname"
            label="What should the team call you?"
            size="large"
            value={typed}
            maxLength={NICKNAME_MAX_LENGTH}
            autoComplete="off"
            autoFocus
            aria-describedby={ALERTS_ID}
            aria-invalid={refusal !== null}
            onChange={(event) => setTyped(event.target.value)}
          />
          <div className={styles.alerts} id={ALERTS_ID}>
            {refusal === null ? null : <Alert>{refusal}</Alert>}
            {taken ? (
              <Alert>Somebody at the table already answers to that. You can join anyway.</Alert>
            ) : null}
            {action.failure === null ? null : (
              <Alert>The Room would not take you in: {action.failure}</Alert>
            )}
          </div>
          <Button
            variant="primary"
            size="large"
            type="submit"
            disabled={!proposed.success || action.isJoining || seated}
          >
            {action.isJoining ? 'Joining…' : 'Join the Room'}
          </Button>
        </form>
        <p className={styles.assurance}>No account, no sign-up, and nothing to confirm.</p>
      </section>
    </div>
  );
}
