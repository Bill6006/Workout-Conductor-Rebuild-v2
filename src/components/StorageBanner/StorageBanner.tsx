import { useState } from 'react';
import styles from './StorageBanner.module.css';

/**
 * Honest storage state.
 *
 * A save that silently failed is the worst outcome the plan names, so when
 * durability is compromised the app says so where the user will see it rather
 * than logging it to a console nobody opens.
 */
export function StorageBanner({
  durable,
  saveError,
  recoveryNote,
}: {
  durable: boolean;
  saveError: string | null;
  recoveryNote: string | null;
}) {
  const [dismissed, setDismissed] = useState<string | null>(null);

  const message = !durable
    ? {
        tone: 'warn' as const,
        id: 'not-durable',
        title: 'Changes are not being saved',
        text: 'This browser is blocking site storage, so your setup only lasts until you close the tab. Private browsing or blocked site data is the usual cause.',
      }
    : saveError
      ? {
          tone: 'error' as const,
          id: `save-error:${saveError}`,
          title: 'That change was not saved',
          text: saveError,
        }
      : recoveryNote
        ? {
            tone: 'warn' as const,
            id: `recovery:${recoveryNote}`,
            title: 'Your saved setup was repaired',
            text: recoveryNote,
          }
        : null;

  if (!message || dismissed === message.id) return null;

  return (
    <div className={styles.banner} data-tone={message.tone} role="alert">
      <div className={styles.body}>
        <div className={styles.title}>{message.title}</div>
        <p className={styles.text}>{message.text}</p>
      </div>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => setDismissed(message.id)}
        aria-label="Dismiss"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
