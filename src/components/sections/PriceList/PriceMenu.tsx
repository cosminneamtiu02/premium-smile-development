'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { Card, CARD_CURRENT_ATTRIBUTE } from '@/components/ui/Card/Card';
import { Heading } from '@/components/ui/Heading/Heading';
import { PillButton } from '@/components/ui/PillButton/PillButton';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import { createScrollSpy, type ScrollSpy } from '@/lib/scroll-spy/scroll-spy';
import {
  createStickyRail,
  type StickyRail,
} from '@/lib/sticky-rail/sticky-rail';
import { createStripFollow } from '@/lib/strip-follow/strip-follow';
import { ARRIVAL_ATTRIBUTE, ARRIVAL_BY_KEYBOARD } from './arrival';
import type { PriceCategoryProps } from './CategoryCard';

// sections/PriceList/PriceMenu — THE ISLAND: the jump menu's card — the
// sticky <nav> landmark, its <h2> title and its list of links — and, since
// 2026-10-09, on every touch screen and in every window under the step, a
// STRIP of chips in that card's place (THE TWO PRESENTATIONS, below) — and the
// only JavaScript this band ships. Built on the owner's pack round (2026-09-14):
// "the on hover animation for current item … normal scrolling also dictates
// menu item, but menu item click takes you also to navigation item. plz craft
// carefully so it doesn't break when it goes both ways" — the mechanics of
// BOTH directions live in lib/scroll-spy, whose header is the law and whose
// first consumer this file is. Widened from the list to the whole card on the
// owner's 2026-09-18 verdict on the menu's sticky behaviour — the paragraph
// after next, and lib/sticky-rail's header, carry the argument.
//
// ── WHY THE ISLAND IS THE <nav> AND NOT THE LIST (§16: the island is the
// smallest component that needs the browser — and since 2026-09-18 that is
// the card). Everything around this file is identical for every visitor and
// is compiled into the static HTML of every locale's services page: the band,
// the grid, every category card and all 102 price rows. Two things DEPEND ON
// THIS VISITOR. One attribute on one link — which category they are looking
// at (lib/scroll-spy) — and, since 2026-09-29, the same answer once more on
// the category card that link points at (THE CARD THE VISITOR IS AT, below),
// with, the same day, where a click on that link brings the card, planned from
// their window (WHERE THE LINE IS, AND WHERE A CLICK LANDS).
// And, new, where the menu card itself is held: the menu is 653px tall with
// eleven categories, Romanian and German alike, and under its 136px sticky
// offset plus 16px of bottom air a window must be 805px tall for the whole
// card to fit. Measured on the built export:
//
//     window                      innerHeight   usable   fits?
//     1366×768 laptop                     633      481      no
//     1080p at 125% scaling               737      585      no
//     1280×800 MacBook                    688      536      no
//     1440×900 MacBook                    789      637      no
//     1080p desktop at 100%               945      793     yes
//
// (Since 2026-10-02 the menu is a design length on a laptop or desktop past
// the owner's reference — PriceList.tsx's THE BAND SCALE, which never lets it
// fall under these 655px (its THE FLOOR) — so the laptop rows stand as they
// are and only the last turns "no" as well; PriceList.tsx's NO HEIGHT BELT has
// the heights. The rail needs no word of it: it measures the card it holds,
// against a line that does not scale.)
// The first answer was a HEIGHT BELT on the card — `max-h` + `overflow-y-auto`
// — which made the card its own scroll container on every laptop: the wheel
// scrolled the menu instead of the page, with a nested scrollbar inside it.
// "That should absolutely not be possible" (owner). The replacement is
// direction-aware PINNING: scrolling down the card rides with the page until
// its bottom edge meets the window's bottom line and pins there; scrolling up
// it rides until its top edge meets the 8.5rem line and pins there; between
// the two, after a reversal, it holds a frozen relative offset so it never
// jumps. That decision is a fact about the window, so it is made after mount
// (§16's hydration-safety rule) — and the element it positions is the <nav>,
// so the <nav> is the island. Hoisting one level higher, to the band, would
// drag eleven cards of static rows into the client bundle for nothing;
// keeping the island at the list would leave the card it must move on the
// server side of the boundary.
// The band stays a server component and PriceList.tsx's "ONE ISLAND, THE MENU
// CARD" paragraph is the other half of this note. CLAUDE.md §16's runtime
// list names this file — the ReviewsDeck precedent: every island is named
// there, in its own lane.
//
// ── WHAT THE RAIL WRITES, AND WHAT THE STYLESHEET ALREADY KNOWS. lib/
// sticky-rail publishes a mode and one number; this file renders them as ONE
// attribute and ONE inline property, and the static classes stay untouched:
//   · `data-rail` carries the mode — absent for 'fits', so a desktop that
//     fits shows the server HTML byte for byte; 'top' is attribute-only and
//     paints nothing (the rail's own `pointer-fine:min-[60rem]:top-[8.5rem]`
//     on the sticky <nav> IS the top pin);
//   · `pointer-fine:min-[60rem]:data-[rail=travel]:relative` is the one rule
//     the stylesheet gains, and it wears the SAME gate as the rail itself (THE
//     TWO PRESENTATIONS: a fine pointer AND a window of 60rem) — so where the
//     strip shows instead, the mode could name 'travel' and the layout would
//     not move. That gate is why the position rides a class rather
//     than the style prop: an inline `position: relative` would follow the
//     attribute everywhere — a window narrowed mid-travel would show the
//     strip displaced over its own cards;
//   · `style={{ top }}` is the number, for 'bottom' (negative: the pin by the
//     bottom edge) and 'travel' (the frozen in-flow offset). Until 2026-10-09
//     the stacked menu was a STATIC element under the step, where `top` is
//     inert — the same gate again. The strip is STICKY, and a `top` there
//     would move it; so the rail's store does not run at all while the strip
//     shows, and publishes 'fits' — no attribute, no style (THE RAIL RUNS
//     WHERE IT SHOWS, below).
// The rail reads the 8.5rem line back from the computed `top` rather than
// being told it — the FIFTH coupled spelling of the pill's reach stays the
// fifth (Header.tsx's "THE MOUNT CONTRACT", PriceList.tsx's
// THE 8.5rem LINE paragraph — gated `pointer-fine:min-[60rem]:` since
// 2026-10-09) and this file spells no number of its own but that class (and
// the strip's own, THE STRIP'S GEOMETRY). A rem LITERAL since 2026-10-02, never a spacing step: past
// the owner's reference the band draws in its design pixel on a laptop or
// desktop (PriceList.tsx's THE BAND SCALE), and the pill the line clears does
// not, so the line must not either — 136px inside the scale and out, which is
// also what the rail reads back.
//
// ── STILL DUMB (owner fb-459, board §2c.1). Props in, HTML out: `title` and
// `items` are FINISHED strings — translated, in one language — plus the
// fragment id each link points at, and `id` is the card's own public address
// (PRICE_MENU_ID, exported by the band). No `t()`, no message key, no import
// of the price list, no `Locale`. And note WHAT DOES NOT CROSS: the band hands
// this file `{ id, name }` pairs, never whole categories. Props that cross a
// server→client boundary are serialized into the page's own HTML, so passing
// the categories through would print all 102 name/price rows a second time
// inside the flight payload — for data this component never reads.
//
// ── THE TITLE'S id IS DERIVED FROM THE CARD'S, the CategoryCard idiom
// (`headingId = \`${id}-title\``): the landmark's `aria-labelledby` and the
// <h2>'s `id` are one expression, so the pair can never drift, and a page
// that links to `#price-categories` finds the title at a guessable address.
//
// ── THE TITLE'S STEP IS `band` (D48, 2026-09-26) — AND BESIDE THE CARDS IT
// READS ONE STEP UNDER THEM. Every page <h2> wears ui/Heading's `band` step,
// §15.24's one size per outline level: 30px on a column narrower than the
// container's 28rem `@md` step, 36px from it — the step is Heading's, and the
// arithmetic is in Heading.tsx's `'band' JOINED` paragraph. It replaced
// `page` (D46) after an hour, because a FIXED 36px <h2> outranked the page's
// own <h1> on every phone, where Heading's fluid `hero` step sits on its 32px
// floor.
// The step answers to the NEAREST container, and this title's container is
// the menu card itself (ui/Card's `@container` — landed on the <nav> until
// 2026-10-09, on the rail's own card inside it since) — not
// the band's column — and a container query reads the ROOT's rem, never the
// band's design pixel. Beside the cards that card is the menu's track at its
// floor (PriceList.tsx's THE TWO TRACKS — sixty spacing steps, 15rem outside
// the band scale): 190px of content inside ui/Card's 25px sides, so
// „Categorii" reads 30px while every category card — its own container, four
// shares of the row — reads 36px. WITHOUT the band scale — a touch screen at
// these widths, an engine that cannot register custom properties — by the
// band's own arithmetic at the named widths (ui/Container's gutters — 10vw a
// side from a 600px window, half that on a phone since its THE PHONE GUTTER,
// 2026-10-09, §15.35 — and the grid's gap-8; the stories'
// expectHeadingOutline reads each title back from real CSS against its own
// container):
//
//     viewport   arrangement   menu content   card content   menu / cards
//          390   stacked              301px          301px     30 / 30
//          768   stacked              564px          564px     36 / 36
//         1280   beside               190px          702px     30 / 36
//         1536   beside               190px          907px     30 / 36
//         1920   beside               251px         1153px     30 / 36
//
// (Read back in the Storybook test browser, whose classic scrollbar takes
// 15px off the column, 2026-09-26 — before the band scale: 247/247px → 30/30
// at 390 (286/286px since THE PHONE GUTTER, re-read 2026-10-09), 190/892px →
// 30/36 at 1536, 190/623px → 30/36 on its 1200px default canvas — the 15rem
// floor held the menu at 190px beside the cards up to a
// ~1540px viewport, where its 1fr share took over. Since 2026-10-02 that
// runner's 1200 canvas draws the band inside the scale but at its floor —
// the theme's own pixels, so those readings stand — and its 1536 canvas past
// the reference: the next lines.)
// INSIDE the band scale (PriceList.tsx's THE BAND SCALE — a mouse or
// trackpad, from a column of max(56rem, 896px)) the band is its rem self up
// to the reference (its THE FLOOR), and the readings above hold as they are.
// Past the reference the menu sits at its floor, 240 design pixels: 192 of
// content less 2px of hairline, which the root's 28rem reaches only past
// s = 2.34, far beyond the cap's 1.389 — and a card's content is 786 design
// pixels less 2px, past 28rem from s = 0.573, far under the floor's 1. So the
// title reads 30 beside the cards' 36 at every scaled width — px up to the
// reference, design pixels past it: the same one step under, magnified with
// the band (PriceList.stories.tsx's plays read both back).
//
// So, without the scale, "one step under" holds wherever the menu sits
// BESIDE the cards — from the split to a ~2922px viewport, where the 1fr
// share would finally carry the card past 28rem — bar a 2.5px sliver at the
// split itself (a 960px viewport), where the cards' track is still under
// 498px and both read 30px; inside it, at every width. STACKED, the menu
// spanned the same column as the cards and wore the SAME step: 30/30 on a
// phone, 36/36 from a ~622px viewport — until 2026-10-09, when the strip took
// the stacked menu's place (THE TWO PRESENTATIONS): there the title is not
// displayed at all and names the landmark unseen, so the stacked rows of the
// table above are history, and the title's size is the RAIL's question
// alone. That is the honest reading of the
// menu's track, not a size of this file's own (§6.6): the title is still a
// sibling of the card titles — the owner's 2026-09-14 decision, a TITLE and
// not the first item — and the rule over the <ul> is what separates it from
// its links at either step.
//
// ── THE CONSUMPTION IDIOM IS lib/rotation's RECIPE, COPIED — twice now, once
// per store (ReviewsDeck was its first witness; the two stores here are
// different, the three lines around each are the same) — and, the same
// shape without a store, for the strip's follower (lib/strip-follow publishes
// nothing: it is told, never read):
//   · each store is built in a useState INITIALIZER, which runs once per
//     render tree — once in Node during the static export and once in the
//     browser at hydration. That is safe only because construction is PURE:
//     createScrollSpy validates its ids and createStickyRail its id, and
//     neither touches a window, so both builds publish the same first
//     snapshots (`{ current: null }`, `{ mode: 'fits' }`) and the server HTML
//     carries no `aria-current`, no `data-rail`, no `style` and no
//     `data-current` at all — and, since round 5 (2026-09-29), no inline
//     `scroll-margin-top` on any card (the reading spy writes those at
//     start()) and no `data-arrival` (only a click writes that).
//   · useSyncExternalStore is React's own way to read state that lives outside
//     React — subscribe, getSnapshot, getServerSnapshot, exactly the trio each
//     store exposes, so no custom hook is needed and lib/ stays React-free.
//   · start() in an effect, dispose() in its cleanup: the effect runs after the
//     card is on screen (so the targets and the rail exist to be measured) and
//     the cleanup removes every listener, which React also calls on a Fast
//     Refresh re-run. The rail finds its element by the card's id — the spy's
//     own idiom — and the follower its strip by the strip's. The follower's
//     two effects are LAYOUT effects, the one departure (THE STRIP FOLLOWS
//     THE CURRENT CHIP: a placement must land before the paint). The one place
//     this file holds refs is the presentation watcher (THE RAIL RUNS WHERE
//     IT SHOWS), which reads two boxes it renders itself and needs no public
//     address for them.
//
// ── THE LIST IS STATIC, AND THAT IS A DECISION, NOT A GAP. The spy is built
// from the ids at mount and never told about a new list: page data on this
// site is compiled at build time (§16), so a price menu cannot change length
// while a visitor watches it. lib/scroll-spy's header records `setIds()` as
// the named trigger the day a consumer can; the band's `key` on this island
// is what remounts it — and with it the rail's element — in the workbench.
//
// ── WHERE THE LINE IS, AND WHERE A CLICK LANDS (owner 2026-09-29: "when you
// scroll, it turns on the shadow highlight too late, once it already passes
// the that point at which you see the top of the card because it already
// passes below the top bar and you see it had been selected, but it was
// already past. i need a new scrolling or selecting of current card that
// keeps the line lower for currently selected items and also selects top
// one … and also the go to card when you click on the meniu on an option
// should be more to the center of the screen the go to selected card, to be
// more visible."). The spy is built with `line: 'reading'`. A card becomes
// current as its top edge crosses the middle of the part of the window the
// page keeps CLEAR under the header pill — `(scroll-padding-top +
// innerHeight) / 2`, 364.5px down a 1366×633 laptop, where the old landing
// line lit it at 137px — bent near both ends of the page, so the first card
// is current at the top however short it is and every card has its turn, in
// order, down to the last. And a click brings the card to that same line:
// centred on it when the card fits the clear area, its top on the menu's
// 8.5rem line when it is too tall — so the card a click lands is always the
// card the scroll names.
// The landing is the SPY's to write, and this file spells no number for it:
// the browser lands a fragment jump by the target's `scroll-margin-top`, so
// the spy writes each card's planned value inline at start() and takes it
// off again in dispose(), and the jump itself stays the browser's own (ONLY A
// PLAIN LEFT CLICK PINS, below). The argument, the arithmetic and the
// measurements are lib/scroll-spy's THE READING LINE and lib/reading-line's
// header; the class every plan starts from is CategoryCard.tsx's
// `scroll-mt-[2.5rem]`, the FLOOR — a rem literal that the band scale cannot
// remap, so every plan starts from 40px at every width (that file's
// paragraph of the same name).
//
// ── THE CARD THE VISITOR IS AT WEARS THE MARK TOO (owner 2026-09-29: "add
// aura shadow just to currently selected/viewed price box … what category
// card is not selected gets no aura … aura has to be smooth when selected,
// like not sudden and upon deselect again smooth"). The spy's answer used to
// land in one place, the link's `aria-current`. It now lands in two, and the
// second is OUTSIDE this file's own markup: the category card that link
// points at, which is inert server HTML (CategoryCard.tsx) and stays so. An
// effect STAMPS `data-current` on that card — the attribute ui/Card's
// `aura="current"` answers to, imported as CARD_CURRENT_ATTRIBUTE and never
// retyped — and takes it off in its cleanup, so the mark moves with `current`
// and leaves with the island. The card's own static classes do the rest: the
// glow, and its fade in both directions (ui/Card's THE GLOW CAN FOLLOW A
// MARK). One store, two marks: the link and the card can never disagree
// about where the visitor is, whichever way they got there — a scroll, a
// click's pin, a `#id` in the URL, the page's end.
//   · WHY A DOM WRITE AND NOT A COMPONENT. Two alternatives were weighed
//     against §16, and neither loses on BYTES — the first would even win.
//     Rendering the cards FROM this island (CourseTimeline's shape): the 102
//     rows are printed twice in every services page as it is, once as markup
//     and once in the flight payload as the element tree React hydrates from
//     (the React review's measurement on the built Romanian page,
//     2026-09-29: 42 KB and about 60 KB of a 184 KB document); handed over
//     as PROPS instead they would weigh about 10 KB, and the document would
//     shrink to about 135 KB. What that shape costs is JAVASCRIPT: the
//     cards' render code would enter the client bundle and run — eleven
//     cards, 102 rows — on every visitor's phone at hydration, for markup
//     that is identical for everyone, and the island would stop being the
//     smallest thing that needs the browser. (WHAT DOES NOT CROSS, above,
//     stays true for ITS case: rows handed to an island that does NOT render
//     them are a copy on top of the tree.) A client shell around every card,
//     with a context to carry the store, would turn eleven inert regions
//     into eleven hydrated components and the band into a provider, for the
//     sake of one attribute. What is kept instead is React's own rule for
//     the escape hatch: a node React manages may be modified where React has
//     no reason to update it. No component ever renders this attribute on
//     these cards, so there is nothing for a re-render to take back
//     (measured in the same review: a re-render that changed the cards'
//     props and children produced no mutation of the mark).
//   · THE SPY'S OWN IDIOM. lib/scroll-spy finds its targets with
//     getElementById to MEASURE them, and lib/sticky-rail finds the nav the
//     same way; this effect finds the same element to MARK it. A target that
//     is missing (a hot reload) is skipped, exactly as the walk skips it.
//   · NEVER IN THE SERVER HTML (§16's hydration-safety rule): the effect runs
//     after mount and `current` is null until start() has looked at the real
//     page, so every card arrives unmarked and the first one takes its glow a
//     moment after hydration — fading in, like any later one.
//     WHAT THE STAMP RELIES ON, recorded because it is invisible: the island
//     and the cards hydrate in ONE pass. No Suspense boundary sits between
//     them in the built page (tests/e2e/price-current-aura.spec.ts pins it),
//     so by the time this effect runs the cards are React's already.
//     MEASURED, what breaking either half would cost (React's development
//     build, hydrateRoot over renderToString, 2026-09-29): a SPLIT pass —
//     the cards behind a boundary React has not hydrated yet — costs a
//     development-only warning naming `data-current=""` and, since round 5,
//     the inline `style` the reading spy writes on all eleven sections
//     (`scroll-margin-top`), and nothing else, because the cleanups still
//     take the mark and the margins off the nodes they were put on;
//     a STRAY mark, one this effect never placed (in the server HTML, say),
//     is never taken off, and two cards glow for good. Hence the two pins:
//     no boundary between them, and no mark in the HTML the server sends.
//   · THE MARK IS VISUAL EMPHASIS ONLY. `aria-current` stays on the LINK and
//     only there: the menu is ONE set of related items and makes ONE claim
//     about where the visitor is. (The attribute is global and COULD sit on
//     a region; repeating the claim on the card would say it twice, about a
//     "current" that follows the viewport and not a screen reader's cursor.)
//     The glow is decoration (§9, SC 1.4.1): by the a11y review's arithmetic
//     it peaks at about 1.5:1 against the page, so it could not carry
//     information and is not asked to. BESIDE the cards, the link's
//     attribute and its underline say where the visitor is and the glow
//     repeats it for the eye. STACKED — every phone, until 2026-10-09 —
//     the menu scrolled away and the glow was the only mark on screen. Since
//     then the STRIP stays stuck under the header pill with the current chip
//     filled and `aria-current` on its link (THE TWO PRESENTATIONS), so on
//     every screen the link says where the visitor is and the glow repeats
//     it.
//   · A KNOWN LIMIT, RESOLVED — history now, kept because the e2e suite
//     still replays it. The two marks move together, so whatever the spy's
//     answer does, the glow shows. Under a STARVED main thread — one long
//     task of 160 ms or more right after a click — lib/scroll-spy's settle
//     used to judge arrival before the jump had begun, drop the pin, and both
//     marks walked through the cards the glide passed before landing on the
//     target. MEASURED on the built page, 2026-09-29: WebKit dropped the pin
//     12 times of 12 under such a task; Chromium held it in every run there
//     (39 of 39), though the React review dropped it in a scratch harness (19
//     of 40); on an idle main thread the pin held in both engines, every
//     time. The link's mark did this before the glow existed; a 400ms fade
//     made it easier to see. This note said the fix was the spy's, and the
//     owner's word the same day — "fix them for me" — put it there: THE START
//     GRACE (lib/scroll-spy's header) gives a pin whose page has not moved yet
//     one more settle window, and re-arms rather than judges while the page
//     is moving. tests/e2e/price-reading-line.spec.ts replays the long task.
//
// ── `aria-current="location"`, PASSED EXPLICITLY — not TextButton's `active`
// sugar, which spells `page` (nor ui/PillButton's, the strip's chips, which
// spells it too and honours the same precedence). The two are different
// claims: `page` says "this
// link points at the document you are reading" (the Header's nav item for
// /ro/services), `location` says "this is where you are WITHIN the page",
// which is exactly what a table of contents marks. The atom documents the
// precedence this relies on: "an explicitly passed aria-current still wins".
// `active` still rides along for the LOOK — the atom's own rest-state variant,
// the label in the `accent` lavender with the underline drawn at full width and no
// animation to wait for, which is the hover END state the owner asked the
// current item to wear — and on the strip the chip's own `active`, the
// lavender fill. Colour is never the only signal (§9, SC 1.4.1): the
// attribute is the announcement, the underline — and the chip's fill against
// its white neighbours, 4.81:1 on the page — the shape.
//
// ── ONLY A PLAIN LEFT CLICK PINS. A middle click, or a Cmd/Ctrl/Shift/Alt
// click, opens the link somewhere else — a new tab, a new window — and this
// document must not mark a category the visitor never went to in THIS tab.
// isPlainLeftClick below is that filter, and it gates the keyboard's stamp
// too (next paragraph): a click that pins nothing stamps nothing. Every OTHER
// way of reaching a fragment (Back, Forward, a pasted link, the address bar)
// arrives as a `hashchange`, which lib/scroll-spy listens for itself.
// The link is never prevented, never intercepted: the jump stays the browser's
// own same-document navigation (§15.13, board §4.1), so the URL takes the
// fragment, the card receives focus through its tabindex="-1", and the scroll
// glides or teleports according to the visitor's motion preference. The pin is
// a marker laid over that, never a replacement for it.
//
// ── THE RING IS THE KEYBOARD'S (owner 2026-09-29: "when you click on the menu
// om an item, it takes you to the item, but it also highlights it with a dark
// border. not the shadow, but a dark border. i want that removed."). The card
// keeps its focus ring for an arrival the KEYBOARD made and hides it for every
// other — CategoryCard.tsx's paragraph of the same name has the rule, the two
// engines and what forced colours keep. This file's half is telling the two
// arrivals apart, at the one moment they differ: the click. A click's `detail`
// is its click count — 1 for a mouse press or a tap, 0 for the click the
// keyboard makes when Enter follows a link, in Chromium and WebKit alike
// (measured on the built page, the planner's probe, 2026-09-29). So a plain
// left click whose `detail` is 0 STAMPS its card `data-arrival="keyboard"`
// (./arrival's constants, imported, never retyped), and the stamp comes off
// when that card loses focus TO SOMETHING ELSE IN THE PAGE, when a pointer
// click follows — the last arrival decides — and when the island leaves. A
// window, a tab or the address bar that takes the focus takes nothing off:
// the card is still the document's active element and still `:focus-visible`
// when the visitor comes back, so its ring must be there to meet them (SC
// 2.4.7; G2 a11y F1 — createArrivalStamp's onBlur has the measurement that
// tells the two blurs apart). At most one card ever carries it: stamping a
// second takes the first one's off.
// Like the glow's mark it is a DOM write on inert server HTML, never rendered
// by React and never in the server's bytes — THE CARD THE VISITOR IS AT's WHY
// A DOM WRITE, the same nodes, the same reason. And because it feeds no render
// it is neither a store nor state: a small closure (createArrivalStamp below),
// made when the island mounts, lifted when it unmounts, and reached from the
// click through a ref.
//
// ── THE TWO PRESENTATIONS (owner 2026-10-09, verbatim: "i need a complete
// refactor on the price page on the menu that takes you to price lists on
// phone and on tablet. on latpops it should remain the same … i want them as
// a horizontal list of buttons which you can scroll from left to right … the
// menu should strethc on whole width of phone screen" · "the pills menu
// shoulld be sticky below the top bar navigation as you scroll downwards" ·
// asked which screens, "Every touch screen"). ONE <nav>, two lists in it:
//   · THE RAIL — the side menu as it was, byte for byte in look: ui/Card's
//     glowing card holding the <h2> and the ui/TextButton links, sticky at
//     the 8.5rem line beside the cards — and ONLY where a mouse or trackpad
//     meets a window of at least 60rem: `pointer-fine:min-[60rem]:`,
//     Tailwind's `pointer-fine` variant around a MEDIA query, which compiles
//     to `@media (pointer: fine) { @media (width >= 60rem) { … } }` (read off
//     the built sheet). The grid's two tracks and its `items-start` wear the
//     same gate (PriceList.tsx's THE GATE paragraph). A MEDIA QUERY SINCE THE
//     G2 ROUND (2026-10-09) — the band's container step, `@3xl` (a 48rem
//     column), until then — because THE STRIP'S CLEARANCE moved into the
//     stylesheet, on the ROOT, and a rule on the root can ask the window but
//     never a container; the strip, the rail and the clearance must agree on
//     one boundary, so all three ask the same one. With the 10vw gutters the
//     column is 0.8 × the window, so under overlay scrollbars the two
//     boundaries are the same 960px; under a classic scrollbar the container
//     step came ~19px later (at ~979px, the scrollbar eating into the column)
//     — between 960 and 979 the rail now shows, and fits. §6.5 allows a media
//     query for page-level layout in a section.
//   · THE STRIP — everywhere else: every touch screen at any width in either
//     orientation (a tablet held sideways is 1180px wide and still gets it),
//     and every window under the step: a row of ui/PillButton chips that
//     scrolls sideways inside its own box, the full width of the screen,
//     stuck under the header pill.
//   · ONE LANDMARK, ONE TITLE, ONE CLAIM. The <nav> keeps the id the rail and
//     the links' fragment ids hang on, and its `aria-labelledby` keeps naming
//     it by the <h2> while the rail is `display: none` — an accessible name
//     reads a hidden referent — so a screen reader hears „Categorii,
//     navigation" in both. `display: none` takes the list that is not shown
//     out of the tab order and the accessibility tree alike. No tablist:
//     these are in-page LINKS, and `aria-current="location"` stays the one
//     claim, on whichever list is shown.
//   · WHY TWO LISTS AND NOT ONE RESTYLED: the rail's links are ui/TextButton
//     and the strip's ui/PillButton — two atoms, two looks — and re-dressing
//     one list per presentation would lay a section's classes over an atom's
//     paint (§6.8 forbids it). The cost is the eleven links printed twice in
//     the static HTML, about 2 KB.
//
// ── THE STRIP'S GEOMETRY — rem LITERALS, never spacing steps, because it
// follows the header pill, which the band scale never remaps (and the strip
// never shows inside the scale anyway: the scale wants the fine pointer and
// the wider `@4xl` the rail already holds).
//   · STICKY UNDER THE HEADER PILL — FROM 30rem OF WINDOW HEIGHT, on the
//     <nav>: `[@media(min-height:30rem)]:supports-[selector(:has(*))]:sticky`
//     with `top-[calc(6rem+2px)] z-20` (THE STRIP FLOATS UNDER THE BAR has the
//     number); the rail restores its own `pointer-fine:min-[60rem]:sticky`
//     at EVERY height as before, with its
//     `pointer-fine:min-[60rem]:top-[8.5rem]` and
//     `pointer-fine:min-[60rem]:z-auto`, so the rail is exactly what it was.
//     (Every class in these notes is spelled WHOLE, as the element wears it:
//     Tailwind scans comments too, and a fragment — a variant dropped — would
//     ship a rule no element wears.) THE THRESHOLD (G2 a11y HIGH, 2026-10-09 —
//     SC 2.4.11 and SC 1.4.10): the stuck strip's footprint is fixed in CSS
//     pixels. Measured while the strip still had a ground — 110px of it from
//     the window's top, the 44px chips, a 32px fade, 186px — it covered 48% of
//     a phone held sideways (844×390), 47% of a 1280×800 laptop at 200% zoom
//     (640×400) and 93% at 400% (320×200); on such a window the language
//     banner could fully cover the centred current chip, and a tapped tall
//     card showed 6px of itself. Since 2026-10-10 the stuck strip PAINTS only
//     its chips, 44px, from 110 to 154px; its box is 88px — the 12px of air,
//     the chips, the 32px of glow room, from the pill's bottom edge at 98px to
//     186px — and transparent. The threshold stands all the same: the stuck
//     chips still cover what scrolls under them, the root's 154px clearance
//     still holds every jump below them (THE STRIP'S CLEARANCE), and a tapped
//     tall card still rests 2.5rem under that — 6px of it on a 200px window.
//     So the strip sticks only where the WINDOW is at least 30rem (480px)
//     tall: a portrait phone keeps it once its window is that tall — but NOT
//     every portrait phone (G2 a11y N2): a 568px-tall
//     iPhone in Safari shows well under 480px of window with its toolbars out,
//     so its strip is static, and an engine may re-evaluate `min-height` as the
//     toolbars collapse and come back, letting the strip switch between static
//     and sticky as the visitor scrolls. Every landscape phone (320–430px), a
//     laptop zoomed to 200% or more and WCAG's 320×256 reflow viewport let it
//     scroll away with the page — and there THE STRIP'S CLEARANCE and THE
//     CHIPS' FOCUS MARGIN, gated by the same 30rem, step aside too, the root
//     keeping the stylesheet's 96px for the header pill alone. AND ONLY WHERE
//     `:has()` WORKS (G2 a11y N1): the clearance is a `:root:has(&)` rule,
//     which an engine without `:has()` (Safari before 15.4, Firefox before 121)
//     drops — so the stick and the chips' focus margin wear
//     `supports-[selector(:has(*))]:` too, and there the strip scrolls with the
//     page rather than stick over jumps that would land under it. Z-20 is a NEW
//     RECORDED SEAT in the site's closed stacking order, under all of the
//     chrome — the language banner's 30, the corner discs' 40, the menu sheet's
//     45, the header pill's 50, the top layer — and over the category cards
//     scrolling beneath it, which are positioned (`relative`, for their glow)
//     and come later in the markup (LanguageBanner.tsx's seat record and
//     ui/Ribbon's note list it).
//   · THE STRIP FLOATS UNDER THE BAR (owner 2026-10-10, on his iPhone,
//     verbatim: "i see you have placed some block behind the top bar and the
//     buttons menu that is the color of the baclkfground, remove it. i do not
//     want it to transition into some kid of fog anymore and by fog to hide
//     what is beneath"). Neither the <nav> nor the strip's <ul> paints any
//     background: stuck, the cards scroll VISIBLY under and between the chips
//     and round the header pill, as on every other page, and only the chips —
//     each its own white or lavender face, its thin edge and its glow —
//     paint. And nothing of the strip lies BEHIND the bar: the <nav> sticks
//     at the pill's FLOW BOX, `top-[calc(6rem+2px)]` — `mt-4` + `h-20` + its
//     two 1px borders, the Hero's own `-mt-[calc(6rem+2px)]`, 98px at the
//     default root — so its box begins where the stuck pill ends, and no
//     invisible box over content the visitor can now see catches a tap or a
//     sideways swipe there. The 0.75rem of air between the pill and the chips
//     is the <ul>'s top padding, `pt-[0.75rem]`, cancelled at rest by the
//     <nav>'s `-mt-[0.75rem]`: AT REST the chips sit exactly where the grid's
//     first row begins — where they always sat — and STUCK they stand at
//     110px and end at 154px. That padding is also the room the chips' glow
//     has above them, and 12px of it clips only the glow's last tail:
//     `--shadow-aura` reaches 14px above a chip (an 8px drop under a 22px
//     blur), and the 2px it loses lie 20px from the shadow's edge, Φ(−20/11) ≈
//     3.4% coverage × the token's 0.4 alpha ≈ 1.4% of the colour — about 2
//     levels in 255 on the page ground, invisible. Under the chips the `pb-8`
//     holds the glow's 30px whole inside the scroll container, and the
//     <nav>'s `-mb-8` lays that room into the grid's `gap-8` at rest, so the
//     first card starts 2rem under the chips, the gap between two cards. At
//     rest the box reaches 12px above the chips, inside the band's own top
//     padding (48px at the least), never above the band. THE SEVENTH COUPLED
//     SPELLING of the pill's reach (Header.tsx's THE MOUNT CONTRACT) is the
//     <nav>'s `top` and the two clearances (THE STRIP'S CLEARANCE): change the
//     bar's height, its offset or its border and all of them move. ITS COST,
//     recorded: the transparent box stays pointer-ACTIVE, so a tap in the 12px
//     of air or the 32px of glow room lands on the strip and not on the card
//     under it — harmless, because a card's text is not interactive — and a
//     vertical swipe that starts there still scrolls the page (the strip
//     scrolls sideways only). VOICEOVER'S TOUCH EXPLORATION IS CAUGHT THE
//     SAME WAY (G2 a11y LOW-4, 2026-10-10, the reviewer's reading — no
//     device was run): a finger exploring the see-through 12px of air or the
//     32px of glow room finds the strip's list, not the card text visible
//     through it, so that text is reached there by swiping on from the list,
//     or once the card has scrolled out from under the strip. Not `pointer-events: none` on the <ul>: a
//     scroller whose own box ignores the pointer is not proven to keep
//     scrolling from its children on iOS, where WebKit hit-tests its
//     UIScrollView asynchronously, and that is not shipped unverified (the
//     planner, 2026-10-10). HISTORY, reversed by that word: from 2026-10-09 the
//     strip had a GROUND, on the owner's "have gradient transition from
//     background coloer to above cards" — the <nav> stuck at the window's top
//     and lifted by the pill's flow box plus the air, the <ul> page-coloured
//     from the window's top down to the chips and fading to transparent over
//     the 2rem under them — and on iOS 26 Safari, which draws the page above
//     the layout viewport too, under the status bar, its top edge cut the
//     cards' text with a hard horizontal line.
//   · FULL BLEED, the ReviewsDeck stage's idiom (its THE STAGE RUNS UNDER THE
//     GUTTERS): `mx-[calc(50%_-_50vw)]` takes the <ul> to the window's edges
//     and the same expression as START padding, `ps-[calc(50vw_-_50%)]`,
//     brings its first chip back to the content column's left edge at
//     scrollLeft 0, whatever the gutter is (this file spells none).
//   · THE TRAILING GUTTER IS A REAL BOX (the planner, 2026-10-09): WebKit has
//     dropped a flex scroll container's inline-END padding from its scrollable
//     overflow in version after version (WebKit bugs 236634, 286472 and
//     318111, the last from June 2026), which would leave the last chip
//     flush against the window's edge at the strip's end. So the end is an
//     `::after` flex item instead — `after:content-[''] after:flex-none` —
//     as wide as the gutter less the row's gap: `calc(100vw - 100% -
//     var(--spacing) * 3)`, the gap spelled as `gap-3`'s own step. THE
//     ARITHMETIC: a flex item's `%` resolves against the <ul>'s content box,
//     and with no end padding that box is 100vw less the start padding G (the
//     gutter — plus half a classic scrollbar, whose overshoot the margin
//     shares), so `100vw − 100%` is G; at the strip's end the last chip then
//     stands G − gap + gap = G short of the strip's right edge — on the
//     content column's right edge. MEASURED on the built page, Chromium 151
//     and WebKit 26.5, 390 and 820: 0.1px off it (sub-pixel), and the box
//     counts as scrollable overflow even at zero height; with no end box at
//     all the last chip runs to the window's edge. Its SCROLL padding is
//     spelled with `cqw` instead — `calc(50vw - 50cqw)`, both ends: a
//     scroll-padding percentage resolves against the scrollport, 100vw here,
//     and would come to 0 (measured), while `cqw` reads ui/Container's column,
//     the very width the margin's `50%` reads. `min-w-0` on the <nav>, because
//     the nowrap row's min-content would otherwise blow the band's single
//     implicit grid track out to the row's whole length (measured: the strip
//     1300px wide in a 312px column). The band's `overflow-x-clip`
//     (PriceList.tsx) swallows a classic scrollbar's 100vw overshoot.
//   · THE ROW: `flex items-center gap-3 overflow-x-auto overscroll-x-contain`
//     — no scroll snap, which would re-snap after the follower's glide (and a
//     scripted scroll on a snapping horizontal scroller still fails in WebKit,
//     bug 283707). THE SCROLLBAR IS HIDDEN, everywhere (owner 2026-10-10, on
//     his iPhone: "there is a scroll bar, a horizontal one on that scrollable
//     menu. remove it"): `[scrollbar-width:none]`, the standard property,
//     which WebKit implemented for iOS in bug 277167 (fixed August 2024,
//     shipped in iOS and Safari 18.2) — so his iOS 26 Safari hides the strip's
//     touch scroll indicator — and `[&::-webkit-scrollbar]:hidden`, the
//     fallback for older WebKit and for Chromium before 121. ui/SpeedDial's
//     stem is the precedent (`[scrollbar-width:none]` in its stemBase). THE
//     TRADE-OFF, the owner's call, recorded with its exact cost (G2 a11y
//     LOW-1, 2026-10-10): MDN advises against `none` ("Avoid using none, as
//     hiding a scrollbar negatively impacts accessibility"), and what hiding
//     it takes away is, precisely: the PERMANENT "there is more" cue a
//     classic scrollbar draws for a mouse-only visitor in a window under
//     60rem; the operating system's "always show scroll bars" setting,
//     which no longer reaches this box; and on Windows the scrollbar's arrow
//     buttons and its track clicks. What remains: the strip scrolls by
//     Shift+wheel and by a trackpad's sideways swipe (lib/strip-follow
//     already counts a sideways wheel as a hand), by Tab (lib/strip-follow's
//     THE KEYBOARD'S REVEAL) and by a touch swipe, and it follows the page's
//     current category by itself. The one "more" cue left is a chip CUT at
//     an edge, and it is not always there: at scrollLeft 0 the first chip
//     starts on the content column's edge, so nothing is ever cut on the
//     LEFT; on the RIGHT a cut chip shows unless the window's edge falls in
//     one of the 12px gaps between two chips — about 1 in 13 window and
//     language combinations by the chips' widths, the reviewer's ESTIMATE,
//     not measured. The lever, not built: hide it on touch screens only — the
//     two utilities behind `pointer-coarse:`, where the owner saw the bar —
//     and keep it for a mouse.
//     HISTORY: from 2026-10-09 the scrollbar was KEPT — the planner's reading
//     of that MDN line — at the user agent's own width (G2 a11y), and for a
//     mouse its thumb in `--ink-muted` (6.99:1 against the page ground) on a
//     transparent track; the owner's word reverses it.
//
// ── THE CHIPS' FOCUS MARGIN,
// `[@media(min-height:30rem)]:supports-[selector(:has(*))]:scroll-mt-[-2.75rem]`.
// MEASURED (the strip lab, 2026-10-09, Chromium 151 and WebKit 26.5): with the
// root's scroll padding covering the STUCK strip (next paragraph), every
// keyboard focus of a chip scrolled the PAGE up by a chip's height — 44px a
// Tab — because the chip lies above the padding's edge and scrolling the page
// moves a stuck strip nowhere. A scroll margin of minus the chip's own height
// (ui/PillButton's `min-h-11`, 2.75rem) makes the box a focus asks the browser
// to reveal the chip's bottom edge, which IS the padding's edge: nothing to
// scroll, in both engines, and a chip scrolled out of view still comes back.
// GATED BY THE STICK'S 30rem (G2, 2026-10-09): where the strip does not stick
// it scrolls with the page under the header pill, the root padding is the
// stylesheet's 96px, and the margin was WRONG there — MEASURED (Chromium 151
// and WebKit 26.5, 844×390 touch and 640×400 fine): a focused chip whose top
// sat 22px under the pill's bottom edge stayed there, its zero-height box
// already "visible"; without the margin the browser brought the chip down to
// the root's padding edge, 96px — the shell's 6rem, which stands 2px short of
// the pill's 6rem + 2px flow box (a shell trait older than this band).
//
// ── THE STRIP'S CLEARANCE — IN THE STYLESHEET, ON THE ROOT (G2, 2026-10-09;
// an inline write from this island until then). Where the strip is shown AND
// sticky, the root's `scroll-padding-top` is the chips' bottom edge when
// stuck — the pill's flow box, the 0.75rem of air and the chips' 2.75rem,
// `calc(6rem + 2px + 0.75rem + 2.75rem)`, 154px at the default root — spelled
// ON THE STRIP'S <ul> as two `:root:has(&)` rules:
// `[@media(min-height:30rem)]:not-pointer-fine:…`
// (every touch screen) and `[@media(min-height:30rem)]:max-[60rem]:…` (every
// window under the rail's gate) — exactly the complement of the rail's gate,
// gated by the stick's threshold. `:root:has()` keeps the rule to the one page
// that renders the strip, and the utilities layer outranks globals.css's base
// `html { scroll-padding-top: 6rem }`. WHY THE STYLESHEET — three findings,
// each measured by the G2 reviewers in Chromium and WebKit: (1) a page loaded
// with a `#fragment` jumps BEFORE hydration, with whatever padding the
// stylesheet has: with 96px there, every card landed at 136px, under the
// stuck chips' 154; the island's write then made the spy's
// stylesheet-landing check expect 194, so it never finished the jump, and a
// link to #prophylaxis MARKED „Estetică dentară" (5 to 6 of 11 deep links wrong
// at 820×1180); (2) the write read the <nav>'s computed `top`, which still
// held the disposed rail's travel offset for a render — WebKit wrote 2818px
// after a resize from a travelling rail, and it stuck; (3) without JavaScript
// every fragment jump landed under the strip. In the stylesheet the clearance
// is there before the first paint, needs no JavaScript and reads nothing.
// Every jump follows it: a card lands with its top 2.5rem (CategoryCard's
// floor) under the chips, a Tab-scrolled focusable anywhere on the page
// clears the strip (SC 2.4.11), and lib/scroll-spy's reading line — the
// middle of the CLEAR area — becomes (154 + innerHeight) / 2 on a phone. This
// island only tells the spy to RE-PLAN (`refresh()`) after a presentation flip
// or a size change: a window crossing 30rem of height changes the padding
// with no write of ours. The laptop numbers do not move: the rail's gate
// turns both rules off. The two rules spell the pill's flow box again, so
// THE SEVENTH COUPLED SPELLING stands three times in this file — the <nav>'s
// `top` and the two clearances (Header.tsx's THE MOUNT CONTRACT) — and the
// 0.75rem of air with it: the <ul>'s top padding, the <nav>'s negative margin
// and inside both clearances. A KEEP-IN-SYNC: tests/e2e/price-strip.spec.ts
// holds the stuck chips at 110px and the clearance at 154px, and
// PriceList.test.tsx the spellings.
//
// ── THE RAIL RUNS WHERE IT SHOWS. Both presentations are sticky, so the
// rail's 'bottom' and 'travel' would write a `top` that MOVES the strip — and
// a phone in landscape at a large text size makes the strip taller than the
// window's room, which is exactly when the store leaves 'fits'. So the
// watcher starts lib/sticky-rail only while the rail is shown and disposes it
// while the strip is; disposed, it publishes 'fits' — no attribute, no style.
//
// ── THE STRIP FOLLOWS THE CURRENT CHIP: lib/strip-follow (its header is the
// law — centred and clamped, on the chip's own --fade clock, never against a
// hand or a keyboard focus, never moving the page, and moving only when the
// current chip changes). The island builds the follower in a useState
// initializer, starts it and tells it every answer the spy gives from LAYOUT
// effects (the planner, 2026-10-09: "place before paint"): React runs them
// after the DOM is committed and before the browser paints, and follow()
// places synchronously — so the frame that first shows a chip marked current
// already shows the strip centred on it, never the mark at scrollLeft 0 with
// the jump a frame later. The spy itself still starts in a passive effect: its
// first answer re-renders this island synchronously (a store update), and the
// layout effect of THAT commit places the strip before its paint. ONE
// EXCEPTION, the follower's own (2026-10-10, its THE BROWSER'S FRAGMENT JUMP
// GOES FIRST): on a page opened with a `#fragment` — a deep link — it writes
// nothing until the document has loaded and drawn a frame, because in
// Chromium any scripted scroll before the browser's own jump to the fragment
// cancels that jump, and the deep-linked card was left up to 811px off its
// landing; there the strip shows its marked chip where it stands until then.
// lib/scroll-spy finishes the browser's jump when it has gone stale (its THE
// READING LINE).

