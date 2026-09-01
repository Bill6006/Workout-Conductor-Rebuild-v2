import { defineConfig, devices } from '@playwright/test';

/**
 * The built app lives under the Pages subpath, so the preview server and the
 * baseURL both have to carry it. Tests navigate with relative paths.
 */
const BASE_PATH = '/Workout-Conductor-Rebuild-v2/';
// 4173 (vite's default) and its neighbours are held by other local projects, so
// this app claims its own port and binds explicitly to IPv4.
const PORT = 4321;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // This machine commonly has other dev servers running; unbounded workers
  // starve the preview server and produce spurious timeouts.
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // A service worker installing mid-navigation aborts page.goto and bleeds
    // caches between tests. The one spec that asserts PWA behaviour opts back
    // in with test.use({ serviceWorkers: 'allow' }).
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'android-412',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'narrow-360',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 780 },
      },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
