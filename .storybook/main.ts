import type { StorybookConfig } from '@storybook/nextjs-vite';

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
