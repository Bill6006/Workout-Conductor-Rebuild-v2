/**
 * Build identity.
 *
 * The deployed Pages URL has to prove *which* build the phone is looking at,
 * otherwise a cached service worker is indistinguishable from a fresh deploy.
 * These values are injected by vite.config.ts at build time.
 */

export interface BuildInfo {
  /** Short commit sha, or 'local' for an un-committed dev build. */
  readonly id: string;
  /** ISO timestamp of the build. */
  readonly time: string;
  /** Phase label the build was produced for, e.g. 'Phase 0'. */
  readonly phase: string;
}

export const buildInfo: BuildInfo = {
  id: __BUILD_ID__,
  time: __BUILD_TIME__,
  phase: __BUILD_PHASE__,
};

/** Short date for the marker chip: '1 Sep 2026, 14:32 UTC'. */
export function formatBuildTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const day = date.getUTCDate();
  const month = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][date.getUTCMonth()];
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${date.getUTCFullYear()}, ${hours}:${minutes} UTC`;
}

/**
 * The single string shown in the UI and asserted by the smoke tests.
 * Format: 'Phase 0 · build a1b2c3d'.
 */
export function formatBuildMarker(info: BuildInfo = buildInfo): string {
  return `${info.phase} · build ${info.id}`;
}
