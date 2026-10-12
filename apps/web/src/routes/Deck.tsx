import { DECK } from '@fibopoker/shared';
import { EstimateCard } from '../shared/ui/EstimateCard.tsx';
import styles from './Deck.module.css';

function stateOf(value: string, chosen: string | null, choosing: string | null) {
  if (value === choosing) {
    return 'choosing' as const;
  }

  return value === chosen && choosing === null ? ('chosen' as const) : ('offered' as const);
}

export function Deck({
  label,
  chosen,
  choosing,
  disabled,
  onChoose,
}: {
  label: string;
  chosen: string | null;
  choosing: string | null;
  disabled: boolean;
  onChoose: (value: string) => void;
}) {
  return (
    <div className={styles.deck} role="group" aria-label={label}>
      {DECK.map((value) => (
        <EstimateCard
          key={value}
          value={value}
          state={stateOf(value, chosen, choosing)}
          disabled={disabled || choosing !== null}
          onClick={() => onChoose(value)}
        />
      ))}
    </div>
  );
}
