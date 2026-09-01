import type { DemoWorkout } from './demoWorkout';
import styles from './DemoWorkoutCard.module.css';

/**
 * Preview of the session shape.
 *
 * Every path through this component keeps the synthetic banner visible. The
 * plan allows demo data in Phase 1 only if it is clearly labelled, and a card
 * this close to the real thing must never be mistakable for a real session.
 */
export function DemoWorkoutCard({
  workout,
  locationName,
}: {
  workout: DemoWorkout;
  locationName: string;
}) {
  const totalSets = workout.exercises.reduce((total, exercise) => total + exercise.sets, 0);

  return (
    <section
      className={styles.card}
      aria-labelledby="demo-workout-title"
      data-testid="demo-workout"
    >
      <div className={styles.demoBanner}>
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 8v5M12 16.5v.5" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        <span>Sample session — the real engine arrives in Phase 3</span>
      </div>

      <div className={styles.inner}>
        <div className={styles.topRow}>
          <div>
            <h2 className={styles.title} id="demo-workout-title">
              {workout.title}
            </h2>
            <p className={styles.focus}>{workout.focus}</p>
          </div>
          <span className="wc-pill wc-pill--muted">{locationName}</span>
        </div>

        {workout.exercises.length === 0 ? (
          <p className={styles.empty}>{workout.why}</p>
        ) : (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>~{workout.estimatedMinutes}</div>
                <div className={styles.statLabel}>Minutes</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{workout.exercises.length}</div>
                <div className={styles.statLabel}>Exercises</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{totalSets}</div>
                <div className={styles.statLabel}>Sets</div>
              </div>
            </div>

            <ol className={styles.list}>
              {workout.exercises.map((exercise, index) => (
                <li className={styles.exercise} key={exercise.name}>
                  <span className={styles.index}>{index + 1}</span>
                  <div className={styles.exerciseBody}>
                    <div className={styles.exerciseName}>{exercise.name}</div>
                    <div className={styles.exerciseMeta}>
                      {exercise.role} · {exercise.muscles}
                    </div>
                  </div>
                  <div className={styles.prescription}>
                    {exercise.sets} × {exercise.reps}
                  </div>
                </li>
              ))}
            </ol>

            <div className={styles.why}>
              <svg
                className={styles.whyIcon}
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 16v-4M12 8.5v.5" />
              </svg>
              <div className={styles.whyBody}>
                <div className={styles.whyTitle}>Why this session</div>
                <p className={styles.whyText}>{workout.why}</p>
              </div>
            </div>

            <div className={styles.action}>
              <button
                type="button"
                className="wc-button wc-button--secondary wc-button--block"
                disabled
              >
                Start workout
              </button>
              <p className={styles.actionNote}>
                Logging opens in Phase 5, once the engine and set logger are built.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
