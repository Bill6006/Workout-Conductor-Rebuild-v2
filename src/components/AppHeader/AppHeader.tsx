import { Wordmark } from '../Brand/Wordmark';
import { buildInfo } from '../../core/build/buildInfo';
import styles from './AppHeader.module.css';

/**
 * App header: brand on the left, live build marker on the right.
 *
 * The marker is the contract with the phone - it proves the deployed build
 * that is actually running, not a cached one.
 */
export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <Wordmark />
        <span className={styles.marker} data-testid="build-marker" title={buildInfo.time}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.markerPhase}>{buildInfo.phase} ·</span>
          <span>build {buildInfo.id}</span>
        </span>
      </div>
    </header>
  );
}
