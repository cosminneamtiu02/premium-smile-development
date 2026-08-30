'use client';

import type { MouseEvent, ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import {
  SpeedDial,
  type SpeedDialDirection,
  type SpeedDialOption,
} from '@/components/ui/SpeedDial/SpeedDial';
import { useLanguageOptions } from './useLanguageOptions';

// sections/LanguageSwitcher — the floating language dial: the filled disc shows
// the language you are reading, and it unfolds the other four as plain links to
// the same page in that language. Built to the owner-approved design board
// .claude/plans/language-dial.plan.md (2026-08-27, D1–D17) and its section
// dossier (.claude/section-runs/2026-08-05_22-04_top-bar/sections/
// LanguageSwitcher.md); the brief clauses it exists to satisfy are §8.5 (each
// language named in itself, no flags, fully keyboard-accessible), §5 (the
// equivalent path under the target prefix) and §8.7 (the cookie, on the
// explicit click).
//
// ── ONE ELEMENT, THREE OWNERS. This file renders a single <SpeedDial> and
// nothing else, which is the whole point of the seam:
//   · the ATOM owns pixels and mechanics — the bulb, the stem, open/close, Esc,
//     the outside press, focus return, the bfcache close (D11). It is dumb by
//     construction: it has never heard of languages, URLs or cookies (D2);
//   · this SECTION owns MEANING — which five options exist, where each one
//     points, what the control is called in the page's language, and the one
//     side effect a pick has;
//   · the HOST (sections/FloatingActions) owns PLACEMENT — the corner, the
//     direction, the per-screen size steps, all as `className` (§6.4/§6.8).
// No wrapper element is added here, deliberately: a wrapper would be a box the
// host's `fixed …` className does not sit on, and the atom's root is already
// the element that must carry it.
//
// ── WHY NO <nav> LANDMARK. A landmark would have to be NAMED (an unnamed
// second navigation region is worse than none — a screen-reader user hears
// "navigation" twice and cannot tell the site nav from the language chooser),
// and that name is a sixth translated string nobody has authored. The control
// is one labelled button plus a list its aria-controls points at, which is what
// D10 decided a blind visitor should hear. PARKED as an owner question rather
// than improvised: if the answer is "yes, a landmark", it arrives with an
// owner-authored `common.language.region` key in all five files.
//
// ── 'use client' (§16). Two things force it, and nothing else: usePathname
// (the current path is not knowable at build time under `output: 'export'` —
// one HTML file per route is pre-rendered) and the cookie write, which is a
// side effect in an event handler. Both live in the smallest possible island:
// this file plus useLanguageOptions.ts.
//
// ── HYDRATION SAFETY (§16.2) — the rule that says visitor-dependent UI must
// render a neutral default and decide only after mount. Nothing here is
// visitor-dependent: the locale is fixed per pre-rendered page and the pathname
// IS the page, so every one of the five options is build-time-known, and the
// stem is always mounted and merely `inert` while closed (D8 = M). The
// pre-hydration and post-hydration documents are therefore identical, which is
// also why the four alternate-language links are in the static HTML for a
// crawler that runs no JavaScript (§10.4).

export interface LanguageSwitcherProps {
  /**
   * Which way the stem unfolds — the HOST's placement decision (D6), because
   * only the host knows which corner it put the dial in. The bottom-left corner
   * passes 'up': 'right' would run the open stem straight into the call CTA at
   * 320px. @default 'up'
   */
  direction?: SpeedDialDirection;
  /**
   * Placement plus the two public CSS variables the atom exposes — the
   * `--disc-size` steps (D16 · F2: both corners scale from one number) and
   * `--stem-inset` (how much of the viewport the extreme-zoom cap must leave
   * alone). Merged onto the dial's root, never used to restyle its internals
   * (§6.8); the section owns no margins of its own (§6.4).
   */
  className?: string;
}

export function LanguageSwitcher({
  direction = 'up',
  className,
}: LanguageSwitcherProps): ReactElement {
  const t = useTranslations('common');
  const { locale, options } = useLanguageOptions();

  // The current option's endonym, read off the list the hook already built
  // rather than indexing nativeNames again: useLocale() hands back a plain
  // `string` (the routes.ts/href.ts precedent) and a Record<Locale, string>
  // rightly refuses a string key — the two are the same datum, since every
  // option's `label` IS nativeNames[target]. If the page's locale is not in the
  // manifest at all, the raw value keeps the name honest and the atom's own dev
  // tripwire says so out loud.
  const name =
    options.find((option) => option.value === locale)?.label ?? locale;

  /**
   * THE SITE'S ONE PIECE OF STORAGE (§8.7, §12), written HERE and nowhere else,
   * on the explicit click and at no other moment — never on mount, on render,
   * on open or on close. That is what lets this site ship with no cookie-consent
   * banner at all, so the regression test for it is not pedantry.
   *
   * `NEXT_LOCALE` is the name tools/generate-root-redirect.ts reads on the next
   * visit to '/' (that script only ever READS it; this is the only writer).
   * `path=/` so it counts on every page, `max-age=31536000` = 12 months (§8.7),
   * `SameSite=Lax` so it never rides along on another site's request to us.
   *
   * A MODIFIED CLICK writes nothing. ctrl/cmd opens the option in a new tab,
   * shift in a new window, alt saves the link — in all four cases THIS document
   * stays exactly where it is, on its current language, so stamping the cookie
   * would silently re-language the visitor's next ordinary visit off an act
   * that was never a switch. The atom hands the click event along as its second
   * argument for precisely this decision (D2).
   *
   * There is no preventDefault and no navigation code: the disc is a real
   * anchor with a real href and the BROWSER performs a full document load
   * (§15.13). This handler is a side effect on the way out, nothing more.
   */
  const handleSelect = (
    option: SpeedDialOption,
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    document.cookie = `NEXT_LOCALE=${option.value}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <SpeedDial
      options={options}
      value={locale}
      size="lg"
      direction={direction}
      // §8.1: the atom never sees a key. This is the section's ONE translated
      // string — state-INVARIANT (aria-expanded carries the state) and endonym
      // first, so the visible "RO" is contained in the spoken name (SC 2.5.3,
      // D15). tests/unit/locales.test.ts pins the data half of that.
      aria-label={t('language.switch', { name })}
      onSelect={handleSelect}
      // `tone` is left at its default `ink` (D4): the bulb reads as STATE
      // ("this is what is set"), and green stays reserved for the one action
      // this site is for — the call CTA in the opposite corner (§1).
      className={className}
    />
  );
}
