/**
 * Minimal typed IndexedDB wrapper.
 *
 * Hand-rolled rather than pulled from a package because storage is a core
 * owner: the plan requires that critical saves are written, read back and
 * verified, and that a failed upgrade never destroys history. Owning ~150
 * lines here is cheaper than bending someone else's abstraction around that.
 */

export const DB_NAME = 'workout-conductor';

/**
 * Bumped when a store is added. Every upgrade must be additive - deleting or
 * recreating an object store would take real training history with it.
 */
export const DB_VERSION = 1;

export const STORES = {
  /** Single-record store holding the user profile. */
  profile: 'profile',
  /** Completed sessions. Populated from Phase 5; created now so history has a home. */
  workouts: 'workouts',
  /** Small durable key/value: schema markers, counters, last-backup stamps. */
  meta: 'meta',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

export class StorageUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('IndexedDB is unavailable in this browser context');
    this.name = 'StorageUnavailableError';
    this.cause = cause;
  }
}

export class StorageWriteError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StorageWriteError';
    this.cause = cause;
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open the database, creating stores on first run.
 *
 * The promise is cached, but a rejection clears the cache so a transient
 * failure (private mode prompt, quota) can be retried rather than poisoning
 * every later call.
 */
export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new StorageUnavailableError());
      return;
    }

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(new StorageUnavailableError(error));
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      // Additive only. Never deleteObjectStore here.
      if (!db.objectStoreNames.contains(STORES.profile)) {
        db.createObjectStore(STORES.profile);
      }
      if (!db.objectStoreNames.contains(STORES.workouts)) {
        const workouts = db.createObjectStore(STORES.workouts, { keyPath: 'id' });
        workouts.createIndex('byCompletedAt', 'completedAt');
      }
      if (!db.objectStoreNames.contains(STORES.meta)) {
        db.createObjectStore(STORES.meta);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // Another tab upgrading must not leave this connection blocking it.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => reject(new StorageUnavailableError(request.error));
    request.onblocked = () =>
      reject(new StorageUnavailableError('another tab is holding an older version open'));
  }).catch((error: unknown) => {
    dbPromise = null;
    throw error;
  });

  return dbPromise;
}

async function withStore<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  work: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    let result: T;
    const request = work(transaction.objectStore(store));
    request.onsuccess = () => {
      result = request.result;
    };
    // Resolve on transaction completion, not request success: a write is only
    // real once the transaction commits.
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error ?? new Error('transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('transaction aborted'));
  });
}

export function idbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return withStore<T | undefined>(store, 'readonly', (objectStore) => objectStore.get(key));
}

export function idbGetAll<T>(store: StoreName): Promise<T[]> {
  return withStore<T[]>(store, 'readonly', (objectStore) => objectStore.getAll());
}

export function idbPut<T>(store: StoreName, value: T, key?: IDBValidKey): Promise<IDBValidKey> {
  return withStore<IDBValidKey>(store, 'readwrite', (objectStore) =>
    key === undefined ? objectStore.put(value) : objectStore.put(value, key),
  );
}

export function idbDelete(store: StoreName, key: IDBValidKey): Promise<undefined> {
  return withStore<undefined>(store, 'readwrite', (objectStore) => objectStore.delete(key));
}

export function idbCount(store: StoreName): Promise<number> {
  return withStore<number>(store, 'readonly', (objectStore) => objectStore.count());
}

/** Test seam: forget the cached connection. */
export function resetDatabaseConnection(): void {
  dbPromise = null;
}

/** Whether IndexedDB can actually be opened here, not merely whether it exists. */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await openDatabase();
    return true;
  } catch {
    return false;
  }
}
