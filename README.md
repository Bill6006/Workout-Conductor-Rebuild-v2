# Workout Conductor

**Adaptive Strength + Hypertrophy**

An intelligent, mobile-first workout coach that builds the best realistic session
for the time, equipment and recovery you actually have — then rebuilds it the
moment any of that changes.

- **Live app:** https://bill6006.github.io/Workout-Conductor-Rebuild-v2/
- **Project status:** [PROJECT_STATUS.md](PROJECT_STATUS.md)

This is a clean rebuild from a product plan. It shares no code with any earlier
version.

---

## Your data never leaves your phone

There is no account, no server, no analytics and no cloud sync. Workout history
lives in IndexedDB in your browser; small settings live in localStorage. The
repository and the deployed bundle contain only source code, blank defaults,
synthetic demo data and public exercise metadata.

`npm run privacy:scan` enforces this in CI and fails the build before anything
reaches the public site. See [docs/privacy-rules.md](docs/privacy-rules.md).

---

## Status

Phase 0 of 8 — repository, CI, GitHub Pages and the app shell.

The live link works on Android today and shows the real shell, the five-tab
navigation, the current phase and a build marker proving which build is running.
Each subsequent phase deploys to the same permanent URL.

| Phase | Delivers                                          | State       |
| ----- | ------------------------------------------------- | ----------- |
| 0     | Repository, CI, Pages, PWA shell, navigation      | In review   |
| 1     | Onboarding, profile, settings, storage foundation | Not started |
| 2     | Exercise catalog, media manifest, conflict engine | Not started |
| 3     | Workout generation and the duration engine        | Not started |
| 4     | Central recalibration engine                      | Not started |
| 5     | Active workout, set logging, supersets            | Not started |
| 6     | Adaptive Coach, progression, recovery             | Not started |
| 7     | Progress, plan, coverage, PRs, session summary    | Not started |
| 8     | Backup/restore, PWA polish, acceptance            | Not started |

---

## Stack

Vite · React · TypeScript · CSS Modules · IndexedDB · Zod · Vitest · Playwright ·
vite-plugin-pwa · ESLint · Prettier · GitHub Actions · GitHub Pages

The workout engine runs entirely in the browser. No backend, no AI API, no paid
services.

---

## Getting started

```bash
npm install
npm run dev
```

The dev server runs under the same `/Workout-Conductor-Rebuild-v2/` base path as
production, so a path bug cannot hide until deploy.

### Scripts

| Script                 | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Dev server with HMR                             |
| `npm run build`        | Type-check, then production build               |
| `npm run preview`      | Serve the built bundle on port 4321             |
| `npm run lint`         | ESLint                                          |
| `npm run format`       | Prettier write                                  |
| `npm run typecheck`    | TypeScript, no emit                             |
| `npm test`             | Unit tests (Vitest)                             |
| `npm run test:e2e`     | Browser + mobile tests (Playwright)             |
| `npm run privacy:scan` | Fail on any personal data in the repo or bundle |
| `npm run verify:build` | Validate the built bundle before deploy         |
| `npm run screenshots`  | Capture real phase screenshots                  |
| `npm run icons`        | Regenerate the PWA icon set from source         |
| `npm run verify`       | Everything above, in CI order                   |

---

## Layout

```
.github/workflows/   ci.yml (branches) and pages.yml (deploy from main)
docs/                architecture, privacy rules, screenshots, phase reports
public/icons/        generated PWA icons (see scripts/generate-icons.mjs)
scripts/             icon generation, privacy scan, build verification, capture
src/
  app/               shell, hash routing
  components/        reusable UI primitives
  core/              build info, runtime probes, PWA lifecycle
  features/          one folder per navigation tab
  styles/            design tokens and global CSS
tests/e2e/           Playwright browser and mobile tests
PHASE.txt            the phase label shown in the build marker
```

---

## Deployment

Every push to `main` runs install → lint → type-check → unit tests → build →
privacy scan → build verification → browser smoke tests → deploy. The deploy
step only runs if all of that passes, so a failed build leaves the previous
working deployment untouched.

## Licence

[MIT](LICENSE). Exercise demonstration media added in later phases will be
original or verifiably licensed for redistribution, and recorded in
`docs/media-license-register.md`.
