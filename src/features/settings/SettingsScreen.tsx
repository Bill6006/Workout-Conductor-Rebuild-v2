import { Screen } from '../../components/Screen/Screen';
import { PhaseCard } from '../../components/PhaseCard/PhaseCard';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export function SettingsScreen() {
  return (
    <Screen
      eyebrow="Settings"
      title="You stay in control"
      lede="Everything the conductor decides is overridable, and every setting is editable at any time."
    >
      <DiagnosticsPanel />

      <PhaseCard
        next
        phase="Phase 1"
        title="Goals, preferences and limitations"
        description="Programming style, supersets, drop sets and circuits, exercise preferences, pain and movement limitations, and unit system."
        items={['Goals', 'Supersets', 'Drop sets', 'Circuits', 'Units']}
      />

      <PhaseCard
        phase="Phase 8"
        title="Backup, restore and import"
        description="Export a full backup and restore it exactly, with schema migration, unknown-field preservation and rollback if a restore fails."
        items={['Export JSON', 'Import JSON', 'Migration', 'Rollback']}
      />
    </Screen>
  );
}
