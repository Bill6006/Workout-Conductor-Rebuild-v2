import { Screen } from '../../components/Screen/Screen';
import { PhaseCard } from '../../components/PhaseCard/PhaseCard';

export function WorkoutScreen() {
  return (
    <Screen
      eyebrow="Workout"
      title="Built for one hand"
      lede="The active session: the current set stays unmistakable, and everything else stays out of the way."
    >
      <PhaseCard
        phase="Phase 5"
        title="Set logger"
        description="A new logging interaction designed for speed and fatigue - fast weight, reps and RIR entry, with inline correction of any completed value."
        items={['Weight', 'Reps', 'RIR', 'Inline edit', 'Undo']}
      />

      <PhaseCard
        phase="Phase 5"
        title="Rest timer and demonstrations"
        description="Rest starts from the programmed target and survives backgrounding. Every exercise carries a looping demonstration and written form cues."
        items={['Rest timer', 'Looping demos', 'Form cues', 'Plate Math']}
      />

      <PhaseCard
        phase="Phase 4"
        title="Recalibration"
        description="Change the duration, location, or an exercise and the remaining session is rebuilt around your completed work. Logged sets are never altered."
        items={['Completed work locked', 'Change summary', 'Rollback on failure']}
      />

      <PhaseCard
        phase="Phase 5"
        title="Alternatives and supersets"
        description="Ranked alternatives that swap exactly one exercise, with conflicting options hidden. Supersets run as one combined two-move block."
        items={['Ranked matches', 'One-tap swap', 'Two-move blocks']}
      />
    </Screen>
  );
}
