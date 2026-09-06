import { describe, expect, it } from 'vitest';
import { localeHref } from '@/i18n/href';
import { type Locale, locales } from '@/i18n/locales';
import ro from '@/messages/ro.json';
import {
  equivalentPath,
  matchesRoute,
  PRIMARY_ROUTES,
  primaryRoutes,
} from './routes';

// The route list moved OUT of sections/Header/useNavItems.ts when the Footer
// became its second consumer (§4's promotion rule: shared data climbs to a
// module both tiers may import, never a section importing another section).
// These tests pin the two facts the move must not change — the order, and the
// `ro`-only blog (§5) — so Header and Footer can never disagree about either.
//
// The two suites at the bottom arrived with the language-dial lane
// (2026-08-28), when the same promotion happened a second time: the ACTIVE-page
// rule climbed here as `matchesRoute` because sections/LanguageSwitcher needs
// it to answer "does this page exist in that language?" — and `equivalentPath`
// is that answer. `matchesRoute`'s rows are deliberately the old private
// `isActive`'s contract written out: this file is now the only place that rule
// is pinned, for BOTH consumers.
//
// Real message files, never invented fixtures (§17.4): the keys are asserted
// to RESOLVE, which is what stops a renamed key from silently rendering its
// own dotted path (next-intl's behaviour on a miss).

/** `ro.json`'s `common` namespace, walked by the dotted key the row carries. */
const resolve = (key: string): unknown =>
  key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      ro.common,
    );

describe('lib/routes — the ONE primary route list', () => {
  it('keeps the bar order: home · services · team · blog', () => {
    expect(PRIMARY_ROUTES.map((route) => route.path)).toEqual([
      '/',
      '/services',
      '/team',
      '/blog',
    ]);
  });

  it('carries locale-less PATHS — localeHref() builds the href from them (§15.13)', () => {
    for (const route of PRIMARY_ROUTES) {
      expect(route.path.startsWith('/')).toBe(true);
      expect(route.path).not.toMatch(/^\/(ro|en|de|fr|it)(\/|$)/);
    }
  });

  it('names keys that EXIST in the common namespace', () => {
    for (const route of PRIMARY_ROUTES) {
      expect(route.key.startsWith('nav.')).toBe(true);
      expect(typeof resolve(route.key)).toBe('string');
    }
  });

  it('writes every row WITHOUT a trailing slash — matchesRoute depends on it', () => {
    // The rule lives in matchesRoute's descendant clause: it tests
    // `pathname.startsWith(`${path}/`)`, so a row copied out of an address bar
    // as '/blog/' would search for '/blog//…' and match nothing. The damage is
    // silent and split across two consumers — the Header's underline vanishes
    // on every post, and equivalentPath stops seeing posts as Romanian-only, so
    // the language dial offers four links to pages that were never generated.
    // localeHref trims the slash on the URL side, so nothing else complains.
    for (const route of PRIMARY_ROUTES) {
      expect(route.path === '/' || !route.path.endsWith('/')).toBe(true);
    }
  });

  it('scopes exactly one row to a locale — the blog, to `ro`', () => {
    const scoped = PRIMARY_ROUTES.filter((route) => route.locale !== undefined);
    expect(scoped.map((route) => route.path)).toEqual(['/blog']);
    expect(scoped[0]?.locale).toBe('ro');
  });
});

describe('lib/routes — primaryRoutes(locale) filters the ro-only blog (§5)', () => {
  it('offers all four routes on `ro`', () => {
    expect(primaryRoutes('ro').map((route) => route.path)).toEqual([
      '/',
      '/services',
      '/team',
      '/blog',
    ]);
  });

  it.each(locales.filter((locale) => locale !== 'ro'))(
    'drops /blog on `%s` — the blog exists in Romanian only',
    (locale: Locale) => {
      const paths = primaryRoutes(locale).map((route) => route.path);
      expect(paths).toEqual(['/', '/services', '/team']);
      expect(paths).not.toContain('/blog');
    },
  );

  it('returns the rows themselves, in list order, never a copy that can drift', () => {
    // Same objects, same order: the filter is the ONLY transformation, so a
    // consumer reading `key` gets exactly what the list declares.
    expect(primaryRoutes('ro')).toEqual([...PRIMARY_ROUTES]);
  });

  it('is pure — calling it twice hands back equal lists', () => {
    expect(primaryRoutes('de')).toEqual(primaryRoutes('de'));
  });
});

