import type { ComponentProps, ReactElement } from 'react';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import { CategoryCard, type PriceCategoryProps } from './CategoryCard';
import { PriceMenu } from './PriceMenu';

// sections/PriceList — the Services page's price band: an in-page jump menu
// inside a card beside a column of category cards. Built to the owner-approved
// composition contract on the board .claude/plans/price-list.plan.md (rounds
// 1–4, 2026-09-13); §3 is the desktop layout, §4 the jump, §5 the phone
// adaptation, §2c the round-2 riders this file implements. Reshaped by the
// owner's pack round of 2026-09-14 — the menu title, the single price column,
// the glow on every card, the menu's new offset, the current-item marker and
// the removal of the "back to categories" link; every paragraph that changed
// says so. Reshaped once more on the owner's word of 2026-09-29 — the glow on
// the menu card and on the ONE category card the visitor is at; THE GLOW
// paragraph below — and again the same evening: the line that decides which
// card is current moved down to the middle of the window's clear area, a
// click now brings its card to that line (the `@3xl:top-[8.5rem]` and BARE
// `#id` HREFS paragraphs, and PriceMenu.tsx's WHERE THE LINE IS, AND WHERE A
// CLICK LANDS), and a card a pointer jumped to no longer wears the focus ring
// (CategoryCard.tsx's THE RING IS THE KEYBOARD'S). And on 2026-10-02 the band
// took THE BAND SCALE (its paragraph below): on a laptop or a desktop the menu
// and the cards grow together with the window past the owner's reference, one
// design at every width — and, by THE FLOOR in the same paragraph, never draw
// smaller than the theme.
//
// ── IT IS A DUMB BAND (owner fb-459, board §2c.1) — and that is the whole
// interface. It imports no data, calls no `t()`, holds no message key, formats
// nothing and does not know what a `Locale` is: every visible word arrives as
// a prop, finished and already translated. The ONE populator is the page
// (app/[locale]/services/page.tsx), which walks the price list once, picks the
// language's words, formats each amount with the one ICU sentence key and
// hands the result over (board §1.4). Consequences worth stating, because they
// are the reason for the shape: the band is reviewable in Storybook at every
// width and language before the real tariff exists, its tests can never be
// broken by an edit to the list or to a message file, and a Home teaser could
// one day print a single category through the same component.
// Tier-wise this is §4's props-in SHARED COMPOSITION sub-kind — the
// SectionHeading / ReviewCard / PersonnelCard group — not a wired page BAND
// like Header, Footer or ClinicLocation.
//
// ── ONE ISLAND, THE MENU CARD (§16; owner 2026-09-14, reversing board §4.3
// option A; widened from the list to the card on the owner's 2026-09-18
// verdict, next paragraph). This file ships NO JavaScript: no 'use client',
// no state, no hook, no handler — the band, the grid, every category card and
// all its price rows compile into the static HTML of every locale's services
// page and stay inert. What the visitor downloads is ./PriceMenu — the menu
// card: its <nav> landmark, its <h2> and the list of links — because TWO
// things about it depend on this visitor: which category they are currently
// looking at (one attribute on one link and, since 2026-09-29, one on the card
// that link points at; lib/scroll-spy — scroll marks the menu, a click marks
// it too, and the click's mark survives the scrolling the jump itself causes,
// the pin) and, since 2026-09-18, where the card itself is held when it is
// taller than their window (one attribute and one number on the <nav>;
// lib/sticky-rail). PriceList.test.tsx pins the split from the
// source text of all three files, because no runtime assertion can see a
// directive: this file and CategoryCard.tsx must carry none, PriceMenu.tsx
// exactly one. PRICE_MENU_ID stays HERE and travels down as a prop: a value
// exported from a 'use client' module reaches a server component as a client
// reference, not as the string it was, so the band's public address lives on
// the server side of the boundary and the island derives the title's id from
// it (the CategoryCard idiom).
//
// ── THE BAND RECIPE, APPLIED (the standing law in ui/Container's header, its
// "THE PAGE-BAND RECIPE" block): the semantic full-bleed outer owns the paint,
// <Container> owns the width and the container-query context, and the box one
// level in carries the band's own vertical rhythm. Here that box is ALSO the
// two-track grid — an element cannot query its own size (the ClinicLocation D7
// lesson), so every `@`-step in this file measures Container's column from
// inside it — and, since 2026-10-02, the box that wears the band scale (the
// recipe's rule 5; the next paragraph).
//
// ── THE BAND SCALE (2026-10-02, CLAUDE.md §15.32 — ui/Container's THE BAND
// SCALE). The owner, verbatim: "i need this responsiveness refactor also on
// the prices page. the best ration i see is on 1392 x 1179. so i do not want
// the cards jsut to wide, i want the menu and cards to adapt too with the
// width of the screen". Until then every length in the band was rem, so a
// wider window made wider CARDS and nothing in them larger: the menu held its
// floor and the cards took every pixel the column gained. RHYTHM (below) now
// wears BOTH of ui/Container's band-scale strings, so on a laptop or a desktop
// — a mouse or trackpad, in an engine that registers custom properties, from a
// column of max(56rem, 896px) — the whole band, menu and cards, is ONE design
// drawn at a 1106px column and scaled to its own: every theme length on the
// box and inside it (the gaps, the stepped `py`, every card's inset and
// corner, every text step, the menu's links and their 44px boxes) is drawn in
// the design pixel, min(column, 96rem) / 1106 — never under the theme's own,
// THE FLOOR below — and past a 96rem column the band stops growing and
// centres. The owner's own window sits on that reference — 1392 − 15 − 2 ×
// 139.2 = 1098.6px of column under a classic scrollbar, s = 0.993 by the
// column alone, 0.7 % from 1106, and exactly 1 under THE FLOOR — so the band
// takes THE SAME design pixel as every band of Home and Team past the
// reference, with no reference of its own and no zoom: one pixel across the
// site is the point of the promotion. Below the step, on every
// touch device and in an engine that cannot register, the strings declare
// nothing and remap nothing: the band is its rem self, every pixel as before
// (§7). UNCONDITIONAL — no `scaled` prop, unlike a band that also stands on a
// page that does not scale: this band's one page is the Services page, where
// it is the only band (under the page's `sr-only` <h1>), so there is no other
// band on that page for its headings to disagree with.
// THE FLOOR (the same day, CLAUDE.md §15.32 round 2 — the owner delegated the
// open calls, verbatim: "decide for me on decisions and create pr"): this band
// NEVER draws SMALLER than the theme. Its design pixel is max(1rem / 16,
// min(column, 96rem) / 1106): the band's own floor class (BAND_FLOOR, below)
// sets the first term on the rhythm box, where ui/Container's pixel
// declaration reads it (that file's THE FLOOR — this band its one wearer).
// WHY: the owner's own BACKLOG entry 5 asked for LARGER price text for older
// patients, never smaller, and what he complained of was the wide screens —
// "i do not want the cards jsut to wide". The plain scale would have answered
// the wide screens and, on every laptop under the reference, drawn the prices
// smaller than they are today (s = 0.81 at the step); the floor keeps the
// first half and refuses the second. WHAT IT CHANGES, against the plain
// scale: from the scale's step up to a ≈ 1401px window (a 1106px column under
// a classic scrollbar) the band is the reference itself — exactly the look
// develop shipped, the menu 240 × 655 with eleven categories, the card titles
// 36px, the rows 16px — at the owner's 1392 window, at 1280 and at the step
// alike, and it scales only past that window. The cards' gap never falls
// under 32px, so a glowing card's tail never reaches the next card (THE
// GLOW); a menu link's box never falls under 44px (THE MENU LINKS); the
// German stress label never overruns the menu's content box (THE TWO
// TRACKS); and at the default root the step is no longer a jump — under it
// the band is rem, at it the floor holds the same pixels. 1rem / 16 is the
// theme's own pixel at ANY root, so under the reference a larger default font
// size and a browser zoom enlarge the band exactly as rem does. What the
// regime trades — a zoom that leaves text the same size on screen, a default
// font size not followed (ui/Container's record, born as sections/
// DoctorShowcase's D10) — this band therefore makes only past the reference.
// WHAT HAD TO BE RE-SPELLED, AND WHAT STAYS OUT, each on purpose:
//   · THE MENU TRACK'S FLOOR is spelled in the spacing step now, sixty steps,
//     where it was a literal 15rem — a literal is no theme length, so inside
//     the scale it would have stayed 240px while everything around it grew
//     (THE TWO TRACKS, next);
//   · THE PILL'S PAIR — the menu's 8.5rem sticky line and every card's 2.5rem
//     of landing air — moved the other way, from spacing steps to rem
//     LITERALS that the scale cannot remap, because the header pill they
//     clear does not scale (the `@3xl:top-[8.5rem]` paragraph);
//   · hairlines and the glow stay px — the 1px rules, the focus ring and
//     ui/Card's `--shadow-aura`, as in every scaled band (THE GLOW's note on
//     the cards' gap);
//   · the container-query STEPS read the root's rem, never the band's pixel —
//     the regime's own rule: the split still falls at a 48rem column, and
//     inside the scale every card's rows sit beside their prices (its `@sm`)
//     and every title answers its own card (`@md`) exactly as they do at the
//     reference.
// PriceList.scale.test.tsx reads every one of those lengths back from the real
// stylesheet — under the reference, past it, past the cap, under the step and
// at a larger root, where the floor rises with the theme.
//
// ── THE TWO TRACKS, and why "20%" is really a floor (board §3.2, §8.4):
// `minmax(calc(var(--spacing)*60),1fr) 4fr` gives the cards four shares of the
// free space for every one of the menu's — the owner's 20/80 — but never lets
// the menu track fall below SIXTY SPACING STEPS: 15rem wherever the band scale
// does not apply, 240 design pixels wherever it does. It was spelled `15rem`
// until 2026-10-02 — the same pixels outside the scale — and a literal is no
// theme length, so inside the scale the floor would have stayed 240px while
// the cards and every word beside it grew. OUTSIDE the scale, on every named
// viewport below 1920 the FLOOR is what actually decides the width (at 1536
// the column is 1229px and 20% would be 239px, a hair under the floor); only
// at 1920 does the percentage win. INSIDE it the floor decides at EVERY width:
// up to the reference the band is its rem self (THE FLOOR, the pixel's) on a
// column of at most 1106px, and past it the column is 1106 design pixels —
// either way (1106 − 32) / 5 = 214.8 < 240 at the most — so the menu is 240
// (design) pixels and the cards the rest: 624px at the step, 834 at the
// reference, 1158px beside a 333px menu at the cap. The floor exists for
// GERMAN: a menu label is interactive text, so §15.14 forbids
// syllable-breaking it, and the stress word „Kinderzahnheilkunde" at the
// 1.125rem body size is 181.4px wide — its link 182 of the 190px the floor
// leaves inside the card, 0.6px to spare (measured 2026-10-02, the link's
// weight 500). Inside the scale the pixel's floor keeps every one of those
// numbers at the reference's or more, and past the reference the typeface's
// optical size draws the word NARROWER per em as it grows (sections/
// DoctorShowcase's D10 records the effect), so its room only widens — ≈ 5px
// at a 1536 window, ≈ 10px at the cap (measured): it never overruns. (The
// plain scale let it overrun under s ≈ 0.986, a few pixels into the card's
// padding; THE FLOOR removed that.) The German stories are where that is
// measured, not asserted from a table.
//
// ── `@3xl:items-start` IS WHAT MAKES THE MENU STICKY AT ALL, and it looks
// like cosmetics (board §3.3): a grid item is STRETCHED to its row's height by
// default, so without it the menu card would be exactly as tall as the whole
// cards column and would have nothing left to stick against — `position:
// sticky` would apply and visibly do nothing. `items-start` on the grid (i.e.
// `align-self: start` on both tracks) gives the card its content height back,
// and the sticky then runs against the grid's own box.
//
// ── `@3xl:top-[8.5rem]` IS THE FIFTH COUPLED SPELLING OF THE HEADER PILL'S
// REACH, PLUS THE AIR THE GLOW NEEDS (owner 2026-09-14: move the menu "1-2
// rem" down). It rides the island's <nav> (./PriceMenu) since the card became
// the island, but it is THIS band's number and this paragraph is where it is
// argued. KEEP-IN-SYNC with sections/Header.tsx's "THE MOUNT CONTRACT" block
// (item a) and with src/styles/globals.css's `scroll-padding-top` — cited by
// those anchors, never by line number (§17.7). The pill floats at `top-4`
// (1rem) and is `h-20` (5rem) at every width, so its reach is 6rem; what
// changed is how much air rides on top of it, and the number is MEASURED
// rather than chosen: the pill wears `--shadow-aura: 0 8px 22px …`, whose glow
// tints the page ground down to y = 126px (pixel-sampled under Chromium at
// 1280, 1536 and 1920, counting any channel that differs from the untinted
// ground by more than 1/255). The old 7rem put the menu's top edge at 112px —
// 14px INSIDE that glow, which is exactly what the owner saw. 8.5rem = 136px
// clears it by 10px, and it is the midpoint of the range they asked for.
// So: reach 6rem + 2.5rem of air = 8.5rem. The mount contract's own words
// hold — the numbers move together or the debt reopens — and the board's
// recorded alternative (promote the reach to one `--bar-reach` token every
// spelling reads) stays a named trigger for a hygiene lane touching those
// files, deliberately not this band's business.
// A REM LITERAL, AND THAT IS THE POINT (2026-10-02, THE BAND SCALE). Until
// then the number was spelled in the spacing step — thirty-four of them, the
// same 136px — and inside the scale a spacing step is a DESIGN length, while
// the pill this number clears is not: the Header is the shell's chrome and
// never a band (§15.32 scales the bands), and globals.css's `scroll-padding-
// top: 6rem` is reset-tier rem. Under the reference the two spellings are the
// same length at any root — the band's pixel there is THE FLOOR's 1rem / 16,
// so thirty-four steps are 8.5rem — but past it a step grows with the band,
// and the menu's line would have parted from the pill: 149px at a 1536 window
// (s = 1.10), 189px at the cap, the menu floating ever further under the bar
// it is meant to sit against — and from the cards' line too (next). Spelled
// `@3xl:top-[8.5rem]`, an arbitrary value that no theme variable carries, it
// is 136px inside the scale and out: `design-scale` remaps theme variables,
// and a rem literal reads the root's font size, which no band touches.
// THE SAME 2.5rem RIDES THE CARDS, which is the point of the pair: each
// CategoryCard carries `scroll-mt-[2.5rem]` over the global
// `scroll-padding-top: 6rem` — a rem literal for the same reason, 40px at
// every width; as a step it would have been 40px up to the reference and
// 56px at the cap, its line there 16px below the menu's — so a jumped-to card
// too tall to be centred comes to rest with its top edge on the very line the
// stuck menu's top edge sits on. Two numbers, one visual line, at every width. A card that FITS the window's clear area rests centred in
// it instead (owner 2026-09-29: "the go to card when you click on the meniu
// on an option should be more to the center of the screen") — the island's
// scroll-spy plans that landing from this same 2.5rem, its floor, and writes
// it over the class (PriceMenu.tsx's WHERE THE LINE IS, AND WHERE A CLICK
// LANDS).
//
// ── NO HEIGHT BELT — THE MENU IS NEVER A SCROLL CONTAINER (owner 2026-09-18,
// reversing board §3.3's belt). The band shipped with the NavMenu precedent
// on the card, `max-h-[calc(100dvh-9.5rem)] overflow-y-auto`, on the argument
// that a stuck menu taller than the window would otherwise hide its last
// categories. What that belt did in practice was MEASURED in Chromium against
// the built export: the menu is 653px tall with eleven categories (Romanian
// and German identical), so under its 136px offset plus 16px of bottom air a
// window must be at least 805px tall — and every laptop got a nested
// scrollbar inside the card with the wheel scrolling the menu instead of the
// page:
//
//     window                      innerHeight   usable (−136 −16)   fits?
//     1366×768 laptop                     633                 481      no
//     1080p at 125% scaling               737                 585      no
//     1280×800 MacBook                    688                 536      no
//     1440×900 MacBook                    789                 637      no
//     1080p desktop at 100%               945                 793     yes
//
// "That should absolutely not be possible" (owner). Nor can it be shrunk away:
// 11 × 44px links = 484px is already more than the 481px the first row
// leaves, and 44px is the §9 target floor. So the belt is gone and the card
// is held by lib/sticky-rail — DIRECTION-AWARE PINNING, read by ./PriceMenu:
// a menu that FITS keeps exactly the CSS above (sticky at the 8.5rem line,
// nothing written); a taller one rides with the page while the visitor
// scrolls down until its bottom edge meets the window's bottom line and pins
// there, rides with the page while they scroll up until its top edge meets the
// 8.5rem line and pins there, and between the two — after a reversal — holds
// a frozen relative offset so it never jumps. Every link is reachable by
// scrolling the PAGE, with the wheel, a drag or the keys; a link that takes
// focus pins whichever edge reveals it. The island's header records what it
// writes to make that real (one attribute, one number, one gated class) and
// why the static classes are untouched.
// INSIDE THE BAND SCALE only the last row of that table moves. Up to the
// reference THE FLOOR keeps the menu at its own 655px (eleven categories, the
// planner's probe on develop 3bd21bd, 2026-10-02) — every laptop row above is
// unchanged — and past it the menu is a design length like everything else in
// the band, its height the reference's × s: ≈ 901px on the 1080p desktop
// (s = 1.375, derived; measured 769px at a 1300px column and 908 at the cap).
// So that desktop's 793px no longer hold the menu, and the rail pins it there
// too, by the same rules. The rail needs no word about it: it measures the
// card it holds, and the line it pins against is the 8.5rem that never scales
// (the `@3xl:top-[8.5rem]` paragraph). The bottom air it keeps is
// lib/sticky-rail's own 1rem of the root.
// TRAP, recorded because it is invisible: `overflow-x-hidden` anywhere above
// the menu would turn that ancestor into a scroll container and KILL the
// sticky. If this band ever needs a horizontal belt it takes the reviews
// band's `overflow-x-clip` spelling, which clips without creating one.
//
// ── BARE `#id` HREFS, NOT `localeHref` (board §4.1, §15.13). Inside the page
// the bare fragment is the robust spelling: the browser resolves it against
// the current document, whatever the locale prefix, the trailing slash or the
// interim base path happen to be. `localeHref` is for links from OTHER pages —
// a future Home teaser saying "see the endodontics prices" — and it keeps
// fragments for exactly that. Both halves of the jump are already global and
// need no line here: `scroll-padding-top: 6rem` lands the target below the
// pill, and `scroll-behavior: smooth` under `prefers-reduced-motion:
// no-preference` glides for those who allow motion and teleports for those who
// do not (§9). With one exception, since 2026-09-29: WHERE below the pill each
// card comes to rest is no longer the stylesheet's alone to say — the island's
// scroll-spy writes each card's `scroll-margin-top` so the jump lands it on
// the line that names it current (PriceMenu.tsx's WHERE THE LINE IS, AND WHERE
// A CLICK LANDS). The href, the jump and the glide stay the browser's.
//
// ── THE MENU LINKS ARE ui/TextButton, COMPOSED — not its class string copied.
// They are rendered by ./PriceMenu (the island), because the CURRENT one wears
// the atom's own `active` variant: the label in the `accent` lavender with the
// underline drawn at full width, statically — the END state of the hover
// animation, which is precisely what the owner asked the current item to look
// like. The Footer's nav list is otherwise the same object (a vertical column
// of quiet links through `asChild` onto a plain <a>, `-ml-2` pulling the
// label's optical edge back over the atom's `px-2` so it lines up with the
// card's title), and the atom is where that look is spelled ONCE. Three things
// this band would otherwise have had to restate and could have got wrong:
// `min-h-11` — 2.75rem = 44px, the §9 target floor for a primary action, in
// rem so browser zoom carries it; inside the band scale 44 DESIGN pixels,
// drawn with the label it frames, and never fewer than 44px — THE FLOOR's
// doing: 44 up to the reference, 61 at the cap — `hyphens-none` (§15.14: an
// interactive label never syllable-breaks), and the focus-visible ring. NEVER
// restyle these links to the `anchor` role token: #00a968 on white measures
// 3.05:1, a fail at 4.5:1 for 18px regular text (G2 a11y, measured) — the
// atom's ink-at-rest is what passes. The links are <a>s and not buttons
// because a jump is NAVIGATION the browser performs itself (§9: semantic HTML
// first).
//
// ── THE GLOW IS A CARD KIND, AND IT COSTS THE COLUMN A GAP (owner
// 2026-09-14: the aura on every card here; owner 2026-09-29: on the menu
// card, and on the ONE category card the visitor is at — "what category card
// is not selected gets no aura"). `aura` is ui/Card's own prop — chosen per
// card KIND in the section that composes it (fb-378/381), which is why this
// band passes it rather than naming a shadow utility of its own; the atom
// holds every spelling of `--shadow-aura` a card can wear and
// tests/unit/aura-token.test.ts's census counts them there. The two kinds in
// this band ask for two different values: the menu card WEARS the glow
// (`aura`), the category cards are ARMED with it (`aura="current"`) and show
// it while the island has marked them. The consequence for the layout is
// unchanged, because ANY card can be the glowing one: the cards' `gap-8`.
// The glow is `0 8px 22px`, i.e. roughly 22px of blur around the box and
// ~30px below it, so the 24px of a `gap-6` column would let a glow run into
// the next card's edge. 32px clears it.
// INSIDE THE BAND SCALE that gap is 32 DESIGN pixels while the glow stays px
// (the scale remaps no shadow), and THE FLOOR keeps the gap at 32px or more —
// 32 up to the reference, 44.4 at the cap — so the glow's ~30px tail never
// reaches the next card at any width.
//
// ── WHAT THE BAND DELIBERATELY DOES NOT NAME: itself. The root <section>
// carries no `aria-labelledby` of its own, and the naming attributes stay OPEN
// on the props (unlike CategoryCard, which Omits them): the page owns the
// intro heading above this band and names it from there, exactly as the board
// sketches it (`<section aria-labelledby="prices-title">`). What IS named here
// is the menu — a `<nav>` landmark labelled by its own visible title, the
// Footer's pattern, which also keeps the house rule that the role word never
// appears in the name.

