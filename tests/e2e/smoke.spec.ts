import { expect, test, type Page } from '@playwright/test';

const SCREENS = [
  { id: 'today', label: 'Today', heading: 'Your session, tuned daily' },
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

test.describe('Phase 0 app shell', () => {
  test('loads the shell with brand and visible build marker', async ({ page }) => {
    await page.goto('./');

    await expect(page.getByText('Workout Conductor')).toBeVisible();
    const marker = page.getByTestId('build-marker');
    await expect(marker).toBeVisible();
    await expect(marker).toContainText(/build [0-9a-f]{7}|build local/);
  });

  test('navigates every tab and keeps exactly one marked current', async ({ page }) => {
    await page.goto('./');

    for (const screenDef of SCREENS) {
      await page.getByTestId(`nav-${screenDef.id}`).click();

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(screenDef.heading);
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
    await expect(page.getByTestId('nav-progress')).toHaveAttribute('aria-current', 'page');
  });

  test('the Android back button returns to the previous tab', async ({ page }) => {
    await page.goto('./');
    await page.getByTestId('nav-plan').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The week ahead');

    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your session, tuned daily');
  });

  test('no horizontal overflow on any screen', async ({ page }) => {
    await page.goto('./');

    for (const screenDef of SCREENS) {
      await page.getByTestId(`nav-${screenDef.id}`).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(screenDef.heading);
      expect(await horizontalOverflow(page), `${screenDef.label} overflows horizontally`).toBe(0);
    }
  });

  test('no horizontal overflow at 150 percent zoom', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => {
      document.documentElement.style.setProperty('zoom', '1.5');
    });

    for (const screenDef of SCREENS) {
      await page.getByTestId(`nav-${screenDef.id}`).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(screenDef.heading);
      expect(await horizontalOverflow(page), `${screenDef.label} overflows when zoomed`).toBe(0);
    }
  });

  test('every nav target is large enough to tap', async ({ page }) => {
    await page.goto('./');

    for (const screenDef of SCREENS) {
      const box = await page.getByTestId(`nav-${screenDef.id}`).boundingBox();
      expect(box, `${screenDef.label} tab has no box`).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(40);
    }
  });

  test('ships an installable PWA manifest', async ({ page }) => {
    await page.goto('./');

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
    expect(manifest.icons?.length).toBeGreaterThanOrEqual(2);
    expect(manifest.icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  test('the Settings diagnostics report the real runtime', async ({ page }) => {
    await page.goto('./#/settings');

    const rows = page.getByTestId('diagnostics-rows');
    await expect(rows).toContainText('Base path');
    await expect(rows).toContainText('/Workout-Conductor-Rebuild-v2/');
    await expect(rows).toContainText('Service worker');
  });

  test('loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('./');
    await page.getByTestId('nav-settings').click();
    await expect(page.getByText('About this build')).toBeVisible();

    expect(errors).toEqual([]);
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

    // The precache is what makes the app open without a network.
    await expect
      .poll(async () => page.evaluate(async () => (await caches.keys()).length), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);
  });
});
