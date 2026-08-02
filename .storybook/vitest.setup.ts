import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { setProjectAnnotations } from '@storybook/nextjs-vite';
import { beforeAll } from 'vitest';
import * as projectAnnotations from './preview';

// Wires every story into vitest browser mode with the same decorators/globals
// as the Storybook UI — including the a11y addon, whose violations FAIL here
// (parameters.a11y.test = 'error', §13). NOTE: Storybook prints a hint that
// this file is removable since 10.3 — empirically FALSE in this three-project
// setup: without it the storybook project collects zero story tests.
const annotations = setProjectAnnotations([
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(annotations.beforeAll);
