import type { Dentist, Thing, WithContext } from 'schema-dts';
import { localeHref } from '../i18n/href';
import { defaultLocale, locales, type Locale } from '../i18n/locales';
import { clinic } from './clinic';

// THE SEO builders (brief §10, part 1 of 2 — playbook Phase-4 order): the
// `Dentist` JSON-LD every page carries and the per-page metadata/hreflang
// helper every page's generateMetadata calls. Part 2 (sitemap + robots
// generation) arrives LAST in Phase 4, once every route it must enumerate
// exists. Everything here is pure data-shaping over lib/clinic.ts — §10.1's
// consistency-by-construction: the Footer, the ContactModal and this file
// repeat the same constants, so they cannot drift apart.
//
// ── WHY NOTHING HERE NAMES `next` (D-S1-2, phase4-content ledger). §4 places
// this module in lib/, and lib/ is the React-free foundation ring —
// tests/unit/lib-react-free.test.ts bans the `next` specifier even as a
// type-only import, deliberately. So pageMetadata() returns a PLAIN OBJECT that
// is structurally assignable to Next's `Metadata` type without this file ever
// importing it; tests/unit/seo.test.ts pins that assignability with a typed
// `const` (the compiler proves it there, one gate later, where the fence does
// not reach). If Next's Metadata shape ever drifts, the TEST goes red — this
// module stays a framework-free description of the site's head data.
//
// ── THE ABSOLUTE-URL RULE (D-S1-3). §5's URL rule lives in exactly one place,
// src/i18n/href.ts (locale prefix · trailing slash · interim base path); this
// module only prepends the one fact href.ts cannot know — the production
// origin, clinic.url. absoluteUrl() is therefore a composition, never a second
// spelling: a URL-shape change still happens in href.ts and nowhere else.
// clinic.url is a TODO(owner) placeholder until the real domain lands (§15.6 /
// §15.2) — the shape is right today, the origin swaps in one line later.

/** `'ro'`, `'/services'` → `'https://…/ro/services/'` — clinic.url + the one
 * URL rule (i18n/href). `locale: string` by the routes.ts/href.ts precedent:
 * useLocale() and route params hand back plain strings; the Locale union does
 * its work on the data side. */
export function absoluteUrl(locale: string, path: `/${string}`): string {
  return `${clinic.url}${localeHref(locale, path)}`;
}

/**
 * The schema.org `Dentist` node (§10.2 — the SPECIFIC type, not generic
 * LocalBusiness), fed ONLY from lib/clinic.ts. schema-dts types the whole
 * shape, so a typo'd property or a misspelled day fails compilation instead of
 * surfacing in the Rich Results Test.
 *
 * `image` is deliberately ABSENT (D-S1-5): no logo/photo asset exists in the
 * repo yet (§15.6 — owner supplies), and a made-up URL would be a dead link in
 * every crawler's eyes. It is a schema.org RECOMMENDED field, not required —
 * add it beside `url` the day the asset lands. TODO(owner).
 *
 * `Exclude<Dentist, string>`: schema-dts spells every node type as
 * `Leaf | string`, the string being the bare-IRI reference form. This builder
 * always emits the OBJECT, and its consumers read properties off it (the
 * tests; later the Services page's own markup) — so the reference form is
 * excluded from the signature instead of narrowed at every call site.
 */
export function dentistJsonLd(): WithContext<Exclude<Dentist, string>> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: clinic.name,
    // The entity's home is the DEFAULT locale's home page — a page that really
    // exists (root '/' is only the redirect stub), matching x-default below
    // and locales.ts's charter for `defaultLocale` (D-S1-4).
    url: absoluteUrl(defaultLocale, '/'),
    telephone: clinic.phone,
    priceRange: clinic.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinic.address.street,
      addressLocality: clinic.address.city,
      addressRegion: clinic.address.county,
      postalCode: clinic.address.postalCode,
      addressCountry: clinic.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: clinic.geo.latitude,
      longitude: clinic.geo.longitude,
    },
    // clinic.hours rows carry schema.org's own day names already (the
    // SchemaDay union) — this is a re-shape, not a translation. Spread copies
    // because schema-dts wants mutable arrays and clinic.ts's are readonly.
    openingHoursSpecification: clinic.hours.map((row) => ({
      '@type': 'OpeningHoursSpecification' as const,
      dayOfWeek: [...row.days],
      opens: row.opens,
      closes: row.closes,
    })),
    sameAs: [...clinic.sameAs],
  };
}

