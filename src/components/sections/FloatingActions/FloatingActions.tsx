import type { ReactElement } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { Icon } from '@/components/ui/Icon/Icon';
import { clinic } from '@/lib/clinic';

// sections/FloatingActions — the two thumb-reach controls that ride along on
// every page: the language pill (bottom-LEFT) and the call CTA (bottom-RIGHT),
// plus the clearance spacer that keeps them off the last line of content.
// Built to the owner-approved plan-canvas contract fb-131…fb-134 (2026-08-12).
//
// This is the FIRST section in the repo, so it sets three precedents that every
// later section copies. They are written out in full here on purpose.
//
// ── 1. It calls t() and still carries NO 'use client'.
// next-intl's useTranslations/useLocale are ISOMORPHIC hooks: in the real build
// they resolve against the request-scoped config while this Server Component is
// pre-rendered (§16 — every locale × route becomes complete static HTML with
// the translations already baked into the markup), and in Storybook/Vitest they
// read the NextIntlClientProvider context instead. The shell's `getTranslations`
// (next-intl/server) is async and server-only: it would work in the build and
// NOWHERE else, leaving this section un-storyable — and §13 requires a story per
// state. Nothing here is stateful, so no client island is created (§16): the
// section ships as inert HTML with zero JavaScript attached.
// §8.1 holds either way — the ui/ atoms below never see a key, only finished
// text; translation happens HERE, in the section tier.
//
// ── 2. A FRAGMENT of exactly three siblings, never a wrapper element.
// A wrapper carrying the z-40 layer would have to be positioned for z-index to
// apply at all, and a positioned + z-indexed box opens a STACKING CONTEXT that
// traps both controls inside it — the layer would then be judged as one unit
// against future overlays (drawer, modal) instead of each control standing on
// its own. A full-width `fixed` wrapper would additionally swallow every click
// in the strip it covers, curable only by patching pointer-events-none onto the
// wrapper and pointer-events-auto back onto each child. Two independent
// `fixed z-40` siblings need none of that plumbing.
//
// ── 3. The spacer only works if this section mounts AFTER {children} and the
// footer inside <body> — that is the Phase 4 mount contract. It is the last box
// in normal flow, so its height is the only thing standing between the two
// fixed controls and the final line of page content, at 320px too (§7, §9
// reflow). Mounted anywhere else it would clear a gap in the middle of nothing.
//
// THE MOUNT CONTRACT CARRIES THREE MORE OBLIGATIONS — SC 2.4.11 Focus Not
// Obscured (Minimum), AA and new in WCAG 2.2 (G2 a11y review, 2026-08-12). The
// spacer is NECESSARY BUT NOT SUFFICIENT: it guarantees the document END can
// always be scrolled clear, without which any focusable in the last line would
// be permanently obscured. It does nothing for a focusable that is ALREADY in
// view behind one of the discs — the CSSOM considers it visible, so Tab
// triggers no scroll and the control plus its focus ring sits 100% behind
// opaque paint. Not hypothetical: GlyphButton's header names the footer
// socials as a planned use, i.e. 44px controls that will pass through the
// bottom-corner bands on every scroll. What Phase 4 owes:
//   a) `scroll-padding-bottom: calc(5.5rem + env(safe-area-inset-bottom))` on
//      <html> — the same expression as the spacer (WCAG technique C43). It
//      cannot be set from here: §6 forbids a section styling the shell.
//   b) A page-composition rule: no standalone focusable narrower than ~72px
//      flush against the left/right margins in blocks that scroll past the
//      corners. Footer socials belong centred, or inset >= 88px.
//   c) The §9 page-tier keyboard walkthrough must tab at several SCROLL
//      POSITIONS while watching the bottom corners — not just from the top.
//
// §6.8 boundary: placement arrives from HERE as className (the parent owns
// spacing and positioning), never as a restyle of GlyphButton's internals. The
// colors are the atom's own — `variant="solid"` IS the look, and no color prop
// exists to pass (Wave-1 constraint).
//
// Both controls sit 1rem above the bottom edge PLUS the device's safe-area
// inset, and the spacer adds the same inset back, so the clearance grows by
// exactly as much as the controls were lifted.
// CAVEAT, so nobody files a false bug: env(safe-area-inset-bottom) resolves to
// 0px until a page opts in with viewport-fit=cover, and the shell does not set
// it today (there is no `export const viewport` in app/). So on an iPhone the
// calc currently collapses to a plain 1rem — harmless, because without the
// opt-in the UA already keeps the layout viewport inside the safe area. The
// term is here for the moment Phase 4 ships `viewport: { viewportFit: 'cover' }`
// (which a full-bleed hero will want); it is forward-compatible, not active.

