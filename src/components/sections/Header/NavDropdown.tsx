'use client';

import { type CSSProperties, type ReactElement, useId } from 'react';
import { ChevronRight } from '@/assets/glyphs/ChevronRight';
import { Card } from '@/components/ui/Card/Card';
import { cx } from '@/lib/cx/cx';
import { type NavRoute, NavItem } from './NavItem';
import type { NavSectionLink, SectionedPath } from './navSectionLinks';
import { NavSectionEntry } from './NavSectionEntry';
import type { DropdownItemHandlers } from './useNavDropdowns';

// sections/Header — ONE dropdown item of the bar row: the word, its ⌄ and the
// card of its page's sections (CLAUDE.md §15.40; the owner, 2026-10-15:
// "a navigation dropdown on hover JUST ON THE TOP BAR ELEMNTS which drops down
// smoothly with sections of that particular page … but it should open an
// adjacent card … for desktop … do it with one of my cards"). Servicii and
// Echipa wear it; Acasă and Blog stay a plain NavItem ("blog and home should
// not have this"). The STATE is HeaderNav's (./useNavDropdowns — one open card
// for the whole row); this file draws one item from it and reports what the
// pointer, the focus and the ⌄ do. The pattern is the APG's "disclosure
// navigation menu": links and disclosure buttons, never role="menu" — the card
// is no dialog and no menu, its entries are ordinary links in a nested list.
//
// ── THE ITEM SPANS THE ROW'S WHOLE HEIGHT (HeaderNav stretches the <nav>, the
// <ul> and every <li> to the bar's 5rem): hovering above or below the word
// counts — for OPENING a card while none is open, and for keeping one open —
// and `top-full` below is the row's own bottom edge. What those bands do
// NOT do is SWAP: with a card open, another item takes its place only once
// the pointer is on that item's WORD (./useNavDropdowns' THE SWAP). This card
// is two columns wide and reaches under the neighbouring words — apple.com's
// full-width panel, whose instant swap the timing copies, reaches under
// none — so a pointer crossing the band under „Echipa" on its way from
// „Servicii" into the card's right column must leave Servicii's card where it
// is: it only starts the grace, and entering the card cancels it. The word
// stays centred (`flex items-center`) exactly where it always was, and
// NOTHING new takes inline space — the ⌄, the card, its pointer and the
// word's arrow are absolutely placed — so the row is as wide as it was to the
// pixel and the bar's step arithmetic stands (Header.tsx's THE BREAKPOINT IS
// A CONTAINER STEP; Header.step.test.tsx).
// The item is a NAMED group, `group/nav-dropdown` — never a bare `group`
// (Header.tsx's THE GROUP MUST STAY NAMED: the burger's morph reads the
// nearest unnamed one) — and wears its path as `data-nav-dropdown`, the hook
// ./useNavDropdowns and the visual net's `pin-dropdown` find it by.
//
// ── THE WORD is NavItem: it still navigates, and it still wears its own
// hover underline and its current-page mark — and since 2026-10-16 it HOLDS
// its hover look while its card is open, `held={open}` (ui/TextButton's THE
// HELD LOOK; the owner: "if a dropdown is being clicked or hovered it has to
// light up lilla and trigger animation and leave it on until card or section
// unfocus or change. so also while button triggered cards is open, button
// must behave as if focused"). `open` is this item's, however the card opened
// — the hover's intent or the ⌄ — so the lavender label and the full rule
// stay on while the pointer travels down into the card, sweep out on the
// hover's own clocks when the card closes (200ms the label, 300ms the rule;
// at once under reduced motion), and on a swap the old word lets go as the
// new one takes hold. The look of a hover, never a focus ring, and nothing is
// announced by it: the ⌄ beside the word says `aria-expanded`. And the word
// carries THE ARROW (below) inside its link, through NavItem's `trailing`
// slot. RECORDED (the accessibility review's NIT-2, 2026-10-16): `held`
// wears `active`'s look, so on /services with Echipa's card open, two words
// wear the current-page look at once — the lavender label and the full rule —
// and only `aria-current` tells them apart. No AA criterion asks more (the
// location-telling one, SC 2.4.8, is AAA); the owner's to weigh.
//
// ── THE TOGGLE — Apple's ⌄, the keyboard's way in (measured on apple.com,
// 2026-10-15: Tab reaches the word, the NEXT Tab reveals a small button after
// it, Enter opens, Tab walks into the links, Escape closes and returns to the
// button). A plain <button>, named „Submeniul Servicii" (`common.nav.submenu`,
// HeaderNav's t()), `aria-expanded` and `aria-controls` the card. IT DRAWS NO
// GLYPH since 2026-10-16: the arrow every visitor sees is the WORD's (THE
// ARROW, below), so the two can never double, and the ⌄ paints nothing at
// all but its focus ring. Until that day it drew the chevron itself, at the
// glyph's `md` size, and hid it from the mouse with an opacity rule; the
// arrow took over the drawing, and with nothing left to hide the opacity rule
// went with it. CLICK-THROUGH until the keyboard is inside the item —
// `pointer-events-none`, lifted by `group-has-[:focus-visible]/nav-dropdown:`
// (a keyboard focus anywhere in the item: the word, the ⌄, an entry), by its
// own `focus-visible:` (the belt for an engine without :has()) and while the
// card it opened is PINNED — so at rest the mouse on the arrow is on the
// WORD: its hover, its click, its link. In the Tab order always, which is the
// point — a screen reader hears „Servicii, link" then „Submeniul Servicii,
// button, collapsed". Absolutely placed and centred on the GAP between the
// two words — `-end-4` lays its 24px box over this word's 8px right padding,
// the row's 8px gap and the next word's 8px left padding, touching neither
// word's letters — 24 × 44 (`w-6 h-11` — SC 2.5.8's 24px floor), so it takes
// no inline space; `z-10` keeps its ring over the next word's box. The ring
// is the menu buttons' 2px of --focus on the soft corner, drawn 2px INSIDE
// the box (`-outline-offset-2`, where the menu buttons keep 2px outside
// theirs): the box's sides stand in the two words' 8px paddings, so a ring
// inside it never reaches either word's text — at a 2px offset outside it ran
// 4px into both (seen on the preview, 2026-10-15), and even on the edge it
// crossed each padding by 2px. Focused, the ring SURROUNDS THE ARROW: the
// arrow's 16px box fills the ⌄'s first 16px, so its chevron, 4 to 12px past
// the text, stands in the left part of the ring, clear of its 2px band.
// While the keyboard is in the item or the card is pinned, the ⌄ is the one
// the pointer meets over the arrow: a click there is the ⌄'s — it opens the
// card pinned, or closes the pinned one — and never the link's.
// RECORDED, the owner's lever: a TOUCH screen wide enough to show the row (a
// 13″ iPad held sideways) gets no dropdown — the hover is the mouse's and the
// ⌄ is click-through for a finger — so a tap on the word simply opens the
// page, as it did before the dropdowns. Since 2026-10-16 that screen also
// SHOWS the arrow, and a tap on the arrow opens the page with its word.
// Lifting the ⌄'s click-through on coarse pointers (`pointer-coarse:` beside
// the keyboard's rules) would give that screen the lists too — a tap on the
// arrow then opening the card, a tap on the word still the page.
//
// ── THE ARROW (owner, 2026-10-16: "place an svg on the right side of the
// text with an arrow pointing downwards. hinting it is a dropdown menu"). A
// small chevron right after „Servicii" and „Echipa", drawn for every visitor:
// the ChevronRight glyph at its `sm` size — a 16px box, the chevron drawn in
// it 8 × 4px once turned — handed to the word through NavItem's `trailing`
// slot, so it is drawn INSIDE the link. Placed ABSOLUTELY against the link's
// own `relative` box — `start-[calc(100%-0.5rem)]`: the link's 8px right
// padding back from its edge is where the TEXT ends; `inset-y-0 my-auto`:
// auto margins centre its 16px box on the word's own line — so it takes no
// inline space, and every row is as wide as it was to the pixel
// (Header.step.test.tsx holds each language). Its 16px box runs from the
// text's end to 8px past the link, exactly the row's 8px gap, ending where
// the next word's box begins; the chevron, 4px of empty box on each side,
// stands 4px after the text and 12px before the next word's text: it belongs
// to its own word.
// It points DOWN at rest (`rotate: 90deg` — the glyph points right) and UP
// while the card is open (`rotate: -90deg`): an INLINE style from `open`,
// turned over the TextButton underline's 300ms (`glyphMotion`, a class; at
// once under reduced motion) — the phone row's own turn and clock.
// THE LOAD RACE — why the turn is inline and the centring a margin (measured
// on the built export by the planner's e2e, 2026-10-16: at 1920 × 945 an
// arrow read 81.7476deg where 90deg was due; then, probing fresh Chromium
// pages every 50ms from domcontentloaded, on about 1 load in 3, at 1366 × 633
// and 1920 × 945 alike, BOTH arrows turned on their own during the load —
// 0deg → 17° → 55° → 70° → 82° → 88° → 90deg over ~300ms). The svg is in the
// HTML before the stylesheet applies. A style computation in that window — a
// script, or a probe, forcing style — resolves it with the sheet's values
// missing; when the sheet arrives, a class-set `rotate` and its 300ms
// transition land in the SAME style change, and CSS transitions animate that
// change. Reproduced in Header.dropdowns.test.tsx's frame with the round-3
// classes: `rotate` AND `translate` both started transitions there (61.16°
// and −34 % of the −50 % centring, 100ms in) — the arrow turned AND slid 8px
// up. So nothing on the transition list (transform, translate, scale, rotate)
// is set by a class: the turn is printed inline by the server, so the first
// style computation already points the arrow down and only a real open or
// close changes it; the centring is margins, which no transition watches.
// (The old ⌄ glyph had the same race, invisibly: it was at opacity 0.) The
// same frame shows the WORD's ink racing too — ui/TextButton's 200ms colour
// transition starting from the browser's link blue on every menu link — which
// the arrow, inheriting that ink, follows: the atom's to fix, not this file's.
// No colour of its own: inside the link it inherits the label's ink — the
// body's at rest, the lavender on hover and while the card is open (THE HELD
// LOOK). And as the link's descendant it IS the word for the pointer: a click
// on it follows the link (the ⌄ over it is click-through at rest), a hover on
// it is the word's :hover and the item's pointerenter, and a move on it is a
// move on the WORD, which is what THE SWAP asks (./useNavDropdowns: inside
// the link). `aria-hidden` — the glyph's own answer when it is given no label
// — so the link is still named by its word alone, „Servicii".
// RECORDED (the accessibility review's NIT-1, 2026-10-16): the WORD's own
// focus ring — ui/TextButton's 2px at a 2px offset, R + 2 to R + 4 past the
// link's right edge R — crosses the chevron's right arm, whose ink reaches
// R + 4.67, and the arrow, painted after the link's own outline, covers that
// short stretch of the ring. The ring stays visible all round the word (SC
// 2.4.7 met); cosmetic, the owner's.
//
// ── THE CARD — ui/Card, white (`surface`), the soft corner and the lilac aura
// (the owner's pick, 2026-10-15), hanging under the word like dentestet.ro's:
// its left edge one rem left of the word's box, so an entry's text starts
// exactly under the word's text (the card's 1rem inset + the entry's own 8px
// = the word's 8px, from a box 1rem to the left). Up to seven entries in one
// column, more in two (Servicii's eleven: six and five), COLUMN-MAJOR —
// `grid-flow-col` over `ceil(n / 2)` rows, an inline style because the count
// is data — so the DOM order, the reading order and the Tab order are one;
// `justify-items-start` so each entry is its own width (never `w-full` on the
// atom, two width utilities would fight — TextButton.tsx's house rule).
// RECORDED (the accessibility review's NIT-4, 2026-10-16): the card has NO
// HEIGHT CAP. It hangs from the sticky bar, so the page's own scroll never
// moves it, and a window at least ~1261px wide (the row drawn) and under
// ~410px tall cannot bring its last entries into view — a keyboard focus can
// land on an entry off screen. The lever, not taken: a maximum height on the
// grid cell, with a scroll of its own.
//
// ── THE CARD IS A BACKDROP, AND THE LIST LIES ON IT (a measured necessity,
// 2026-10-15). ui/Card is a query container (its THE CONTAINER MARK), and the
// inline-size containment that brings costs a card its CONTENT width: a card
// sized `w-max` measured 50px wide — its border and padding alone — around a
// long label. A card can only ever take a width from its parent, and a card
// hanging under a word has no parent wide enough, so the WRAPPER is `w-max`
// and holds a one-cell grid: the Card (empty, stretched to the cell — the
// atom's own paint, corner and glow, through its own props) and, in the SAME
// cell, painted over it, the list, whose content sizes the cell. The list's
// `p-4` is the card's inset; the Card's own padding has nothing to pad.
//
// ── THE BRIDGE. The wrapper starts at the item's bottom (`top-full`), which
// is the pill's padding edge, and its transparent `pt-[calc(0.5rem+1px)]`
// spans the pill's 1px border and the phone panel's own 0.5rem gap — so the
// card hangs 0.5rem below the pill's outer edge (KEEP-IN-SYNC with NavMenu's
// panel, `mt-2` in its `panelClasses`) and the pointer travelling from the
// word down to the card never leaves the item (SC 1.4.13's "hoverable"): the
// wrapper is the item's descendant, so the pointer over its padding is still
// over the item. KEEP-IN-SYNC, too, with THE POINTER's `bottom` below
// (`pointerClasses`): this bridge's 0.5rem and 1px, plus ui/Card's 1px
// `surface` border, is where the pointer's base stands — move one, move the
// other.
//
// ── OPEN AND CLOSED are `data-state` on the wrapper, and the SERVER prints
// CLOSED (§16 rule 2 — the first client render agrees, so hydration is
// quiet): every link is in the static HTML, crawlable, and nobody reaches a
// closed card — `inert` (out of the Tab order, the accessibility tree and hit
// testing the moment it closes, before its fade has ended) and `invisible`
// (visibility hidden, once the fade has).
//
// ── THE MOTION, measured on apple.com (headless Chromium, 2026-10-15): its
// panel grows over ~290ms on a decelerating curve — 43 % / 72 % / 94 % done at
// a quarter / half / three quarters of its time, ≈ easeOutQuad,
// cubic-bezier(0.25, 0.46, 0.45, 0.94) — its links fade in and drift 4px down
// from ~50ms after it, lightly staggered; leaving, the links fade first
// (~150ms) and the panel shrinks after (~185ms, ease-in-out).
//   OPEN   the card is revealed TOP-DOWN by a clip-path inset over 300ms on
//          that curve (the insets reach 2rem past the sides and 3rem below,
//          so the aura is never cut); visible at once (a 0s visibility
//          transition — a Tab pressed in the very frame the ⌄ opened it
//          finds the entries); the entries as ./NavSectionEntry says
//   CLOSE  the entries fade over 150ms; the card clips back up over 200ms
//          ease-in-out 80ms later, and turns `invisible` only when that is
//          done (the visibility transition on the closing side)
// THE OPEN CARD PAINTS ABOVE A CLOSING ONE (`data-[state=open]:z-1`): a swap
// leaves the old card fading for up to 280ms, and the two overlap under the
// row — DOM order alone would paint Echipa's closing card over Servicii's
// opening one on the way back. One step above the row's own boxes, which sit
// at `auto`; the ⌄'s `z-10` stays in the row, never over a card.
// A transition reads its timing from the NEW state's style, so the open
// timing is spelled on the open state and the closing one on the closed
// state. The transition LONGHANDS, never Tailwind's shorthands (./NavSectionEntry
// says why); `motion-reduce:transition-none` on every moving part — under
// reduced motion the card simply appears and disappears (§9). Nothing is told
// by the motion: the state is `aria-expanded`.
//
// ── THE POINTER (owner, 2026-10-16: "there should also be an top roiented
// bump that point to which category the card opened to … triangle who's top
// should just point to category it opened to, so for insance on hover of
// servicii it should point to beneath animation line of servicii but top of
// triangle still on top bar as if it is on a z higher that the top bar" —
// and, on the first look: "triangle is too wide. i have exagerated with the
// lateral angles of the traingle. make the traingle way smaller, like in
// attatched screenshot … the traingle above card pointing to option"). A
// small NOTCH standing on the open card's top edge, its tip under the word —
// the screenshot's: a white tip above a white card, a right angle at the top,
// its base twice its height. Drawn base 20px, height 10px, base angles 45°,
// apex 90° (the first draft's wide, low triangle — 68 × 20, an apex near
// 122° — is history). An inline <svg>, a direct child of the item — whose
// width IS the word's box, the word being its only in-flow child — centred
// on it, 22 × 11 (`w-[1.375rem] h-[0.6875rem]`: the 10px notch over the 1px
// row of the card's border, a viewBox unit to a pixel at the 16px root). It
// is drawn twice in one viewBox: a FILL in the card's own white over the
// whole triangle, its base corners on the box's bottom corners, and a STROKE
// in the card's own frame colour, 1px at any size, along its two sides only
// — an open path, so no line runs along its base. The stroke stops a unit in
// from the fill's corners and half a unit up: a 1px stroke at 45° ending on
// the box's corner would poke past the box's edge, which an svg clips.
// MEASURED by the planner on the built export at 1366 × 768 in Chromium, in
// all five languages: the item spans y 17–97 (the bar's 5rem row), the word
// 35–79 with its 2px rule at 77–79, the bar's 1px border 97–98, the card's 1px
// top border 106–107 (#e9e6e2, line-subtle, on its white ground). The svg's
// bottom edge is the item's bottom + 0.5rem + 1px (THE BRIDGE) + 1px (the
// card's border) = 107 — ONE pixel into the card, so its white base covers the
// card's top border between its two base corners ("its bottom is not drawn")
// and its sides rise from where that border stops, in that border's colour.
// Its top is 107 − 11 = 96: the tip — the two sides meeting at 96.5 — stands
// just inside the bar's bottom edge, "still on top bar", now at its very edge,
// 17px under the word's rule; the white crosses the bar's 1px bottom border,
// the bar being the item's ancestor: a positioned box inside it paints over
// its border ("as if it is on a z higher than the top bar"). `z-2`: above the
// open card (`data-[state=open]:z-1`), below the ⌄ (`z-10`).
// `pointer-events-none`, so the bridge under it is still the item's, and
// `aria-hidden` and hidden in forced colours: a decoration, where the card's
// frame is the line forced colours draw.
// RENDERED ONLY WHILE OPEN, and AT ONCE — no fade: a half-transparent white
// would let the card's top border show through its base, and the card's own
// top edge is revealed by its clip-path in the first ~15ms of the 300ms
// reveal. On a swap it jumps to the new word while the old card clips away;
// on a close it goes as the fold begins. The server prints every card closed,
// so it prints no pointer, and the first client render agrees (§16 rule 2).
// ON THE CARD'S STRAIGHT EDGE: the card's left edge is 1rem left of the item
// (THE CARD), so the notch's left base corner stands half the item's width −
// 11px + 16px in from it — 35.3px for the shortest dropdown word, French
// „Soins" (60.58px), 59px for the longest, German „Leistungen" (108.08px) —
// past the card's 16px corner curve for any item wider than 22px: every word,
// in every language, with room to spare for Linux Chromium's whole-pixel
// glyphs (up to 1.6px narrower for „Soins", measured glyph by glyph).
// Header.dropdowns.test.tsx holds it in every language, with the real face.

