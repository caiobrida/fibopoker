import type { Participant, RoomSnapshot } from '@fibopoker/shared';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import {
  useCastEstimate,
  useJoinRoom,
  useOpenRound,
  useRevealRound,
  useRoomState,
} from '../shared/api/index.ts';
import { Alert } from '../shared/ui/Alert.tsx';
import { Button } from '../shared/ui/Button.tsx';
import { Heading, Lead, Note, Screen } from '../shared/ui/Screen.tsx';
import { Deck } from './Deck.tsx';
import { EntryPanel } from './EntryPanel.tsx';
import { sharedWithSomebodyElse } from './nicknames.ts';
import { roomUrl } from './room-path.ts';
import styles from './RoomScreen.module.css';
import { RoomTable } from './RoomTable.tsx';
import { RoundInTheMiddle } from './RoundInTheMiddle.tsx';
import { useArrival, type Arrival } from './use-arrival.ts';

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

function RoomBanner({ participants, self }: { participants: Participant[]; self: Participant }) {
  return (
    <header className={styles.banner}>
      <Heading>The Room is open</Heading>
      <Lead>You are in as {self.nickname}.</Lead>
      {sharedWithSomebodyElse(participants, self) ? (
        <Alert>Somebody else in the Room answers to that nickname too.</Alert>
      ) : null}
    </header>
  );
}

function Room({ roomId }: { roomId: string }) {
  const state = useRoomState(roomId);
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

  return (
    <TheRoom
      room={state.room}
      self={state.status === 'present' ? state.self : null}
      arrival={arrival}
    />
  );
}

function TheRoom({
  room,
  self,
  arrival,
}: {
  room: RoomSnapshot;
  self: Participant | null;
  arrival: Arrival;
}) {
  const round = room.round;
  const joinRoom = useJoinRoom(room.id);
  const openRound = useOpenRound(room.id);
  const castEstimate = useCastEstimate(room.id, round === null ? null : round.id);
  const revealRound = useRevealRound(room.id, round === null ? null : round.id);
  const others =
    self === null ? room.participants : room.participants.filter(({ id }) => id !== self.id);

  return (
    <Screen width="wide">
      {self !== null && arrival === 'seated' ? (
        <RoomBanner participants={room.participants} self={self} />
      ) : (
        <EntryPanel participants={others} action={joinRoom} leaving={self !== null} />
      )}
      <RoomTable
        participants={room.participants}
        selfId={self === null ? null : self.id}
        revealed={round?.state === 'revealed' ? round.estimates : null}
        middle={
          <RoundInTheMiddle
            round={round}
            participants={room.participants}
            opening={self === null ? null : openRound}
            revealing={self === null ? null : revealRound}
          />
        }
        hand={
          round?.state === 'open' ? (
            <Deck
              chosen={round.selfEstimate}
              choosing={castEstimate.choosing}
              disabled={self === null}
              onChoose={castEstimate.cast}
            />
          ) : null
        }
      />
      {round?.state === 'open' && castEstimate.failure !== null ? (
        <Alert>Your Estimate did not reach the Room: {castEstimate.failure}</Alert>
      ) : null}
      {round?.state === 'open' && revealRound.failure !== null ? (
        <Alert>The Round would not reveal: {revealRound.failure}</Alert>
      ) : null}
      {arrival === 'seated' ? <ShareBlock link={roomUrl(room.id)} /> : null}
    </Screen>
  );
}
