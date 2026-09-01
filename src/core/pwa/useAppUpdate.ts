import { useRegisterSW } from 'virtual:pwa-register/react';

export interface AppUpdateState {
  /** A newer deployment is waiting. The user decides when to take it. */
  readonly updateAvailable: boolean;
  /** The shell is cached and the app will open without a network. */
  readonly offlineReady: boolean;
  /** Apply the waiting update and reload. */
  readonly applyUpdate: () => void;
  /** Dismiss without applying; the update stays available for next launch. */
  readonly dismiss: () => void;
}

/**
 * Service-worker lifecycle.
 *
 * The plan is explicit that a deployment must never yank the page out from
 * under a live session, so the worker is registered with skipWaiting off and
 * the update is surfaced as a prompt the user accepts.
 */
export function useAppUpdate(): AppUpdateState {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Poll hourly so a phone left open overnight still notices a deploy.
      if (!registration) return;
      setInterval(
        () => {
          void registration.update();
        },
        60 * 60 * 1000,
      );
    },
  });

  return {
    updateAvailable: needRefresh,
    offlineReady,
    applyUpdate: () => {
      void updateServiceWorker(true);
    },
    dismiss: () => {
      setNeedRefresh(false);
      setOfflineReady(false);
    },
  };
}
