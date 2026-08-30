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
// ── AND THE ACTIVE-PAGE RULE FOLLOWED IT (language-dial lane, 2026-08-28).
// This paragraph used to read "what deliberately did NOT move: the ACTIVE-page
// rule", on the argument that marking "you are here" needs the router, i.e.
// client code, and that only the Header did it — so `isActive` stayed in
// sections/Header/useNavItems.ts beside its one consumer. The second consumer
// arrived: sections/LanguageSwitcher must decide whether the page you are
// standing on even EXISTS in the language you are picking, and "/blog/<slug>
// is under /blog" is the very same section-match question the nav asks (design
// board .claude/plans/language-dial.plan.md §4, D-item list; §5's rule that a
// blog page switches to the target locale's home). Rule of two, and the same
// §4 reasoning as the list itself: a section may not reach into ANOTHER
// section's INTERNALS — its hooks, its private helpers, its data modules —
// which is exactly what `import { isActive } from '../Header/useNavItems'`
// would have been. (COMPOSING a child section's component is a different act
// and is the dossier model: Header renders Wordmark, FloatingActions renders
// LanguageSwitcher. Rendering a public component is what sections are for;
// borrowing a neighbour's plumbing is what §4 forbids.) So the shared rule
// climbs here, to a module every tier may import, as `matchesRoute`.
//
// The old objection survives intact, because it was never about the matching:
// the ROUTER stayed behind. Comparing two paths is pure; only ASKING "where am
// I?" is client code, and that is still the consumers' own hook
// (@/i18n/navigation's usePathname). Nothing in this module touches React —
// which is exactly why both a client island and a Server Component may call it.
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
   * The locale-less PATH, and deliberately not called an href: nothing prints
   * this string. Both halves of src/i18n/href.ts consume it — localeHref()
   * builds the final URL out of it (locale prefix, trailing slash, interim base
   * path), and the Header's active rule compares it against the same module's
   * locale-stripped pathname. '/' is the locale home: /ro, /de, … (§5: home
   * lives at /{locale} itself, there is no /{locale}/home).
   *
   * Typed `/${string}` rather than `string` so a row that loses its leading
   * slash fails to compile instead of shipping '/roservices/'.
   */
  readonly path: `/${string}`;
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
  { path: '/', key: 'nav.home' },
  { path: '/services', key: 'nav.services' },
  { path: '/team', key: 'nav.team' },
  // The blog exists in Romanian only (§5): /de/blog is never generated, so it
  // must never be offered either — in the bar, the panel or the footer.
  { path: '/blog', key: 'nav.blog', locale: 'ro' },
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

/**
 * Section-scoped, NOT prefix matching for '/': every path starts with a slash,
 * so a naive startsWith would light Home up on every page. Everything else
 * matches its own path plus its descendants, which is what makes /blog/<slug>
 * report as Blog — the section, not the article, is what the nav names, and
 * what "does this page exist over there?" is asked about.
 *
 * Lifted out of useNavItems' private `isActive` unchanged in behaviour (that
 * hook now calls this), so the Header's underline and the LanguageSwitcher's
 * hrefs can never disagree about where a page belongs.
 *
 * Both sides are `/${string}`. The pathname arrives locale-STRIPPED from
 * @/i18n/navigation's usePathname ('/ro/services/' → '/services/') and the
 * route side is PrimaryRoute['path']; the trailing slash a real address bar
 * carries is absorbed by the descendant clause rather than normalised away.
 *
 * THE ROW SIDE MUST CARRY NO TRAILING SLASH — only the pathname side may. The
 * descendant clause tests `${path}/`, so a row written '/blog/' (the shape an
 * address bar hands you) would look for '/blog//…' and match nothing: every
 * blog post would lose its Header underline AND, worse, `equivalentPath` would
 * stop recognising posts as ro-only and hand four 404 links to the switcher.
 * Nothing else would fail — localeHref strips the row's slash on the URL side —
 * so the shape is pinned by a test in routes.test.ts rather than normalised
 * here: this function is a zero-behaviour-change lift of the Header's old
 * `isActive`, and quietly accepting a second row shape would be a change.
 */
export function matchesRoute(
  pathname: `/${string}`,
  path: `/${string}`,
): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * "The same page if it exists on `target`, else the locale home" — §5's
 * language-switcher rule, as a pure function: the switcher navigates to the
 * EQUIVALENT path under the target locale prefix, and blog pages switch to the
 * target locale's home because no equivalent exists there.
 *
 * A pathname under a route scoped to a DIFFERENT locale has no twin — today
 * that is exactly /blog and everything below it, generated for `ro` only — so
 * a foreign disc points at '/'. Everything ELSE keeps its path, including
 * paths this list has never heard of (the §12 privacy page, a 404): the list
 * is not a whitelist. Read the other way round it would be a trap — every page
 * added before its row is added here would silently send all four alternates
 * to the home page, and nothing would fail.
 *
 * Returns the LOCALE-LESS path, never a finished URL: localeHref(target, …)
 * puts the prefix, the trailing slash and the interim base path on (§15.13).
 * `target: string` because that is what useLocale() hands back — the
 * primaryRoutes(locale) precedent, one line above; the Locale union does its
 * work on the DATA side, in PrimaryRoute['locale'].
 */
export function equivalentPath(
  pathname: `/${string}`,
  target: string,
): `/${string}` {
  const missing = PRIMARY_ROUTES.some(
    (route) =>
      route.locale !== undefined &&
      route.locale !== target &&
      matchesRoute(pathname, route.path),
  );
  return missing ? '/' : pathname;
}
