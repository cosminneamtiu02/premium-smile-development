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
  // Every internal link is a plain <a href={localeHref(locale, path)}> and every
  // navigation is a full document load (brief §15.13). Layer 1 of that decision
  // is src/i18n/navigation.ts exporting nothing else; this is layer 2, because
  // a module boundary cannot stop someone importing next/link directly.
  {
    name: 'navigation/full-document-only',
    rules: {
      // Next's own rule tells the author of a literal internal <a href="/de/">
      // to reach for next/link — the exact move §15.13 forbids, and this repo
      // has no pages/ directory for it to be right about in the first place.
      '@next/next/no-html-link-for-pages': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/link',
              message:
                'Internal links are plain <a href={localeHref(locale, path)}> — every navigation is a full document load (brief §15.13).',
            },
            {
              // `notFound` stays allowed: it is a build-time signal, not a
              // navigation.
              name: 'next/navigation',
              importNames: [
                'useRouter',
                'redirect',
                'permanentRedirect',
                'usePathname',
              ],
              message:
                'No client-side navigation (§15.13). For the current path use usePathname from @/i18n/navigation.',
            },
            {
              // Nothing imports this any more (D9 replaced createNavigation
              // with our own three-line usePathname) — the entry stays as a
              // tripwire, so reaching back for the family fails at lint.
              name: 'next-intl/navigation',
              message:
                'next-intl navigation is not used at all (§15.13, D9): the current path comes from usePathname in @/i18n/navigation, and links from localeHref in @/i18n/href.',
            },
          ],
        },
      ],
    },
  },
  // The one module allowed to reach for the primitive it wraps: since D9
  // src/i18n/navigation.ts calls next/navigation's usePathname itself, three
  // lines of its own rather than next-intl's createNavigation family (which
  // dragged next/link into the Header island as dead code).
  {
    name: 'navigation/full-document-only/boundary-module',
    files: ['src/i18n/navigation.ts'],
    rules: { 'no-restricted-imports': 'off' },
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
