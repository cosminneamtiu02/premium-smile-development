'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { Card, CARD_CURRENT_ATTRIBUTE } from '@/components/ui/Card/Card';
import { Heading } from '@/components/ui/Heading/Heading';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import { createScrollSpy } from '@/lib/scroll-spy/scroll-spy';
import { createStickyRail } from '@/lib/sticky-rail/sticky-rail';
import { ARRIVAL_ATTRIBUTE, ARRIVAL_BY_KEYBOARD } from './arrival';
import type { PriceCategoryProps } from './CategoryCard';

// sections/PriceList/PriceMenu — THE ISLAND: the jump menu's card — the
// sticky <nav> landmark, its <h2> title and its list of links — and the only
// JavaScript this band ships. Built on the owner's pack round (2026-09-14):
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
//     paints nothing (the base `@3xl:sticky @3xl:top-34` IS the top pin);
//   · `@3xl:data-[rail=travel]:relative` is the one rule the stylesheet gains,
//     and it wears the SAME container-query gate as the base sticky — so
//     below the step, where the menu is a stacked table of contents, the mode
//     can name 'travel' and the layout does not move. That gate is why the
//     position rides a class rather than the style prop: an inline `position:
//     relative` would follow the attribute below the step too — a tablet
//     rotated mid-travel would show the menu displaced over its own cards;
//   · `style={{ top }}` is the number, for 'bottom' (negative: the pin by the
//     bottom edge) and 'travel' (the frozen in-flow offset). On a static
//     element `top` is inert, which is the same gate again.
// The rail reads the 8.5rem line back from the computed `top` rather than
// being told it — the FIFTH coupled spelling of the pill's reach stays the
// fifth (Header.tsx's "THE MOUNT CONTRACT", PriceList.tsx's `@3xl:top-34`
// paragraph) and this file spells no number of its own.
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
// the menu card itself (ui/Card's `@container`, landed on the <nav>) — not
// the band's column. Beside the cards that card is the 15rem track
// (PriceList.tsx's `minmax(15rem,1fr) 4fr` paragraph): 190px of content
// inside ui/Card's 25px sides, so „Categorii" reads 30px while every category
// card — its own container, four shares of the row — reads 36px. By the
// band's own arithmetic at the named widths (ui/Container's 10vw gutters, the
// grid's gap-8; the stories' expectHeadingOutline reads each title back from
// real CSS against its own container):
//
//     viewport   arrangement   menu content   card content   menu / cards
//          390   stacked              262px          262px     30 / 30
//          768   stacked              564px          564px     36 / 36
//         1280   beside               190px          702px     30 / 36
//         1536   beside               190px          907px     30 / 36
//         1920   beside               251px         1153px     30 / 36
//
// (Read back in the Storybook test browser, whose classic scrollbar takes
// 15px off the column, 2026-09-26: 247/247px → 30/30 at 390, 190/892px →
// 30/36 at 1536, 190/623px → 30/36 on its 1200px default canvas — the 15rem
// floor holds the menu at 190px beside the cards up to a ~1540px viewport,
// where its 1fr share takes over.)
//
// So "one step under" holds wherever the menu sits BESIDE the cards — from
// the split to a ~2922px viewport, where the 1fr share would finally carry
// the card past 28rem — bar a 2.5px sliver at the split itself (a 960px
// viewport), where the cards' track is still under 498px and both read 30px.
// STACKED, the menu spans the same column as the cards and wears the SAME
// step: 30/30 on a phone, 36/36 from a ~622px viewport. That is the honest
// reading of a 15rem track, not a size of this file's own (§6.6): the title
// is still a sibling of the card titles — the owner's 2026-09-14 decision, a
// TITLE and not the first item — and the rule over the <ul> is what separates
// it from its links at either step.
//
// ── THE CONSUMPTION IDIOM IS lib/rotation's RECIPE, COPIED — twice now, once
// per store (ReviewsDeck was its first witness; the two stores here are
// different, the three lines around each are the same):
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
//     own idiom — which is why no ref appears in this file.
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
// `scroll-mt-10`, the FLOOR.
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
//     repeats it for the eye. STACKED — every phone — the menu has scrolled
//     away and the glow is the only mark on screen; that is acceptable
//     because the card in view IS the current one, and its own heading
//     names it.
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
// sugar, which spells `page`. The two are different claims: `page` says "this
// link points at the document you are reading" (the Header's nav item for
// /ro/services), `location` says "this is where you are WITHIN the page",
// which is exactly what a table of contents marks. The atom documents the
// precedence this relies on: "an explicitly passed aria-current still wins".
// `active` still rides along for the LOOK — the atom's own rest-state variant,
// the label in cta-hover green with the underline drawn at full width and no
// animation to wait for, which is the hover END state the owner asked the
// current item to wear. Colour is never the only signal (§9, SC 1.4.1): the
// attribute is the announcement, the underline is the shape.
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
  /** The card's `id` — its public address (`#price-categories`), which the
   *  band owns as PRICE_MENU_ID and hands down so that the one spelling stays
   *  in the band's entry file. The title's id is derived from it here. */
  id: string;
  /** The card's visible title (an <h2>) and, through `aria-labelledby`, the
   *  name of the navigation landmark. Finished, already-translated text
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

export function PriceMenu({ id, title, items }: PriceMenuProps): ReactElement {
  const titleId = `${id}-title`;
  const [spy] = useState(() =>
    createScrollSpy({ ids: items.map((item) => item.id), line: 'reading' }),
  );
  const [rail] = useState(() => createStickyRail({ id }));
  // THE RING IS THE KEYBOARD'S (the header): the holder is made when the
  // island mounts and lifted when it leaves — Strict Mode's rehearsal
  // included — and only the click reads it.
  const arrival = useRef<ArrivalStamp | null>(null);
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

  useEffect(() => {
    spy.start();
    return () => spy.dispose();
  }, [spy]);

  useEffect(() => {
    rail.start();
    return () => rail.dispose();
  }, [rail]);

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

  return (
    <Card asChild aura>
      {/* The <nav> IS the card (ui/slot.ts): the surface lands on the
          landmark itself, so a screen reader can jump to it by role and hears
          its visible title as the name. Sticky and its 8.5rem offset ride
          here through className, which ui/slot.ts merges LAST — placement
          only (§6.8), never a restyle of the atom's paint — and so does the
          one rule the rail's 'travel' mode needs (WHAT THE RAIL WRITES, in
          the header). `tabIndex={-1}` + `scroll-mt-10`: the id is a public
          address — the URL bar, a link from another page — so arriving at it
          gets the treatment a card's arrival gets (CategoryCard.tsx, THE CARD
          IS THE TARGET): real focus, hence an announcement by name, and the
          2.5rem of air that puts its top edge on the stuck menu's own line
          (G2 a11y M1) — the stylesheet's value, because the menu is not one
          of the spy's targets and nothing writes over it. A focus the
          KEYBOARD made there is answered by the rail, which pins 'top' so the
          visitor arrives at the title; a pointer's is not (lib/sticky-rail's
          ONLY THE KEYBOARD'S FOCUS IS ANSWERED) — the jump's own scrolling
          carries the menu to its line. */}
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
        className="scroll-mt-10 @3xl:sticky @3xl:top-34 @3xl:data-[rail=travel]:relative"
      >
        {/* ui/Heading's `band` step on a REAL <h2> — the step every page <h2>
            wears (D48, over D46's hour-long `page`), the category card titles
            included through sections/SectionHeading, which is the owner's
            2026-09-14 decision in one word: „Categorii" is the TITLE of this
            navigation, an honest sibling of the card titles beside it, not
            the first of its own items. Beside them it reads one step under,
            30px to their 36px, because the step answers to this card's own
            15rem container (THE TITLE'S STEP IS `band`, in the header, has
            the measurements). A visible title and an outline entry are two
            independent decisions, which is what `asChild` exists for; the id
            closes the landmark's aria-labelledby pair, and the rule that
            separates the title from the list rides the <ul> below. */}
        <Heading asChild size="band">
          <h2 id={titleId}>{title}</h2>
        </Heading>
        {/* A list, because it IS one: a screen reader announces "list, N
            items" and offers item-by-item navigation. No `role="list"` needed
            — WebKit only drops list semantics from an unstyled-marker list
            OUTSIDE a <nav> (the eslint config's jsx-a11y/list-role-for-webkit
            note), and this one is inside. `items-start` so each link hugs its
            own label instead of stretching to the card's width.
            THE RULE ABOVE IT is what makes the card's <h2> read as the TITLE
            of this navigation rather than as its first item (owner,
            2026-09-14): the title wears the category cards' own `band` step
            (D48) — the same size wherever the menu stacks above them, one
            step under wherever it sits beside them — so the border and the
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
                    onClick={(event) => {
                      if (!isPlainLeftClick(event)) return;
                      spy.select(item.id);
                      // THE RING IS THE KEYBOARD'S: `detail` is the click
                      // count — 0 when the keyboard made the click.
                      if (event.detail === 0) {
                        arrival.current?.stamp(item.id);
                      } else {
                        arrival.current?.lift();
                      }
                    }}
                  >
                    {item.name}
                  </a>
                </TextButton>
              </li>
            );
          })}
        </ul>
      </nav>
    </Card>
  );
}
