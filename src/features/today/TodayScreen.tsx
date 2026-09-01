import { useMemo } from 'react';
import { Screen } from '../../components/Screen/Screen';
import { PhaseCard } from '../../components/PhaseCard/PhaseCard';
import { Field, Segmented } from '../../components/form/controls';
import { activeLocation, goalLabel, type Profile } from '../../core/model/profile';
import { useUpdateProfile } from '../../core/state/useProfile';
import { writeLocalSettings } from '../../core/storage/localSettings';
import { buildDemoWorkout, dayIndexFor } from './demoWorkout';
import { DemoWorkoutCard } from './DemoWorkoutCard';
import styles from './TodayScreen.module.css';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function TodayScreen({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const now = useMemo(() => new Date(), []);
  const location = activeLocation(profile);

  const workout = useMemo(() => buildDemoWorkout(profile, dayIndexFor(now)), [profile, now]);

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Screen
      eyebrow={dateLabel}
      title={`${greeting(now.getHours())}`}
      lede={`Training for ${goalLabel(profile.primaryGoal).toLowerCase()}, ${profile.weeklyFrequency}× a week.`}
    >
      <Field label="Training location" hint="Switching location changes what the session can use.">
        <Segmented
          name="Training location"
          options={profile.locations.map((item) => ({ id: item.id, label: item.name }))}
          value={profile.activeLocationId}
          onChange={(activeLocationId) => {
            void updateProfile({ activeLocationId });
            // Active-session metadata: remembered for the next launch.
            writeLocalSettings({ activeLocationId });
          }}
        />
      </Field>

      <DemoWorkoutCard workout={workout} locationName={location.name} />

      <div className={styles.setupRow}>
        <a className={styles.setupLink} href="#/settings">
          Edit your setup
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </a>
      </div>

      <PhaseCard
        phase="Phase 3"
        title="Real workout generation"
        description="The engine that chooses muscles, exercises, sets and rest from your volume, recovery and time — with one duration dropdown for 15, 30, 45 minutes or your default."
        items={['15 min', '30 min', '45 min', 'Default time']}
      />

      <PhaseCard
        phase="Phase 6"
        title="Adaptive Coach"
        description="One card, one suggested action, and concise evidence — merging recovery, plateau, progression and coverage signals. Nothing is applied without your confirmation."
        items={['Recovery', 'Plateaus', 'Progression', 'Coverage']}
      />
    </Screen>
  );
}