/**
 * One entry: the fragment id it points at and its finished label (§8.1).
 * DERIVED from the band's contract rather than spelled a second time (§4's
 * "one definition" rule — PriceList.tsx re-exports CategoryCard's types for
 * the same reason): a rename or a widening on the band flows here or fails
 * here, loudly, instead of two declarations drifting apart. `import type` is
 * erased at compile time, so no server module enters this island's bundle and
 * no 'use client' boundary is crossed (G2 typescript, Fable, 2026-09-15).
 */
export type PriceMenuItem = Readonly<Pick<PriceCategoryProps, 'id' | 'name'>>;

export type PriceMenuProps = Readonly<{
  /** The menu's `id` — the <nav>'s public address (`#price-categories`),
   *  which the band owns as PRICE_MENU_ID and hands down so that the one
   *  spelling stays in the band's entry file. The title's id and the strip's
   *  (`#price-categories-strip`) are derived from it here. */
  id: string;
  /** The rail card's visible title (an <h2>) and, through `aria-labelledby`,
   *  the name of the navigation landmark in BOTH presentations — the strip
   *  shows no title and keeps the name. Finished, already-translated text
   *  (§8.1): „Categorii", "Kategorien". */
  title: string;
  /** The categories, in the order the cards appear — the same array the band
   *  prints as cards, so an entry without a card is impossible by
   *  construction. At least one — a menu with nothing to point at has no
   *  current item, and createScrollSpy refuses an empty list out loud. The
   *  band is what keeps that promise: PriceList returns null before it reaches
   *  this component (its AN EMPTY TARIFF paragraph), because a guard here
   *  would have to sit above every hook this component calls. */
  items: readonly PriceMenuItem[];
}>;

