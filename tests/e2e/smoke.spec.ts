import { expect, test, type Page } from '@playwright/test';

const SCREENS = [
  { id: 'today', label: 'Today', heading: 'Good ' },
  { id: 'workout', label: 'Workout', heading: 'Built for one hand' },
  { id: 'progress', label: 'Progress', heading: 'Evidence, not vibes' },
  { id: 'plan', label: 'Plan', heading: 'The week ahead' },
  { id: 'settings', label: 'Settings', heading: 'You stay in control' },
] as const;

/** Documents wider than the viewport are the classic mobile layout bug. */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollWidth - doc.clientWidth);
  });
}

/**
 * Walk the real onboarding flow.
 *
 * Deliberately not seeded through storage: the profile lives in IndexedDB,
 * which Playwright's storageState cannot carry, and clicking through means
 * every shell test also proves setup still works.
 */
export async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('./');
  await expect(page.getByTestId('onboarding-next')).toHaveText('Get started');

  for (let guard = 0; guard < 20; guard += 1) {
    const next = page.getByTestId('onboarding-next');
    const isFinish = (await next.textContent()) === 'Finish setup';
    await next.click();
    if (isFinish) break;
  }

  await expect(page.getByTestId('nav-today')).toBeVisible();
}

test.describe('Onboarding', () => {
  test('opens on the welcome screen for a new user', async ({ page }) => {
    await page.goto('./');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workout Conductor');
    await expect(page.getByText(/never leaves this browser/)).toBeVisible();
    // The main shell must not be reachable before setup.
    await expect(page.getByTestId('nav-today')).toHaveCount(0);
  });

  test('walks through setup and lands on Today', async ({ page }) => {
    await completeOnboarding(page);

    await expect(page.getByTestId('nav-today')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('demo-workout')).toBeVisible();
  });

  test('a chosen goal survives a reload', async ({ page }) => {
    await page.goto('./');
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('option-primary-goal-get-stronger').click();

    for (let guard = 0; guard < 20; guard += 1) {
      const next = page.getByTestId('onboarding-next');
      const isFinish = (await next.textContent()) === 'Finish setup';
      await next.click();
      if (isFinish) break;
    }

    await expect(page.getByTestId('nav-today')).toBeVisible();
    await page.reload();

    // Straight back to the shell, with the choice intact.
    await expect(page.getByTestId('nav-today')).toBeVisible();
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('section-goals').click();
    await expect(page.getByTestId('option-primary-goal-get-stronger')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});

test.describe('App shell', () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page);
  });

  test('shows the brand and a visible build marker', async ({ page }) => {
    await expect(page.getByText('Workout Conductor').first()).toBeVisible();
    const marker = page.getByTestId('build-marker');
    await expect(marker).toBeVisible();
    await expect(marker).toContainText(/build [0-9a-f]{7}|build local/);
  });

  test('navigates every tab and keeps exactly one marked current', async ({ page }) => {
    for (const screenDef of SCREENS) {
      await page.getByTestId(`nav-${screenDef.id}`).click();

      await expect(page.getByRole('heading', { level: 1 })).toContainText(screenDef.heading);
      await expect(page.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(page.getByTestId(`nav-${screenDef.id}`)).toHaveAttribute('aria-current', 'page');
      await expect(page).toHaveURL(new RegExp(`#/${screenDef.id}$`));
    }
  });

  test('deep links survive a reload', async ({ page }) => {
    await page.goto('./#/progress');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Evidence, not vibes');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Evidence, not vibes');
  });

  test('the Android back button returns to the previous tab', async ({ page }) => {
    await page.getByTestId('nav-plan').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The week ahead');

    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Good ');
  });

  test('no horizontal overflow on any screen', async ({ page }) => {
    for (const screenDef of SCREENS) {
      await page.getByTestId(`nav-${screenDef.id}`).click();
      await expect(page.getByRole('heading', { level: 1 })).toContainText(screenDef.heading);
      expect(await horizontalOverflow(page), `${screenDef.label} overflows horizontally`).toBe(0);
    }
  });

  test('no horizontal overflow at 150 percent zoom', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.style.setProperty('zoom', '1.5');
    });

    for (const screenDef of SCREENS) {
      await page.getByTestId(`nav-${screenDef.id}`).click();
      await expect(page.getByRole('heading', { level: 1 })).toContainText(screenDef.heading);
      expect(await horizontalOverflow(page), `${screenDef.label} overflows when zoomed`).toBe(0);
    }
  });

  test('every nav target is large enough to tap', async ({ page }) => {
    for (const screenDef of SCREENS) {
      const box = await page.getByTestId(`nav-${screenDef.id}`).boundingBox();
      expect(box, `${screenDef.label} tab has no box`).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(40);
    }
  });

  test('ships an installable PWA manifest', async ({ page }) => {
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBeTruthy();

    const manifest = await page.evaluate(async (href) => {
      const response = await fetch(href!);
      return (await response.json()) as {
        name?: string;
        display?: string;
        icons?: { purpose?: string }[];
      };
    }, manifestHref);

    expect(manifest.name).toBe('Workout Conductor');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  test('loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.getByTestId('nav-settings').click();
    await expect(page.getByText('About this build')).toBeVisible();
    await page.getByTestId('nav-plan').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The week ahead');

    expect(errors).toEqual([]);
  });
});

