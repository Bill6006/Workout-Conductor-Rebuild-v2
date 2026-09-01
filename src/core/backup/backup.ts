/**
 * Backup export and import.
 *
 * Phase 1 lays the foundation: a versioned envelope, validation on import, and
 * unknown-field preservation. Phase 8 completes it with exact restore, rollback
 * and the optional legacy adapter.
 *
 * Unknown-field preservation matters more than it looks. If a backup is taken
 * on a newer build and restored on an older one, dropping the fields the older
 * build does not recognise silently destroys data. They are carried through
 * untouched instead.
 */
import { z } from 'zod';
import { profileSchema, type Profile } from '../model/profile';

export const BACKUP_FORMAT = 'workout-conductor-backup';
export const BACKUP_VERSION = 1;

export const backupEnvelopeSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().positive(),
  exportedAt: z.string().datetime(),
  /** Which app build produced the file, for support and debugging. */
  producedBy: z.object({
    phase: z.string(),
    build: z.string(),
  }),
  profile: profileSchema,
  /** Populated from Phase 5. Present now so the shape never changes shape. */
  workouts: z.array(z.unknown()).default([]),
  /**
   * Anything a newer build wrote that this one does not model. Passed through
   * on export and round-tripped on import rather than dropped.
   */
  unknown: z.record(z.unknown()).default({}),
});

export type BackupEnvelope = z.infer<typeof backupEnvelopeSchema>;

/** Envelope keys this build understands; everything else is "unknown". */
const KNOWN_KEYS = new Set([
  'format',
  'version',
  'exportedAt',
  'producedBy',
  'profile',
  'workouts',
  'unknown',
]);

export interface BuildStamp {
  readonly phase: string;
  readonly build: string;
}

export function createBackup(options: {
  profile: Profile;
  workouts?: readonly unknown[];
  build: BuildStamp;
  now: string;
  carriedUnknown?: Record<string, unknown>;
}): BackupEnvelope {
  return backupEnvelopeSchema.parse({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: options.now,
    producedBy: { phase: options.build.phase, build: options.build.build },
    profile: options.profile,
    workouts: [...(options.workouts ?? [])],
    unknown: options.carriedUnknown ?? {},
  });
}

export function serializeBackup(envelope: BackupEnvelope): string {
  return `${JSON.stringify(envelope, null, 2)}\n`;
}

export type ImportResult =
  | { readonly ok: true; readonly envelope: BackupEnvelope; readonly warnings: readonly string[] }
  | { readonly ok: false; readonly error: string };

/**
 * Parse and validate a backup file.
 *
 * Never throws: an import is user-supplied input and a bad file must produce a
 * readable message, not a crashed screen.
 */
export function parseBackup(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'That file does not contain a backup object.' };
  }

  const record = raw as Record<string, unknown>;

  if (record.format !== BACKUP_FORMAT) {
    return {
      ok: false,
      error: 'That file is not a Workout Conductor backup.',
    };
  }

  const warnings: string[] = [];

  const fileVersion = typeof record.version === 'number' ? record.version : 0;
  if (fileVersion > BACKUP_VERSION) {
    warnings.push(
      `This backup was made by a newer version of the app (format ${fileVersion}). Anything this build does not recognise has been preserved but is not shown.`,
    );
  }

  // Collect fields this build does not model, merged with any already carried.
  const carried: Record<string, unknown> = {
    ...((record.unknown as Record<string, unknown> | undefined) ?? {}),
  };
  for (const [key, value] of Object.entries(record)) {
    if (!KNOWN_KEYS.has(key)) carried[key] = value;
  }

  const parsed = backupEnvelopeSchema.safeParse({ ...record, unknown: carried });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.join('.') ?? 'the file';
    return {
      ok: false,
      error: `That backup is not usable: ${where} — ${issue?.message ?? 'invalid'}.`,
    };
  }

  if (Object.keys(carried).length > 0) {
    warnings.push(
      `${Object.keys(carried).length} unrecognised field(s) were preserved and will be written back on the next export.`,
    );
  }

  return { ok: true, envelope: parsed.data, warnings };
}

/** Filename for a downloaded backup. Contains no personal data. */
export function backupFilename(now: string): string {
  const stamp = now.slice(0, 19).replace(/[:T]/g, '-');
  return `workout-conductor-${stamp}.json`;
}
