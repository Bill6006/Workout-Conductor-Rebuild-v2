import { useEffect, useState } from 'react';
import { DEFAULT_SCREEN, parseRoute, routeHref, type ScreenId } from './routes';

/**
 * Hash-based routing.
 *
 * Kept deliberately small: no router dependency, works under the GitHub Pages
 * subpath, and the Android back button falls out for free because each tab is
 * a real history entry.
 */
export function useHashRoute(): ScreenId {
  const [screen, setScreen] = useState<ScreenId>(() =>
    typeof window === 'undefined' ? DEFAULT_SCREEN : parseRoute(window.location.hash),
  );

  useEffect(() => {
    // A bare URL has no hash; normalise it so the first Back press does not
    // leave the app on an ambiguous entry.
    if (!window.location.hash) {
      window.history.replaceState(null, '', routeHref(DEFAULT_SCREEN));
    }

    const onHashChange = () => setScreen(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return screen;
}
