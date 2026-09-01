import { useEffect, type ComponentType } from 'react';
import { AppHeader } from '../components/AppHeader/AppHeader';
import { BottomNav } from '../components/BottomNav/BottomNav';
import { UpdatePrompt } from '../components/UpdatePrompt/UpdatePrompt';
import { useAppUpdate } from '../core/pwa/useAppUpdate';
import { TodayScreen } from '../features/today/TodayScreen';
import { WorkoutScreen } from '../features/workout/WorkoutScreen';
import { ProgressScreen } from '../features/progress/ProgressScreen';
import { PlanScreen } from '../features/plan/PlanScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useHashRoute } from './useHashRoute';
import type { ScreenId } from './routes';
import styles from './App.module.css';

const SCREENS: Record<ScreenId, ComponentType> = {
  today: TodayScreen,
  workout: WorkoutScreen,
  progress: ProgressScreen,
  plan: PlanScreen,
  settings: SettingsScreen,
};

export function App() {
  const screen = useHashRoute();
  const update = useAppUpdate();
  const ActiveScreen = SCREENS[screen];

  // Changing tab should start at the top of the new screen, the way a native
  // tab bar behaves.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [screen]);

  return (
    <div className={styles.app} data-screen={screen}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <AppHeader />
      <ActiveScreen />
      <BottomNav current={screen} />
      <UpdatePrompt {...update} />
    </div>
  );
}
