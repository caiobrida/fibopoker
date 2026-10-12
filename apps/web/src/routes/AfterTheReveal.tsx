import type { OpenRoundAction, SetFinalEstimateAction } from '../shared/api/index.ts';
import { Alert } from '../shared/ui/Alert.tsx';
import { Note } from '../shared/ui/Screen.tsx';
import styles from './AfterTheReveal.module.css';
import { Deck } from './Deck.tsx';
import { OpenTheRound } from './OpenTheRound.tsx';

export function AfterTheReveal({
  finalEstimate,
  settling,
  opening,
}: {
  finalEstimate: string | null;
  settling: SetFinalEstimateAction;
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
      <section className={styles.moving}>
        <OpenTheRound action={opening} />
      </section>
    </div>
  );
}
