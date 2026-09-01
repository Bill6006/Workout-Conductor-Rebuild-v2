import { Screen } from '../../components/Screen/Screen';
import { PhaseCard } from '../../components/PhaseCard/PhaseCard';

export function PlanScreen() {
  return (
    <Screen
      eyebrow="Plan"
      title="The week ahead"
      lede="Where upcoming sessions, weekly muscle targets and your saved profiles live."
    >
      <PhaseCard
        next
        phase="Phase 1"
        title="Equipment and location profiles"
        description="Save Home, Gym, Travel or a custom setup. Switching location recalibrates the session and drops what you cannot do there."
        items={['Home', 'Gym', 'Travel', 'Custom']}
      />

      <PhaseCard
        phase="Phase 7"
        title="Weekly targets and planning"
        description="Planned training days, weekly muscle targets, recovery balance, and the saved workouts you want to repeat."
        items={['Training days', 'Muscle targets', 'Recovery balance']}
      />
    </Screen>
  );
}