/**
 * The menu card's `id`. Exported because it is a PUBLIC address: it shows up
 * in the URL bar as `#price-categories`, a page may link to it, and a test or
 * a story asserting that link should not have to retype the string. English,
 * like every fragment id in this band (owner fb-461).
 */
export const PRICE_MENU_ID = 'price-categories';

// The row and category shapes live with the component that renders them
// (CategoryCard.tsx) and are re-exported here so a page imports the band's
// whole contract from one path. A re-export, never a second declaration.
export type { PriceCategoryProps, PriceRowProps } from './CategoryCard';

type PriceListOwnProps = Readonly<{
  /**
   * The menu card's visible title (an <h2>) — and, through
   * `aria-labelledby`, the name of the navigation landmark it sits in.
   * Finished, already-translated text (§8.1): „Categorii", "Kategorien".
   */
  menuTitle: string;
  /**
   * The tariff, in the order it should be read. The SAME array prints the menu
   * and the cards, which is what makes a menu entry without a card (or the
   * reverse) impossible by construction — no test has to check for it.
   * An empty list renders NOTHING at all (see the guard in the body).
   */
  categories: readonly PriceCategoryProps[];
}>;

export type PriceListProps = PriceListOwnProps &
  // The native <section> surface, minus the band's own names and minus
  // `children` (content arrives as `categories`; without the Omit a caller
  // could nest something, type-check, and watch it vanish — the SectionHeading
  // precedent). React 19 carries `ref` inside these props, so it needs no
  // mention of its own (§6.8).
  Omit<ComponentProps<'section'>, keyof PriceListOwnProps | 'children'>;

