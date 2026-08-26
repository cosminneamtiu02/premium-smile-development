import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Three projects, one runner (§3):
//  · unit       — node env: pure logic + the translation-parity gate (§13)
//  · components — real chromium: colocated interaction tests (Testing Library,
//                 role-based queries — §9 enforcement by construction)
//  · storybook  — real chromium: every story renders, its play function runs,
//                 and axe a11y violations fail the run
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        // Plain Vite does not read tsconfig "paths" — mirror the repo's `@/*`
        // alias here so components tests resolve like tsc/eslint/Storybook do
        // (every @/assets/glyphs and @/components import in tests needs it).
        resolve: {
          alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
        },
        // Real Chromium has no `process` object: a module that reads
        // process.env there dies with a ReferenceError before the test starts
        // (probed 2026-08-24 — NavMenu's process.env.NODE_ENV only survives
        // because Vite special-cases that one key). `define` is what supplies
        // one. It does NOT text-replace in the unbundled dev graph this browser
        // runner serves; Vite 8 satisfies the definition by installing a
        // synthetic `process` global carrying exactly the keys named here — so
        // process.env.PAGES_BASE_PATH reads as '' and any OTHER process.env.X
        // read comes back undefined instead of crashing the module.
        //
        // Pinned to '' rather than passed through from the shell: these tests
        // assert the root-serving URL shape, and a developer who had exported
        // PAGES_BASE_PATH for a Pages-shaped local build would otherwise turn
        // Header.test.tsx red for a reason that is not in the code (G2 D4). The
        // prefixed branch belongs to tests/unit/href.test.ts, the one project
        // that can flip an env var between cases.
        define: {
          'process.env.PAGES_BASE_PATH': JSON.stringify(''),
        },
        test: {
          name: 'components',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['tests/setup/components.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        plugins: [storybookTest({ configDir: '.storybook' })],
        test: {
          name: 'storybook',
          setupFiles: ['.storybook/vitest.setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
