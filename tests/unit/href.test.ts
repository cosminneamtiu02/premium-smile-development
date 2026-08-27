import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localeHref, stripLocale } from '../../src/i18n/href';

// THE URL shape, pinned in both directions: locale prefix · trailing slash ·
// the interim base path on the way OUT (localeHref), and the same prefix rule
// read backwards on the way IN (stripLocale, which turns the browser's
// '/ro/services/' back into the locale-less '/services/' the active-nav rule
// compares). Every internal link on the site is a plain <a href> whose string
// comes from this one module (§15.13), so each of those facts must break HERE
// first — which is what turns two small functions into a decision rather than a
// coincidence nobody dares touch.
//
// ── WHY THIS SUITE IS IN tests/unit/ AND NOT BESIDE THE MODULE (board §5·Q5).
// The base-path branch is the reason the file exists, and only the `unit`
// project (node) can flip an env var BETWEEN cases: the components project runs
// in real Chromium, where `process.env.PAGES_BASE_PATH` is replaced by a
// literal at build time (vitest.config.ts) and nothing can change it afterwards.
// The colocated precedent, lib/routes.test.ts, has no environment to flip.
//
// Fixtures are the site's own routes (§15.7: Romanian first) — the blog slug is
// a real one, so a future localized-slug decision (§15.3) lands on a case that
// already exists.