// THE TOGGLE's box (the header's THE TOGGLE): nothing drawn but its ring, and
// click-through until the keyboard is in the item or its card is pinned.
const toggleClasses =
  'absolute -end-4 top-1/2 z-10 h-11 w-6 -translate-y-1/2 rounded-soft ' +
  'pointer-events-none ' +
  '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus ' +
  'focus-visible:pointer-events-auto ' +
  'group-has-[:focus-visible]/nav-dropdown:pointer-events-auto ' +
  'data-pinned:pointer-events-auto';

// The arrow's turn: over the TextButton underline's 300ms, at once under
// reduced motion — KEEP-IN-SYNC with ./NavAccordion's own `glyphMotion`, the
// phone row's ⌄, spelled alike (Header.test.tsx pins the two strings
// byte-equal).
const glyphMotion =
  'transition-transform duration-300 ease-out motion-reduce:transition-none';

// THE ARROW's box (the header's THE ARROW), against the link's own
// `relative` box: from the TEXT's end — the link's 8px right padding back
// from its edge — over the row's 8px gap, centred on the word's line by AUTO
// MARGINS, never a translate: `translate` is on `glyphMotion`'s transition
// list, so a class-set translate would slide in at a racing load (THE LOAD
// RACE). Nothing on that list is set by a class.
const arrowClasses = cx(
  'absolute inset-y-0 my-auto start-[calc(100%-0.5rem)]',
  glyphMotion,
);

