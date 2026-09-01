/**
 * Onboarding step content.
 *
 * Each step is a pure function of the draft profile plus a patch callback, so
 * the flow shell owns all navigation and persistence and the steps stay
 * trivially testable. Kept short on purpose - the plan is explicit that this
 * must not become one giant questionnaire.
 */
import { Logo } from '../../components/Brand/Logo';
import {
  ChipGroup,
  Field,
  MultiOptionList,
  OptionList,
  Segmented,
  Stepper,
  SwitchRow,
  TagEditor,
  TextArea,
  type Option,
} from '../../components/form/controls';
import {
  EQUIPMENT_GROUPS,
  EQUIPMENT_GROUP_IDS,
  equipmentInGroup,
  type EquipmentId,
} from '../../core/model/equipment';
import {
  EXPERIENCE_LEVELS,
  GOALS,
  LIMITATION_AREAS,
  REST_STYLES,
  TRAINING_STYLES,
  WEEKDAYS,
  activeLimitations,
  goalLabel,
  type GoalId,
  type LimitationArea,
  type Profile,
  type WeekdayId,
} from '../../core/model/profile';
import styles from './Onboarding.module.css';

export interface StepProps {
  readonly draft: Profile;
  readonly patch: (next: Partial<Profile>) => void;
}

/* ------------------------------------------------------------- welcome ---- */

const WELCOME_POINTS = [
  {
    title: 'It builds the session, you train',
    text: 'Muscles, exercises, sets and rest are chosen for the time and equipment you actually have.',
  },
  {
    title: 'Change anything, it re-plans',
    text: 'Less time, a different gym, a sore shoulder — the rest of the workout adapts around what you have already done.',
  },
  {
    title: 'Everything stays on your phone',
    text: 'No account, no server, no analytics. Your training history never leaves this browser.',
  },
];

