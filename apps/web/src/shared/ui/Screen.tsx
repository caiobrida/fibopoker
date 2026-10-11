import type { ReactNode } from 'react';
import styles from './Screen.module.css';

export function Screen({
  width = 'measure',
  children,
}: {
  width?: 'measure' | 'wide';
  children: ReactNode;
}) {
  return (
    <main className={styles.screen} data-width={width}>
      {children}
    </main>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <h1 className={styles.heading}>{children}</h1>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className={styles.lead}>{children}</p>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}
