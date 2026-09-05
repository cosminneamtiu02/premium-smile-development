import type { ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { LanguageSwitcher } from '@/components/sections/LanguageSwitcher/LanguageSwitcher';
import { Phone } from '@/assets/glyphs/Phone';
import { Whatsapp } from '@/assets/glyphs/Whatsapp';
import { clinic } from '@/lib/clinic';

// sections/FloatingActions — the thumb-reach controls that ride along on every
// page: the language dial (bottom-LEFT) and, in the bottom-RIGHT corner, the
// WhatsApp disc stacked above the call CTA.
// Built to the owner-approved plan-canvas contract fb-131…fb-134 (2026-08-12),
// whose THIRD child — a clearance spacer — was removed on 2026-09-04; see the
// dedicated block below.
//
// ── THE RIGHT CORNER IS A STACKED PAIR (owner, fb-353, 2026-09-04). It carried
// one disc until the two-channel rework: the same day the ContactModal gained
// its WhatsApp channel, the corner gained a WhatsApp disc directly above the
// phone. This AMENDS the 2026-09-02 contact-touchpoints decision, whose line
// was "the footer is the WhatsApp home" — the Footer's contact discs stay
// exactly as they are, and the corner now offers the same conversation without
// a scroll to the bottom of the page. What did NOT change is the ban that
// decision exists for: both discs ACT DIRECTLY (tap = call, tap = open the
// conversation) and neither opens a modal — a WhatsApp modal would be the third
// stateful overlay §15.15 is deliberately WAITing for, bought for nothing.
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
// ── 2. A FRAGMENT of independent siblings, never a wrapper element — three of
// them since fb-353, and the LACK of a wrapper is the rule, not the count.
// A wrapper carrying the z-40 layer would have to be positioned for z-index to
// apply at all, and a positioned + z-indexed box opens a STACKING CONTEXT that
// traps every control inside it — the layer would then be judged as one unit
// against future overlays (drawer, modal) instead of each control standing on
// its own. A full-width `fixed` wrapper would additionally swallow every click
// in the strip it covers, curable only by patching pointer-events-none onto the
// wrapper and pointer-events-auto back onto each child. Independent
// `fixed z-40` siblings need none of that plumbing — including the stacked
// pair, which is two siblings sitting on two offsets rather than a flex column,
// for exactly the same reason.
// DOM ORDER IS THE VISUAL ORDER, deliberately: dial · WhatsApp · phone, i.e.
// the right corner read top-to-bottom. Tab therefore walks that corner
// downward, the way it looks, instead of jumping from the phone up to the disc
// above it (§9's "logical order" applied to a corner rather than to a page).
//
// ── 3. THE CLEARANCE SPACER IS GONE — owner decision, 2026-09-04, reversing
// the spacer half of fb-131…fb-134.
// It was a third Fragment child, `aria-hidden`, of exactly the two controls'
// reach (5.5 / 6 / 6.5rem + the safe area), whose only job was to sit last in
// normal flow so the final line of page content could never end up under a
// disc. The owner removed it from the live export on the ground the arithmetic
// never modelled: "i do not need that empty space below the footer as the
// buttons for language and phone do not cover info/anything clickable in the
// footer". That is a claim about WHAT IS IN THE CORNERS, and it is true by
// construction here — the Footer's bottom band is its legal strip, which is
// centred below @3xl and inset >= 88px above (Footer Row 3's own comment cites
// obligation (b) below as the reason), so the two bands cover page GROUND and
// nothing operable. The cost of keeping it was a screen-height strip of blank
// page under every footer on every route.
//
// WHAT THAT SHIFTS ONTO THE REMAINING THREE OBLIGATIONS — SC 2.4.11 Focus Not
// Obscured (Minimum), AA and new in WCAG 2.2 (G2 a11y review, 2026-08-12). The
// spacer was NECESSARY BUT NOT SUFFICIENT even when it existed: it guaranteed
// the document END could be scrolled clear, and did nothing for a focusable
// ALREADY in view behind a disc — the CSSOM considers that one visible, so Tab
// triggers no scroll and the control plus its focus ring sits 100% behind
// opaque paint. Removing it does not create that gap; it removes the half that
// was already the weaker one, and makes (b) and (c) LOAD-BEARING rather than
// belt-and-braces:
//   a) `scroll-padding-bottom` on <html> — KEPT, and now the whole of the
//      scroll-clearance story rather than the invisible half of a pair (WCAG
//      technique C43). Still THREE STEPS, because the corners grow with the
//      screen — and each step GREW by a disc plus the row gap on 2026-09-04,
//      when the right corner became a stacked pair (fb-353): the deepest thing
//      the page must be able to scroll clear of is now two discs, not one.
//        base   calc(9.5rem  + env(safe-area-inset-bottom))
//        xl     calc(10.5rem + env(safe-area-inset-bottom))
//        2xl    calc(11.5rem + env(safe-area-inset-bottom))
//      Each is: 1rem corner offset + disc + 0.5rem stack gap + disc + 1rem
//      headroom, at that width's --disc-size (3.5 / 4 / 4.5rem).
//      The env() term belongs to EVERY step: drop it from the upper two and a
//      viewport-fit=cover phone under-clears by the inset it lifted the
//      controls with. It cannot be set from here — §6 forbids a section styling
//      the shell — and it lives in globals.css' base layer, which carries the
//      reversal in its own comment.
//   b) A page-composition rule, NOW THE PRIMARY GUARANTEE: no standalone
//      focusable narrower than ~72px flush against the left/right margins in
//      blocks that scroll past the corners. Footer socials belong centred, or
//      inset >= 88px. This is precisely the rule the owner's "nothing clickable
//      is under them" relies on, so it stops being advice and becomes the thing
//      that makes the removal safe. MIGRATION_PLAYBOOK's mount-contract box 5
//      is the standing entry; every page lane carries it.
//   c) The §9 page-tier keyboard walkthrough must tab at several SCROLL
//      POSITIONS while watching the bottom corners — not just from the top.
//      Same promotion: with no spacer, this walk is how a violation is found.
//
// §6.8 boundary: placement arrives from HERE as className (the parent owns
// spacing and positioning), never as a restyle of an atom's internals. The
// colors are the atoms' own — `variant="solid"` IS the look, and no color prop
// exists to pass (Wave-1 constraint).
//
// Both controls sit 1rem above the bottom edge PLUS the device's safe-area
// inset, and every `scroll-padding-bottom` step adds the same inset back, so
// the scroll clearance grows by exactly as much as the controls were lifted.
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

// ── THE AURA ON THE CORNER (owner, 2026-09-05: "implement that aura on the
// buttons for calling and whatsapp and for the language switcher, so all
// items on fixed hover overlay"). Every PERMANENT resident of this fixed
// layer wears the Header pill's `shadow-aura` (globals.css tells the token's
// whole story), by two routes that are really one decision:
//   · the two GlyphButton discs take the utility straight through their
//     className merge (§6.8 — it lands on the round <a> itself, so the glow
//     follows the circle);
//   · the dial takes it through ui/SpeedDial's `--bulb-shadow` public
//     variable — className would MISS the bulb, because the host string parks
//     on the switcher's <nav> and the atom's root is a square box around a
//     round bulb. The custom property inherits from the corner const down to
//     the circle; the atom's fallback is invisible, so every other SpeedDial
//     stays exactly as it was.
// The transient stem discs are deliberately NOT dressed: five simultaneous
// glows read as noise, and one glow per resident control is this corner's
// whole depth budget. Reopen only on the owner's word.
// tests/unit/aura-token.test.ts pins the census: three wears in this file.

// THE LANGUAGE CORNER. `direction="up"` is passed as a prop, not a class: at
// 320px a `right` stem would run straight into the call CTA (D6).
//
// `--stem-inset` is the atom's second public variable: how much of the viewport
// its extreme-zoom cap must leave alone, measured from the BULB'S CENTRE (the
// atom adds the half-bulb itself). Only the host knows the number, so the host
// does the arithmetic — and it is 6rem + the safe area:
//   1rem  this corner's own offset from the bottom edge (cornerBottom), plus
//         env(safe-area-inset-bottom), because the bulb was lifted by it;
//   6rem  the Header pill's REACH — `sticky top-4` + `h-20` (Header.tsx's mount
//         contract, which books the very same 6rem for the shell's
//         `scroll-padding-top`). The bar is blurred glass and always on top, so
//         an `up` stem tall enough to reach it would put discs behind it.
// At ordinary zoom the stem is far shorter than the cap and nothing is clipped;
// past ~300% the cap turns the capsule into its own scroll box instead of
// letting it climb behind the sticky pill or off the top of the viewport
// (SC 1.4.10 / 2.4.11).
// ONE VALUE, EVERY WIDTH: 7rem = this corner's own 1rem offset + the Header
// pill's 6rem reach (`top-4` + `h-20`), plus the safe-area inset the bulb was
// lifted by. The bar is the same height on every screen since the owner's
// 2026-09-04 "make top bar same size on every screen as it is on a standard pc
// screen now" — an earlier spelling the same day carried a second `xl:` step
// for a bar that grew only on desktop, and it went out with that step.
const languageCorner =
  `fixed ${cornerBottom} left-4 z-40 ${discSteps} ` +
  '[--stem-inset:calc(7rem+env(safe-area-inset-bottom))] ' +
  '[--bulb-shadow:var(--shadow-aura)]';

// THE CALL CORNER — the same bottom edge, the same size steps. GlyphButton's
// `lg` box reads --disc-size through ui/disc.ts and its glyph follows at half
// the box, so the phone icon does not stay small inside a bigger disc.
const callCorner = `fixed ${cornerBottom} right-4 z-40 ${discSteps} shadow-aura`;

// THE WHATSAPP DISC — the call corner's exact mirror, one disc higher (fb-353).
// The offset is written in the disc's OWN variable rather than in a pixel
// count: `1rem + safe area` is the corner's edge, `var(--disc-size)` is the
// phone disc it stands on, and `0.5rem` is the gap between them — so at xl and
// 2xl, where the discs step up to 4rem and 4.5rem, the stack follows for free
// and the gap stays 0.5rem. A hardcoded `bottom-[5rem]` would overlap the phone
// at exactly the widths the fb-295 steps exist for.
// (Tailwind restores the whitespace CSS math requires when it compiles the
// arbitrary value — the same normalisation ui/Modal's `min(100%,32rem)` steps
// leave to it.)
const whatsappCorner =
  'fixed bottom-[calc(1rem+env(safe-area-inset-bottom)+var(--disc-size)+0.5rem)] ' +
  `right-4 z-40 ${discSteps} shadow-aura`;

export function FloatingActions(): ReactElement {
  const t = useTranslations('common');

  return (
    <>
      <LanguageSwitcher direction="up" className={languageCorner} />

      {/* THE SECOND CHANNEL, within thumb reach (fb-353): the clinic's own
          WhatsApp conversation — the same wa.me target the Footer's disc and
          the ContactModal's second control open, built from the digits-only
          `whatsapp` field of lib/clinic.ts (§10.1), never the E.164 spelling
          with its plus.
          It sits ABOVE the phone because the phone is the site's one
          conversion goal and keeps the thumb's easiest spot.
          wa.me IS external navigation, so it travels with target="_blank" +
          rel="noopener noreferrer"; the tel: disc below carries neither,
          because a protocol handler hands the number to the dialler rather than
          navigating, and _blank there would orphan a blank tab (the Footer's
          contact-disc law, PR #68).
          <Whatsapp /> stays UNLABELLED for the same reason the phone glyph
          does: a labelled glyph inside an asChild anchor double-announces. */}
      <GlyphButton
        asChild
        variant="solid"
        shape="round"
        size="lg"
        aria-label={t('actions.whatsapp')}
        className={whatsappCorner}
      >
        <a
          href={`https://wa.me/${clinic.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Whatsapp />
        </a>
      </GlyphButton>

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
    </>
  );
}
