import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useJoinRoom, useRoomState } from '../shared/api/index.ts';
import { Alert } from '../shared/ui/Alert.tsx';
import { Button } from '../shared/ui/Button.tsx';
import { Heading, Lead, Note, Screen } from '../shared/ui/Screen.tsx';
import { EntryPanel } from './EntryPanel.tsx';
import { sharedWithSomebodyElse } from './nicknames.ts';
import { roomUrl } from './room-path.ts';
import styles from './RoomScreen.module.css';
import { RoomTable } from './RoomTable.tsx';
import { useArrival } from './use-arrival.ts';

type CopyOutcome = 'untouched' | 'copied' | 'blocked';

const COPY_FEEDBACK_MS = 2000;

export function RoomScreen() {
  const { roomId } = useParams();

  return roomId === undefined ? <NoSuchRoom /> : <Room roomId={roomId} />;
}

function NoSuchRoom() {
  return (
    <Screen>
      <Heading>No such Room</Heading>
      <Lead>This link does not lead to a Room. Ask whoever shared it for the current one.</Lead>
    </Screen>
  );
}

function NoRoundYet() {
  return (
    <>
      <p className={styles.awaiting}>No Round is open</p>
      <Note>Somebody titles the first task when the team is ready to estimate it.</Note>
    </>
  );
}

function ShareBlock({ link }: { link: string }) {
  const [copyOutcome, setCopyOutcome] = useState<CopyOutcome>('untouched');

  useEffect(() => {
    if (copyOutcome === 'untouched') {
      return;
    }

    const timer = window.setTimeout(() => setCopyOutcome('untouched'), COPY_FEEDBACK_MS);

    return () => window.clearTimeout(timer);
  }, [copyOutcome]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyOutcome('copied');
    } catch {
      setCopyOutcome('blocked');
    }
  }

  return (
    <div className={styles.share}>
      <Note>Room link</Note>
      <p className={styles.link}>{link}</p>
      <div>
        <Button variant="secondary" onClick={() => void copyLink()}>
          {copyOutcome === 'copied' ? 'Copied' : 'Copy link'}
        </Button>
      </div>
      <Note>
        Paste it wherever the team talks — it keeps working for as long as the team keeps using it.
      </Note>
      {copyOutcome === 'blocked' ? (
        <Alert>The browser blocked copying — select the link above and copy it by hand.</Alert>
      ) : null}
    </div>
  );
}

function Room({ roomId }: { roomId: string }) {
  const state = useRoomState(roomId);
  const joinRoom = useJoinRoom(roomId);
  const arrival = useArrival(state.status);

  if (state.status === 'resolving') {
    return (
      <Screen>
        <Lead>Opening the Room…</Lead>
      </Screen>
    );
  }

  if (state.status === 'absent') {
    return <NoSuchRoom />;
  }

  if (state.status === 'unreachable') {
    return (
      <Screen>
        <Heading>The Room is out of reach</Heading>
        <Lead>{state.reason}</Lead>
      </Screen>
    );
  }

  if (state.status === 'unidentified') {
    return (
      <Screen width="wide">
        <EntryPanel participants={state.room.participants} action={joinRoom} leaving={false} />
        <RoomTable participants={state.room.participants} selfId={null}>
          <NoRoundYet />
        </RoomTable>
      </Screen>
    );
  }

  const { room, self } = state;

  return (
    <Screen width="wide">
      {arrival === 'seated' ? (
        <header className={styles.banner}>
          <Heading>The Room is open</Heading>
          <Lead>You are in as {self.nickname}.</Lead>
          {sharedWithSomebodyElse(room.participants, self) ? (
            <Alert>Somebody else in the Room answers to that nickname too.</Alert>
          ) : null}
        </header>
      ) : (
        <EntryPanel
          participants={room.participants.filter(({ id }) => id !== self.id)}
          action={joinRoom}
          leaving
        />
      )}
      <RoomTable participants={room.participants} selfId={self.id}>
        <NoRoundYet />
      </RoomTable>
      {arrival === 'seated' ? <ShareBlock link={roomUrl(room.id)} /> : null}
    </Screen>
  );
}