describe('lib/routes — matchesRoute: the ACTIVE-page rule, lifted (rule of two)', () => {
  // Parity with the `isActive` this replaced (sections/Header/useNavItems.ts,
  // now a caller): the Header's underline and the LanguageSwitcher's
  // "does this page exist over there?" must answer the same question the same
  // way, forever. These rows ARE that former function's contract.

  it('matches "/" EXACTLY — the trap every naive prefix match falls into', () => {
    // Every path starts with a slash, so startsWith('/') is true everywhere and
    // Home would light up on every page of the site.
    expect(matchesRoute('/', '/')).toBe(true);
    expect(matchesRoute('/services/', '/')).toBe(false);
    expect(matchesRoute('/robot', '/')).toBe(false);
  });

  it('matches a section by its own path, with or without the trailing slash', () => {
    // `trailingSlash: true` (§3) means a real address bar reads '/services/';
    // the row in PRIMARY_ROUTES is written '/services'. Both are the same page.
    expect(matchesRoute('/services', '/services')).toBe(true);
    expect(matchesRoute('/services/', '/services')).toBe(true);
  });

  it('matches DESCENDANTS — /blog/<slug> reports as Blog, the section', () => {
    expect(matchesRoute('/blog/some-post/', '/blog')).toBe(true);
    expect(matchesRoute('/services/x/', '/services')).toBe(true);
  });

  it('never matches a SEGMENT-less prefix — /servicesx is a different page', () => {
    // The slash in the descendant test is the whole point: without it,
    // '/servicesx' would report as Servicii and switch languages as if it were.
    expect(matchesRoute('/servicesx', '/services')).toBe(false);
    expect(matchesRoute('/servicesx/', '/services')).toBe(false);
  });
});

describe('lib/routes — equivalentPath: the same page over there, else home (§5)', () => {
  const targets = locales.filter((locale) => locale !== 'ro');

  it.each(locales)('keeps /services/ on %s — every locale has it', (locale) => {
    expect(equivalentPath('/services/', locale)).toBe('/services/');
  });

  it.each(locales)('keeps the locale home on %s', (locale) => {
    expect(equivalentPath('/', locale)).toBe('/');
  });

  it.each(locales)('keeps /team on %s', (locale) => {
    expect(equivalentPath('/team', locale)).toBe('/team');
  });

  it.each(targets)(
    'sends the blog INDEX to the home page on %s — /de/blog is never generated',
    (locale) => {
      expect(equivalentPath('/blog/', locale)).toBe('/');
    },
  );

  it.each(targets)('sends a blog POST to the home page on %s', (locale) => {
    // The section rule doing its work: the article is under /blog, so it is
    // ro-only too. matchesRoute is what knows that.
    expect(equivalentPath('/blog/some-post/', locale)).toBe('/');
  });

  it('leaves the blog alone on `ro`, where it exists', () => {
    expect(equivalentPath('/blog/', 'ro')).toBe('/blog/');
    expect(equivalentPath('/blog/some-post/', 'ro')).toBe('/blog/some-post/');
  });

  it.each(locales)(
    'keeps a path the route list has never heard of, on %s — not a whitelist',
    (locale) => {
      // The §12 privacy page, a 404, any page added before its row: read as a
      // whitelist this function would silently send all four alternates home
      // and nothing would fail. Only a route scoped to ANOTHER locale is
      // missing over there.
      expect(equivalentPath('/privacy/', locale)).toBe('/privacy/');
    },
  );

  it("never returns a locale-PREFIXED path — that is localeHref's job", () => {
    for (const locale of locales) {
      expect(equivalentPath('/services/', locale)).not.toMatch(
        /^\/(ro|en|de|fr|it)(\/|$)/,
      );
    }
  });

  it('composes with localeHref into the strings the discs actually print', () => {
    // The one assertion that reads like the DOM: this pair is what
    // useLanguageOptions puts in each disc's href (basePath is '' in this
    // runner, pinned by vitest.config define).
    expect(localeHref('de', equivalentPath('/services/', 'de'))).toBe(
      '/de/services/',
    );
    expect(localeHref('de', equivalentPath('/blog/some-post/', 'de'))).toBe(
      '/de/',
    );
    expect(localeHref('ro', equivalentPath('/blog/some-post/', 'ro'))).toBe(
      '/ro/blog/some-post/',
    );
  });

  it('is pure — the same question twice gives the same answer', () => {
    expect(equivalentPath('/team/', 'fr')).toBe(equivalentPath('/team/', 'fr'));
  });
});
