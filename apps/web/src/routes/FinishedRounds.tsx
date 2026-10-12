import type { FinishedRound } from '@fibopoker/shared';
import { Note } from '../shared/ui/Screen.tsx';
import styles from './FinishedRounds.module.css';
import { NO_FINAL_ESTIMATE, UNTITLED_ROUND } from './round-wording.ts';

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
              {title ?? UNTITLED_ROUND}
            </span>
            <span className={styles.outcome} data-settled={finalEstimate === null ? 'no' : 'yes'}>
              {finalEstimate ?? NO_FINAL_ESTIMATE}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
