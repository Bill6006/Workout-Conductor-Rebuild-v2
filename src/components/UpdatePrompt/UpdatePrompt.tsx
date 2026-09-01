import type { AppUpdateState } from '../../core/pwa/useAppUpdate';
import styles from './UpdatePrompt.module.css';

/**
 * "New version available" prompt.
 *
 * Never auto-reloads: an in-progress workout must survive a deployment, so
 * taking the update is always the user's tap.
 */
export function UpdatePrompt({
  updateAvailable,
  offlineReady,
  applyUpdate,
  dismiss,
}: AppUpdateState) {
  if (!updateAvailable && !offlineReady) return null;

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.toast}>
        <div className={styles.text}>
          {updateAvailable ? (
            <>
              <strong>New version available</strong>
              Reload when you are between sets.
            </>
          ) : (
            <>
              <strong>Ready to work offline</strong>
              The app shell is cached on this device.
            </>
          )}
        </div>
        <div className={styles.actions}>
          {updateAvailable ? (
            <button type="button" className={styles.reload} onClick={applyUpdate}>
              Reload
            </button>
          ) : null}
          <button
            type="button"
            className={styles.dismiss}
            onClick={dismiss}
            aria-label="Dismiss notification"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
