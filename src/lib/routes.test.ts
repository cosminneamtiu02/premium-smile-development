import { describe, expect, it } from 'vitest';
import { type Locale, locales } from '@/i18n/locales';
import ro from '@/messages/ro.json';
import { PRIMARY_ROUTES, primaryRoutes } from './routes';

// The route list moved OUT of sections/Header/useNavItems.ts when the Footer
// became its second consumer (§4's promotion rule: shared data climbs to a
// module both tiers may import, never a section importing another section).
// These tests pin the two facts the move must not change — the order, and the
// `ro`-only blog (§5) — so Header and Footer can never disagree about either.
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
    expect(PRIMARY_ROUTES.map((route) => route.href)).toEqual([
      '/',
      '/services',
      '/team',
      '/blog',
    ]);
  });

  it('carries locale-less hrefs — <Link> adds the /{locale} prefix (§5)', () => {
    for (const route of PRIMARY_ROUTES) {
      expect(route.href.startsWith('/')).toBe(true);
      expect(route.href).not.toMatch(/^\/(ro|en|de|fr|it)(\/|$)/);
    }
  });

  it('names keys that EXIST in the common namespace', () => {
    for (const route of PRIMARY_ROUTES) {
      expect(route.key.startsWith('nav.')).toBe(true);
      expect(typeof resolve(route.key)).toBe('string');
    }
  });

  it('scopes exactly one row to a locale — the blog, to `ro`', () => {
    const scoped = PRIMARY_ROUTES.filter((route) => route.locale !== undefined);
    expect(scoped.map((route) => route.href)).toEqual(['/blog']);
    expect(scoped[0]?.locale).toBe('ro');
  });
});

describe('lib/routes — primaryRoutes(locale) filters the ro-only blog (§5)', () => {
  it('offers all four routes on `ro`', () => {
    expect(primaryRoutes('ro').map((route) => route.href)).toEqual([
      '/',
      '/services',
      '/team',
      '/blog',
    ]);
  });

  it.each(locales.filter((locale) => locale !== 'ro'))(
    'drops /blog on `%s` — the blog exists in Romanian only',
    (locale: Locale) => {
      const hrefs = primaryRoutes(locale).map((route) => route.href);
      expect(hrefs).toEqual(['/', '/services', '/team']);
      expect(hrefs).not.toContain('/blog');
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
