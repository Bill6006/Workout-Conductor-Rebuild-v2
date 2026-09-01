import type { ReactNode } from 'react';
import styles from './Screen.module.css';

interface ScreenProps {
  readonly title: string;
  readonly lede: string;
  readonly eyebrow?: string;
  readonly children: ReactNode;
}

/**
 * Shared screen frame: consistent heading block, gutters, and enough bottom
 * padding that the last card is never trapped under the fixed nav.
 */
export function Screen({ title, lede, eyebrow, children }: ScreenProps) {
  return (
    <main className={styles.screen} id="main-content" tabIndex={-1}>
      <div className={styles.head}>
        {eyebrow ? <p className="wc-eyebrow">{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lede}>{lede}</p>
      </div>
      <div className={styles.stack}>{children}</div>
    </main>
  );
}
