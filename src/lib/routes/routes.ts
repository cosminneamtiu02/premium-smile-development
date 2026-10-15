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
// `isActive` was born in sections/Header/useNavItems.ts beside its one
// consumer — marking "you are here" needs the router, i.e. client code, and
// only the Header did it. Then a second consumer arrived: sections/
// LanguageSwitcher had to decide whether the page you stand on EXISTS in the
// language you pick, and "/blog/<slug> is under /blog" was the very same
// section-match question (design board .claude/plans/language-dial.plan.md §4;
// §5's rule then, that a Romanian-only blog page switches to the target
// locale's home). Rule of two, and the same §4 reasoning as the list itself: a
// section may not reach into ANOTHER section's INTERNALS — its hooks, its
// private helpers, its data modules — which is exactly what
// `import { isActive } from '../Header/useNavItems'` would have been. So the
// shared rule climbed here as `matchesRoute`.
//
// ── AND THE PER-LOCALE HALF LEFT (2026-10-14). That second consumer went with
// the one row that ever needed it: the blog joined every language (the owner:
// "internationalise and add that blog on eveyer language" — CLAUDE.md §15.39
// round 3), so no page exists in one language only. What served such a page
// could no longer do anything and was deleted, on the owner's standing "no
// dead code": a row's `locale` scope, the filter that offered a scoped row on
// its own locale alone (`primaryRoutes`), `equivalentPath`, which sent the
// switcher's other languages home from such a row, and the language banner's
// refusal to offer it. The switcher and the banner put the visitor's own path
// under the other prefix now (`localeHref`); a page that exists in one
// language only would bring the scope back. The match rule stays HERE, beside
// the list whose paths its caller hands it — it reads no list itself — pure
// and pinned in routes.test.ts, the Header's useNavItems its one caller.
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
}

/**
 * The routes in bar order — the order the Header's row, the Header's panel and
 * the Footer's link column all render, the same four in every language.
 */
export const PRIMARY_ROUTES: readonly PrimaryRoute[] = [
  { path: '/', key: 'nav.home' },
  { path: '/services', key: 'nav.services' },
  { path: '/team', key: 'nav.team' },
  // The blog exists in EVERY language since 2026-10-14 (the owner:
  // "internationalise and add that blog on eveyer language" — CLAUDE.md
  // §15.39 round 3), so „Blog" is in every language's bar, phone panel and
  // footer site map like the three rows above, and the switcher keeps a blog
  // page's path across languages (/de/blog/page/2/ ↔ /fr/blog/page/2/). It was
  // Romanian only until then (§5) — the one row that ever carried a `locale`
  // scope, deleted with it (the file header's AND THE PER-LOCALE HALF LEFT) —
  // and offered NOWHERE from 2026-09-20 (owner: "drop it for now") until the
  // list page existed and the owner asked for the link, on 2026-10-14 ("don't
  // forget … to give a clickable link to top bar for blog page").
  { path: '/blog', key: 'nav.blog' },
];

/**
 * THE LEGAL ROUTES — a SEPARATE list, read by the Footer's legal strip alone
 * and never by the bar, the panel or the site map (the nav board's R1, owner
 * fb-181, 2026-08-18: "legal links go in a SEPARATE LEGAL_ROUTES list … never
 * appended to PRIMARY_ROUTES"). One page today: the privacy and cookie policy
 * (CLAUDE.md §12, BACKLOG.md entry 3), in all five locales — so the language
 * switcher keeps its path, as it keeps every page's.
 *
 * The path is §5's shared English slug; a localised one (/ro/confidentialitate)
 * is the parked §15.3 decision and would move with it — one row here.
 */
export type LegalRouteKey = 'footer.privacy';

export interface LegalRoute {
  /** Locale-less, no trailing slash — the PrimaryRoute['path'] contract. */
  readonly path: `/${string}`;
  /** Key under the `common` namespace, resolved by the Footer. */
  readonly key: LegalRouteKey;
}

/** The privacy and cookie policy's path — one spelling for every link to it. */
export const PRIVACY_PATH = '/privacy' satisfies `/${string}`;

/**
 * The policy's map paragraph — the id its section wears, one spelling for
 * the page and its tests. A link to it would be
 * `${PRIVACY_PATH}#${PRIVACY_MAP_ANCHOR}`; none ships since the note under
 * the map left on 2026-10-13 (CLAUDE.md §15.38 round 3). English, like
 * every fragment id on the site (§15.20).
 */
export const PRIVACY_MAP_ANCHOR = 'map';

export const LEGAL_ROUTES: readonly LegalRoute[] = [
  { path: PRIVACY_PATH, key: 'footer.privacy' },
];

/**
 * Section-scoped, NOT prefix matching for '/': every path starts with a slash,
 * so a naive startsWith would light Home up on every page. Everything else
 * matches its own path plus its descendants, which is what makes /blog/<slug>
 * report as Blog — the section, not the article, is what the nav names.
 *
 * Lifted out of useNavItems' private `isActive` unchanged in behaviour (that
 * hook calls this; the language switcher's hrefs leaned on it too, through
 * `equivalentPath`, until 2026-10-14 — the file header's AND THE PER-LOCALE
 * HALF LEFT).
 *
 * Both sides are `/${string}`. The pathname arrives locale-STRIPPED from
 * @/i18n/navigation's usePathname ('/ro/services/' → '/services/') and the
 * route side is PrimaryRoute['path']; the trailing slash a real address bar
 * carries is absorbed by the descendant clause rather than normalised away.
 *
 * THE ROW SIDE MUST CARRY NO TRAILING SLASH — only the pathname side may. The
 * descendant clause tests `${path}/`, so a row written '/blog/' (the shape an
 * address bar hands you) would look for '/blog//…' and match nothing: every
 * page under it — a later page of the list, an article — would lose its Header
 * underline. Nothing else would fail — localeHref strips the row's slash on
 * the URL side — so the shape is pinned by a test in routes.test.ts rather
 * than normalised here: this function is a zero-behaviour-change lift of the
 * Header's old `isActive`, and quietly accepting a second row shape would be
 * a change.
 */
export function matchesRoute(
  pathname: `/${string}`,
  path: `/${string}`,
): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}
