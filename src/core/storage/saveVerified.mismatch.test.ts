/**
 * The read-back guard, exercised directly.
 *
 * saveVerified exists to catch a write that appears to succeed but did not
 * persist correctly. Those paths are unreachable through a healthy IndexedDB,
 * so they are driven here through the injected storage io.
 */
import { describe, expect, it, vi } from 'vitest';
import { saveVerified, saveVerifiedRecord, type StorageIO } from './saveVerified';

function io(overrides: Partial<StorageIO>): StorageIO {
  return {
    put: vi.fn().mockResolvedValue('key'),
    get: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as StorageIO;
}

describe('saveVerified read-back guard', () => {
  it('fails when the value read back differs from the value written', async () => {
    const result = await saveVerified(
      'meta',
      'k',
      { value: 'written' },
      io({ get: vi.fn().mockResolvedValue({ value: 'something else' }) }),
    );

    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('did not match what was written');
    expect(result.persisted).toEqual({ value: 'something else' });
  });

  it('fails when the read-back returns nothing at all', async () => {
    const result = await saveVerified(
      'meta',
      'k',
      { value: 'written' },
      io({ get: vi.fn().mockResolvedValue(undefined) }),
    );

    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('returned nothing');
  });

  it('fails when the read-back itself throws', async () => {
    const result = await saveVerified(
      'meta',
      'k',
      { value: 'written' },
      io({ get: vi.fn().mockRejectedValue(new Error('connection lost')) }),
    );

    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('read-back from meta failed');
  });

  it('fails when the write itself rejects', async () => {
    const result = await saveVerified(
      'meta',
      'k',
      { value: 'written' },
      io({ put: vi.fn().mockRejectedValue(new Error('quota exceeded')) }),
    );

    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('write to meta failed');
  });

  it('succeeds only when the read-back matches', async () => {
    const result = await saveVerified(
      'meta',
      'k',
      { value: 'written' },
      io({ get: vi.fn().mockResolvedValue({ value: 'written' }) }),
    );

    expect(result.ok).toBe(true);
  });

  it('applies the same guard to keyPath records', async () => {
    const record = { id: 'w1', reps: 8 };

    const bad = await saveVerifiedRecord(
      'workouts',
      record,
      io({ get: vi.fn().mockResolvedValue({ id: 'w1', reps: 5 }) }),
    );
    expect(bad.ok).toBe(false);

    const good = await saveVerifiedRecord(
      'workouts',
      record,
      io({ get: vi.fn().mockResolvedValue(record) }),
    );
    expect(good.ok).toBe(true);
  });
});
