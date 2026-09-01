import { useRef, useState } from 'react';
import { buildInfo } from '../../core/build/buildInfo';
import {
  backupFilename,
  createBackup,
  parseBackup,
  serializeBackup,
} from '../../core/backup/backup';
import { replaceProfile } from '../../core/state/profileStore';
import type { Profile } from '../../core/model/profile';
import styles from './BackupPanel.module.css';

type Status =
  | { kind: 'idle' }
  | { kind: 'exported'; filename: string }
  | { kind: 'error'; message: string }
  | { kind: 'confirming'; profile: Profile; warnings: readonly string[]; filename: string }
  | { kind: 'imported'; warnings: readonly string[] };

/**
 * Backup export and import.
 *
 * An import replaces the whole profile, so it is a two-step action: the file is
 * parsed and summarised first, and nothing is written until the user confirms.
 * Phase 8 adds rollback and the optional legacy adapter on top of this.
 */
export function BackupPanel({ profile }: { profile: Profile }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const fileInput = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    try {
      const now = new Date().toISOString();
      const envelope = createBackup({
        profile,
        build: { phase: buildInfo.phase, build: buildInfo.id },
        now,
      });
      const filename = backupFilename(now);
      const blob = new Blob([serializeBackup(envelope)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Revoking immediately can cancel the download on some Android browsers.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      setStatus({ kind: 'exported', filename });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'The backup could not be created.',
      });
    }
  };

  const onFileChosen = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      setStatus({ kind: 'error', message: 'That file could not be read.' });
      return;
    }

    const result = parseBackup(text);
    if (!result.ok) {
      setStatus({ kind: 'error', message: result.error });
      return;
    }

    setStatus({
      kind: 'confirming',
      profile: result.envelope.profile,
      warnings: result.warnings,
      filename: file.name,
    });
  };

  const confirmImport = async () => {
    if (status.kind !== 'confirming') return;
    const warnings = status.warnings;
    const outcome = await replaceProfile(status.profile, new Date().toISOString());
    setStatus(
      outcome.ok
        ? { kind: 'imported', warnings }
        : { kind: 'error', message: outcome.error ?? 'The import could not be saved.' },
    );
  };

  return (
    <div className={styles.panel}>
      <div className={styles.actions}>
        <button
          type="button"
          className="wc-button wc-button--secondary wc-button--block"
          onClick={exportBackup}
          data-testid="backup-export"
        >
          Export backup
        </button>
        <button
          type="button"
          className="wc-button wc-button--secondary wc-button--block"
          onClick={() => fileInput.current?.click()}
          data-testid="backup-import"
        >
          Import backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="wc-visually-hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Reset so choosing the same file twice fires change again.
            event.target.value = '';
            if (file) void onFileChosen(file);
          }}
          data-testid="backup-file"
        />
      </div>

      {status.kind === 'exported' ? (
        <p className={styles.ok} role="status" data-testid="backup-status">
          Saved <strong>{status.filename}</strong> to your downloads. Keep it somewhere private — it
          contains your setup.
        </p>
      ) : null}

      {status.kind === 'error' ? (
        <p className={styles.error} role="alert" data-testid="backup-status">
          {status.message}
        </p>
      ) : null}

      {status.kind === 'imported' ? (
        <div className={styles.ok} role="status" data-testid="backup-status">
          <p>Backup restored. Your setup below now reflects the imported file.</p>
          {status.warnings.map((warning) => (
            <p className={styles.warning} key={warning}>
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      {status.kind === 'confirming' ? (
        <div className={styles.confirm} data-testid="backup-confirm">
          <p className={styles.confirmTitle}>Replace your current setup?</p>
          <p className={styles.confirmText}>
            <strong>{status.filename}</strong> contains a setup for {status.profile.weeklyFrequency}
            × per week, {status.profile.typicalDurationMinutes} minute sessions, with{' '}
            {status.profile.locations.length} saved location
            {status.profile.locations.length === 1 ? '' : 's'}. Importing overwrites what you have
            now.
          </p>
          {status.warnings.map((warning) => (
            <p className={styles.warning} key={warning}>
              {warning}
            </p>
          ))}
          <div className={styles.confirmActions}>
            <button
              type="button"
              className="wc-button wc-button--secondary wc-button--block"
              onClick={() => setStatus({ kind: 'idle' })}
            >
              Cancel
            </button>
            <button
              type="button"
              className="wc-button wc-button--primary wc-button--block"
              onClick={() => void confirmImport()}
              data-testid="backup-confirm-apply"
            >
              Replace setup
            </button>
          </div>
        </div>
      ) : null}

      <p className={styles.note}>
        A backup is a plain JSON file containing your setup. It never leaves this device unless you
        share it. Workout history joins the export once logging exists in Phase 5.
      </p>
    </div>
  );
}