/** A click that navigates THIS tab: the primary button, no modifier held. */
function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/** THE KEYBOARD'S STAMP (the header's THE RING IS THE KEYBOARD'S). */
type ArrivalStamp = Readonly<{
  /** Stamp the card `id` names — taking the stamp off any other card first —
   *  until focus leaves that card for something else in the page. A card that
   *  is not on the page is skipped, as the spy's walk skips it (THE SPY'S OWN
   *  IDIOM). */
  stamp(id: string): void;
  /** Take the stamp off wherever it is, and its blur listener with it. */
  lift(): void;
}>;

/**
 * One stamp holder per island, its whole state in this closure — no module
 * state, so two islands (or a remount) never share a stamp. `lift` and
 * `onBlur` are each ONE function for the holder's whole life, which is what
 * lets the blur listener be removed again by a pointer click, by a second
 * stamp or by the island leaving.
 */
function createArrivalStamp(): ArrivalStamp {
  let stamped: HTMLElement | null = null;

  function lift(): void {
    if (stamped === null) return;
    stamped.removeEventListener('blur', onBlur);
    stamped.removeAttribute(ARRIVAL_ATTRIBUTE);
    stamped = null;
  }

  /**
   * A blur takes the stamp off only when focus has LEFT the card for
   * something else in the page. A window, a tab or the address bar taking the
   * focus also delivers `blur` to the card, yet the card stays the document's
   * active element, and `:focus-visible` on the visitor's return — so it must
   * keep its ring (SC 2.4.7). The discriminator is the reviewers' measurement
   * (G2 a11y F1 + typescript M1, Chromium 151 and WebKit 26.5): inside every
   * blur that moves focus in the page — script, a press on a button or on
   * plain words, Tab — `document.activeElement` is the <body>, never the
   * element being left; inside a window's blur it is still the card. Hence no
   * `once`: a window's blur keeps the listener for the real one after it.
   */
  function onBlur(): void {
    if (document.activeElement === stamped) return;
    lift();
  }

  function stamp(id: string): void {
    lift();
    const card = document.getElementById(id);
    if (card === null) return;
    card.setAttribute(ARRIVAL_ATTRIBUTE, ARRIVAL_BY_KEYBOARD);
    // Not focused yet: the click runs BEFORE the browser's jump focuses the
    // card, so this waits for the blur that ENDS that focus.
    card.addEventListener('blur', onBlur);
    stamped = card;
  }

  return { stamp, lift };
}