// THE ARROW's TURN — an INLINE style, printed by the server into the HTML
// (the header's THE LOAD RACE): DOWN at rest, UP while the card is open. The
// first style computation, sheet or no sheet, already points it down, and
// only a real open or close changes the value — the one change the 300ms
// transition is for.
const arrowTurn = (open: boolean): CSSProperties => ({
  rotate: open ? '-90deg' : '90deg',
});

const wrapperClasses =
  'group/nav-sections absolute -start-4 top-full w-max pt-[calc(0.5rem+1px)] ' +
  'invisible [clip-path:inset(-2rem_-2rem_calc(100%_+_2rem)_-2rem)] ' +
  '[transition-property:clip-path,visibility] [transition-duration:200ms] ' +
  '[transition-timing-function:ease-in-out] [transition-delay:80ms] ' +
  'data-[state=open]:visible data-[state=open]:z-1 ' +
  'data-[state=open]:[clip-path:inset(-2rem_-2rem_-3rem_-2rem)] ' +
  'data-[state=open]:[transition-duration:300ms,0s] ' +
  'data-[state=open]:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] ' +
  'data-[state=open]:[transition-delay:0s] ' +
  'motion-reduce:transition-none';

// THE POINTER's box (the header's THE POINTER): 22 × 11, centred on the item,
// its bottom edge ONE pixel into the open card. KEEP-IN-SYNC with
// `wrapperClasses`' bridge, `pt-[calc(0.5rem+1px)]`, and with ui/Card's 1px
// `surface` border: the item's bottom + that bridge is the card's top, + the
// border's 1px is this box's bottom — so `bottom-[calc(-0.5rem-2px)]` moves
// with either of them, and so does the box's height, the border's 1px row
// plus the 10px notch.
const pointerClasses =
  'pointer-events-none absolute start-1/2 bottom-[calc(-0.5rem-2px)] z-2 ' +
  'h-[0.6875rem] w-[1.375rem] -translate-x-1/2 forced-colors:hidden';

