import type { Locale } from '../../i18n/locales';
import { priceCategories } from '../prices/prices';
import { doctors } from '../team/team';

// lib/nav-sections — THE in-page sections the top bar's dropdowns list, one
// list per primary route that has any (owner, 2026-10-15, verbatim: "i want to
// implement a navigation dropdown on hover JUST ON THE TOP BAR ELEMNTS which
// drops down smoothly with sections of that particular page . i want this just
// on the pages with servicii where it takes you to the card of prices adjacend
// with what you click, so for insance you click profilaxie it takes you
// directly to profilaxie. on echipa it take you directly to a doctor card and
// so on" · "blog and home should not have this"). CLAUDE.md §15.40.
//
// ── WHY A MODULE OF ITS OWN, AND NOT A FIELD ON lib/routes' ROWS. The route
// list is read by the Header's CLIENT islands (useNavItems): whatever it
// imports rides into every page's JavaScript. This module imports the whole
// tariff (lib/prices — eleven categories, 102 rows, five languages each) and
// the whole team (lib/team), so it must only ever be read on the SERVER: the
// Header (a Server Component, pre-rendered into static HTML) calls it and hands
// its islands the finished strings — 17 short labels — never the data files.
// Keep it that way: an import of this module from a 'use client' file would
// ship both data files to every visitor.
//
// ── THE IDS ARE THE PAGES' OWN. A section's `id` is the fragment its link
// lands on, so it must be the very id the target page prints:
//   '/services'  each category's id — sections/PriceList's CategoryCard wears
//                it as its DOM id (the price menu's own `#href`, §15.20);
//   '/team'      each doctor's id — sections/DoctorShowcase's station wears
//                it as its DOM id since 2026-10-15 (this lane).
// Both derive from the same lists the pages render, so a link and its target
// cannot drift; nav-sections.test.ts holds the equality anyway.
//
// §8.1 holds: the labels are already the visitor's language here — the
// categories' and the doctors' own five-language words, which are DATA, never
// message keys (lib/prices' and lib/team's headers say why).

/** One entry of a top-bar dropdown: the fragment it lands on and its label. */
export type NavSection = Readonly<{
  /** The target's DOM id on its page — the fragment, without the `#`. */
  id: string;
  /** The label, already in the visitor's language. */
  label: string;
}>;

/**
 * The primary routes that carry a dropdown — the owner's two, Servicii and
 * Echipa. Acasă and Blog never do ("blog and home should not have this").
 * Each is a `PrimaryRoute['path']` of lib/routes (nav-sections.test.ts holds
 * that), so the Header matches a row to its sections by that path.
 */
export const SECTIONED_PATHS = ['/services', '/team'] as const;

export type SectionedPath = (typeof SECTIONED_PATHS)[number];

/**
 * Every dropdown's entries for ONE language, in the order their page shows
 * them: the tariff's eleven categories as printed, the six doctors as the Team
 * page lists them.
 *
 * @param locale the visitor's language, already narrowed by `isLocale`.
 */
export function navSections(
  locale: Locale,
): Readonly<Record<SectionedPath, readonly NavSection[]>> {
  return {
    '/services': priceCategories.map((category) => ({
      id: category.id,
      label: category.name[locale],
    })),
    '/team': doctors.map((doctor) => ({
      id: doctor.id,
      label: doctor.words[locale].name,
    })),
  };
}
