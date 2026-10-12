import type { RevealedEstimate } from '@fibopoker/shared';
import { Note } from '../shared/ui/Screen.tsx';
import { groupedEstimates, STANDING_READS_AS, type EstimateGroup } from './estimate-groups.ts';
import styles from './RevealedEstimates.module.css';

function whatWasRevealed(howMany: number): string {
  if (howMany === 0) {
    return 'Nobody voted';
  }

  return howMany === 1 ? '1 Estimate' : `${howMany} Estimates`;
}

function whoChoseThis(group: EstimateGroup): string {
  const chosen = group.howMany === 1 ? 'chosen once' : `chosen ${group.howMany} times`;

  return `${group.value}, ${chosen}${STANDING_READS_AS[group.standing]}`;
}

export function RevealedEstimates({ estimates }: { estimates: RevealedEstimate[] }) {
  const groups = groupedEstimates(estimates);

  return (
    <>
      {groups.length === 0 ? null : (
        <ul className={styles.groups}>
          {groups.map((group) => (
            <li
              key={group.value}
              className={styles.group}
              data-standing={group.standing}
              aria-label={whoChoseThis(group)}
            >
              <span className={styles.value} aria-hidden>
                {group.value}
              </span>
              {group.howMany === 1 ? null : (
                <span className={styles.howMany} aria-hidden>
                  ×{group.howMany}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <Note>{whatWasRevealed(estimates.length)}</Note>
    </>
  );
}
