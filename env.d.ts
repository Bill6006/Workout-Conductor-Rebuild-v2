/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

/** Injected at build time by vite.config.ts. Shown in the UI as the build marker. */
declare const __BUILD_ID__: string;
/** ISO timestamp of the build. */
declare const __BUILD_TIME__: string;
/** Human-readable phase label for the deployed build. */
declare const __BUILD_PHASE__: string;
