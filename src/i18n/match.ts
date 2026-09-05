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
// simply does not appear. There is deliberately NO fallback here — locales.ts'
// `fallbackLocale` belongs to the ROOT "/" redirect alone, which must send an
// unmatched visitor SOMEWHERE because "/" is not a page (see that constant's
// own note); a deep link is already somewhere.
//
// ── KEEP-IN-SYNC PAIR (§4 sharing table, the `--fade` shape) with the inline
// walk inside the <script> tools/generate-root-redirect.ts emits — the `prefs`
// loop, right under the cookie `match` in that file's `html` template. The two
// are the SAME rule read by two different runtimes: this one runs as a module
// in the visitor's browser, that one as five lines of ES5 text in a page with
// no modules at all, which is why extraction is impossible and a pointer pair
// is the answer. They cannot be allowed to disagree — a banner that suggests
// German to a visitor the root redirect would have sent to English is two
// answers to one question — so tests/unit/locale-match.test.ts runs ONE fixture
// table through BOTH: this function directly, and the tool's script extracted
// from its source text and executed. Change the rule here and that suite goes
// red until the tool's copy changes too. The tool's reciprocal pointer is
// written OUTSIDE its template literal on purpose: out/index.html's bytes are
// pinned by sha, and a comment inside the backticks would ship to visitors.
//
// ── THE `slice(0, 2)` LIMITATION, INHERITED AND RECORDED. A BCP-47 primary
// subtag can be three letters ('frr' — North Frisian, 'gsw' — Swiss German), so
// taking the first two characters TRUNCATES rather than parses: 'frr' reads as
// 'fr'. Against a manifest of five two-letter locales that can only ever
// OVER-match, and only for exotic tags — it can never miss a visitor who really
// does read one of our languages, because every one of those tags starts with
// its own two letters. The honest parse would cut at the first '-' instead; it
// is not written here because the shipped script already does it this way and
// verdict identity is worth more than a rare over-suggestion whose whole cost
// is one dismissible card. If that ever changes, it changes in both files and
// the dual-run suite is what proves it did.

import { locales, type Locale } from './locales';

/**
 * `['de-AT', 'en']` → `'de'` · `['hu', 'ro']` → `'ro'` · `['pl']` → `null`.
 *
 * The list is RANKED (that is what `navigator.languages` is), so the first hit
 * wins — a visitor whose Hungarian is first and Romanian second is offered
 * Romanian, the best of what we have, not the least of it.
 *
 * `String(entry)` is not ceremony on a typed `string`: the emitted script
 * performs exactly this coercion on an untyped browser value, and this function
 * is pinned against that script verdict-for-verdict. It also happens to be the
 * honest defence — `navigator.languages` is a live browser list, not our data.
 */
export function matchLocale(prefs: readonly string[]): Locale | null {
  for (const entry of prefs) {
    const primary = String(entry).slice(0, 2).toLowerCase();
    // `find`, where the script says `indexOf(p) !== -1`: the same test, but it
    // hands back the manifest's OWN value, so the return type is `Locale`
    // without a cast — the truncated string never escapes this loop.
    const hit = locales.find((locale) => locale === primary);
    if (hit) return hit;
  }
  return null;
}
