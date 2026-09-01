import { describe, expect, it } from 'vitest';
import { DEFAULT_SCREEN, NAV_ITEMS, SCREEN_IDS, parseRoute, routeHref } from './routes';

describe('parseRoute', () => {
  it('reads each known screen from its canonical hash', () => {
    for (const id of SCREEN_IDS) {
      expect(parseRoute(`#/${id}`)).toBe(id);
    }
  });

  it('accepts a hash without the leading slash', () => {
    expect(parseRoute('#settings')).toBe('settings');
  });

  it('is case-insensitive and ignores surrounding whitespace', () => {
    expect(parseRoute('#/PROGRESS')).toBe('progress');
    expect(parseRoute('#/  plan  ')).toBe('plan');
  });

  it('ignores a query string appended to the hash', () => {
    expect(parseRoute('#/workout?from=push')).toBe('workout');
  });

  it('falls back to the default screen for empty, unknown, or malformed hashes', () => {
    expect(parseRoute('')).toBe(DEFAULT_SCREEN);
    expect(parseRoute('#')).toBe(DEFAULT_SCREEN);
    expect(parseRoute('#/')).toBe(DEFAULT_SCREEN);
    expect(parseRoute('#/nope')).toBe(DEFAULT_SCREEN);
    expect(parseRoute('#/../../etc/passwd')).toBe(DEFAULT_SCREEN);
  });

  it('round-trips through routeHref', () => {
    for (const id of SCREEN_IDS) {
      expect(parseRoute(routeHref(id))).toBe(id);
    }
  });
});

describe('NAV_ITEMS', () => {
  it('covers every screen exactly once, in navigation order', () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual([...SCREEN_IDS]);
  });

  it('gives every tab a label and a delivery phase', () => {
    for (const item of NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.deliveredIn).toMatch(/^Phase \d$/);
    }
  });

  it('keeps labels short enough for a five-up bar at 360px', () => {
    for (const item of NAV_ITEMS) {
      expect(item.label.length).toBeLessThanOrEqual(9);
    }
  });
});
