/**
 * Navigation model.
 *
 * Hash routing, deliberately: GitHub Pages serves a project subpath with no
 * SPA rewrite, so a path-based deep link would 404 on refresh. Hashes also
 * keep the Android back button working without extra wiring.
 */

export const SCREEN_IDS = ['today', 'workout', 'progress', 'plan', 'settings'] as const;

export type ScreenId = (typeof SCREEN_IDS)[number];

export const DEFAULT_SCREEN: ScreenId = 'today';

export interface NavItem {
  readonly id: ScreenId;
  readonly label: string;
  /** Phase in which this screen becomes genuinely functional. */
  readonly deliveredIn: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'today', label: 'Today', deliveredIn: 'Phase 1' },
  { id: 'workout', label: 'Workout', deliveredIn: 'Phase 5' },
  { id: 'progress', label: 'Progress', deliveredIn: 'Phase 7' },
  { id: 'plan', label: 'Plan', deliveredIn: 'Phase 7' },
  { id: 'settings', label: 'Settings', deliveredIn: 'Phase 1' },
];

function isScreenId(value: string): value is ScreenId {
  return (SCREEN_IDS as readonly string[]).includes(value);
}

/**
 * Read a screen id out of a location hash. Anything unrecognised - including an
 * empty hash on first load - resolves to the default screen rather than
 * rendering nothing.
 */
export function parseRoute(hash: string): ScreenId {
  const cleaned = hash.replace(/^#\/?/, '').split('?')[0]?.trim().toLowerCase() ?? '';
  return isScreenId(cleaned) ? cleaned : DEFAULT_SCREEN;
}

/** The href for a screen, e.g. '#/progress'. */
export function routeHref(id: ScreenId): string {
  return `#/${id}`;
}
