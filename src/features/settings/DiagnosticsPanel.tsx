import { useMemo } from 'react';
import { buildInfo, formatBuildTime } from '../../core/build/buildInfo';
import { readRuntimeInfo } from '../../core/build/runtimeInfo';
import styles from './DiagnosticsPanel.module.css';

interface Row {
  readonly key: string;
  readonly value: string;
  readonly state?: 'available' | 'unavailable';
}

/**
 * Read-only build and environment report.
 *
 * Deliberately shipped in Phase 0: when something looks wrong on the phone,
 * this is what makes it answerable without a cable and a laptop. The full
 * storage/save diagnostic arrives in Phase 8.
 */
export function DiagnosticsPanel() {
  const rows = useMemo<readonly Row[]>(() => {
    const runtime = readRuntimeInfo();
    return [
      { key: 'Phase', value: buildInfo.phase },
      { key: 'Build', value: buildInfo.id },
      { key: 'Deployed', value: formatBuildTime(buildInfo.time) },
      { key: 'Base path', value: runtime.basePath },
      { key: 'Display mode', value: runtime.displayMode },
      { key: 'Viewport', value: `${runtime.viewportWidth}px` },
      { key: 'Network', value: runtime.online ? 'online' : 'offline' },
      { key: 'Local storage', value: runtime.localStorage, state: runtime.localStorage },
      { key: 'IndexedDB', value: runtime.indexedDb, state: runtime.indexedDb },
      { key: 'Service worker', value: runtime.serviceWorker, state: runtime.serviceWorker },
    ];
  }, []);

  return (
    <section className={styles.panel} aria-labelledby="diagnostics-title">
      <div className={styles.head}>
        <h2 className={styles.title} id="diagnostics-title">
          About this build
        </h2>
        <span className="wc-pill wc-pill--muted">Diagnostics</span>
      </div>

      <dl className={styles.rows} data-testid="diagnostics-rows">
        {rows.map((row) => (
          <div className={styles.row} key={row.key}>
            <dt className={styles.key}>{row.key}</dt>
            <dd className={styles.value} data-state={row.state}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className={styles.note}>
        Workout Conductor runs entirely on this device. There is no account, no server, and no
        analytics - your training history never leaves the browser.
      </p>
    </section>
  );
}
