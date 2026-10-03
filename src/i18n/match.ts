// THE preference walk: "which of our five locales does this visitor already
// read?" — pure data-shaping over the locale manifest, zero imports beyond it,
// no React, no browser API. It sits BESIDE locales.ts for the reason href.ts
// gives in its own header: a formatter belongs next to the data it formats, and
// this one formats a ranked BCP-47 list into a `Locale`.
//
// ── ITS ONE CONSUMER TODAY, AND WHAT THAT CONSUMER MAY DO WITH THE ANSWER (D3,
// language-autoselect board). sections/LanguageBanner asks this question about
// `navigator.languages` and, when the answer differs from the page's own
// locale, offers a link. It NEVER redirects: a deep link the visitor followed —
// from a search result, a WhatsApp message, a printed card — is an address, and
// an address that silently becomes another address is a bug however well meant
// (§8.6 also bans IP/geolocation outright). `null` is therefore an ordinary
// answer, not a failure: it means "we have nothing to suggest", and the banner
// simply does not appear. There is deliberately NO fallback here — a deep link
// is already somewhere. (The root "/" stub, which must land a visitor
// somewhere because "/" is not a page, answers its own no-cookie case with
// defaultLocale directly and asks no language question at all — 2026-09-06,
// "FORMERLY A KEEP-IN-SYNC PAIR" below.)
//
// ── FORMERLY A KEEP-IN-SYNC PAIR, DISSOLVED 2026-09-06 (owner — root
// Romanian-first). Until that date the <script> tools/generate-root-redirect.ts
// emits carried this same walk as ES5 text — one rule, two runtimes, held by
// pointer comments and a dual-run fixture. The stub stopped walking: it reads
// the §8.7 cookie and otherwise lands on defaultLocale, so this module is the
// ONLY implementation of the preference walk and sections/LanguageBanner its
// sole caller. tests/unit/locale-match.test.ts keeps this module's fixture
// table and separately pins the stub's shrunken contract (cookie →
// defaultLocale, no `navigator` reference in the emitted text).
//
// ── THE `slice(0, 2)` LIMITATION, RECORDED. A BCP-47 primary subtag can be
// three letters ('frr' — North Frisian, 'gsw' — Swiss German), so taking the
// first two characters TRUNCATES rather than parses: 'frr' reads as 'fr'.
// Against a manifest of five two-letter locales that can only ever OVER-match,
// and only for exotic tags — it can never miss a visitor who really does read
// one of our languages, because every one of those tags starts with its own
// two letters. The honest parse would cut at the first '-' instead; it stays
// as written (inherited from the retired stub walk, kept on its own merits)
// because the whole cost of over-matching is one dismissible card, and the
// 'frr' row in tests/unit/locale-match.test.ts records the choice — change
// the arithmetic and that row goes red first.

import { locales, type Locale } from './locales';

/**
 * `['de-AT', 'en']` → `'de'` · `['hu', 'ro']` → `'ro'` · `['pl']` → `null`.
 *
 * The list is RANKED (that is what `navigator.languages` is), so the first hit
 * wins — a visitor whose Hungarian is first and Romanian second is offered
 * Romanian, the best of what we have, not the least of it.
 *
 * `String(entry)` is not ceremony on a typed `string`: `navigator.languages`
 * is a live browser list, not our data, and the caller hands it over exactly
 * as the browser reported it.
 */
export function matchLocale(prefs: readonly string[]): Locale | null {
  for (const entry of prefs) {
    const primary = String(entry).slice(0, 2).toLowerCase();
    // `find` (not `includes`): it hands back the manifest's OWN value, so the
    // return type is `Locale` without a cast — the truncated string never
    // escapes this loop.
    const hit = locales.find((locale) => locale === primary);
    if (hit) return hit;
  }
  return null;
}
