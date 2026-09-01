import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

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
