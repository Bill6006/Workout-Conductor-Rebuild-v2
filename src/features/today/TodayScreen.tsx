import { Screen } from '../../components/Screen/Screen';
import { PhaseCard } from '../../components/PhaseCard/PhaseCard';
import { BuildHero } from './BuildHero';

export function TodayScreen() {
  return (
    <Screen
      eyebrow="Today"
      title="Your session, tuned daily"
      lede="Today will open on the workout the conductor has chosen for you, with the time you actually have."
    >
      <BuildHero />

      <PhaseCard
        next
        phase="Phase 1"
        title="Onboarding and profile"
        description="A short step-by-step setup for goals, experience, equipment, locations, preferences and limitations - all editable later."
        items={['Goals', 'Equipment', 'Locations', 'Limitations', 'Units']}
      />

      <PhaseCard
        phase="Phase 3"
        title="Today's recommended workout"
        description="Muscle focus, readiness, a plain-language why, and one workout-length dropdown: 15, 30, 45 minutes or default time."
        items={['15 min', '30 min', '45 min', 'Default time']}
      />

      <PhaseCard
        phase="Phase 6"
        title="Adaptive Coach"
        description="One card, one suggested action, and concise evidence - merging recovery, plateau, progression and coverage signals. Nothing is applied without your confirmation."
        items={['Recovery', 'Plateaus', 'Progression', 'Coverage']}
      />
    </Screen>
  );
}
