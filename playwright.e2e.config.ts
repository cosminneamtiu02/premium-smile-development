import { defineConfig } from '@playwright/test';

// THE e2e harness (price-menu-pin lane, 2026-09-18): Playwright driving the
// BUILT static export in `out/` — the real pages, the real eleven-category
// price menu, the real header pill — at window geometries the site is used
// in rather than the six sampling points the visual net photographs
// (tests/viewports.ts). It is a separate config, not a project inside
// playwright.config.ts, for one reason: that file's `webServer` serves
// storybook-static, and a second server there would make `npm run visual`
// refuse to start whenever `out/` is not built — a new precondition on the
// commit ritual that no pixel test needs. Nothing here takes screenshots and
// nothing here writes a baseline; the assertions are geometry and DOM.
//
// The two geometries are the two ends of the price menu's story: 1366×633 is
// a 1366×768 laptop with its browser chrome subtracted, the smallest usable
// height the owner's table names and the one where the menu is taller than
// the window by the widest margin; 1920×945 is a 1080p desktop at 100%, the
// one row of that table where the menu FITS — the plain-sticky parity check.
//
// Run: `npm run build` first (the server refuses to start on an unbuilt
// tree), then `npm run e2e`.

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],

  use: {
    baseURL: 'http://127.0.0.1:6117',
    deviceScaleFactor: 1,
  },

  projects: [
    {
      name: 'laptop-1366x633',
      use: { viewport: { width: 1366, height: 633 } },
    },
    {
      name: 'desktop-1920x945',
      use: { viewport: { width: 1920, height: 945 } },
    },
  ],

  webServer: {
    // Serves the BUILT export — zero extra dependencies, the same engine as
    // the visual suite's Storybook server (tools/serve-static.mjs).
    command: 'node tools/serve-export.mjs 6117',
    url: 'http://127.0.0.1:6117/ro/services/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
