# Phase 0 report — Repository, Live Pages, and Scaffold

**State:** 🟡 YELLOW, awaiting Android review
**Live:** https://bill6006.github.io/Workout-Conductor-Rebuild-v2/

## Delivered

| Plan requirement                                        | Where                                        |
| ------------------------------------------------------- | -------------------------------------------- |
| New public repository                                   | `Bill6006/Workout-Conductor-Rebuild-v2`      |
| Permanent Pages URL from the first build                | `pages.yml`, deployed on push to `main`      |
| PROJECT_STATUS.md with live links and build marker      | `PROJECT_STATUS.md`                          |
| React/TypeScript scaffold                               | Vite 5, React 18, TS 5 strict                |
| PWA shell                                               | `vite-plugin-pwa`, generated icons, manifest |
| CI and Pages deployment                                 | `.github/workflows/ci.yml`, `pages.yml`      |
| Blank but polished mobile app shell                     | `src/app`, `src/components`, `src/features`  |
| Today / Workout / Progress / Plan / Settings navigation | `src/app/routes.ts`, `BottomNav`             |
| First real Android-sized screenshot                     | `docs/screenshots/phase-0/`                  |

## Repository naming

The plan's preferred name `Workout-Conductor` and its fallback
`Workout-Conductor-App` both already exist on this account, as does
`Workout-Conductor-Rebuild`. Per the launch instruction, this is a clearly
different new repository: **`Workout-Conductor-Rebuild-v2`**. No existing
repository was modified, renamed, archived or force-pushed.

## Tests

| Suite                                            | Tests |
| ------------------------------------------------ | ----- |
| Unit (Vitest)                                    | 30    |
| Browser + mobile (Playwright, 412 px and 360 px) | 22    |

Covered in the browser suite: tab navigation with exactly one `aria-current`,
deep links surviving reload, Android back button, no horizontal overflow on any
screen at 100 % and 150 % zoom, 44 px minimum tap targets, installable manifest
with a maskable icon, service-worker registration and precaching, and a clean
console.

## Three real bugs found and fixed

**1. `base` gated on the build command.** `vite.config.ts` set the Pages subpath
only when `command === 'build'`. `vite preview` runs as `serve`, so preview
served the bundle at `/` and returned `index.html` for every asset request. The
browser refused the main module for a `text/html` MIME type and rendered a blank
page. Production would have been fine, which is exactly what makes it dangerous
— the failure only appeared in preview and CI smoke tests. Fixed by applying the
base unconditionally, so dev, preview and production share one path.

**2. Service worker aborting test navigation.** A worker installing
mid-navigation aborted `page.goto` with `ERR_ABORTED` and leaked caches across
tests, producing failures that moved between runs. Fixed by blocking service
workers for the main suite and opting one spec back in to test PWA behaviour
directly. Suite time went from 2.4 minutes with 15 failures to 11.5 seconds with
none.

**3. `.gitignore` excluding real source.** A bare `build/` rule matched
`src/core/build/`, so `buildInfo.ts`, `runtimeInfo.ts` and their test were never
committed. Every local check passed; the first CI run failed on a clean checkout
with "cannot find module". Build-output rules are now anchored to the repository
root, and `scripts/check-tracked.mjs` fails the build if any file under `src`,
`tests`, `scripts`, `public` or `.github` is excluded by an ignore rule. Verified
against a planted rule: exit 1 when source is ignored, 0 when clean.

This one is worth keeping in mind for later phases — it is invisible to every
check that runs against the working tree, and only a clean checkout catches it.

## Verification tooling

`scripts/privacy-scan.mjs` fails the build on emails, phone numbers, tokens,
developer filesystem paths, workout-history JSON keys, or backup-shaped
filenames — scanning the working tree _and_ `dist/`. It was verified against
planted samples of all five rule types; a scanner that has never failed proves
nothing.

`scripts/verify-build.mjs` checks the base path, safe-area viewport,
theme-colour, manifest identity, icon presence including a maskable icon,
service-worker emission, build-marker injection, and the absence of source maps.

`scripts/generate-icons.mjs` renders the icon set from an original vector
definition using a dependency-free PNG encoder — no binary toolchain and no
third-party artwork.

## Performance

| Metric               | Value  | Target |
| -------------------- | ------ | ------ |
| Bundle, uncompressed | 177 KB | —      |
| Bundle, gzipped      | 59 KB  | —      |
| Build                | ~0.9 s | —      |
| Browser suite        | 11.5 s | —      |

Startup on real hardware is measured in Phase 1, once there is a meaningful
first paint to measure.

## Not in this phase

Workout generation, onboarding, persistence, exercise catalog, demonstration
media, the duration dropdown, and the recalibration engine. See the limitations
list in `PROJECT_STATUS.md`.

## Review

Open the live link on Android and reply with one of:

- `GREEN - NEXT PHASE`
- `YELLOW - FIX: <issue>`
- `RED - STOP`
