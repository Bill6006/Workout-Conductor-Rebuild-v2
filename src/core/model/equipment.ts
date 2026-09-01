/**
 * Equipment model.
 *
 * A deliberately small, stable vocabulary: these ids become foreign keys in the
 * exercise catalog (Phase 2) and drive availability filtering in the generation
 * and alternatives engines (Phases 3 and 5). Renaming an id later means a data
 * migration, so they are named for the thing, not the marketing term.
 */

export const EQUIPMENT_IDS = [
  // free weights
  'barbell',
  'ez-bar',
  'dumbbells',
  'adjustable-dumbbells',
  'kettlebell',
  'weight-plates',
  // benches and racks
  'flat-bench',
  'adjustable-bench',
  'squat-rack',
  'smith-machine',
  // cables and machines
  'cable-machine',
  'lat-pulldown',
  'seated-row',
  'chest-press-machine',
  'shoulder-press-machine',
  'pec-deck',
  'leg-press',
  'leg-curl',
  'leg-extension',
  'calf-machine',
  'hip-thrust-machine',
  // bodyweight and portable
  'pull-up-bar',
  'dip-bars',
  'resistance-bands',
  'suspension-trainer',
  'ab-wheel',
  'exercise-mat',
  'plyo-box',
] as const;

export type EquipmentId = (typeof EQUIPMENT_IDS)[number];

export interface EquipmentItem {
  readonly id: EquipmentId;
  readonly label: string;
  readonly group: EquipmentGroupId;
}

export const EQUIPMENT_GROUP_IDS = [
  'free-weights',
  'benches-racks',
  'machines',
  'portable',
] as const;

export type EquipmentGroupId = (typeof EQUIPMENT_GROUP_IDS)[number];

export const EQUIPMENT_GROUPS: Record<EquipmentGroupId, string> = {
  'free-weights': 'Free weights',
  'benches-racks': 'Benches and racks',
  machines: 'Machines and cables',
  portable: 'Bodyweight and portable',
};

export const EQUIPMENT: readonly EquipmentItem[] = [
  { id: 'barbell', label: 'Barbell', group: 'free-weights' },
  { id: 'ez-bar', label: 'EZ bar', group: 'free-weights' },
  { id: 'dumbbells', label: 'Dumbbells', group: 'free-weights' },
  { id: 'adjustable-dumbbells', label: 'Adjustable dumbbells', group: 'free-weights' },
  { id: 'kettlebell', label: 'Kettlebell', group: 'free-weights' },
  { id: 'weight-plates', label: 'Weight plates', group: 'free-weights' },

  { id: 'flat-bench', label: 'Flat bench', group: 'benches-racks' },
  { id: 'adjustable-bench', label: 'Adjustable bench', group: 'benches-racks' },
  { id: 'squat-rack', label: 'Squat rack', group: 'benches-racks' },
  { id: 'smith-machine', label: 'Smith machine', group: 'benches-racks' },

  { id: 'cable-machine', label: 'Cable machine', group: 'machines' },
  { id: 'lat-pulldown', label: 'Lat pulldown', group: 'machines' },
  { id: 'seated-row', label: 'Seated row', group: 'machines' },
  { id: 'chest-press-machine', label: 'Chest press', group: 'machines' },
  { id: 'shoulder-press-machine', label: 'Shoulder press', group: 'machines' },
  { id: 'pec-deck', label: 'Pec deck', group: 'machines' },
  { id: 'leg-press', label: 'Leg press', group: 'machines' },
  { id: 'leg-curl', label: 'Leg curl', group: 'machines' },
  { id: 'leg-extension', label: 'Leg extension', group: 'machines' },
  { id: 'calf-machine', label: 'Calf raise', group: 'machines' },
  { id: 'hip-thrust-machine', label: 'Hip thrust', group: 'machines' },

  { id: 'pull-up-bar', label: 'Pull-up bar', group: 'portable' },
  { id: 'dip-bars', label: 'Dip bars', group: 'portable' },
  { id: 'resistance-bands', label: 'Resistance bands', group: 'portable' },
  { id: 'suspension-trainer', label: 'Suspension trainer', group: 'portable' },
  { id: 'ab-wheel', label: 'Ab wheel', group: 'portable' },
  { id: 'exercise-mat', label: 'Mat', group: 'portable' },
  { id: 'plyo-box', label: 'Box or step', group: 'portable' },
];

const BY_ID = new Map<EquipmentId, EquipmentItem>(EQUIPMENT.map((item) => [item.id, item]));

export function equipmentLabel(id: EquipmentId): string {
  return BY_ID.get(id)?.label ?? id;
}

export function equipmentInGroup(group: EquipmentGroupId): readonly EquipmentItem[] {
  return EQUIPMENT.filter((item) => item.group === group);
}

/** What a typical commercial gym has. Used to seed the Gym location profile. */
export const FULL_GYM_EQUIPMENT: readonly EquipmentId[] = EQUIPMENT_IDS;

/** A sensible starting point for a home setup; the user edits it in onboarding. */
export const COMMON_HOME_EQUIPMENT: readonly EquipmentId[] = [
  'adjustable-dumbbells',
  'adjustable-bench',
  'resistance-bands',
  'pull-up-bar',
  'exercise-mat',
];

/** Travel: whatever needs no equipment, plus what fits in a bag. */
export const TRAVEL_EQUIPMENT: readonly EquipmentId[] = ['resistance-bands', 'exercise-mat'];