/**
 * THE <nav> — THE STICKY ELEMENT OF BOTH PRESENTATIONS (the header's THE TWO
 * PRESENTATIONS and THE STRIP'S GEOMETRY). Its base is the STRIP's: stuck
 * under the header pill on the z-20 seat — only from 30rem of window height
 * and in an engine with `:has()`,
 * `[@media(min-height:30rem)]:supports-[selector(:has(*))]:sticky` (STICKY
 * UNDER THE HEADER PILL, FROM 30rem) — at the pill's flow box,
 * `top-[calc(6rem+2px)]`, the SEVENTH coupled spelling of the pill's reach,
 * so its box begins where the stuck pill ends (THE STRIP FLOATS UNDER THE
 * BAR); `-mt-[0.75rem]` cancels, at rest, the strip's top padding of the same
 * 0.75rem — the air between the pill and the chips — and `-mb-8` draws the
 * <nav> back over the glow room under the chips; `min-w-0` keeps the nowrap
 * row from blowing the band's single grid track out. The RAIL branch,
 * `pointer-fine:min-[60rem]:`, restores the side menu exactly: sticky at every
 * height, the 8.5rem line (the FIFTH coupled spelling), no z-index, no
 * margins, the card's own 6px corner for the focus ring a jump to
 * `#price-categories` draws round the <nav>, and the one rule
 * lib/sticky-rail's 'travel' needs. `scroll-mt-[2.5rem]` is the air a jump to
 * the menu's own id leaves above it, in both. One whole static string per
 * class: Tailwind reads class names from source.
 */