/** Up to this many entries stand in ONE column; more are split in two. */
const ONE_COLUMN_MAX = 7;

/** How many rows a list of `count` entries is laid out in — one column up to
 *  ONE_COLUMN_MAX, two above it (the first column the longer). */
const rowsFor = (count: number): number =>
  count <= ONE_COLUMN_MAX ? count : Math.ceil(count / 2);

export type NavDropdownProps = Readonly<{
  /** The item's path, one with sections — `data-nav-dropdown`, the state's
   *  key. */
  path: SectionedPath;
  /** The word — exactly what NavItem prints (href, label, active). */
  route: NavRoute;
  /** The card's entries, finished (Header.tsx's navSectionLinks). */
  links: readonly NavSectionLink[];
  /** The ⌄'s accessible name — `common.nav.submenu`, translated. */
  toggleLabel: string;
  /** Is THIS item's card the open one? */
  open: boolean;
  /** Is THIS item's card open PINNED — by the ⌄, the keyboard's way in? Never
   *  true while `open` is false: HeaderNav passes it per item. RECORDED (the
   *  TypeScript review's NIT, 2026-10-16): two booleans can still SPELL
   *  `pinned` without `open`, which only HeaderNav's own derivation rules
   *  out; one `state` prop — closed, open by the hover, open pinned — would
   *  make it unrepresentable. Not taken. */
  pinned: boolean;
  /** The pointer and focus handlers the item wears (./useNavDropdowns). */
  handlers: DropdownItemHandlers;
  /** The ⌄ was pressed. */
  onToggle: () => void;
  /** An entry was activated. */
  onEntryActivate: () => void;
}>;