/**
 * JSON-LD as embeddable text. `JSON.stringify` alone is not enough inside a
 * `<script>` element: the sequence `</script` in any string value would END the
 * element early and turn the rest of the payload into markup. Replacing every
 * `<` with its six-character JSON unicode escape (u003c, backslash-prefixed —
 * identical text after parsing) closes that hole for good — the standard
 * hardening for inline JSON-LD. Values here come from our own clinic.ts, so
 * this is belt-and-braces, not a live threat.
 */
export function serializeJsonLd(data: WithContext<Thing>): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}

/**
 * og:locale values per locale (D-S1-6, PROVISIONAL — owner confirms en_GB):
 * Open Graph wants `language_TERRITORY`. `en` maps to en_GB by the same owner
 * call that put the Union Jack behind the switcher's EN code (§8.5).
 */
const OG_LOCALES = {
  ro: 'ro_RO',
  en: 'en_GB',
  de: 'de_DE',
  fr: 'fr_FR',
  it: 'it_IT',
} satisfies Record<Locale, string>;

/** Every locale's absolute URL for one path, plus x-default → the default
 * locale (locales.ts's recorded x-default role, §10.4). The hreflang link tags
 * in each page's head and the sitemap's alternate cluster (part 2) both read
 * THIS shape, which is what keeps them mirrors of each other. */
function alternateLanguages(
  path: `/${string}`,
): Record<Locale | 'x-default', string> {
  const perLocale = Object.fromEntries(
    locales.map((locale) => [locale, absoluteUrl(locale, path)]),
    // The cast Object.fromEntries always needs (it widens keys to string) —
    // honest rather than hopeful: the entries come from `locales` itself, so
    // the record is total by construction (the layout's bannerMessages
    // precedent).
  ) as Record<Locale, string>;
  return { ...perLocale, 'x-default': absoluteUrl(defaultLocale, path) };
}

export interface PageMetadataInput {
  /** The page's own locale (plain string — the params/useLocale shape). */
  locale: string;
  /** Locale-less path per lib/routes.ts — '/', '/services', '/blog/slug'. */
  path: `/${string}`;
  /** Finished, already-translated strings (§8.1: t() runs in the page tier —
   * pattern "Service — Clinic — City", authored in the message files). */
  title: string;
  description: string;
  /**
   * false ⇒ canonical only, no hreflang cluster (D-S1-8): blog pages exist in
   * Romanian alone (§5), so they have no language siblings to point at —
   * §10.4 lists blog URLs "without alternates" for the same reason.
   */
  alternates?: boolean;
}

/**
 * The §10.3/§10.4 head block for one page, as plain data: per-locale title +
 * description (passed in, already translated), self-referencing canonical,
 * hreflang links to the four siblings + x-default, and the Open Graph tags.
 *
 * og:image is deliberately ABSENT: the share image is blocked on the logo
 * (§15.6) — add it here once, every page inherits. TODO(owner).
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  alternates = true,
}: PageMetadataInput) {
  const canonical = absoluteUrl(locale, path);
  return {
    title,
    description,
    alternates: {
      canonical,
      ...(alternates ? { languages: alternateLanguages(path) } : {}),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: clinic.name,
      // An unknown code passes through bare — og:locale is advisory, and a
      // wrong-but-honest value beats a silent wrong-territory guess. Partial,
      // not Record: without noUncheckedIndexedAccess a total Record types the
      // lookup as `string` and marks the live `?? locale` branch unreachable —
      // the cast must state the truth the runtime has (G2 ts LOW, S1).
      locale: (OG_LOCALES as Partial<Record<string, string>>)[locale] ?? locale,
      type: 'website' as const,
    },
  };
}