export function WelcomeStep() {
  return (
    <div className={styles.welcome}>
      <div className={styles.welcomeLogo}>
        <Logo size={64} />
      </div>
      <h1 className={styles.welcomeTitle}>Workout Conductor</h1>
      <p className={styles.welcomeLede}>
        An adaptive strength and hypertrophy coach. Setup takes about a minute.
      </p>

      <div className={styles.welcomePoints}>
        {WELCOME_POINTS.map((point) => (
          <div className={styles.welcomePoint} key={point.title}>
            <span className={styles.welcomeIcon} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12.5 4.5 4.5L19 7" />
              </svg>
            </span>
            <div>
              <div className={styles.welcomePointTitle}>{point.title}</div>
              <div className={styles.welcomePointText}>{point.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- goals ---- */

const GOAL_OPTIONS: readonly Option<GoalId>[] = GOALS.map((goal) => ({
  id: goal.id,
  label: goal.label,
  hint: goal.hint,
}));

export function GoalsStep({ draft, patch }: StepProps) {
  const secondaryOptions: readonly Option<GoalId | 'none'>[] = [
    ...GOAL_OPTIONS.filter((goal) => goal.id !== draft.primaryGoal),
    { id: 'none', label: 'No secondary goal', hint: 'Focus entirely on the main goal' },
  ];

  return (
    <div className={styles.sections}>
      <Field label="What matters most right now?" hint="This drives every session the app builds.">
        <OptionList
          name="Primary goal"
          options={GOAL_OPTIONS}
          value={draft.primaryGoal}
          onChange={(primaryGoal) =>
            patch({
              primaryGoal,
              // A secondary that now duplicates the primary would be noise.
              secondaryGoal: draft.secondaryGoal === primaryGoal ? null : draft.secondaryGoal,
            })
          }
        />
      </Field>

      <Field
        label="And a second priority?"
        hint="Used when there is time left after the main work."
      >
        <OptionList
          name="Secondary goal"
          options={secondaryOptions}
          value={draft.secondaryGoal ?? 'none'}
          onChange={(id) => patch({ secondaryGoal: id === 'none' ? null : (id as GoalId) })}
        />
      </Field>
    </div>
  );
}

/* ---------------------------------------------------------- experience ---- */

export function ExperienceStep({ draft, patch }: StepProps) {
  return (
    <div className={styles.sections}>
      <Field
        label="How long have you been training?"
        hint="Sets how aggressively the app progresses you."
      >
        <OptionList
          name="Experience"
          options={EXPERIENCE_LEVELS.map((level) => ({
            id: level.id,
            label: level.label,
            hint: level.hint,
          }))}
          value={draft.experience}
          onChange={(experience) => patch({ experience })}
        />
      </Field>

      <Field label="Programming style" hint="Hybrid is recommended for size plus strength.">
        <OptionList
          name="Training style"
          options={TRAINING_STYLES.map((style) => ({
            id: style.id,
            label: style.label,
            hint: style.hint,
          }))}
          value={draft.trainingStyle}
          onChange={(trainingStyle) => patch({ trainingStyle })}
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------ schedule ---- */

const WEEKDAY_OPTIONS: readonly Option<WeekdayId>[] = WEEKDAYS.map((day) => ({
  id: day.id,
  label: day.label,
}));

export function ScheduleStep({ draft, patch }: StepProps) {
  const toggleDay = (day: WeekdayId) => {
    const next = draft.availableDays.includes(day)
      ? draft.availableDays.filter((existing) => existing !== day)
      : [...draft.availableDays, day];
    patch({ availableDays: next });
  };

  return (
    <div className={styles.sections}>
      <Field label="Sessions per week" hint="What you can realistically hit, not the ideal.">
        <Stepper
          label="sessions per week"
          value={draft.weeklyFrequency}
          min={1}
          max={7}
          unit={draft.weeklyFrequency === 1 ? 'session per week' : 'sessions per week'}
          onChange={(weeklyFrequency) => patch({ weeklyFrequency })}
          testId="frequency"
        />
      </Field>

      <Field
        label="Typical session length"
        hint="Your normal workout. You can shorten any single session later."
      >
        <Stepper
          label="typical session length"
          value={draft.typicalDurationMinutes}
          min={20}
          max={120}
          step={5}
          unit="minutes"
          onChange={(typicalDurationMinutes) => patch({ typicalDurationMinutes })}
          testId="duration"
        />
      </Field>

      <Field label="Which days usually work?" hint="Used to plan weekly muscle coverage.">
        <ChipGroup
          name="Available days"
          options={WEEKDAY_OPTIONS}
          values={draft.availableDays}
          onToggle={toggleDay}
        />
      </Field>
    </div>
  );
}

/* ----------------------------------------------------------- equipment ---- */

export function EquipmentStep({ draft, patch }: StepProps) {
  const home = draft.locations.find((location) => location.id === 'home');
  const homeEquipment = home?.equipment ?? [];

  const toggleHomeEquipment = (id: EquipmentId) => {
    const next = homeEquipment.includes(id)
      ? homeEquipment.filter((existing) => existing !== id)
      : [...homeEquipment, id];
    patch({
      locations: draft.locations.map((location) =>
        location.id === 'home' ? { ...location, equipment: next } : location,
      ),
    });
  };

  return (
    <div className={styles.sections}>
      <Field
        label="Where do you usually train?"
        hint="You can switch location any time; the workout re-plans around it."
      >
        <OptionList
          name="Usual location"
          options={draft.locations.map((location) => ({
            id: location.id,
            label: location.name,
            hint:
              location.id === 'gym'
                ? 'Full commercial gym equipment'
                : `${location.equipment.length} item${location.equipment.length === 1 ? '' : 's'} selected`,
          }))}
          value={draft.activeLocationId}
          onChange={(activeLocationId) => patch({ activeLocationId })}
        />
      </Field>

      <Field
        label="What do you have at home?"
        hint="Only matters when you train at Home or Travel. Skip it if you always use a gym."
      >
        <div>
          {EQUIPMENT_GROUP_IDS.map((groupId) => (
            <div className={styles.group} key={groupId}>
              <div className={styles.groupTitle}>{EQUIPMENT_GROUPS[groupId]}</div>
              <ChipGroup
                name={EQUIPMENT_GROUPS[groupId]}
                options={equipmentInGroup(groupId).map((item) => ({
                  id: item.id,
                  label: item.label,
                }))}
                values={homeEquipment}
                onToggle={toggleHomeEquipment}
              />
            </div>
          ))}
        </div>
      </Field>
    </div>
  );
}

/* ---------------------------------------------------------- techniques ---- */

export function TechniquesStep({ draft, patch }: StepProps) {
  return (
    <div className={styles.sections}>
      <Field
        label="Advanced techniques"
        hint="The app only uses these when they genuinely help — never by default on a priority lift."
      >
        <div>
          <SwitchRow
            label="Supersets"
            hint="Pair two exercises to save time when they do not compete."
            checked={draft.techniques.supersets}
            onChange={(supersets) => patch({ techniques: { ...draft.techniques, supersets } })}
            testId="switch-supersets"
          />
          <SwitchRow
            label="Drop sets"
            hint="Extend a hypertrophy set when time is short and the muscle needs volume."
            checked={draft.techniques.dropSets}
            onChange={(dropSets) => patch({ techniques: { ...draft.techniques, dropSets } })}
            testId="switch-dropsets"
          />
          <SwitchRow
            label="Circuits"
            hint="Rotate several exercises. Rarely used in strength-priority sessions."
            checked={draft.techniques.circuits}
            onChange={(circuits) => patch({ techniques: { ...draft.techniques, circuits } })}
            testId="switch-circuits"
          />
        </div>
      </Field>

      <Field
        label="Rest between sets"
        hint="A starting point. Each exercise still gets its own target."
      >
        <OptionList
          name="Rest style"
          options={REST_STYLES.map((style) => ({
            id: style.id,
            label: style.label,
            hint: style.hint,
          }))}
          value={draft.restStyle}
          onChange={(restStyle) => patch({ restStyle })}
        />
      </Field>
    </div>
  );
}

/* --------------------------------------------------------- limitations ---- */

export function LimitationsStep({ draft, patch }: StepProps) {
  const flagged = LIMITATION_AREAS.filter((area) => draft.limitations[area.id]).map(
    (area) => area.id,
  );

  const toggleArea = (id: LimitationArea) => {
    patch({ limitations: { ...draft.limitations, [id]: !draft.limitations[id] } });
  };

  return (
    <div className={styles.sections}>
      <Field
        label="Anything that needs working around?"
        hint="Exercises that aggravate these are ranked down or hidden. Leave blank if nothing applies."
      >
        <MultiOptionList
          name="Limitations"
          options={LIMITATION_AREAS.map((area) => ({
            id: area.id,
            label: area.label,
            hint: area.hint,
          }))}
          values={flagged}
          onToggle={toggleArea}
        />
      </Field>

      <Field label="Specific exclusions">
        <SwitchRow
          label="Avoid barbell squats"
          hint="Leg work is planned with other movements instead."
          checked={draft.limitations.avoidBarbellSquats}
          onChange={(avoidBarbellSquats) =>
            patch({ limitations: { ...draft.limitations, avoidBarbellSquats } })
          }
          testId="switch-avoid-squats"
        />
      </Field>

      <Field
        label="Exercises you want to see"
        hint="Optional. Add a few you enjoy or respond well to."
      >
        <TagEditor
          label="Preferred exercises"
          values={draft.preferredExercises}
          onChange={(preferredExercises) => patch({ preferredExercises })}
          placeholder="e.g. Incline dumbbell press"
          testId="preferred"
        />
      </Field>

      <Field label="Exercises to avoid" hint="Optional. These will not be programmed.">
        <TagEditor
          label="Disliked exercises"
          values={draft.dislikedExercises}
          onChange={(dislikedExercises) => patch({ dislikedExercises })}
          placeholder="e.g. Burpees"
          testId="disliked"
        />
      </Field>

      <Field label="Anything else worth knowing?" hint="Optional notes, kept on this device.">
        <TextArea
          label="Limitation notes"
          value={draft.limitations.notes}
          onChange={(notes) => patch({ limitations: { ...draft.limitations, notes } })}
          placeholder="e.g. Left shoulder is fine pressing flat, not overhead"
          maxLength={500}
          testId="limitation-notes"
        />
      </Field>
    </div>
  );
}

/* --------------------------------------------------------------- units ---- */

export function UnitsStep({ draft, patch }: StepProps) {
  return (
    <div className={styles.sections}>
      <Field label="Units">
        <Segmented
          name="Units"
          options={[
            { id: 'kg', label: 'Kilograms' },
            { id: 'lb', label: 'Pounds' },
          ]}
          value={draft.units}
          onChange={(units) => patch({ units })}
        />
      </Field>

      <Field
        label="Bodyweight"
        hint="Optional. Used for bodyweight-loaded exercises and volume estimates."
      >
        <Stepper
          label="bodyweight"
          value={draft.bodyweight ?? (draft.units === 'kg' ? 80 : 175)}
          min={draft.units === 'kg' ? 30 : 66}
          max={draft.units === 'kg' ? 250 : 550}
          step={draft.units === 'kg' ? 1 : 2}
          unit={draft.units}
          onChange={(bodyweight) => patch({ bodyweight })}
          testId="bodyweight"
        />
        {draft.bodyweight === null ? (
          <p className={styles.lede} style={{ marginTop: 'var(--wc-space-3)' }}>
            Not set. Adjust the value above to record it, or continue without.
          </p>
        ) : null}
      </Field>
    </div>
  );
}

/* -------------------------------------------------------------- review ---- */

export function ReviewStep({ draft }: StepProps) {
  const location = draft.locations.find((item) => item.id === draft.activeLocationId);
  const limitations = activeLimitations(draft);
  const techniques = [
    draft.techniques.supersets && 'supersets',
    draft.techniques.dropSets && 'drop sets',
    draft.techniques.circuits && 'circuits',
  ].filter(Boolean);

  const rows: readonly [string, string][] = [
    ['Main goal', goalLabel(draft.primaryGoal)],
    ['Second goal', draft.secondaryGoal ? goalLabel(draft.secondaryGoal) : 'None'],
    ['Experience', EXPERIENCE_LEVELS.find((l) => l.id === draft.experience)?.label ?? '—'],
    ['Style', TRAINING_STYLES.find((s) => s.id === draft.trainingStyle)?.label ?? '—'],
    ['Schedule', `${draft.weeklyFrequency}× per week, ${draft.typicalDurationMinutes} min`],
    [
      'Days',
      draft.availableDays.length > 0
        ? draft.availableDays.map((d) => d[0]!.toUpperCase() + d.slice(1)).join(', ')
        : 'Not set',
    ],
    ['Location', location?.name ?? '—'],
    ['Techniques', techniques.length > 0 ? techniques.join(', ') : 'None enabled'],
    ['Rest', REST_STYLES.find((r) => r.id === draft.restStyle)?.label ?? '—'],
    ['Working around', limitations.length > 0 ? limitations.join(', ') : 'Nothing flagged'],
    ['Units', draft.units === 'kg' ? 'Kilograms' : 'Pounds'],
  ];

  return (
    <div>
      <div className={styles.summary}>
        {rows.map(([key, value]) => (
          <div className={styles.summaryRow} key={key}>
            <span className={styles.summaryKey}>{key}</span>
            <span className={styles.summaryValue}>{value}</span>
          </div>
        ))}
      </div>

      <div className={styles.privacyNote}>
        <svg
          className={styles.privacyIcon}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3l7 3v5.5c0 4.3-2.9 8.3-7 9.5-4.1-1.2-7-5.2-7-9.5V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>
          This is saved on this device only. There is no account and no server — you can export a
          backup any time from Settings.
        </span>
      </div>
    </div>
  );
}
