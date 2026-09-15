// THE locale manifest — pure data, zero imports, so every consumer can reach
// it: routing.ts (Next), the Storybook locale toolbar, the translation-parity
// test, tools/generate-root-redirect.ts (plain Node at build time), and the
// LanguageSwitcher island (LOCALE_COOKIE, written in the visitor's browser).
// Adding/removing a locale happens HERE and in src/messages/ — nowhere else.

export const locales = ['ro', 'en', 'de', 'fr', 'it'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ro';

// (RETIRED 2026-09-06, owner — root Romanian-first: `fallbackLocale = 'en'`
// lived here from D1/#67 until its ONE consumer, the root redirect's no-match
// branch, was deleted — the stub now lands cookie-less visitors on
// `defaultLocale`, whose other roles were always Romanian anyway.)

/**
 * Whether `value` is one of the five routed locales — the guard §15.19 named as
 * the trigger "at the next `Record<Locale, …>` band", and `lib/prices` is that
 * band (price-list board §2.6). A page receives its locale as a plain `string`
 * and must narrow it before indexing a `LocalizedName`; without a guard that
 * narrowing is a cast, which type-checks a typo just as happily as a locale.
 * The predicate is honest in both directions: the true branch gives `Locale`,
 * and the false branch leaves a `string` a `string` (TypeScript subtracts a
 * predicate's type there, and `string` minus a union of its own literals is
 * still `string` — the `never` trap lib/initials' `isTwoLetters` header
 * measured does not exist here).
 *
 * NOT the only guard, on purpose: next-intl's `hasLocale(routing.locales, x)`
 * narrows an `unknown` on the ROUTING side (app/[locale]/layout.tsx and
 * src/i18n/request.ts). This one exists for the `string`s the routing layer
 * hands back afterwards — `getLocale()`, a story's toolbar global — and for
 * the manifest's promise of zero imports: a data module may not import a
 * framework to ask which of its own five values it is looking at.
 *
 * `some` rather than `locales.includes(value)`: `includes` on the `as const`
 * tuple takes only a `Locale`, so a `string` argument would need a widening
 * cast — and this module's header promise is data with zero imports and zero
 * ceremony.
 *
 * ONE CONSUMER TODAY, ONE OWED: app/[locale]/services/page.tsx narrows with
 * this guard; sections/ReviewsCarousel still spells the same question as
 * `locales.find(…) ?? defaultLocale` (a silent fallback where the page throws).
 * The next lane that touches ReviewsCarousel folds it onto this guard — not
 * the price-list lane, whose visual manifest must not drag the deck's in
 * (G2 react L3).
 */
export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

// THE one spelling of the language-cookie name (§8.7) — the site's only piece
// of storage, and therefore the whole reason it ships with no consent banner.
// It has exactly ONE writer-helper and exactly ONE value-reader, and they live
// in different worlds, which is why the name needed a home rather than a
// convention:
//   · WRITTEN via src/i18n/cookie.ts' setLocaleCookie — in the visitor's
//     browser, on an explicit click and at no other moment — whose callers are
//     sections/LanguageSwitcher's handleSelect (a pick) and
//     sections/LanguageBanner (accept, and D2's dismiss: "I'm fine here",
//     stored as the page's own locale; banner lane, 2026-09-04);
//   · READ — as a VALUE — only by the inline script
//     tools/generate-root-redirect.ts emits into out/index.html: that tool
//     interpolates THIS constant into the regex at build time, so the emitted
//     bytes cannot drift from what setLocaleCookie writes. (The banner's
//     hasLanguageChoice additionally tests the NAME's presence in
//     document.cookie — never the value — so the value-reader stays unique;
//     G2 ts review, 2026-09-04.) Until 2026-09-02 the two spellings were
//     coupled by prose only.
// The tests and stories assert the LITERAL 'NEXT_LOCALE' from the OUTSIDE on
// purpose — never rewire them to import this constant. They are the tripwire
// that fires if this value ever changes, and a tripwire built out of the thing
// it watches watches nothing.
// A plain string keeps this module exactly what its header promises: pure
// data, zero imports.
export const LOCALE_COOKIE = 'NEXT_LOCALE';

// Each language named in itself — never flags (brief §8.5). Also the data
// source for the future LanguageSwitcher (Phase 3).
// Amended 2026-09-04 (owner, speed-dial-flags lane): decorative country-flag
// art may sit BEHIND the switcher's codes, but the identification is still this
// table plus the visible code — no flag is ever the only way a language is
// named, which is all §8.5 ever meant.
export const nativeNames: Record<Locale, string> = {
  ro: 'Română',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
};
