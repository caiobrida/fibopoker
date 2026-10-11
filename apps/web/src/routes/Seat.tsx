import type { CSSProperties } from 'react';
import styles from './Seat.module.css';
import type { SeatedParticipant } from './use-seating.ts';

type Placement = CSSProperties & Record<'--seat-x' | '--seat-y', number>;

function placementOf(seat: SeatedParticipant): Placement {
  return { '--seat-x': seat.position.x, '--seat-y': seat.position.y };
}

export function Seat({ seat }: { seat: SeatedParticipant }) {
  return (
    <li
      className={styles.seat}
      style={placementOf(seat)}
      data-state={seat.state}
      data-occupant={seat.mine ? 'you' : 'somebody-else'}
      aria-hidden={seat.state === 'vacating' ? true : undefined}
    >
      <span className={styles.estimate} />
      <span className={styles.occupant}>
        <span className={styles.nickname} title={seat.nickname}>
          {seat.nickname}
        </span>
        {seat.mine ? <span className={styles.you}>you</span> : null}
      </span>
    </li>
  );
}
