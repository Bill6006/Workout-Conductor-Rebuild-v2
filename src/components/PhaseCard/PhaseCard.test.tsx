import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhaseCard } from './PhaseCard';

describe('PhaseCard', () => {
  it('renders the title, description and phase pill', () => {
    render(<PhaseCard title="Set logger" description="Fast one-handed entry." phase="Phase 5" />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Set logger');
    expect(screen.getByText('Fast one-handed entry.')).toBeInTheDocument();
    expect(screen.getByText('Phase 5')).toBeInTheDocument();
  });

  it('marks the next phase so the roadmap reads at a glance', () => {
    const { container, rerender } = render(
      <PhaseCard next title="Onboarding" description="Setup." phase="Phase 1" />,
    );
    expect(container.querySelector('[data-next="true"]')).not.toBeNull();

    rerender(<PhaseCard title="Onboarding" description="Setup." phase="Phase 1" />);
    expect(container.querySelector('[data-next="true"]')).toBeNull();
  });

  it('renders capability chips when supplied, and omits the list when not', () => {
    const { rerender } = render(
      <PhaseCard
        title="Duration"
        description="One dropdown."
        phase="Phase 3"
        items={['15 min', '30 min', '45 min', 'Default time']}
      />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('Default time')).toBeInTheDocument();

    rerender(<PhaseCard title="Duration" description="One dropdown." phase="Phase 3" />);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
