import { describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  backupFilename,
  createBackup,
  parseBackup,
  serializeBackup,
} from './backup';
import { createDefaultProfile } from '../model/profile';

const NOW = '2026-09-01T12:34:56.000Z';
const BUILD = { phase: 'Phase 1', build: 'abc1234' };

function backupText(overrides: Record<string, unknown> = {}): string {
  const envelope = createBackup({ profile: createDefaultProfile(NOW), build: BUILD, now: NOW });
  return JSON.stringify({ ...envelope, ...overrides });
}

describe('createBackup', () => {
  it('stamps the format, version, time and producing build', () => {
    const envelope = createBackup({ profile: createDefaultProfile(NOW), build: BUILD, now: NOW });

    expect(envelope.format).toBe(BACKUP_FORMAT);
    expect(envelope.version).toBe(BACKUP_VERSION);
    expect(envelope.exportedAt).toBe(NOW);
    expect(envelope.producedBy).toEqual(BUILD);
  });

  it('serialises to JSON ending in a newline', () => {
    const text = serializeBackup(
      createBackup({ profile: createDefaultProfile(NOW), build: BUILD, now: NOW }),
    );
    expect(text.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(text)).not.toThrow();
  });
});

describe('parseBackup', () => {
  it('round-trips an exported backup', () => {
    const profile = createDefaultProfile(NOW);
    const text = serializeBackup(createBackup({ profile, build: BUILD, now: NOW }));

    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.envelope.profile).toEqual(profile);
      expect(result.warnings).toEqual([]);
    }
  });

  it('rejects a file that is not JSON', () => {
    const result = parseBackup('definitely not json');
    expect(result).toEqual({ ok: false, error: 'That file is not valid JSON.' });
  });

  it('rejects JSON that is not a backup object', () => {
    expect(parseBackup('[]').ok).toBe(false);
    expect(parseBackup('42').ok).toBe(false);
  });

  it('rejects another app’s JSON file', () => {
    const result = parseBackup(JSON.stringify({ format: 'some-other-app', version: 1 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('not a Workout Conductor backup');
  });

  it('names the offending field when the profile is invalid', () => {
    const broken = JSON.parse(backupText()) as Record<string, unknown>;
    (broken.profile as Record<string, unknown>).weeklyFrequency = 99;

    const result = parseBackup(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('profile.weeklyFrequency');
  });

  it('preserves fields a newer build wrote that this one does not model', () => {
    const withFuture = JSON.parse(backupText()) as Record<string, unknown>;
    withFuture.coachTargets = [{ exercise: 'bench', target: 100 }];
    withFuture.customExercises = ['my-exercise'];

    const result = parseBackup(JSON.stringify(withFuture));
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Carried, not dropped - restoring on an older build must not destroy data.
      expect(result.envelope.unknown.coachTargets).toEqual([{ exercise: 'bench', target: 100 }]);
      expect(result.envelope.unknown.customExercises).toEqual(['my-exercise']);
      expect(result.warnings.join(' ')).toContain('preserved');
    }
  });

  it('carries preserved fields back out on the next export', () => {
    const withFuture = JSON.parse(backupText()) as Record<string, unknown>;
    withFuture.futureThing = { keep: true };

    const imported = parseBackup(JSON.stringify(withFuture));
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;

    const reExported = createBackup({
      profile: imported.envelope.profile,
      build: BUILD,
      now: NOW,
      carriedUnknown: imported.envelope.unknown,
    });

    expect(reExported.unknown.futureThing).toEqual({ keep: true });
  });

  it('warns but still imports when the file format is newer', () => {
    const newer = JSON.parse(backupText({ version: BACKUP_VERSION + 5 })) as Record<
      string,
      unknown
    >;

    const result = parseBackup(JSON.stringify(newer));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings.join(' ')).toContain('newer version');
    }
  });
});

describe('backupFilename', () => {
  it('is stamped with the export time and contains no personal data', () => {
    const name = backupFilename(NOW);
    expect(name).toBe('workout-conductor-2026-09-01-12-34-56.json');
    expect(name).not.toMatch(/[A-Za-z0-9._%+-]+@/);
  });
});
