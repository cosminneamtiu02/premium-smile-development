'use client';

import { createElement, type ReactElement } from 'react';
import { useLocale } from 'next-intl';
import { FranceFlag } from '@/assets/flags/FranceFlag';
import { GermanyFlag } from '@/assets/flags/GermanyFlag';
import { ItalyFlag } from '@/assets/flags/ItalyFlag';
import { RomaniaFlag } from '@/assets/flags/RomaniaFlag';
import { UnitedKingdomFlag } from '@/assets/flags/UnitedKingdomFlag';
import type { SpeedDialOption } from '@/components/ui/SpeedDial/SpeedDial';
import { localeHref } from '@/i18n/href';
import { locales, type Locale, nativeNames } from '@/i18n/locales';
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
// itself, never translated (§8.5, src/i18n/locales.ts) — and the href is a URL.
// Since the owner's 2026-09-04 amendment of §8.5 each option ALSO carries
// decorative flag art (FLAG_ART below): the flag rides the option as a
// background the atom hides from the a11y tree, while the NAME stays the
// endonym and the visible text stays the code — "no flags-as-languages" keeps
// its meaning, that no flag may ever be the only way a language is identified.
// The section's one translated string, the bulb's name, is built one file over,
// where t() belongs.

/**
 * THE ONE MAPPING of a locale to its flag, module-scope and static — five
 * elements built once at import, not five per render (they carry no props and
 * never change, so a new element every render would be churn with no meaning).
 *
 * The owner's picks, verbatim (2026-09-04): the UNION JACK for `en` — "for
 * english the english flag so not usa" → "go with union jack" — and Germany's
 * for `de`. `Record<Locale, …>` is the fence: a sixth locale in the manifest
 * stops this file typechecking until it has a flag, which is the same
 * completeness promise `nativeNames` makes for endonyms.
 *
 * These are DECORATION. The identification is the endonym + the visible code
 * (§8.5 as amended); ui/SpeedDial takes the node, clips it to the disc, scrims
 * it and marks it aria-hidden, so nothing here ever reaches a screen reader.
 *
 * `createElement`, not `<RomaniaFlag />`, for one boring reason: this is a
 * hook module — a `.ts` file, where JSX does not compile — and its whole
 * charter is data, not markup; the extension is that signal. A `.tsx` rename
 * would break no import (the section's specifier is extensionless) — it would
 * only trade the signal for sugar that adds nothing here: with no props and
 * no children, JSX compiles to exactly this call. One caveat the types do not
 * catch (probed at G2): `createElement(Comp)` with the props argument OMITTED
 * compiles even if Comp ever grew a required prop, where JSX would error —
 * fenced by the flags folder law, which forbids required props by
 * construction (G2 ts+react LOW, folded 2026-09-05).
 */
const FLAG_ART: Record<Locale, ReactElement> = {
  ro: createElement(RomaniaFlag),
  en: createElement(UnitedKingdomFlag),
  de: createElement(GermanyFlag),
  fr: createElement(FranceFlag),
  it: createElement(ItalyFlag),
};

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
    // The country flag BEHIND the code — decoration the atom hides, clips and
    // scrims (owner 2026-09-04, board .claude/plans/speed-dial-flags.plan.md;
    // §8.5 amended the same day). It rides the option because the atom must
    // stay dumb: SpeedDial dresses a ReactNode, and only this file knows that
    // this particular node is Romania's flag.
    art: FLAG_ART[target],
  }));

  return { locale, options };
}
