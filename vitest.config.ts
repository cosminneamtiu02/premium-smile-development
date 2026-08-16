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
