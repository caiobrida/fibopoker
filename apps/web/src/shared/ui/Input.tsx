import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type' | 'size'> & {
  label: string;
  size?: 'regular' | 'large';
};

export function Input({ label, size = 'regular', id, ...attributes }: InputProps) {
  return (
    <div className={styles.field} data-size={size}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input {...attributes} id={id} type="text" className={styles.input} />
    </div>
  );
}
