import type { ReactElement } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ContactModalTrigger } from '@/components/sections/ContactModal/ContactModalTrigger';
import { Wordmark } from '@/components/sections/Wordmark/Wordmark';
import { containerClasses } from '@/components/ui/Container/Container';
import { localeHref } from '@/i18n/href';
import { clinic } from '@/lib/clinic/clinic';
import { cx } from '@/lib/cx/cx';
import { HeaderNav } from './HeaderNav';
import { NavMenu } from './NavMenu';

// sections/Header — the strip across the top of every page: brand · nav row ·
// Contact CTA · burger. Built to the owner-approved N2 contract board
// .claude/plans/header-n2-contract.plan.md (2026-08-12); the drawer-era parts
// of the dossier (.claude/section-runs/2026-08-05_22-04_top-bar/sections/
// Header.md) are SUPERSEDED — the design is a DROPDOWN under the bar, not a
// side drawer (D11 as amended, board §8).
//
// This section IS mounted: src/app/[locale]/layout.tsx renders it in the shell
// as a body-level sibling (skip link · Header · main · Footer · FloatingActions
// · LanguageBanner). Not here: the LanguageSwitcher (deferred, fb-129). The
// brand corner is sections/Wordmark since the fb-200 swap — the clinic's own
// mark and its two lettering colours since 2026-10-01 (§15.6 landed there,
// one edit to that file's default) and a link HOME since 2026-10-02 (the
// owner's word, Wordmark.tsx's D9): this file hands it the cell, the locale
// home's href and the link's translated name.
//
// ── THE CONTACT MODAL IS WIRED (org-review F1, 2026-09-02). This IS the "next
// run" D4 parked, so the interim `tel:` links are gone from both CTAs: the
// bar's below and the panel's in NavMenu.tsx are sections/ContactModalTrigger
// now — a section composing another section's PUBLIC component, the §4 dossier
// model this file already practices with Wordmark. What is NOT here is the
// <ContactModalProvider>: it owns the one `open` boolean and renders the ONE
// <dialog> after its children, so it belongs to whoever wraps the document —
// src/app/[locale]/layout.tsx wraps the shell in it, beside the obligations
// "THE MOUNT CONTRACT" below records as discharged. A Header rendered outside
// a provider THROWS from useContactModal by design (the hook names the missing
// wrapper rather than shipping a dead button), which is why Header.test.tsx
// and Header.stories.tsx each supply one.
//
// ── NO 'use client' here, and it still calls t() — the FloatingActions
// precedent (§16 + board §1.1). next-intl's useTranslations is ISOMORPHIC —
// and so is useLocale, the brand link's locale since 2026-10-02 (the Footer's
// own pair) — it resolves against the request-scoped config while this Server
// Component is pre-rendered into complete static HTML, and reads
// NextIntlClientProvider in Storybook/Vitest. The server-only
// `getTranslations` would work in the build and NOWHERE else, leaving the
// section un-storyable — and §13 requires a story per state. §8.1 holds
// either way: the ui/ atoms below never see a key, only finished text.
//
// ── THREE islands, and everything else is inert HTML (board §1.1 — the count
// was TWO until the ContactModal wiring gave the bar's Contact a reason to
// hydrate; it reads the shared switch through a context and presses it):
//   the bar and the brand      no JS at all
//   HeaderNav                  must know which page you are on
//   NavMenu                    holds the `open` boolean
//   the bar's Contact trigger  opens the one dialog the provider renders
//
// ── THE BREAKPOINT IS A CONTAINER STEP, never a media query (§6.5), and
// since 2026-09-26 a MEASURED one — `@min-[60rem]:` then, `@min-[62rem]:`
// since 2026-10-01 (THE BRAND GREW, below) — Tailwind v4's arbitrary
// container variant: it compiles to `@container (width >= 62rem)`.
// `@container` marks the bar as the thing measured. The step is spelled in
// THREE files — this one, HeaderNav.tsx (the row) and NavMenu.tsx (the
// burger) — and nowhere else; prose calls it "the bar's step". Header.test.tsx
// pins that the three agree, because a stale spelling in ONE of them splits
// the breakpoint: the row arriving at one width, the burger leaving at
// another.
//
// WHY THE NUMBER MOVED (header-nav-gap lane, the owner's ask, 2026-09-26:
// "it should maintain at least a little space between 'premium smile' and
// first button of menu, like idk, 70% of the width of the menu button …
// if not fit due to thinning web tab or screen size, switch to dropdown
// menu"). Until then the step was Tailwind's named `@3xl` — 48rem = 768px of
// bar, the number recorded as C1 — and it had never been measured against the
// BRAND. Measured in Chromium, Firefox and WebKit (Storybook, statics at
// 1536): the lockup is 258.5px wide (artwork 107.8 + `gap-3` 12 + the name
// 138.8); the row "Startseite · Leistungen · Team" is 279.3 (German, the
// longest, §8.4 — Romanian 231.3, English 228.0); and the grid holds the nav
// EXACTLY on the bar's centre line in all three engines. So the visible gap
// between the brand and the first link is simply
//     (row − nav) / 2 − 258.5,   row = the bar's content box − 32 (`px-4`)
// — and at a bar of 48rem it was NEGATIVE: −30.2px in German, −6.2 in
// Romanian, an OVERLAP. Seen in a 985px Chromium window (a 771px bar): side
// tracks of 229.9px (German) and 253.8 (Romanian) against the 258.5px brand,
// "Startseite" painted over "Smile". The grid paragraph below (RECORDED
// TRADE-OFF) says why the brand slides under the nav instead of the nav
// drifting.
//
// THE ARITHMETIC OF THE STEP. The owner's floor is ~70% of a menu button,
// calibrated on German: "Startseite" is 94px, so 4rem (64px). A German gap
// ≥ 64 needs a row ≥ 2 × (258.5 + 64) + 279.3 = 924.3, i.e. a bar content box
// ≥ 956.3px, and 60rem (960px) is the smallest whole rem past it. At the
// step: German 65.85px (≈ 70% of "Startseite" — the owner's own number, on
// the calibration language), Romanian 89.85, English 91.5; a wider bar only
// adds. Named steps were weighed and rejected: `@4xl` (56rem) leaves German
// 33.9px at the flip; `@5xl` (64rem = 1024px) flips the 1280 Notebook
// sampling point (§7) to the burger — the bar's content box there is 1007px
// in Chromium (a classic scrollbar gutter reserved by `scrollbar-gutter:
// stable`) and 1022 in Firefox and WebKit, both under 1024. §3's untouched
// default scale holds: no theme edit, an arbitrary value in the Header's own
// files — the licence `mx-[clamp(…)]` and the Hero's `-mt-[calc(6rem+2px)]`
// already use.
//
// TWO MECHANISMS MEASURED AND NOT TAKEN. No intrinsic-size-dependent fix is
// cross-engine safe here, which is why the NUMBER moved and the architecture
// did not:
//   a) a `column-gap` on the grid. The gap holds off the brand's TRACK edge,
//      and the track can be narrower than the brand (see RECORDED TRADE-OFF
//      below), so it guarantees nothing.
//   b) `minmax(max-content, 1fr)` side tracks. In Chromium the brand's
//      max-content is 258.5 (the artwork's percentage height resolved against
//      the definite row) and the floor works; in Firefox and WebKit it is
//      406.8 — the artwork at its natural 256px — so the left track floors at
//      407px, the nav is pushed ≥ 100px right of centre and the CTA overflows
//      the pill at windows under ~1180px.
// (2026-10-01: with the mark a fixed rem and `max-w-none`, the plain `1fr`
// auto floor counts the artwork in all three engines — measured — so neither
// is needed; THE BRAND GREW below has the numbers.)
//
// The proofs: the AtTheStep story (German, the bar's content box held at the
// step + 4px — the gap at its floor) and GermanStress (German at 1536). Move the
// NUMBER if the brand or German ever outgrows it — re-run the arithmetic
// above, never the architecture, and never without the planning loop.
// THE BRAND SHRANK, THE NUMBER STAYED (2026-10-01, the wordmark-brand lane):
// the clinic's mark is near-square (258:261) where the demo cat was 1.49:1,
// so at the row's 72px the lockup is ~222px wide (71.2 + 12 + 138.8), not
// 258.5 — every side track is now ~36px roomier, the German gap AT the step
// is ~104px (AtTheStep's bounds follow it), and the floor above is met with
// room. Re-run, the arithmetic's own answer would be a lower step — a bar
// ≥ 2 × (222 + 64) + 279.3 + 32 = 883px → 56rem, which is Tailwind's NAMED
// `@4xl` — but that moves the flip from ≈1221px to ≈1141px of window (the
// row instead of the burger on ~80px of laptop widths), a behaviour change
// the owner did not ask for with the logo; recorded in §15.28 as his lever,
// not taken. The step is safe where it is: a wider gap, never a narrower.
// AND THE BRAND GREW THE SAME EVENING (sections/Wordmark's THE OWNER'S SIZES:
// the mark smaller, the name half again bigger): the lockup MEASURES 270.1px
// (54.44 + 12 + 203.7 — the 30px name is narrower than 1.5 × the 20px one,
// the face having an optical-size axis), which left German 56.25px at a 60rem
// step — under the 4rem floor — and, under WCAG 1.4.12's text-spacing
// overrides, „Smile" and „Startseite" OVERLAPPING just above it (−13.8px of
// ink at a 1225px window, −7.8 at 1240, measured). So the NUMBER moved, on
// the owner's "whatever, do your thing" (2026-10-01): a bar ≥ 2 × (270.1 + 64)
// + 279.3 + 32 = 979.5px → 62rem, the smallest whole rem past it. At the step
// German keeps 70.6px (Chromium, measured; Firefox and WebKit, whose bars are
// 15px wider at the same window, more), the flip moves from ≈1221px to
// ≈1261px of window, and the 1280 Notebook keeps the row (its bar is 1007px).
// And the brand stopped being invisible to the grid the same day: the mark is
// a fixed rem with `max-w-none` (RECORDED TRADE-OFF, at the row), so under the
// text-spacing overrides the brand's track floors at its real width and the
// nav moves a few pixels right instead of under it — measured in Chromium,
// Firefox and WebKit: no box overlaps anywhere, no ink closer than 1px.
//
// THE COUPLED SPELLINGS — one number, every place it is written. Move the step
// and ALL of these move in the same change-set:
//   the class strings    this file (the row's grid, the brand cell, the right
//                        cell, the CTA box), HeaderNav.tsx (the <nav>),
//                        NavMenu.tsx (the burger's hide-rule) — the ONLY
//                        three files that spell it; NavItem.tsx and
//                        BurgerToggle.tsx spell no container step at all;
//   Header.test.tsx      `STEP` — the constant the token tests and "the bar's
//                        step is ONE number in three files" fence read;
//   Header.stories.tsx   AtTheStep — its wrapper's `calc(62rem+6px+…)` and
//                        its play's `62 * rem` (the "frame IS the step"
//                        check) and the gap bounds that follow from the step;
//   tests/e2e/           header-step.spec.ts — `BELOW` / `ABOVE`, the windows
//                        derived from the step (KNOWN CONSEQUENCE below);
//   the prose            KNOWN CONSEQUENCE's window widths (this file) and
//                        Header.stories.tsx's "3. Every story PINS ITS OWN
//                        VIEWPORT" flip width.
// The fence catches a stale class string; nothing mechanical catches the
// rest — a DOWNWARD move that updated `STEP` and the sources would leave
// AtTheStep green and no longer AT the step, so its premise would die silently.
//
// KNOWN CONSEQUENCE, not a bug (board §4b): the bar is the containing block
// of anything `fixed` inside it — its glass (`backdrop-filter`) makes it one
// in every engine, its container-type in the older ones (CORRECTED
// 2026-09-29; NavMenu.tsx's "Why the sheet has to leave" has the
// measurement) — AND the sticky z-50 opens a stacking context, which is
// exactly why NavMenu portals its dimming sheet to <body>. See that file.
//
// ── THE MOUNT CONTRACT — TWO OBLIGATIONS THE SHELL OWES THIS SECTION, BOTH
// DISCHARGED: (a) by globals.css' `scroll-padding-top: 6rem` on <html>, (b) by
// src/app/[locale]/layout.tsx's body-level siblings. The text below stays as
// the record of what the shell owes and why.
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
//    "same size on every screen"), so the five numbers move together or the
//    debt reopens — the fourth being NavMenu's panel cap, which joined the
//    family the moment the burger widths stopped being h-16.
//    (FloatingActions books `scroll-padding-bottom` on the same element for
//    the same clause; globals.css sets both.)
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
  const locale = useLocale();

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
    // Header takes the number. rounded-soft = 1rem — THE SOFT CORNER (owner
    // 2026-10-01, §15.29: "that rounded corner effect that the doctor card
    // from old webpage has … the top bar"): the old site's CARD radius, the
    // one token `--radius-soft` the personnel card, ui/TextButton and the
    // contact dialog wear too, worn by the PILL and, matching it, by
    // NavMenu's panel. It replaces the old bar's own 8px (rounded-lg, kept
    // rounder than the control default on the owner's 2026-08-16 ask); the
    // bar's CONTROLS keep §15.1's 6px — the Contact ui/Button and the burger
    // (GlyphButton `square`) — while the nav's TextButtons take the soft
    // corner on their own box (visible on their focus ring); the border still
    // runs all the way round; and the glass is STATIC —
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
    // measures the BAR, not the window, so the burger → row flip happens
    // where the BAR reaches the step. In a window V wide the bar's content
    // box is V − the scrollbar gutter − 2 × 10vw − 2px of borders (`vw`
    // counts the gutter, the containing block does not), so 62rem arrives at
    // 0.8 × V − gutter − 2 ≥ 992: ≈ 1261px with the 15px classic gutter
    // `scrollbar-gutter: stable` reserves in the Chromium measured, ≈ 1243
    // with none (it was ≈ 1221 / ≈ 1203 at 60rem from 2026-09-26, the
    // header-nav-gap lane, and ≈ 985 at 48rem before that).
    // DELIBERATE: a 1024px landscape tablet and the small laptops under
    // ~1220px now get the burger, because at those widths the row did not
    // fit — German overlapped the brand in every window under ~1055. The
    // container-query architecture behaving as designed (§6.5). The sampled
    // widths: 390 and 768 are burger territory either way, and at 1280 / 1536
    // / 1920 the bar is past the step (at 1536 it is ~1212px), so the row
    // there computes exactly as before.
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
        'mt-4 rounded-soft border border-line-subtle shadow-aura bg-surface/95 backdrop-blur-md backdrop-saturate-150',
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
            FloatingActions  `--stem-inset: calc(8rem + env(…))` — one value
                             (2rem corner offset + 6rem reach — 7rem until the
                             corner rose to its 2rem edge, 2026-10-09), xl step
                             deleted;
            NavMenu          the panel cap MOVED this round, unlike last:
                             `100dvh − 6.5rem` (reach 6rem + the `mt-2` gap).
                             Last round it deliberately stayed at 5.5rem because
                             the panel only exists below the bar's step and
                             those widths were still h-16 — that reasoning
                             expires the moment the burger widths get the
                             taller bar too.
          Five spellings, one number: change this height and all five move.
            PriceList        `@3xl:top-[8.5rem]` on the sticky price menu
                             (reach 6rem + 2.5rem of air) — the FIFTH spelling,
                             added by the price-list lane (its board §3.3,
                             2026-09-13; the air widened from 1rem in that
                             lane's pack round 2, 2026-09-14, and MEASURED: the
                             pill's aura tints the page ground down to
                             y = 126px, so the old 7rem menu sat 14px inside
                             the glow). Its cards mirror the same 2.5rem as
                             `scroll-mt-[2.5rem]` over globals' 6rem
                             scroll-padding, so a jumped-to card and the stuck
                             menu rest on one line: change this height and all
                             five move. Both are rem LITERALS since 2026-10-02:
                             the price band draws in the band scale's own
                             design pixel (CLAUDE.md §15.32 round 2), and these
                             two follow THIS pill, which does not scale.
            Hero             `-mt-[calc(6rem+2px)]` on the Home opener's root —
                             this pill's FLOW BOX (mt-4 + h-20 + the two 1px
                             borders), by which the band pulls itself UNDER the
                             pill (owner, pack round 2, 2026-09-20; the round-1
                             `min-h-[calc(100svh-6rem)]` stage is gone, the
                             stage is `min-h-svh` now) — and its `minmax(8rem,
                             1fr)` first row, the air the words keep from the
                             viewport's top when the content is taller than the
                             screen (8rem clears the 98px box by 30px). The
                             SIXTH spelling, two numbers in ONE file (hero lane
                             2026-09-19, board .claude/plans/hero.plan.md §3).
                             Change this height — or the border — and all six
                             move.
          No max-w cap in here: the PILL is the column — its own side margins
          already narrow it, and the old bar ran brand-to-CTA across its full
          width. All sizing in rem so browser zoom and user font settings
          behave (§7).
          ── THE GRID STARTS AT THE BAR'S STEP (`@min-[62rem]:` since
          2026-10-01, `@min-[60rem]:` from 2026-09-26, `@3xl` before; the
          file header argues the number), AND
          THE COLUMNS ARE PLACED EXPLICITLY.
          Both halves were measured, not guessed (2026-09-04): a grid at EVERY
          width, with auto-placement, broke the phone in two ways at once.
          `display: none` removes an element from the grid entirely — it is not
          a zero-width item, it is not an item — so with the nav hidden the
          right-hand cell auto-placed into column TWO and the burger sat in the
          middle of the bar; and the brand, handed a 1fr track instead of its
          natural width, wrapped mid-word into "Pre-mium Smi-le". Hence: below
          the step this row stays the FLEX row it always was (brand left,
          burger pushed right by the cell's own `ml-auto`), and from the step on
          it becomes the grid. `col-start-*` then pins each cell to its own
          column, which matters in one further state auto-placement also gets
          wrong — the single-menu rule takes the nav to `display:none` while the
          panel is open, at EVERY width, so a wide screen with an open menu
          would put the ✕ in the middle for exactly the same reason.
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
          side track never shrinks below its own MIN-CONTENT and a long German
          CTA pushes rather than clips — but the brand's min-content is not its
          width (RECORDED TRADE-OFF below).
          Spacing moved INTO the cells with the grid (§6.4 still holds — the
          section owns it): the side tracks' free space separates the three
          cells, and the right cell keeps a `gap-4` of its own between the
          Contact CTA and the burger.
          RECORDED TRADE-OFF — REWRITTEN AS MEASURED (header-nav-gap lane, the
          owner's ask, 2026-09-26). The earlier text said that where slack ran
          out the brand "would break mid-word before the nav drifted", so
          `whitespace-nowrap` made the nav give up exact centring first. Three
          engines say otherwise. `1fr` is `minmax(auto,1fr)`, and the auto floor
          is the brand's MIN-CONTENT — 150.8px in Chromium, Firefox and WebKit
          alike, where the lockup was 258.5px wide: the artwork counted for
          ZERO there. (The reason recorded then was its percentage HEIGHT;
          measured on 2026-10-01 it is preflight's `max-width: 100%`, which
          makes an <img> COMPRESSIBLE — its min-content contribution zero
          whatever its height — so a fixed height alone changed nothing.) So
          the side tracks stayed EQUAL and the nav on the centre line down to
          the text's own width; below the brand's real width the nowrap lockup
          did not break, it OVERFLOWED its track and slid UNDER the nav (the
          file header's 985px window). SINCE 2026-10-01 THE MARK COUNTS: a
          fixed rem height with `max-w-none` (sections/Wordmark, THE OWNER'S
          SIZES) makes the brand's min-content the whole lockup, so a track
          squeezed below it is FLOORED there and the nav moves right of centre
          rather than under the brand (measured under WCAG 1.4.12's
          text-spacing overrides at the step: the left track 321.7px, the nav
          7px right of centre, no overlap — Chromium; Firefox and WebKit never
          squeeze there). The STEP is still what keeps the owner's air: past
          `@min-[62rem]:` each side track is at least 340.35px (German)
          against the 270.1px brand, a gap ≥ 4rem (70.6px measured).
          Where the row is shown, the two side tracks are equal and the nav
          sits on the screen's centre line exactly (1536, Chromium: side
          tracks of ~450px German, ~474 Romanian — measured). */}
      <div className="flex h-20 items-center px-4 @min-[62rem]:grid @min-[62rem]:grid-rows-1 @min-[62rem]:grid-cols-[1fr_auto_1fr]">
        {/* The brand corner — now ONE component shared with the Footer
            (sections/Wordmark, built to the owner-approved contract
            .claude/plans/brand-lockup-contract.plan.md v2, fb-200…fb-208).
            Both consumers used to spell the mark out themselves, so the §15.6
            logo swap was two edits that could disagree; it is one now.
            THE WRAPPER IS THIS SECTION OWNING THE BOX (§6.4/§6.8), not
            decoration: `self-stretch` makes the cell the whole 5rem row — the
            same box the Footer's ruler gives its instance (fb-205) — and
            `items-center` centres the lockup in it, which is also what lets
            the lockup's link HUG what it draws since 2026-10-02 (a flex
            cell's default `stretch` would pull it to the row's height), so
            its focus ring circles the lockup inside the row (Wordmark.tsx,
            D9). Everything else in this file was untouched by the fb-200 swap
            (fb-207): the pill chrome, the `group/bar` name, the single-menu
            rule, the row (h-16 then, h-20 since the owner's 2026-09-04
            uniform-height ask — the cell follows it for free, which is the
            point of `self-stretch`).
            THE HOME LINK, BACK (owner, 2026-10-02: "i just want the "premium
            smile" logo from top bar and from footer to be a component that
            takes you to home"). The swap had removed the bar's home link — D9
            made the wordmark a placeholder <a> with no href, and on 2026-09-06
            the owner dropped the wiring — and this restores it through the
            two props sections/Wordmark now requires: `href`, the page's locale
            home through the one URL rule (`localeHref(locale, '/')`, §15.13 —
            a plain anchor, a full document load), and `aria-label`,
            `common.brand.ariaLabel` — the key the swap left uncalled in all
            five message files — filled with clinic.name (§10.1's single
            spelling): „Premium Smile, acasă" — the visible name first
            (SC 2.5.3), then where it goes (SC 2.4.4). The lockup is the bar's
            FIRST tab stop now, which is why NavMenu's focus-return fallback is
            scoped to the nav row: it keeps landing there, not on the logo. C2
            is unaffected: the brand is not a heading, because the one <h1>
            belongs to the page. */}
        {/* CELL 1 — `justify-self-start` states the intent the old flex order
            gave implicitly. `self-stretch` still overrides the grid's
            `items-center` for this one cell, so the cell is the full row
            height, and the cell's own `items-center` centres the hugging
            lockup in it (2026-10-02, the home link above) — both follow the
            h-20 step for free.
            THE MARK'S SIZE IS NOT THIS CELL'S (owner, 2026-10-01). Two words
            that evening made the bar's mark smaller and its name bigger — "make
            logo in top bar 15% smaller", "make the logo 10% smaller again",
            "make the text 50% bigger than it is now" — and for an hour this
            cell carried them as a shorter box (85%, then 76.5% of the row) plus
            a name-size prop. Then "update also in footer": the look became the
            lockup's own, so sections/Wordmark carries it (its THE OWNER'S
            SIZES block) and this cell is back to the whole row (the lockup
            centred in it since 2026-10-02). In the bar the
            mark is 55.1px (24.5 below the Wordmark's phone step) and the name
            30px, the lockup 270.1px wide at the row; the file header's step
            arithmetic follows it.
            `self-stretch` resolves only because the row's height is DEFINITE:
            `h-20` on the flex row, and once the row is a grid the step's
            `grid-rows-1`. Measured the hard way (2026-09-04): a grid's implicit
            row is content-sized, so stretching into it gives a height that
            percentages cannot resolve against — `h-[90%]` on the Wordmark's
            artwork fell back to `auto`, the image rendered at its intrinsic
            256×171, and the brand burst out of the pill. `grid-rows-1` compiles
            to a single `minmax(0,1fr)` row, which inside this definite-height
            box is a definite 5rem — the same thing a flex line gave for free. */}
        {/* `whitespace-nowrap` keeps the lockup on one line IN THE GRID: the
            side tracks are `1fr` = `minmax(auto,1fr)`, and for wrappable text
            that auto floor is the longest WORD, so a squeezed track would
            break the brand mid-word (measured: "Pre-mium Smi-le" at 390
            before the grid was scoped to the bar's step). WHAT NOWRAP DOES
            NOT DO, measured 2026-09-26: it does not floor the track at the
            whole lockup — the brand's min-content ignores the
            artwork until 2026-10-01, so a squeezed track OVERFLOWED instead
            (the grid's RECORDED TRADE-OFF above). The bar's step is what
            keeps every shown track wider than the brand.
            AT THE STEP ONLY, since 2026-10-01 (the wordmark-brand lane).
            Below it this row is flex and the cell is exactly as wide as the
            burger leaves it — 163px at 320 (§7's stress width, with a 15px
            scrollbar gutter) and 219px at 390, against a one-line lockup of
            170.9px at the Wordmark's phone sizes (the 20px name kept below
            its step, 2026-10-01) — so at 320 the name MUST be free to wrap,
            which is what sections/Wordmark's D10 arithmetic has always
            promised (two 28px lines inside the 5rem row). An unconditional
            nowrap made that impossible: the one-line name overflowed its
            cell and „Smile" was painted 32px under the burger at 320
            (measured on develop's preview; flagged by the real-clinic-data
            lane on 2026-09-30, fixed here). The grid's reason for nowrap
            starts where the grid starts, so the class now wears the step. */}
        <div className="flex self-stretch items-center @min-[62rem]:col-start-1 @min-[62rem]:justify-self-start @min-[62rem]:whitespace-nowrap">
          <Wordmark
            href={localeHref(locale, '/')}
            aria-label={t('brand.ariaLabel', { name: clinic.name })}
          />
        </div>

        {/* CELL 2 — the nav row, centred. `justify-self-center` lives on
            HeaderNav's own root (it renders the <nav>, so it owns its
            placement within this grid); below the bar's step that element is
            `display:none`, which removes it as a grid item entirely, and the
            auto track collapses to zero — leaving brand-left / burger-right,
            pixel-identical to the flex layout it replaced. */}
        <HeaderNav />

        {/* The bar CTA — the site's one conversion goal (§1). Since the
            ContactModal wiring it is a real <button> that summons the site's
            ONE dialog, not an <a href="tel:"> that dials straight out. The
            number did not disappear, it moved one press away: the dialog's
            title names both channels and the panel offers them — the `tel:`
            control carrying clinic.phoneDisplay, then the WhatsApp conversation
            (ContactModal.tsx: the owner's 2026-08-28 trim, two channels since
            2026-09-04). So THIS control performs an action in place
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
            Passing `hidden @min-[62rem]:inline-flex` as the atom's className
            does not work, and fails SILENTLY: ui/Button's own base sets
            `inline-flex`, so two `display` utilities of equal specificity
            (0,1,0) end up in one class list and the winner is decided by their
            order in the generated sheet — where `.inline-flex` is emitted
            after `.hidden`. The result was a Contact button visible at 390,
            next to the burger, against the board's phone sketch (measured,
            then fixed, 2026-08-13; TextButton.tsx's header carries the same
            warning about same-property utilities).
            So the SECTION owns the box (§6.4/§6.8 — the parent owns placement)
            and the atom keeps its own display: `hidden @min-[62rem]:flex` is
            the breakpoint (below the bar's step the panel's own full-width
            Contact takes over, fb-151), and `flex` at the step — not `block` —
            because a flex container gives its single item no baseline
            line-box, so the button lands on exactly the same pixels it did as
            a direct flex item.
            `ml-auto` USED TO LIVE HERE and was dropped with the grid rework
            (2026-09-04): the right cell is `justify-self-end`, so the free
            space is already outside this box and an auto margin inside a
            content-sized flex cell moves nothing. Keeping it would have been a
            class that reads like a rule and does nothing.
            The last class is the single-menu rule (fb-165, owner: "hide the
            bar's Contact, leave only the panel's"): while the panel is open
            this box goes away at EVERY width, so the only Contact on screen is
            the panel's own. That one beats the step's `flex` on SPECIFICITY,
            not on source order — its compiled selector carries an id inside
            `:has()`, (1,1,0) against the utility's (0,1,0) — which is exactly
            the guarantee the plain `hidden` above could not give. */}
        {/* CELL 3 — everything that belongs at the right edge, in one box, so
            the grid has exactly three children whatever the width. `gap-4` is
            the spacing the row used to own directly. Two spellings of "sit at
            the right edge", one per layout mode: `ml-auto` while the row is
            still a flex line (below the bar's step, where this cell holds only
            the burger), and `col-start-3 justify-self-end` once it is a grid — the
            auto margin is explicitly cancelled there, because inside a track it
            would absorb the free space itself and make `justify-self` a no-op.
            Together they are what NavMenu's own `ml-auto` used to buy. */}
        <div className="ml-auto flex items-center gap-4 @min-[62rem]:col-start-3 @min-[62rem]:ml-0 @min-[62rem]:justify-self-end">
          <div className="hidden @min-[62rem]:flex group-has-[#header-menu]/bar:hidden">
            {/* LILAC, WIDER, JUMPING (owner, the evening of 2026-10-01 — the
                reversal of his own morning rule "contact button MUST STAY
                GREEN AS IT MUST JUMP INTO YOUR EYES", verbatim: "also paint
                the contact button from top bar a lilla and make it wider,
                more seszable and adjust to widest language form" · "contact
                button in top bar, to have that jump at you animation on
                hover"). `tone="accent"` is ui/Button's lavender family, the
                menu buttons' own hue; the box is the atom's `md` — 44px, the
                row's own height since the bar was built, WIDER ONLY: the
                `lg` face was tried for "more seszable" and taken off the
                same evening on the owner's look ("it's jsut too high th
                button. i wanted the contact button wider just, not also
                taller"); `motion="jump"` the old site's 105 % pop on hover
                (the scaled box, 168 × 46px, stays inside the row and its
                16px side padding — nothing clips). THE WIDTH is the
                section's (§6.8 — the parent owns sizing; §8.4 — min-width on
                buttons for text expansion): `min-w-40`, 10rem, the SAME box
                in every language, measured on the built page at the label's
                18px medium — „Contact" 63.6px (ro/en/fr), „Kontakt" 65.3,
                „Contatti" 66.4, the widest — plus the md face's 2 × 20px of
                padding = 106.4px natural, so the floor binds everywhere with
                ≥ 26.8px of slack a side, and a sixth language up to ~120px
                of label still fits without the box changing. The Header
                stories' Default and GermanStress plays pin the box to the
                floor in RO and DE; the floor is one token, the owner's lever.
                The panel's full-width Contact (NavMenu.tsx) wears the lilac
                too — the same control, one look — and NOT the jump: a
                full-width row that grows past its panel's padding on hover
                reads as a glitch, and a phone's panel is a touch surface
                (tests/unit/jump-census.test.ts pins both). */}
            <ContactModalTrigger
              variant="solid"
              tone="accent"
              motion="jump"
              className="min-w-40"
            >
              {t('actions.contact')}
            </ContactModalTrigger>
          </div>

          <NavMenu />
        </div>
      </div>
    </header>
  );
}
