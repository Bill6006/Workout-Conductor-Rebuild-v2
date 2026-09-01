import { describe, expect, it, vi } from 'vitest';
import { idbGet, idbPut, idbCount, STORES, isDatabaseAvailable } from './idb';
import { deepEqual, saveVerified, saveVerifiedRecord } from './saveVerified';
import { loadProfile, saveProfile, PROFILE_KEY } from './profileRepository';
import {
  clearLocalSettings,
  DEFAULT_LOCAL_SETTINGS,
  LOCAL_SETTINGS_KEY,
  readLocalSettings,
  writeLocalSettings,
} from './localSettings';
import { createDefaultProfile, PROFILE_SCHEMA_VERSION } from '../model/profile';

const NOW = '2026-09-01T12:00:00.000Z';

describe('IndexedDB wrapper', () => {
  it('opens and creates every store the app needs', async () => {
    await expect(isDatabaseAvailable()).resolves.toBe(true);
    await expect(idbCount(STORES.profile)).resolves.toBe(0);
    await expect(idbCount(STORES.workouts)).resolves.toBe(0);
    await expect(idbCount(STORES.meta)).resolves.toBe(0);
  });

  it('round-trips a value through a keyed store', async () => {
    await idbPut(STORES.meta, { hello: 'world' }, 'greeting');
    await expect(idbGet(STORES.meta, 'greeting')).resolves.toEqual({ hello: 'world' });
  });

  it('returns undefined for a key that was never written', async () => {
    await expect(idbGet(STORES.meta, 'absent')).resolves.toBeUndefined();
  });
});

describe('deepEqual', () => {
  it('treats structurally identical values as equal', () => {
    expect(deepEqual({ a: 1, b: [1, 2, { c: 3 }] }, { b: [1, 2, { c: 3 }], a: 1 })).toBe(true);
  });

  it('ignores keys whose value is undefined, which structured clone drops', () => {
    expect(deepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true);
  });

  it('detects real differences', () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual({ a: [1] }, { a: [2] })).toBe(false);
    expect(deepEqual(null, { a: 1 })).toBe(false);
  });
});

describe('saveVerified', () => {
  it('reports success only after reading the value back', async () => {
    const result = await saveVerified(STORES.meta, 'k', { value: 42 });
    expect(result.ok).toBe(true);
    expect(result.persisted).toEqual({ value: 42 });
  });

  it('reports failure when the write throws', async () => {
    const broken = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    const result = await saveVerified(STORES.meta, 'k', { value: 1 });
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('write to meta failed');

    broken.mockRestore();
  });

  it('keys records by their own id in a keyPath store', async () => {
    const record = { id: 'w1', completedAt: NOW, note: 'demo' };
    const result = await saveVerifiedRecord(STORES.workouts, record);
    expect(result.ok).toBe(true);
    await expect(idbGet(STORES.workouts, 'w1')).resolves.toEqual(record);
  });
});

describe('profile repository', () => {
  it('reports empty before anything is saved', async () => {
    await expect(loadProfile()).resolves.toEqual({ status: 'empty' });
  });

  it('saves and loads a profile unchanged', async () => {
    const profile = createDefaultProfile(NOW);
    const saved = await saveProfile(profile);
    expect(saved.ok).toBe(true);

    const loaded = await loadProfile();
    expect(loaded.status).toBe('found');
    if (loaded.status === 'found') {
      expect(loaded.profile).toEqual(profile);
    }
  });

  it('refuses to save a profile that fails validation', async () => {
    const invalid = { ...createDefaultProfile(NOW), weeklyFrequency: 99 };
    const result = await saveProfile(invalid);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('refusing to save an invalid profile');
    // Nothing reached storage.
    await expect(loadProfile()).resolves.toEqual({ status: 'empty' });
  });

  it('migrates a profile stored without a schema version', async () => {
    const { schemaVersion: _omitted, ...legacy } = createDefaultProfile(NOW);
    await idbPut(STORES.profile, legacy, PROFILE_KEY);

    const loaded = await loadProfile();
    expect(loaded.status).toBe('found');
    if (loaded.status === 'found') {
      expect(loaded.profile.schemaVersion).toBe(PROFILE_SCHEMA_VERSION);
    }
  });

  it('recovers a stored profile that no longer validates rather than losing it', async () => {
    const damaged = { ...createDefaultProfile(NOW), weeklyFrequency: 'lots', units: 'stone' };
    await idbPut(STORES.profile, damaged, PROFILE_KEY);

    const loaded = await loadProfile();
    expect(loaded.status).toBe('recovered');
    if (loaded.status === 'recovered') {
      // The salvageable parts survive; the invalid ones fall back to defaults.
      expect(loaded.profile.primaryGoal).toBe('build-muscle');
      expect(loaded.profile.weeklyFrequency).toBe(4);
      expect(loaded.reason).toBeTruthy();
    }
  });
});

describe('local settings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(readLocalSettings()).toEqual(DEFAULT_LOCAL_SETTINGS);
  });

  it('merges a patch and reads it back', () => {
    writeLocalSettings({ onboarded: true, units: 'lb' });
    const settings = readLocalSettings();
    expect(settings.onboarded).toBe(true);
    expect(settings.units).toBe('lb');
    // Untouched fields keep their defaults.
    expect(settings.activeLocationId).toBe('gym');
  });

  it('falls back to defaults on corrupt JSON instead of throwing', () => {
    window.localStorage.setItem(LOCAL_SETTINGS_KEY, '{not json');
    expect(() => readLocalSettings()).not.toThrow();
    expect(readLocalSettings()).toEqual(DEFAULT_LOCAL_SETTINGS);
  });

  it('discards stored values that fail validation', () => {
    window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify({ units: 'stone' }));
    expect(readLocalSettings()).toEqual(DEFAULT_LOCAL_SETTINGS);
  });

  it('clears cleanly', () => {
    writeLocalSettings({ onboarded: true });
    clearLocalSettings();
    expect(readLocalSettings().onboarded).toBe(false);
  });
});
