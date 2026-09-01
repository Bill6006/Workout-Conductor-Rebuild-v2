/**
 * The user profile: everything onboarding collects and Settings edits.
 *
 * This is the durable contract every later engine reads from, so it is defined
 * once here with a Zod schema beside it. Runtime validation is not optional -
 * the data comes back from IndexedDB and from user-supplied backup files, and
 * both can be stale, hand-edited, or from a future version of the app.
 */
import { z } from 'zod';
import {
  COMMON_HOME_EQUIPMENT,
  EQUIPMENT_IDS,
  FULL_GYM_EQUIPMENT,
  TRAVEL_EQUIPMENT,
} from './equipment';

/** Bumped when the shape changes in a way that needs migrating. */
export const PROFILE_SCHEMA_VERSION = 1;

/* ------------------------------------------------------------------ goals */

export const GOALS = [
  { id: 'build-muscle', label: 'Build muscle', hint: 'Overall size and hypertrophy' },
  { id: 'bigger-arms', label: 'Bigger arms', hint: 'Biceps, triceps, forearms' },
  { id: 'bigger-chest', label: 'Bigger chest', hint: 'Upper and mid chest emphasis' },
  { id: 'get-stronger', label: 'Get stronger', hint: 'Heavier lifts, lower reps' },
  { id: 'lean-out', label: 'Lean out', hint: 'Keep muscle while losing fat' },
  { id: 'stay-consistent', label: 'Stay consistent', hint: 'Sustainable general training' },
] as const;

export type GoalId = (typeof GOALS)[number]['id'];
const GOAL_IDS = GOALS.map((goal) => goal.id) as [GoalId, ...GoalId[]];

/* ------------------------------------------------------------- experience */

export const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', hint: 'Under a year of consistent lifting' },
  { id: 'intermediate', label: 'Intermediate', hint: 'One to three years, steady progress' },
  { id: 'advanced', label: 'Advanced', hint: 'Three years or more, progress is slow' },
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]['id'];
const EXPERIENCE_IDS = EXPERIENCE_LEVELS.map((level) => level.id) as [
  ExperienceLevel,
  ...ExperienceLevel[],
];

/* --------------------------------------------------------- training style */

export const TRAINING_STYLES = [
  {
    id: 'hybrid',
    label: 'Hybrid',
    hint: 'Strength work first, then hypertrophy volume. The default.',
  },
  { id: 'hypertrophy', label: 'Hypertrophy', hint: 'Mostly moderate reps and volume' },
  { id: 'strength', label: 'Strength', hint: 'Heavier, lower reps, longer rests' },
] as const;

export type TrainingStyle = (typeof TRAINING_STYLES)[number]['id'];
const TRAINING_STYLE_IDS = TRAINING_STYLES.map((style) => style.id) as [
  TrainingStyle,
  ...TrainingStyle[],
];

/* ------------------------------------------------------------------- days */

export const WEEKDAYS = [
  { id: 'mon', label: 'Mon', long: 'Monday' },
  { id: 'tue', label: 'Tue', long: 'Tuesday' },
  { id: 'wed', label: 'Wed', long: 'Wednesday' },
  { id: 'thu', label: 'Thu', long: 'Thursday' },
  { id: 'fri', label: 'Fri', long: 'Friday' },
  { id: 'sat', label: 'Sat', long: 'Saturday' },
  { id: 'sun', label: 'Sun', long: 'Sunday' },
] as const;

export type WeekdayId = (typeof WEEKDAYS)[number]['id'];
const WEEKDAY_IDS = WEEKDAYS.map((day) => day.id) as [WeekdayId, ...WeekdayId[]];

/* --------------------------------------------------------------- rest style */

export const REST_STYLES = [
  { id: 'short', label: 'Short', hint: 'Keep moving, around 60 s' },
  { id: 'standard', label: 'Standard', hint: 'Recommended per exercise' },
  { id: 'long', label: 'Long', hint: 'Fully recovered before each set' },
] as const;

export type RestStyle = (typeof REST_STYLES)[number]['id'];
const REST_STYLE_IDS = REST_STYLES.map((style) => style.id) as [RestStyle, ...RestStyle[]];

/* ------------------------------------------------------------- limitations */

export const LIMITATION_AREAS = [
  { id: 'shoulder', label: 'Shoulder', hint: 'Avoid deep overhead and wide pressing' },
  { id: 'lowerBack', label: 'Lower back', hint: 'Limit heavy spinal loading' },
  { id: 'knee', label: 'Knee', hint: 'Limit deep flexion under load' },
  { id: 'elbow', label: 'Elbow', hint: 'Avoid heavy lockout and skullcrusher patterns' },
  { id: 'wrist', label: 'Wrist', hint: 'Prefer neutral grip and straight-wrist work' },
  { id: 'hip', label: 'Hip', hint: 'Limit deep hinging and wide stances' },
] as const;

export type LimitationArea = (typeof LIMITATION_AREAS)[number]['id'];

/* --------------------------------------------------------------- location */

