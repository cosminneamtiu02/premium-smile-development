import type { ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import { ContactModalTrigger } from '@/components/sections/ContactModal/ContactModalTrigger';
import { Wordmark } from '@/components/sections/Wordmark/Wordmark';
import { containerClasses } from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx';
import { HeaderNav } from './HeaderNav';
import { NavMenu } from './NavMenu';

// sections/Header — the strip across the top of every page: brand · nav row ·
// Contact CTA · burger. Built to the owner-approved N2 contract board
// .claude/plans/header-n2-contract.plan.md (2026-08-12); the drawer-era parts
// of the dossier (.claude/section-runs/2026-08-05_22-04_top-bar/sections/
// Header.md) are SUPERSEDED — the design is a DROPDOWN under the bar, not a
// side drawer (D11 as amended, board §8).
//
// This section is still NOT mounted into the shell — that is Phase 4,
// deliberately. Not here either: the LanguageSwitcher (deferred, fb-129) and
// the real Publio logo (§15.6 — the brand corner is sections/Wordmark since the
// fb-200 swap, carrying interim demo artwork beside the name until the owner
// supplies the vectorized mark).
//
// ── THE CONTACT MODAL IS WIRED (org-review F1, 2026-09-02). This IS the "next
// run" D4 parked, so the interim `tel:` links are gone from both CTAs: the
// bar's below and the panel's in NavMenu.tsx are sections/ContactModalTrigger
// now — a section composing another section's PUBLIC component, the §4 dossier
// model this file already practices with Wordmark. What is NOT here is the
// <ContactModalProvider>: it owns the one `open` boolean and renders the ONE
// <dialog> after its children, so it belongs to whoever wraps the document —
// Phase 4, beside the two scroll-padding debts below. Until that lands, a
// Header rendered outside a provider THROWS from useContactModal by design (the
// hook names the missing wrapper rather than shipping a dead button), which is
// why Header.test.tsx and Header.stories.tsx each supply one.
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
// ── THREE islands, and everything else is inert HTML (board §1.1 — the count
// was TWO until the ContactModal wiring gave the bar's Contact a reason to
// hydrate; it reads the shared switch through a context and presses it):
//   the bar and the brand      no JS at all
//   HeaderNav                  must know which page you are on
//   NavMenu                    holds the `open` boolean
//   the bar's Contact trigger  opens the one dialog the provider renders
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
// a) `scroll-padding-top: 6rem` on <html> — SC 2.4.11 Focus Not Obscured
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
//    h-20 = 6rem (uniform at every width since the owner's 2026-09-04
//    "same size on every screen"), so the four numbers move together or the
//    debt reopens — the fourth being NavMenu's panel cap, which joined the
//    family the moment the burger widths stopped being h-16.
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
    // and the two clamps are identical. THE NUMBER NOW ARRIVES AS ui/Container's
    // `containerClasses` constant (board .claude/plans/container-gutter.plan.md,
    // fb-343, 2026-09-04) instead of a recorded copy — but the margins here
    // stay CHROME GEOMETRY, not a column: the pill IS the column, and it can
    // never compose <Container> without restructuring, because sticky, z-50,
    // the glass and the bar's own container step all ride this one element.
    // One definition, two consumption modes; the Footer takes the box, the
    // Header takes the number. rounded-lg = 8px — the old bar's own
    // radius, kept ROUNDER than the §15.1 control default on the owner's
    // explicit ask (2026-08-16): the PILL and its panel wear 8px, controls
    // keep their 6px, and both numbers live on Tailwind's untouched scale;
    // the border now runs all the way round; and the glass is STATIC —
    // bg-surface/95 + backdrop-blur, one state, because the JS half of D1
    // stands: no scroll listener, no height animation, no chrome that watches
    // the window. THE AURA IS WHAT CHANGED, and only that (board
    // .claude/plans/header-aura.plan.md, fb-359, owner 2026-09-04 — "the old
    // top bar has like a shadow around it. like an aura"): the pill wears
    // `shadow-aura`, the old bar's SCROLLED-state lavender glow, imported as
    // ONE static value and worn permanently — because this pill is permanently
    // in the posture that value belonged to, floating over content at every
    // scroll position, which the old bar only reached once you scrolled. What
    // did NOT come with it is the two-state swap: the rest/scrolled pair and
    // the window listener that drove it stay behind, so the JS half of D1
    // above is untouched and this bar still ships zero JS. The value itself
    // lives in globals.css' token layer — its rule-site comment carries the
    // provenance and the tint reasoning — and NavMenu's panel wears the very
    // same one, which is the old site's own pairing.
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
    <header
      className={cx(
        'group/bar sticky top-4 z-50',
        containerClasses,
        'mt-4 rounded-lg border border-line-subtle shadow-aura bg-surface/95 backdrop-blur-md backdrop-saturate-150',
      )}
    >
      {/* ── THE ROW: h-20 (5rem) AT EVERY WIDTH (owner, 2026-09-04: "make top
          bar same size on every screen as it is on a standard pc screen now").
          This supersedes the same-day first answer to "kind of thin and small
          and unimportant", which grew the row only at the bar's @5xl step and
          left phones and tablets on h-16. The owner looked at the result and
          asked for the desktop size everywhere, so the step is GONE — one
          height, no container query, and the whole @5xl≡1280px equivalence that
          the stepped version needed is retired with it. What survives from that
          round is the grid below, which is a different decision.
          ── THE COUPLED NUMBERS ARE NOW SINGLE VALUES TOO (design board P9a),
          moved in this same edit. The pill's REACH is `top-4` + the row height
          = 1rem + 5rem = 6rem, everywhere:
            globals.css      `scroll-padding-top: 6rem` — one value, the xl
                             media step deleted;
            FloatingActions  `--stem-inset: calc(7rem + env(…))` — one value
                             (1rem corner offset + 6rem reach), xl step deleted;
            NavMenu          the panel cap MOVED this round, unlike last:
                             `100dvh − 6.5rem` (reach 6rem + the `mt-2` gap).
                             Last round it deliberately stayed at 5.5rem because
                             the panel only exists below @3xl and those widths
                             were still h-16 — that reasoning expires the moment
                             the burger widths get the taller bar too.
          Four spellings, one number: change this height and all four move.
          No max-w cap in here: the PILL is the column — its own side margins
          already narrow it, and the old bar ran brand-to-CTA across its full
          width. All sizing in rem so browser zoom and user font settings
          behave (§7).
          ── THE GRID STARTS AT @3xl, AND THE COLUMNS ARE PLACED EXPLICITLY.
          Both halves were measured, not guessed (2026-09-04): a grid at EVERY
          width, with auto-placement, broke the phone in two ways at once.
          `display: none` removes an element from the grid entirely — it is not
          a zero-width item, it is not an item — so with the nav hidden the
          right-hand cell auto-placed into column TWO and the burger sat in the
          middle of the bar; and the brand, handed a 1fr track instead of its
          natural width, wrapped mid-word into "Pre-mium Smi-le". Hence: below
          @3xl this row stays the FLEX row it always was (brand left, burger
          pushed right by the cell's own `ml-auto`), and from @3xl it becomes
          the grid. `col-start-*` then pins each cell to its own column, which
          matters in one further state auto-placement also gets wrong — the
          single-menu rule takes the nav to `display:none` while the panel is
          open, at EVERY width, so a wide screen with an open menu would put
          the ✕ in the middle for exactly the same reason.
          ── THREE CELLS, BECAUSE THE MIDDLE ONE MUST BE SCREEN-CENTRED (owner,
          2026-09-04: "the middle one/middle two should sit at the center of the
          screen and the rest left and right always"). `1fr auto 1fr` is the
          whole mechanism: the two side tracks always take an EQUAL share of the
          free space, so the auto track lands on the row's centre line — and
          because the pill's margins are symmetric and this row's `px-4` is
          symmetric, the row's centre IS the screen's centre. A flex row cannot
          promise that: `ml-auto` centres nothing, and centring by
          `justify-between` would park the nav wherever the brand and CTA widths
          happened to leave it — the nav would drift every time a locale changed
          the brand or CTA width. `1fr` here is CSS's `minmax(auto,1fr)`, so a
          side track never shrinks below its own content and a long German CTA
          pushes rather than clips.
          Spacing moved INTO the cells with the grid (§6.4 still holds — the
          section owns it): the side tracks' free space separates the three
          cells, and the right cell keeps a `gap-4` of its own between the
          Contact CTA and the burger.
          RECORDED TRADE-OFF: `1fr` is `minmax(auto,1fr)`, so a side track never
          shrinks below its own min-content — but for wrappable text min-content
          is the longest WORD, not the phrase. Where the bar has slack (every
          width the row is shown at, 1536 included: ~1197px of row against
          ~200px of brand and ~360px of nav) the two side tracks are equal and
          the nav sits on the screen's centre line exactly. Where slack ran out
          the brand would break mid-word before the nav drifted — the worse of
          the two failures — so the brand cell carries `whitespace-nowrap` and
          the nav gives up exact centring first instead. */}
      <div className="flex h-20 items-center px-4 @3xl:grid @3xl:grid-rows-1 @3xl:grid-cols-[1fr_auto_1fr]">
        {/* The brand corner — now ONE component shared with the Footer
            (sections/Wordmark, built to the owner-approved contract
            .claude/plans/brand-lockup-contract.plan.md v2, fb-200…fb-208).
            Both consumers used to spell the mark out themselves, so the §15.6
            logo swap was two edits that could disagree; it is one now.
            THE WRAPPER IS THIS SECTION OWNING THE BOX (§6.4/§6.8), not
            decoration: the row is `items-center`, which centres its children
            rather than stretching them, while the lockup's hairline bar and its
            artwork are sized in PERCENTAGES of the row height — `self-stretch`
            is what hands them the full 5rem to be a percentage of. Everything
            else in this file was untouched by THAT swap (fb-207): the pill
            chrome, the `group/bar` name, the single-menu rule, the row (h-16
            then, h-20 since the owner's 2026-09-04 uniform-height ask — the
            lockup follows it for free, which is the point of `self-stretch`).
            WHAT THE SWAP REMOVES, deliberately rather than by accident: the
            home LINK and its `brand.ariaLabel`. D9 (fb-200 — "make it
            clickable, but don't implement go-to-a-page yet") makes the
            wordmark a placeholder <a> with NO href, so nothing navigates and
            there is nothing to name — a label on an unfocusable generic is
            prohibited ARIA, i.e. an axe failure. The key stays in all five
            message files, reserved and uncalled, for the two-line wiring diff
            Wordmark.tsx declares in full. C2 is unaffected either way: the
            brand is not a heading, because the one <h1> belongs to the page. */}
        {/* CELL 1 — `justify-self-start` states the intent the old flex order
            gave implicitly. `self-stretch` still overrides the grid's
            `items-center` for this one cell, which is what hands the lockup the
            full row height its percentage-sized artwork needs — and it now
            follows the h-20 step for free. */}
        {/* `self-stretch` is what hands the lockup the full row height its
            percentage-sized artwork needs — and `@3xl:grid-rows-1` on the row
            is what makes that height DEFINITE once the row is a grid. Measured
            the hard way (2026-09-04): a grid's implicit row is content-sized,
            so stretching into it gives a height that percentages cannot resolve
            against — `h-[90%]` on the Wordmark's artwork fell back to `auto`,
            the image rendered at its intrinsic 256×171, and the brand burst out
            of the pill. `grid-rows-1` compiles to a single `minmax(0,1fr)` row,
            which inside this definite-height box is a definite 5rem — the
            same thing a flex line gave for free.
            `whitespace-nowrap` keeps the lockup on one line: the side tracks are
            `1fr` = `minmax(auto,1fr)`, and for wrappable text that auto floor is
            the longest WORD, so a squeezed track would break the brand mid-word
            (measured: "Pre-mium Smi-le" at 390 before the grid was scoped to
            @3xl). With nowrap the track floors at the whole lockup instead. */}
        <div className="flex self-stretch whitespace-nowrap @3xl:col-start-1 @3xl:justify-self-start">
          <Wordmark />
        </div>

        {/* CELL 2 — the nav row, centred. `justify-self-center` lives on
            HeaderNav's own root (it renders the <nav>, so it owns its
            placement within this grid); below @3xl that element is
            `display:none`, which removes it as a grid item entirely, and the
            auto track collapses to zero — leaving brand-left / burger-right,
            pixel-identical to the flex layout it replaced. */}
        <HeaderNav />

        {/* The bar CTA — the site's one conversion goal (§1). Since the
            ContactModal wiring it is a real <button> that summons the site's
            ONE dialog, not an <a href="tel:"> that dials straight out. The
            number did not disappear, it moved one press away: the dialog asks
            the question and answers it in three lines — title, lead, and the
            green `tel:` control carrying clinic.phoneDisplay (ContactModal.tsx,
            owner trim 2026-08-28). So THIS control performs an action in place
            instead of navigating, which is what makes a button the honest
            element (§9), and the anchor that dials is the one inside the panel.
            The LABEL is untouched: t('actions.contact'), the very key the
            interim link carried, handed to the trigger as children. No message
            key was added for this swap, because ContactModalTrigger is
            deliberately label-agnostic (§8.1 — the word depends on where the
            opener sits, so the consumer owns it).
            aria-haspopup="dialog" comes from the trigger itself, and so does
            the ban on `asChild`: it is a TYPE error there, so nobody can talk
            this opener into wearing an anchor's clothes again.

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
            over, fb-151), and `@3xl:flex` — not `@3xl:block` — because a flex
            container gives its single item no baseline line-box, so the button
            lands on exactly the same pixels it did as a direct flex item.
            `ml-auto` USED TO LIVE HERE and was dropped with the grid rework
            (2026-09-04): the right cell is `justify-self-end`, so the free
            space is already outside this box and an auto margin inside a
            content-sized flex cell moves nothing. Keeping it would have been a
            class that reads like a rule and does nothing.
            The last class is the single-menu rule (fb-165, owner: "hide the
            bar's Contact, leave only the panel's"): while the panel is open
            this box goes away at EVERY width, so the only Contact on screen is
            the panel's own. That one beats `@3xl:flex` on SPECIFICITY, not on
            source order — its compiled selector carries an id inside `:has()`,
            (1,1,0) against the utility's (0,1,0) — which is exactly the
            guarantee the plain `hidden` above could not give. */}
        {/* CELL 3 — everything that belongs at the right edge, in one box, so
            the grid has exactly three children whatever the width. `gap-4` is
            the spacing the row used to own directly. Two spellings of "sit at
            the right edge", one per layout mode: `ml-auto` while the row is
            still a flex line (below @3xl, where this cell holds only the
            burger), and `col-start-3 justify-self-end` once it is a grid — the
            auto margin is explicitly cancelled there, because inside a track it
            would absorb the free space itself and make `justify-self` a no-op.
            Together they are what NavMenu's own `ml-auto` used to buy. */}
        <div className="ml-auto flex items-center gap-4 @3xl:col-start-3 @3xl:ml-0 @3xl:justify-self-end">
          <div className="hidden @3xl:flex group-has-[#header-menu]/bar:hidden">
            <ContactModalTrigger variant="solid">
              {t('actions.contact')}
            </ContactModalTrigger>
          </div>

          <NavMenu />
        </div>
      </div>
    </header>
  );
}
