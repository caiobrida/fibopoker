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

export function Heading({
  size = 'regular',
  children,
}: {
  size?: 'regular' | 'large';
  children: ReactNode;
}) {
  return (
    <h1 className={styles.heading} data-size={size}>
      {children}
    </h1>
  );
}

export function Lead({
  size = 'regular',
  children,
}: {
  size?: 'regular' | 'large';
  children: ReactNode;
}) {
  return (
    <p className={styles.lead} data-size={size}>
      {children}
    </p>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}