const NAV =
  'min-w-0 scroll-mt-[2.5rem] [@media(min-height:30rem)]:supports-[selector(:has(*))]:sticky top-[calc(6rem+2px)] z-20 ' +
  '-mt-[0.75rem] -mb-8 ' +
  'pointer-fine:min-[60rem]:sticky pointer-fine:min-[60rem]:top-[8.5rem] pointer-fine:min-[60rem]:z-auto ' +
  'pointer-fine:min-[60rem]:mt-0 pointer-fine:min-[60rem]:mb-0 pointer-fine:min-[60rem]:rounded-md ' +
  'pointer-fine:min-[60rem]:data-[rail=travel]:relative';

/** THE RAIL'S BOX — the side menu's card, displayed at the rail's gate only. */
const RAIL = 'hidden pointer-fine:min-[60rem]:block';

/**
 * THE STRIP — every class argued in the header's THE STRIP'S GEOMETRY and THE
 * STRIP'S CLEARANCE: the row, hidden at the rail's gate; the 0.75rem of air
 * between the header pill and the chips as its top padding, `pt-[0.75rem]`
 * (THE STRIP FLOATS UNDER THE BAR: no ground, no fade — it paints nothing of
 * its own, only its chips do), and `pb-8` under the chips, the room their
 * glow needs; the ReviewsDeck stage's full-bleed margins with the same
 * expression back as START padding, the trailing gutter as a real `::after`
 * box (THE TRAILING GUTTER IS A REAL BOX), and the scroll padding in `cqw`;
 * the scrollbar HIDDEN, `[scrollbar-width:none]` with
 * `[&::-webkit-scrollbar]:hidden` for the engines before it (THE ROW); and
 * the ROOT's scroll padding — the chips' bottom edge, the pill's flow box +
 * 0.75rem + 2.75rem — as two `:root:has(&)` rules, exactly where the strip is
 * shown AND sticky.
 */
