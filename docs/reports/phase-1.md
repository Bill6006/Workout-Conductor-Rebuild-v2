# Phase 1 report — Product Foundation and First Useful Live Preview

**State:** 🟡 YELLOW, awaiting Android review
**Live:** https://bill6006.github.io/Workout-Conductor-Rebuild-v2/

## Delivered

| Plan requirement                         | Where                                                            |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Step-by-step onboarding                  | `src/features/onboarding/` — 8 short steps plus a review         |
| Profile and goals                        | `src/core/model/profile.ts`                                      |
| Equipment and location profiles          | `src/core/model/equipment.ts`, edited in `features/plan`         |
| Preferences and limitations              | Onboarding steps and Settings sections                           |
| Settings                                 | `src/features/settings/SettingsScreen.tsx`                       |
| localStorage for small settings          | `src/core/storage/localSettings.ts`                              |
| IndexedDB durable-data foundation        | `src/core/storage/idb.ts`                                        |
| Schema validation                        | Zod schemas beside every model                                   |
| Write/read-back save-verification helper | `src/core/storage/saveVerified.ts`                               |
| Export/import foundation                 | `src/core/backup/backup.ts`, `features/settings/BackupPanel.tsx` |
| Today dashboard                          | `src/features/today/TodayScreen.tsx`                             |
| Safe synthetic demo workout preview      | `src/features/today/demoWorkout.ts`                              |

## The live page is now a product, not a scaffold

A first visit opens onboarding. Finishing it writes a verified profile and lands
on Today, which shows a real session preview built from that profile. Switching
location on Today rebuilds the preview around the equipment saved for that
location. Settings edits every field and persists immediately. A reload returns
to exactly where you were.

## Storage design

Two stores, with a hard line between them, as the plan requires.

| Data                                               | Store        | Why                               |
| -------------------------------------------------- | ------------ | --------------------------------- |
| Profile, locations, equipment, limitations         | IndexedDB    | Durable training data             |
| Onboarding progress, units mirror, active location | localStorage | Small, synchronous on first paint |

`saveVerified` is the only path critical data takes into storage: it writes,
reads back, and compares before reporting success. A save that silently failed
is the worst outcome the plan names, so the comparison is structural — it
tolerates the key reordering and dropped `undefined`s that the structured clone
algorithm introduces, and nothing else.

When IndexedDB cannot be opened at all — private mode, blocked site data — the
app runs from an in-memory profile and says so in a banner, rather than showing
a dead screen.

## The demo workout is clearly synthetic

`demoWorkout.ts` carries a `synthetic: true` flag it cannot be constructed
without, and every render path keeps an amber "Sample session — the real engine
arrives in Phase 3" banner above the card. It does apply real equipment
filtering, the barbell-squat exclusion, disliked-exercise filtering and a
duration trim, because that is what makes the preview worth looking at — but it
models no volume, recovery, conflicts or progression. Phase 3 replaces the file
outright.

The duration dropdown is deliberately **not** here. It is a Phase 3 deliverable
and will be the only workout-length system; Settings exposes a default session
length, which is a different thing.

## Tests

| Suite                                            | Tests   |
| ------------------------------------------------ | ------- |
| Unit (Vitest)                                    | 105     |
| Browser + mobile (Playwright, 412 px and 360 px) | 40      |
| **Total**                                        | **145** |

`fake-indexeddb` was added so the storage layer is exercised against a real
IndexedDB rather than a mock — a verified save is only meaningful against a real
read-back. Each test gets a fresh database.

The browser suite covers the whole setup flow, a settings change surviving a
reload, location switching changing the session, adding a location in Plan and
seeing it on Today, backup export producing a valid file, an import being
previewed and only applied on confirmation, and no horizontal overflow at 360 px
or 150 % zoom.

## Four real bugs found and fixed

**1. Profile recovery re-introduced the damage it was recovering from.** A
stored profile that failed validation was salvaged by spreading the damaged
record over the defaults — which put the invalid values straight back, so the
salvage failed too and the user lost their whole setup. Now salvaged field by
field: one corrupt field costs that field, not the profile. Caught by a test
that deliberately stores a damaged profile.

**2. A button variant dictated layout width.** `.wc-button--primary` and
`--secondary` both set `width: 100%`, so in the onboarding footer the Back
button claimed the entire row and pushed Continue off-screen — 104 px of
horizontal overflow, and Continue was unclickable. Full width is now an explicit
`--block` opt-in.

**3. Option labels and hints ran together.** Both were `<span>`s inside a
`<span>` with no `display: block`, so "Lean out" and "Keep muscle while losing
fat" rendered on one line across every option in onboarding and Settings.

**4. Duplicate test ids across control groups.** Two `OptionList`s on one screen
— primary and secondary goal — emitted the same `option-<id>`, making every
query ambiguous. Test ids are now scoped by the control's accessible name.

The first was a data-loss bug and the second made setup impossible to complete
on a phone. Both were caught by tests rather than by looking at screenshots.

## Known limitations

- Preferred and disliked exercises are free text until the Phase 2 catalog gives
  them real exercise ids.
- Workout history has an IndexedDB store and a backup slot, but nothing writes to
  it until logging exists in Phase 5.
- Backup import replaces the profile and is confirmed first, but has no rollback
  yet — that is Phase 8.
- The service-worker update delay recorded in the Phase 0 report still applies.

## Review

Open the live link on Android and reply with one of:

- `GREEN - NEXT PHASE`
- `YELLOW - FIX: <issue>`
- `RED - STOP`
