import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The app is served from a GitHub Pages project subpath, so every asset URL has
 * to be prefixed. Keep this in sync with the repository name.
 */
const REPO_BASE = '/Workout-Conductor-Rebuild-v2/';

/** Short commit sha, from CI when available, otherwise from the local checkout. */
function resolveBuildId(): string {
  const fromCi = process.env.GITHUB_SHA;
  if (fromCi) return fromCi.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'local';
  }
}

/**
 * The phase label shown in the build marker. Kept in PHASE.txt so bumping a
 * phase is one data change that behaves identically locally and in CI, rather
 * than a workflow edit.
 */
function resolveBuildPhase(): string {
  if (process.env.WC_BUILD_PHASE) return process.env.WC_BUILD_PHASE;
  try {
    return readFileSync(new URL('./PHASE.txt', import.meta.url), 'utf8').trim() || 'Phase 0';
  } catch {
    return 'Phase 0';
  }
}

export default defineConfig(() => ({
  // Applied unconditionally, not just for `build`: `vite preview` runs as the
  // `serve` command, so gating this on the command made preview serve the
  // bundle at / and hand back index.html for every asset request.
  base: REPO_BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: REPO_BASE,
        name: 'Workout Conductor',
        short_name: 'Conductor',
        description: 'Adaptive strength and hypertrophy coach. Your data stays on your phone.',
        theme_color: '#0b0c0e',
        background_color: '#0b0c0e',
        display: 'standalone',
        orientation: 'portrait',
        scope: REPO_BASE,
        start_url: REPO_BASE,
        categories: ['health', 'fitness', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Never let a deployment take the app offline mid-session; the update is
        // offered, not forced. Phase 8 hardens this further.
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        navigateFallback: `${REPO_BASE}index.html`,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __BUILD_ID__: JSON.stringify(resolveBuildId()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __BUILD_PHASE__: JSON.stringify(resolveBuildPhase()),
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
    restoreMocks: true,
    alias: {
      // The PWA virtual module only exists inside a plugin build.
      'virtual:pwa-register/react': fileURLToPath(
        new URL('./src/test/stubs/pwaRegister.ts', import.meta.url),
      ),
    },
  },
}));
