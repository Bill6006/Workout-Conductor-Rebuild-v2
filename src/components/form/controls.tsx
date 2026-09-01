/**
 * Form primitives shared by onboarding and Settings.
 *
 * One implementation of each control, so a fix to tap-target size or focus
 * behaviour lands everywhere at once. All of them are built from real buttons
 * with the right ARIA roles rather than styled checkboxes, which keeps the
 * touch targets large and the semantics honest.
 */
import { useId, useState, type ReactNode } from 'react';
import styles from './Form.module.css';

/**
 * Test ids are scoped by the control's accessible name.
 *
 * Two OptionLists on one screen - primary and secondary goal, say - otherwise
 * emit the same `option-<id>` and every query becomes ambiguous.
 */
function scope(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/* --------------------------------------------------------------- field ---- */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      <div className={styles.control}>{children}</div>
    </div>
  );
}

/* ----------------------------------------------------------- indicators ---- */

function CheckIcon() {
  return (
    <svg
      className={styles.markerIcon}
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

function Marker({ square }: { square?: boolean }) {
  return (
    <span className={styles.marker} data-square={square ? 'true' : 'false'} aria-hidden="true">
      <CheckIcon />
    </span>
  );
}

/* ------------------------------------------------------- option (single) --- */

export interface Option<T extends string> {
  readonly id: T;
  readonly label: string;
  readonly hint?: string;
}

export function OptionList<T extends string>({
  options,
  value,
  onChange,
  columns = 1,
  name,
}: {
  options: readonly Option<T>[];
  value: T | null;
  onChange: (id: T) => void;
  columns?: 1 | 2;
  name: string;
}) {
  return (
    <div className={styles.optionList} data-columns={columns} role="radiogroup" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          className={styles.option}
          onClick={() => onChange(option.id)}
          data-testid={`option-${scope(name)}-${option.id}`}
        >
          <Marker />
          <span className={styles.optionBody}>
            <span className={styles.optionLabel}>{option.label}</span>
            {option.hint ? <span className={styles.optionHint}>{option.hint}</span> : null}
          </span>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------- option (multi) --- */

export function MultiOptionList<T extends string>({
  options,
  values,
  onToggle,
  name,
}: {
  options: readonly Option<T>[];
  values: readonly T[];
  onToggle: (id: T) => void;
  name: string;
}) {
  return (
    <div className={styles.optionList} role="group" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={values.includes(option.id)}
          className={styles.option}
          onClick={() => onToggle(option.id)}
          data-testid={`option-${scope(name)}-${option.id}`}
        >
          <Marker square />
          <span className={styles.optionBody}>
            <span className={styles.optionLabel}>{option.label}</span>
            {option.hint ? <span className={styles.optionHint}>{option.hint}</span> : null}
          </span>
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- chips ----- */

export function ChipGroup<T extends string>({
  options,
  values,
  onToggle,
  name,
}: {
  options: readonly Option<T>[];
  values: readonly T[];
  onToggle: (id: T) => void;
  name: string;
}) {
  return (
    <div className={styles.chips} role="group" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={values.includes(option.id)}
          className={styles.chip}
          onClick={() => onToggle(option.id)}
          data-testid={`chip-${scope(name)}-${option.id}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- switch ----- */

export function SwitchRow({
  label,
  hint,
  checked,
  onChange,
  testId,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.switchRow}
      onClick={() => onChange(!checked)}
      data-testid={testId}
    >
      <span className={styles.switchBody}>
        <span className={styles.switchLabel}>{label}</span>
        {hint ? <span className={styles.switchHint}>{hint}</span> : null}
      </span>
      <span className={styles.switchTrack} aria-hidden="true">
        <span className={styles.switchThumb} />
      </span>
    </button>
  );
}

/* -------------------------------------------------- segmented control ------ */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: readonly Option<T>[];
  value: T;
  onChange: (id: T) => void;
  name: string;
}) {
  return (
    <div className={styles.segmented} role="group" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          className={styles.segment}
          onClick={() => onChange(option.id)}
          data-testid={`segment-${scope(name)}-${option.id}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- stepper ----- */

export function Stepper({
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  label,
  testId,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (next: number) => void;
  label: string;
  testId?: string;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.stepperButton}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
        data-testid={testId ? `${testId}-decrease` : undefined}
      >
        −
      </button>
      <div className={styles.stepperValue} aria-live="polite" data-testid={testId}>
        <div className={styles.stepperNumber}>{value}</div>
        <div className={styles.stepperUnit}>{unit}</div>
      </div>
      <button
        type="button"
        className={styles.stepperButton}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        data-testid={testId ? `${testId}-increase` : undefined}
      >
        +
      </button>
    </div>
  );
}

/* ---------------------------------------------------------- text inputs ---- */

export function TextArea({
  value,
  onChange,
  placeholder,
  label,
  maxLength,
  testId,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  label: string;
  maxLength?: number;
  testId?: string;
}) {
  return (
    <textarea
      className={styles.textarea}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
      maxLength={maxLength}
      data-testid={testId}
    />
  );
}

/* -------------------------------------------------------------- tags ------- */

/**
 * Free-text list editor for preferred and disliked exercises.
 *
 * Free text until the Phase 2 catalog exists; the stored strings become real
 * exercise ids then.
 */
export function TagEditor({
  values,
  onChange,
  placeholder,
  label,
  testId,
}: {
  values: readonly string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  label: string;
  testId?: string;
}) {
  const [draft, setDraft] = useState('');
  const inputId = useId();
  const trimmed = draft.trim();
  const canAdd = trimmed.length > 0 && !values.includes(trimmed) && values.length < 30;

  const add = () => {
    if (!canAdd) return;
    onChange([...values, trimmed]);
    setDraft('');
  };

  return (
    <div>
      <div className={styles.tagRow}>
        <input
          id={inputId}
          className={styles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={label}
          maxLength={80}
          data-testid={testId ? `${testId}-input` : undefined}
        />
        <button
          type="button"
          className={styles.tagAdd}
          onClick={add}
          disabled={!canAdd}
          data-testid={testId ? `${testId}-add` : undefined}
        >
          Add
        </button>
      </div>

      {values.length === 0 ? (
        <p className={`${styles.tagList} ${styles.empty}`}>Nothing added yet.</p>
      ) : (
        <ul className={styles.tagList}>
          {values.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
              <button
                type="button"
                className={styles.tagRemove}
                onClick={() => onChange(values.filter((value) => value !== tag))}
                aria-label={`Remove ${tag}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
