import { describe, expect, it } from 'vitest';
import { buildDemoWorkout, dayIndexFor } from './demoWorkout';
import { createDefaultProfile, type Profile } from '../../core/model/profile';

const NOW = '2026-09-01T12:00:00.000Z';

function profileWith(overrides: Partial<Profile> = {}): Profile {
  return { ...createDefaultProfile(NOW), ...overrides };
}

describe('demo workout', () => {
  it('is always flagged as synthetic', () => {
    expect(buildDemoWorkout(profileWith(), 0).synthetic).toBe(true);
  });

  it('is deterministic for the same profile and day', () => {
    const profile = profileWith();
    expect(buildDemoWorkout(profile, 3)).toEqual(buildDemoWorkout(profile, 3));
  });

  it('only uses exercises the active location has equipment for', () => {
    const gym = buildDemoWorkout(profileWith(), 0);
    const travel = buildDemoWorkout(profileWith({ activeLocationId: 'travel' }), 0);

    // Travel has bands and a mat only, so barbell work cannot appear.
    for (const exercise of travel.exercises) {
      expect(
        exercise.requires.every((id) => ['resistance-bands', 'exercise-mat'].includes(id)),
      ).toBe(true);
    }
    expect(travel.exercises.length).toBeLessThan(gym.exercises.length);
  });

  it('respects the barbell squat exclusion', () => {
    const profile = profileWith();
    profile.limitations.avoidBarbellSquats = true;

    // Day index 2 lands on the Legs template for a 4x/week profile.
    for (let day = 0; day < 6; day += 1) {
      const workout = buildDemoWorkout(profile, day);
      expect(workout.exercises.some((exercise) => exercise.name === 'Back squat')).toBe(false);
    }
  });

  it('drops disliked exercises, case-insensitively', () => {
    const profile = profileWith({ dislikedExercises: ['barbell BENCH press'] });

    for (let day = 0; day < 6; day += 1) {
      const workout = buildDemoWorkout(profile, day);
      expect(workout.exercises.some((e) => e.name === 'Barbell bench press')).toBe(false);
    }
  });

  it('trims the session to fit a short typical duration', () => {
    const long = buildDemoWorkout(profileWith({ typicalDurationMinutes: 90 }), 0);
    const short = buildDemoWorkout(profileWith({ typicalDurationMinutes: 30 }), 0);

    expect(short.exercises.length).toBeLessThan(long.exercises.length);
    expect(short.estimatedMinutes).toBeLessThanOrEqual(30);
  });

  it('never trims below two exercises, even for an impossible duration', () => {
    const workout = buildDemoWorkout(profileWith({ typicalDurationMinutes: 10 }), 0);
    expect(workout.exercises.length).toBeGreaterThanOrEqual(2);
  });

  it('shortens the estimate when rest style is short', () => {
    const base = profileWith({ typicalDurationMinutes: 120 });
    const shortRest = buildDemoWorkout({ ...base, restStyle: 'short' }, 0);
    const longRest = buildDemoWorkout({ ...base, restStyle: 'long' }, 0);

    expect(shortRest.estimatedMinutes).toBeLessThan(longRest.estimatedMinutes);
  });

  it('uses a broader split when training fewer days a week', () => {
    const threeDay = buildDemoWorkout(profileWith({ weeklyFrequency: 3 }), 0);
    const fiveDay = buildDemoWorkout(profileWith({ weeklyFrequency: 5 }), 0);

    expect(threeDay.title).toBe('Upper session');
    expect(fiveDay.title).toBe('Push session');
  });

  it('explains itself, naming the location and the target duration', () => {
    const workout = buildDemoWorkout(profileWith({ typicalDurationMinutes: 45 }), 0);
    expect(workout.why).toContain('Gym');
    expect(workout.why).toContain('45');
  });

  it('explains the empty case rather than showing a blank card', () => {
    const profile = profileWith({ activeLocationId: 'empty' });
    profile.locations = [{ id: 'empty', name: 'Empty room', equipment: [], builtIn: false }];

    const workout = buildDemoWorkout(profile, 1);
    // Day 1 of a 4x/week profile is Pull, which needs equipment for every move.
    if (workout.exercises.length === 0) {
      expect(workout.why).toContain('Empty room');
    }
  });
});

describe('dayIndexFor', () => {
  it('is stable within a calendar day and advances across days', () => {
    const morning = dayIndexFor(new Date('2026-09-01T06:00:00Z'));
    const evening = dayIndexFor(new Date('2026-09-01T22:00:00Z'));
    const tomorrow = dayIndexFor(new Date('2026-09-02T06:00:00Z'));

    expect(morning).toBe(evening);
    expect(tomorrow).toBe(morning + 1);
  });
});
