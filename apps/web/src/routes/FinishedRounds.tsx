import type { FinishedRound } from '@fibopoker/shared';
import { Note } from '../shared/ui/Screen.tsx';
import styles from './FinishedRounds.module.css';

function howManyAreFinished(count: number): string {
  return count === 1 ? '1 finished Round' : `${count} finished Rounds`;
}

export function FinishedRounds({ rounds }: { rounds: FinishedRound[] }) {
  if (rounds.length === 0) {
    return null;
  }

  return (
    <section className={styles.finished}>
      <Note>{howManyAreFinished(rounds.length)}</Note>
      <ol className={styles.rounds}>
        {rounds.map(({ id, title, finalEstimate }) => (
          <li key={id} className={styles.round}>
            <span className={styles.what} data-titled={title === null ? 'no' : 'yes'}>
              {title ?? 'An untitled Round'}
            </span>
            <span className={styles.outcome} data-settled={finalEstimate === null ? 'no' : 'yes'}>
              {finalEstimate ?? 'No Final Estimate'}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
