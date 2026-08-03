import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// ESLint 9.x — owner-approved fallback from the locked 10.x (brief §15.11,
// 2026-08-02): the React lint ecosystem (eslint-plugin-react ≤^9.7 peer,
// eslint-config-next) does not support ESLint 10 yet. Revisit deliberately.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Full jsx-a11y recommended RULES on top of Next's subset: write-time WCAG
  // enforcement is a locked gate (brief §3, §9) — no div-as-button, required
  // alt, … . Rules only: eslint-config-next already registers the plugin
  // instance, and flat config forbids registering it twice.
  {
    name: 'jsx-a11y/full-recommended-rules',
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  // Map design-system wrappers to the native element they render so jsx-a11y
  // rules also inspect their call sites (G2 review, Button migration).
  {
    name: 'jsx-a11y/component-mapping',
    settings: { 'jsx-a11y': { components: { Button: 'button' } } },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'storybook-static/**',
    'playwright-report/**',
    'test-results/**',
    'public/**',
  ]),
]);