// The builder reads the variable at CALL time, so stubbing it per case is
// enough — no module reset, no dynamic import. CLEARING it first is what makes
// the suite independent of the machine it runs on: a developer who exported
// PAGES_BASE_PATH for a Pages-shaped local build (or a shell that kept it from
// `release.yml`'s production job) would otherwise see every unprefixed
// expectation below go red for a reason that has nothing to do with the code
// (G2 review D4). vi.stubEnv(…, undefined) DELETES the key rather than setting
// it to the string "undefined".
beforeEach(() => {
  vi.stubEnv('PAGES_BASE_PATH', undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('localeHref — the locale prefix and the trailing slash', () => {
  it("sends '/' to the locale home, which IS /{locale}/ (§5)", () => {
    // Home lives at /{locale} itself: there is no /ro/home to link to, so the
    // route part collapses to nothing and only the slash remains.
    expect(localeHref('ro', '/')).toBe('/ro/');
  });

  it('prefixes a top-level route and closes it with a slash', () => {
    // The slash is `trailingSlash: true` spelled out (next.config.ts): the
    // export writes out/ro/services/index.html, so this IS the canonical URL
    // and the visitor pays no redirect hop.
    expect(localeHref('ro', '/services')).toBe('/ro/services/');
  });

  it('carries a nested route through untouched', () => {
    expect(localeHref('ro', '/blog/coroane-ceramice')).toBe(
      '/ro/blog/coroane-ceramice/',
    );
  });

  it('never doubles a slash the caller already wrote', () => {
    // Callers pass lib/routes.ts rows today, but the builder is the site's
    // public URL API — a hand-written '/services/' must not produce '//'.
    expect(localeHref('ro', '/services/')).toBe('/ro/services/');
  });

  it('spells the same rule for every locale', () => {
    expect(localeHref('de', '/team')).toBe('/de/team/');
  });
});

describe('localeHref — a #fragment or a ?query stays at the very end', () => {
  // A URL can end in '#preturi' (jump to the element with id="preturi") or in
  // '?x=1'; both must survive as the LAST thing in the string. Appending the
  // trailing slash blindly put it INSIDE the fragment ('/ro/services#preturi/'),
  // a URL that matches no element and no file — invisible today because no
  // caller passes one, and waiting for the first in-content CTA ("see prices" →
  // the Services page's price anchor) to hit it silently (G2 review D2).
  it('closes the path BEFORE the fragment, never inside it', () => {
    expect(localeHref('ro', '/services#preturi')).toBe('/ro/services/#preturi');
  });

  it('closes the path BEFORE the query string', () => {
    expect(localeHref('ro', '/services?x=1')).toBe('/ro/services/?x=1');
  });

  it('keeps the locale home a locale home when only a fragment follows', () => {
    // '/#top' is the Footer's back-to-top target shape: the route part is still
    // empty, so this must read '/ro/' + '#top' and nothing else.
    expect(localeHref('ro', '/#top')).toBe('/ro/#top');
  });

  it('splits at the FIRST separator, so a query may carry its own fragment', () => {
    expect(localeHref('ro', '/services?x=1#preturi')).toBe(
      '/ro/services/?x=1#preturi',
    );
  });

  it('normalises the path part only — a written slash is still not doubled', () => {
    expect(localeHref('ro', '/services/#preturi')).toBe(
      '/ro/services/#preturi',
    );
  });

  it('still prefixes the base path in front of the whole thing', () => {
    vi.stubEnv('PAGES_BASE_PATH', '/premium-smile-development');

    expect(localeHref('ro', '/services#preturi')).toBe(
      '/premium-smile-development/ro/services/#preturi',
    );
  });
});

describe('localeHref — a path without its leading slash cannot compile (D6)', () => {
  it('rejects a slash-less path at the type level, never at runtime', () => {
    // The old signature took a plain `string`, so localeHref('ro', 'services')
    // compiled happily into '/roservices/' — a URL that resolves to nothing,
    // with no test anywhere able to see it. `path: `/${string}`` turns that
    // into a compile error, so the directive below IS this test's assertion —
    // there is nothing a runtime check could look at. Loosen the type and
    // `tsc --noEmit` fails here with "unused '@ts-expect-error' directive".
    // The call is never made.
    // @ts-expect-error — 'services' has no leading slash (§15.13, D6).
    const rejected = (): string => localeHref('ro', 'services');

    expect(rejected).toBeTypeOf('function');
  });
});

describe('localeHref — the interim GitHub Pages base path (§15.2)', () => {
  it('prefixes every URL when PAGES_BASE_PATH is set', () => {
    // The SAME variable next.config.ts feeds to Next's own `basePath`, so the
    // link prefix and the asset prefix cannot disagree.
    vi.stubEnv('PAGES_BASE_PATH', '/premium-smile-development');

    expect(localeHref('de', '/team')).toBe(
      '/premium-smile-development/de/team/',
    );
    expect(localeHref('ro', '/')).toBe('/premium-smile-development/ro/');
  });

  it('adds nothing when it is unset — the root-serving host (and the launch one)', () => {
    // beforeEach cleared it and the case above stubbed only its own run: this
    // case is what proves the read happens per call, not once at module load.
    // Were it hoisted to import time, the previous case would leak its prefix
    // into this one.
    expect(localeHref('de', '/team')).toBe('/de/team/');
  });
});

describe('stripLocale — the same prefix rule, read backwards (§15.13)', () => {
  // The other half of the URL API, and the reason src/i18n/navigation.ts no
  // longer asks next-intl for a hook: `localePrefix: 'always'` (routing.ts) is
  // spelled ONCE, here, for both directions — what localeHref puts on, this
  // takes off, so "where does this go" and "where am I" can never drift.
  it('sends the locale home back to the root, slash or no slash', () => {
    expect(stripLocale('/ro', 'ro')).toBe('/');
    expect(stripLocale('/ro/', 'ro')).toBe('/');
  });

  it('drops the prefix and keeps everything after it', () => {
    expect(stripLocale('/ro/services', 'ro')).toBe('/services');
    expect(stripLocale('/ro/blog/coroane-ceramice', 'ro')).toBe(
      '/blog/coroane-ceramice',
    );
  });

  it('preserves the trailing slash exactly as the browser wrote it', () => {
    // `trailingSlash: true` means a real address bar reads '/ro/services/', and
    // useNavItems' isActive matches a route plus its descendants — so the slash
    // must survive untouched rather than be normalised away here.
    expect(stripLocale('/ro/services/', 'ro')).toBe('/services/');
  });

  it('strips a whole SEGMENT, never a text prefix', () => {
    // The trap a naive startsWith walks into: '/robot' begins with '/ro'.
    expect(stripLocale('/robot', 'ro')).toBe('/robot');
    expect(stripLocale('/roman/dentist', 'ro')).toBe('/roman/dentist');
  });

  it('leaves a path that is not on this locale alone', () => {
    expect(stripLocale('/de/team/', 'ro')).toBe('/de/team/');
    expect(stripLocale('/', 'ro')).toBe('/');
  });

  it('undoes localeHref for every locale, down to the export trailing slash', () => {
    // Round trip: what a visitor's address bar holds after clicking a built
    // href, handed back as the locale-less shape the active rule compares.
    for (const locale of ['ro', 'de', 'it'] as const) {
      expect(stripLocale(`/${locale}/services/`, locale)).toBe('/services/');
      expect(stripLocale(`/${locale}/`, locale)).toBe('/');
    }
  });
});
