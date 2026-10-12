import { NICKNAME_MAX_LENGTH, nicknameSchema, type Participant } from '@fibopoker/shared';
import { useState, type FormEvent } from 'react';
import type { LeaveRoomAction, RenameAction, SetSpectatingAction } from '../shared/api/index.ts';
import { Alert } from '../shared/ui/Alert.tsx';
import { Button } from '../shared/ui/Button.tsx';
import { Input } from '../shared/ui/Input.tsx';
import { Lead, Note } from '../shared/ui/Screen.tsx';
import { sentencesIn } from './nicknames.ts';
import styles from './YourPresence.module.css';

const NICKNAME_ID = 'your-nickname';

function WhoYouAreHere({ self }: { self: Participant }) {
  return self.spectating ? (
    <Lead>You are spectating as {self.nickname}.</Lead>
  ) : (
    <Lead>You are in as {self.nickname}.</Lead>
  );
}

function RenameForm({
  self,
  action,
  onDone,
}: {
  self: Participant;
  action: RenameAction;
  onDone: () => void;
}) {
  const [typed, setTyped] = useState(self.nickname);
  const proposed = nicknameSchema.safeParse(typed);
  const refusal = proposed.success ? null : sentencesIn(proposed.error.issues);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (proposed.success) {
      action.rename(proposed.data);
      onDone();
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Input
        id={NICKNAME_ID}
        label="What should the team call you?"
        value={typed}
        maxLength={NICKNAME_MAX_LENGTH}
        autoComplete="off"
        autoFocus
        aria-invalid={refusal !== null}
        onChange={(event) => setTyped(event.target.value)}
      />
      {refusal === null ? null : <Alert>{refusal}</Alert>}
      <div className={styles.actions}>
        <Button variant="primary" type="submit" disabled={!proposed.success || action.isRenaming}>
          {action.isRenaming ? 'Renaming…' : 'Rename me'}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Keep {self.nickname}
        </Button>
      </div>
    </form>
  );
}

export function YourPresence({
  self,
  renaming,
  spectating,
  leaving,
}: {
  self: Participant;
  renaming: RenameAction;
  spectating: SetSpectatingAction;
  leaving: LeaveRoomAction;
}) {
  const [editingNickname, setEditingNickname] = useState(false);

  return (
    <div className={styles.presence}>
      <WhoYouAreHere self={self} />
      {editingNickname ? (
        <RenameForm self={self} action={renaming} onDone={() => setEditingNickname(false)} />
      ) : (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => setEditingNickname(true)}>
            Rename
          </Button>
          <Button
            variant="secondary"
            onClick={() => spectating.spectate(!self.spectating)}
            disabled={spectating.isSwitching}
          >
            {self.spectating ? 'Join the voting' : 'Spectate'}
          </Button>
          <Button variant="secondary" onClick={leaving.leave} disabled={leaving.isLeaving}>
            {leaving.isLeaving ? 'Leaving…' : 'Leave'}
          </Button>
        </div>
      )}
      <Note>
        Spectating keeps you out of the tally, both halves of it. Leaving hands the browser back, so
        the next person here picks their own nickname.
      </Note>
      {renaming.failure === null ? null : (
        <Alert>The Room kept your old nickname: {renaming.failure}</Alert>
      )}
      {spectating.failure === null ? null : (
        <Alert>The switch did not take: {spectating.failure}</Alert>
      )}
      {leaving.failure === null ? null : (
        <Alert>The Room would not let you go: {leaving.failure}</Alert>
      )}
    </div>
  );
}
