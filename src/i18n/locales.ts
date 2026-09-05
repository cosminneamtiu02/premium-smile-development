// THE locale manifest — pure data, zero imports, so every consumer can reach
// it: routing.ts (Next), the Storybook locale toolbar, the translation-parity
// test, tools/generate-root-redirect.ts (plain Node at build time), and the
// LanguageSwitcher island (LOCALE_COOKIE, written in the visitor's browser).
// Adding/removing a locale happens HERE and in src/messages/ — nowhere else.

export const locales = ['ro', 'en', 'de', 'fr', 'it'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ro';

// THE no-match fallback — read by exactly ONE consumer, the root "/" redirect
// (tools/generate-root-redirect.ts), and fired ONLY when the visitor's entire
// ranked preference list matches none of the five locales above: such a
// visitor is by construction not Romanian-reading, so they land on English
// (owner 2026-09-02, language-autoselect board D1; §5 amended same date).
// Deliberately NOT `defaultLocale`, whose other roles all stay Romanian:
// the root stub's <html lang>, the stub's <title> message source
// (src/messages/ro.json), next-intl's routing default (routing.ts, and via
// it request.ts's invalid-segment fallback), and the future sitemap
// x-default (§10.4). A typed const is data — the header's "pure data, zero
// imports" charter holds.
export const fallbackLocale: Locale = 'en';

// THE one spelling of the language-cookie name (§8.7) — the site's only piece
// of storage, and therefore the whole reason it ships with no consent banner.
// It has exactly ONE writer and exactly ONE reader, and they live in different
// worlds, which is why the name needed a home rather than a convention:
//   · WRITTEN by sections/LanguageSwitcher's handleSelect, in the visitor's
//     browser, on the explicit click and at no other moment;
//   · READ by the inline script tools/generate-root-redirect.ts emits into
//     out/index.html — that tool interpolates THIS constant into the regex at
//     build time, so the emitted bytes cannot drift from what the switcher
//     writes. Until 2026-09-02 the two spellings were coupled by prose only.
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
