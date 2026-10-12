import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: 'primary' | 'secondary';
  size?: 'regular' | 'large';
};

export function Button({ variant, size = 'regular', type = 'button', ...attributes }: ButtonProps) {
  return (
    <button
      {...attributes}
      type={type}
      className={styles.button}
      data-variant={variant}
      data-size={size}
    />
  );
}
