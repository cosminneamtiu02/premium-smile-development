// THE locale manifest — pure data, zero imports, so every consumer can reach
// it: routing.ts (Next), the Storybook locale toolbar, the translation-parity
// test, and tools/generate-root-redirect.ts (plain Node at build time).
// Adding/removing a locale happens HERE and in src/messages/ — nowhere else.

export const locales = ['ro', 'en', 'de', 'fr', 'it'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ro';

// Each language named in itself — never flags (brief §8.5). Also the data
// source for the future LanguageSwitcher (Phase 3).
export const nativeNames: Record<Locale, string> = {
  ro: 'Română',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
};