// The language pill — a purely visual PLACEHOLDER for the LanguageSwitcher that
// lands in Phase 3 (§8.5). Inert BY CONSTRUCTION: a plain <p>, no role, no
// handler, no href, no tab stop. Three decisions are frozen into it:
//
//  · aria-hidden — <html lang> already tells assistive tech the page language,
//    authoritatively and in the form screen readers act on. A two-letter badge
//    repeats that as an abbreviation they mispronounce, and it carries nothing
//    actionable, so hiding it removes NOISE rather than information.
//  · the code is uppercased in JS (see the render below), never with a CSS
//    `uppercase` utility: the DOM text must equal the visible text.
//  · NO chevron (fb-134). A ▸ is the visual grammar for "opens a list" and
//    would tell sighted users exactly the lie the missing button role refuses
//    to tell screen-reader users.
//
// size-14 (3.5rem) matches the CTA's lg box, so the two corners read as one
// row; rem sizing keeps the whole pair scaling with browser zoom (§7). The
// paint is semantic tokens only (§3 standing note) — never a primitive.
//
// RECORDED RISK, owner-decided twice (fb-129, re-confirmed fb-136 after the G2
// a11y review raised it): this disc's silhouette is class-for-class the
// silhouette of a LIVE control — GlyphButton variant="outline" shape="round"
// size="lg" shares inline-flex / size-14 / items-center / justify-center /
// rounded-full / border / bg-surface, and only the COLOUR tokens differ. So it
// looks pressable while doing nothing, and it sits mirror-opposite a real
// button of the same family. The review's scenario: a foreign-language visitor
// on a locale they cannot read taps the only language-suggesting thing on
// screen and gets silence.
// The owner's call, and the reasoning behind it: this IS the language button —
// only the swapping behaviour is deferred (§15.12 / ledger "Future: the full
// LanguageSwitcher"). The disc is therefore the intended FINAL look, inert for
// one phase, and the real switcher lands before the clinic's domain is
// attached (until then everything is NOINDEX=1, §15.2 — no patient reaches it).
// DO NOT "fix" this by restyling the pill; the fix is Phase 3 shipping the
// switcher, which turns this <p> into a real <button> with a real name.
const pillClasses =
  'fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-40 ' +
  'inline-flex size-14 items-center justify-center ' +
  'rounded-full border border-line bg-surface ' +
  'font-mono text-base font-medium tracking-wide text-ink';

// 5.5rem = the 3.5rem control + its 1rem offset + 1rem of breathing room, plus
// the same safe-area inset the controls were lifted by. aria-hidden because it
// is empty geometry: an unlabelled empty box is noise in the a11y tree.
const spacerClasses = 'h-[calc(5.5rem+env(safe-area-inset-bottom))]';

export function FloatingActions(): ReactElement {
  const t = useTranslations('common');
  // NOT a hardcoded "RO" (fb-133): a fixed badge would claim "you are reading
  // Romanian" on /de, /en, /fr and /it. toUpperCase() runs in JS, so the text
  // node itself is "DE" — what sits in the DOM is what sits on screen.
  const locale = useLocale();

  return (
    <>
      <p aria-hidden="true" className={pillClasses}>
        {locale.toUpperCase()}
      </p>

      {/* The one conversion goal of the entire site (§1): tap-to-call. An
          anchor, not a button — it navigates (tel:), so asChild hands the <a>
          the circle's clothes and the accessible name. size="lg" = 3.5rem, the
          §9 primary-CTA target. The number comes from lib/clinic.ts, the single
          source of NAP (§10.1), where it is still a TODO(owner) placeholder.
          <Icon> stays UNLABELLED: a labelled icon inside an asChild anchor
          double-announces (see the `children` prop doc in ui/GlyphButton). */}
      <GlyphButton
        asChild
        variant="solid"
        shape="round"
        size="lg"
        aria-label={t('actions.call')}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40"
      >
        <a href={`tel:${clinic.phone}`}>
          <Icon name="phone" />
        </a>
      </GlyphButton>

      <div aria-hidden="true" className={spacerClasses} />
    </>
  );
}
