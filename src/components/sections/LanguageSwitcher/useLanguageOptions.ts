'use client';

import { useLocale } from 'next-intl';
import type { SpeedDialOption } from '@/components/ui/SpeedDial/SpeedDial';
import { localeHref } from '@/i18n/href';
import { locales, nativeNames } from '@/i18n/locales';
import { usePathname } from '@/i18n/navigation';
import { equivalentPath } from '@/lib/routes';

// sections/LanguageSwitcher — the hook that turns the locale manifest into the
// five discs of the dial: each one already knowing what it prints, what it is
// called, what language it is IN, and the finished URL a plain anchor can
// carry (§15.13 — there is no <Link> left to finish one).
//
// A hook FILE beside the component, named for exactly what it exports: the
// useNavItems.ts play (itself the ui/slot.ts play, fb-64). Two reasons it is
// not simply inlined in LanguageSwitcher.tsx, both the same ones that split
// useNavItems out of HeaderNav:
//  · the component then reads as what it is — one atom, one translated string,
//    one side effect — and the DATA question ("which five links, pointing
//    where") is answered in one place, where a future sixth locale or a second
//    ro-only route is a diff of a few lines with its own tests;
//  · it draws the client boundary at the honest place. Everything here is pure
//    except the two hooks, and only one of them, usePathname, actually needs
//    the browser: under static export (§16) the current path is not knowable at
//    build time, because one HTML file per route is pre-rendered and the thing
//    that reports where you are lives in the visitor's browser.
//
// §8.1 holds: nothing here calls t() and nothing here IS translated. A code is
// derived (`'de'.toUpperCase()`), an endonym is DATA — every language named in
// itself, never translated, never a flag (§8.5, src/i18n/locales.ts) — and the
// href is a URL. The section's one translated string, the bulb's name, is
// built one file over, where t() belongs.

/**
 * The five options in `locales` manifest order — the CURRENT one included, on
 * purpose: ui/SpeedDial filters it out of the stem and puts it in the bulb
 * (board D1 = model C, `.claude/plans/language-dial.plan.md`). Handing the atom
 * a pre-filtered list would mean the section decides the geometry, which is
 * exactly the seam the board drew the other way round.
 *
 * `locale` comes back beside them because both callers need it and asking
 * next-intl twice for the same fact invites the two answers to be compared.
 * It is a plain `string`, which is what useLocale() hands back under the
 * default config — the src/lib/routes.ts and src/i18n/href.ts precedent: the
 * Locale union does its work on the DATA side (locales, nativeNames), where a
 * rename must not go unnoticed.
 *
 * Deliberately NOT memoised. It is five objects built from two strings; a
 * useMemo would cost a dependency array to keep honest and save nothing
 * measurable — and ui/SpeedDial re-derives bulb and stem from `options` on
 * every render anyway, for the same reason.
 */
export function useLanguageOptions(): {
  locale: string;
  options: readonly SpeedDialOption[];
} {
  const locale = useLocale();
  // Locale-STRIPPED ('/ro/services/' → '/services/'), which is the shape both
  // halves below need: equivalentPath compares it against lib/routes.ts' rows,
  // and localeHref puts a — possibly different — prefix back on.
  const pathname = usePathname();

  const options = locales.map((target) => ({
    // The unique identifier, never printed: what the atom compares `value`
    // against and what comes back to the section's onSelect (board D2).
    value: target,
    // Uppercased in JS, never with a CSS `uppercase` utility (fb-133): a CSS
    // transform paints one thing and leaves another in the DOM, and the DOM is
    // what a screen reader announces, what a voice-control engine matches
    // against, and what SC 2.5.3 compares to the accessible name. Here they are
    // the same string by construction.
    code: target.toUpperCase(),
    // The endonym — 'Deutsch', not 'German' (§8.5). Static data: it is the same
    // word on all five language versions of the site.
    label: nativeNames[target],
    // The label's OWN language → `lang` on the disc and `hreflang` on the
    // anchor, so a screen reader switches voice to say "Français" in French and
    // a crawler learns this is the German edition of the page (§10.4).
    lang: target,
    // The FINAL href: locale prefix, trailing slash and interim base path all
    // already in it (localeHref), pointing at the same page over there or at
    // that locale's home when the page does not exist there (equivalentPath,
    // §5 — the blog is Romanian-only).
    href: localeHref(target, equivalentPath(pathname, target)),
  }));

  return { locale, options };
}
