import type { Participant, RoomSnapshot } from '@fibopoker/shared';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useJoinRoom, useRoomState } from '../shared/api/index.ts';
import { Button } from '../shared/ui/Button.tsx';
import { Heading, Lead, Note, Screen } from '../shared/ui/Screen.tsx';
import { JoinRoomForm } from './JoinRoomForm.tsx';
import { roomUrl } from './room-path.ts';
import styles from './RoomScreen.module.css';
import { RoomTable } from './RoomTable.tsx';

type CopyOutcome = 'untouched' | 'copied' | 'blocked';

const COPY_FEEDBACK_MS = 2000;

function nicknameSharedWithSomebodyElse(room: RoomSnapshot, self: Participant): boolean {
  return room.participants.some(
    (participant) =>
      participant.id !== self.id &&
      participant.nickname.toLowerCase() === self.nickname.toLowerCase(),
  );
}

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

function Room({ roomId }: { roomId: string }) {
  const state = useRoomState(roomId);
  const joinRoom = useJoinRoom(roomId);
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
        <div className={styles.aside}>
          <Heading>Join the Room</Heading>
          <Lead>
            Pick a nickname the team will recognise. No account, no sign-up, and nothing to confirm.
          </Lead>
          <JoinRoomForm action={joinRoom} />
        </div>
        <RoomTable participants={state.room.participants} selfId={null}>
          <NoRoundYet />
        </RoomTable>
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
    <Screen width="wide">
      <div className={styles.aside}>
        <Heading>The Room is open</Heading>
        <Lead>You are in as {state.self.nickname}.</Lead>
        {nicknameSharedWithSomebodyElse(state.room, state.self) ? (
          <Note>Somebody else in the Room answers to that nickname too.</Note>
        ) : null}
      </div>
      <RoomTable participants={state.room.participants} selfId={state.self.id}>
        <NoRoundYet />
      </RoomTable>
      <div className={styles.share}>
        <Note>Room link</Note>
        <p className={styles.link}>{link}</p>
        <div>
          <Button variant="secondary" onClick={() => void copyLink()}>
            {copyOutcome === 'copied' ? 'Copied' : 'Copy link'}
          </Button>
        </div>
        <Note>
          Paste it wherever the team talks — it keeps working for as long as the team keeps using
          it.
        </Note>
        {copyOutcome === 'blocked' ? (
          <Note>The browser blocked copying — select the link above and copy it by hand.</Note>
        ) : null}
      </div>
    </Screen>
  );
}