export const locationProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(40),
  equipment: z.array(z.enum(EQUIPMENT_IDS)),
  /** Built-in profiles cannot be deleted, only edited. */
  builtIn: z.boolean().default(false),
});

export type LocationProfile = z.infer<typeof locationProfileSchema>;

/* ---------------------------------------------------------------- profile */

export const profileSchema = z.object({
  schemaVersion: z.number().int().positive().default(PROFILE_SCHEMA_VERSION),

  primaryGoal: z.enum(GOAL_IDS).default('build-muscle'),
  secondaryGoal: z.enum(GOAL_IDS).nullable().default('bigger-arms'),
  experience: z.enum(EXPERIENCE_IDS).default('intermediate'),
  trainingStyle: z.enum(TRAINING_STYLE_IDS).default('hybrid'),

  weeklyFrequency: z.number().int().min(1).max(7).default(4),
  /** The user's normal session length. Phase 3 adds the per-session dropdown. */
  typicalDurationMinutes: z.number().int().min(10).max(180).default(60),
  availableDays: z.array(z.enum(WEEKDAY_IDS)).default(['mon', 'tue', 'thu', 'fri']),

  locations: z.array(locationProfileSchema).min(1),
  activeLocationId: z.string().min(1),

  techniques: z
    .object({
      supersets: z.boolean().default(true),
      dropSets: z.boolean().default(true),
      circuits: z.boolean().default(false),
    })
    .default({ supersets: true, dropSets: true, circuits: false }),

  restStyle: z.enum(REST_STYLE_IDS).default('standard'),

  limitations: z
    .object({
      shoulder: z.boolean().default(false),
      lowerBack: z.boolean().default(false),
      knee: z.boolean().default(false),
      elbow: z.boolean().default(false),
      wrist: z.boolean().default(false),
      hip: z.boolean().default(false),
      avoidBarbellSquats: z.boolean().default(false),
      notes: z.string().max(500).default(''),
    })
    .default({
      shoulder: false,
      lowerBack: false,
      knee: false,
      elbow: false,
      wrist: false,
      hip: false,
      avoidBarbellSquats: false,
      notes: '',
    }),

  /** Free text until the Phase 2 catalog gives these real exercise ids. */
  preferredExercises: z.array(z.string().max(80)).default([]),
  dislikedExercises: z.array(z.string().max(80)).default([]),

  units: z.enum(['kg', 'lb']).default('kg'),
  bodyweight: z.number().positive().max(500).nullable().default(null),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Profile = z.infer<typeof profileSchema>;

/* --------------------------------------------------------------- defaults */

export const DEFAULT_LOCATIONS: readonly LocationProfile[] = [
  { id: 'gym', name: 'Gym', equipment: [...FULL_GYM_EQUIPMENT], builtIn: true },
  { id: 'home', name: 'Home', equipment: [...COMMON_HOME_EQUIPMENT], builtIn: true },
  { id: 'travel', name: 'Travel', equipment: [...TRAVEL_EQUIPMENT], builtIn: true },
];

/**
 * A blank profile. The plan's defaults are Build Muscle and hybrid programming,
 * so a user who taps through onboarding without changing anything still gets
 * the intended product.
 */
export function createDefaultProfile(now: string): Profile {
  return profileSchema.parse({
    schemaVersion: PROFILE_SCHEMA_VERSION,
    primaryGoal: 'build-muscle',
    secondaryGoal: 'bigger-arms',
    experience: 'intermediate',
    trainingStyle: 'hybrid',
    weeklyFrequency: 4,
    typicalDurationMinutes: 60,
    availableDays: ['mon', 'tue', 'thu', 'fri'],
    locations: DEFAULT_LOCATIONS.map((location) => ({
      ...location,
      equipment: [...location.equipment],
    })),
    activeLocationId: 'gym',
    techniques: { supersets: true, dropSets: true, circuits: false },
    restStyle: 'standard',
    limitations: {
      shoulder: false,
      lowerBack: false,
      knee: false,
      elbow: false,
      wrist: false,
      hip: false,
      avoidBarbellSquats: false,
      notes: '',
    },
    preferredExercises: [],
    dislikedExercises: [],
    units: 'kg',
    bodyweight: null,
    createdAt: now,
    updatedAt: now,
  });
}

/* ---------------------------------------------------------------- helpers */

export function goalLabel(id: GoalId): string {
  return GOALS.find((goal) => goal.id === id)?.label ?? id;
}

export function activeLocation(profile: Profile): LocationProfile {
  return (
    profile.locations.find((location) => location.id === profile.activeLocationId) ??
    // A profile whose active id was deleted must still render something.
    profile.locations[0]!
  );
}

/** Areas the user has flagged, for compact display. */
export function activeLimitations(profile: Profile): readonly string[] {
  const flagged: string[] = LIMITATION_AREAS.filter((area) => profile.limitations[area.id]).map(
    (area) => area.label,
  );
  if (profile.limitations.avoidBarbellSquats) flagged.push('No barbell squats');
  return flagged;
}
