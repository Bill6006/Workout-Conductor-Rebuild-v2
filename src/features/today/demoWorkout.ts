/**
 * SYNTHETIC DEMO DATA - not a real workout engine.
 *
 * Phase 1 needs the live page to feel like a product, and the plan explicitly
 * allows "clearly labeled synthetic demo workout data until the real generation
 * engine arrives". This is that placeholder and nothing more.
 *
 * It is deterministic and reads the real profile, so changing a goal, location
 * or session length visibly changes the preview - which is what makes the
 * preview worth having. It does NOT model volume, recovery, conflicts,
 * progression, or any of the real selection rules. Phase 3 replaces this file
 * wholesale with `engine/workoutGenerator`.
 */
import { activeLocation, type Profile } from '../../core/model/profile';
import type { EquipmentId } from '../../core/model/equipment';

export interface DemoExercise {
  readonly name: string;
  readonly sets: number;
  readonly reps: string;
  readonly role: 'Strength' | 'Hypertrophy' | 'Isolation';
  readonly requires: readonly EquipmentId[];
  readonly muscles: string;
}

export interface DemoWorkout {
  readonly title: string;
  readonly focus: string;
  readonly estimatedMinutes: number;
  readonly exercises: readonly DemoExercise[];
  readonly why: string;
  /** Always true. The UI must never present this as a generated session. */
  readonly synthetic: true;
}

interface Template {
  readonly title: string;
  readonly focus: string;
  readonly exercises: readonly DemoExercise[];
}

const TEMPLATES: readonly Template[] = [
  {
    title: 'Push',
    focus: 'Chest, shoulders, triceps',
    exercises: [
      {
        name: 'Barbell bench press',
        sets: 4,
        reps: '5-7',
        role: 'Strength',
        requires: ['barbell', 'flat-bench'],
        muscles: 'Chest, triceps',
      },
      {
        name: 'Incline dumbbell press',
        sets: 3,
        reps: '8-12',
        role: 'Hypertrophy',
        requires: ['dumbbells', 'adjustable-bench'],
        muscles: 'Upper chest',
      },
      {
        name: 'Seated shoulder press',
        sets: 3,
        reps: '8-12',
        role: 'Hypertrophy',
        requires: ['dumbbells', 'adjustable-bench'],
        muscles: 'Front delts',
      },
      {
        name: 'Cable lateral raise',
        sets: 3,
        reps: '12-15',
        role: 'Isolation',
        requires: ['cable-machine'],
        muscles: 'Side delts',
      },
      {
        name: 'Overhead cable triceps extension',
        sets: 3,
        reps: '10-15',
        role: 'Isolation',
        requires: ['cable-machine'],
        muscles: 'Triceps',
      },
      {
        name: 'Push-up',
        sets: 3,
        reps: '12-20',
        role: 'Hypertrophy',
        requires: [],
        muscles: 'Chest, triceps',
      },
    ],
  },
  {
    title: 'Pull',
    focus: 'Back, rear delts, biceps',
    exercises: [
      {
        name: 'Weighted pull-up',
        sets: 4,
        reps: '5-8',
        role: 'Strength',
        requires: ['pull-up-bar'],
        muscles: 'Lats, biceps',
      },
      {
        name: 'Chest-supported row',
        sets: 3,
        reps: '8-12',
        role: 'Hypertrophy',
        requires: ['seated-row'],
        muscles: 'Mid back',
      },
      {
        name: 'Lat pulldown',
        sets: 3,
        reps: '10-12',
        role: 'Hypertrophy',
        requires: ['lat-pulldown'],
        muscles: 'Lats',
      },
      {
        name: 'Face pull',
        sets: 3,
        reps: '15-20',
        role: 'Isolation',
        requires: ['cable-machine'],
        muscles: 'Rear delts',
      },
      {
        name: 'Incline dumbbell curl',
        sets: 3,
        reps: '10-12',
        role: 'Isolation',
        requires: ['dumbbells', 'adjustable-bench'],
        muscles: 'Biceps',
      },
      {
        name: 'Band pull-apart',
        sets: 3,
        reps: '15-20',
        role: 'Isolation',
        requires: ['resistance-bands'],
        muscles: 'Rear delts',
      },
    ],
  },
  {
    title: 'Legs',
    focus: 'Quads, hamstrings, glutes',
    exercises: [
      {
        name: 'Back squat',
        sets: 4,
        reps: '5-7',
        role: 'Strength',
        requires: ['barbell', 'squat-rack'],
        muscles: 'Quads, glutes',
      },
      {
        name: 'Romanian deadlift',
        sets: 3,
        reps: '8-10',
        role: 'Hypertrophy',
        requires: ['barbell'],
        muscles: 'Hamstrings, glutes',
      },
      {
        name: 'Leg press',
        sets: 3,
        reps: '10-15',
        role: 'Hypertrophy',
        requires: ['leg-press'],
        muscles: 'Quads',
      },
      {
        name: 'Leg curl',
        sets: 3,
        reps: '12-15',
        role: 'Isolation',
        requires: ['leg-curl'],
        muscles: 'Hamstrings',
      },
      {
        name: 'Walking lunge',
        sets: 3,
        reps: '10-12',
        role: 'Hypertrophy',
        requires: ['dumbbells'],
        muscles: 'Quads, glutes',
      },
      {
        name: 'Standing calf raise',
        sets: 4,
        reps: '12-15',
        role: 'Isolation',
        requires: [],
        muscles: 'Calves',
      },
    ],
  },
  {
    title: 'Upper',
    focus: 'Chest, back, arms',
    exercises: [
      {
        name: 'Incline barbell press',
        sets: 4,
        reps: '6-8',
        role: 'Strength',
        requires: ['barbell', 'adjustable-bench'],
        muscles: 'Upper chest',
      },
      {
        name: 'Chest-supported row',
        sets: 4,
        reps: '8-12',
        role: 'Hypertrophy',
        requires: ['seated-row'],
        muscles: 'Mid back',
      },
      {
        name: 'Dumbbell shoulder press',
        sets: 3,
        reps: '8-12',
        role: 'Hypertrophy',
        requires: ['dumbbells'],
        muscles: 'Delts',
      },
      {
        name: 'Cable curl',
        sets: 3,
        reps: '10-15',
        role: 'Isolation',
        requires: ['cable-machine'],
        muscles: 'Biceps',
      },
      {
        name: 'Triceps pushdown',
        sets: 3,
        reps: '10-15',
        role: 'Isolation',
        requires: ['cable-machine'],
        muscles: 'Triceps',
      },
      {
        name: 'Dip',
        sets: 3,
        reps: '8-12',
        role: 'Hypertrophy',
        requires: ['dip-bars'],
        muscles: 'Chest, triceps',
      },
    ],
  },
];

