/**
 * Post-build verification.
 *
 * Catches the failure modes that only show up once the bundle is served from
 * a GitHub Pages project subpath - wrong base path, a manifest pointing at
 * icons that were never emitted, a missing service worker, a build marker that
 * did not get injected. Cheaper to fail here than on the phone.
 *
 *   node scripts/verify-build.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const BASE = '/Workout-Conductor-Rebuild-v2/';

const problems = [];
const notes = [];

function fail(message) {
  problems.push(message);
}

function ok(message) {
  notes.push(message);
}

/* ------------------------------------------------------------ dist exists */

if (!existsSync(DIST)) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

/* --------------------------------------------------------------- index.html */

const indexPath = join(DIST, 'index.html');
if (!existsSync(indexPath)) {
  fail('dist/index.html is missing');
}

const html = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';

if (html && !html.includes(`"${BASE}assets/`) && !html.includes(`'${BASE}assets/`)) {
  fail(`index.html does not reference the Pages base path ${BASE} for its assets`);
} else if (html) {
  ok(`assets are prefixed with ${BASE}`);
}

if (html.includes('viewport-fit=cover')) {
  ok('viewport uses safe-area insets');
} else {
  fail('index.html is missing viewport-fit=cover (safe-area insets)');
}

if (/<meta[^>]+name="theme-color"/.test(html)) {
  ok('theme-color is set');
} else {
  fail('index.html is missing a theme-color meta tag');
}

if (/<link[^>]+rel="manifest"/.test(html)) {
  ok('manifest is linked');
} else {
  fail('index.html does not link a web app manifest');
}

/* ------------------------------------------------ referenced asset existence */

const referenced = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((href) => href.startsWith(BASE));

for (const href of referenced) {
  const asset = join(DIST, href.slice(BASE.length));
  if (!existsSync(asset)) {
    fail(`index.html references ${href} but dist has no such file`);
  }
}
if (referenced.length > 0) {
  ok(`${referenced.length} referenced asset(s) resolve on disk`);
}

/* ----------------------------------------------------------------- manifest */

const manifestCandidates = readdirSync(DIST).filter((name) => name.endsWith('.webmanifest'));
if (manifestCandidates.length === 0) {
  fail('no .webmanifest emitted into dist/');
} else {
  const manifestPath = join(DIST, manifestCandidates[0]);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    fail(`manifest is not valid JSON: ${error.message}`);
  }

  if (manifest) {
    if (manifest.name !== 'Workout Conductor') fail('manifest name is not "Workout Conductor"');
    if (manifest.display !== 'standalone') fail('manifest display is not "standalone"');
    if (manifest.start_url !== BASE)
      fail(`manifest start_url is "${manifest.start_url}", expected "${BASE}"`);
    if (manifest.scope !== BASE) fail(`manifest scope is "${manifest.scope}", expected "${BASE}"`);

    const icons = manifest.icons ?? [];
    if (icons.length < 2) fail('manifest declares fewer than two icons');
    if (!icons.some((icon) => icon.purpose === 'maskable')) {
      fail('manifest has no maskable icon (Android will letterbox the launcher icon)');
    }

    for (const icon of icons) {
      const iconPath = join(DIST, icon.src.replace(/^\//, '').replace(BASE.slice(1), ''));
      const direct = join(DIST, icon.src.startsWith(BASE) ? icon.src.slice(BASE.length) : icon.src);
      if (!existsSync(direct) && !existsSync(iconPath)) {
        fail(`manifest icon ${icon.src} is not present in dist/`);
      }
    }
    if (icons.length > 0) ok(`${icons.length} manifest icon(s) present`);
  }
}

/* ----------------------------------------------------------- service worker */

if (existsSync(join(DIST, 'sw.js'))) {
  ok('service worker emitted');
  const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
  if (/skipWaiting\s*\(\s*\)/.test(sw) && !/self\.skipWaiting/.test(sw)) {
    // A precache manifest reference is fine; an unconditional call is not.
    notes.push('service worker mentions skipWaiting (verify it is not unconditional)');
  }
} else {
  fail('no sw.js emitted - the app will not be installable or work offline');
}

/* ------------------------------------------------------------- build marker */

const assetsDir = join(DIST, 'assets');
let markerFound = false;
let bundleBytes = 0;
const bundles = [];

if (existsSync(assetsDir)) {
  for (const name of readdirSync(assetsDir)) {
    const full = join(assetsDir, name);
    const size = statSync(full).size;
    bundleBytes += size;
    bundles.push({ name, size });
    if (name.endsWith('.js')) {
      const code = readFileSync(full, 'utf8');
      if (/Phase \d/.test(code)) markerFound = true;
    }
  }
}

if (markerFound) {
  ok('build marker injected into the bundle');
} else {
  fail('no build marker found in the JS bundle (__BUILD_PHASE__ was not injected)');
}

/* -------------------------------------------------------------- source maps */

const maps = existsSync(assetsDir)
  ? readdirSync(assetsDir).filter((name) => name.endsWith('.map'))
  : [];
if (maps.length > 0) {
  fail(`${maps.length} source map(s) shipped to dist/ - these expose local paths`);
} else {
  ok('no source maps shipped');
}

/* ------------------------------------------------------------------- report */

console.log('Build verification');
console.log('------------------');
for (const note of notes) console.log(`  ok    ${note}`);

console.log('\nBundle');
for (const bundle of bundles.sort((a, b) => b.size - a.size).slice(0, 8)) {
  console.log(`  ${(bundle.size / 1024).toFixed(1).padStart(8)} KB  ${bundle.name}`);
}
console.log(`  ${(bundleBytes / 1024).toFixed(1).padStart(8)} KB  total (uncompressed)`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  FAIL  ${problem}`);
  console.error(`\nBuild at ${relative(ROOT, DIST)} is not safe to deploy.`);
  process.exit(1);
}

console.log('\nBuild verified and safe to deploy.');
