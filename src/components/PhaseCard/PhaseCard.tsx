import styles from './PhaseCard.module.css';

interface PhaseCardProps {
  readonly title: string;
  readonly description: string;
  /** e.g. 'Phase 3' - the phase that makes this surface real. */
  readonly phase: string;
  /** Highlight this as the next thing to land. */
  readonly next?: boolean;
  /** Short capability chips, kept to a handful so the card stays compact. */
  readonly items?: readonly string[];
}

/**
 * Roadmap placeholder.
 *
 * Phase 0 ships a real shell, not a fake product: every surface says plainly
 * what it will do and when, rather than showing invented workout data.
 */
export function PhaseCard({ title, description, phase, next = false, items }: PhaseCardProps) {
  return (
    <article className={styles.card} data-next={next ? 'true' : 'false'}>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
          <span className={`wc-pill ${next ? 'wc-pill--accent' : 'wc-pill--muted'}`}>{phase}</span>
        </div>
        <p className={styles.text}>{description}</p>
        {items && items.length > 0 ? (
          <ul className={styles.items}>
            {items.map((item) => (
              <li key={item} className={styles.item}>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
