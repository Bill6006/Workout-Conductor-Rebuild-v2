/**
 * Captures the phase screenshots that PROJECT_STATUS.md links to.
 *
 * These are real captures of the built application, never mockups. The script
 * starts its own preview server unless one is already listening.
 *
 *   node scripts/capture-screenshots.mjs [phase]
 *
 * Output: docs/screenshots/<phase>/
 */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/** Defaults to the current phase, so a capture cannot land in the wrong folder. */
function currentPhaseSlug() {
  try {
    return readFileSync(new URL('../PHASE.txt', import.meta.url), 'utf8')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
  } catch {
    return 'phase-0';
  }
}

const PHASE = process.argv[2] ?? currentPhaseSlug();
const OUT_DIR = join(ROOT, 'docs', 'screenshots', PHASE);
const PORT = 4321;

/**
 * Capture target. Defaults to a local preview; set WC_CAPTURE_BASE to the live
 * Pages URL to capture the deployment itself, which is stronger evidence for a
 * phase report than a local build.
 */
const BASE =
  process.env.WC_CAPTURE_BASE ?? `http://127.0.0.1:${PORT}/Workout-Conductor-Rebuild-v2/`;
const IS_REMOTE = Boolean(process.env.WC_CAPTURE_BASE);

const SCREENS = [
  { id: 'today', label: 'Today' },
  { id: 'workout', label: 'Workout' },
  { id: 'progress', label: 'Progress' },
  { id: 'plan', label: 'Plan' },
  { id: 'settings', label: 'Settings' },
];

/* ------------------------------------------------------------ preview server */

async function isUp() {
  try {
    const response = await fetch(BASE, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isUp()) return true;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return false;
}

let server = null;

async function ensureServer() {
  if (IS_REMOTE) {
    console.log('  capturing the live deployment at', BASE);
    if (!(await isUp())) throw new Error(`${BASE} is not reachable`);
    return;
  }
  if (await isUp()) {
    console.log('  using the preview server already listening on', PORT);
    return;
  }
  console.log('  starting preview server...');
  server = spawn('npm', ['run', 'preview'], {
    cwd: ROOT,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  if (!(await waitForServer())) {
    throw new Error(`preview server did not come up at ${BASE}`);
  }
}

function stopServer() {
  if (server && !server.killed) server.kill();
}

/* -------------------------------------------------------------- onboarding */

/**
 * Walk the real setup flow so the captured screens show a configured app.
 *
 * The profile lives in IndexedDB, which is per-context, so every context that
 * captures a post-setup screen has to go through this first.
 */
async function completeOnboarding(context) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(BASE, { waitUntil: 'load' });

  for (let guard = 0; guard < 20; guard += 1) {
    const next = page.getByTestId('onboarding-next');
    const isFinish = (await next.textContent()) === 'Finish setup';
    await next.click();
    if (isFinish) break;
  }

  await page.getByTestId('nav-today').waitFor({ state: 'visible', timeout: 15_000 });
  await page.close();
}

/* ---------------------------------------------------------------- capturing */

/** Settle fonts and the screen entry animation before capturing. */
async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(350);
}

async function capture(context, { file, path, viewport, fullPage = false }) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await settle(page);
  await page.screenshot({ path: join(OUT_DIR, file), fullPage });
  await page.close();
  console.log(`  ${file}`);
}

/* -------------------------------------------------------------------- sheet */

/** Compose the individual phone captures into one contact sheet. */
async function buildContactSheet(context) {
  const tiles = SCREENS.map((screen) => {
    const png = readFileSync(join(OUT_DIR, `${screen.id}-412.png`)).toString('base64');
    return `
      <figure>
        <img src="data:image/png;base64,${png}" alt="${screen.label} screen" />
        <figcaption>${screen.label}</figcaption>
      </figure>`;
  }).join('');

  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0b0c0e;
    color: #fff;
    font-family: 'Segoe UI', system-ui, sans-serif;
    padding: 40px;
  }
  h1 { font-size: 24px; letter-spacing: -0.02em; }
  p { color: #8b9099; font-size: 14px; margin-top: 6px; }
  .grid { display: flex; gap: 24px; margin-top: 32px; align-items: flex-start; }
  figure { flex: 1; min-width: 0; }
  img {
    width: 100%;
    border-radius: 18px;
    border: 1px solid #292d34;
    display: block;
  }
  figcaption {
    margin-top: 10px;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: #a7adb8;
  }
</style></head>
<body>
  <h1>Workout Conductor - ${PHASE.replace('-', ' ')}</h1>
  <p>Captured at 412 x 915 from ${IS_REMOTE ? 'the live deployment' : 'a local build'}: ${BASE}</p>
  <div class="grid">${tiles}</div>
</body></html>`;

  const sheetPath = join(OUT_DIR, '_sheet.html');
  writeFileSync(sheetPath, html, 'utf8');

  const page = await context.newPage();
  await page.setViewportSize({ width: 1800, height: 1040 });
  await page.goto(`file://${sheetPath.split('\\').join('/')}`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT_DIR, 'preview-sheet.png'), fullPage: true });
  await page.close();
  rmSync(sheetPath, { force: true });
  console.log('  preview-sheet.png');
}

/* --------------------------------------------------------------------- main */

mkdirSync(OUT_DIR, { recursive: true });

console.log(`Capturing ${PHASE} screenshots`);
console.log('------------------------------');

await ensureServer();

const browser = await chromium.launch();
const context = await browser.newContext({
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: 'dark',
  // A service worker installing mid-capture can abort navigation.
  serviceWorkers: 'block',
});

try {
  // Onboarding is what a new user sees first, so it is captured before setup
  // is completed.
  const intro = await context.newPage();
  await intro.setViewportSize({ width: 412, height: 915 });
  await intro.goto(BASE, { waitUntil: 'load' });
  await settle(intro);
  await intro.screenshot({ path: join(OUT_DIR, 'onboarding-welcome-412.png') });
  console.log('  onboarding-welcome-412.png');

  await intro.getByTestId('onboarding-next').click();
  await settle(intro);
  await intro.screenshot({ path: join(OUT_DIR, 'onboarding-goals-412.png') });
  console.log('  onboarding-goals-412.png');
  await intro.close();

  await completeOnboarding(context);

  // Android-sized captures of every screen.
  for (const screen of SCREENS) {
    await capture(context, {
      file: `${screen.id}-412.png`,
      path: `#/${screen.id}`,
      viewport: { width: 412, height: 915 },
    });
  }

  // Narrowest supported phone, and a full-length Today page.
  await capture(context, {
    file: 'today-360.png',
    path: '#/today',
    viewport: { width: 360, height: 780 },
  });
  await capture(context, {
    file: 'today-412-full.png',
    path: '#/today',
    viewport: { width: 412, height: 915 },
    fullPage: true,
  });

  await buildContactSheet(context);

  // Desktop needs its own context: isMobile forces a mobile user agent. A new
  // context means a new IndexedDB, so setup has to be repeated.
  const desktop = await browser.newContext({
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    serviceWorkers: 'block',
  });
  await completeOnboarding(desktop);
  await capture(desktop, {
    file: 'today-desktop.png',
    path: '#/today',
    viewport: { width: 1280, height: 900 },
  });
  await desktop.close();
} finally {
  await context.close();
  await browser.close();
  stopServer();
}

if (!existsSync(join(OUT_DIR, 'preview-sheet.png'))) {
  console.error('contact sheet was not produced');
  process.exit(1);
}

console.log(`\nScreenshots written to docs/screenshots/${PHASE}/`);
