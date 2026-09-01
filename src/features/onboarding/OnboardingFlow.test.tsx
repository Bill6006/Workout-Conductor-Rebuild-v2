import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingFlow } from './OnboardingFlow';
import { loadProfile } from '../../core/storage/profileRepository';
import { readLocalSettings } from '../../core/storage/localSettings';

/** Advance past the welcome screen into the first question. */
async function start(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('onboarding-next'));
}

/** Click Continue until the finish button appears, then finish. */
async function completeFlow(user: ReturnType<typeof userEvent.setup>) {
  for (let guard = 0; guard < 20; guard += 1) {
    const next = screen.getByTestId('onboarding-next');
    const isFinish = next.textContent === 'Finish setup';
    await user.click(next);
    if (isFinish) return;
  }
  throw new Error('onboarding did not reach the finish step');
}

describe('onboarding flow', () => {
  it('opens on the welcome screen with no Back button', () => {
    render(<OnboardingFlow />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Workout Conductor');
    expect(screen.getByText(/An adaptive strength and hypertrophy coach/)).toBeInTheDocument();
    // The privacy promise is on the first screen, not buried in a later step.
    expect(screen.getByText(/never leaves this browser/)).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-next')).toHaveTextContent('Get started');
    expect(screen.queryByTestId('onboarding-back')).not.toBeInTheDocument();
  });

  it('walks forwards and backwards through the steps', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await start(user);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your goals');

    await user.click(screen.getByTestId('onboarding-next'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your training');

    await user.click(screen.getByTestId('onboarding-back'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your goals');
  });

  it('records the step so an abandoned setup can resume', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await start(user);
    await user.click(screen.getByTestId('onboarding-next'));

    expect(readLocalSettings().onboardingStep).toBe(2);
  });

  it('selects a goal and carries it to the review step', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await start(user);
    await user.click(screen.getByTestId('option-primary-goal-get-stronger'));
    expect(screen.getByTestId('option-primary-goal-get-stronger')).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await completeFlow(user);

    await waitFor(async () => {
      const loaded = await loadProfile();
      expect(loaded.status).toBe('found');
      if (loaded.status === 'found') expect(loaded.profile.primaryGoal).toBe('get-stronger');
    });
  });

  it('clears a secondary goal that duplicates the new primary', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await start(user);
    // The default secondary is bigger-arms; choosing it as primary must clear it.
    await user.click(screen.getByTestId('option-primary-goal-bigger-arms'));
    await completeFlow(user);

    await waitFor(async () => {
      const loaded = await loadProfile();
      if (loaded.status === 'found') {
        expect(loaded.profile.primaryGoal).toBe('bigger-arms');
        expect(loaded.profile.secondaryGoal).not.toBe('bigger-arms');
      }
    });
  });

  it('persists a verified profile and marks setup complete', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await start(user);
    await completeFlow(user);

    await waitFor(async () => {
      const loaded = await loadProfile();
      expect(loaded.status).toBe('found');
    });
    expect(readLocalSettings().onboarded).toBe(true);
    expect(readLocalSettings().onboardingStep).toBe(0);
  });

  it('writes nothing durable until setup is finished', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await start(user);
    await user.click(screen.getByTestId('option-primary-goal-get-stronger'));
    await user.click(screen.getByTestId('onboarding-next'));

    // Half-way through, storage is still empty.
    await expect(loadProfile()).resolves.toEqual({ status: 'empty' });
    expect(readLocalSettings().onboarded).toBe(false);
  });

  it('toggles a technique switch', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await start(user);
    for (let step = 0; step < 4; step += 1) {
      await user.click(screen.getByTestId('onboarding-next'));
    }

    const circuits = screen.getByTestId('switch-circuits');
    expect(circuits).toHaveAttribute('aria-checked', 'false');
    await user.click(circuits);
    expect(circuits).toHaveAttribute('aria-checked', 'true');
  });
});
