# Privacy rules

The plan's local-first rule is absolute. This document is the enforceable
version of it.

## What may live in this repository

- source code
- blank defaults
- clearly-labelled synthetic demo data
- public exercise metadata
- original or verifiably licensed media
- screenshots of the app containing no real training data

## What may never live in this repository

- real workout history
- exported backups of any kind
- personal notes, cues or measurements
- email addresses, phone numbers, postal addresses
- API keys, tokens, credentials, private keys
- absolute filesystem paths from a developer machine
- anything identifying a real person

## Where real data lives instead

| Data                            | Store        | Why                               |
| ------------------------------- | ------------ | --------------------------------- |
| Workout history, sessions, PRs  | IndexedDB    | Durable, large, structured        |
| Custom exercises and user media | IndexedDB    | Same lifecycle as history         |
| Settings, units, preferences    | localStorage | Small, synchronous reads          |
| Active-session metadata         | localStorage | Must survive a reload mid-workout |

Nothing is transmitted. There is no server to transmit it to.

## Enforcement

`scripts/privacy-scan.mjs` runs in CI before the deploy step and fails the build
on any finding. It scans the working tree _and_ `dist/` — the bundle is what
actually becomes public.

Rules currently enforced:

| Rule              | Catches                                       |
| ----------------- | --------------------------------------------- |
| `email`           | Email addresses                               |
| `phone`           | Phone numbers with real separators            |
| `secret`          | GitHub/OpenAI/AWS tokens, private key blocks  |
| `local-path`      | `C:\Users\…`, `/Users/…`, `/home/…`           |
| `workout-history` | JSON keys that only appear in real exports    |
| `risky-filename`  | `backup-*.json`, `export-*.json`, and similar |

The scanner is verified against planted samples — a scan that cannot fail is
not a scan. `.gitignore` blocks the same filename shapes as a second layer.

### Allowlist

A short, explicit allowlist covers strings that legitimately appear in a public
repository (the owning GitHub account, documentation domains, CI runner paths).
`package-lock.json` is exempt from the email rule only: npm writes upstream
maintainer contacts into deprecation notices, and those are public registry
metadata. It is still scanned by every other rule.

Keep the allowlist short. Every entry is a hole.

## If something leaks

1. Do not just delete it in a new commit — the object stays in history.
2. Remove it, rewrite history, and force-push.
3. Rotate anything credential-shaped immediately.
4. Add a scanner rule so the same shape cannot return.
