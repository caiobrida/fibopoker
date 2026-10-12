import styles from './EstimateCard.module.css';

export function EstimateCard({
  value,
  state,
  disabled,
  onClick,
}: {
  value: string;
  state: 'offered' | 'choosing' | 'chosen';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.card}
      data-state={state}
      disabled={disabled}
      aria-pressed={state === 'chosen'}
      onClick={onClick}
    >
      {value}
    </button>
  );
}
