import { describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import { App } from './App';
import { NAV_ITEMS, SCREEN_IDS, type ScreenId } from './routes';
import { buildInfo } from '../core/build/buildInfo';

/** Drive a hash navigation the way a tab tap does, and let React settle. */
function navigate(id: ScreenId) {
  act(() => {
    window.location.hash = `#/${id}`;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('App shell', () => {
  it('renders the brand and the visible build marker', () => {
    render(<App />);

    expect(screen.getByText('Workout Conductor')).toBeInTheDocument();
    // The subtitle is split so its second half can be trimmed on narrow
    // phones, so assert the header's combined text rather than one node.
    expect(screen.getByRole('banner')).toHaveTextContent('Adaptive Strength + Hypertrophy');

    const marker = screen.getByTestId('build-marker');
    expect(marker).toHaveTextContent(buildInfo.phase);
    expect(marker).toHaveTextContent(`build ${buildInfo.id}`);
  });

  it('renders all five primary tabs, each linking to its hash route', () => {
    render(<App />);

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(5);

    for (const item of NAV_ITEMS) {
      const link = screen.getByTestId(`nav-${item.id}`);
      expect(link).toHaveAttribute('href', `#/${item.id}`);
      expect(link).toHaveTextContent(item.label);
    }
  });

  it('opens on Today when there is no hash', () => {
    render(<App />);
    expect(screen.getByTestId('nav-today')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Your session, tuned daily',
    );
  });

  it('switches screen and moves aria-current when the hash changes', () => {
    render(<App />);

    navigate('progress');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Evidence, not vibes');
    expect(screen.getByTestId('nav-progress')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-today')).not.toHaveAttribute('aria-current');
  });

  it('renders a heading and exactly one current tab for every screen', () => {
    render(<App />);

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

  it('falls back to Today for an unknown hash instead of rendering nothing', () => {
    render(<App />);

    act(() => {
      window.location.hash = '#/does-not-exist';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(screen.getByTestId('nav-today')).toHaveAttribute('aria-current', 'page');
  });

  it('exposes a skip link and a focusable main landmark', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('shows the build diagnostics on Settings', () => {
    render(<App />);
    navigate('settings');

    expect(screen.getByText('About this build')).toBeInTheDocument();
    const rows = screen.getByTestId('diagnostics-rows');
    expect(within(rows).getByText('Base path')).toBeInTheDocument();
    expect(within(rows).getByText('Service worker')).toBeInTheDocument();
  });

  it('does not show the update prompt when no update is waiting', () => {
    render(<App />);
    expect(screen.queryByText('New version available')).not.toBeInTheDocument();
  });
});
