import type { Participant } from '@fibopoker/shared';
import type { CSSProperties, ReactNode } from 'react';
import { Note } from '../shared/ui/Screen.tsx';
import styles from './RoomTable.module.css';
import { Seat } from './Seat.tsx';
import { TABLE_ASPECT } from './seating.ts';
import { useSeating } from './use-seating.ts';

const proportions: CSSProperties & Record<'--table-aspect', number> = {
  '--table-aspect': TABLE_ASPECT,
};

function howManyAreHere(count: number): string {
  if (count === 0) {
    return 'Nobody is in the Room yet';
  }

  return count === 1 ? '1 Participant in the Room' : `${count} Participants in the Room`;
}

export function RoomTable({
  participants,
  selfId,
  children,
}: {
  participants: Participant[];
  selfId: string | null;
  children: ReactNode;
}) {
  const seats = useSeating(participants, selfId);

  return (
    <section className={styles.room}>
      <div className={styles.clearance}>
        <div className={styles.table} style={proportions}>
          <div className={styles.middle}>{children}</div>
          <ul className={styles.seats}>
            {seats.map((seat) => (
              <Seat key={seat.id} seat={seat} />
            ))}
          </ul>
        </div>
      </div>
      <Note>{howManyAreHere(participants.length)}</Note>
    </section>
  );
}
