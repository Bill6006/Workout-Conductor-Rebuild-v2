/**
 * localStorage for small settings and active-session metadata only.
 *
 * The plan draws a hard line: durable training data lives in IndexedDB, and
 * localStorage holds only what must be readable synchronously on first paint.
 * Everything here is small, regenerable, and safe to lose.
 */
import { z } from 'zod';

const KEY = 'wc.settings.v1';

export const localSettingsSchema = z.object({
  /** Whether onboarding has been completed at least once. */
  onboarded: z.boolean().default(false),
  /** Resume point if onboarding is abandoned part-way. */
  onboardingStep: z.number().int().min(0).max(20).default(0),
  /** Mirrored from the profile so the first paint does not wait on IndexedDB. */
  units: z.enum(['kg', 'lb']).default('kg'),
  /** Active-session metadata: which location profile is selected right now. */
  activeLocationId: z.string().min(1).default('gym'),
  /** Respect the OS setting by default; the user can force animations off. */
  reduceMotion: z.boolean().default(false),
});

export type LocalSettings = z.infer<typeof localSettingsSchema>;

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = localSettingsSchema.parse({});

function storage(): Storage | null {
  try {
    // Touching localStorage throws outright in some locked-down contexts.
    const probe = '__wc_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Read settings, falling back to defaults on anything unexpected.
 *
 * Corrupt or partial JSON must never block the app from starting, so a parse
 * failure is treated as "no settings yet" rather than an error.
 */
export function readLocalSettings(): LocalSettings {
  const store = storage();
  if (!store) return DEFAULT_LOCAL_SETTINGS;

  const raw = store.getItem(KEY);
  if (!raw) return DEFAULT_LOCAL_SETTINGS;

  try {
    const parsed = localSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_LOCAL_SETTINGS;
  } catch {
    return DEFAULT_LOCAL_SETTINGS;
  }
}

/**
 * Merge a patch into the stored settings and read back to confirm.
 *
 * Returns the settings as they now actually are, so a caller that cannot
 * persist still renders consistent state for the rest of the session.
 */
export function writeLocalSettings(patch: Partial<LocalSettings>): LocalSettings {
  const next = localSettingsSchema.parse({ ...readLocalSettings(), ...patch });
  const store = storage();
  if (!store) return next;

  try {
    store.setItem(KEY, JSON.stringify(next));
    // Read-back: a quota failure can be silent on some mobile browsers.
    const confirmed = readLocalSettings();
    return confirmed;
  } catch {
    return next;
  }
}

export function clearLocalSettings(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // Nothing to do - the settings are regenerable by design.
  }
}

/** Exposed for diagnostics and tests. */
export const LOCAL_SETTINGS_KEY = KEY;