const STRIP =
  'flex items-center gap-3 overflow-x-auto overscroll-x-contain pointer-fine:min-[60rem]:hidden ' +
  'pt-[0.75rem] pb-8 ' +
  'mx-[calc(50%_-_50vw)] ps-[calc(50vw_-_50%)] scroll-px-[calc(50vw_-_50cqw)] ' +
  "after:flex-none after:w-[calc(100vw_-_100%_-_var(--spacing)*3)] after:content-[''] " +
  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
  '[@media(min-height:30rem)]:not-pointer-fine:[:root:has(&)]:[scroll-padding-top:calc(6rem+2px+0.75rem+2.75rem)] ' +
  '[@media(min-height:30rem)]:max-[60rem]:[:root:has(&)]:[scroll-padding-top:calc(6rem+2px+0.75rem+2.75rem)]';

/** THE CHIPS' FOCUS MARGIN (the header): minus ui/PillButton's `min-h-11`, so
 *  a keyboard focus on the STUCK strip never scrolls the page — gated exactly
 *  like the stick: from 30rem of window height, in an engine with `:has()`. */
const CHIP =
  '[@media(min-height:30rem)]:supports-[selector(:has(*))]:scroll-mt-[-2.75rem]';

/** What the presentation watcher measures and drives: the two boxes whose
 *  display says which presentation is shown, and the two stores whose lives
 *  depend on it. */
