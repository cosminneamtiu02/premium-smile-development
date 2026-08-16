import type { ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button/Button';
import { Link } from '@/i18n/navigation';
import { clinic } from '@/lib/clinic';
import { HeaderNav } from './HeaderNav';
import { NavMenu } from './NavMenu';

// sections/Header — the strip across the top of every page: brand · nav row ·
// Contact CTA · burger. Built to the owner-approved N2 contract board
// .claude/plans/header-n2-contract.plan.md (2026-08-12); the drawer-era parts
// of the dossier (.claude/section-runs/2026-08-05_22-04_top-bar/sections/
// Header.md) are SUPERSEDED — the design is a DROPDOWN under the bar, not a
// side drawer (D11 as amended, board §8).
//
// This lane does NOT mount the section into the shell — that is Phase 4,
// deliberately. Not in this lane either: the LanguageSwitcher (deferred,
// fb-129), the real Publio logo (§15.6 — the brand corner is text until the
// owner supplies it) and the ContactModal (next run; until then Contact is a
// plain phone link, D4).
//
// ── NO 'use client' here, and it still calls t() — the FloatingActions
// precedent (§16 + board §1.1). next-intl's useTranslations is ISOMORPHIC: it
// resolves against the request-scoped config while this Server Component is
// pre-rendered into complete static HTML, and reads NextIntlClientProvider in
// Storybook/Vitest. The server-only `getTranslations` would work in the build
// and NOWHERE else, leaving the section un-storyable — and §13 requires a
// story per state. §8.1 holds either way: the ui/ atoms below never see a key,
// only finished text.
//
// ── TWO islands, and everything else is inert HTML (board §1.1):
//   the bar, the brand, the Contact button   no JS at all
//   HeaderNav                                must know which page you are on
//   NavMenu                                  holds the `open` boolean
//
// ── THE BREAKPOINT IS A CONTAINER STEP, never a media query (§6.5).
// `@container` marks the bar as the thing measured, and `@3xl` is Tailwind's
// own step for 48rem = 768px — the number recorded as C1, so no custom value
// enters the untouched default scale (§3). Calibrated against GERMAN, which
// runs ~30% longer than English (§8.4) and therefore decides where the step
// sits: the GermanStress story is that proof. Move the NUMBER if German ever
// stops fitting — never the architecture, and never in this file alone.
//
// KNOWN CONSEQUENCE, not a bug (board §4b): container-type establishes a
// positioning scope AND the sticky z-50 opens a stacking context, which is
// exactly why NavMenu portals its dimming sheet to <body>. See that file.
//
// ── THE MOUNT CONTRACT — TWO DEBTS PHASE 4 INHERITS FROM THIS SECTION.
// (The FloatingActions header carries the same kind of block for its own
// spacer; this is the sticky bar's half of the same bill.)
//
// a) `scroll-padding-top: 5rem` on <html> — SC 2.4.11 Focus Not Obscured
//    (Minimum), AA and new in WCAG 2.2. The bar is a blurred glass pill and
//    always on top: a focusable that comes to rest behind it is obscured
//    together with its focus ring (2.4.11 asks for VISIBLE, and blurred-
//    through-glass is not that). Tab going DOWN the page is safe (the
//    browser scrolls the target to the bottom of the viewport), but Shift+Tab
//    going UP scrolls it to the TOP — i.e. behind the pill — and the
//    same happens for in-page #anchor jumps. `scroll-padding-top` is the
//    WCAG-documented cure (technique C43): it tells every scroll-into-view to
//    keep that strip clear. It CANNOT be set from here — §6 forbids a section
//    from styling the shell — and it must equal the pill's reach, top-4 +
//    h-16 = 5rem, so the three numbers move together or the debt reopens.
//    (FloatingActions books `scroll-padding-bottom` on the same element for
//    the same clause; Phase 4 sets both.)
//
// b) HEADER · MAIN · FOOTER · FloatingActions AS BODY-LEVEL SIBLINGS. Not a
//    style preference — NavMenu's page freeze is built on `inert`, which it
//    applies to <body>'s OTHER children while the menu is open (board §5·A1,
//    B5). Wrap the shell's contents in one layout <div> and the freeze still
//    "works" while freezing nothing: the page stays tappable and reachable
//    behind the open panel. NavMenu ships a dev-only tripwire that says so out
//    loud, and this is the sentence it points at.

export function Header(): ReactElement {
  const t = useTranslations('common');

  return (
    // ── THE FLOATING PILL (owner, 2026-08-16 — restore the old top-bar's
    // aspect; reverses the CHROME half of D1). `mt-4` floats the bar 1rem off
    // the viewport top at rest and `sticky top-4` holds that same 1rem while
    // the page scrolls, so the bar sits at one visual y at every scroll
    // position. The side margins are the old site's 10vw clamp (rem-ified per
    // §7) with the floor lowered 3rem → 1rem: the old bar hid its brand TEXT
    // below `sm` behind a logo mark, but this corner is all text until §15.6
    // delivers the logo, and 2×3rem next to "Premium Smile" leaves no slack at
    // the 320px stress width (§7). Above ~480px viewport the 10vw term governs
    // and the two clamps are identical. rounded-lg = 8px — the old bar's own
    // radius, kept ROUNDER than the §15.1 control default on the owner's
    // explicit ask (2026-08-16): the PILL and its panel wear 8px, controls
    // keep their 6px, and both numbers live on Tailwind's untouched scale;
    // the border now runs all the way round; and the glass is STATIC —
    // bg-surface/95 + backdrop-blur, one state, because the JS half of D1
    // stands: no scroll listener, no height animation, no chrome that watches
    // the window. NO shadow either — depth for this section is an N4-pack
    // decision that has not been made (NavMenu.tsx carries the same sentence).
    //
    // KNOWN CONSEQUENCE of margins on a @container root: the breakpoint
    // measures the BAR, so the burger → row flip now happens where the BAR
    // reaches 48rem, i.e. at a somewhat wider viewport than before (~950px
    // with 10vw margins) — the container-query architecture behaving as
    // designed (§6.5). German still calibrates the step (GermanStress story);
    // the sampled widths are unaffected: 390 is burger territory either way,
    // and at 1536 the bar is ~1229px, comfortably past the step.
    //
    // ── `group/bar` — ONE MENU ON SCREEN (owner, fb-164/165/166).
    // While the panel is open the bar shows BRAND + ✕ only, at every width:
    // below the step nothing else was ever visible, and above it the row plus
    // the bar's Contact used to sit behind the open panel, which reads as two
    // menus at once. The rule is pure CSS — `group-has-[#header-menu]/bar:hidden`
    // on the row (HeaderNav.tsx) and on the CTA below — because the panel
    // EXISTS in this subtree exactly while it is open (NavMenu renders it
    // conditionally), so `:has()` already knows the state and no boolean has to
    // cross the server/client boundary. Header.tsx stays a Server Component.
    //
    // THE GROUP MUST STAY NAMED. An unnamed `group` here would be matched by
    // the morph SVG's `group-aria-expanded:*` utilities — they compile to
    // `:is(:where(.group)[aria-expanded="true"] *)`, which would then read THIS
    // element's (absent) aria-expanded instead of the burger's and freeze the
    // ☰ → ✕ animation permanently (Wave-1 constraint 3; NavMenu.tsx's morph
    // block carries the other half of this warning). `group/bar` is the class
    // token "group/bar", which `.group` does not match — that is the whole
    // protection, and Header.test.tsx asserts it.
    <header className="group/bar sticky top-4 z-50 @container mx-[clamp(1rem,10vw,12.5rem)] mt-4 rounded-lg border border-line-subtle bg-surface/95 backdrop-blur-md backdrop-saturate-150">
      {/* h-16 = 4rem, the height NavMenu's panel measures itself against.
          No max-w cap in here: the PILL is the column — its own side margins
          already narrow it, and the old bar ran brand-to-CTA across its full
          width. The section owns all child spacing through gap-4 and px-4
          (§6.4 — the atoms carry no outer margins of their own). All sizing
          in rem so browser zoom and user font settings behave (§7). */}
      <div className="flex h-16 items-center gap-4 px-4">
        {/* The brand. NOT a heading (C2): the one <h1> on a page belongs to
            that page's content, and a bar repeated on every route must not
            claim it. The accessible name is the ICU message with {name} filled
            from lib/clinic.ts — the single source of NAP (§10.1) — so a
            rename is one edit, not six, and §8.2's ban on gluing sentences
            from fragments is respected.
            Why pay for the label while the brand is plain text (board §4a):
            §15.6 turns this corner into the vectorized Publio logo, i.e. an
            image-only link, which unlabelled is a §9 violation and a hard axe
            failure. Adding the key now makes that swap a one-line change. SC
            2.5.3 Label in Name holds either way — the accessible name contains
            the visible text. The focus ring comes from the globals.css
            :focus-visible safety net (§9). */}
        <Link
          href="/"
          aria-label={t('brand.ariaLabel', { name: clinic.name })}
          className="font-display text-xl text-ink-strong"
        >
          {clinic.name}
        </Link>

        <HeaderNav />

        {/* The bar CTA — the site's one conversion goal (§1), tap-to-call.
            asChild: render no <button>, the nested <a> BECOMES the control and
            wears the button's clothes, so this emits a single <a href="tel:">.
            Interim plain phone link, swapped for the ContactModal next run
            (D4).

            WHY THE VISIBILITY LIVES ON A WRAPPER AND NOT ON THE BUTTON.
            Passing `hidden @3xl:inline-flex` as the atom's className does not
            work, and fails SILENTLY: ui/Button's own base sets `inline-flex`,
            so two `display` utilities of equal specificity (0,1,0) end up in
            one class list and the winner is decided by their order in the
            generated sheet — where `.inline-flex` is emitted after `.hidden`.
            The result was a Contact button visible at 390, next to the burger,
            against the board's phone sketch (measured, then fixed, 2026-08-13;
            TextButton.tsx's header carries the same warning about
            same-property utilities).
            So the SECTION owns the box (§6.4/§6.8 — the parent owns placement)
            and the atom keeps its own display: `hidden @3xl:flex` is the
            breakpoint (below the step the panel's own full-width Contact takes
            over, fb-151), `ml-auto` pushes it to the right edge, and
            `@3xl:flex` — not `@3xl:block` — because a flex container gives its
            single item no baseline line-box, so the button lands on exactly
            the same pixels it did as a direct flex item.
            The last class is the single-menu rule (fb-165, owner: "hide the
            bar's Contact, leave only the panel's"): while the panel is open
            this box goes away at EVERY width, so the only Contact on screen is
            the panel's own. That one beats `@3xl:flex` on SPECIFICITY, not on
            source order — its compiled selector carries an id inside `:has()`,
            (1,1,0) against the utility's (0,1,0) — which is exactly the
            guarantee the plain `hidden` above could not give. */}
        <div className="ml-auto hidden @3xl:flex group-has-[#header-menu]/bar:hidden">
          <Button asChild variant="solid">
            <a href={`tel:${clinic.phone}`}>{t('actions.contact')}</a>
          </Button>
        </div>

        <NavMenu />
      </div>
    </header>
  );
}
