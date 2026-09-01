import type { ScreenId } from '../../app/routes';

/**
 * Line icons drawn inline so the nav has no network dependency and inherits
 * `currentColor` for the active/inactive states.
 */
const PATHS: Record<ScreenId, string> = {
  today: 'M4 9.5 12 3.5l8 6V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Z',
  workout: 'M6.5 9v6M17.5 9v6M3.5 10.5v3M20.5 10.5v3M6.5 12h11',
  progress: 'M4 19V5M4 19h16M8 16v-4M12.5 16V8M17 16v-6',
  plan: 'M5 5.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1ZM4 10h16M8.5 3.5v4M15.5 3.5v4',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.9 18.3a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.88 1.7 1.7 0 0 0-1.56-1.03H2a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 3.7 7.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.88.34H8.1A1.7 1.7 0 0 0 9.13 1.6V1.5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88v.08a1.7 1.7 0 0 0 1.56 1.03h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.56 1.03Z',
};

/** The settings gear above is dense; a simpler glyph reads better at 22px. */
const SIMPLE_SETTINGS =
  'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18.01 5.99l-1.56 1.56M7.55 16.45l-1.56 1.56M18.01 18.01l-1.56-1.56M7.55 7.55 5.99 5.99';

export function NavIcon({ screen, className }: { screen: ScreenId; className?: string }) {
  const d = screen === 'settings' ? SIMPLE_SETTINGS : PATHS[screen];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}
