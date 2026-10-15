import { describe, expect, it } from 'vitest';
import ro from '@/messages/ro.json';
import {
  LEGAL_ROUTES,
  matchesRoute,
  PRIMARY_ROUTES,
  PRIVACY_PATH,
} from './routes';

// The route list moved OUT of sections/Header/useNavItems.ts when the Footer
// became its second consumer (§4's promotion rule: shared data climbs to a
// module both tiers may import, never a section importing another section).
// These tests pin what the move must not change — the order, the paths and
// the keys — so Header and Footer can never disagree about them. The list is
// the same four rows in every language since the blog joined all five
// (2026-10-14), when the per-locale scope that had kept the blog Romanian-only
// was deleted (routes.ts' AND THE PER-LOCALE HALF LEFT); what every language
// renders is pinned where it is rendered (Header.test.tsx, Footer.test.tsx).
//
// The ACTIVE-page rule climbed here as `matchesRoute` with the language-dial
// lane (2026-08-28), when sections/LanguageSwitcher needed it too; its rows
// below are deliberately the old private `isActive`'s contract written out —
// this file is the only place that rule is pinned.
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
    // silent — the Header's underline vanishes on every page under the row, a
    // later page of the blog's list or an article — and localeHref trims the
    // slash on the URL side, so nothing else complains.
    for (const route of PRIMARY_ROUTES) {
      expect(route.path === '/' || !route.path.endsWith('/')).toBe(true);
    }
  });
});

describe('lib/routes — matchesRoute: the ACTIVE-page rule, the Header’s old isActive lifted', () => {
  // Parity with the `isActive` this replaced (sections/Header/useNavItems.ts,
  // its caller): the Header's underline must answer the same question the same
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

  it("matches every page of the blog's list as Blog — page 1 and page n (§15.39)", () => {
    // The list's later pages live UNDER the section (/ro/blog/page/2/), so the
    // descendant clause is what marks „Blog" there too — the bar's one item
    // for the whole archive, never a second entry per page.
    expect(matchesRoute('/blog/', '/blog')).toBe(true);
    expect(matchesRoute('/blog/page/2/', '/blog')).toBe(true);
    expect(matchesRoute('/blog/page/12/', '/blog')).toBe(true);
    expect(matchesRoute('/blogroll/', '/blog')).toBe(false);
  });

  it('never matches a SEGMENT-less prefix — /servicesx is a different page', () => {
    // The slash in the descendant test is the whole point: without it,
    // '/servicesx' would report as Servicii, its underline and all.
    expect(matchesRoute('/servicesx', '/services')).toBe(false);
    expect(matchesRoute('/servicesx/', '/services')).toBe(false);
  });
});

describe('lib/routes — LEGAL_ROUTES, the legal strip’s own list (nav board R1, fb-181)', () => {
  it('offers the privacy and cookie policy, at PRIVACY_PATH, under a key that resolves', () => {
    expect(LEGAL_ROUTES.map((route) => route.path)).toEqual([PRIVACY_PATH]);
    for (const route of LEGAL_ROUTES) {
      expect(typeof resolve(route.key), route.key).toBe('string');
    }
  });

  it('shares no row with PRIMARY_ROUTES — a legal link never joins the nav', () => {
    const primary = new Set(PRIMARY_ROUTES.map((route) => route.path));
    for (const route of LEGAL_ROUTES)
      expect(primary.has(route.path)).toBe(false);
  });

  it('writes every row WITHOUT a trailing slash — the PrimaryRoute contract', () => {
    for (const route of LEGAL_ROUTES) expect(route.path).not.toMatch(/.\/$/);
  });
});
