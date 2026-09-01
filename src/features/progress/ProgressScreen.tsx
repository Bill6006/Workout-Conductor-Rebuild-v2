import { Screen } from '../../components/Screen/Screen';
import { PhaseCard } from '../../components/PhaseCard/PhaseCard';

export function ProgressScreen() {
  return (
    <Screen
      eyebrow="Progress"
      title="Evidence, not vibes"
      lede="Every number here will carry its definition, the data behind it, the sample count, and how confident it is."
    >
      <PhaseCard
        phase="Phase 7"
        title="History and personal records"
        description="Every completed session, with weight, rep, volume and top-of-range records detected automatically and shown as compact badges."
        items={['Sessions', 'Weight PRs', 'Rep PRs', 'Volume PRs']}
      />

      <PhaseCard
        phase="Phase 7"
        title="Strength and muscle volume"
        description="Estimated strength per lift, weekly volume by muscle against target bands, and direct versus indirect coverage."
        items={['Estimated strength', 'Weekly volume', 'Coverage bands']}
      />

      <PhaseCard
        phase="Phase 7"
        title="Trends and efficiency"
        description="Consistency, RIR trend, planned versus actual duration, most productive exercises, and the ones you replace most often."
        items={['Consistency', 'RIR trend', 'Duration efficiency']}
      />
    </Screen>
  );
}
