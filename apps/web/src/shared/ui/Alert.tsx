import type { ReactNode } from 'react';
import styles from './Alert.module.css';

export function Alert({ children }: { children: ReactNode }) {
  return <p className={styles.alert}>{children}</p>;
}
