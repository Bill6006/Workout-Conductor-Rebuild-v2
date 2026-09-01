import { NAV_ITEMS, routeHref, type ScreenId } from '../../app/routes';
import { NavIcon } from './NavIcon';
import styles from './BottomNav.module.css';

interface BottomNavProps {
  readonly current: ScreenId;
}

/**
 * Fixed bottom navigation. Real anchors rather than buttons, so the tabs are
 * long-pressable, shareable, and restore correctly with the Android back
 * button.
 */
export function BottomNav({ current }: BottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isCurrent = item.id === current;
          return (
            <li key={item.id} className={styles.item}>
              <a
                className={styles.link}
                href={routeHref(item.id)}
                aria-current={isCurrent ? 'page' : undefined}
                data-testid={`nav-${item.id}`}
              >
                <NavIcon screen={item.id} className={styles.icon} />
                <span className={styles.label}>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
