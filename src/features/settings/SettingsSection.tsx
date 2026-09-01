import { useId, useState, type ReactNode } from 'react';
import styles from './SettingsSection.module.css';

/**
 * Collapsible settings group.
 *
 * The plan warns against putting every feature on one giant scrolling screen.
 * Sections stay closed by default so Settings opens as a scannable menu, and
 * only the one being edited takes up the viewport.
 */
export function SettingsSection({
  title,
  summary,
  children,
  defaultOpen = false,
  testId,
}: {
  title: string;
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
  testId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={styles.section} data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        data-testid={testId}
      >
        <span className={styles.headerBody}>
          <span className={styles.title}>{title}</span>
          <span className={styles.summary}>{summary}</span>
        </span>
        <svg
          className={styles.chevron}
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className={styles.panel} id={panelId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