test.describe('Profile persistence', () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page);
  });

  test('a settings change survives a reload', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('section-schedule').click();

    await page.getByTestId('settings-frequency-increase').click();
    await expect(page.getByTestId('settings-frequency')).toContainText('5');

    await page.reload();
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('section-schedule').click();
    await expect(page.getByTestId('settings-frequency')).toContainText('5');
  });

  test('switching location changes the sample session', async ({ page }) => {
    const gymCount = await page.getByTestId('demo-workout').getByRole('listitem').count();

    await page.getByTestId('segment-training-location-travel').click();

    await expect
      .poll(async () => page.getByTestId('demo-workout').getByRole('listitem').count())
      .toBeLessThan(gymCount);
  });

  test('a location added in Plan appears on Today', async ({ page }) => {
    await page.getByTestId('nav-plan').click();
    await page.getByTestId('location-new-name').fill('Hotel gym');
    await page.getByTestId('location-add').click();

    await expect(page.getByTestId('location-hotel-gym')).toBeVisible();

    await page.getByTestId('nav-today').click();
    await expect(page.getByTestId('segment-training-location-hotel-gym')).toBeVisible();
  });

  test('the sample session is always labelled as synthetic', async ({ page }) => {
    const demo = page.getByTestId('demo-workout');
    await expect(demo).toContainText('Sample session');
    await expect(demo).toContainText('Phase 3');
  });
});

test.describe('Backup', () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page);
  });

  test('exports a valid backup file', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('section-backup').click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('backup-export').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^workout-conductor-.*\.json$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
      format: string;
      profile: { primaryGoal: string };
    };

    expect(parsed.format).toBe('workout-conductor-backup');
    expect(parsed.profile.primaryGoal).toBe('build-muscle');
  });

  test('rejects a file that is not a backup', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('section-backup').click();

    await page.getByTestId('backup-file').setInputFiles({
      name: 'notes.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"hello":"world"}'),
    });

    await expect(page.getByTestId('backup-status')).toContainText('not a Workout Conductor backup');
  });

  test('previews an import and only applies it on confirmation', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('section-backup').click();

    // Export first so the fixture is genuinely this build's own format.
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('backup-export').click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const envelope = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
      profile: { primaryGoal: string; weeklyFrequency: number };
    };
    envelope.profile.primaryGoal = 'get-stronger';
    envelope.profile.weeklyFrequency = 6;

    await page.getByTestId('backup-file').setInputFiles({
      name: 'restore.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(envelope)),
    });

    // Nothing has changed yet - the import waits for confirmation.
    await expect(page.getByTestId('backup-confirm')).toBeVisible();
    await page.getByTestId('backup-confirm-apply').click();

    await expect(page.getByTestId('backup-status')).toContainText('Backup restored');

    await page.reload();
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('section-goals').click();
    await expect(page.getByTestId('option-primary-goal-get-stronger')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});

/**
 * Service workers are blocked for the suite above, so a worker installing
 * mid-navigation cannot abort page.goto or leak caches across tests. This
 * block opts back in to prove the app really is installable and offline-ready.
 */
test.describe('PWA registration', () => {
  test.use({ serviceWorkers: 'allow' });

  test('registers a service worker and caches the shell', async ({ page }) => {
    await page.goto('./');

    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            return Boolean(
              registration?.active ?? registration?.installing ?? registration?.waiting,
            );
          }),
        { timeout: 15_000 },
      )
      .toBe(true);

    await expect
      .poll(async () => page.evaluate(async () => (await caches.keys()).length), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);
  });
});
