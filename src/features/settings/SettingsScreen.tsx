import { Screen } from '../../components/Screen/Screen';
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
} from '../../components/form/controls';
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
import { useUpdateProfile } from '../../core/state/useProfile';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { BackupPanel } from './BackupPanel';
import { SettingsSection } from './SettingsSection';

const GOAL_OPTIONS = GOALS.map((goal) => ({ id: goal.id, label: goal.label, hint: goal.hint }));
const WEEKDAY_OPTIONS = WEEKDAYS.map((day) => ({ id: day.id, label: day.label }));

export function SettingsScreen({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();

  const techniques = [
    profile.techniques.supersets && 'Supersets',
    profile.techniques.dropSets && 'Drop sets',
    profile.techniques.circuits && 'Circuits',
  ].filter(Boolean) as string[];

  const limitations = activeLimitations(profile);
  const flaggedAreas = LIMITATION_AREAS.filter((area) => profile.limitations[area.id]).map(
    (area) => area.id,
  );

  const toggleDay = (day: WeekdayId) => {
    const next = profile.availableDays.includes(day)
      ? profile.availableDays.filter((existing) => existing !== day)
      : [...profile.availableDays, day];
    void update({ availableDays: next });
  };

  return (
    <Screen
      eyebrow="Settings"
      title="You stay in control"
      lede="Everything the conductor decides is overridable, and every setting is editable at any time."
    >
      <SettingsSection
        title="Goals"
        summary={`${goalLabel(profile.primaryGoal)}${profile.secondaryGoal ? ` · ${goalLabel(profile.secondaryGoal)}` : ''}`}
        testId="section-goals"
      >
        <Field label="Main goal">
          <OptionList
            name="Primary goal"
            options={GOAL_OPTIONS}
            value={profile.primaryGoal}
            onChange={(primaryGoal) =>
              void update({
                primaryGoal,
                secondaryGoal: profile.secondaryGoal === primaryGoal ? null : profile.secondaryGoal,
              })
            }
          />
        </Field>
        <Field label="Second priority">
          <OptionList
            name="Secondary goal"
            options={[
              ...GOAL_OPTIONS.filter((goal) => goal.id !== profile.primaryGoal),
              { id: 'none' as const, label: 'No secondary goal', hint: 'Focus on the main goal' },
            ]}
            value={profile.secondaryGoal ?? 'none'}
            onChange={(id) => void update({ secondaryGoal: id === 'none' ? null : (id as GoalId) })}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Programming"
        summary={`${TRAINING_STYLES.find((s) => s.id === profile.trainingStyle)?.label} · ${EXPERIENCE_LEVELS.find((l) => l.id === profile.experience)?.label}`}
        testId="section-programming"
      >
        <Field label="Experience">
          <OptionList
            name="Experience"
            options={EXPERIENCE_LEVELS.map((l) => ({ id: l.id, label: l.label, hint: l.hint }))}
            value={profile.experience}
            onChange={(experience) => void update({ experience })}
          />
        </Field>
        <Field label="Style">
          <OptionList
            name="Training style"
            options={TRAINING_STYLES.map((s) => ({ id: s.id, label: s.label, hint: s.hint }))}
            value={profile.trainingStyle}
            onChange={(trainingStyle) => void update({ trainingStyle })}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Schedule"
        summary={`${profile.weeklyFrequency}× per week · ${profile.typicalDurationMinutes} min`}
        testId="section-schedule"
      >
        <Field label="Sessions per week">
          <Stepper
            label="sessions per week"
            value={profile.weeklyFrequency}
            min={1}
            max={7}
            unit={profile.weeklyFrequency === 1 ? 'session per week' : 'sessions per week'}
            onChange={(weeklyFrequency) => void update({ weeklyFrequency })}
            testId="settings-frequency"
          />
        </Field>
        <Field
          label="Default session length"
          hint="Your normal workout. Shortening a single session arrives with the duration dropdown in Phase 3."
        >
          <Stepper
            label="default session length"
            value={profile.typicalDurationMinutes}
            min={20}
            max={120}
            step={5}
            unit="minutes"
            onChange={(typicalDurationMinutes) => void update({ typicalDurationMinutes })}
            testId="settings-duration"
          />
        </Field>
        <Field label="Training days">
          <ChipGroup
            name="Available days"
            options={WEEKDAY_OPTIONS}
            values={profile.availableDays}
            onToggle={toggleDay}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Techniques and rest"
        summary={`${techniques.length > 0 ? techniques.join(', ') : 'None enabled'} · ${REST_STYLES.find((r) => r.id === profile.restStyle)?.label} rest`}
        testId="section-techniques"
      >
        <Field label="Advanced techniques" hint="Used only when they genuinely help.">
          <div>
            <SwitchRow
              label="Supersets"
              checked={profile.techniques.supersets}
              onChange={(supersets) =>
                void update({ techniques: { ...profile.techniques, supersets } })
              }
              testId="settings-supersets"
            />
            <SwitchRow
              label="Drop sets"
              checked={profile.techniques.dropSets}
              onChange={(dropSets) =>
                void update({ techniques: { ...profile.techniques, dropSets } })
              }
              testId="settings-dropsets"
            />
            <SwitchRow
              label="Circuits"
              checked={profile.techniques.circuits}
              onChange={(circuits) =>
                void update({ techniques: { ...profile.techniques, circuits } })
              }
              testId="settings-circuits"
            />
          </div>
        </Field>
        <Field label="Rest between sets">
          <OptionList
            name="Rest style"
            options={REST_STYLES.map((r) => ({ id: r.id, label: r.label, hint: r.hint }))}
            value={profile.restStyle}
            onChange={(restStyle) => void update({ restStyle })}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Exercise preferences"
        summary={`${profile.preferredExercises.length} preferred · ${profile.dislikedExercises.length} avoided`}
        testId="section-preferences"
      >
        <Field label="Preferred exercises">
          <TagEditor
            label="Preferred exercises"
            values={profile.preferredExercises}
            onChange={(preferredExercises) => void update({ preferredExercises })}
            placeholder="e.g. Incline dumbbell press"
            testId="settings-preferred"
          />
        </Field>
        <Field label="Exercises to avoid">
          <TagEditor
            label="Disliked exercises"
            values={profile.dislikedExercises}
            onChange={(dislikedExercises) => void update({ dislikedExercises })}
            placeholder="e.g. Burpees"
            testId="settings-disliked"
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Limitations"
        summary={limitations.length > 0 ? limitations.join(', ') : 'Nothing flagged'}
        testId="section-limitations"
      >
        <Field label="Areas to work around">
          <MultiOptionList
            name="Limitations"
            options={LIMITATION_AREAS.map((a) => ({ id: a.id, label: a.label, hint: a.hint }))}
            values={flaggedAreas}
            onToggle={(id: LimitationArea) =>
              void update({
                limitations: { ...profile.limitations, [id]: !profile.limitations[id] },
              })
            }
          />
        </Field>
        <Field label="Specific exclusions">
          <SwitchRow
            label="Avoid barbell squats"
            checked={profile.limitations.avoidBarbellSquats}
            onChange={(avoidBarbellSquats) =>
              void update({ limitations: { ...profile.limitations, avoidBarbellSquats } })
            }
            testId="settings-avoid-squats"
          />
        </Field>
        <Field label="Notes">
          <TextArea
            label="Limitation notes"
            value={profile.limitations.notes}
            onChange={(notes) => void update({ limitations: { ...profile.limitations, notes } })}
            placeholder="Anything the conductor should know"
            maxLength={500}
            testId="settings-limitation-notes"
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Units"
        summary={`${profile.units === 'kg' ? 'Kilograms' : 'Pounds'}${profile.bodyweight ? ` · ${profile.bodyweight} ${profile.units}` : ''}`}
        testId="section-units"
      >
        <Field label="Weight units">
          <Segmented
            name="Units"
            options={[
              { id: 'kg' as const, label: 'Kilograms' },
              { id: 'lb' as const, label: 'Pounds' },
            ]}
            value={profile.units}
            onChange={(units) => void update({ units })}
          />
        </Field>
        <Field label="Bodyweight" hint="Optional.">
          <Stepper
            label="bodyweight"
            value={profile.bodyweight ?? (profile.units === 'kg' ? 80 : 175)}
            min={profile.units === 'kg' ? 30 : 66}
            max={profile.units === 'kg' ? 250 : 550}
            step={profile.units === 'kg' ? 1 : 2}
            unit={profile.units}
            onChange={(bodyweight) => void update({ bodyweight })}
            testId="settings-bodyweight"
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Equipment and locations"
        summary={`${profile.locations.length} saved location${profile.locations.length === 1 ? '' : 's'}`}
        testId="section-equipment"
      >
        <p
          style={{
            fontSize: 'var(--wc-text-small)',
            color: 'var(--wc-text-secondary)',
            lineHeight: 1.6,
          }}
        >
          Location profiles and their equipment are edited in <a href="#/plan">Plan</a>, so there is
          one place that owns them rather than two that can disagree.
        </p>
      </SettingsSection>

      <SettingsSection
        title="Backup and restore"
        summary="Export or import your setup as JSON"
        testId="section-backup"
      >
        <BackupPanel profile={profile} />
      </SettingsSection>

      <DiagnosticsPanel />
    </Screen>
  );
}