export function NavDropdown({
  path,
  route,
  links,
  toggleLabel,
  open,
  pinned,
  handlers,
  onToggle,
  onEntryActivate,
}: NavDropdownProps): ReactElement {
  const cardId = useId();
  // The rows the entries are laid out in — data, so an inline style.
  const rows: CSSProperties = {
    gridTemplateRows: `repeat(${rowsFor(links.length)}, auto)`,
  };

  return (
    <li
      data-nav-dropdown={path}
      className="group/nav-dropdown relative flex items-center"
      {...handlers}
    >
      {/* THE WORD holds its hover look while its card is open, and carries
          THE ARROW inside its link — aria-hidden, the glyph's own answer
          when unlabelled (the header's THE WORD and THE ARROW). */}
      <NavItem
        {...route}
        held={open}
        trailing={
          <ChevronRight
            size="sm"
            className={arrowClasses}
            style={arrowTurn(open)}
          />
        }
      />

      {/* THE TOGGLE draws no glyph: the arrow is the word's (the header's
          THE TOGGLE). Its name is `aria-label`. */}
      <button
        type="button"
        aria-label={toggleLabel}
        aria-expanded={open}
        aria-controls={cardId}
        data-pinned={pinned ? '' : undefined}
        onClick={onToggle}
        className={toggleClasses}
      />

      <div
        id={cardId}
        data-state={open ? 'open' : 'closed'}
        inert={!open}
        className={wrapperClasses}
      >
        <div className="grid">
          {/* The backdrop: the atom's white ground, frame, soft corner and
              glow — through its own props, nothing restyled — stretched to
              the cell the list sizes (THE CARD IS A BACKDROP). */}
          <Card corners="soft" aura className="col-start-1 row-start-1" />
          {/* A nested list inside the item: "Servicii, list, 11 items" —
              `role="list"` the site's convention for a `list-style: none`
              list, whose semantics Safari's VoiceOver otherwise drops. */}
          <ul
            role="list"
            className="col-start-1 row-start-1 grid grid-flow-col justify-items-start gap-x-4 p-4"
            style={rows}
          >
            {links.map((link, index) => (
              <NavSectionEntry
                key={link.href}
                link={link}
                index={index}
                onActivate={onEntryActivate}
              />
            ))}
          </ul>
        </div>
      </div>

      {/* THE POINTER — while the card is open, and only then (the header's
          THE POINTER): the small white notch on the card's top edge, its
          two sides in the card's frame colour and no line along its base. */}
      {open ? (
        <svg aria-hidden="true" viewBox="0 0 22 11" className={pointerClasses}>
          <path d="M0 11 L11 0 L22 11 Z" className="fill-surface" />
          <path
            d="M1 10.5 L11 0.5 L21 10.5"
            fill="none"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            className="stroke-line-subtle"
          />
        </svg>
      ) : null}
    </li>
  );
}
