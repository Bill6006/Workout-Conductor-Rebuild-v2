/**
 * Runtime environment probe.
 *
 * Surfaced in Settings so a problem on the phone can be diagnosed from the
 * phone. Every probe is defensive: a locked-down browser (private mode, blocked
 * storage) must degrade to 'unavailable', never throw and blank the screen.
 */

export type Availability = 'available' | 'unavailable';

export interface RuntimeInfo {
  /** 'standalone' when launched from the home screen, otherwise 'browser'. */
  readonly displayMode: 'standalone' | 'browser';
  /** Base path the bundle is served from, e.g. '/Workout-Conductor-Rebuild-v2/'. */
  readonly basePath: string;
  readonly localStorage: Availability;
  readonly indexedDb: Availability;
  readonly serviceWorker: Availability;
  /** Logical viewport width in CSS pixels. */
  readonly viewportWidth: number;
  readonly online: boolean;
}

function probeLocalStorage(): Availability {
  try {
    const key = '__wc_probe__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return 'available';
  } catch {
    return 'unavailable';
  }
}

function probeIndexedDb(): Availability {
  try {
    return typeof globalThis.indexedDB !== 'undefined' ? 'available' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

function probeServiceWorker(): Availability {
  try {
    return 'serviceWorker' in navigator ? 'available' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

function probeDisplayMode(): 'standalone' | 'browser' {
  try {
    return window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser';
  } catch {
    return 'browser';
  }
}

export function readRuntimeInfo(): RuntimeInfo {
  return {
    displayMode: probeDisplayMode(),
    basePath: import.meta.env.BASE_URL,
    localStorage: probeLocalStorage(),
    indexedDb: probeIndexedDb(),
    serviceWorker: probeServiceWorker(),
    viewportWidth: typeof window === 'undefined' ? 0 : window.innerWidth,
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
  };
}
