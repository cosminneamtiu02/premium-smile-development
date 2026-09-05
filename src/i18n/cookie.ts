// THE writer of the site's one piece of storage (§8.7, §12) — one line, one
// place. Until 2026-09-04 that line lived inside sections/LanguageSwitcher's
// `handleSelect`, which was correct while the switcher was the only thing on
// the site that could ever set it; sections/LanguageBanner is the second
// consumer (its accept link and its dismiss button both write it, D2), so the
// MECHANICS move to the nearest tier both may import and the POLICY stays where
// it was (§4 sharing table, row 1 — the `ui/slot.ts` / `lib/routes.ts` shape).
//
// What moved and what did not, precisely:
//   · MOVED: the attribute string. `path=/` so the choice counts on every page,
//     `max-age=31536000` = 12 months (§8.7), `SameSite=Lax` so it never rides
//     along on another site's request to us, `Secure` so it only ever travels
//     over HTTPS (§15.14, owner 2026-09-01 — localhost is a secure context, so
//     development is unchanged). One spelling now, not two agreeing ones.
//   · STAYED IN THE SWITCHER: the modified-click guard. ctrl/cmd/shift/alt
//     leaves THIS document where it is, so no choice was made — that is a
//     judgement about what a click MEANS, not about how a cookie is written,
//     and a helper that decided it for every caller would be deciding policy
//     for callers it has never met (the banner's accept, for one, is a plain
//     press).
//
// ── WHY HERE, IN src/i18n/, AND NOT src/lib/. It interpolates LOCALE_COOKIE
// from ./locales, the locale manifest, and writing the language choice IS
// locale work — the same argument href.ts makes for living beside the data it
// shapes. lib/cx.ts' two-question home test agrees from the other side: this
// neither imports React nor encodes an atom's look, so lib/ would take it — but
// i18n/ is where its one datum lives, and the ring's modules are importable
// from every tier either way (§4).
//
// ── NO 'use client'. This is a plain DOM function, not a component: nothing
// here hooks, renders or holds state, and `document` is simply the thing it
// writes to. Islandness belongs to the IMPORTER — sections/LanguageSwitcher and
// sections/LanguageBanner each carry their own directive — which is exactly the
// shape lib/scroll-lock.ts already ships.
//
// ── THE READER IS STILL SOMEWHERE ELSE, and stays there: the inline script
// tools/generate-root-redirect.ts emits into out/index.html interpolates the
// SAME constant into its cookie regex at build time. Nothing on the site reads
// this cookie back at runtime; the banner asks only whether the name is
// PRESENT. Tests and stories keep asserting the LITERAL 'NEXT_LOCALE' from the
// outside (the #62 tripwire convention) — never rewire them to import the
// constant, or the tripwire watches itself.

import { LOCALE_COOKIE } from './locales';

/**
 * Store the visitor's explicit language choice — and ONLY ever on an explicit
 * choice (§8.7): a click on a switcher disc, on the banner's accept link, or on
 * the banner's dismiss button, which stores the page's OWN locale because "I am
 * fine here" is a choice too (D2). Never on mount, never on render, never on
 * open or close. That restraint is the whole reason this site ships with no
 * cookie-consent banner (§12), so the switcher's byte-exact regression test —
 * `LanguageSwitcher.test.tsx`, "writes it EXACTLY once, with exactly the agreed
 * attributes" — pins this string from the outside and is not pedantry.
 *
 * `locale: string`, not the `Locale` union, deliberately: `useLocale()` hands
 * back a plain string and both callers pass one straight through — the
 * `localeHref` / `primaryRoutes(locale: string)` precedent. The union does its
 * work on the DATA side (locales, nativeNames), where a rename must not go
 * unnoticed; here the value is on its way OUT of the program.
 *
 * Recorded and deliberately not "fixed": Safari's ITP caps any JS-written
 * cookie at ~7 days whatever `max-age` says, so the choice simply re-asks
 * sooner on iPhones (§15.14). A second storage to work around it is banned by
 * §12 — there is nothing to repair here.
 */
export function setLocaleCookie(locale: string): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax; Secure`;
}
