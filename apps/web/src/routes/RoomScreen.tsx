import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useRoomState } from '../shared/api/index.ts';
import { Button } from '../shared/ui/Button.tsx';
import { roomPath } from './room-path.ts';
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
      <main className={styles.screen}>
        <p className={styles.lead}>Opening the Room…</p>
      </main>
    );
  }

  if (state.status === 'absent') {
    return (
      <main className={styles.screen}>
        <h1 className={styles.heading}>No such Room</h1>
        <p className={styles.lead}>
          This link does not lead to a Room. Ask whoever shared it for the current one.
        </p>
      </main>
    );
  }

  if (state.status === 'unreachable') {
    return (
      <main className={styles.screen}>
        <h1 className={styles.heading}>The Room is out of reach</h1>
        <p className={styles.lead}>{state.reason}</p>
      </main>
    );
  }

  const link = new URL(roomPath(state.room.id), window.location.origin).href;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyOutcome('copied');
    } catch {
      setCopyOutcome('blocked');
    }
  }

  return (
    <main className={styles.screen}>
      <h1 className={styles.heading}>The Room is open</h1>
      <p className={styles.lead}>
        Paste this link wherever the team talks. It keeps working for as long as the team keeps
        using it.
      </p>
      <div className={styles.share}>
        <p className={styles.shareLabel}>Room link</p>
        <p className={styles.link}>{link}</p>
        <div>
          <Button variant="secondary" onClick={() => void copyLink()}>
            {copyOutcome === 'copied' ? 'Copied' : 'Copy link'}
          </Button>
        </div>
        {copyOutcome === 'blocked' ? (
          <p className={styles.notice}>
            The browser blocked copying — select the link above and copy it by hand.
          </p>
        ) : null}
      </div>
    </main>
  );
}
