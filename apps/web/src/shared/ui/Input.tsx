import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> & {
  label: string;
};

export function Input({ label, id, ...attributes }: InputProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input {...attributes} id={id} type="text" className={styles.input} />
    </div>
  );
}
