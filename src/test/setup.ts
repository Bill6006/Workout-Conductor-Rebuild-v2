import '@testing-library/jest-dom/vitest';
// A real IndexedDB implementation, so the storage layer is exercised rather
// than mocked. Verified saves are only meaningful against a real read-back.
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { resetDatabaseConnection } from '../core/storage/idb';
import { __resetProfileStore } from '../core/state/profileStore';
import { clearLocalSettings } from '../core/storage/localSettings';

beforeEach(() => {
  // A fresh database per test: leaked state between tests is the classic way a
  // storage suite passes while the real thing is broken. `indexedDB` is a
  // read-only global, so it is replaced on the object rather than assigned.
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    writable: true,
    value: new IDBFactory(),
  });
  resetDatabaseConnection();
  __resetProfileStore();
  clearLocalSettings();
});

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

// jsdom has no matchMedia; the runtime probe and reduced-motion checks need it.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// jsdom *defines* scrollTo but throws "Not implemented" when it is called, so
// this has to replace it unconditionally rather than fill a gap.
Object.defineProperty(window, 'scrollTo', { writable: true, value: vi.fn() });
