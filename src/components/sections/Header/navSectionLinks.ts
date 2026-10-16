import type { Locale } from '@/i18n/locales';
import { localeHref } from '@/i18n/href';
import {
  navSections,
  type SectionedPath,
} from '@/lib/nav-sections/nav-sections';

// sections/Header — the top bar's dropdown entries turned into FINISHED links,
// on the SERVER (CLAUDE.md §15.40; the owner, 2026-10-15: "on the pages with
// servicii … you click profilaxie it takes you directly to profilaxie. on
// echipa it take you directly to a doctor card"). Header.tsx — a Server
// Component, pre-rendered into static HTML — calls this once and hands the
// result to its two islands, HeaderNav (the bar row's cards) and NavMenu (the
// phone panel's lists), as a plain prop: seventeen short labels and their
// hrefs.
//
// ── NO 'use client', AND NO CLIENT FILE MAY IMPORT A VALUE FROM HERE. This
// module reads lib/nav-sections, which reads the whole tariff (lib/prices —
// eleven categories, 102 rows, five languages each) and the whole team
// (lib/team). Whatever a 'use client' file imports rides into every page's
// JavaScript, so the islands import the TYPES below and nothing else — a type
// import is erased before the bundler sees it. Header.test.tsx's "the islands
// never import the data" pin holds that for every client file in this folder.
//
// ── THE HREF IS THE ONE URL RULE (§15.13): localeHref keeps a fragment where a
// URL keeps it — '/services#prophylaxis' → '/ro/services/#prophylaxis' — so an
// entry is a plain anchor and a full document load like every other link, and
// on the very page it names the browser's own fragment jump lands it: the
// price card by its id (sections/PriceList's CategoryCard), the doctor's card
// by its station's id (sections/DoctorShowcase's D13).

/** The paths that carry a dropdown — '/services' and '/team' — re-exported as
 *  a TYPE for the islands, which may import types alone from this module: the
 *  dropdowns' state is keyed by it, so a `toggle('/')` does not compile. */
export type { SectionedPath } from '@/lib/nav-sections/nav-sections';

/** One entry of a dropdown, finished: where it lands and what it says. */
export type NavSectionLink = Readonly<{
  /** The FINAL href — locale prefix, trailing slash, base path, fragment. */
  href: string;
  /** The label, already in the visitor's language (§8.1). */
  label: string;
}>;

/**
 * Every dropdown's entries, keyed by the PrimaryRoute path whose row carries
 * them — '/services' and '/team' (lib/nav-sections' SECTIONED_PATHS). A path
 * absent from the record (Acasă, Blog) has no dropdown at all.
 */
export type NavSectionsByPath = Readonly<
  Record<SectionedPath, readonly NavSectionLink[]>
>;

/**
 * The finished links for ONE language.
 *
 * @param locale the page's language, already narrowed by `isLocale`.
 */
export function navSectionLinks(locale: Locale): NavSectionsByPath {
  const sections = navSections(locale);
  const linksOf = (path: SectionedPath): readonly NavSectionLink[] =>
    sections[path].map(({ id, label }) => ({
      href: localeHref(locale, `${path}#${id}`),
      label,
    }));
  // Spelled out key by key rather than walked: a third sectioned path in
  // lib/nav-sections then fails to compile HERE, where its links are built.
  return { '/services': linksOf('/services'), '/team': linksOf('/team') };
}
