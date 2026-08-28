import type { ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { LanguageSwitcher } from '@/components/sections/LanguageSwitcher/LanguageSwitcher';
import { Phone } from '@/assets/glyphs/Phone';
import { clinic } from '@/lib/clinic';

// sections/FloatingActions — the two thumb-reach controls that ride along on
// every page: the language dial (bottom-LEFT) and the call CTA (bottom-RIGHT),
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
// state. Nothing IN THIS FILE is stateful, so this section creates no client
// island of its own; it MOUNTS one — sections/LanguageSwitcher is a client
// component and carries its own directive, which is the whole shape §16 asks
// for: inert HTML everywhere, with the smallest possible island inside it.
// §8.1 holds either way — the ui/ atoms below never see a key, only finished
// text; translation happens in the SECTION tier, here and in the switcher.
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
//   a) `scroll-padding-bottom` on <html> — the same expression as the spacer
//      (WCAG technique C43), and since the corner pair gained size steps
//      (below) that means the SAME THREE STEPS, not one number:
//        base   calc(5.5rem + env(safe-area-inset-bottom))
//        xl     calc(6rem   + env(safe-area-inset-bottom))
//        2xl    calc(6.5rem + env(safe-area-inset-bottom))
//      The env() term belongs to EVERY step, exactly as it does on the spacer:
//      drop it from the upper two and a viewport-fit=cover phone under-clears
//      by the inset it lifted the controls with. It cannot be set from here:
//      §6 forbids a section styling the shell.
//   b) A page-composition rule: no standalone focusable narrower than ~72px
//      flush against the left/right margins in blocks that scroll past the
//      corners. Footer socials belong centred, or inset >= 88px.
//   c) The §9 page-tier keyboard walkthrough must tab at several SCROLL
//      POSITIONS while watching the bottom corners — not just from the top.
//
// §6.8 boundary: placement arrives from HERE as className (the parent owns
// spacing and positioning), never as a restyle of an atom's internals. The
// colors are the atoms' own — `variant="solid"` IS the look, and no color prop
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
//
// ── THE SWAP (language-dial lane, 2026-08-28 — this section's one real change
// since 08-12). The bottom-left corner used to be an inert `<p aria-hidden>`
// shaped like a control: the visual placeholder for the LanguageSwitcher, with
// a RECORDED RISK the owner accepted twice (fb-129, re-confirmed fb-136 after
// the G2 a11y review) — it looked pressable and did nothing, so a visitor on a
// language they cannot read tapped the only language-suggesting thing on screen
// and got silence. That risk CLOSES here: the corner is now the real
// <LanguageSwitcher>, a labelled button that unfolds four plain links to the
// same page in the other four languages (§8.5, §5). The `<p>` is gone; the
// promise its comment made — "the fix is Phase 3 shipping the switcher, which
// turns this <p> into a real <button> with a real name" — is what shipped.
//
// WHO OWNS WHAT, restated because this corner now has three owners: this
// section owns PLACEMENT (which corner, which `direction`, which size steps);
// sections/LanguageSwitcher owns MEANING (the five options, the hrefs, the one
// cookie); ui/SpeedDial owns PIXELS and open/close. Nothing about languages is
// decided in this file, and nothing about placement is decided in theirs.

// ── ONE NUMBER, BOTH CORNERS (board D16 · F2, owner-decided fb-295). The size
// steps live HERE because this repo puts screen decisions in sections, never in
// atoms (§6.5: an atom never reads the screen — GlyphButton's own comment says
// "no sm: self-scaling inside an atom"). Both discs read the same variable
// through ui/disc.ts, so the pair cannot drift: a 72px language bulb beside a
// 56px call button would stop reading as one row.
//   < xl  56px — today's approved corner, unchanged on phone and tablet
//   xl    64px — notebooks (1280–1535)
//   2xl   72px — laptop · desktop · TV (>= 1536)
// The base step is spelled out rather than left to the atom's `size` fallback
// (which is the same 3.5rem) so that BOTH corners carry the identical token
// list and the test can compare the two strings instead of trusting a default.
const discSteps =
  '[--disc-size:3.5rem] xl:[--disc-size:4rem] 2xl:[--disc-size:4.5rem]';

// The shared bottom edge — the "one row" contract: two corners are only a pair
// if they sit on the same line.
const cornerBottom = 'bottom-[calc(1rem+env(safe-area-inset-bottom))]';

// THE LANGUAGE CORNER. `direction="up"` is passed as a prop, not a class: at
// 320px a `right` stem would run straight into the call CTA (D6).
//
// `--stem-inset` is the atom's second public variable: how much of the viewport
// its extreme-zoom cap must leave alone, measured from the BULB'S CENTRE (the
// atom adds the half-bulb itself). Only the host knows the number, so the host
// does the arithmetic — and it is 6rem + the safe area:
//   1rem  this corner's own offset from the bottom edge (cornerBottom), plus
//         env(safe-area-inset-bottom), because the bulb was lifted by it;
//   5rem  the Header pill's REACH — `sticky top-4` + `h-16` (Header.tsx's mount
//         contract, which books the very same 5rem for the shell's
//         `scroll-padding-top`). The bar is blurred glass and always on top, so
//         an `up` stem tall enough to reach it would put discs behind it.
// At ordinary zoom the stem is far shorter than the cap and nothing is clipped;
// past ~300% the cap turns the capsule into its own scroll box instead of
// letting it climb behind the sticky pill or off the top of the viewport
// (SC 1.4.10 / 2.4.11).
const languageCorner =
  `fixed ${cornerBottom} left-4 z-40 ${discSteps} ` +
  '[--stem-inset:calc(6rem+env(safe-area-inset-bottom))]';

// THE CALL CORNER — the same bottom edge, the same size steps. GlyphButton's
// `lg` box reads --disc-size through ui/disc.ts and its glyph follows at half
// the box, so the phone icon does not stay small inside a bigger disc.
const callCorner = `fixed ${cornerBottom} right-4 z-40 ${discSteps}`;

// The clearance, one step per size step: the control + its own 1rem offset +
// 1rem of breathing room, plus the same safe-area inset the controls were
// lifted by (3.5 + 1 + 1 = 5.5 · 4 + 1 + 1 = 6 · 4.5 + 1 + 1 = 6.5).
// aria-hidden because it is empty geometry: an unlabelled empty box is noise in
// the a11y tree.
const spacerClasses =
  'h-[calc(5.5rem+env(safe-area-inset-bottom))] ' +
  'xl:h-[calc(6rem+env(safe-area-inset-bottom))] ' +
  '2xl:h-[calc(6.5rem+env(safe-area-inset-bottom))]';

export function FloatingActions(): ReactElement {
  const t = useTranslations('common');

  return (
    <>
      <LanguageSwitcher direction="up" className={languageCorner} />

      {/* The one conversion goal of the entire site (§1): tap-to-call. An
          anchor, not a button — it navigates (tel:), so asChild hands the <a>
          the circle's clothes and the accessible name. size="lg" = 3.5rem, the
          §9 primary-CTA target. The number comes from lib/clinic.ts, the single
          source of NAP (§10.1), where it is still a TODO(owner) placeholder.
          <Phone /> stays UNLABELLED: a labelled glyph inside an asChild anchor
          double-announces (see the `children` prop doc in ui/GlyphButton). */}
      <GlyphButton
        asChild
        variant="solid"
        shape="round"
        size="lg"
        aria-label={t('actions.call')}
        className={callCorner}
      >
        <a href={`tel:${clinic.phone}`}>
          <Phone />
        </a>
      </GlyphButton>

      <div aria-hidden="true" className={spacerClasses} />
    </>
  );
}
