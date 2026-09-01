import { describe, expect, it, vi } from 'vitest';
import { readRuntimeInfo } from './runtimeInfo';

describe('readRuntimeInfo', () => {
  it('reports the probes the Settings diagnostics panel renders', () => {
    const info = readRuntimeInfo();
    expect(info.localStorage).toBe('available');
    expect(['available', 'unavailable']).toContain(info.indexedDb);
    expect(['available', 'unavailable']).toContain(info.serviceWorker);
    expect(info.displayMode).toBe('browser');
    expect(typeof info.basePath).toBe('string');
  });

  it('reports storage as unavailable instead of throwing when it is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(() => readRuntimeInfo()).not.toThrow();
    expect(readRuntimeInfo().localStorage).toBe('unavailable');
  });

  it('survives a browser with no matchMedia support', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() => {
      throw new Error('unsupported');
    });

    expect(readRuntimeInfo().displayMode).toBe('browser');
  });
});
