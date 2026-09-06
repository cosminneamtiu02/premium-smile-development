import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// THE ROOT-PARAMS RESOLUTION GUARD (§15.16 Phase C; G2 react-reviewer MEDIUM,
// 2026-09-06). src/i18n/request.ts cannot be imported executably here:
// 'next/root-params' ships as a compiler-replaced placeholder that throws
// under any runner but `next build` — so, like shell.test.tsx's layout.tsx
// pin, this guard reads the SOURCE as text. What it pins is the one deliberate
// divergence from the migration blog's recipe, proven load-bearing by the
// Phase-C S1 probe: an explicit locale (getTranslations({locale}) — the
// layout's D6 banner block resolves ALL FIVE locales' strings on every page)
// must win over the [locale] segment. The blog's plain
// `await rootParams.locale()` keeps every other gate green while silently
// collapsing the banner's five languages into the page's own — vitest feeds
// LanguageBanner its strings as props, so only the built flight payload ever
// shows the rot. KEEP-IN-SYNC with the mirror comment in src/i18n/request.ts
// (§6.6 — the same resolution, changed in one edit or not at all).

const requestSource = readFileSync(
  fileURLToPath(new URL('../../src/i18n/request.ts', import.meta.url)),
  'utf8',
);

describe('i18n/request.ts locale resolution (source guard)', () => {
  it('honors an explicit locale before falling back to the root param', () => {
    expect(requestSource).toContain(
      'explicitLocale ?? (await rootParams.locale())',
    );
  });

  it('receives the explicit locale via the non-deprecated `locale` param', () => {
    expect(requestSource).toContain('async ({ locale: explicitLocale })');
  });

  it('never reads the deprecated requestLocale input', () => {
    // The word may appear in prose comments; the DESTRUCTURED input is the
    // deprecated API surface this migration retired.
    expect(requestSource).not.toMatch(/\{\s*requestLocale/);
  });
});