type Presentation = Readonly<{
  railBox: HTMLElement;
  strip: HTMLElement;
  rail: StickyRail;
  spy: ScrollSpy;
}>;

/**
 * THE RAIL RUNS WHERE IT SHOWS, and THE SPY RE-PLANS (the header), as one
 * watcher — its whole state in this closure, like createArrivalStamp's. The
 * strip is SHOWN when it has a box and the rail's box has none (in real CSS
 * exactly one of the two has a box; with no stylesheet, as in the band's
 * class-contract suite, both do, and the rail — the presentation the band has
 * always tested — is the answer). Shown: the rail's store is disposed; hidden:
 * it runs. Either way, after every presentation flip or size change the spy
 * re-plans (`refresh()`) against the root's `scroll-padding-top` as the
 * stylesheet now has it — THE STRIP'S CLEARANCE is CSS, and a window crossing
 * 30rem of height changes it with no write of ours. It writes NOTHING itself.
 * Re-synced by a ResizeObserver on both boxes — a presentation flip changes
 * both sizes — and by the window's resize.
 * @returns the clean-up: the observer, the listener and the rail.
 */
function watchPresentation({
  railBox,
  strip,
  rail,
  spy,
}: Presentation): () => void {
  function sync(): void {
    const stripShown =
      strip.getClientRects().length > 0 &&
      railBox.getClientRects().length === 0;
    if (stripShown) rail.dispose();
    else rail.start();
    spy.refresh();
  }

  // ONE FRAME LATER, NEVER INSIDE THE OBSERVER (measured in the class-contract
  // suite: "ResizeObserver loop completed with undelivered notifications").
  // A re-sync can START the rail's store, whose own ResizeObserver then
  // observes the <nav> — an element SHALLOWER than the rail's box this
  // observer has just delivered — and a new observation that shallow, made
  // during delivery, is exactly what the browser reports as a loop. So the
  // observer and the resize only schedule, coalesced through
  // requestAnimationFrame (lib/sticky-rail's own EVENTS idiom), and the
  // re-sync runs at the next frame, outside every delivery.
  let frame: number | undefined;
  function schedule(): void {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      sync();
    });
  }

  const observer = new ResizeObserver(schedule);
  observer.observe(strip);
  observer.observe(railBox);
  window.addEventListener('resize', schedule);
  sync();

  return () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    observer.disconnect();
    window.removeEventListener('resize', schedule);
    rail.dispose();
  };
}