/**
 * THE FLOOR — the band's own class, worn on the rhythm box beside
 * ui/Container's two band-scale strings (the header's THE BAND SCALE, its THE
 * FLOOR; ui/Container's paragraph of the same name). It sets `--band-floor`,
 * the property ui/Container's pixel declaration reads (0px where nothing sets
 * it), to one sixteenth of a rem, so this band's design pixel is
 * max(1rem / 16, min(column, 96rem) / 1106) and the band never draws smaller
 * than the theme.
 *   · ONE SIXTEENTH OF A REM is the theme's own pixel at ANY root: the theme's
 *     lengths are rem, and a design pixel of 1rem / 16 draws every one of them
 *     exactly as rem does. So under the reference the band IS its rem self — a
 *     larger default font size and a browser zoom enlarge it exactly as rem
 *     does — and past the reference the column's pixel takes over.
 *   · IT MUST SIT ON THE BOX THAT WEARS `bandScaleClasses`: that box declares
 *     the design pixel, and the declaration reads the floor where it is
 *     computed. Anywhere above, it would reach every scaled box below it; on a
 *     box below, the declaration would never see it.
 *   · UNREGISTERED AND INHERITED, like ui/Container's zoom, so its name is
 *     fenced: tests/unit/design-scale.test.ts counts ONE setter in src/ — this
 *     constant, comments stripped — and ui/Container's one read. Inert outside
 *     the regime: its one reader is the pixel declaration the same gates hold
 *     back.
 * One whole static string, because Tailwind reads class names from source
 * text — and spelled here alone: the tests assemble it from its parts.
 */