/** Rough per-set cost including rest, by role and rest preference. */
function minutesPerSet(role: DemoExercise['role'], restStyle: Profile['restStyle']): number {
  const base = role === 'Strength' ? 3.2 : role === 'Hypertrophy' ? 2.4 : 1.8;
  const restFactor = restStyle === 'short' ? 0.82 : restStyle === 'long' ? 1.25 : 1;
  return base * restFactor;
}

function estimateMinutes(
  exercises: readonly DemoExercise[],
  restStyle: Profile['restStyle'],
): number {
  const setTime = exercises.reduce(
    (total, exercise) => total + exercise.sets * minutesPerSet(exercise.role, restStyle),
    0,
  );
  // Warm-up plus a setup allowance per exercise.
  const overhead = 6 + exercises.length * 1.2;
  return Math.round(setTime + overhead);
}

/** Which template today lands on, so the preview is stable within a day. */
function templateForDay(profile: Profile, dayIndex: number): Template {
  // Frequency shapes the split the way a real programme would: fewer sessions
  // means broader sessions.
  const pool =
    profile.weeklyFrequency <= 3
      ? [TEMPLATES[3]!, TEMPLATES[2]!] // Upper / Legs
      : [TEMPLATES[0]!, TEMPLATES[1]!, TEMPLATES[2]!]; // Push / Pull / Legs
  return pool[dayIndex % pool.length]!;
}

function goalEmphasis(profile: Profile): string {
  switch (profile.primaryGoal) {
    case 'bigger-arms':
      return 'arm volume is pushed up';
    case 'bigger-chest':
      return 'chest gets the priority slot';
    case 'get-stronger':
      return 'the main lift keeps heavy sets';
    case 'lean-out':
      return 'density is kept high';
    case 'stay-consistent':
      return 'the session stays repeatable';
    case 'build-muscle':
    default:
      return 'volume is weighted toward growth';
  }
}

/**
 * Build the demo session.
 *
 * @param profile the user's real profile
 * @param dayIndex a stable index for the day, so the preview does not churn
 */
export function buildDemoWorkout(profile: Profile, dayIndex: number): DemoWorkout {
  const template = templateForDay(profile, dayIndex);
  const location = activeLocation(profile);
  const available = new Set(location.equipment);

  // Availability filtering: an exercise needing kit you do not have is dropped.
  // This is the one piece of real behaviour here - it makes switching location
  // visibly change the preview.
  let exercises = template.exercises.filter((exercise) =>
    exercise.requires.every((id) => available.has(id)),
  );

  if (profile.limitations.avoidBarbellSquats) {
    exercises = exercises.filter((exercise) => exercise.name !== 'Back squat');
  }
  if (profile.dislikedExercises.length > 0) {
    const disliked = new Set(profile.dislikedExercises.map((name) => name.toLowerCase().trim()));
    exercises = exercises.filter((exercise) => !disliked.has(exercise.name.toLowerCase()));
  }

  // Trim to fit the user's typical session length.
  const restStyle = profile.restStyle;
  while (
    exercises.length > 2 &&
    estimateMinutes(exercises, restStyle) > profile.typicalDurationMinutes
  ) {
    exercises = exercises.slice(0, -1);
  }

  const estimatedMinutes = exercises.length > 0 ? estimateMinutes(exercises, restStyle) : 0;

  const why =
    exercises.length === 0
      ? `No sample exercises fit ${location.name} with the equipment saved for it. Add equipment in Plan, or switch location.`
      : `A ${template.title.toLowerCase()} session shaped for ${location.name} and about ${profile.typicalDurationMinutes} minutes. Because your main goal is growth-focused, ${goalEmphasis(profile)}.`;

  return {
    title: `${template.title} session`,
    focus: template.focus,
    estimatedMinutes,
    exercises,
    why,
    synthetic: true,
  };
}

/** Day index from a date, stable within a calendar day. */
export function dayIndexFor(date: Date): number {
  const days = Math.floor(date.getTime() / 86_400_000);
  return Math.abs(days);
}
