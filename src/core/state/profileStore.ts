/**
 * Profile state.
 *
 * A small external store rather than a context reducer: the profile is read by
 * nearly every screen but written rarely, and `useSyncExternalStore` gives
 * correct tearing behaviour without re-rendering the tree on every keystroke.
 *
 * The store is deliberately tolerant of storage failure. If IndexedDB cannot be
 * opened - private mode, blocked site data - the app still runs with an
 * in-memory profile and says so, rather than showing a dead screen.
 */
import { createDefaultProfile, profileSchema, type Profile } from '../model/profile';
import { loadProfile, saveProfile } from '../storage/profileRepository';
import { readLocalSettings, writeLocalSettings } from '../storage/localSettings';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ProfileState {
  /** False until the first load attempt settles. */
  readonly loaded: boolean;
  readonly profile: Profile | null;
  readonly onboarded: boolean;
  readonly saveStatus: SaveStatus;
  /** Set when a save failed verification, so the UI can say so plainly. */
  readonly saveError: string | null;
  /** False when the profile is being held in memory only. */
  readonly durable: boolean;
  /** Non-null when a stored profile had to be repaired on load. */
  readonly recoveryNote: string | null;
}

const INITIAL: ProfileState = {
  loaded: false,
  profile: null,
  onboarded: false,
  saveStatus: 'idle',
  saveError: null,
  durable: true,
  recoveryNote: null,
};

let state: ProfileState = INITIAL;
const listeners = new Set<() => void>();

function setState(patch: Partial<ProfileState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): ProfileState {
  return state;
}

/** Server snapshot for any future SSR; the app is client-only today. */
export function getServerSnapshot(): ProfileState {
  return INITIAL;
}

let initializing: Promise<void> | null = null;

/** Idempotent: concurrent callers share one load. */
export function initializeProfile(): Promise<void> {
  if (initializing) return initializing;

  initializing = (async () => {
    const settings = readLocalSettings();
    const result = await loadProfile();

    switch (result.status) {
      case 'found':
        setState({
          loaded: true,
          profile: result.profile,
          onboarded: settings.onboarded,
          durable: true,
          recoveryNote: null,
        });
        break;

      case 'recovered':
        setState({
          loaded: true,
          profile: result.profile,
          onboarded: settings.onboarded,
          durable: true,
          recoveryNote: `Your saved setup needed repairing: ${result.reason}`,
        });
        break;

      case 'empty':
        setState({
          loaded: true,
          profile: null,
          onboarded: false,
          durable: true,
          recoveryNote: null,
        });
        break;

      case 'unavailable':
        // Storage is gone, not the app. Run from memory and be honest about it.
        setState({
          loaded: true,
          profile: null,
          onboarded: false,
          durable: false,
          recoveryNote: null,
        });
        break;
    }
  })();

  return initializing;
}

export interface PersistOutcome {
  readonly ok: boolean;
  readonly error?: string;
}

async function persist(next: Profile): Promise<PersistOutcome> {
  setState({ profile: next, saveStatus: 'saving', saveError: null });

  if (!state.durable) {
    // Nothing to verify against; the in-memory profile is already updated.
    setState({ saveStatus: 'saved' });
    return { ok: true };
  }

  const result = await saveProfile(next);
  if (result.ok) {
    setState({ saveStatus: 'saved', saveError: null });
    return { ok: true };
  }

  const message = result.error?.message ?? 'The change could not be saved to this device.';
  setState({ saveStatus: 'error', saveError: message });
  return { ok: false, error: message };
}

/** Merge a patch into the current profile and save it. */
export async function updateProfile(patch: Partial<Profile>, now: string): Promise<PersistOutcome> {
  const current = state.profile ?? createDefaultProfile(now);
  const merged = profileSchema.safeParse({ ...current, ...patch, updatedAt: now });

  if (!merged.success) {
    const message = merged.error.issues[0]?.message ?? 'That change is not valid.';
    setState({ saveStatus: 'error', saveError: message });
    return { ok: false, error: message };
  }

  return persist(merged.data);
}

/** Finish onboarding: save the profile and record that setup is done. */
export async function completeOnboarding(profile: Profile, now: string): Promise<PersistOutcome> {
  const parsed = profileSchema.safeParse({ ...profile, updatedAt: now });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Setup could not be completed.';
    setState({ saveStatus: 'error', saveError: message });
    return { ok: false, error: message };
  }

  const outcome = await persist(parsed.data);
  // Onboarding is complete even when the device refused the write: the profile
  // is live in memory, and blocking the user behind a storage failure would
  // trap them on the setup screen forever.
  writeLocalSettings({
    onboarded: true,
    onboardingStep: 0,
    units: parsed.data.units,
    activeLocationId: parsed.data.activeLocationId,
  });
  setState({ onboarded: true });
  return outcome;
}

/** Replace the whole profile, e.g. after a backup import. */
export async function replaceProfile(profile: Profile, now: string): Promise<PersistOutcome> {
  const outcome = await updateProfile(profile, now);
  writeLocalSettings({ units: profile.units, activeLocationId: profile.activeLocationId });
  return outcome;
}

/** Clear the save banner once the user has seen it. */
export function acknowledgeSaveStatus(): void {
  setState({ saveStatus: 'idle', saveError: null });
}

export function dismissRecoveryNote(): void {
  setState({ recoveryNote: null });
}

/** Test seam. */
export function __resetProfileStore(): void {
  state = INITIAL;
  initializing = null;
  listeners.clear();
}
