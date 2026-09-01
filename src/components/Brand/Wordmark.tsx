import { Logo } from './Logo';
import styles from './Wordmark.module.css';

/** Logo plus the product name and subtitle, used in the app header. */
export function Wordmark() {
  return (
    <div className={styles.wordmark}>
      <Logo size={34} />
      <div className={styles.text}>
        <div className={styles.name}>Workout Conductor</div>
        <div className={styles.tagline}>
          Adaptive Strength<span className={styles.taglineRest}> + Hypertrophy</span>
        </div>
      </div>
    </div>
  );
}
