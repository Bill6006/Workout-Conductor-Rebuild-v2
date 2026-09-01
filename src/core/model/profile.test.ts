import { describe, expect, it } from 'vitest';
import {
  activeLimitations,
  activeLocation,
  createDefaultProfile,
  goalLabel,
  PROFILE_SCHEMA_VERSION,
  profileSchema,
} from './profile';
import { EQUIPMENT, EQUIPMENT_GROUP_IDS, EQUIPMENT_IDS, equipmentInGroup } from './equipment';

const NOW = '2026-09-01T12:00:00.000Z';

describe('default profile', () => {
  it('matches the product defaults in the plan', () => {
    const profile = createDefaultProfile(NOW);

    expect(profile.primaryGoal).toBe('build-muscle');
    expect(profile.trainingStyle).toBe('hybrid');
    expect(profile.schemaVersion).toBe(PROFILE_SCHEMA_VERSION);
  });

  it('ships the three built-in locations with Gym active', () => {
    const profile = createDefaultProfile(NOW);

    expect(profile.locations.map((location) => location.id)).toEqual(['gym', 'home', 'travel']);
    expect(profile.locations.every((location) => location.builtIn)).toBe(true);
    expect(profile.activeLocationId).toBe('gym');
  });

  it('gives the Gym profile the full equipment list and Travel almost none', () => {
    const profile = createDefaultProfile(NOW);
    const gym = profile.locations.find((location) => location.id === 'gym')!;
    const travel = profile.locations.find((location) => location.id === 'travel')!;

    expect(gym.equipment).toHaveLength(EQUIPMENT_IDS.length);
    expect(travel.equipment.length).toBeLessThan(5);
  });

  it('does not share equipment arrays between the defaults and a new profile', () => {
    const a = createDefaultProfile(NOW);
    const b = createDefaultProfile(NOW);
    a.locations[1]!.equipment.push('barbell');

    expect(b.locations[1]!.equipment).not.toContain('barbell');
  });
});

describe('profile schema', () => {
  it('rejects an out-of-range weekly frequency', () => {
    const profile = { ...createDefaultProfile(NOW), weeklyFrequency: 0 };
    expect(profileSchema.safeParse(profile).success).toBe(false);
  });

  it('rejects an unknown equipment id', () => {
    const profile = createDefaultProfile(NOW);
    profile.locations[0]!.equipment = ['teleporter' as never];
    expect(profileSchema.safeParse(profile).success).toBe(false);
  });

  it('requires at least one location', () => {
    const profile = { ...createDefaultProfile(NOW), locations: [] };
    expect(profileSchema.safeParse(profile).success).toBe(false);
  });

  it('caps limitation notes so a paste cannot bloat storage', () => {
    const profile = createDefaultProfile(NOW);
    profile.limitations.notes = 'x'.repeat(501);
    expect(profileSchema.safeParse(profile).success).toBe(false);
  });

  it('accepts a null secondary goal and a null bodyweight', () => {
    const profile = { ...createDefaultProfile(NOW), secondaryGoal: null, bodyweight: null };
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });
});

describe('profile helpers', () => {
  it('resolves the active location', () => {
    const profile = createDefaultProfile(NOW);
    expect(activeLocation(profile).name).toBe('Gym');
  });

  it('falls back to the first location when the active id is dangling', () => {
    const profile = { ...createDefaultProfile(NOW), activeLocationId: 'deleted-gym' };
    expect(activeLocation(profile)).toBe(profile.locations[0]);
  });

  it('lists flagged limitation areas, including the squat exclusion', () => {
    const profile = createDefaultProfile(NOW);
    expect(activeLimitations(profile)).toEqual([]);

    profile.limitations.shoulder = true;
    profile.limitations.avoidBarbellSquats = true;
    expect(activeLimitations(profile)).toEqual(['Shoulder', 'No barbell squats']);
  });

  it('labels goals', () => {
    expect(goalLabel('bigger-arms')).toBe('Bigger arms');
  });
});

describe('equipment catalog', () => {
  it('has a unique id for every item', () => {
    expect(new Set(EQUIPMENT.map((item) => item.id)).size).toBe(EQUIPMENT.length);
  });

  it('covers every declared id exactly once', () => {
    expect(EQUIPMENT.map((item) => item.id).sort()).toEqual([...EQUIPMENT_IDS].sort());
  });

  it('assigns every item to a known group, and no group is empty', () => {
    for (const group of EQUIPMENT_GROUP_IDS) {
      expect(equipmentInGroup(group).length).toBeGreaterThan(0);
    }
    const grouped = EQUIPMENT_GROUP_IDS.flatMap((group) => equipmentInGroup(group));
    expect(grouped).toHaveLength(EQUIPMENT.length);
  });
});
