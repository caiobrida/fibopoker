import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useRoomState } from '../shared/api/index.ts';
import { Button } from '../shared/ui/Button.tsx';
import { Heading, Lead, Note, Screen } from '../shared/ui/Screen.tsx';
import { roomUrl } from './room-path.ts';
import styles from './RoomScreen.module.css';

type CopyOutcome = 'untouched' | 'copied' | 'blocked';

const COPY_FEEDBACK_MS = 2000;

export function RoomScreen() {
  const { roomId } = useParams();
  const state = useRoomState(roomId);
  const [copyOutcome, setCopyOutcome] = useState<CopyOutcome>('untouched');

  useEffect(() => {
    if (copyOutcome === 'untouched') {
      return;
    }

    const timer = window.setTimeout(() => setCopyOutcome('untouched'), COPY_FEEDBACK_MS);

    return () => window.clearTimeout(timer);
  }, [copyOutcome]);

  if (state.status === 'resolving') {
    return (
      <Screen>
        <Lead>Opening the Room…</Lead>
      </Screen>
    );
  }

  if (state.status === 'absent') {
    return (
      <Screen>
        <Heading>No such Room</Heading>
        <Lead>This link does not lead to a Room. Ask whoever shared it for the current one.</Lead>
      </Screen>
    );
  }

  if (state.status === 'unreachable') {
    return (
      <Screen>
        <Heading>The Room is out of reach</Heading>
        <Lead>{state.reason}</Lead>
      </Screen>
    );
  }

  const link = roomUrl(state.room.id);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyOutcome('copied');
    } catch {
      setCopyOutcome('blocked');
    }
  }

  return (
    <Screen>
      <Heading>The Room is open</Heading>
      <Lead>
        Paste this link wherever the team talks. It keeps working for as long as the team keeps
        using it.
      </Lead>
      <div className={styles.share}>
        <Note>Room link</Note>
        <p className={styles.link}>{link}</p>
        <div>
          <Button variant="secondary" onClick={() => void copyLink()}>
            {copyOutcome === 'copied' ? 'Copied' : 'Copy link'}
          </Button>
        </div>
        {copyOutcome === 'blocked' ? (
          <Note>The browser blocked copying — select the link above and copy it by hand.</Note>
        ) : null}
      </div>
    </Screen>
  );
}
