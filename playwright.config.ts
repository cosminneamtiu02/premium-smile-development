import { defineConfig } from '@playwright/test';
import { VIEWPORTS } from './tests/viewports';

// Visual-regression harness (brief §3, §13): one project per named viewport
// width (§7) — the central spec routes stories to widths by title prefix.
// Snapshots are platform-suffixed (…-darwin.png / …-linux.png): the darwin set
// is generated natively on the workstation, the linux set ONLY by
// visual-baseline.yml inside the pinned container (§15.7). The sets never mix.
//
// The six geometries themselves come from tests/viewports.ts, the ONE spelling
// this file and .storybook/preview.tsx both derive from (org-review F13a) —
// they used to be hand-maintained in both places.

export default defineConfig({
  testDir: 'tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['html', { open: 'never' }]],

  snapshotPathTemplate:
    '{testDir}/__screenshots__/{arg}-{projectName}-{platform}{ext}',

  expect: {
    toHaveScreenshot: {
      // Animations are disabled in snapshots (§13).
      animations: 'disabled',
      caret: 'hide',
    },
  },

  use: {
    baseURL: 'http://127.0.0.1:6116',
    deviceScaleFactor: 1,
  },

  // `w${width}` reproduces today's project names exactly — w320 … w1920 — and
  // that is a hard constraint, not a formatting choice: snapshotPathTemplate
  // above bakes {projectName} into every baseline FILENAME
  // (…-w1280-darwin.png), so a renamed project orphans every existing baseline
  // at once (169 at the time of writing) and the suite reports missing
  // baselines rather than a diff. The derivation may never change the shape of
  // this string.
  projects: VIEWPORTS.map(({ width, height }) => ({
    name: `w${width}`,
    use: { viewport: { width, height } },
  })),

  webServer: {
    // Serves the BUILT Storybook (§3) — zero extra dependencies.
    command: 'node tools/serve-storybook.mjs 6116',
    url: 'http://127.0.0.1:6116/index.json',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
