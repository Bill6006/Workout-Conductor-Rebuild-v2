# Architecture

Current as of Phase 0. Later phases extend this document rather than replacing
it.

## Shape

A single-page React application, served as static files from GitHub Pages, that
does all of its thinking in the browser. There is no backend and no network
dependency for anything that matters.

```
index.html
  └── src/main.tsx
        └── src/app/App.tsx           shell: header, screen, nav, update prompt
              ├── useHashRoute()      hash → ScreenId
              ├── useAppUpdate()      service-worker lifecycle
              └── features/<tab>/     one folder per navigation tab
```

## Why hash routing

GitHub Pages serves a project subpath with no SPA rewrite rule. A path-based
route would 404 on refresh or on a shared deep link. Hash routes cost nothing,
survive reload, and give the Android back button correct behaviour for free.

`src/app/routes.ts` is the single source of truth for the five screens: the id
list, the nav order, and `parseRoute`, which resolves anything unrecognised to
Today rather than rendering an empty screen.

## Why the base path is unconditional

`vite.config.ts` sets `base` to the repository subpath for _every_ command, not
just `build`. Gating it on `command === 'build'` is the obvious-looking version
and it is wrong: `vite preview` runs as the `serve` command, so preview served
the bundle at `/` and returned `index.html` for every asset request. The browser
then refused the main script for a `text/html` MIME type and the app rendered a
blank page — while production was fine. Keeping dev, preview and production on
one base path removes the whole class of bug.

## Build identity

`PHASE.txt` holds the phase label. `vite.config.ts` injects it along with the
short commit sha and build time as `__BUILD_PHASE__`, `__BUILD_ID__` and
`__BUILD_TIME__`.

`src/core/build/buildInfo.ts` exposes these; the header renders them as a marker
chip. This exists because a cached service worker is otherwise indistinguishable
from a fresh deploy on a phone — the marker is how a review can tell which build
it is actually looking at.

`scripts/verify-build.mjs` fails the build if the marker was not injected.

## Runtime probes

`src/core/build/runtimeInfo.ts` reports display mode, base path, viewport,
network state and storage availability. Every probe is defensive: a browser with
storage blocked (private mode, locked-down settings) must degrade to
`unavailable`, never throw and blank the screen. Surfaced in Settings so a
problem on the phone is diagnosable from the phone.

## Service worker

Registered with `skipWaiting` and `clientsClaim` off, and surfaced through
`useAppUpdate()` as a prompt the user accepts. A deployment must never reload
the page out from under a live workout, so taking an update is always a tap.
Phase 8 hardens this further.

## Styling

CSS Modules per component, over a single token layer in
`src/styles/tokens.css` — colour, type scale, spacing, radius, elevation,
motion, layout. Components consume variables; nothing hard-codes a colour. The
whole app restyles from that one file.

Layout is a centred phone column capped at `--wc-app-max-width`, with the nav
fixed to the same column. Safe-area insets are honoured top and bottom.

## Testing

| Layer            | Tool                     | Covers                                                                                                                           |
| ---------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Unit             | Vitest + Testing Library | Route parsing, build info, runtime probes, components                                                                            |
| Browser / mobile | Playwright               | Navigation, deep links, back button, overflow at 360px and 150% zoom, tap targets, manifest, service worker, console cleanliness |

Playwright blocks service workers for the main suite — a worker installing
mid-navigation aborts `page.goto` and bleeds caches between tests. One spec opts
back in to prove registration and precaching genuinely work.

The `virtual:pwa-register/react` module only exists inside a plugin build, so
unit tests alias it to a stub with the same shape.

## Planned engine boundaries

Not yet built. Recorded so later phases do not drift into duplicate systems —
each responsibility gets exactly one owner.

| Owner                     | Responsibility                                              |
| ------------------------- | ----------------------------------------------------------- |
| `engine/workoutGenerator` | Build a session from profile, history, time, equipment      |
| `engine/recalibration`    | Every rebuild trigger; the only place a session mutates     |
| `engine/conflicts`        | Structured conflict detection for workouts and alternatives |
| `engine/alternatives`     | Rank and filter exercise substitutions                      |
| `engine/progression`      | Next-target recommendations from trends                     |
| `engine/recovery`         | Readiness and fatigue interpretation                        |
| `engine/duration`         | Time estimation for the 15/30/45/Default system             |
| `core/storage`            | IndexedDB with write, read-back and verify                  |
| `core/backup`             | Export, import, migration, rollback                         |

The duration dropdown (15 / 30 / 45 / Default time) is the **only**
workout-length system. No parallel workout modes, no competing start buttons.
