import { describe, expect, it } from 'vitest';
import { buildInfo, formatBuildMarker, formatBuildTime } from './buildInfo';

describe('buildInfo', () => {
  it('is injected at build time with a non-empty id, time and phase', () => {
    expect(buildInfo.id).toBeTruthy();
    expect(buildInfo.time).toBeTruthy();
    expect(buildInfo.phase).toMatch(/^Phase \d/);
  });
});

describe('formatBuildTime', () => {
  it('formats an ISO timestamp as a readable UTC string', () => {
    expect(formatBuildTime('2026-09-01T14:32:07.000Z')).toBe('1 Sep 2026, 14:32 UTC');
  });

  it('pads single-digit hours and minutes', () => {
    expect(formatBuildTime('2026-01-09T04:05:00.000Z')).toBe('9 Jan 2026, 04:05 UTC');
  });

  it('degrades to "unknown" rather than throwing on a bad value', () => {
    expect(formatBuildTime('not-a-date')).toBe('unknown');
    expect(formatBuildTime('')).toBe('unknown');
  });
});

describe('formatBuildMarker', () => {
  it('joins the phase and short build id', () => {
    expect(
      formatBuildMarker({ id: 'a1b2c3d', time: '2026-09-01T00:00:00Z', phase: 'Phase 0' }),
    ).toBe('Phase 0 · build a1b2c3d');
  });

  it('defaults to the injected build info', () => {
    expect(formatBuildMarker()).toContain(buildInfo.id);
  });
});
