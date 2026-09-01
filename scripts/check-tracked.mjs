/**
 * Guards against source that exists locally but was never committed.
 *
 * A bare `build/` line in .gitignore silently excluded src/core/build/ from the
 * first commit: everything passed locally and CI failed on a clean checkout
 * with "cannot find module". This makes that class of mistake loud and local.
 *
 *   node scripts/check-tracked.mjs
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Directories whose contents are genuinely build output or dependencies. */
const SKIP = new Set(['node_modules', 'dist', 'coverage', 'test-results', 'playwright-report']);

/** Source trees that must be fully tracked. */
const WATCHED = ['src', 'tests', 'scripts', 'public', '.github'];

const SOURCE_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.json',
  '.html',
  '.svg',
  '.png',
  '.webmanifest',
  '.yml',
  '.yaml',
  '.txt',
  '.md',
]);

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SOURCE_EXT.has(extname(entry).toLowerCase())) out.push(full);
  }
  return out;
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

const tracked = new Set(
  git(['ls-files'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
);

const onDisk = [];
for (const dir of WATCHED) walk(join(ROOT, dir), onDisk);

const untracked = onDisk
  .map((full) => relative(ROOT, full).split('\\').join('/'))
  .filter((rel) => !tracked.has(rel))
  // A file staged but not yet committed is fine; one git refuses to add is not.
  .filter((rel) => {
    try {
      // Non-empty output means an ignore rule matches this path.
      return git(['check-ignore', '-v', rel]).trim().length > 0;
    } catch {
      // Exit code 1 means "not ignored" - it is simply a new file.
      return false;
    }
  });

console.log('Tracked-source check');
console.log('--------------------');

if (untracked.length === 0) {
  console.log(`  ${onDisk.length} source file(s) checked, none excluded by .gitignore.`);
  process.exit(0);
}

console.error(`\n${untracked.length} source file(s) are excluded by .gitignore:\n`);
for (const rel of untracked) {
  console.error(`  ${rel}`);
  console.error(`    ${git(['check-ignore', '-v', rel]).trim()}\n`);
}
console.error('These would be missing from a clean checkout. Anchor the ignore rule to the');
console.error('repository root (/build/ rather than build/) or add an exception.');
process.exit(1);
