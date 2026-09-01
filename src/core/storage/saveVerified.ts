/**
 * Verified saves.
 *
 * The plan is explicit: critical saves must write, read back and verify before
 * reporting success. A save that silently failed is worse than one that failed
 * loudly - the user trains for weeks believing their history is safe.
 *
 * This is the only path critical data should take into storage.
 */
import { idbGet, idbPut, StorageWriteError, type StoreName } from './idb';

/**
 * The two storage calls this module needs.
 *
 * Injectable so the failure paths - a write that rejects, a read-back that
 * returns the wrong value - can be tested directly. They are unreachable
 * through a healthy IndexedDB, and a guard that has never been seen to fire is
 * not a guard.
 */
export interface StorageIO {
  put: (store: StoreName, value: unknown, key?: IDBValidKey) => Promise<IDBValidKey>;
  get: <T>(store: StoreName, key: IDBValidKey) => Promise<T | undefined>;
}

const REAL_IO: StorageIO = {
  put: (store, value, key) => idbPut(store, value, key),
  get: (store, key) => idbGet(store, key),
};

export interface SaveResult<T> {
  readonly ok: boolean;
  /** What was actually read back out of storage. */
  readonly persisted?: T;
  readonly error?: Error;
}

/**
 * Structural equality over JSON-serialisable data.
 *
 * IndexedDB round-trips through the structured clone algorithm, so key order
 * can change and `undefined` properties disappear. Comparing normalised JSON
 * rather than references is what makes the read-back meaningful.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === 'object') {
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    // Keys whose value is undefined do not survive a structured clone, so they
    // must not count as a difference.
    const aKeys = Object.keys(aRecord).filter((key) => aRecord[key] !== undefined);
    const bKeys = Object.keys(bRecord).filter((key) => bRecord[key] !== undefined);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => bKeys.includes(key) && deepEqual(aRecord[key], bRecord[key]));
  }

  return false;
}

/**
 * Write a value, read it back, and confirm it matches.
 *
 * Resolves with `ok: false` rather than throwing, so callers can surface a
 * "not saved" state in the UI instead of crashing a screen mid-workout.
 */
export async function saveVerified<T>(
  store: StoreName,
  key: IDBValidKey,
  value: T,
  io: StorageIO = REAL_IO,
): Promise<SaveResult<T>> {
  try {
    await io.put(store, value, key);
  } catch (error) {
    return {
      ok: false,
      error: new StorageWriteError(`write to ${store} failed`, error),
    };
  }

  let persisted: T | undefined;
  try {
    persisted = await io.get<T>(store, key);
  } catch (error) {
    return {
      ok: false,
      error: new StorageWriteError(`read-back from ${store} failed`, error),
    };
  }

  if (persisted === undefined) {
    return {
      ok: false,
      error: new StorageWriteError(`read-back from ${store} returned nothing`),
    };
  }

  if (!deepEqual(value, persisted)) {
    return {
      ok: false,
      persisted,
      error: new StorageWriteError(`read-back from ${store} did not match what was written`),
    };
  }

  return { ok: true, persisted };
}

/** Records with their own keyPath (the workouts store) key off the record id. */
export async function saveVerifiedRecord<T extends { id: string }>(
  store: StoreName,
  value: T,
  io: StorageIO = REAL_IO,
): Promise<SaveResult<T>> {
  try {
    await io.put(store, value);
  } catch (error) {
    return { ok: false, error: new StorageWriteError(`write to ${store} failed`, error) };
  }

  try {
    const persisted = await io.get<T>(store, value.id);
    if (persisted === undefined) {
      return {
        ok: false,
        error: new StorageWriteError(`read-back from ${store} returned nothing`),
      };
    }
    if (!deepEqual(value, persisted)) {
      return {
        ok: false,
        persisted,
        error: new StorageWriteError(`read-back from ${store} did not match what was written`),
      };
    }
    return { ok: true, persisted };
  } catch (error) {
    return { ok: false, error: new StorageWriteError(`read-back from ${store} failed`, error) };
  }
}
