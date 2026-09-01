import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  getServerSnapshot,
  getSnapshot,
  initializeProfile,
  subscribe,
  updateProfile,
  type PersistOutcome,
  type ProfileState,
} from './profileStore';
import type { Profile } from '../model/profile';

/** Subscribe to profile state and kick off the first load. */
export function useProfile(): ProfileState {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void initializeProfile();
  }, []);

  return state;
}

/**
 * Patch the profile with the current timestamp.
 *
 * Time is passed in from the edge rather than read inside the store so tests
 * stay deterministic.
 */
export function useUpdateProfile(): (patch: Partial<Profile>) => Promise<PersistOutcome> {
  return useCallback(
    (patch: Partial<Profile>) => updateProfile(patch, new Date().toISOString()),
    [],
  );
}
