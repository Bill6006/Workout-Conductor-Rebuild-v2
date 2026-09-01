/**
 * The one way the profile gets into and out of durable storage.
 *
 * Reads validate through Zod, so a profile written by an older build, edited by
 * hand, or restored from a backup cannot put an invalid shape into the app.
 * Writes go through saveVerified, so "saved" means read back and matched.
 */
import { idbGet, STORES, StorageWriteError } from './idb';
import { saveVerified, type SaveResult } from './saveVerified';
import {
  createDefaultProfile,
  profileSchema,
  PROFILE_SCHEMA_VERSION,
  type Profile,
} from '../model/profile';

const PROFILE_KEY = 'current';

export type ProfileLoad =
  | { readonly status: 'found'; readonly profile: Profile }
  | { readonly status: 'empty' }
  | { readonly status: 'recovered'; readonly profile: Profile; readonly reason: string }
  | { readonly status: 'unavailable'; readonly error: Error };

/**
 * Bring an older stored profile up to the current schema.
 *
 * Additive-only so far, and Zod's defaults fill anything missing. Kept as a
 * named seam so Phase 8's real migration work has somewhere to live.
 */
function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version >= PROFILE_SCHEMA_VERSION) return raw;
  // v0 -> v1: fields added since are all optional with defaults.
  return { ...raw, schemaVersion: PROFILE_SCHEMA_VERSION };
}

/**
 * Keep only the fields that validate on their own.
 *
 * One corrupt field should cost the user that field, not their whole setup.
 */
function salvageableFields(raw: Record<string, unknown>): Record<string, unknown> {
  const shape = profileSchema.shape as Record<
    string,
    { safeParse: (value: unknown) => { success: boolean } }
  >;
  const kept: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const fieldSchema = shape[key];
    if (fieldSchema && fieldSchema.safeParse(value).success) {
      kept[key] = value;
    }
  }

  return kept;
}

export async function loadProfile(): Promise<ProfileLoad> {
  let stored: unknown;
  try {
    stored = await idbGet<unknown>(STORES.profile, PROFILE_KEY);
  } catch (error) {
    return { status: 'unavailable', error: error as Error };
  }

  if (stored === undefined || stored === null) return { status: 'empty' };

  const migrated = migrate(stored as Record<string, unknown>);
  const parsed = profileSchema.safeParse(migrated);

  if (parsed.success) return { status: 'found', profile: parsed.data };

  // A stored profile that no longer validates must not brick the app. Salvage
  // it field by field: spreading the whole damaged record over the defaults
  // would just re-introduce the invalid values it failed on.
  const salvaged = profileSchema.safeParse({
    ...createDefaultProfile(new Date().toISOString()),
    ...salvageableFields(migrated),
    schemaVersion: PROFILE_SCHEMA_VERSION,
  });

  if (salvaged.success) {
    return {
      status: 'recovered',
      profile: salvaged.data,
      reason: parsed.error.issues[0]?.message ?? 'stored profile failed validation',
    };
  }

  return {
    status: 'unavailable',
    error: new StorageWriteError('stored profile could not be recovered'),
  };
}

/** Validates before writing: an invalid profile never reaches storage. */
export async function saveProfile(profile: Profile): Promise<SaveResult<Profile>> {
  const parsed = profileSchema.safeParse(profile);
  if (!parsed.success) {
    return {
      ok: false,
      error: new StorageWriteError(
        `refusing to save an invalid profile: ${parsed.error.issues[0]?.message ?? 'unknown'}`,
      ),
    };
  }
  return saveVerified(STORES.profile, PROFILE_KEY, parsed.data);
}

export { PROFILE_KEY };
