import type { StorybookConfig } from '@storybook/nextjs-vite';

// THE ROOT-HOSTED SHAPE, ALWAYS (pages-base-path lane, 2026-10-03). The
// framework reads next.config.ts, whose `env` inlines PAGES_BASE_PATH into the
// bundle — and since ui/Image, the Wordmark and the Footer's badge put that
// prefix on their pictures (lib/base-path), a shell that still has the
// variable exported from a Pages-shaped `npm run build` would build a
// Storybook whose every picture 404s (Storybook serves public/ at its root),
// and `npm run visual:update` would record those broken frames. Removed here,
// before next.config.ts is ever loaded — the vitest.config.ts `define` pin of
// the components project, for the same reason (its G2 D4 note). The Pages
// shape is the export's, never the workbench's.
delete process.env.PAGES_BASE_PATH;

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    // axe checks rendered per story; violations fail CI via the vitest addon (§13)
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  // src/fonts is served so preview-fonts.css can @font-face the same committed
  // woff2 files next/font uses in the real build (see preview-fonts.css).
  staticDirs: ['../public', '../src/fonts'],
};

export default config;
