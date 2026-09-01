import { buildInfo, formatBuildTime } from '../../core/build/buildInfo';
import styles from './BuildHero.module.css';

const PHASE_0_CHECKS = [
  'Public repository and CI pipeline',
  'GitHub Pages deploy on every green build',
  'Installable PWA shell, offline capable',
  'Five-tab mobile navigation',
] as const;

const STATUS_URL =
  'https://github.com/Bill6006/Workout-Conductor-Rebuild-v2/blob/main/PROJECT_STATUS.md';

function Tick() {
  return (
    <span className={styles.tick} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width="11"
        height="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 12.5 4.5 4.5L19 7" />
      </svg>
    </span>
  );
}

/**
 * Phase 0 hero.
 *
 * Until the generation engine exists there is no honest workout to show, so
 * the hero reports the one thing that is genuinely true and useful today:
 * exactly which build the phone is running.
 */
export function BuildHero() {
  return (
    <section className={styles.hero} aria-labelledby="build-hero-title">
      <div className={styles.topRow}>
        <p className="wc-eyebrow">Live build</p>
        <span className="wc-pill wc-pill--accent">Shell ready</span>
      </div>

      <h2 className={styles.phase} id="build-hero-title">
        {buildInfo.phase}
        <br />
        App shell
      </h2>
      <p className={styles.subtitle}>
        The foundation is deployed and installable. Onboarding and your real training data arrive in
        Phase 1.
      </p>

      <ul className={styles.checks}>
        {PHASE_0_CHECKS.map((check) => (
          <li key={check} className={styles.check}>
            <Tick />
            <span>{check}</span>
          </li>
        ))}
      </ul>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <div className={styles.metaLabel}>Build</div>
          <div className={styles.metaValue}>{buildInfo.id}</div>
        </div>
        <div className={styles.metaItem}>
          <div className={styles.metaLabel}>Deployed</div>
          <div className={styles.metaValue}>{formatBuildTime(buildInfo.time)}</div>
        </div>
      </div>

      <div className={styles.action}>
        <a
          className="wc-button wc-button--primary"
          href={STATUS_URL}
          target="_blank"
          rel="noreferrer"
        >
          View project status
        </a>
      </div>
    </section>
  );
}
