import type { OpenRoundAction, ReVoteAction, SetFinalEstimateAction } from '../shared/api/index.ts';
import { Alert } from '../shared/ui/Alert.tsx';
import { Button } from '../shared/ui/Button.tsx';
import { Note } from '../shared/ui/Screen.tsx';
import styles from './AfterTheReveal.module.css';
import { Deck } from './Deck.tsx';
import { OpenTheRound } from './OpenTheRound.tsx';

export function AfterTheReveal({
  finalEstimate,
  settling,
  revoting,
  opening,
}: {
  finalEstimate: string | null;
  settling: SetFinalEstimateAction;
  revoting: ReVoteAction;
  opening: OpenRoundAction;
}) {
  return (
    <div className={styles.afterwards}>
      <section className={styles.settling}>
        <Note>Talk it over, then record the number you agreed on.</Note>
        <Deck
          label="The Final Estimate"
          chosen={finalEstimate}
          choosing={settling.recording}
          disabled={false}
          onChoose={settling.record}
        />
        {settling.failure === null ? null : (
          <Alert>The Final Estimate did not reach the Room: {settling.failure}</Alert>
        )}
      </section>
      <section className={styles.again}>
        <Button variant="secondary" onClick={revoting.again} disabled={revoting.isReVoting}>
          {revoting.isReVoting ? 'Re-voting…' : 'Re-vote'}
        </Button>
        <Note>A fresh Round on the same task. This one stays on the record either way.</Note>
        {revoting.failure === null ? null : (
          <Alert>The Re-vote would not open: {revoting.failure}</Alert>
        )}
      </section>
      <section className={styles.next}>
        <OpenTheRound action={opening} />
      </section>
    </div>
  );
}
