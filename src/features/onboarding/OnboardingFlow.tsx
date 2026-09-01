/**
 * Onboarding shell.
 *
 * Owns the step machine, the draft profile, and the single write at the end.
 * Nothing is persisted to the durable profile until the user finishes, so
 * abandoning setup half-way leaves no partial profile behind - only the resume
 * step, which lives in localStorage.
 */
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { createDefaultProfile, type Profile } from '../../core/model/profile';
import { completeOnboarding } from '../../core/state/profileStore';
import { readLocalSettings, writeLocalSettings } from '../../core/storage/localSettings';
import {
  EquipmentStep,
  ExperienceStep,
  GoalsStep,
  LimitationsStep,
  ReviewStep,
  ScheduleStep,
  TechniquesStep,
  UnitsStep,
  WelcomeStep,
  type StepProps,
} from './steps';
import styles from './Onboarding.module.css';

interface StepDefinition {
  readonly id: string;
  readonly title?: string;
  readonly lede?: string;
  readonly Component: (props: StepProps) => ReactElement;
  readonly nextLabel?: string;
}

const STEPS: readonly StepDefinition[] = [
  { id: 'welcome', Component: WelcomeStep, nextLabel: 'Get started' },
  {
    id: 'goals',
    title: 'Your goals',
    lede: 'The conductor optimises every session around these.',
    Component: GoalsStep,
  },
  {
    id: 'experience',
    title: 'Your training',
    lede: 'How you lift now, and how you want to be programmed.',
    Component: ExperienceStep,
  },
  {
    id: 'schedule',
    title: 'Your week',
    lede: 'Realistic beats ideal — the plan is built around what you will actually do.',
    Component: ScheduleStep,
  },
  {
    id: 'equipment',
    title: 'Where you train',
    lede: 'Sessions only ever use equipment you can reach.',
    Component: EquipmentStep,
  },
  {
    id: 'techniques',
    title: 'How you like to work',
    lede: 'Techniques stay off unless they earn their place.',
    Component: TechniquesStep,
  },
  {
    id: 'limitations',
    title: 'Anything to avoid',
    lede: 'Nothing here is permanent — you can change it whenever things change.',
    Component: LimitationsStep,
  },
  {
    id: 'units',
    title: 'Units',
    lede: 'How weights are shown and logged.',
    Component: UnitsStep,
  },
  {
    id: 'review',
    title: 'Ready to go',
    lede: 'Everything below is editable later in Settings.',
    Component: ReviewStep,
    nextLabel: 'Finish setup',
  },
];

export const ONBOARDING_STEP_COUNT = STEPS.length;

export function OnboardingFlow() {
  const [draft, setDraft] = useState<Profile>(() => createDefaultProfile(new Date().toISOString()));
  const [index, setIndex] = useState(() => {
    // Resume where the user left off, but never on the review step - the draft
    // is not persisted, so resuming mid-flow starts from defaults again.
    const saved = readLocalSettings().onboardingStep;
    return saved > 0 && saved < STEPS.length - 1 ? saved : 0;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[index]!;
  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;

  const patch = useCallback((next: Partial<Profile>) => {
    setDraft((current) => ({ ...current, ...next }));
  }, []);

  const goTo = useCallback((nextIndex: number) => {
    setIndex(nextIndex);
    writeLocalSettings({ onboardingStep: nextIndex });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const finish = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    const now = new Date().toISOString();
    const outcome = await completeOnboarding({ ...draft, updatedAt: now }, now);
    setSubmitting(false);
    if (!outcome.ok) {
      // Setup still completes - the profile is live in memory - but the user
      // deserves to know it did not reach durable storage.
      setError(
        `Your setup is active, but this device would not save it: ${outcome.error ?? 'unknown error'}`,
      );
    }
  }, [draft]);

  const onNext = useCallback(() => {
    if (isLast) {
      void finish();
      return;
    }
    goTo(index + 1);
  }, [finish, goTo, index, isLast]);

  const ticks = useMemo(
    () =>
      // The welcome screen is not a question, so it does not get a tick.
      STEPS.slice(1).map((definition, tickIndex) => ({
        id: definition.id,
        done: index - 1 >= tickIndex,
      })),
    [index],
  );

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <span className={styles.stepCount}>
            {isFirst ? 'Welcome' : `Step ${index} of ${STEPS.length - 1}`}
          </span>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={STEPS.length - 1}
          aria-valuenow={index}
          aria-label="Setup progress"
        >
          {ticks.map((tick) => (
            <span key={tick.id} className={styles.tick} data-done={tick.done ? 'true' : 'false'} />
          ))}
        </div>
      </header>

      <main className={styles.body} id="main-content" tabIndex={-1} key={step.id}>
        {step.title ? <h1 className={styles.title}>{step.title}</h1> : null}
        {step.lede ? <p className={styles.lede}>{step.lede}</p> : null}
        <step.Component draft={draft} patch={patch} />
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </main>

      <footer className={styles.footer}>
        {!isFirst ? (
          <button
            type="button"
            className={`wc-button wc-button--secondary ${styles.back}`}
            onClick={() => goTo(index - 1)}
            data-testid="onboarding-back"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          className={`wc-button wc-button--primary ${styles.next}`}
          onClick={onNext}
          disabled={submitting}
          data-testid="onboarding-next"
        >
          {submitting ? 'Saving…' : (step.nextLabel ?? 'Continue')}
        </button>
      </footer>
    </div>
  );
}