const BAND_FLOOR = '[--band-floor:0.0625rem]';

/**
 * THE RHYTHM BOX — the band's own rhythm and its grid, then ui/Container's two
 * band-scale strings (the header's THE BAND SCALE; ui/Container's recipe rule
 * 5, §15.32) and the band's floor beside them, composed once, here, at module
 * scope. Tailwind reads class names from source text, so every class stands
 * whole inside a string literal: the band's own in this file, the scale's in
 * Container.tsx.
 *   · THE BAND'S OWN: the grid, its `gap-8` (§6.4: the section owns ALL child
 *     spacing), the stepped `py` (the recipe's rule 3), the two tracks from
 *     `@3xl` — the menu's floor in the spacing step (THE TWO TRACKS) — and
 *     `@3xl:items-start`, load-bearing for the sticky menu (the header).
 *   · `bandColumnClasses`: `mx-auto` and `w-full`, and the 96rem cap behind
 *     `scalable:` — so past the cap the grid centres in its column.
 *   · `bandScaleClasses`: the design pixel and the remap, behind the regime's
 *     one variant chain.
 *   · BAND_FLOOR: the design pixel's floor, the theme's own (its JSDoc).
 * The band spells none of the regime: tests/unit/design-scale.test.ts holds
 * the two strings to their one spelling in Container.tsx, this file to an
 * import of both and to the one floor setter; PriceList.test.tsx holds this
 * composition token for token, and PriceList.scale.test.tsx what the engine
 * draws with it.
 */
