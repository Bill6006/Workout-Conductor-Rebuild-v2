/**
 * Test stub for `virtual:pwa-register/react`.
 *
 * The virtual module only exists inside a vite-plugin-pwa build, so unit tests
 * alias it here. Keep the shape identical to the real hook.
 */
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (value: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (value: boolean) => void],
    updateServiceWorker: async (_reload?: boolean) => {},
  };
}
