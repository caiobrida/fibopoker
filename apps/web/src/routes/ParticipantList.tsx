import type { Participant } from '@fibopoker/shared';
import { Note } from '../shared/ui/Screen.tsx';
import styles from './ParticipantList.module.css';

function presence(count: number): string {
  if (count === 0) {
    return 'Nobody is in the Room yet';
  }

  return count === 1 ? '1 Participant in the Room' : `${count} Participants in the Room`;
}

export function ParticipantList({
  participants,
  selfId,
}: {
  participants: Participant[];
  selfId: string | null;
}) {
  return (
    <section className={styles.presence}>
      <Note>{presence(participants.length)}</Note>
      <ul className={styles.rows}>
        {participants.map(({ id, nickname }) => (
          <li key={id} className={styles.row}>
            <span>{nickname}</span>
            {id === selfId ? <span className={styles.self}>you</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