const RHYTHM = cx(
  'grid gap-8 py-12 @lg:py-16 @3xl:py-20 @3xl:grid-cols-[minmax(calc(var(--spacing)*60),1fr)_4fr] @3xl:items-start',
  bandColumnClasses,
  bandScaleClasses,
  BAND_FLOOR,
);

export function PriceList({
  menuTitle,
  categories,
  className,
  ...rest
}: PriceListProps): ReactElement | null {
  // AN EMPTY TARIFF RENDERS NOTHING — the sections/ReviewsCarousel answer,
  // verbatim (its own `reviews.length === 0` exit), because the two bands are
  // the same kind of object: a props-in composition whose content is a list
  // somebody else owns. Without it the prop type advertises a value the band
  // dies on: ./PriceMenu builds its scroll-spy from these ids, and
  // lib/scroll-spy refuses an empty list out loud (rightly — a navigation with
  // nothing to point at has no current item), so `<PriceList categories={[]} />`
  // type-checks and then kills `next build` with a RangeError named three
  // levels below the API that was misused (G2 typescript, 2026-09-14). The
  // guard belongs HERE and not in the island: an early return there would sit
  // above the island's hooks. It is also why the band, not the menu, owns
  // the empty case — a header teaser printing one filtered category is the
  // caller this is really for.
  if (categories.length === 0) return null;

  return (
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else — no gutter here, no outer margin (§6.4: the page owns the
    // rhythm between its bands). `bg-page` is the ground every content band on
    // this site stands on. className is merged caller-last (§6.8).
    <section {...rest} className={cx('bg-page', className)}>
      <Container>
        {/* The rhythm box AND the grid, one element (RHYTHM): the band's own
            stepped `py` (the recipe's rule 3) plus the two tracks, and the
            band scale. Both steps measure Container's column from inside it —
            `@lg` = 32rem of column, `@3xl` = 48rem, which with the 10vw
            gutters is a viewport of ~960px, the same step ClinicLocation flips
            on so the site's bands flip together — and so does the scale's
            own, max(56rem, 896px). `gap-8` is the section owning ALL child
            spacing (§6.4). `items-start` is load-bearing for the sticky
            menu — see the header. */}
        <div className={RHYTHM}>
          {/* THE ISLAND: the whole menu card — ui/Card asChild onto the <nav>
              landmark, its <h2>, the list (PriceMenu.tsx says why the card
              and not the list). It is the grid's FIRST child, and lib/
              sticky-rail reads its normal-flow position as this grid's
              content edge: keep it first, keep `items-start`. Only the
              finished title and the id/name pairs cross the boundary — never
              the rows, which are server HTML. */}
          {/* THE KEY IS THE RING'S IDENTITY (G2 react, 2026-09-14). The
              island freezes the ids it watches in a useState initializer and
              has no `setIds` — deliberately, because page data on this site
              is compiled at build time (§16) and a tariff cannot change while
              a visitor reads it. The one place that is not true is the
              workbench: Storybook controls can swap one deck's categories for
              another's on a MOUNTED story, and the spy would go on walking ids
              no link carries, marking nothing. Keying the island by its own id
              list makes React remount it exactly when the ring would otherwise
              go stale — the rail's element with it, found again by the same id
              — and on the real page the key never changes, so it costs nothing
              there. */}
          <PriceMenu
            key={JSON.stringify(categories.map((category) => category.id))}
            id={PRICE_MENU_ID}
            title={menuTitle}
            items={categories.map(({ id, name }) => ({ id, name }))}
          />
          {/* The cards column. `gap-8` between cards is the section owning its
              children's spacing (§6.4) — and it is the aura's number, see the
              header; the cards themselves own no height — each is as tall as
              its rows (ui/Card D4). */}
          <div className="flex flex-col gap-8">
            {categories.map((category) => (
              <CategoryCard key={category.id} {...category} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
