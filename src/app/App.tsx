import { useEffect } from 'react';
import { AppHeader } from '../components/AppHeader/AppHeader';
import { BottomNav } from '../components/BottomNav/BottomNav';
import { UpdatePrompt } from '../components/UpdatePrompt/UpdatePrompt';
import { useAppUpdate } from '../core/pwa/useAppUpdate';
import { useProfile } from '../core/state/useProfile';
import { createDefaultProfile, type Profile } from '../core/model/profile';
import { OnboardingFlow } from '../features/onboarding/OnboardingFlow';
import { TodayScreen } from '../features/today/TodayScreen';
import { WorkoutScreen } from '../features/workout/WorkoutScreen';
import { ProgressScreen } from '../features/progress/ProgressScreen';
import { PlanScreen } from '../features/plan/PlanScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { StorageBanner } from '../components/StorageBanner/StorageBanner';
import { useHashRoute } from './useHashRoute';
import type { ScreenId } from './routes';
import styles from './App.module.css';

function renderScreen(screen: ScreenId, profile: Profile) {
  switch (screen) {
    case 'today':
      return <TodayScreen profile={profile} />;
    case 'workout':
      return <WorkoutScreen />;
    case 'progress':
      return <ProgressScreen />;
    case 'plan':
      return <PlanScreen profile={profile} />;
    case 'settings':
      return <SettingsScreen profile={profile} />;
  }
}

export function App() {
  const screen = useHashRoute();
  const update = useAppUpdate();
  const state = useProfile();

  // Changing tab should start at the top of the new screen, the way a native
  // tab bar behaves.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [screen]);

  // Nothing renders until the first storage read settles, so the app never
  // flashes onboarding at a user who has already completed it.
  if (!state.loaded) {
    return (
      <div className={styles.app}>
        <div className={styles.loading} role="status" aria-live="polite">
          <span className="wc-visually-hidden">Loading your setup</span>
          <span className={styles.spinner} aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (!state.onboarded || !state.profile) {
    return (
      <div className={styles.app}>
        <OnboardingFlow />
      </div>
    );
  }

  // A profile that failed to load but has been onboarded still needs something
  // coherent to render; defaults keep the app usable until the next save.
  const profile = state.profile ?? createDefaultProfile(new Date().toISOString());

  return (
    <div className={styles.app} data-screen={screen}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <AppHeader />
      <StorageBanner
        durable={state.durable}
        saveError={state.saveError}
        recoveryNote={state.recoveryNote}
      />
      {renderScreen(screen, profile)}
      <BottomNav current={screen} />
      <UpdatePrompt {...update} />
    </div>
  );
}
