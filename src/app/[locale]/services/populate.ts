import type { PriceCategoryProps } from '@/components/sections/PriceList/PriceList';
import type { Locale } from '@/i18n/locales';
import { priceCategories, type PriceCategory } from '@/lib/prices/prices';

// app/[locale]/services/populate — THE walk from the typed tariff to the price
// band's finished props, in ONE language. Pure and React-free: a locale, a
// formatter and (for tests) a list go in, `PriceCategoryProps[]` comes out. No
// JSX, no next-intl import, no DOM.
//
// ── WHY THIS FUNCTION EXISTS AT ALL. sections/PriceList is a DUMB band (owner
// fb-459, board .claude/plans/price-list.plan.md §2c.1): every string that
// reaches it is already translated and already formatted, and it never learns
// what a `Locale` or a `number` is. Somebody still has to pick the visitor's
// words and turn 2300 into „2.300 RON", and the board names that somebody — the
// PAGE is the one populator (board §1.4). This file is that populator's
// arithmetic, lifted out of the JSX.
//
// ── WHY IT IS NOT IN lib/prices, where the board's round-1 sketch parked it
// („toPriceListProps(list, locale, formatAmount)" if the mapping outgrew a
// dozen lines). Its RETURN TYPE is the band's contract, and §4's dependency
// direction is app → sections → ui with lib/ beside the spine as the foundation
// ring: importable BY any tier, never importing a `sections/` type itself. A
// mapper living in lib/prices would have to point at sections/PriceList to name
// what it produces — the one arrow §4 forbids. Restating the prop shape in lib/
// instead would buy a second declaration of a contract that deliberately has
// exactly one (PriceList.tsx re-exports CategoryCard's types rather than
// redeclaring them, for the same reason).
//
// ── WHY IT IS NOT INLINE IN page.tsx, where twenty lines of it would fit. The
// story twin beside it (./Services.stories.tsx) must perform the SAME mapping,
// and it cannot import the page: that module is an async Server Component that
// awaits next-intl/server, which no browser runner can execute. A module both
// can import is what makes the mapping written ONCE instead of twinned by hand
// and left to drift — and ./populate.test.ts then exercises it without
// rendering anything at all.
//
// ── WHY A `formatAmount` CALLBACK AND NOT A `t`. The ICU sentence
// `services.prices.amount` = "{amount, number} RON" is the page's to own
// (§8.1), and the two callers reach it through two different next-intl APIs:
// `getTranslations` on the server, `useTranslations` in the story. A callback
// is the seam both satisfy, and it keeps this module free of next-intl
// entirely — which is why its test needs no provider and no mock.

/**
 * The id the page's `<h1>` wears — one string, two files: ./page.tsx and the
 * KEEP-IN-SYNC twin beside it (./Services.stories.tsx), whose play function
 * finds the heading by role and then checks it is THIS element.
 *
 * It names NOTHING. The board's §3.1 had the price band close an
 * `aria-labelledby` with this id; the a11y round of 2026-09-13 dropped that
 * (the band would have become a landmark wrapping everything inside <main> —
 * page.tsx, THE BAND IS NOT A NAMED REGION), and since the owner's 2026-09-14
 * round the h1 is not even painted — `sr-only`, for the two standing reasons
 * that file's header argues. So what the id is today is a stable handle: the
 * twin's grip on the heading, and the one entry the page contributes to the
 * DOM-id namespace ./populate.test.ts checks the eleven category ids against.
 *
 * It lives HERE and not in page.tsx because the story twin needs the same
 * string and cannot import that module (this file's header says why) — and
 * because a page file's export surface belongs to the framework: `default`,
 * `generateMetadata`, `generateStaticParams`, `revalidate`, … . MEASURED, so
 * the rule is not overstated: under Next 16.3's Turbopack builder the
 * generated `.next/types/validator.ts` only asserts `typeof page extends
 * AppPageConfig`, which a surplus export satisfies structurally — an
 * `export const` beside the component type-checks and builds today. (The
 * webpack builder's older `next-types-plugin` refused it outright, and the
 * docs still call segment exports the page module's surface.) So this is a
 * convention held on purpose, not a wall: the page exports its component and
 * nothing else, and the one shared constant lives with the mapping both twins
 * already import.
 */
export const SERVICES_TITLE_ID = 'services-title';

/**
 * Turn the typed tariff into the band's finished props for ONE language: every
 * name picked in `locale`, every amount run through `formatAmount`.
 *
 * Ids pass through UNCHANGED, in the list's own order. That matters three
 * times over: the same array prints the menu and the cards (board §1.3), a
 * category id is the card's DOM id AND the menu link's `#href`, and the
 * fragment a visitor pastes into WhatsApp is `#prosthetics` in every language
 * (board §4.4, owner fb-461 — ids are English, a URL is not copy).
 *
 * @param locale the visitor's language, already narrowed — the page receives a
 *   route `string` and narrows it with `isLocale` (§15.19's recorded trigger,
 *   board §2.6), because indexing a `LocalizedName` with an unchecked string is
 *   a cast that type-checks a typo just as happily as a locale.
 * @param formatAmount whole lei → the finished price sentence. The ONLY place a
 *   number becomes words on this page; lib/prices never formats (board §2.4).
 * @param categories the list to walk. Defaults to the real tariff, so every
 *   shipping caller passes two arguments and only tests pass a fixture — the
 *   band's own stories feed it invented rows for the same reason (§2c.1: dumb
 *   buys review before the real sheet is verified).
 */
export function populatePriceList(
  locale: Locale,
  formatAmount: (lei: number) => string,
  categories: readonly PriceCategory[] = priceCategories,
): readonly PriceCategoryProps[] {
  return categories.map((category) => ({
    id: category.id,
    name: category.name[locale],
    // Plain, because there is no absent case left to handle: `eyebrow` is
    // REQUIRED on both sides of this walk since the owner's 2026-09-14 round —
    // on lib/prices' `PriceCategory` and on the band's `PriceCategoryProps` —
    // so every category has one and every card wears one.
    eyebrow: category.eyebrow[locale],
    rows: category.items.map((item) => ({
      id: item.id,
      name: item.name[locale],
      price: formatAmount(item.lei),
    })),
  }));
}
