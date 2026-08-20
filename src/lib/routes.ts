import type { Locale } from '../i18n/locales';

// THE site's primary route list — pure data, no React, no 'use client', so
// every tier can reach it: the Header's client islands (bar row + dropdown
// panel) and the Footer's Server Component alike.
//
// ── WHY IT LIVES HERE AND NOT IN THE HEADER (the §4 promotion moment).
// It was born inside HeaderNav.tsx, then moved to sections/Header/useNavItems
// when the panel became a second consumer. The Footer is the THIRD, and it sits
// in a different section — so keeping the list under sections/Header would make
// one section import another section's internals, against §4's dependency
// direction (app → sections → ui). Shared DATA belongs in lib/, beside
// clinic.ts, which is exactly the same kind of module: the single source of a
// fact the whole site repeats.
//
// What deliberately did NOT move: the ACTIVE-page rule. Marking "you are here"
// needs the router, i.e. client code, and only the Header does it — so
// `isActive` stayed in sections/Header/useNavItems.ts where its one consumer
// is. This module is the route list and nothing else.
//
// §8.1 holds: the rows carry message KEYS, never text. Whoever renders them
// calls t() in the section tier; nothing here ever sees a translation.

/**
 * The message keys these routes carry, spelled out as a union rather than as
 * `string`: a typo then fails at compile time, and t(route.key) keeps a literal
 * type for the day the messages themselves are typed.
 */
export type PrimaryRouteKey =
  'nav.home' | 'nav.services' | 'nav.team' | 'nav.blog';

export interface PrimaryRoute {
  /**
   * Locale-less href — <Link> adds the /{locale} prefix (localePrefix:
   * 'always', §5). '/' is the locale home: /ro, /de, … (§5: home lives at
   * /{locale} itself, there is no /{locale}/home).
   */
  readonly href: string;
  /** Key under the `common` namespace, resolved by the tier that calls t(). */
  readonly key: PrimaryRouteKey;
  /**
   * Present ⇒ the route EXISTS on that locale only, and is offered nowhere
   * else. Typed against the Locale union so a locale rename cannot leave a
   * dead string behind (the rule the Header used to spell as BLOG_LOCALE).
   */
  readonly locale?: Locale;
}

/**
 * The routes in bar order — the order the Header's row, the Header's panel and
 * the Footer's link column all render.
 */
export const PRIMARY_ROUTES: readonly PrimaryRoute[] = [
  { href: '/', key: 'nav.home' },
  { href: '/services', key: 'nav.services' },
  { href: '/team', key: 'nav.team' },
  // The blog exists in Romanian only (§5): /de/blog is never generated, so it
  // must never be offered either — in the bar, the panel or the footer.
  { href: '/blog', key: 'nav.blog', locale: 'ro' },
];

/**
 * The routes this locale actually has: the full list minus every row scoped to
 * a different locale.
 *
 * Takes a plain `string` because that is what next-intl's `useLocale()` hands
 * back under the default config — the Locale union does its work on the DATA
 * side (the `locale` field above), where a rename must not go unnoticed.
 */
export function primaryRoutes(locale: string): readonly PrimaryRoute[] {
  return PRIMARY_ROUTES.filter(
    (route) => route.locale === undefined || route.locale === locale,
  );
}
