// THE one place a locale URL is spelled — pure data-shaping, zero imports, so
// every consumer can reach it: the Header's row and panel, the Footer's site
// map, later the Wordmark home link, the LanguageSwitcher and in-content CTAs,
// and tools/generate-root-redirect.ts (plain Node at build time, for BOTH the
// visible locale list and the table its inline script redirects through). No
// React, no next-intl, no browser API — the locales.ts rule, for the same
// reason. There is no second spelling of the rule left anywhere.
//
// ── WHY IT EXISTS AT ALL (§15.13). Every internal link is a plain <a href>:
// there is no <Link> left to add the /{locale} prefix, the trailing slash or
// the interim base path on the way out, so those three facts had to become one
// module instead of three habits. A URL rule changes HERE and nowhere else.
//
// ── WHY HERE, IN src/i18n/, AND NOT IN src/lib/ (org review, 2026-08-24).
// The repo's only "where does a builder go" precedent is lib/hours.ts, which
// sits beside clinic.ts because it formats clinic.hours; this module formats a
// LOCALE into a URL, so it sits beside locales.ts. It is also the other half of
// ./navigation.ts — "where does this go" against "where am I", and since D9
// both halves are spelled here (stripLocale below), so ./routing.ts's
// `localePrefix: 'always'` is hand-written in exactly one file. lib/'s own
// charter argues the same way from the other side: routes.ts calls it "shared
// DATA … the single source of a fact", and a formatter is not data.
//
// The trailing slash is `trailingSlash: true` (next.config.ts, locked §3) spelt
// out: the export writes out/ro/services/index.html, so the slash form IS the
// canonical URL and the visitor pays no redirect hop for it. If that flag ever
// flips, this function and tests/unit/href.test.ts flip in the same commit.
//
// `locale: string` and not the Locale union, deliberately: useLocale() hands
// back a plain string, and lib/routes.ts already made this exact call for
// primaryRoutes(locale: string) — the union does its work on the DATA side,
// where a rename must not go unnoticed. The PATH is typed the other way round:
// `/${string}` costs nothing at runtime and refuses 'services' at compile time,
// which the old `string` signature silently shipped as '/roservices/'.

/**
 * '/services' → '/ro/services/' · '/' → '/ro/' · plus the base path when set.
 * A '#fragment' or '?query' rides along at the very end, where a URL keeps it:
 * '/services#preturi' → '/ro/services/#preturi'.
 */
export function localeHref(locale: string, path: `/${string}`): string {
  // Split at the FIRST '#' or '?': everything from there on is not a path at
  // all (it addresses an element or carries parameters), so the slash rule must
  // not touch it — a trailing slash appended after '#preturi' would land inside
  // the fragment and match nothing.
  const cut = path.search(/[#?]/);
  const route = cut === -1 ? path : path.slice(0, cut);
  const suffix = cut === -1 ? '' : path.slice(cut);

  // '/' is the locale home (§5: /ro, never /ro/home), so its route part
  // collapses to nothing; any other path drops a slash the caller already
  // wrote, because this function is the one that adds it back.
  const trimmed = route === '/' ? '' : route.replace(/\/$/, '');
  return `${basePath()}/${locale}${trimmed}/${suffix}`;
}

/**
 * The inverse of the prefix rule: '/ro/services/' → '/services/' — the
 * locale-LESS shape ./navigation.ts hands the Header so it can mark the page
 * you are on. Only a whole leading segment counts, so '/robot' stays '/robot',
 * and a pathname that is not on `locale` comes back untouched.
 *
 * The trailing slash is preserved exactly as given rather than normalised: with
 * `trailingSlash: true` a real address bar reads '/ro/services/', and
 * useNavItems' isActive already matches a route plus its descendants.
 */
export function stripLocale(
  pathname: `/${string}`,
  locale: string,
): `/${string}` {
  const prefix = `/${locale}`;
  if (pathname === prefix) return '/';
  // A SEGMENT, not a text prefix. The slash in the test is what tells '/ro/…'
  // apart from '/robot': a bare startsWith('/ro') would let the latter into the
  // branch below and hand back a mangled path for a page that is not Romanian
  // at all — the same trap useNavItems' isActive spells out for '/'.
  if (!pathname.startsWith(`${prefix}/`)) return pathname;

  // Cut the segment AND its slash, then put one back — that is what keeps the
  // return type honest without a cast, and it sends '/ro/' to '/'.
  const rest = pathname.slice(prefix.length + 1);
  return rest === '' ? '/' : `/${rest}`;
}

/**
 * '/premium-smile-development' in the interim Pages build (§15.2), '' on every
 * other host and — unless a test stubs it — in every runner. The SAME variable
 * next.config.ts reads for Next's own `basePath`, so the link prefix and the
 * asset prefix cannot disagree.
 *
 * Read at CALL time, not at module load: the browser bundle and the Chromium
 * test project get this text replaced by a literal at build time (next.config
 * `env` · vitest.config `define`), while the node runners keep a real
 * environment a test can flip between cases.
 */
function basePath(): string {
  return process.env.PAGES_BASE_PATH ?? '';
}
