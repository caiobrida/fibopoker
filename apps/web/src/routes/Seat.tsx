import type { CSSProperties } from 'react';
import { STANDING_READS_AS } from './estimate-groups.ts';
import styles from './Seat.module.css';
import type { SeatedParticipant } from './use-seating.ts';

type Placement = CSSProperties & Record<'--seat-x' | '--seat-y', number>;

function placementOf(seat: SeatedParticipant): Placement {
  return { '--seat-x': seat.position.x, '--seat-y': seat.position.y };
}

function whatTheSlotHolds(seat: SeatedParticipant): string {
  if (seat.estimate !== null) {
    return 'a-revealed-estimate';
  }

  return seat.hasVoted ? 'an-estimate' : 'nothing';
}

function whoIsSittingThere(seat: SeatedParticipant): string {
  const occupant = seat.mine ? `${seat.nickname}, you` : seat.nickname;

  if (seat.estimate !== null) {
    return `${occupant}, estimated ${seat.estimate}${STANDING_READS_AS[seat.standing]}`;
  }

  return seat.hasVoted ? `${occupant}, has voted` : occupant;
}

export function Seat({ seat }: { seat: SeatedParticipant }) {
  return (
    <li
      className={styles.seat}
      style={placementOf(seat)}
      data-state={seat.state}
      data-occupant={seat.mine ? 'you' : 'somebody-else'}
      aria-label={whoIsSittingThere(seat)}
      aria-hidden={seat.state === 'vacating' ? true : undefined}
    >
      <span
        className={styles.estimate}
        data-held={whatTheSlotHolds(seat)}
        data-standing={seat.estimate === null ? undefined : seat.standing}
        aria-hidden
      >
        {seat.estimate}
      </span>
      <span className={styles.occupant}>
        <span className={styles.nickname} title={seat.nickname}>
          {seat.nickname}
        </span>
        {seat.mine ? <span className={styles.you}>you</span> : null}
      </span>
    </li>
  );
}
