import type { Participant, Round } from '@fibopoker/shared';
import type { OpenRoundAction, RevealRoundAction } from '../shared/api/index.ts';
import { Button } from '../shared/ui/Button.tsx';
import { Note } from '../shared/ui/Screen.tsx';
import { OpenTheRound } from './OpenTheRound.tsx';
import { RevealedEstimates } from './RevealedEstimates.tsx';
import styles from './RoundInTheMiddle.module.css';

function howManyHaveVoted(participants: Participant[]): string {
  const voting = participants.filter(({ spectating }) => !spectating);
  const voted = voting.filter(({ hasVoted }) => hasVoted).length;

  return `${voted} of ${voting.length} voted`;
}

function WhatIsBeingEstimated({ title }: { title: string | null }) {
  return (
    <p className={styles.title} data-titled={title === null ? 'no' : 'yes'}>
      {title ?? 'An untitled Round'}
    </p>
  );
}

function WhatTheTeamAgreed({ value }: { value: string }) {
  return (
    <div className={styles.settled}>
      <Note>Final Estimate</Note>
      <span className={styles.agreed}>{value}</span>
    </div>
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
      <OpenTheRound action={opening} />
    );
  }

  if (round.state === 'open') {
    return (
      <>
        <WhatIsBeingEstimated title={round.title} />
        <BeingEstimated participants={participants} revealing={revealing} />
      </>
    );
  }

  return (
    <>
      <WhatIsBeingEstimated title={round.title} />
      <RevealedEstimates estimates={round.estimates} />
      {round.finalEstimate === null ? null : <WhatTheTeamAgreed value={round.finalEstimate} />}
    </>
  );
}
