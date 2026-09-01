/**
 * Privacy scan.
 *
 * The local-first rule in the execution plan is absolute: the repository and
 * the deployed bundle may contain source, blank defaults, synthetic data and
 * public metadata - never real user data. This runs in CI before deploy, so a
 * leak fails the build instead of reaching a public Pages site.
 *
 *   node scripts/privacy-scan.mjs
 *
 * Exit code 0 = clean, 1 = findings.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Directories never worth scanning (or not ours to police). */
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'coverage',
  'playwright-report',
  'test-results',
  'blob-report',
  'dev-dist',
  '.vite',
]);

/** Binary-ish files: scanned for filename risk only, not content. */
const BINARY_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.mp4',
  '.webm',
  '.mov',
  '.mp3',
  '.wav',
  '.pdf',
  '.zip',
  '.gz',
  '.node',
]);

/**
 * Strings that legitimately appear in a public repository and must not trip
 * the scan. Kept short and explicit so it cannot quietly grow into a hole.
 */
const ALLOWED_SUBSTRINGS = [
  // The public GitHub account that owns this repository.
  'Bill6006',
  'bill6006',
  // Documentation / placeholder domains.
  'example.com',
  'example.org',
  'noreply.github.com',
  'users.noreply.github.com',
  'schemas.wp.org',
  'www.w3.org',
  // CI runner paths are not personal.
  '/home/runner',
  'C:\\hostedtoolcache',
];

const RULES = [
  {
    id: 'email',
    severity: 'error',
    description: 'Email address',
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    // npm writes upstream maintainer contacts into deprecation notices. Those
    // are public registry metadata, not the user's data - but the lockfile is
    // still scanned by every other rule.
    skipFiles: [/^package-lock\.json$/],
  },
  {
    id: 'phone',
    severity: 'error',
    description: 'Phone number',
    // Requires real separators, so version strings and hashes do not match.
    pattern: /(?<!\d)(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?!\d)/g,
  },
  {
    id: 'secret',
    severity: 'error',
    description: 'Credential or API token',
    pattern:
      /(gh[pousr]_[A-Za-z0-9]{16,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/g,
  },
  {
    id: 'local-path',
    severity: 'error',
    description: 'Local filesystem path from a developer machine',
    pattern:
      /([A-Za-z]:\\Users\\[^\s"'<>|]+|\/Users\/[A-Za-z0-9._-]+\/|\/home\/[A-Za-z0-9._-]+\/)/g,
    // The rules document has to show what this pattern catches. It is still
    // scanned by every other rule.
    skipFiles: [/^docs\/privacy-rules\.md$/],
  },
  {
    id: 'workout-history',
    severity: 'error',
    description: 'Looks like exported workout history',
    // Real exports carry logged sets; synthetic fixtures must be labelled.
    pattern: /"(loggedReps|loggedWeight|actualReps|personalRecords|workoutHistory)"\s*:/g,
  },
];

/** Filenames that should never be committed at all. */
const RISKY_FILENAME = /(backup|export|history|personal|private|my-data)[-_.].*\.json$/i;

const findings = [];
let filesScanned = 0;

function isAllowed(match) {
  return ALLOWED_SUBSTRINGS.some((allowed) => match.includes(allowed));
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let stats;
    try {
      stats = statSync(full);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walk(full);
      continue;
    }

    scanFile(full);
  }
}

function scanFile(full) {
  const rel = relative(ROOT, full).split('\\').join('/');
  const name = basename(full);

  if (RISKY_FILENAME.test(name)) {
    findings.push({
      file: rel,
      line: 0,
      rule: 'risky-filename',
      severity: 'error',
      description: 'Filename suggests exported user data',
      excerpt: name,
    });
  }

  if (BINARY_EXT.has(extname(full).toLowerCase())) return;

  let text;
  try {
    text = readFileSync(full, 'utf8');
  } catch {
    return;
  }
  filesScanned += 1;
  // Heuristic binary guard for extensionless files.
  if (text.includes('\u0000')) return;

  const lines = text.split(/\r?\n/);
  for (const rule of RULES) {
    if (rule.skipFiles?.some((exempt) => exempt.test(rel))) continue;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      rule.pattern.lastIndex = 0;
      let match;
      while ((match = rule.pattern.exec(line)) !== null) {
        const value = match[0];
        if (isAllowed(value)) continue;
        findings.push({
          file: rel,
          line: i + 1,
          rule: rule.id,
          severity: rule.severity,
          description: rule.description,
          excerpt: value.length > 80 ? `${value.slice(0, 77)}...` : value,
        });
      }
    }
  }
}

/* ------------------------------------------------------------------ run */

console.log('Privacy scan');
console.log('------------');

// dist/ is what actually gets published, so it is scanned when present.
if (existsSync(join(ROOT, 'dist'))) {
  console.log('  scanning source and dist/ (the deployed bundle)');
} else {
  console.log('  scanning source (dist/ not built yet)');
}

walk(ROOT);

const errors = findings.filter((f) => f.severity === 'error');

if (errors.length === 0) {
  console.log(`\nClean. ${filesScanned} file(s) scanned, no personal data found.`);
  process.exit(0);
}

console.error(`\n${errors.length} privacy finding(s):\n`);
for (const finding of errors) {
  console.error(`  ${finding.file}:${finding.line}`);
  console.error(`    [${finding.rule}] ${finding.description}`);
  console.error(`    ${finding.excerpt}\n`);
}
console.error('Real user data must never be committed. Remove it and rewrite history if pushed.');
process.exit(1);
