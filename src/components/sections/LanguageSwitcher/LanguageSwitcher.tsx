'use client';

import type { MouseEvent, ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import {
  SpeedDial,
  type SpeedDialDirection,
  type SpeedDialOption,
} from '@/components/ui/SpeedDial/SpeedDial';
import { LOCALE_COOKIE } from '@/i18n/locales';
import { cx } from '@/lib/cx';
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
// ── ONE LANDMARK AROUND ONE CONTROL, THREE OWNERS. This file renders a <nav>
// wrapping a single <SpeedDial> and nothing else, which is the whole point of
// the seam:
//   · the ATOM owns pixels and mechanics — the bulb, the stem, open/close, Esc,
//     the outside press, focus return, the bfcache close (D11). It is dumb by
//     construction: it has never heard of languages, URLs or cookies (D2);
//   · this SECTION owns MEANING — which five options exist, where each one
//     points, what the control AND ITS REGION are called in the page's
//     language, and the one side effect a pick has;
//   · the HOST (sections/FloatingActions) owns PLACEMENT — the corner, the
//     direction, the per-screen size steps, all as `className` (§6.4/§6.8).
//
// ── WHY THE <nav> LANDMARK EXISTS (owner-decided 2026-08-28, on the G2 a11y
// review's recommendation; it was a parked question until then). A LANDMARK is
// a region a screen-reader user can jump to from a list — the equivalent of a
// sighted visitor's eye going straight to a corner. Until this change the dial
// had none, and it is the LAST node of the document (FloatingActions' mount
// contract puts it after {children} and the footer), so the one control that
// helps a visitor who cannot read the page sat behind everything, reachable
// only by walking the whole document. Nothing in WCAG requires the landmark and
// no gate here could have caught its absence — axe's `region` rule is disabled
// in component testing — which is exactly why it had to be decided rather than
// discovered.
//
// THE NAME IS ITS OWN KEY, `common.language.region` („Limbă" · "Language" ·
// „Sprache" · « Langue » · «Lingua»), and deliberately not the bulb's
// `language.switch`:
//   · a landmark's name names the REGION, not the control inside it. Reusing
//     the bulb's string would make a screen reader say "Română, schimbă limba,
//     navigation" and then, one Tab later, "Română, schimbă limba, button" —
//     the same sentence twice, which is noise rather than orientation;
//   · the name must NOT contain the role word: screen readers append
//     "navigation" themselves, so „Navigare limbă" would come out as "Navigare
//     limbă, navigation". One noun is the whole name.
// The site now has three navigation landmarks — the Header's bar, the Footer's
// site map, and this — each with a distinct name, which is the documented
// requirement the moment a page has more than one.
//
// ── WHY THE <nav>, NOT THE ATOM'S ROOT, CARRIES `className`. The host's string
// is placement (`fixed … left-4 z-40`) plus two CSS variables, and placement
// belongs to the OUTERMOST box this section renders. `--disc-size` and
// `--stem-inset` are CUSTOM PROPERTIES, so they inherit down the tree like a
// font: the atom reads them off the <nav> exactly as it used to read them off
// its own root, and not a pixel of the dial moves. The `inline-flex` below is
// not decoration either — a bare <nav> is a BLOCK box, and an inline-level
// child (the atom's root is `inline-flex`) sits on a text baseline, which adds
// descender space underneath; with the box anchored by `bottom` that space
// would lift the whole corner a few pixels. A flex container wraps its child
// exactly, so the visual net stays at zero diffs.
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
   * alone). Merged onto this section's OUTERMOST box, the <nav> landmark, from
   * where both variables inherit into the dial; never used to restyle an
   * atom's internals (§6.8), and the section owns no margins of its own (§6.4).
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
   * `LOCALE_COOKIE` (from `@/i18n/locales`) is the ONE spelling of the name,
   * and the coupling is now the shared constant rather than two files agreeing
   * in prose: tools/generate-root-redirect.ts interpolates the SAME constant
   * into the inline script it emits, which reads the cookie on the next visit
   * to '/' (that script only ever READS it; this is the only writer).
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
    document.cookie = `${LOCALE_COOKIE}=${option.value}; path=/; max-age=31536000; SameSite=Lax; Secure`;
  };

  return (
    // §8.1: the atoms never see a key. BOTH translated strings are resolved
    // here, in the section tier — the region's one-noun name and the bulb's.
    <nav
      aria-label={t('language.region')}
      className={cx('inline-flex', className)}
    >
      <SpeedDial
        options={options}
        value={locale}
        size="lg"
        direction={direction}
        // The section's other translated string — state-INVARIANT
        // (aria-expanded carries the state) and endonym first, so the visible
        // "RO" is contained in the spoken name (SC 2.5.3, D15).
        // tests/unit/locales.test.ts pins the data half of that.
        aria-label={t('language.switch', { name })}
        onSelect={handleSelect}
        // ── D4 REVERSED BY THE OWNER, 2026-09-04. The original decision left
        // `tone` at the atom's default `ink`: the bulb would read as STATE
        // ("this is what is set") and green would stay reserved for the one
        // action this site is for — the call CTA in the opposite corner (§1).
        // The owner overruled that from the live export, on the ground D4 never
        // weighed: the two corners are a PAIR (FloatingActions' "one row"
        // contract gives them one bottom edge and one `--disc-size`), and a
        // filled-dark bulb beside a filled-green disc read as two unrelated
        // controls — "at rest phone and language switcher to be same color …
        // on hover of the language switcher button to have a hover animation
        // like the phone button has".
        // `cta` buys BOTH halves at once, by construction rather than by
        // copying: SpeedDial's `cta` toneClasses ARE GlyphButton solid's
        // measured pair (bg-cta text-ink-inverse · hover/active bg-cta-hover —
        // white over #008854 → #006b42, 4.52:1 → 6.60:1, recorded in both
        // files), and the fade is the shared `discTransition` family the call
        // disc already plays, so rest colour AND hover manner match without a
        // single value being re-typed here.
        // The tone still STOPS AT THE BULB — the stem keeps its ghost manner in
        // every tone since the owner's 2026-08-27 reversal of D5 — so this
        // changes one disc, not five.
        tone="cta"
      />
    </nav>
  );
}