export function PriceMenu({ id, title, items }: PriceMenuProps): ReactElement {
  const titleId = `${id}-title`;
  const stripId = `${id}-strip`;
  // The strip is a HORIZONTAL SCROLLER inside the page (lib/scroll-spy's
  // option of that name): a sideways wheel or swipe on it scrolls the strip,
  // never the page, so it never drops a click's pin.
  const [spy] = useState(() =>
    createScrollSpy({
      ids: items.map((item) => item.id),
      line: 'reading',
      horizontalScrollers: [stripId],
    }),
  );
  const [rail] = useState(() => createStickyRail({ id }));
  const [follower] = useState(() => createStripFollow({ id: stripId }));
  // THE RING IS THE KEYBOARD'S (the header): the holder is made when the
  // island mounts and lifted when it leaves — Strict Mode's rehearsal
  // included — and only the click reads it.
  const arrival = useRef<ArrivalStamp | null>(null);
  // The presentation watcher's two boxes (the consumption idiom's one ref use).
  const railBoxRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  const { current } = useSyncExternalStore(
    spy.subscribe,
    spy.getSnapshot,
    spy.getServerSnapshot,
  );
  const { mode, topPx } = useSyncExternalStore(
    rail.subscribe,
    rail.getSnapshot,
    rail.getServerSnapshot,
  );

  // THE RAIL RUNS WHERE IT SHOWS, and THE SPY RE-PLANS after a presentation
  // flip or a size change. THE STRIP'S CLEARANCE needs no effect at all: it
  // is the stylesheet's, in place before the first paint and without
  // JavaScript.
  useEffect(() => {
    const railBox = railBoxRef.current;
    const strip = stripRef.current;
    if (railBox === null || strip === null) return;
    return watchPresentation({ railBox, strip, rail, spy });
  }, [rail, spy]);

  useEffect(() => {
    spy.start();
    return () => spy.dispose();
  }, [spy]);

  // THE STRIP FOLLOWS THE CURRENT CHIP (the header): from LAYOUT effects, so a
  // placement lands before the paint that shows its mark; started before it
  // is first told — layout effects run in the order they are declared, and
  // every one of them before any passive effect.
  useLayoutEffect(() => {
    follower.start();
    return () => follower.dispose();
  }, [follower]);

  useLayoutEffect(() => {
    follower.follow(current);
  }, [follower, current]);

  useEffect(() => {
    const stamps = createArrivalStamp();
    arrival.current = stamps;
    return () => {
      stamps.lift();
      arrival.current = null;
    };
  }, []);

  // THE MARK ON THE CARD — the header's THE CARD THE VISITOR IS AT. The
  // element is held in the closure, so the cleanup takes the mark off the
  // SAME node it was put on even if that node has since left the document.
  useEffect(() => {
    if (current === null) return;
    const card = document.getElementById(current);
    if (card === null) return;
    card.setAttribute(CARD_CURRENT_ATTRIBUTE, '');
    return () => {
      card.removeAttribute(CARD_CURRENT_ATTRIBUTE);
    };
  }, [current]);

  /** ONE click logic for both lists — the rail's links and the strip's chips
   *  (ONLY A PLAIN LEFT CLICK PINS, THE RING IS THE KEYBOARD'S). */
  function onItemClick(
    event: MouseEvent<HTMLAnchorElement>,
    itemId: string,
  ): void {
    if (!isPlainLeftClick(event)) return;
    spy.select(itemId);
    // THE RING IS THE KEYBOARD'S: `detail` is the click count — 0 when the
    // keyboard made the click.
    if (event.detail === 0) {
      arrival.current?.stamp(itemId);
    } else {
      arrival.current?.lift();
    }
  }

  return (
    /* The <nav> landmark: the sticky element of BOTH presentations, named by
       its <h2> in both (THE TWO PRESENTATIONS). The rail's mode lands on it
       as `data-rail` and its number as an inline `top` (WHAT THE RAIL WRITES)
       — only while the rail is shown, the store being disposed elsewhere.
       `tabIndex={-1}` + `scroll-mt-[2.5rem]`: the id is a public address — the
       URL bar, a link from another page — so arriving at it gets the treatment
       a card's arrival gets (CategoryCard.tsx, THE CARD IS THE TARGET): real
       focus, hence an announcement by name, and the 2.5rem of air that puts
       its top edge on the stuck menu's own line (G2 a11y M1) — the
       stylesheet's value, because the menu is not one of the spy's targets
       and nothing writes over it. A focus the KEYBOARD made there is answered
       by the rail, which pins 'top' so the visitor arrives at the title; a
       pointer's is not (lib/sticky-rail's ONLY THE KEYBOARD'S FOCUS IS
       ANSWERED) — the jump's own scrolling carries the menu to its line. */
    <nav
      id={id}
      aria-labelledby={titleId}
      tabIndex={-1}
      data-rail={mode === 'fits' ? undefined : mode}
      style={
        mode === 'bottom' || mode === 'travel'
          ? { top: `${topPx}px` }
          : undefined
      }
      className={NAV}
    >
      {/* THE RAIL — the side menu's card, unchanged in look: ui/Card's
          surface and glow on its own box (no longer `asChild` onto the
          <nav>, which is now the sticky element of both presentations), its
          `@container` the box the title's step answers to.
          THE HOUSE CORNER STAYS (owner 2026-10-01, §15.29): the soft 1rem
          corner was put on this card and on every category card on his
          "apply to all cards on services page too", and taken off the same
          evening on his "i liked card from before better for services. it
          looked perfect." — taste, recorded; `corners="soft"` is one word away
          on both call sites. */}
      <div ref={railBoxRef} className={RAIL}>
        <Card aura>
          {/* ui/Heading's `band` step on a REAL <h2> — the step every page <h2>
              wears (D48, over D46's hour-long `page`), the category card
              titles included through sections/SectionHeading, which is the
              owner's 2026-09-14 decision in one word: „Categorii" is the TITLE
              of this navigation, an honest sibling of the card titles beside
              it, not the first of its own items. Beside them it reads one step
              under, 30px to their 36px — 30 to 36 design pixels inside the
              band scale — because the step answers to this card's own
              container, the menu's track at its floor (THE TITLE'S STEP IS
              `band`, in the header, has the measurements). A visible title and
              an outline entry are two independent decisions, which is what
              `asChild` exists for; the id closes the landmark's
              aria-labelledby pair — in BOTH presentations, though the strip
              shows no title — and the rule that separates the title from the
              list rides the <ul> below. */}
          <Heading asChild size="band">
            <h2 id={titleId}>{title}</h2>
          </Heading>
          {/* A list, because it IS one: a screen reader announces "list, N
              items" and offers item-by-item navigation. No `role="list"`
              needed — WebKit only drops list semantics from an unstyled-marker
              list OUTSIDE a <nav> (the eslint config's
              jsx-a11y/list-role-for-webkit note), and this one is inside.
              `items-start` so each link hugs its own label instead of
              stretching to the card's width.
              THE RULE ABOVE IT is what makes the card's <h2> read as the TITLE
              of this navigation rather than as its first item (owner,
              2026-09-14): the title wears the category cards' own `band` step
              (D48) — one step under them beside them — so the border and the
              matching `mt-4`/`pt-4` are what separate the two. */}
          <ul className="mt-4 flex flex-col items-start gap-1 border-t border-line-subtle pt-4">
            {items.map((item) => {
              const isCurrent = current === item.id;
              return (
                <li key={item.id}>
                  <TextButton
                    asChild
                    active={isCurrent}
                    aria-current={isCurrent ? 'location' : undefined}
                    className="-ml-2"
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={(event) => onItemClick(event, item.id)}
                    >
                      {item.name}
                    </a>
                  </TextButton>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      {/* THE STRIP — the same links as chips, in a row that scrolls sideways
          (THE STRIP'S GEOMETRY), the current one filled; a list for the
          rail's reason, inside the <nav>. lib/strip-follow finds it by its id
          and each chip by its link's `href`. */}
      <ul ref={stripRef} id={stripId} className={STRIP}>
        {items.map((item) => {
          const isCurrent = current === item.id;
          return (
            <li key={item.id}>
              <PillButton
                asChild
                active={isCurrent}
                aria-current={isCurrent ? 'location' : undefined}
                className={CHIP}
              >
                <a
                  href={`#${item.id}`}
                  onClick={(event) => onItemClick(event, item.id)}
                >
                  {item.name}
                </a>
              </PillButton>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
