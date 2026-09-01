import { describe, expect, it } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { NAV_ITEMS, SCREEN_IDS, type ScreenId } from './routes';
import { buildInfo } from '../core/build/buildInfo';
import { createDefaultProfile } from '../core/model/profile';
import { saveProfile } from '../core/storage/profileRepository';
import { writeLocalSettings } from '../core/storage/localSettings';

const NOW = '2026-09-01T12:00:00.000Z';

/** Put the app into the "already set up" state the main shell requires. */
async function seedOnboardedProfile() {
  await saveProfile(createDefaultProfile(NOW));
  writeLocalSettings({ onboarded: true });
}

/** Drive a hash navigation the way a tab tap does, and let React settle. */
function navigate(id: ScreenId) {
  act(() => {
    window.location.hash = `#/${id}`;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

async function renderApp() {
  render(<App />);
  // The first render is a loading state while storage is read.
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
}

describe('App shell once onboarded', () => {
  it('renders the brand and the visible build marker', async () => {
    await seedOnboardedProfile();
    await renderApp();

    expect(screen.getByText('Workout Conductor')).toBeInTheDocument();
    // The subtitle is split so its second half can be trimmed on narrow
    // phones, so assert the header's combined text rather than one node.
    expect(screen.getByRole('banner')).toHaveTextContent('Adaptive Strength + Hypertrophy');

    const marker = screen.getByTestId('build-marker');
    expect(marker).toHaveTextContent(buildInfo.phase);
    expect(marker).toHaveTextContent(`build ${buildInfo.id}`);
  });

  it('renders all five primary tabs, each linking to its hash route', async () => {
    await seedOnboardedProfile();
    await renderApp();

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getAllByRole('link')).toHaveLength(5);

    for (const item of NAV_ITEMS) {
      const link = screen.getByTestId(`nav-${item.id}`);
      expect(link).toHaveAttribute('href', `#/${item.id}`);
      expect(link).toHaveTextContent(item.label);
    }
  });

  it('opens on Today with the synthetic session clearly labelled', async () => {
    await seedOnboardedProfile();
    await renderApp();

    expect(screen.getByTestId('nav-today')).toHaveAttribute('aria-current', 'page');
    const demo = screen.getByTestId('demo-workout');
    expect(demo).toHaveTextContent('Sample session');
    expect(demo).toHaveTextContent('Phase 3');
  });

  it('renders a heading and exactly one current tab for every screen', async () => {
    await seedOnboardedProfile();
    await renderApp();

    for (const id of SCREEN_IDS) {
      navigate(id);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      const current = screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('aria-current') === 'page');
      expect(current).toHaveLength(1);
      expect(current[0]).toHaveAttribute('href', `#/${id}`);
    }
  });

  it('falls back to Today for an unknown hash instead of rendering nothing', async () => {
    await seedOnboardedProfile();
    await renderApp();

    act(() => {
      window.location.hash = '#/does-not-exist';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(screen.getByTestId('nav-today')).toHaveAttribute('aria-current', 'page');
  });

  it('exposes a skip link and a focusable main landmark', async () => {
    await seedOnboardedProfile();
    await renderApp();

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('shows the build diagnostics on Settings', async () => {
    await seedOnboardedProfile();
    await renderApp();
    navigate('settings');

    expect(screen.getByText('About this build')).toBeInTheDocument();
    const rows = screen.getByTestId('diagnostics-rows');
    expect(within(rows).getByText('Base path')).toBeInTheDocument();
  });

  it('persists a settings change and reflects it on Today', async () => {
    const user = userEvent.setup();
    await seedOnboardedProfile();
    await renderApp();
    navigate('settings');

    await user.click(screen.getByTestId('section-schedule'));
    await user.click(screen.getByTestId('settings-frequency-increase'));

    await waitFor(() => expect(screen.getByTestId('settings-frequency')).toHaveTextContent('5'));

    navigate('today');
    expect(screen.getByRole('heading', { level: 1 }).parentElement).toHaveTextContent('5× a week');
  });

  it('switching location on Today changes the sample session', async () => {
    const user = userEvent.setup();
    await seedOnboardedProfile();
    await renderApp();

    const gymExercises = within(screen.getByTestId('demo-workout')).getAllByRole('listitem').length;

    await user.click(screen.getByTestId('segment-training-location-travel'));

    await waitFor(() => {
      const demo = screen.getByTestId('demo-workout');
      const travelExercises = within(demo).queryAllByRole('listitem').length;
      expect(travelExercises).toBeLessThan(gymExercises);
    });
  });

  it('does not show the update prompt when no update is waiting', async () => {
    await seedOnboardedProfile();
    await renderApp();
    expect(screen.queryByText('New version available')).not.toBeInTheDocument();
  });
});

describe('App before onboarding', () => {
  it('shows onboarding rather than the main shell', async () => {
    await renderApp();

    expect(screen.getByText('Workout Conductor')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-next')).toHaveTextContent('Get started');
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
  });

  it('does not flash onboarding at a user who is already set up', async () => {
    await seedOnboardedProfile();
    render(<App />);

    // Before the storage read settles, neither surface may render.
    expect(screen.queryByTestId('onboarding-next')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('nav-today')).toBeInTheDocument());
    expect(screen.queryByTestId('onboarding-next')).not.toBeInTheDocument();
  });
});
