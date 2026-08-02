import { defineConfig } from '@playwright/test';

// Visual-regression harness (brief §3, §13): one project per named viewport
// width (§7) — the central spec routes stories to widths by title prefix.
// Snapshots are platform-suffixed (…-darwin.png / …-linux.png): the darwin set
// is generated natively on the workstation, the linux set ONLY by
// visual-baseline.yml inside the pinned container (§15.7). The sets never mix.
const WIDTHS = [
  { name: 'w320', width: 320, height: 568 },
  { name: 'w390', width: 390, height: 844 },
  { name: 'w768', width: 768, height: 1024 },
  { name: 'w1280', width: 1280, height: 800 },
  { name: 'w1536', width: 1536, height: 864 },
  { name: 'w1920', width: 1920, height: 1080 },
];

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

  projects: WIDTHS.map(({ name, width, height }) => ({
    name,
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
